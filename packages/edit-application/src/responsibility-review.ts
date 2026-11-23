import { createId, DomainError } from "@videocut/domain";
import type { EditorialReviewFinding, EditorialReviewPass, ProjectSnapshot, ResponsibilityReview, SkillExecutionReport } from "@videocut/contracts";
import { missingReviewRanges } from "../../quality-system/src/editorial-review.js";
import { responsibilityAssignmentRanges, responsibilityDecisionRanges } from "./production-coordination.js";

/** 校验职责结论和当前分派、实际决定及观察范围的对应关系。 */
export function validateResponsibilityReviews(input: {
  report?: SkillExecutionReport; snapshot: ProjectSnapshot; reviews?: ResponsibilityReview[];
  startFrame: number; endFrame: number; method: string; findings: EditorialReviewFinding[]; captionTextOnly: boolean;
}): void {
  for (const review of input.reviews ?? []) {
    const report = input.report;
    const assignment = report?.assignments.find(item => item.assignmentId === review.assignmentId);
    const range = { startFrame: input.startFrame, endFrame: input.endFrame };
    if (!report || !assignment || !review.observation.trim() || !review.decisionIds.length
      || !["confirmed", "issue", "inconclusive"].includes(review.outcome)
      || review.outcome === "issue" && !review.impact?.trim()
      || missingReviewRanges(responsibilityAssignmentRanges(input.snapshot, report, assignment, review.responsibility), range.startFrame, range.endFrame).length) {
      throw new DomainError("职责复核需要有效负责人、实际观察、结论和覆盖范围；发现问题时须说明影响", "RESPONSIBILITY_REVIEW_INVALID");
    }
    const decisions = review.decisionIds.map(id => report.creativeDecisions.find(item => item.id === id && item.phase === review.responsibility));
    if (decisions.some(item => !item || item.researchOutcome === "pending")
      || missingReviewRanges(decisions.flatMap(item => item ? responsibilityDecisionRanges(input.snapshot, report, item) : []), range.startFrame, range.endFrame).length) {
      throw new DomainError("职责复核引用的本次判断未覆盖观察范围", "RESPONSIBILITY_REVIEW_DECISION_INVALID");
    }
    const hasPicture = input.snapshot.timeline.items.some(item => item.startFrame < range.endFrame && item.endFrame > range.startFrame
      && input.snapshot.timeline.tracks.some(track => track.id === item.trackId && track.kind === "video" && !track.muted))
      || input.snapshot.effectCues.some(item => item.startFrame < range.endFrame && item.endFrame > range.startFrame)
      || input.snapshot.timeline.captions.some(item => item.startFrame < range.endFrame && item.endFrame > range.startFrame);
    if (hasPicture && review.responsibility === "motion_research" && review.outcome !== "inconclusive"
      && !["continuous_video", "audiovisual"].includes(input.method) && !(input.method === "frames" && input.captionTextOnly)) {
      throw new DomainError("运动过程复核需要连续观察", "RESPONSIBILITY_REVIEW_METHOD_INVALID");
    }
    if (hasPicture && review.outcome !== "inconclusive" && !["frames", "continuous_video", "audiovisual"].includes(input.method)) {
      throw new DomainError("画面职责复核需要观察实际画面", "RESPONSIBILITY_REVIEW_METHOD_INVALID");
    }
    if (review.findingId) {
      const finding = input.findings.find(item => item.id === review.findingId);
      if (!finding?.responsibilityReview || finding.responsibilityReview.responsibility !== review.responsibility) {
        throw new DomainError("职责复查须引用同一职责的待修问题", "RESPONSIBILITY_REVIEW_FINDING_INVALID");
      }
    }
  }
}

export function responsibilityReviewFindings(input: {
  reviews?: ResponsibilityReview[]; evidenceId: string; revision: number; pass: EditorialReviewPass;
  startFrame: number; endFrame: number; recordedAt: string; objectId?: string; captionTextOnly?: boolean;
}): EditorialReviewFinding[] {
  return (input.reviews ?? []).filter(item => item.outcome === "issue" && !item.findingId).map(item => ({
    id: createId("editorial_finding"), revision: input.revision, recordedAt: input.recordedAt,
    pass: input.pass, severity: "major", category: item.responsibility === "motion_research" ? "motion"
      : input.captionTextOnly ? item.responsibility === "visual_design" ? "typography" : "semantic" : "attention",
    summary: item.observation.trim(), evidence: item.observation.trim(), impact: item.impact!.trim(),
    frameRange: { startFrame: input.startFrame, endFrame: input.endFrame }, objectId: input.objectId,
    responsibilityReview: structuredClone(item), responsibilityEvidenceId: input.evidenceId
  }));
}
