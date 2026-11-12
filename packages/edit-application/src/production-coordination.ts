import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import type { CreativeDecision, EditorialQualityReview, ProductionAssignment, ProductionCompletionScope, ProductionCoordinationIssue, ProjectSnapshot, SkillExecutionReport, VisualTreatment } from "@videocut/contracts";
import { cueCoversBeat, hasVisualTreatmentImplementation, missingReviewRanges } from "../../quality-system/src/editorial-review.js";
import { compileVisualComposition, effectBeatRanges, rangesOverlap, resolveCompositionReachability } from "@videocut/domain";
import { motionHandoffDependencyHash } from "./motion-adoption.js";
import { productionObservationRanges } from "./editorial-evidence.js";

type Scene = ProjectSnapshot["scenes"][number];

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
  if (child.kind === "frames") return parent.kind === "frames" && child.startFrame >= parent.startFrame && child.endFrame <= parent.endFrame;
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

function decisionCovers(decision: CreativeDecision, projectId: string, scene: Scene, treatment?: VisualTreatment): boolean {
  return decision.objectIds.includes(projectId) || decision.objectIds.includes(scene.id) || !!treatment && decision.objectIds.includes(treatment.id)
    || scene.narrativeBeatIds.some(id => decision.objectIds.includes(id))
    || !!treatment?.narrativeBeatId && decision.objectIds.includes(treatment.narrativeBeatId);
}

/** 状态由真实分派、当前采用链和审阅记录派生，保持未知与完成分开。 */
export async function evaluateProductionCoordination(input: {
  report: SkillExecutionReport;
  snapshot: ProjectSnapshot;
  scope: ProductionCompletionScope;
  review?: EditorialQualityReview;
  readRevision: (revision: number) => ProjectSnapshot;
}): Promise<ProductionCoordinationIssue[]> {
  const { report, snapshot, scope, review } = input;
  if (report.intent !== "full_creation" && report.intent !== "visual_rework") return [];
  const issues: ProductionCoordinationIssue[] = [];
  const active = resolveCompositionReachability(snapshot);
  const composition = compileVisualComposition(snapshot, active);
  const primaryIds = new Set(composition.primaryCues.map(cue => cue.id));
  const labels = { director: "导演", creative_research: "创意研究", visual_design: "视觉设计", motion_research: "动效机制研究", review: "审阅" } as const;
  const completeResearch = (decision: CreativeDecision) => decision.researchOutcome === "researched" || decision.researchOutcome === "not_applicable";
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
  const targets: Array<Scene | undefined> = scenes.length ? scenes : [undefined];
  for (const scene of targets) {
    const treatments = scene ? snapshot.visualTreatments.filter(treatment => treatment.sceneId === scene.id
      || !!treatment.narrativeBeatId && scene.narrativeBeatIds.includes(treatment.narrativeBeatId)).filter(treatment => coversScene(snapshot, scope, scene, treatment)) : [];
    const applies = (assignment: ProductionAssignment, treatment?: VisualTreatment) => assignmentScopesOverlap(snapshot, scope, assignment.scope)
      && (!scene || coversScene(snapshot, assignment.scope, scene, treatment)
        || !treatment && treatments.some(item => coversScene(snapshot, assignment.scope, scene, item)));
    const assignmentFor = (responsibility: ProductionAssignment["responsibilities"][number], treatment?: VisualTreatment) => report.assignments.find(assignment => assignment.responsibilities.includes(responsibility)
      && applies(assignment, treatment)
      && !report.assignments.some(other => other.supersedesAssignmentId === assignment.assignmentId && other.responsibilities.includes(responsibility)
        && (!scene ? other.scope.kind === "project" : applies(other, treatment))));
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
    for (const phase of ["creative_research", "motion_research"] as const) {
      const assignment = assignmentFor(phase);
      const research = report.creativeDecisions.find(decision => decision.phase === phase && completeResearch(decision) && decision.assignmentId === assignment?.assignmentId
        && (!scene ? decision.objectIds.includes(snapshot.project.id) : decisionCovers(decision, snapshot.project.id, scene)
          || treatments.some(item => decisionCovers(decision, snapshot.project.id, scene, item))));
      const priorAccepted = scene && treatments.length > 0 && treatments.every(treatment => {
        const adoption = treatment.adoptedDecisionRef?.productionRunId === report.id
          ? report.creativeDecisions.find(item => item.id === treatment.adoptedDecisionRef!.decisionId && item.phase === "adoption") : undefined;
        return !!adoption && (adoption.inputDecisionIds ?? []).some(id => {
          const design = report.creativeDecisions.find(item => item.id === id && item.phase === "visual_design");
          return design?.inputDecisionIds?.some(researchId => report.creativeDecisions.some(item => item.id === researchId && item.phase === phase
            && completeResearch(item) && decisionCovers(item, snapshot.project.id, scene, treatment) && acceptedFor(item, assignmentFor(phase, treatment), adoption)));
        });
      });
      if (assignment && !research && !priorAccepted) add("RESEARCH_PENDING", scene, "pending", `${labels[phase]}尚未完成`, "续接研究负责人", assignment);
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
          else if (linked.length && !linked.some(item => completeResearch(item) && acceptedFor(item, assignmentFor(phase, treatment)))) add("RESEARCH_INPUT_PENDING", scene, "pending", `视觉设计已接收${labels[phase]}结果，当前负责人仍需完成或确认`, "续接当前研究负责人和视觉作者", assignmentFor(phase, treatment), linked.map(item => item.id));
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
      if (!hasVisualTreatmentImplementation(treatment, { cues, cutaways, programs, videoItems, snapshot, ranges })) {
        add("IMPLEMENTATION_PENDING", scene, "pending", "当前视觉计划尚未关联可用实现", "续接原作者完成实际画面", assignmentFor("visual_design", treatment), [adoption.id]);
      }
      for (const phase of ["creative_research", "motion_research"] as const) {
        const linked = designs.flatMap(design => (design.inputDecisionIds ?? []).map(id => report.creativeDecisions.find(item => item.id === id)))
          .filter((item): item is CreativeDecision => !!item && item.phase === phase && decisionCovers(item, snapshot.project.id, scene, treatment));
        if (!linked.length) add("RESEARCH_NOT_CONSUMED", scene, "pending", `当前视觉设计尚未关联${labels[phase]}结果`, "接回研究并续接视觉作者", assignmentFor(phase, treatment), designs.map(item => item.id));
        else if (!linked.some(item => completeResearch(item) && acceptedFor(item, assignmentFor(phase, treatment), adoption))) add("RESEARCH_INPUT_PENDING", scene, "pending", `当前视觉设计已接收${labels[phase]}结果，当前负责人仍需完成或确认`, "续接当前研究负责人和视觉作者", assignmentFor(phase, treatment), linked.map(item => item.id));
      }
      for (const design of designs) {
        if (design.inputRevision === null || design.inputRevision === undefined) {
          add("VISUAL_INPUT_UNKNOWN", scene, "unknown", "视觉设计缺少可核对的项目输入版本", "请视觉作者确认实际输入", assignmentFor("visual_design", treatment), [design.id]);
          continue;
        }
        const before = input.readRevision(design.inputRevision);
        const oldScene = before.scenes.find(item => item.id === scene.id);
        if (!oldScene || motionHandoffDependencyHash(before, scene.id, scene.narrativeBeatIds, oldScene)
          !== motionHandoffDependencyHash(snapshot, scene.id, scene.narrativeBeatIds, scene)) {
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
        const manifest = JSON.parse(bytes.toString("utf8")) as { projectId: string; selectedSceneIds?: string[]; scenes?: Array<{ sceneId: string;
          references?: Array<{ kind: "creative" | "motion"; id: string; sourceSha256: string }>;
          visualRoles?: Array<{ role: string }>;
          visualPlan?: { referenceMappings?: Array<{ referenceId: string; referenceKind?: "creative" | "motion"; targetRole: string; treatment: string }> } }> };
        const selected = manifest.scenes?.filter(item => adoption.deliveryRef!.sceneIds.includes(item.sceneId)) ?? [];
        const coveredScenes = snapshot.scenes.filter(candidate => snapshot.visualTreatments.some(item =>
          (item.sceneId === candidate.id || !!item.narrativeBeatId && candidate.narrativeBeatIds.includes(item.narrativeBeatId))
          && decisionCovers(adoption, snapshot.project.id, candidate, item)));
        const delivered = selected.find(item => item.sceneId === scene.id)
          ?? (selected.length === 1 && coveredScenes.length === 1 && coveredScenes[0].id === scene.id ? selected[0] : undefined);
        if (manifest.projectId !== snapshot.project.id || !delivered || !manifest.selectedSceneIds
          || JSON.stringify([...manifest.selectedSceneIds].sort()) !== JSON.stringify([...adoption.deliveryRef.sceneIds].sort())) throw new Error("scene");
        if (delivered.references?.length) {
          const inputs = designs.flatMap(design => (design.inputDecisionIds ?? []).map(id => report.creativeDecisions.find(item => item.id === id)));
          for (const reference of delivered.references) {
            const mapping = delivered.visualPlan?.referenceMappings?.find(item => item.referenceId === reference.id
              && (!item.referenceKind || item.referenceKind === reference.kind) && item.targetRole?.trim() && item.treatment?.trim()
              && delivered.visualRoles?.some(role => role.role === item.targetRole));
            if (!mapping) add("REFERENCE_MAPPING_MISSING", scene, "missing", `采用参考 ${reference.id} 缺少本场角色映射`, "续接视觉作者补充实际素材与画面关系", assignmentFor("visual_design", treatment), [adoption.id]);
            const studied = inputs.some(item => item?.researchOutcome === "researched" && item.researchReferences?.some(source => source.kind === reference.kind
              && source.id === reference.id && source.sourceSha256 === reference.sourceSha256));
            if (!studied) add("REFERENCE_RESEARCH_UNLINKED", scene, "missing", `采用参考 ${reference.id} 未关联对应研究结果`, "核对研究来源并续接视觉设计", assignmentFor(reference.kind === "creative" ? "creative_research" : "motion_research", treatment), [adoption.id]);
          }
          const evidence = (review?.evidenceRecords ?? []).filter(item => item.source === "workbench"
            && (item.method === "continuous_video" || item.method === "audiovisual")
            && item.adoptionRefs?.some(ref => ref.productionRunId === report.id && ref.decisionId === adoption.id));
          const evidenceIds = new Set(evidence.map(item => item.id));
          const ranges = (review?.applicableEvidence ?? []).filter(item => evidenceIds.has(item.evidenceId));
          const targetRanges = productionObservationRanges(snapshot, scope).map(range => ({ startFrame: Math.max(range.startFrame, scene.startFrame), endFrame: Math.min(range.endFrame, scene.endFrame) }))
            .filter(range => range.startFrame < range.endFrame);
          if (!targetRanges.length || targetRanges.some(range => missingReviewRanges(ranges, range.startFrame, range.endFrame).length)) {
            add("REFERENCE_REVIEW_PENDING", scene, "pending", "当前采用参考尚无覆盖本次范围的对照观察", "续接作者观察并记录实际对照", assignmentFor("review", treatment), [adoption.id]);
          }
        }
      } catch {
        add("DELIVERY_INVALID", scene, "stale", "交付清单不可读、已变化或不覆盖本场", "重新准备并确认交付", assignmentFor("director", treatment), [adoption.id]);
      }
    }
  }
  return issues;
}
