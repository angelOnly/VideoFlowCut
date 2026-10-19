import type { ProductionCompletionScope, EditorialQualityReview, EditorialReviewEvidence, EditorialReviewFinding, EditorialReviewPass, ProjectSnapshot, QualityReport } from "@videocut/contracts";
import { compileVisualComposition, effectBeatRanges, rangesOverlap, resolveCompositionReachability } from "@videocut/domain";

export const EDITORIAL_PASSES: EditorialReviewPass[] = ["audio_only", "mute_visual", "audiovisual", "first_viewer", "mode_specific"];

export function evidenceSupportsPass(evidence: Pick<EditorialReviewEvidence, "method" | "pass">): boolean {
  if (evidence.pass === "audio_only") return evidence.method === "audio";
  if (evidence.pass === "mute_visual") return evidence.method === "continuous_video";
  return evidence.method === "audiovisual";
}

export function missingReviewRanges(ranges: Array<{ startFrame: number; endFrame: number }>, startFrame: number, endFrame: number) {
  const missing: Array<{ startFrame: number; endFrame: number }> = [];
  let cursor = startFrame;
  for (const range of [...ranges].sort((a, b) => a.startFrame - b.startFrame)) {
    if (range.endFrame <= cursor || range.startFrame >= endFrame) continue;
    if (range.startFrame > cursor) missing.push({ startFrame: cursor, endFrame: range.startFrame });
    cursor = Math.min(endFrame, Math.max(cursor, range.endFrame));
  }
  if (cursor < endFrame) missing.push({ startFrame: cursor, endFrame });
  return missing;
}

export function reviewCoverage(review: EditorialQualityReview | undefined, revision: number, duration: number): NonNullable<QualityReport["editorial"]["coverage"]> {
  return EDITORIAL_PASSES.map((pass) => {
    const evidence = (review?.evidenceRecords ?? []).filter((entry) => entry.revision === revision && entry.pass === pass && evidenceSupportsPass(entry));
    // 首次观众轮必须连续看完整片，不能拼合多个互不相邻的观看会话。
    const ranges = pass === "first_viewer" ? evidence.filter((entry) => entry.startFrame === 0 && entry.endFrame === duration) : evidence;
    const missingRanges = missingReviewRanges(ranges, 0, duration);
    return { pass, complete: duration > 0 && missingRanges.length === 0, missingRanges };
  });
}

export function openEditorialFindings(review: EditorialQualityReview | undefined): EditorialReviewFinding[] {
  const resolved = new Set((review?.resolutions ?? []).filter((entry) => entry.revision <= review!.revision).map((entry) => entry.findingId));
  return (review?.findings ?? []).filter((finding) => !resolved.has(finding.id));
}

/** 合并全部 Run 的审计；历史问题保留，只有目标 Revision 的证据能补足本版覆盖。 */
export function mergeEditorialReviews(reviews: EditorialQualityReview[], revision: number): EditorialQualityReview | undefined {
  const eligible = reviews.filter((review) => review.revision <= revision).sort((a, b) => a.reviewedAt.localeCompare(b.reviewedAt));
  if (!eligible.length) return undefined;
  const current = eligible.filter((review) => review.revision === revision);
  const unique = <T>(values: T[], key: (value: T) => string): T[] => [...new Map(values.map((value) => [key(value), value])).values()];
  return {
    revision: current.length ? revision : eligible[eligible.length - 1]!.revision,
    passes: [...new Set(current.flatMap((review) => review.passes))],
    previewEvidence: [...new Set(current.flatMap((review) => review.previewEvidence))],
    findings: unique(eligible.flatMap((review) => review.findings.map((finding) => ({ ...finding, revision: finding.revision ?? review.revision }))), (finding) => finding.id),
    evidenceRecords: unique(eligible.flatMap((review) => review.evidenceRecords ?? []), (evidence) => evidence.id),
    resolutions: unique(eligible.flatMap((review) => review.resolutions ?? []), (resolution) => resolution.findingId),
    reviewedAt: eligible[eligible.length - 1]!.reviewedAt
  };
}

export function productionReconciliation(snapshot: ProjectSnapshot): NonNullable<QualityReport["productionReconciliation"]> {
  const active = resolveCompositionReachability(snapshot);
  const primaryIds = new Set(compileVisualComposition(snapshot, active).primaryCues.map(cue => cue.id));
  return [...snapshot.story.beats].sort((a, b) => a.order - b.order).map((beat) => {
    // 同属一个长 Scene 不代表某个 Cue 实现了这个 Scene 内的每一拍。
    const treatments = snapshot.visualTreatments.filter((entry) => entry.narrativeBeatId === beat.id || (!entry.narrativeBeatId && Boolean(entry.sceneId && beat.sceneIds.includes(entry.sceneId))));
    const cues = snapshot.effectCues.filter((cue) => active.effectCueIds.has(cue.id) && (!cue.visualComposition || primaryIds.has(cue.id)) && (cue.coveredNarrativeBeatIds !== undefined
      ? cue.coveredNarrativeBeatIds.includes(beat.id) : cue.semanticAnchor.type === "narrative_beat" && cue.semanticAnchor.targetId === beat.id));
    const cutaways = snapshot.cutaways.filter((entry) => entry.status === "ready" && treatments.some((treatment) => treatment.id === entry.visualTreatmentId) && active.videoItemIds.has(entry.timelineItemId));
    const programs = snapshot.explainerPrograms.filter((program) => active.explainerProgramIds.has(program.id) && snapshot.narrativeMap?.beats.some((entry) => entry.id === program.narrativeMapBeatId && entry.narrativeBeatId === beat.id));
    const scenes = snapshot.scenes.filter((scene) => beat.sceneIds.includes(scene.id));
    const inScene = (range: { startFrame: number; endFrame: number }) => scenes.some((scene) => range.startFrame < scene.endFrame && range.endFrame > scene.startFrame);
    const audio = snapshot.audioCues.filter((cue) => cue.status === "ready" && active.audioItemIds.has(cue.timelineItemId) && snapshot.timeline.items.some((item) => item.id === cue.timelineItemId && inScene(item)));
    const structuralGaps: NonNullable<QualityReport["productionReconciliation"]>[number]["structuralGaps"] = [];
    const observationNeeds: string[] = [];
    const gap = (code: typeof structuralGaps[number]["code"], objectIds: string[], message: string, assetIds: string[] = []) => structuralGaps.push({ code, objectIds, assetIds, message });
    // Vlog 不被迫补解释计划；只核对该导演实际采用的处理。
    const expectsPlan = snapshot.project.profile === "presenter_motion" || snapshot.project.profile === "visual_explainer"
      || snapshot.project.profile === "hybrid" && scenes.some(scene => ["PresenterScene", "ExplainerScene"].includes(scene.type));
    if (!treatments.length && expectsPlan) gap("missing_treatment", [beat.id, ...beat.sceneIds], "没有明确关联本 Beat 的视觉计划；检查是否遗漏，不能把共用 Scene 当成逐拍计划。");
    const connected = new Set<string>();
    const overlapsBeat = (range: { startFrame: number; endFrame: number }, sceneId: string) => effectBeatRanges(snapshot, beat.id, sceneId).some(target => rangesOverlap(target, range));
    for (const cutaway of cutaways) if (overlapsBeat(cutaway, cutaway.hostSceneId)) connected.add(cutaway.assetId);
    for (const program of programs) for (const id of program.assetIds) connected.add(id);
    for (const cue of cues) {
      if (!overlapsBeat(cue, cue.sceneId)) continue;
      for (const binding of cue.assetBindings) {
        const asset = snapshot.assets.find(entry => entry.id === binding.assetId);
        if (!asset?.motion) { connected.add(binding.assetId); continue; }
        for (const image of asset.motion.imageSources ?? []) connected.add(image.assetId);
        for (const video of asset.motion.videoSources ?? []) {
          // 与作品根时钟的 floor 取帧互逆：首个可消费项目帧取 ceil。
          const startFrame = cue.startFrame + Math.ceil((video.startFrame ?? 0) * snapshot.timeline.fps / asset.motion.fps);
          const endFrame = Math.min(cue.endFrame, cue.startFrame + Math.ceil((video.endFrame ?? asset.motion.frameCount) * snapshot.timeline.fps / asset.motion.fps));
          if (startFrame < endFrame && overlapsBeat({ startFrame, endFrame }, cue.sceneId)) connected.add(video.assetId);
        }
      }
    }
    for (const treatment of treatments) {
      if (treatment.status === "stale") gap("stale_treatment", [treatment.id], `${treatment.id} 需要重新确认失效视觉计划。`);
      else {
        if (["light_overlay", "remotion"].includes(treatment.mode) && !cues.length && !programs.length
          || ["b_roll", "cutaway", "evidence"].includes(treatment.mode) && !cutaways.length && !cues.length && !programs.length) gap("missing_implementation", [treatment.id], `${treatment.id} 未发现明确关联的有效视觉实现。`);
        if (["quiet", "keep_presenter"].includes(treatment.mode) && !treatment.quietReason) observationNeeds.push(`${treatment.id} 需要说明人物保持或留白如何服务观看。`);
      }
      const missing = (treatment.adoptedMaterialAssetIds ?? []).filter(id => !connected.has(id));
      if (missing.length) gap("material_not_connected", [treatment.id], `${treatment.id} 已采用展示资料尚未连接：${missing.join("、")}。`, missing);
      if (treatment.adoptedMaterialAssetIds?.some(id => connected.has(id))) observationNeeds.push(`${treatment.id} 资料绑定已存在；仍需实际观察出现、可读性、遮挡及摘读准确性。`);
    }
    const hasTimedBeat = snapshot.speechSegments.some(segment => segment.semanticUnitIds.some(id => beat.semanticUnitIds.includes(id)) && snapshot.speechAsset?.timing.segments.some(timing => timing.speechSegmentId === segment.id));
    if (!hasTimedBeat && treatments.length) observationNeeds.push("当前仅能按 Scene 粗范围关联，不能证明资料在正确语句出现。");
    const needs = [...structuralGaps.map(entry => entry.message), ...observationNeeds];
    return { beatId: beat.id, title: beat.title, treatmentIds: treatments.map((entry) => entry.id), staleTreatmentIds: treatments.filter((entry) => entry.status === "stale").map((entry) => entry.id), linkedEffectCueIds: cues.map((entry) => entry.id), linkedCutawayIds: cutaways.map((entry) => entry.id), linkedExplainerProgramIds: programs.map((entry) => entry.id), sceneAudioCueIds: audio.map((entry) => entry.id), sceneCaptionIds: snapshot.timeline.captions.filter(inScene).map((entry) => entry.id), sceneIds: beat.sceneIds, structuralGaps, connectedMaterialAssetIds: [...connected], observationNeeds, needs };
  });
}

/** 收口只消费结构缺项；字幕等对象不会反向承担整段旧视觉计划。 */
export function completionReconciliationBlockers(snapshot: ProjectSnapshot, scope: ProductionCompletionScope): string[] {
  const selected = new Set(scope.kind === "objects" ? scope.objectIds : []);
  // 失效对象也保留真实引用；不能只用当前有效对象集合而漏掉本次待修的作品。
  const affectedCues = snapshot.effectCues.filter(cue => selected.has(cue.id) || cue.visualComposition?.replacesActorItemIds.some(id => selected.has(id)) || cue.assetBindings.some(binding => {
    const motion = snapshot.assets.find(asset => asset.id === binding.assetId)?.motion;
    return selected.has(binding.assetId) || [...(motion?.imageSources ?? []), ...(motion?.videoSources ?? [])].some(source => selected.has(source.assetId));
  }));
  return productionReconciliation(snapshot).flatMap(entry => {
    if (scope.kind === "beats" && !scope.beatIds.includes(entry.beatId)) return [];
    const selectedImplementation = affectedCues.some(cue => cue.coveredNarrativeBeatIds?.includes(entry.beatId) || cue.semanticAnchor.type === "narrative_beat" && cue.semanticAnchor.targetId === entry.beatId)
      || snapshot.cutaways.some(cutaway => (selected.has(cutaway.id) || selected.has(cutaway.timelineItemId) || selected.has(cutaway.assetId)) && Boolean(cutaway.visualTreatmentId && entry.treatmentIds.includes(cutaway.visualTreatmentId)))
      || snapshot.explainerPrograms.some(program => selected.has(program.id) && snapshot.narrativeMap?.beats.some(beat => beat.id === program.narrativeMapBeatId && beat.narrativeBeatId === entry.beatId));
    return entry.structuralGaps.filter(gap => scope.kind !== "objects" || entry.sceneIds.some(id => selected.has(id))
      || gap.objectIds.some(id => selected.has(id)) || gap.assetIds.some(id => selected.has(id)) || selectedImplementation).map(gap => `${gap.code}：${gap.message}`);
  });
}
