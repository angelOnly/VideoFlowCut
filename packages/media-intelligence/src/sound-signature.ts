import type { ProjectSnapshot } from "@videocut/contracts";
import { timelineAudioDependencies } from "../../edit-domain/src/timeline-audio-dependencies.js";
import { buildRenderPlan } from "../../edit-domain/src/render-plan.js";
import { resolve } from "node:path";
import { matchesRenderContentHash } from "./render-environment.js";
import { digest } from "./index.js";

export const SOUND_REVIEW_DEPENDENCY_VERSION = 2 as const;
export type SoundDependencyInput = {
  method: "audio" | "audiovisual";
  fromFrame: number;
  toFrame: number;
  renderIdentity: string;
};

/** 以混音器同源依赖为基础，保留 Duck 与主声音跨窗口的实际上下文。 */
function reviewAudioDependencies(snapshot: ProjectSnapshot, from: number, to: number) {
  const full = timelineAudioDependencies(snapshot, from, to);
  const ducks = full.audioCues.map(cue => cue.ducking).filter((duck): duck is NonNullable<typeof duck> => Boolean(duck));
  const before = Math.max(12, ...ducks.map(duck => (duck.holdFrames ?? 6) + duck.releaseFrames));
  const after = Math.max(3, ...ducks.map(duck => duck.attackFrames));
  const assets = new Map(full.assets.map(asset => [asset.id, asset]));
  const cues = new Map(full.audioCues.map(cue => [cue.timelineItemId, cue]));
  const tracks = new Map(full.tracks.map(track => [track.id, track]));
  const items = full.items.filter(item => item.endFrame > from - before && item.startFrame < to + after
    && (assets.get(item.assetId)?.hasAudio || cues.has(item.id) || tracks.get(item.trackId)?.name === "Dialogue"));
  const itemIds = new Set(items.map(item => item.id));
  const assetIds = new Set(items.map(item => item.assetId));
  const trackIds = new Set(items.map(item => item.trackId));
  return {
    ...full, items, rendered: full.rendered.filter(id => itemIds.has(id)),
    tracks: full.tracks.filter(track => trackIds.has(track.id)),
    assets: full.assets.filter(asset => assetIds.has(asset.id)),
    audioCues: full.audioCues.filter(cue => itemIds.has(cue.timelineItemId)),
    actorPerformances: full.actorPerformances.filter(entry => itemIds.has(entry.timelineItemId)),
    cutaways: full.cutaways.filter(entry => itemIds.has(entry.timelineItemId)),
    soundPlans: full.soundPlans?.filter(plan => plan.startFrame < to && plan.endFrame > from),
    sourceAudioAlignments: full.sourceAudioAlignments.filter(entry => itemIds.has(entry.sourceTimelineItemId)),
    vlogShotSelects: full.vlogShotSelects.filter(entry => Boolean(entry.timelineItemId && itemIds.has(entry.timelineItemId) || entry.ambientTimelineItemId && itemIds.has(entry.ambientTimelineItemId))),
    vlogAmbientCues: full.vlogAmbientCues.filter(entry => itemIds.has(entry.timelineItemId)),
    multicamGroups: full.multicamGroups.filter(entry => entry.masterAudioTimelineItemId && itemIds.has(entry.masterAudioTimelineItemId)),
    multicamCuts: full.multicamCuts.filter(entry => Boolean(entry.timelineItemId && itemIds.has(entry.timelineItemId)))
  };
}

/** 无素材内容身份时无法证明跨版本复用；原观察仍可保留在其真实版本。 */
function verifiedAsset(snapshot: ProjectSnapshot, asset: ProjectSnapshot["assets"][number], cache?: Map<string, boolean>): boolean {
  if (!asset.sourceHash) return false;
  const path = resolve(snapshot.project.rootPath, asset.managedPath), key = `${path}\u0000${asset.sourceHash}`;
  if (!cache?.has(key)) cache?.set(key, matchesRenderContentHash(path, asset.sourceHash));
  return cache ? cache.get(key)! : matchesRenderContentHash(path, asset.sourceHash);
}

export function soundDependenciesHaveIdentity(snapshot: ProjectSnapshot, from: number, to: number, cache?: Map<string, boolean>): boolean {
  const audio = timelineAudioDependencies(snapshot, from, to);
  return audio.assets.every(asset => {
    if (!audio.rendered.some(id => audio.items.some(item => item.id === id && item.assetId === asset.id))) return true;
    const original = snapshot.assets.find(entry => entry.id === asset.id);
    return Boolean(asset.hash && original && verifiedAsset(snapshot, original, cache));
  });
}

/** 系统字体身份不可确定时，只复用不依赖浏览器文字或字幕的实际媒体画面。 */
export function soundVisualDependenciesHaveIdentity(snapshot: ProjectSnapshot, from: number, to: number, cache?: Map<string, boolean>): boolean {
  const plan = buildRenderPlan(snapshot, from, to);
  if (plan.spans.some(span => span.kind === "browser" || span.captionIds.length > 0)) return false;
  return plan.spans.every(span => span.layers.every(layer => {
    const asset = snapshot.assets.find(entry => entry.id === layer.assetId);
    return Boolean(asset && verifiedAsset(snapshot, asset, cache));
  }));
}

/** 单条观察按方法、真实范围、混音依赖及渲染发行版本独立判断。 */
export function soundDependencySignature(snapshot: ProjectSnapshot, input: SoundDependencyInput): string {
  const { method, fromFrame, toFrame, renderIdentity } = input;
  const audio = reviewAudioDependencies(snapshot, fromFrame, toFrame);
  const visual = method === "audiovisual" ? buildRenderPlan(snapshot, fromFrame, toFrame) : undefined;
  return digest({ version: SOUND_REVIEW_DEPENDENCY_VERSION, method, fromFrame, toFrame, renderIdentity, audio, visual });
}

/** 试听任务既固定当前合成，也固定每个候选文件与参数。 */
export function soundComparisonSignature(snapshot: ProjectSnapshot, input: {
  fromFrame: number; toFrame: number; alternatives: Array<{ assetId: string }>; replaceCueId?: string; includeWithout: boolean;
}, renderIdentity: string): string {
  const candidates = input.alternatives.map(alternative => {
    const asset = snapshot.assets.find(entry => entry.id === alternative.assetId);
    return { alternative, asset: asset && { id: asset.id, path: asset.managedPath, hash: asset.sourceHash, status: asset.status, metadata: asset.metadata } };
  });
  return digest({ base: soundDependencySignature(snapshot, { method: "audiovisual", fromFrame: input.fromFrame, toFrame: input.toFrame, renderIdentity }),
    replaceCueId: input.replaceCueId, includeWithout: input.includeWithout, candidates });
}
