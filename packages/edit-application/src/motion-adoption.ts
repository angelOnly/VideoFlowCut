import { createHash } from "node:crypto";
import type { FrozenMotionContinuation, ImpactReport, MotionContinuationResult, MotionOnSuccess, ProjectSnapshot } from "@videocut/contracts";
import { motionWorkForCue, motionWorkVersion, inspectEffectContentContract } from "@videocut/contracts";
import { assertEffectCoverage, compileVisualComposition, createEffectCue, DomainError } from "@videocut/domain";
import { assertEffectCueRange } from "./effect-cue-validation.js";
import { bindEffectAudioEvent } from "./effect-audio-events.js";
import { motionAuthoringInputsCurrent, motionCueDependencySignature, motionTreatmentSignature } from "./motion-dependencies.js";
import { replaceMotionRange } from "./motion-range-replacement.js";

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b)).map(([key, v]) => [key, canonical(v)]));
  return value;
}
export function validateMotionContinuation(snapshot: ProjectSnapshot, request: MotionOnSuccess): void {
  if (request.action === "create_cue") {
    const scene = snapshot.scenes.find(entry => entry.id === request.sceneId);
    if (!scene) throw new DomainError("采用目标 Scene 不存在", "SCENE_NOT_FOUND");
    assertEffectCueRange(scene, request, "create");
    if (request.sourceEndFrame <= request.sourceStartFrame || request.sourceEndFrame - request.sourceStartFrame !== request.endFrame - request.startFrame)
      throw new DomainError("作品源范围必须与目标范围等长", "MOTION_RANGE_INVALID");
    if (request.layer === "fullscreen" && snapshot.effectCues.some(cue => cue.type === "ManagedMotion" && cue.layer === "fullscreen" && cue.status === "ready" && cue.startFrame < request.endFrame && cue.endFrame > request.startFrame))
      throw new DomainError("目标范围已有全屏受管画面，请使用替换", "MOTION_ADOPTION_TARGET_INVALID");
    return;
  }
  const cue = snapshot.effectCues.find(entry => entry.id === request.cueId);
  if (!cue || cue.type !== "ManagedMotion" || !motionWorkForCue(snapshot, cue)) throw new DomainError("采用目标必须是已登记的受管画面", "MOTION_ADOPTION_TARGET_INVALID");
  if (request.audioPolicy !== "rebind_unchanged_events") throw new DomainError("请明确声音事件处理策略", "MOTION_ADOPTION_AUDIO_POLICY");
  if (request.action === "replace_range") {
    const target = request.targetRange;
    if (!Number.isInteger(target?.startFrame) || !Number.isInteger(target?.endFrame) || target.startFrame < cue.startFrame
      || target.endFrame > cue.endFrame || target.endFrame <= target.startFrame) throw new DomainError("采用范围必须位于目标画面内", "MOTION_RANGE_INVALID");
  } else if (request.action !== "replace_cue") throw new DomainError("不支持的作品采用动作", "MOTION_ADOPTION_ACTION_INVALID");
}

/** 比较交付准备时实际相关的场面、内容与声音，允许其他场面继续变化。 */
export function motionHandoffDependencyHash(snapshot: ProjectSnapshot, sceneId: string, beatIds: string[], range: { startFrame: number; endFrame: number }): string {
  const scene = snapshot.scenes.find(item => item.id === sceneId);
  const beats = beatIds.map(id => snapshot.story.beats.find(beat => beat.id === id));
  const unitIds = new Set(beats.flatMap(beat => beat?.semanticUnitIds ?? []));
  const segments = snapshot.speechSegments.filter(segment => segment.semanticUnitIds.some(id => unitIds.has(id)));
  const segmentIds = new Set(segments.map(segment => segment.id));
  const items = snapshot.timeline.items.filter(item => segmentIds.size && item.assetId === snapshot.speechAsset?.assetId
    && item.startFrame < range.endFrame && item.endFrame > range.startFrame);
  return createHash("sha256").update(JSON.stringify(canonical({
    scene: scene && { id: scene.id, type: scene.type, title: scene.title, purpose: scene.purpose,
      startFrame: scene.startFrame, endFrame: scene.endFrame, status: scene.status, stylePackId: scene.stylePackId,
      narrativeBeatIds: scene.narrativeBeatIds.filter(id => beatIds.includes(id)) },
    beats, units: snapshot.semanticUnits.filter(unit => unitIds.has(unit.id)), segments,
    speech: segmentIds.size ? { assetId: snapshot.speechAsset?.assetId,
      timing: snapshot.speechAsset?.timing.segments.filter(item => segmentIds.has(item.speechSegmentId)), items } : undefined,
    canvas: { width: snapshot.timeline.width, height: snapshot.timeline.height, fps: snapshot.timeline.fps }
  }))).digest("hex");
}

/** 只冻结目标真正依赖的内容，无关素材、字幕和其它段落不会挡住采用。 */
export function motionTargetDependencyHash(snapshot: ProjectSnapshot, request: MotionOnSuccess, visualTreatmentIds?: string[]): string {
  if (request.action === "create_cue") {
    const overlapping = (entry: { startFrame: number; endFrame: number }) => entry.startFrame < request.endFrame && entry.endFrame > request.startFrame;
    const cues = snapshot.effectCues.filter(cue => cue.sceneId === request.sceneId && overlapping(cue));
    const items = snapshot.timeline.items.filter(item => item.sceneId === request.sceneId && overlapping(item));
    const assets = new Set(items.map(item => item.assetId));
    const scene = snapshot.scenes.find(item => item.id === request.sceneId);
    const beatIds = request.coveredNarrativeBeatIds ?? scene?.narrativeBeatIds ?? [];
    const beats = snapshot.story.beats.filter(beat => beatIds.includes(beat.id));
    const unitIds = new Set(beats.flatMap(beat => beat.semanticUnitIds));
    const segments = snapshot.speechSegments.filter(segment => segment.semanticUnitIds.some(id => unitIds.has(id)));
    const segmentIds = new Set(segments.map(segment => segment.id));
    return createHash("sha256").update(JSON.stringify(canonical({
      scene, cues, items, beats, units: snapshot.semanticUnits.filter(unit => unitIds.has(unit.id)), segments,
      speech: segmentIds.size ? { assetId: snapshot.speechAsset?.assetId,
        timing: snapshot.speechAsset?.timing.segments.filter(item => segmentIds.has(item.speechSegmentId)) } : undefined,
      treatments: (visualTreatmentIds ?? []).map(id => [id, motionTreatmentSignature(snapshot, id)]),
      tracks: snapshot.timeline.tracks.filter(track => items.some(item => item.trackId === track.id)),
      assets: snapshot.assets.filter(asset => assets.has(asset.id)).map(asset => ({ id: asset.id, hash: asset.sourceHash, status: asset.status })),
      canvas: { width: snapshot.timeline.width, height: snapshot.timeline.height, fps: snapshot.timeline.fps },
      sourceDisplayPolicy: snapshot.project.brief.sourceDisplayPolicy
    }))).digest("hex");
  }
  const cue = snapshot.effectCues.find(entry => entry.id === request.cueId);
  const sounds = snapshot.audioCues.filter(audio => audio.effectEvent?.effectCueId === request.cueId);
  const cueContent = cue ? (({ workDefinitionHash: _definitionHash, ...content }) => content)(cue) : undefined;
  const assets = new Set([...(cue?.assetBindings.map(binding => binding.assetId) ?? []),
    ...sounds.flatMap(audio => snapshot.timeline.items.filter(item => item.id === audio.timelineItemId).map(item => item.assetId))]);
  return createHash("sha256").update(JSON.stringify(canonical({
    cue: cueContent, work: cue ? motionWorkForCue(snapshot, cue) : undefined,
    dependencies: cue ? motionCueDependencySignature(snapshot, cue) : null,
    treatments: (visualTreatmentIds ?? []).map(id => [id, motionTreatmentSignature(snapshot, id)]),
    assets: snapshot.assets.filter(asset => assets.has(asset.id)).map(asset => ({
      id: asset.id, hash: asset.sourceHash, status: asset.status
    })),
    sounds, items: snapshot.timeline.items.filter(item => sounds.some(audio => audio.timelineItemId === item.id)),
    sourceDisplayPolicy: snapshot.project.brief.sourceDisplayPolicy,
    range: request.action === "replace_range" ? request.targetRange : undefined
  }))).digest("hex");
}

export type AdoptionMutation = Omit<Extract<MotionContinuationResult, { status: "applied" }>, "appliedRevision" | "previewJobId">
  | Extract<MotionContinuationResult, { status: "needs_reconfirmation" }>;

/** 先在候选副本完成全部变更；事件不一致时连原画面与音轨也不改变。 */
export function applyMotionAdoption(snapshot: ProjectSnapshot, impact: ImpactReport, workId: string, frozen: FrozenMotionContinuation, definitionHash?: string): AdoptionMutation {
  const request = frozen.request;
  const conflict = (reason: string): AdoptionMutation => ({
    status: "needs_reconfirmation", workId, conflicts: [{ objectId: request.action === "create_cue" ? request.sceneId : request.cueId, reason }]
  });
  const treatmentIds = frozen.authoringInputs?.map(input => input.visualTreatmentId);
  if (motionTargetDependencyHash(snapshot, request, treatmentIds) !== frozen.targetDependencyHash
    || !motionAuthoringInputsCurrent(snapshot, frozen.authoringInputs)) return conflict("目标画面、采用稿、内容或关联声音已改变，请读回后明确重新采用");
  const candidate = structuredClone(snapshot), delta = structuredClone(impact);
  try {
    validateMotionContinuation(candidate, request);
    const selectedWork = motionWorkVersion(candidate.motionWorks, workId, definitionHash);
    if (!selectedWork) return conflict("目标作品的固定版本不存在");
    let segments;
    if (request.action === "create_cue") {
      const cue = createEffectCue({ ...request, type: "ManagedMotion", workId, workDefinitionHash: selectedWork.definitionHash });
      if (frozen.authoringInputs?.length) cue.authoringInputs = structuredClone(frozen.authoringInputs);
      assertEffectCoverage(candidate, cue);
      const content = inspectEffectContentContract(cue, candidate.assets, candidate.timeline, candidate.motionWorks);
      if (!content.ready) return conflict(content.missing.join("；"));
      candidate.effectCues.push(cue);
      const issue = compileVisualComposition(candidate).issues[0];
      if (issue) return conflict(issue.message);
      delta.changed.push(cue.id);
      delta.dirtyRanges.push({ startFrame: cue.startFrame, endFrame: cue.endFrame, reason: "首次采用源码画面；等待实际声画观察" });
      segments = [cue];
    } else if (request.action === "replace_range") {
      const oldCue = candidate.effectCues.find(entry => entry.id === request.cueId)!;
      if (!frozen.authoringInputs?.length && !motionAuthoringInputsCurrent(candidate, oldCue.authoringInputs)) return conflict("当前采用稿已变化，请使用新的视觉计划续修");
      segments = replaceMotionRange(candidate, delta, { cueId: request.cueId, workId, definitionHash: selectedWork.definitionHash, authoringInputs: frozen.authoringInputs, ...request.targetRange });
    } else {
      const cue = candidate.effectCues.find(entry => entry.id === request.cueId)!;
      if (!frozen.authoringInputs?.length && !motionAuthoringInputsCurrent(candidate, cue.authoringInputs)) return conflict("当前采用稿已变化，请使用新的视觉计划续修");
      const old = motionWorkForCue(candidate, cue);
      const next = selectedWork;
      if (!old || !next
        || old.width !== next.width || old.height !== next.height || old.fps !== next.fps
        || old.frameCount !== next.frameCount) return conflict("作品画幅、总时长或根范围改变，需要作者明确编排");
      cue.workId = workId; cue.workDefinitionHash = next.definitionHash; cue.assetBindings = []; cue.status = "ready";
      if (frozen.authoringInputs?.length) cue.authoringInputs = structuredClone(frozen.authoringInputs);
      // 作品换版后，先按真实新事件重绑，再交统一 reconcile；不让旧签名静默禁音。
      for (const audio of candidate.audioCues.filter(entry => entry.effectEvent?.effectCueId === cue.id && entry.status === "ready")) {
        const binding = audio.effectEvent!;
        if (!binding.eventId) return conflict("旧音效没有可核对的作品事件ID，需要明确落点");
        try {
          audio.effectEvent = bindEffectAudioEvent(candidate, { ...binding, workVersion: next.version }, audio.eventFrame!);
        } catch (error) {
          if (error instanceof DomainError) return conflict(`音效“${audio.purpose}”绑定的动作“${binding.eventId}”需要重新安排：${error.message}`);
          throw error;
        }
        delta.changed.push(audio.id);
      }
      delta.changed.push(cue.id);
      delta.dirtyRanges.push({ startFrame: cue.startFrame, endFrame: cue.endFrame, reason: "采用新版画面及不变事件；等待实际声画观察" });
      segments = [cue];
    }
    for (const cue of segments) {
      if (cue.status === "stale") continue;
      assertEffectCoverage(candidate, cue);
      const content = inspectEffectContentContract(cue, candidate.assets, candidate.timeline, candidate.motionWorks);
      if (!content.ready) return conflict(content.missing.join("；"));
    }
    Object.assign(snapshot, candidate);
    Object.assign(impact, delta);
    return { status: "applied", workId, cueSegments: { ...(request.action !== "create_cue" ? { oldCueId: request.cueId } : {}), segments: segments.map(cue => ({
      cueId: cue.id, startFrame: cue.startFrame, endFrame: cue.endFrame
    })) } };
  } catch (error) {
    if (error instanceof DomainError) return conflict(error.message);
    throw error;
  }
}
