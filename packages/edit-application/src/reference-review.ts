import { createId, DomainError } from "@videocut/domain";
import type { EditorialReviewFinding, EditorialReviewPass, ReferenceReviewRef } from "@videocut/contracts";

/** 采用版本可变化；复查仍须针对同一参考、原片范围和本片角色。 */
export function sameReferenceReview(first: ReferenceReviewRef, second: ReferenceReviewRef): boolean {
  return first.sceneId === second.sceneId && first.referenceKind === second.referenceKind && first.referenceId === second.referenceId
    && first.sourceSha256 === second.sourceSha256 && first.targetRole === second.targetRole
    && first.startMs === second.startMs && first.endMs === second.endMs;
}

export function validateReferenceReviews(references: ReferenceReviewRef[], openFindings: EditorialReviewFinding[]): void {
  for (const reference of references) {
    if (!reference.originalRelation?.trim() || !reference.actualImplementation?.trim() || !reference.difference?.trim()
      || !reference.outcome || !["confirmed", "issue", "inconclusive"].includes(reference.outcome)
      || reference.outcome === "issue" && !reference.impact?.trim()) {
      throw new DomainError("参考对照需要原片关系、本片实现、差异和明确结论；需要修复时填写影响", "REFERENCE_REVIEW_DETAILS_REQUIRED");
    }
    if (reference.findingId) {
      const finding = openFindings.find(item => item.id === reference.findingId);
      if (!finding?.referenceReview || !sameReferenceReview(finding.referenceReview, reference)) {
        throw new DomainError("参考复查必须引用同一参考的待修问题", "REFERENCE_REVIEW_FINDING_INVALID");
      }
    }
  }
}

/** 一次真实观察直接生成对应必修项；对原问题的复查不重复创建。 */
export function referenceReviewFindings(input: {
  references?: ReferenceReviewRef[]; evidenceId: string; revision: number; pass: EditorialReviewPass;
  startFrame: number; endFrame: number; observation: string; recordedAt: string;
}): EditorialReviewFinding[] {
  return (input.references ?? []).filter(reference => reference.outcome === "issue" && !reference.findingId).map(reference => ({
    id: createId("editorial_finding"), revision: input.revision, recordedAt: input.recordedAt,
    pass: input.pass, severity: "major", category: "motion", summary: reference.difference!.trim(),
    evidence: input.observation.trim(), impact: reference.impact!.trim(), objectId: reference.sceneId,
    frameRange: { startFrame: input.startFrame, endFrame: input.endFrame },
    referenceReview: structuredClone(reference), referenceEvidenceId: input.evidenceId
  }));
}
