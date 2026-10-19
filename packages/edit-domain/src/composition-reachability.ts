import { inspectEffectContentContract, type ProjectSnapshot } from "@videocut/contracts";

/**
 * 当前 Composition 真正会消费的对象集合。
 *
 * 它不是第二份项目状态：每次均从不可变 Revision Snapshot 即时推导。Renderer、
 * 交付预检、来源清单和质量中的素材就绪检查必须共用这一边界，避免旧对象、
 * 隐藏轨道或不会渲染的 Cue 被误算为成片依赖。
 */
export interface CompositionReachability {
  videoItemIds: ReadonlySet<string>;
  audioItemIds: ReadonlySet<string>;
  effectCueIds: ReadonlySet<string>;
  explainerProgramIds: ReadonlySet<string>;
  assetIds: ReadonlySet<string>;
}

function resolvePlaybackReachability(snapshot: ProjectSnapshot): CompositionReachability {
  const tracksById = new Map(snapshot.timeline.tracks.map((track) => [track.id, track]));
  const staleCutawayItemIds = new Set((snapshot.cutaways ?? [])
    .filter((cutaway) => cutaway.status === "stale")
    .map((cutaway) => cutaway.timelineItemId));
  const videoItemIds = new Set(snapshot.timeline.items
    .filter((item) => {
      const track = tracksById.get(item.trackId);
      return track?.kind === "video" && !track.hidden && !item.disabled && !staleCutawayItemIds.has(item.id);
    })
    .map((item) => item.id));
  const audioItemIds = new Set(snapshot.timeline.items
    .filter((item) => {
      const track = tracksById.get(item.trackId);
      return track?.kind === "audio" && !track.muted && !item.disabled;
    })
    .map((item) => item.id));
  const effectCueIds = new Set((snapshot.effectCues ?? [])
    .filter((cue) => cue.status === "ready" && inspectEffectContentContract(cue, snapshot.assets, snapshot.timeline).ready)
    .map((cue) => cue.id));
  const explainerProgramIds = new Set((snapshot.explainerPrograms ?? [])
    .filter((program) => !program.disabled && program.status === "ready" && snapshot.scenes.some((scene) => (
      scene.id === program.sceneId && scene.type === "ExplainerScene" && scene.status === "ready"
    )))
    .map((program) => program.id));

  const assetIds = new Set<string>();
  for (const item of snapshot.timeline.items) {
    if (videoItemIds.has(item.id) || audioItemIds.has(item.id)) assetIds.add(item.assetId);
  }
  for (const cue of snapshot.effectCues ?? []) {
    if (!effectCueIds.has(cue.id)) continue;
    for (const binding of cue.assetBindings ?? []) assetIds.add(binding.assetId);
  }
  for (const program of snapshot.explainerPrograms ?? []) {
    if (!explainerProgramIds.has(program.id)) continue;
    for (const assetId of program.assetIds) assetIds.add(assetId);
  }

  return { videoItemIds, audioItemIds, effectCueIds, explainerProgramIds, assetIds };
}

export type VisualRange = { startFrame: number; endFrame: number };
export const rangesOverlap = (a: VisualRange, b: VisualRange) => a.startFrame < b.endFrame && b.startFrame < a.endFrame;

/** 半开区间相减，供原生可见性和主画面缺口共用。 */
export function uncoveredVisualRanges(range: VisualRange, covered: VisualRange[]): VisualRange[] {
  const result: VisualRange[] = [];
  let cursor = range.startFrame;
  for (const entry of [...covered].sort((a, b) => a.startFrame - b.startFrame)) {
    if (entry.endFrame <= cursor || entry.startFrame >= range.endFrame) continue;
    if (entry.startFrame > cursor) result.push({ startFrame: cursor, endFrame: entry.startFrame });
    cursor = Math.min(range.endFrame, Math.max(cursor, entry.endFrame));
  }
  if (cursor < range.endFrame) result.push({ startFrame: cursor, endFrame: range.endFrame });
  return result;
}

/** 派生结果不保存；画面接管永远不删除原生声音和媒体依赖。 */
export function compileVisualComposition(snapshot: ProjectSnapshot, active = resolvePlaybackReachability(snapshot)) {
  const issues: Array<{ code: string; objectId: string; relatedObjectIds: string[]; frameRange: VisualRange; message: string }> = [];
  const declarations = snapshot.effectCues.filter(cue => cue.status === "ready" && cue.visualComposition);
  const invalid = new Set<string>();
  const fail = (cue: typeof declarations[number], code: string, message: string, relatedObjectIds: string[] = [], frameRange: VisualRange = cue) => {
    invalid.add(cue.id);
    issues.push({ code, objectId: cue.id, relatedObjectIds, frameRange: { startFrame: frameRange.startFrame, endFrame: frameRange.endFrame }, message });
  };
  for (const cue of declarations) {
    const scene = snapshot.scenes.find(entry => entry.id === cue.sceneId);
    if (cue.type !== "ManagedMotion" || cue.layer !== "fullscreen" || cue.visualComposition!.role !== "primary"
      || !scene || scene.status === "stale" || cue.startFrame < scene.startFrame || cue.endFrame > scene.endFrame) {
      fail(cue, "VISUAL_COMPOSITION_INVALID", "主场面接管仅支持有效 Scene 内的 fullscreen ManagedMotion。");
    }
    const ids = cue.visualComposition!.replacesActorItemIds;
    if (new Set(ids).size !== ids.length) fail(cue, "VISUAL_COMPOSITION_DUPLICATE_ITEM", "被接管人物 Item 不得重复。");
    for (const id of ids) {
      const item = snapshot.timeline.items.find(entry => entry.id === id);
      const track = snapshot.timeline.tracks.find(entry => entry.id === item?.trackId);
      const asset = snapshot.assets.find(entry => entry.id === item?.assetId);
      const actor = track?.name === "Actor / A-roll" || snapshot.actorPerformances.some(entry => entry.timelineItemId === id);
      if (!item || !actor || track?.kind !== "video" || !asset || !["video", "actor_video"].includes(asset.kind) || asset.motion || !rangesOverlap(cue, item)) {
        fail(cue, "VISUAL_COMPOSITION_ACTOR_INVALID", `接管引用必须是与 Cue 相交的真实人物视频 Item：${id}。`, [id]);
      }
    }
  }
  for (let i = 0; i < declarations.length; i++) for (const other of declarations.slice(i + 1)) {
    const cue = declarations[i]!;
    if (!rangesOverlap(cue, other)) continue;
    const range = { startFrame: Math.max(cue.startFrame, other.startFrame), endFrame: Math.min(cue.endFrame, other.endFrame) };
    fail(cue, "VISUAL_COMPOSITION_OVERLAP", `主场面 ${cue.id} 与 ${other.id} 责任范围重叠。`, [other.id], range);
    invalid.add(other.id);
  }
  const primaryCues = declarations.filter(cue => !invalid.has(cue.id) && active.effectCueIds.has(cue.id));
  const replacedActorRanges = new Map<string, VisualRange[]>();
  for (const cue of primaryCues) for (const id of cue.visualComposition!.replacesActorItemIds) {
    const item = snapshot.timeline.items.find(entry => entry.id === id)!;
    const range = { startFrame: Math.max(item.startFrame, cue.startFrame), endFrame: Math.min(item.endFrame, cue.endFrame) };
    replacedActorRanges.set(id, [...(replacedActorRanges.get(id) ?? []), range]);
    for (const dependent of snapshot.effectCues) {
      if (dependent.id === cue.id || dependent.status !== "ready" || dependent.sceneId !== item.sceneId || !rangesOverlap(dependent, range)) continue;
      if (dependent.type !== "CameraPunch" && !["actor_head", "actor_hands", "behind_actor"].includes(dependent.spatialAnchor) && !dependent.qualityRules.includes("actor_mask_required")) continue;
      issues.push({ code: "VISUAL_COMPOSITION_ACTOR_SPACE_CONFLICT", objectId: dependent.id, relatedObjectIds: [cue.id, id], frameRange: { startFrame: Math.max(range.startFrame, dependent.startFrame), endFrame: Math.min(range.endFrame, dependent.endFrame) }, message: `效果 ${dependent.id} 仍使用被 ${cue.id} 接管的人物 ${id} 的原生坐标；请合并到同一作品或调整范围。` });
    }
  }
  const nativeVisibleRanges = new Map(snapshot.timeline.items.filter(item => active.videoItemIds.has(item.id)).map(item => [item.id, uncoveredVisualRanges(item, replacedActorRanges.get(item.id) ?? [])]));
  return { primaryCues, replacedActorRanges, nativeVisibleRanges, issues };
}

export function resolveCompositionReachability(snapshot: ProjectSnapshot): CompositionReachability {
  const active = resolvePlaybackReachability(snapshot);
  const visual = compileVisualComposition(snapshot, active);
  const assetIds = new Set(active.assetIds);
  for (const performance of snapshot.actorPerformances ?? []) {
    if (performance.status === "ready" && performance.maskAssetId && visual.nativeVisibleRanges.get(performance.timelineItemId)?.length) assetIds.add(performance.maskAssetId);
  }
  return { ...active, assetIds };
}

/** 只有实际主视觉能填补缺口，角落装饰和普通字幕不计入。 */
export function primaryVisualRanges(snapshot: ProjectSnapshot): VisualRange[] {
  const active = resolveCompositionReachability(snapshot);
  const visual = compileVisualComposition(snapshot, active);
  const ranges: VisualRange[] = [...visual.primaryCues];
  for (const item of snapshot.timeline.items) {
    if (!active.videoItemIds.has(item.id) || !snapshot.assets.some(asset => asset.id === item.assetId && asset.status === "ready")) continue;
    const cutaway = snapshot.cutaways.find(entry => entry.timelineItemId === item.id);
    const track = snapshot.timeline.tracks.find(entry => entry.id === item.trackId);
    if (cutaway ? cutaway.status === "ready" && cutaway.mode === "fullscreen" : track && (track.name === "Actor / A-roll" || track.name === "Background" && snapshot.project.profile !== "presenter_motion")) ranges.push(...(visual.nativeVisibleRanges.get(item.id) ?? []));
  }
  for (const program of snapshot.explainerPrograms) if (active.explainerProgramIds.has(program.id)) {
    const scene = snapshot.scenes.find(entry => entry.id === program.sceneId)!;
    if (program.assetIds.every(id => snapshot.assets.some(asset => asset.id === id && asset.status === "ready"))) ranges.push(scene);
  }
  for (const cue of snapshot.effectCues) {
    if (cue.type === "ManagedMotion" && cue.layer === "fullscreen" && active.effectCueIds.has(cue.id)
      && snapshot.scenes.some(scene => scene.id === cue.sceneId && scene.type === "ExplainerScene" && scene.status === "ready")) ranges.push(cue);
  }
  return ranges;
}
