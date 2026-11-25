import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import type { JobRecord, CreativeDecision, EditorialQualityReview, ProductionAssignment, ProductionCompletionScope, ProductionCoordinationIssue, ProjectSnapshot, SkillExecutionReport, VisualResponsibility, VisualTreatment } from "@videocut/contracts";
import { cueCoversBeat, hasVisualTreatmentImplementation, missingReviewRanges, openEditorialFindings } from "../../quality-system/src/editorial-review.js";
import { compileVisualComposition, effectBeatRanges, rangesOverlap, resolveCompositionReachability } from "@videocut/domain";
import type { MotionAuthoringInput } from "../../contracts/src/motion-authoring.js";
import { frozenWorkForDelivery, motionHandoffDependencyHash } from "./motion-adoption.js";
import { sameVisualDelivery, visualDesignCovers } from "./visual-design-revisions.js";
import { productionObservationRanges } from "./editorial-evidence.js";
import type { ReferenceManifest, ReferenceScene } from "./opendesign-reference-package.mjs";
import { sameReferenceReview } from "./reference-review.js";
import { editorialResolutionRange } from "./editorial-range.js";
import { requiresVisualReferenceUnits, unitHandoffDeliveryIssues } from "./production-unit-handoff.js";

type Scene = ProjectSnapshot["scenes"][number];

/** 实拍事件主导的新片使用实际剪辑判断；明确视觉重做仍走完整视觉设计。 */
export function requiresFullVisualCoordination(report: SkillExecutionReport, snapshot: ProjectSnapshot): boolean {
  return report.intent === "visual_rework" || report.intent === "full_creation" && snapshot.project.profile !== "vlog";
}

/** 正式作品按制作回执、当前采用与实际可见帧共同核对。OD 项目号来自委托。 */
export function fullCreationMotionIssues(report: SkillExecutionReport, snapshot: ProjectSnapshot,
  scope: ProductionCompletionScope, jobs: JobRecord[], verifyInputs?: (cue: ProjectSnapshot["effectCues"][number]) => void): ProductionCoordinationIssue[] {
  if (!requiresVisualReferenceUnits(report, snapshot)) return [];
  const active = resolveCompositionReachability(snapshot);
  const commissions = jobs.flatMap(job => {
    if (job.kind !== "motion_authoring") return [];
    const request = job.payload.input as MotionAuthoringInput;
    return request.productionRunId === report.id ? [{ job, project: request.openDesignRequest.project }] : [];
  });
  const scenes = snapshot.scenes.filter(scene => coversScene(snapshot, scope, scene)
    || snapshot.visualTreatments.some(treatment => (treatment.sceneId === scene.id
      || !treatment.sceneId && !!treatment.narrativeBeatId && scene.narrativeBeatIds.includes(treatment.narrativeBeatId))
      && coversScene(snapshot, scope, scene, treatment)));
  const finalized = commissions.flatMap(({ job, project }) => {
    const authoring = job.result?.authoring as { status?: string; receipts?: Array<Record<string, unknown>> } | undefined;
    return job.status === "succeeded" && authoring?.status === "succeeded" ? [{ project, receipts: authoring.receipts ?? [] }] : [];
  });
  const cues = snapshot.effectCues.filter(cue => {
    if (!scenes.some(scene => scene.id === cue.sceneId) || !active.effectCueIds.has(cue.id)
      || !cue.authoringInputs?.some(input => input.adoptedDecisionRef.productionRunId === report.id)) return false;
    const frozen = frozenWorkForDelivery(snapshot, cue);
    if (!frozen) return false;
    const { work, author } = frozen;
    const confirmed = finalized.some(({ project, receipts }) => project === author.project
      && receipts.some(receipt => receipt.runId === author.run_id && receipt.frozenVersion === author.frozen_version
        && receipt.workId === work.id && receipt.definitionHash === work.definitionHash));
    if (!confirmed) return false;
    verifyInputs?.(cue);
    return true;
  });
  const mainScenes = scenes.filter(scene => scene.narrativeBeatIds.length);
  const ranges = productionScopeRanges(snapshot, scope);
  const issue = (code: string, message: string, sceneId?: string, range?: FrameRange): ProductionCoordinationIssue => ({
    code, message, scope: range ? { kind: "frames", ...range } : scope,
    state: "missing", relatedDecisionIds: [], relatedObjectIds: sceneId ? [sceneId] : [],
    nextAction: "沿本次制作委托和同版冻结稿接回作品，再核对项目中的实际范围"
  });
  if (!scenes.length) return [issue("OD_TARGET_MISSING", "本次完整新制没有可制作的场面")];
  if (!commissions.length) return [issue("OD_COMMISSION_MISSING", "本次完整新制缺少正式 OD 制作委托")];
  if (!finalized.some(entry => entry.receipts.length)) {
    return [issue("OD_FROZEN_WORK_MISSING", "本次 OD 制作委托尚未确认完成，或缺少冻结作品回执")];
  }
  return (mainScenes.length ? mainScenes : scenes).flatMap(scene => {
    const sceneRanges = intersectRanges([scene], ranges);
    return sceneRanges.flatMap(range => missingReviewRanges(cues.filter(cue => cue.sceneId === scene.id), range.startFrame, range.endFrame)
      .map(gap => issue("OD_COVERAGE_MISSING", `场面「${scene.title}」缺少已采用的同版 OD 冻结作品（${gap.startFrame}–${gap.endFrame} 帧）`, scene.id, gap)));
  });
}

export function normalizeProductionScope(scope: ProductionCompletionScope): ProductionCompletionScope {
  if (scope.kind === "beats") return { kind: "beats", beatIds: [...new Set(scope.beatIds)].sort() };
  if (scope.kind === "objects") return { kind: "objects", objectIds: [...new Set(scope.objectIds)].sort() };
  if (scope.kind === "frames") return { kind: "frames", startFrame: scope.startFrame, endFrame: scope.endFrame };
  return { kind: "project" };
}

function coversScene(snapshot: ProjectSnapshot, scope: ProductionCompletionScope, scene: Scene, treatment?: VisualTreatment): boolean {
  if (scope.kind === "project") return true;
  if (scope.kind === "frames") return rangesOverlap(scope, scene);
  if (scope.kind === "beats") return treatment?.narrativeBeatId ? scope.beatIds.includes(treatment.narrativeBeatId)
    : scene.narrativeBeatIds.some(id => scope.beatIds.includes(id));
  const selected = new Set(scope.objectIds);
  if (selected.has(scene.id) || !!treatment && (selected.has(treatment.id) || treatment.adoptedMaterialAssetIds?.some(id => selected.has(id)))
    || (treatment?.narrativeBeatId ? selected.has(treatment.narrativeBeatId) : scene.narrativeBeatIds.some(id => selected.has(id)))) return true;
  if (snapshot.effectCues.some(cue => selected.has(cue.id) && cue.sceneId === scene.id
    && (!treatment || !cue.authoringInputs?.length || cue.authoringInputs.some(input => input.visualTreatmentId === treatment.id)))) return true;
  if (snapshot.cutaways.some(cutaway => cutaway.hostSceneId === scene.id && (selected.has(cutaway.id) || selected.has(cutaway.timelineItemId) || selected.has(cutaway.assetId))
    && (!treatment || !cutaway.visualTreatmentId || cutaway.visualTreatmentId === treatment.id))) return true;
  return snapshot.timeline.items.some(item => item.sceneId === scene.id && (selected.has(item.id) || selected.has(item.assetId)));
}

export function assignmentCoversObjects(snapshot: ProjectSnapshot, scope: ProductionCompletionScope, objectIds: string[]): boolean {
  if (scope.kind === "project") return true;
  return objectIds.every(id => {
    if (scope.kind === "beats" && scope.beatIds.includes(id)) return true;
    if (scope.kind === "objects" && scope.objectIds.includes(id)) return true;
    if (scope.kind === "frames") {
      const ranges = productionObservationRanges(snapshot, { kind: "objects", objectIds: [id] });
      return ranges.length > 0 && ranges.every(range => range.startFrame >= scope.startFrame && range.endFrame <= scope.endFrame);
    }
    const treatment = snapshot.visualTreatments.find(item => item.id === id);
    const scene = snapshot.scenes.find(item => item.id === id || item.id === treatment?.sceneId
      || !!treatment?.narrativeBeatId && item.narrativeBeatIds.includes(treatment.narrativeBeatId));
    return !!scene && coversScene(snapshot, scope, scene, treatment);
  });
}

export function assignmentCoversScope(snapshot: ProjectSnapshot, parent: ProductionCompletionScope, child: ProductionCompletionScope): boolean {
  if (parent.kind === "project") return true;
  if (child.kind === "project") return false;
  if (child.kind === "frames") {
    const ranges = productionObservationRanges(snapshot, parent);
    return ranges.length > 0 && missingReviewRanges(ranges, child.startFrame, child.endFrame).length === 0;
  }
  if (parent.kind === "frames" && child.kind === "beats") {
    const ranges = productionObservationRanges(snapshot, child);
    return ranges.length > 0 && ranges.every(range => range.startFrame >= parent.startFrame && range.endFrame <= parent.endFrame);
  }
  return assignmentCoversObjects(snapshot, parent, child.kind === "beats" ? child.beatIds : child.objectIds);
}

export function assignmentScopesOverlap(snapshot: ProjectSnapshot, first: ProductionCompletionScope, second: ProductionCompletionScope): boolean {
  if (first.kind === "project" || second.kind === "project") return true;
  if (first.kind === "beats" && second.kind === "beats") return first.beatIds.some(id => second.beatIds.includes(id));
  if (first.kind === "frames" && second.kind === "frames") return rangesOverlap(first, second);
  if (first.kind === "frames" || second.kind === "frames") {
    const frameScope = first.kind === "frames" ? first : second as Extract<ProductionCompletionScope, { kind: "frames" }>;
    const other = first.kind === "frames" ? second : first;
    return productionObservationRanges(snapshot, other).some(range => rangesOverlap(range, frameScope));
  }
  const firstIds = first.kind === "beats" ? first.beatIds : first.objectIds;
  const secondIds = second.kind === "beats" ? second.beatIds : second.objectIds;
  return firstIds.some(id => secondIds.includes(id)) || snapshot.scenes.some(scene => coversScene(snapshot, first, scene) && coversScene(snapshot, second, scene));
}

type FrameRange = { startFrame: number; endFrame: number };

/** 以实际时间线范围计算职责覆盖，字幕等对象不必伪装成场景。 */
export function productionScopeRanges(snapshot: ProjectSnapshot, scope: ProductionCompletionScope): FrameRange[] {
  if (scope.kind === "project") {
    const endFrame = Math.max(snapshot.timeline.durationInFrames, ...snapshot.scenes.map(scene => scene.endFrame));
    return endFrame > 0 ? [{ startFrame: 0, endFrame }] : [];
  }
  return productionObservationRanges(snapshot, scope);
}

export function isCaptionTextOnlyChange(beforeSnapshot: ProjectSnapshot, afterSnapshot: ProjectSnapshot, scope: ProductionCompletionScope): boolean {
  if (scope.kind !== "objects" || !scope.objectIds.length) return false;
  const before = structuredClone(beforeSnapshot), after = structuredClone(afterSnapshot);
  let changedText = false;
  for (const id of scope.objectIds) {
    const oldCaption = before.timeline.captions.find(item => item.id === id);
    const newCaption = after.timeline.captions.find(item => item.id === id);
    if (!oldCaption || !newCaption) return false;
    changedText ||= oldCaption.text !== newCaption.text;
    newCaption.text = oldCaption.text;
    newCaption.textMode = oldCaption.textMode;
  }
  before.project.updatedAt = after.project.updatedAt;
  before.agentWorkOrders = []; after.agentWorkOrders = [];
  return changedText && JSON.stringify(before) === JSON.stringify(after);
}

function intersectRanges(first: FrameRange[], second: FrameRange[]): FrameRange[] {
  return first.flatMap(a => second.flatMap(b => {
    const startFrame = Math.max(a.startFrame, b.startFrame), endFrame = Math.min(a.endFrame, b.endFrame);
    return startFrame < endFrame ? [{ startFrame, endFrame }] : [];
  }));
}

/** 判断沿用局部决定时，只对照当前范围实际涉及的时间线内容。 */
function localDecisionInputs(snapshot: ProjectSnapshot, range: FrameRange): string {
  const overlaps = (item: FrameRange) => rangesOverlap(item, range);
  const items = snapshot.timeline.items.filter(overlaps);
  const cues = snapshot.effectCues.filter(overlaps);
  const scenes = snapshot.scenes.filter(overlaps);
  const sceneIds = new Set(scenes.map(scene => scene.id));
  const itemIds = new Set(items.map(item => item.id));
  const assetIds = new Set(items.map(item => item.assetId));
  const programs = snapshot.explainerPrograms.filter(item => sceneIds.has(item.sceneId));
  for (const cue of cues) for (const binding of cue.assetBindings ?? []) assetIds.add(binding.assetId);
  for (const program of programs) for (const assetId of program.assetIds) assetIds.add(assetId);
  return JSON.stringify({
    canvas: { width: snapshot.timeline.width, height: snapshot.timeline.height, fps: snapshot.timeline.fps,
      captionMode: snapshot.project.brief.captionMode, captionFormat: snapshot.timeline.captionFormat },
    scenes, items, cues, captions: snapshot.timeline.captions.filter(overlaps),
    cutaways: snapshot.cutaways.filter(overlaps),
    audioCues: snapshot.audioCues.filter(item => itemIds.has(item.timelineItemId) || cues.some(cue => cue.id === item.effectEvent?.effectCueId)),
    tracks: snapshot.timeline.tracks.filter(track => items.some(item => item.trackId === track.id)),
    assets: snapshot.assets.filter(asset => assetIds.has(asset.id)),
    programs,
    treatments: snapshot.visualTreatments.filter(item => item.sceneId && sceneIds.has(item.sceneId))
  });
}

export function responsibilityAssignmentRanges(snapshot: ProjectSnapshot, report: SkillExecutionReport,
  assignment: ProductionAssignment, responsibility: VisualResponsibility, observedOperationId?: string): FrameRange[] {
  if (!assignment.responsibilities.includes(responsibility)) return [];
  let ranges = productionScopeRanges(snapshot, assignment.scope);
  for (const replacement of report.assignments.filter(item => item.supersedesAssignmentId === assignment.assignmentId
    && item.responsibilities.includes(responsibility))) {
    const observationOrder = report.operations.findIndex(item => item.id === observedOperationId);
    const replacementOrder = report.operations.findIndex(item => item.id === replacement.operationId);
    if (observationOrder >= 0 && replacementOrder > observationOrder) continue;
    const replaced = productionScopeRanges(snapshot, replacement.scope);
    ranges = ranges.flatMap(range => missingReviewRanges(replaced, range.startFrame, range.endFrame));
  }
  return ranges;
}

export function responsibilityDecisionRanges(snapshot: ProjectSnapshot, report: SkillExecutionReport, decision: CreativeDecision, observedOperationId?: string): FrameRange[] {
  if (!decision.assignmentId || !decision.phase || !["creative_research", "motion_research", "visual_design"].includes(decision.phase)) return [];
  const assignment = report.assignments.find(item => item.assignmentId === decision.assignmentId);
  if (!assignment) return [];
  const responsibility = decision.phase as VisualResponsibility;
  const assigned = responsibilityAssignmentRanges(snapshot, report, assignment, responsibility, observedOperationId);
  const beatIds = decision.objectIds.filter(id => snapshot.story.beats.some(beat => beat.id === id));
  const objectIds = decision.objectIds.filter(id => !beatIds.includes(id));
  const objects = objectIds.length ? productionScopeRanges(snapshot, { kind: "objects", objectIds }) : [];
  const beats = beatIds.length ? productionScopeRanges(snapshot, { kind: "beats", beatIds }) : [];
  let ranges = decision.objectIds.includes(snapshot.project.id) ? assigned : intersectRanges(assigned, [...objects, ...beats]);
  if (responsibility === "visual_design") for (const role of ["creative_research", "motion_research"] as const) {
    const inputs = report.creativeDecisions.filter(item => (decision.inputDecisionIds ?? []).includes(item.id) && item.phase === role
      && (item.researchOutcome === "researched" || item.researchOutcome === "not_applicable" && item.evidence.some(value => value.trim())));
    ranges = intersectRanges(ranges, inputs.flatMap(item => responsibilityDecisionRanges(snapshot, report, item, observedOperationId)));
  }
  return ranges;
}

/** 局部编辑先检查三项实际判断，再按当前作品的观察范围检查复核。 */
async function evaluateVisualResponsibilities(input: {
  report: SkillExecutionReport; snapshot: ProjectSnapshot; scope: ProductionCompletionScope;
  review?: EditorialQualityReview; phase?: "authoring" | "completion"; captionTextOnly?: boolean;
  readRevision: (revision: number) => ProjectSnapshot;
}): Promise<ProductionCoordinationIssue[]> {
  const { report, snapshot, scope, review } = input;
  const scopedEdit = !requiresFullVisualCoordination(report, snapshot);
  const issues: ProductionCoordinationIssue[] = [];
  const targets = productionScopeRanges(snapshot, scope);
  const labels = { creative_research: "创意", motion_research: "动效机制", visual_design: "美术视觉" } as const;
  const roles: VisualResponsibility[] = ["creative_research", "motion_research", "visual_design"];
  for (const responsibility of roles) {
    const assignments = report.assignments.filter(item => item.responsibilities.includes(responsibility)
      && assignmentScopesOverlap(snapshot, scope, item.scope));
    const decisions = report.creativeDecisions.filter(item => item.phase === responsibility && item.inputRevision != null
      && item.decision.trim() && item.rationale.trim() && (!scopedEdit || item.evidence.some(value => value.trim()))
      && (responsibility === "visual_design" || item.researchOutcome === "researched"
        || item.researchOutcome === "not_applicable" && item.evidence.some(value => value.trim())));
    const assignmentRanges = assignments.flatMap(item => responsibilityAssignmentRanges(snapshot, report, item, responsibility));
    const usableRanges = (decision: CreativeDecision): FrameRange[] => {
      const ranges = responsibilityDecisionRanges(snapshot, report, decision);
      if (!scopedEdit || input.phase !== "authoring" || decision.inputRevision == null) return ranges;
      const before = input.readRevision(decision.inputRevision);
      let current = intersectRanges(ranges, targets).filter(range => localDecisionInputs(before, range) === localDecisionInputs(snapshot, range));
      if (decision.phase === "visual_design") for (const role of ["creative_research", "motion_research"] as const) {
        const inputs = report.creativeDecisions.filter(item => (decision.inputDecisionIds ?? []).includes(item.id) && item.phase === role
          && item.inputRevision != null && item.evidence.some(value => value.trim()) && item.researchOutcome !== "pending");
        current = intersectRanges(current, inputs.flatMap(usableRanges));
      }
      return current;
    };
    const decisionRanges = decisions.flatMap(usableRanges);
    const addGaps = (code: string, available: FrameRange[], message: string, nextAction: string) => {
      for (const target of targets) for (const gap of missingReviewRanges(available, target.startFrame, target.endFrame)) {
        const owner = assignments.find(item => responsibilityAssignmentRanges(snapshot, report, item, responsibility).some(range => rangesOverlap(range, gap)));
        issues.push({ code, scope: { kind: "frames", ...gap }, assignmentId: owner?.assignmentId,
          relatedDecisionIds: [], relatedObjectIds: [], state: "pending", message: `${labels[responsibility]}${message}：${gap.startFrame}–${gap.endFrame}`,
          nextAction });
      }
    };
    if (scopedEdit) {
      addGaps("ASSIGNMENT_MISSING", assignmentRanges, "职责尚未承接", "分派或续接对应负责人");
      const required = responsibility === "creative_research" ? ["creative-sequence-design"] : responsibility === "motion_research"
        ? ["motion-case-library"] : ["visual-treatment-planning", "creative-reference-to-sequence"];
      const routed = assignments.filter(item => required.every(skill => item.skillIds.some(id => id === skill || id.endsWith(`:${skill}`))));
      addGaps("SKILL_ROUTING_MISSING", routed.flatMap(item => responsibilityAssignmentRanges(snapshot, report, item, responsibility)),
        "职责的方法尚未交接", "续接负责人并登记实际使用的方法");
      addGaps("RESPONSIBILITY_DECISION_PENDING", decisionRanges, "判断尚未完成或本范围输入已变化", "续接负责人核对当前范围并接回实际判断");
    }
    if (input.phase === "authoring") continue;
    let confirmed: FrameRange[] = [];
    const applicable = [...(review?.applicableEvidence ?? [])].sort((a, b) => {
      const first = review?.evidenceRecords?.find(item => item.id === a.evidenceId)?.recordedAt ?? "";
      const second = review?.evidenceRecords?.find(item => item.id === b.evidenceId)?.recordedAt ?? "";
      return first.localeCompare(second);
    });
    for (const part of applicable) {
      const entry = review?.evidenceRecords?.find(item => item.id === part.evidenceId);
      for (const item of entry?.responsibilityReviews ?? []) {
        if (item.responsibility !== responsibility) continue;
        const owner = assignments.find(assignment => assignment.assignmentId === item.assignmentId);
        if (!owner) continue;
        const currentOwner = responsibilityAssignmentRanges(snapshot, report, owner, responsibility, entry?.operationId);
        const referenced = decisions.filter(decision => item.decisionIds.includes(decision.id))
          .flatMap(decision => responsibilityDecisionRanges(snapshot, report, decision, entry?.operationId));
        const observed = intersectRanges(intersectRanges([part], currentOwner), referenced);
        if (item.outcome === "confirmed") confirmed.push(...observed);
        else confirmed = confirmed.flatMap(range => missingReviewRanges(observed, range.startFrame, range.endFrame));
      }
    }
    if (input.captionTextOnly) {
      for (const target of targets) {
        if (confirmed.some(part => rangesOverlap(part, target))) continue;
        const owner = assignments.find(item => responsibilityAssignmentRanges(snapshot, report, item, responsibility).some(range => rangesOverlap(range, target)));
        issues.push({ code: "RESPONSIBILITY_REVIEW_PENDING", scope: { kind: "frames", ...target }, assignmentId: owner?.assignmentId,
          relatedDecisionIds: [], relatedObjectIds: [], state: "pending", message: `${labels[responsibility]}作品复核尚未完成：${target.startFrame}–${target.endFrame}`,
          nextAction: "在当前作品中补充该职责的观察" });
      }
    } else addGaps("RESPONSIBILITY_REVIEW_PENDING", confirmed, "作品复核尚未完成", "在当前作品中补充该职责的观察");
  }
  return issues;
}

function decisionCovers(decision: CreativeDecision, projectId: string, scene: Scene, treatment?: VisualTreatment): boolean {
  return decision.objectIds.includes(projectId) || decision.objectIds.includes(scene.id)
    || (treatment ? decision.objectIds.includes(treatment.id) || !!treatment.narrativeBeatId && decision.objectIds.includes(treatment.narrativeBeatId)
      : scene.narrativeBeatIds.some(id => decision.objectIds.includes(id)));
}

export function referenceResearchOwnerAccepted(report: SkillExecutionReport, snapshot: ProjectSnapshot, scene: Scene,
  treatment: VisualTreatment | undefined, research: CreativeDecision, phase: "creative_research" | "motion_research", adoptionOperationId?: string): boolean {
  const applies = (assignment: ProductionAssignment) => assignment.responsibilities.includes(phase)
    && coversScene(snapshot, assignment.scope, scene, treatment);
  const owners = report.assignments.filter(assignment => applies(assignment)
    && !report.assignments.some(other => other.supersedesAssignmentId === assignment.assignmentId && applies(other)));
  const adoptionOrder = report.operations.findIndex(operation => operation.id === adoptionOperationId);
  return owners.some(current => {
    let owner: ProductionAssignment | undefined = current;
    while (owner) {
      if (owner.assignmentId === research.assignmentId) return true;
      const replacementOrder = report.operations.findIndex(operation => operation.id === owner!.operationId);
      if (adoptionOrder < 0 || replacementOrder <= adoptionOrder) return false;
      owner = report.assignments.find(item => item.assignmentId === owner!.supersedesAssignmentId);
    }
    return false;
  });
}

const researchLevels = ["overallVisual", "sceneComposition", "motionMechanisms"] as const;

function usableReference(reference: NonNullable<CreativeDecision["researchReferences"]>[number]): boolean {
  return !!reference.id?.trim() && /^[a-f0-9]{64}$/u.test(reference.sourceSha256)
    && Number.isFinite(reference.startMs) && Number.isFinite(reference.endMs)
    && reference.startMs! >= 0 && reference.endMs! > reference.startMs! && !!reference.observedRelation?.trim();
}

export function requiresWholeFilmReferenceAdoption(report: SkillExecutionReport, snapshot: ProjectSnapshot): boolean {
  return report.completionScope.kind === "project" && snapshot.project.profile === "visual_explainer"
    && requiresVisualReferenceUnits(report, snapshot);
}

/** 一个 Scene 可以承载多个单元；缺口按真正的本片帧段交回。 */
export function visualReferenceUnitCoverage(input: {
  report: SkillExecutionReport;
  snapshot: ProjectSnapshot;
  manifest: ReferenceManifest;
  scene: Scene;
  delivered: ReferenceScene;
  designs: CreativeDecision[];
  adoptionOperationId?: string;
  targetRange?: { startFrame: number; endFrame: number };
}) {
  const { report, snapshot, manifest, scene, delivered, designs, adoptionOperationId, targetRange } = input;
  const plan = delivered.visualPlan;
  const units = plan?.units ?? [];
  type FrameRange = { startFrame: number; endFrame: number };
  type Entry = { sceneId: string; unitId?: string; title: string; targetRange: FrameRange;
    primary?: { referenceId: string; kind: "creative" | "motion" }; creativeDraftPath?: string;
    mode?: NonNullable<NonNullable<ReferenceScene["visualPlan"]>["units"]>[number]["mode"];
    restage?: { deliveredPath: string; sourceMs?: number; projectFrame: number }; issues: ProductionCoordinationIssue[] };
  const ownerFor = (phase: "creative_research" | "visual_design") => report.assignments.find(assignment =>
    assignment.responsibilities.includes(phase) && coversScene(snapshot, assignment.scope, scene)
    && !report.assignments.some(other => other.supersedesAssignmentId === assignment.assignmentId
      && other.responsibilities.includes(phase) && coversScene(snapshot, other.scope, scene)));
  const issue = (entry: Entry, code: string, phase: "creative_research" | "visual_design", reason: string, nextAction: string) => {
    entry.issues.push({ code, state: "missing", scope: { kind: "frames", ...entry.targetRange },
      assignmentId: ownerFor(phase)?.assignmentId, relatedDecisionIds: [], relatedObjectIds: [scene.id],
      message: `「${entry.title}」${reason}`, nextAction });
  };
  const sceneEntry: Entry = { sceneId: scene.id, title: scene.title,
    targetRange: { startFrame: scene.startFrame, endFrame: scene.endFrame }, issues: [] };
  // 起止帧是同一导演时间计划的连续边界，片头、尾留及接缝归入相邻单元。
  if (!units.length || new Set(units.map(unit => unit.id)).size !== units.length
    || units.some((unit, index) => !unit.id?.trim() || !unit.title?.trim()
      || unit.startFrame !== (index === 0 ? scene.startFrame : units[index - 1].endFrame)
      || !Number.isSafeInteger(unit.endFrame) || unit.endFrame <= unit.startFrame || unit.endFrame > scene.endFrame)
    || units.at(-1)?.endFrame !== scene.endFrame) {
    issue(sceneEntry, "VISUAL_REFERENCE_UNITS_INCOMPLETE", "visual_design", "缺少完整的主要视觉单元范围",
      "请主导演与视觉作者按当前时间计划补齐连续单元及帧段");
    return [sceneEntry];
  }
  const handoffIssues = unitHandoffDeliveryIssues(report, snapshot, manifest, scene, delivered,
    designs.flatMap(design => design.assignmentId ? [design.assignmentId] : []));
  const resource = (id?: string) => id && delivered.resourceIds?.includes(id) ? manifest.files.find(file =>
    file.localReadable && file.requiredForRun !== false && !!file.sha256
    && file.uses.some(use => use.kind === "reference" && use.id === id)) : undefined;
  return units.filter(unit => !targetRange || rangesOverlap(unit, targetRange)).map(unit => {
    const entry: Entry = { sceneId: scene.id, unitId: unit.id, title: unit.title, mode: unit.mode,
      targetRange: { startFrame: unit.startFrame, endFrame: unit.endFrame }, issues: [] };
    entry.issues.push(...handoffIssues.filter(issue => issue.scope.kind !== "frames"
      || issue.scope.startFrame === unit.startFrame && issue.scope.endFrame === unit.endFrame));
    const primary = unit.mode === "full_reference"
      ? plan?.referenceMappings?.find(mapping => mapping.unitId === unit.id && mapping.use === "primary") : undefined;
    const reference = primary && delivered.references?.find(ref => ref.kind === primary.referenceKind
      && ref.id === primary.referenceId && ref.startMs === primary.startMs && ref.endMs === primary.endMs);
    if (reference) entry.primary = { referenceId: reference.id, kind: reference.kind };
    // 原稿、接收证据和采用方式的匹配由所有入口共用的交件核验负责。
    const adoptedMappings = plan?.referenceMappings?.filter(mapping => mapping.unitId === unit.id) ?? [];
    const creative = report.creativeDecisions.find(decision => decision.id === unit.creativeDecisionId && decision.phase === "creative_research");
    const creativeOwner = report.assignments.find(assignment => assignment.assignmentId === creative?.assignmentId);
    const draft = resource(unit.creativeDraftId);
    const linkedDesign = creative && creativeOwner && designs.some(design =>
      design.inputDecisionIds?.includes(creative.id)
      && adoptedMappings.every(mapping => design.inputDecisionIds?.includes(mapping.researchDecisionId ?? ""))
      && report.assignments.some(assignment => assignment.assignmentId === design.assignmentId
        && assignment.responsibilities.includes("visual_design") && assignment.agentId !== creativeOwner.agentId));
    if (!creative || !linkedDesign || !decisionCovers(creative, snapshot.project.id, scene)
      || !referenceResearchOwnerAccepted(report, snapshot, scene, undefined, creative, "creative_research", adoptionOperationId)
      || !draft) {
      issue(entry, "VISUAL_UNIT_CREATIVE_DRAFT_MISSING", "creative_research", "缺少独立创意作者的拆解原稿或研究交接",
        "接回原创意作者的拆解正文与研究决定，原样转交视觉作者并固定进同一份交付");
    } else entry.creativeDraftPath = draft.deliveredPath;
    const restage = unit.restage;
    const restageFile = resource(restage?.resourceId);
    if (restage && restageFile) entry.restage = {
      deliveredPath: restageFile.deliveredPath, sourceMs: restage.sourceMs, projectFrame: restage.projectFrame
    };
    return entry;
  });
}

/** 采用、制作和收口使用相同依据；同一研究决定内的连续观察可以共同覆盖采用范围。 */
export function referenceResearchIssues(input: {
  report: SkillExecutionReport;
  snapshot: ProjectSnapshot;
  scene: Scene;
  delivered: ReferenceScene;
  designs: CreativeDecision[];
  treatment?: VisualTreatment;
  targetRange?: { startFrame: number; endFrame: number };
  accepted: (research: CreativeDecision, phase: "creative_research" | "motion_research") => boolean;
}) {
  const { report, snapshot, scene, delivered, designs, treatment } = input;
  const issues: Array<{ code: "REFERENCE_MAPPING_MISSING" | "REFERENCE_RESEARCH_UNLINKED"; referenceId: string;
    researchDecisionId?: string; phase: "creative_research" | "motion_research"; message: string; nextAction: string }> = [];
  for (const reference of delivered.references ?? []) {
    const phase = reference.kind === "creative" ? "creative_research" : "motion_research";
    const mappings = (delivered.visualPlan?.referenceMappings ?? []).filter(item => item.referenceId === reference.id
      && (!item.referenceKind || item.referenceKind === reference.kind) && item.startMs === reference.startMs && item.endMs === reference.endMs
      && item.targetRole?.trim() && item.treatment?.trim() && item.preserveRelation?.trim()
      && delivered.visualRoles?.some(role => role.role === item.targetRole));
    if (!mappings.length) {
      issues.push({ code: "REFERENCE_MAPPING_MISSING", referenceId: reference.id, phase,
        message: `采用参考 ${reference.id} 缺少本场角色映射`, nextAction: "续接视觉作者补充实际素材与画面关系" });
      continue;
    }
    for (const mapping of mappings) {
      if (input.targetRange && mapping.targetRange && !rangesOverlap(mapping.targetRange, input.targetRange)) continue;
      const research = report.creativeDecisions.find(item => item.id === mapping.researchDecisionId && item.phase === phase);
      const linkedDesigns = research ? designs.filter(design => design.inputDecisionIds?.includes(research.id)) : [];
      const covers = research && (decisionCovers(research, snapshot.project.id, scene, treatment)
        || !treatment && snapshot.visualTreatments.some(item => (item.sceneId === scene.id || !!item.narrativeBeatId && scene.narrativeBeatIds.includes(item.narrativeBeatId))
          && linkedDesigns.some(design => visualDesignCovers(snapshot, design, scene, item)) && decisionCovers(research, snapshot.project.id, scene, item)));
      const accepted = research && input.accepted(research, phase);
      const linked = research && linkedDesigns.length > 0 && covers && accepted && research.researchOutcome !== "not_applicable";
      const ranges = linked ? (research.researchReferences ?? []).filter(source => source.kind === reference.kind && source.id === reference.id
        && source.sourceSha256 === reference.sourceSha256 && usableReference(source))
        .map(source => ({ startFrame: source.startMs!, endFrame: source.endMs! })) : [];
      const missing = missingReviewRanges(ranges, reference.startMs, reference.endMs);
      if (missing.length) {
        const gap = missing.map(range => `${range.startFrame}–${range.endFrame}`).join("、");
        const sameReference = research?.researchReferences?.some(source => source.kind === reference.kind && source.id === reference.id && usableReference(source));
        const reason = !research ? "研究决定不存在或类型不符" : !linkedDesigns.length ? "研究决定未进入当前视觉设计"
          : !covers ? "研究决定未覆盖当前场面" : !accepted ? "研究负责人尚未确认该结果"
          : research.researchOutcome === "not_applicable" ? "该研究未采用参考" : !ranges.length && sameReference ? "参考来源指纹不一致"
          : !ranges.length ? "没有对应参考的有效观察" : "研究范围未覆盖采用片段";
        issues.push({ code: "REFERENCE_RESEARCH_UNLINKED", referenceId: reference.id, researchDecisionId: mapping.researchDecisionId, phase,
          message: `采用参考 ${reference.id} 的 ${reference.startMs}–${reference.endMs} 毫秒未关联对应研究结果：${reason}；未覆盖 ${gap} 毫秒`,
          nextAction: "续接原研究负责人核对或补看缺失范围，并由视觉作者关联实际研究决定" });
      }
    }
  }
  return issues;
}

/** 局部关系可以提前交接；正式采用另需整场研究覆盖。 */
export function researchComplete(decision: CreativeDecision): boolean {
  const hasEvidence = decision.evidence.some(item => item.trim());
  if (decision.phase === "motion_research") {
    return decision.researchOutcome === "not_applicable" ? hasEvidence
      : decision.researchOutcome === "researched" && (hasEvidence || !!decision.researchReferences?.some(usableReference));
  }
  const coverage = decision.researchCoverage;
  return decision.phase === "creative_research" && decision.researchOutcome === "researched" && !!coverage
    && researchLevels.every(level => coverage[level] === "covered"
      || coverage[level] === "not_applicable" && !!coverage.notApplicableReasons?.[level]?.trim())
    && Array.isArray(coverage.blockingQuestions) && coverage.blockingQuestions.length === 0
    && (hasEvidence || !!decision.researchReferences?.some(usableReference)
      || researchLevels.some(level => coverage[level] === "covered" && !!coverage.layerNotes?.[level]?.trim()));
}

/** 新的正式采用需要每个已覆盖层次都有研究正文。 */
export function researchLayerNotesComplete(decision: CreativeDecision): boolean {
  const coverage = decision.researchCoverage;
  return decision.phase === "creative_research" && researchComplete(decision) && !!coverage
    && researchLevels.every(level => coverage[level] !== "covered"
      || !!coverage.layerNotes?.[level]?.trim());
}

/** 核对视觉稿中每个已覆盖层次是否关联到同一研究决定。 */
export function missingResearchLayers(decision: CreativeDecision, scene: ReferenceScene): string[] {
  const coverage = decision.researchCoverage;
  if (!researchComplete(decision) || !coverage) return ["完整创意研究"];
  const labels = { overallVisual: "整片美术", sceneComposition: "场面构图", motionMechanisms: "局部机制" };
  const missing: string[] = [];
  for (const level of researchLevels) {
    if (coverage[level] !== "covered") continue;
    if (!coverage.layerNotes?.[level]?.trim()) missing.push(`${labels[level]}研究正文`);
    else if (!scene.visualPlan?.researchLayers?.some(item => item.level === level
      && item.researchDecisionId === decision.id && !!item.designExcerpt?.trim())) missing.push(`${labels[level]}的导演稿关联`);
  }
  return missing;
}

/** 状态由真实分派、当前采用链和审阅记录派生，保持未知与完成分开。 */
export async function evaluateProductionCoordination(input: {
  report: SkillExecutionReport;
  snapshot: ProjectSnapshot;
  scope: ProductionCompletionScope;
  review?: EditorialQualityReview;
  readRevision: (revision: number) => ProjectSnapshot;
  /** 制作前只检查当前目标，成片实现及作品审阅留到最终收口。 */
  phase?: "authoring" | "completion";
  targetTreatmentIds?: string[];
  targetBeatIds?: string[];
  targetRange?: { startFrame: number; endFrame: number };
  captionTextOnly?: boolean;
  continuingAuthoring?: boolean;
}): Promise<ProductionCoordinationIssue[]> {
  const { report, snapshot, scope, review } = input;
  if (report.intent === "review_only") return [];
  const issues = await evaluateVisualResponsibilities(input);
  if (!requiresFullVisualCoordination(report, snapshot)) return issues;
  const active = resolveCompositionReachability(snapshot);
  const composition = compileVisualComposition(snapshot, active);
  const primaryIds = new Set(composition.primaryCues.map(cue => cue.id));
  const labels = { director: "导演", narration: "文案", asset_sourcing: "素材", creative_research: "创意研究", visual_design: "视觉设计", motion_research: "动效机制研究", review: "审阅" } as const;
  const add = (code: string, scene: Scene | undefined, state: ProductionCoordinationIssue["state"], message: string, nextAction: string, assignment?: ProductionAssignment, decisions: string[] = []) => {
    let target: ProductionCompletionScope = scope;
    if (scene && scope.kind === "project") target = { kind: "objects", objectIds: [scene.id] };
    if (scene && scope.kind === "frames") target = { kind: "frames", startFrame: Math.max(scope.startFrame, scene.startFrame), endFrame: Math.min(scope.endFrame, scene.endFrame) };
    if (scene && scope.kind === "beats") {
      const beatIds = scope.beatIds.filter(id => scene.narrativeBeatIds.includes(id)
        || snapshot.visualTreatments.some(treatment => treatment.sceneId === scene.id && treatment.narrativeBeatId === id));
      if (beatIds.length) target = { kind: "beats", beatIds };
    }
    if (scene && scope.kind === "objects") {
      const objectIds = scope.objectIds.filter(id => coversScene(snapshot, { kind: "objects", objectIds: [id] }, scene)
        || snapshot.visualTreatments.some(treatment => treatment.sceneId === scene.id && coversScene(snapshot, { kind: "objects", objectIds: [id] }, scene, treatment)));
      if (objectIds.length) target = { kind: "objects", objectIds };
    }
    issues.push({ code, scope: target, assignmentId: assignment?.assignmentId, relatedDecisionIds: decisions,
      relatedObjectIds: scene ? [scene.id] : [], state, message, nextAction });
  };
  const scenes = snapshot.scenes.filter(scene => coversScene(snapshot, scope, scene)
    || snapshot.visualTreatments.some(treatment => treatment.sceneId === scene.id && coversScene(snapshot, scope, scene, treatment)));
  const narrativeScenes = snapshot.scenes.filter(scene => scene.narrativeBeatIds.length);
  // 整片检查按有正文的场面汇总，片尾停驻和单场试做不单独要求素材。
  const mainScenes = narrativeScenes.length ? narrativeScenes : snapshot.scenes;
  const { targetRange: range, targetBeatIds } = input;
  const wholeFilm = scope.kind === "project" || (input.phase === "authoring" && !!range && mainScenes.every(scene =>
    scenes.includes(scene) && range.startFrame <= scene.startFrame && range.endFrame >= scene.endFrame
    && (!targetBeatIds || scene.narrativeBeatIds.every(id => targetBeatIds.includes(id)))));
  const checkPrimaryMaterial = wholeFilm && report.intent === "full_creation" && report.completionScope.kind === "project"
    && snapshot.project.profile === "visual_explainer" && !input.captionTextOnly && !input.continuingAuthoring;
  const primaryMaterialByScene = new Map<string, { roles: Set<string>; hasMaterial: boolean; assignment?: ProductionAssignment }>();
  const targets: Array<Scene | undefined> = scenes.length ? scenes : [undefined];
  for (const scene of targets) {
    const treatments = scene ? snapshot.visualTreatments.filter(treatment => treatment.sceneId === scene.id
      || !!treatment.narrativeBeatId && scene.narrativeBeatIds.includes(treatment.narrativeBeatId)).filter(treatment => coversScene(snapshot, scope, scene, treatment)
        && (!input.targetTreatmentIds || input.targetTreatmentIds.includes(treatment.id))) : [];
    const applies = (assignment: ProductionAssignment, treatment?: VisualTreatment) => assignmentScopesOverlap(snapshot, scope, assignment.scope)
      && (!scene || coversScene(snapshot, assignment.scope, scene, treatment)
        || !treatment && treatments.some(item => coversScene(snapshot, assignment.scope, scene, item)));
    const assignmentsFor = (responsibility: ProductionAssignment["responsibilities"][number], treatment?: VisualTreatment) => report.assignments.filter(assignment => assignment.responsibilities.includes(responsibility)
      && applies(assignment, treatment)
      && !report.assignments.some(other => other.supersedesAssignmentId === assignment.assignmentId && other.responsibilities.includes(responsibility)
        && (!scene ? other.scope.kind === "project" : applies(other, treatment))));
    const assignmentFor = (responsibility: ProductionAssignment["responsibilities"][number], treatment?: VisualTreatment) => assignmentsFor(responsibility, treatment)[0];
    const acceptedFor = (decision: CreativeDecision, assignment?: ProductionAssignment, adoption?: CreativeDecision) => {
      if (!assignment) return false;
      if (decision.assignmentId === assignment.assignmentId) return true;
      const adoptionOrder = report.operations.findIndex(operation => operation.id === adoption?.operationId);
      let successor: ProductionAssignment | undefined = assignment;
      while (successor?.supersedesAssignmentId) {
        const replacementOrder = report.operations.findIndex(operation => operation.id === successor!.operationId);
        // 只保留被直接接替之前已采用的结果；不把其他范围的作者当作前任。
        if (successor.supersedesAssignmentId === decision.assignmentId) return adoptionOrder >= 0 && replacementOrder > adoptionOrder;
        successor = report.assignments.find(item => item.assignmentId === successor!.supersedesAssignmentId);
      }
      return false;
    };
    for (const responsibility of ["director", "creative_research", "visual_design", "motion_research"] as const) {
      if (!assignmentFor(responsibility)) add("ASSIGNMENT_MISSING", scene, "missing", `缺少${labels[responsibility]}职责的承接记录`, "分派或续接对应负责人");
    }
    // 分派记录只校验职责和技能路由，不能代替宿主实际启动作者或转交结果。
    if (report.intent === "full_creation") {
      const writer = assignmentFor("narration");
      if (!writer) add("NARRATION_ASSIGNMENT_MISSING", scene, "missing", "缺少文案作者的分派记录", "分派或续接文案作者");
      if (!assignmentFor("asset_sourcing")) add("ASSET_ASSIGNMENT_MISSING", scene, "missing", "缺少素材作者的分派记录", "分派或续接素材作者");
    }
    const requiredSkills = {
      director: ["production-director"], narration: ["narration-writing"], asset_sourcing: ["visual-asset-sourcing"],
      creative_research: ["creative-sequence-design"], visual_design: ["visual-treatment-planning", "creative-reference-to-sequence"],
      motion_research: ["motion-case-library"]
    } as const;
    for (const responsibility of Object.keys(requiredSkills) as Array<keyof typeof requiredSkills>) {
      for (const assignment of assignmentsFor(responsibility)) {
        const missing = requiredSkills[responsibility].filter(skill => !assignment.skillIds.some(id => id === skill || id.endsWith(`:${skill}`)));
        if (missing.length) add("SKILL_ROUTING_MISSING", scene, "missing", `${labels[responsibility]}分派缺少技能：${missing.join("、")}`,
          "续接对应负责人并登记实际使用的技能", assignment);
      }
    }
    for (const phase of ["creative_research", "motion_research"] as const) {
      const assignment = assignmentFor(phase);
      const readyForNewDesign = (decision: CreativeDecision) => phase === "creative_research"
        ? researchLayerNotesComplete(decision) : researchComplete(decision);
      const research = report.creativeDecisions.find(decision => decision.phase === phase && readyForNewDesign(decision) && decision.assignmentId === assignment?.assignmentId
        && (!scene ? decision.objectIds.includes(snapshot.project.id) : decisionCovers(decision, snapshot.project.id, scene)
          || treatments.some(item => decisionCovers(decision, snapshot.project.id, scene, item))));
      const priorAccepted = scene && treatments.length > 0 && treatments.every(treatment => {
        const adoption = treatment.adoptedDecisionRef?.productionRunId === report.id
          ? report.creativeDecisions.find(item => item.id === treatment.adoptedDecisionRef!.decisionId && item.phase === "adoption") : undefined;
        return !!adoption && (adoption.inputDecisionIds ?? []).some(id => {
          const design = report.creativeDecisions.find(item => item.id === id && item.phase === "visual_design");
          return design?.inputDecisionIds?.some(researchId => report.creativeDecisions.some(item => item.id === researchId && item.phase === phase
            && researchComplete(item) && decisionCovers(item, snapshot.project.id, scene, treatment) && acceptedFor(item, assignmentFor(phase, treatment), adoption)));
        });
      });
      if (assignment && !research && !priorAccepted) add("RESEARCH_PENDING", scene, "pending", `${labels[phase]}尚未完成`,
        phase === "creative_research" ? "续接创意作者补充已覆盖层次的研究正文" : "续接研究负责人", assignment);
    }
    if (!scene || !treatments.length) {
      add("VISUAL_DESIGN_PENDING", scene, "pending", "目标范围尚未接回视觉方案", "续接视觉作者", assignmentFor("visual_design"));
      continue;
    }
    for (const treatment of treatments) {
      const adoptionRef = treatment.adoptedDecisionRef;
      const adoption = adoptionRef?.productionRunId === report.id ? report.creativeDecisions.find(item => item.id === adoptionRef.decisionId && item.phase === "adoption") : undefined;
      if (!adoption || !decisionCovers(adoption, snapshot.project.id, scene, treatment)) {
        const candidates = report.creativeDecisions.filter(item => item.phase === "visual_design" && decisionCovers(item, snapshot.project.id, scene, treatment)
          && acceptedFor(item, assignmentFor("visual_design", treatment)));
        if (!candidates.length) add("VISUAL_DESIGN_PENDING", scene, "pending", "本场尚未接回视觉设计", "续接视觉作者", assignmentFor("visual_design", treatment));
        for (const phase of ["creative_research", "motion_research"] as const) {
          const linked = candidates.flatMap(design => (design.inputDecisionIds ?? []).map(id => report.creativeDecisions.find(item => item.id === id)))
            .filter((item): item is CreativeDecision => !!item && item.phase === phase && decisionCovers(item, snapshot.project.id, scene, treatment));
          if (candidates.length && !linked.length) add("RESEARCH_NOT_CONSUMED", scene, "pending", `视觉设计尚未关联${labels[phase]}结果`, "接回研究并续接视觉作者", assignmentFor(phase, treatment), candidates.map(item => item.id));
          else if (linked.length && !linked.some(item => (phase === "creative_research" ? researchLayerNotesComplete(item) : researchComplete(item))
            && acceptedFor(item, assignmentFor(phase, treatment)))) add("RESEARCH_INPUT_PENDING", scene, "pending", `视觉设计已接收${labels[phase]}结果，当前负责人仍需完成或确认`, "续接当前研究负责人和视觉作者", assignmentFor(phase, treatment), linked.map(item => item.id));
        }
        add("ADOPTION_PENDING", scene, "pending", "当前视觉计划尚未关联本次范围的导演采用", "接回设计并交导演判断", assignmentFor("director", treatment));
        continue;
      }
      const designs = (adoption.inputDecisionIds ?? []).map(id => report.creativeDecisions.find(item => item.id === id))
        .filter((item): item is CreativeDecision => !!item && item.phase === "visual_design" && decisionCovers(item, snapshot.project.id, scene, treatment));
      if (!designs.length) {
        add("VISUAL_INPUT_MISSING", scene, "missing", "采用决定未关联本场视觉设计", "续接视觉作者并重新采用", assignmentFor("visual_design", treatment), [adoption.id]);
        continue;
      }
      const deliveredDesigns = designs.filter(design => sameVisualDelivery(design.deliveryRef, adoption.deliveryRef));
      if (!deliveredDesigns.length) {
        add("VISUAL_DELIVERY_MISMATCH", scene, "stale", "本场视觉设计与导演采用没有引用同一份固定交付", "准备并采用对应的正式视觉设计", assignmentFor("visual_design", treatment), [adoption.id, ...designs.map(design => design.id)]);
      }
      if (!acceptedFor(adoption, assignmentFor("director", treatment), adoption)) add("ADOPTION_OWNER_STALE", scene, "stale", "导演接替后的采用尚未由当前负责人确认", "续接当前导演", assignmentFor("director", treatment), [adoption.id]);
      if (!designs.some(design => acceptedFor(design, assignmentFor("visual_design", treatment), adoption))) add("VISUAL_OWNER_STALE", scene, "stale", "视觉负责人接替后的设计尚未确认", "续接当前视觉作者", assignmentFor("visual_design", treatment), designs.map(item => item.id));
      const beatId = treatment.narrativeBeatId;
      const ranges = beatId ? effectBeatRanges(snapshot, beatId, scene.id) : [scene];
      const overlaps = (item: { startFrame: number; endFrame: number }) => ranges.some(range => rangesOverlap(item, range));
      const cues = snapshot.effectCues.filter(cue => cue.sceneId === scene.id && active.effectCueIds.has(cue.id)
        && (!cue.visualComposition || primaryIds.has(cue.id)) && overlaps(cue) && (!beatId || cueCoversBeat(snapshot, cue, beatId)));
      const cutaways = snapshot.cutaways.filter(item => item.hostSceneId === scene.id && item.status === "ready" && active.videoItemIds.has(item.timelineItemId) && overlaps(item));
      const programs = snapshot.explainerPrograms.filter(program => program.sceneId === scene.id && active.explainerProgramIds.has(program.id)
        && (!beatId || snapshot.narrativeMap?.beats.some(item => item.id === program.narrativeMapBeatId && item.narrativeBeatId === beatId)));
      const videoItems = snapshot.timeline.items.filter(item => item.sceneId === scene.id && active.videoItemIds.has(item.id)
        && (composition.nativeVisibleRanges.get(item.id) ?? []).some(overlaps));
      if (input.phase !== "authoring" && !hasVisualTreatmentImplementation(treatment, { cues, cutaways, programs, videoItems, snapshot, ranges })) {
        add("IMPLEMENTATION_PENDING", scene, "pending", "当前视觉计划尚未关联可用实现", "续接原作者完成实际画面", assignmentFor("visual_design", treatment), [adoption.id]);
      }
      for (const phase of ["creative_research", "motion_research"] as const) {
        const linked = designs.flatMap(design => (design.inputDecisionIds ?? []).map(id => report.creativeDecisions.find(item => item.id === id)))
          .filter((item): item is CreativeDecision => !!item && item.phase === phase && decisionCovers(item, snapshot.project.id, scene, treatment));
        if (!linked.length) add("RESEARCH_NOT_CONSUMED", scene, "pending", `当前视觉设计尚未关联${labels[phase]}结果`, "接回研究并续接视觉作者", assignmentFor(phase, treatment), designs.map(item => item.id));
        else if (!linked.some(item => researchComplete(item) && acceptedFor(item, assignmentFor(phase, treatment), adoption))) add("RESEARCH_INPUT_PENDING", scene, "pending", `当前视觉设计已接收${labels[phase]}结果，当前负责人仍需完成或确认`, "续接当前研究负责人和视觉作者", assignmentFor(phase, treatment), linked.map(item => item.id));
      }
      for (const design of designs) {
        if (design.inputRevision === null || design.inputRevision === undefined) {
          add("VISUAL_INPUT_UNKNOWN", scene, "unknown", "视觉设计缺少可核对的项目输入版本", "请视觉作者确认实际输入", assignmentFor("visual_design", treatment), [design.id]);
          continue;
        }
        const before = input.readRevision(design.inputRevision);
        const oldScene = before.scenes.find(item => item.id === scene.id);
        // 只比较当前计划涉及的内容；同一场的其他 Beat 变化不应阻塞当前制作。
        const beatIds = treatment.narrativeBeatId ? [treatment.narrativeBeatId] : input.targetBeatIds ?? scene.narrativeBeatIds;
        const targetRange = input.phase === "authoring" ? input.targetRange : undefined;
        if (!oldScene || motionHandoffDependencyHash(before, scene.id, beatIds, targetRange ?? oldScene)
          !== motionHandoffDependencyHash(snapshot, scene.id, beatIds, targetRange ?? scene)) {
          add("VISUAL_INPUT_STALE", scene, "stale", "本场内容或声音时序已变化", "续接视觉作者确认受影响范围", assignmentFor("visual_design", treatment), [design.id]);
        }
      }
      if (!adoption.deliveryRef) {
        add("DELIVERY_MISSING", scene, "missing", "导演采用缺少交付清单", "准备并关联当前交付", assignmentFor("director", treatment), [adoption.id]);
        continue;
      }
      try {
        const bytes = await readFile(adoption.deliveryRef.manifestPath);
        if (createHash("sha256").update(bytes).digest("hex") !== adoption.deliveryRef.manifestSha256) throw new Error("hash");
        const manifest = JSON.parse(bytes.toString("utf8")) as ReferenceManifest;
        const selected = manifest.scenes?.filter(item => adoption.deliveryRef!.sceneIds.includes(item.sceneId)) ?? [];
        const delivered = selected.find(item => item.sceneId === scene.id);
        if (manifest.projectId !== snapshot.project.id || !delivered || !manifest.selectedSceneIds
          || JSON.stringify([...manifest.selectedSceneIds].sort()) !== JSON.stringify([...adoption.deliveryRef.sceneIds].sort())) throw new Error("scene");
        if (requiresVisualReferenceUnits(report, snapshot)) {
          issues.push(...visualReferenceUnitCoverage({ report, snapshot, manifest, scene, delivered, designs: deliveredDesigns,
            adoptionOperationId: adoption.operationId, targetRange: input.phase === "authoring" ? input.targetRange : undefined })
            .flatMap(unit => unit.issues));
        }
        if (checkPrimaryMaterial && delivered.status === "ready" && mainScenes.includes(scene)) {
          const primary = primaryMaterialByScene.get(scene.id) ?? {
            roles: new Set<string>(), hasMaterial: false, assignment: assignmentFor("asset_sourcing", treatment)
          };
          for (const name of delivered.visualPlan?.primaryRoles ?? []) {
            primary.roles.add(name);
            const role = delivered.visualRoles?.find(item => item.role === name);
            primary.hasMaterial ||= (role?.assets ?? []).some(binding => snapshot.assets.some(asset =>
              asset.id === binding.assetId && asset.status === "ready" && !!asset.sourceHash && asset.sourceHash === binding.sourceHash
              && (asset.kind === "image" || (asset.kind === "video" || asset.kind === "actor_video") && !!binding.sourceRanges?.length)));
          }
          primaryMaterialByScene.set(scene.id, primary);
        }
        for (const issue of referenceResearchIssues({ report, snapshot, scene, delivered, designs, treatment,
          targetRange: input.phase === "authoring" ? input.targetRange : undefined,
          accepted: (research, phase) => acceptedFor(research, assignmentFor(phase, treatment), adoption) })) {
          add(issue.code, scene, "missing", issue.message, issue.nextAction,
            assignmentFor(issue.code === "REFERENCE_MAPPING_MISSING" ? "visual_design" : issue.phase, treatment),
            [adoption.id, issue.researchDecisionId].filter((id): id is string => !!id));
        }
        if (delivered.references?.length) {
          for (const reference of delivered.references) {
            const sceneMappings = (delivered.visualPlan?.referenceMappings ?? []).filter(item => item.referenceId === reference.id
              && (!item.referenceKind || item.referenceKind === reference.kind) && item.startMs === reference.startMs && item.endMs === reference.endMs
              && item.targetRole?.trim() && item.treatment?.trim() && item.preserveRelation?.trim()
              && delivered.visualRoles?.some(role => role.role === item.targetRole));
            const mappings = input.phase === "authoring" && input.targetRange
              ? sceneMappings.filter(item => !item.targetRange || rangesOverlap(item.targetRange, input.targetRange!)) : sceneMappings;
            if (sceneMappings.length && !mappings.length) continue;
            if (input.phase === "authoring") continue;
            for (const mapping of mappings) {
              if (!mapping.targetRole) continue;
              const targetReference = { productionRunId: report.id, decisionId: adoption.id, sceneId: scene.id,
                referenceKind: reference.kind, referenceId: reference.id, sourceSha256: reference.sourceSha256,
                targetRole: mapping.targetRole, startMs: reference.startMs, endMs: reference.endMs };
              const targetRanges = productionObservationRanges(snapshot, scope).map(range => ({
                startFrame: Math.max(range.startFrame, scene.startFrame, mapping.targetRange?.startFrame ?? scene.startFrame),
                endFrame: Math.min(range.endFrame, scene.endFrame, mapping.targetRange?.endFrame ?? scene.endFrame)
              })).filter(range => range.startFrame < range.endFrame);
              const evidence = (review?.evidenceRecords ?? []).filter(item =>
                (item.source === "workbench" || item.source === "artifact")
                && (item.method === "continuous_video" || item.method === "audiovisual")
                && (item.referenceReviews?.some(ref => ref.productionRunId === report.id && ref.decisionId === adoption.id
                  && sameReferenceReview(ref, targetReference))));
              const events = evidence.flatMap(item => (review?.applicableEvidence ?? []).filter(part => part.evidenceId === item.id)
                .map(part => ({ ...part, recordedAt: item.recordedAt,
                  outcome: item.referenceReviews!.find(ref => ref.productionRunId === report.id && ref.decisionId === adoption.id
                    && sameReferenceReview(ref, targetReference))?.outcome })))
                .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
              // 后来的待核或问题观察覆盖旧通过；未关闭的问题由返修待办承接。
              const confirmed = events.flatMap((event, index) => event.outcome === "confirmed"
                ? missingReviewRanges(events.slice(index + 1).filter(later => later.outcome !== "confirmed"), event.startFrame, event.endFrame) : []);
              const open = openEditorialFindings(review).filter(finding => finding.referenceReview && sameReferenceReview(finding.referenceReview, targetReference))
                .map(finding => finding.revision !== undefined && review?.revision !== undefined && finding.revision !== review.revision
                  ? editorialResolutionRange(finding, input.readRevision(finding.revision), snapshot)
                  : finding.frameRange ?? { startFrame: scene.startFrame, endFrame: scene.endFrame });
              const missing = targetRanges.flatMap(range => missingReviewRanges([...confirmed, ...open], range.startFrame, range.endFrame));
              for (const gap of missing) {
                add("REFERENCE_REVIEW_PENDING", scene, "pending", `参考 ${reference.id} 的 ${mapping.targetRole} 尚无覆盖 ${gap.startFrame}–${gap.endFrame} 的对照观察`,
                  "续接原参考作者和视觉作者，对照原片及成片后记录实际结果",
                  assignmentFor(reference.kind === "creative" ? "creative_research" : "motion_research", treatment), [adoption.id]);
                const issue = issues[issues.length - 1];
                issue.scope = { kind: "frames", startFrame: gap.startFrame, endFrame: gap.endFrame };
                issue.relatedObjectIds.push(reference.id);
                issue.referenceReview = targetReference;
              }
            }
          }
        }
      } catch {
        add("DELIVERY_INVALID", scene, "stale", "交付清单不可读、已变化或不覆盖本场", "重新准备并确认交付", assignmentFor("director", treatment), [adoption.id]);
      }
    }
  }
  if (checkPrimaryMaterial && mainScenes.every(scene => primaryMaterialByScene.has(scene.id))
    && ![...primaryMaterialByScene.values()].some(scene => scene.hasMaterial)) {
    for (const scene of mainScenes) {
      const primary = primaryMaterialByScene.get(scene.id)!;
      const roles = [...primary.roles].join("、");
      add("PRIMARY_VISUAL_MATERIAL_MISSING", scene, "missing", `场面「${scene.title}」的主画面角色${roles ? `「${roles}」` : ""}未绑定可用素材`,
        "按主画面角色续接原素材作者补搜，交原视觉作者复摆并更新导演采用与交付", primary.assignment);
    }
  }
  return issues;
}
