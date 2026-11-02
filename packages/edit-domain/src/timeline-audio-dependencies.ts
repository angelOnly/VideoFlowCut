import type { ProjectSnapshot } from "@videocut/contracts";
import { resolveCompositionReachability } from "./composition-reachability.js";

/** 与混音器实际输入保持同一边界，审查和缓存不得各自复制选轨规则。 */
export function timelineAudioDependencies(snapshot: ProjectSnapshot, from: number, to: number) {
  const active = resolveCompositionReachability(snapshot);
  const rendered = snapshot.timeline.items.filter(item => {
    const asset = snapshot.assets.find(asset => asset.id === item.assetId), track = snapshot.timeline.tracks.find(track => track.id === item.trackId);
    return (active.audioItemIds.has(item.id) || active.videoItemIds.has(item.id)) && asset?.metadata?.hasAudio
      && !asset.motion && item.mediaAudioPolicy !== "mute" && !track?.muted && item.endFrame > from && item.startFrame < to;
  });
  // Duck 和声音主次还会读取其它 Item 的位置；保留这些声音字段，不把字幕、画面和审阅说明混进来。
  const items = snapshot.timeline.items.map(({ id, assetId, trackId, sceneId, startFrame, endFrame, sourceStartFrame, sourceEndFrame, gainDb, mediaAudioPolicy, disabled }) =>
    ({ id, assetId, trackId, sceneId, startFrame, endFrame, sourceStartFrame, sourceEndFrame, gainDb, mediaAudioPolicy, disabled }));
  return { from, to, fps: snapshot.timeline.fps, gain: snapshot.audioMixGainDb ?? 0, items, rendered: rendered.map(item => item.id),
    tracks: snapshot.timeline.tracks.map(({ id, name, kind, muted })=>({ id, name, kind, muted })),
    assets: snapshot.assets.filter(asset=>items.some(item=>item.assetId===asset.id)).map(asset=>({ id: asset.id, kind: asset.kind,
      hash: rendered.some(item=>item.assetId===asset.id) ? asset.sourceHash : undefined, hasAudio: asset.metadata?.hasAudio, motion: Boolean(asset.motion) })),
    audioCues: snapshot.audioCues.map(({ timelineItemId, status, role, loop, loopCrossfadeFrames, fadeInFrames, fadeOutFrames, ducking, envelope }) =>
      ({ timelineItemId, status, role, loop, loopCrossfadeFrames, fadeInFrames, fadeOutFrames, ducking, envelope })),
    actorPerformances: snapshot.actorPerformances.map(({ timelineItemId, status, audioMode }) => ({ timelineItemId, status, audioMode })),
    cutaways: snapshot.cutaways.map(({ timelineItemId, status, audioMode }) => ({ timelineItemId, status, audioMode })),
    speech: Boolean(snapshot.speechAsset),
    soundPlans: snapshot.soundPlans?.map(({ status, startFrame, endFrame, dominantRole, dominantRanges }) => ({ status, startFrame, endFrame, dominantRole, dominantRanges })),
    sourceAudioAlignments: snapshot.sourceAudioAlignments.map(({ status, sourceTimelineItemId, sourceStartFrame, sourceEdit, segments }) =>
      ({ status, sourceTimelineItemId, sourceStartFrame, originSourceFrame: sourceEdit?.originSourceFrame, segments: segments.map(({ startMs, endMs }) => ({ startMs, endMs })) })),
    vlogShotSelects: snapshot.vlogShotSelects.map(({ id, status, timelineItemId, ambientTimelineItemId, sourceAudioMode }) => ({ id, status, timelineItemId, ambientTimelineItemId, sourceAudioMode })),
    vlogAmbientCues: snapshot.vlogAmbientCues.map(({ status, timelineItemId, shotSelectId, assetId }) => ({ status, timelineItemId, shotSelectId, assetId })),
    multicamGroups: snapshot.multicamGroups.map(({ status, sceneId, masterAudioTimelineItemId, masterAudioAssetId }) => ({ status, sceneId, masterAudioTimelineItemId, masterAudioAssetId })),
    multicamCuts: snapshot.multicamCuts.map(({ status, timelineItemId }) => ({ status, timelineItemId })) };
}
