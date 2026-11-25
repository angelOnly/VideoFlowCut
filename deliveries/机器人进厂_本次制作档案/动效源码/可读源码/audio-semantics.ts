import { sourceAudioTimeOrigin, type ActorPerformance, type AudioCue, type Cutaway, type ProjectSnapshot, type TimelineItem, type TimelineTrack } from "@videocut/contracts";
import { cutawaySourceVolume } from "./cutaway-layout.js";

const itemDuration = (item: TimelineItem) => item.endFrame - item.startFrame;
const itemVolume = (item: TimelineItem, track: TimelineTrack) => track.muted || item.mediaAudioPolicy === "mute" ? 0 : Math.pow(10, (item.gainDb ?? 0) / 20);

const dbToVolume = (gainDb: number) => Math.pow(10, gainDb / 20);

/**
 * Vlog 的画面与现场声必须走两条不同的播放路径：Background 只负责画面，
 * Ambient 才负责被明确保留的原始现场声。这里不依赖 gainDb 的约定，避免后续
 * 修改 Timeline 时意外把同一源声播放两次。
 */
export function resolveVideoSourceVolume(
  snapshot: ProjectSnapshot,
  item: TimelineItem,
  track: TimelineTrack,
  performance?: ActorPerformance,
  cutaway?: Cutaway
): number {
  if (item.mediaAudioPolicy === "mute") return 0;
  if (cutaway) return cutawaySourceVolume(cutaway, item, track);
  const isVlogPrimaryVideo = (snapshot.vlogShotSelects ?? []).some((select) => select.status === "ready" && select.timelineItemId === item.id);
  const isMulticamPrimaryVideo = (snapshot.multicamCuts ?? []).some((cut) => cut.status === "ready" && cut.timelineItemId === item.id);
  if (isVlogPrimaryVideo || isMulticamPrimaryVideo) return 0;
  // 有 Dialogue 时，未登记的旧人物 Item 也默认静音，优先避免“原声 + OmniVoice”双重播放。
  const audioMode = performance?.audioMode ?? (snapshot.speechAsset ? "use_dialogue_track" : "use_source_audio");
  return audioMode === "use_source_audio" ? itemVolume(item, track) : 0;
}

/**
 * 返回 undefined 表示这不是 Vlog Ambient Item，调用方应继续沿用普通 AudioCue 混音。
 * 返回 0 则代表它声称属于 Vlog，但缺少 keep Select 或可追溯 AmbientCue，不能静默播放。
 */
export function resolveVlogAmbientVolume(snapshot: ProjectSnapshot, item: TimelineItem, track: TimelineTrack): number | undefined {
  if (track.name !== "Ambient") return undefined;
  const multicamGroup = (snapshot.multicamGroups ?? []).find((group) => group.masterAudioTimelineItemId === item.id);
  if (multicamGroup) {
    const valid = multicamGroup.status === "ready" && multicamGroup.sceneId === item.sceneId
      && multicamGroup.masterAudioAssetId === item.assetId && !item.disabled && (item.gainDb ?? 0) > -80;
    return valid ? itemVolume(item, track) : 0;
  }
  const select = (snapshot.vlogShotSelects ?? []).find((candidate) => candidate.ambientTimelineItemId === item.id);
  if (!select) return undefined;
  const cue = (snapshot.vlogAmbientCues ?? []).find((candidate) => candidate.timelineItemId === item.id);
  if (!cue
    || cue.status !== "ready"
    || select.status !== "ready"
    || select.sourceAudioMode !== "keep"
    || select.ambientTimelineItemId !== item.id
    || cue.shotSelectId !== select.id
    || cue.assetId !== item.assetId) {
    return 0;
  }
  return itemVolume(item, track);
}

/** 当前帧的 Duck 强度取 Dialogue 的实际可听区间；短停顿不会立即把音乐推回原音量。 */
function duckIntensityAt(snapshot: ProjectSnapshot, frame: number, cue: AudioCue): number {
  const ducking = cue.ducking;
  if (!ducking?.enabled) return 0;
  const tracksById = new Map(snapshot.timeline.tracks.map((track) => [track.id, track]));
  let intensity = 0;
  for (const item of snapshot.timeline.items) {
    const track = tracksById.get(item.trackId);
    if (!track || track.muted || item.disabled || item.mediaAudioPolicy === "mute" || (item.gainDb ?? 0) <= -80 || item.id === cue.timelineItemId) continue;
    const otherCue = snapshot.audioCues.find((entry) => entry.timelineItemId === item.id && entry.status === "ready");
    const role = otherCue?.role ?? (track.name === "Dialogue" ? "narration" : undefined);
    const sourceAudible = !otherCue && snapshot.assets.some((asset) => asset.id === item.assetId && asset.metadata?.hasAudio && ["video", "actor_video"].includes(asset.kind))
      && resolveVideoSourceVolume(snapshot, item, track, snapshot.actorPerformances.find((performance) => performance.timelineItemId === item.id), snapshot.cutaways.find((cutaway) => cutaway.timelineItemId === item.id)) > 0;
    if (cue.role ? !["narration", "source_speech", "demonstration"].includes(role ?? "") && !sourceAudible : track.name !== "Dialogue") continue;
    const dominant = (snapshot.soundPlans ?? []).filter((plan) => plan.status === "current" && frame >= plan.startFrame && frame < plan.endFrame).flatMap((plan) => {
      const overrides = plan.dominantRanges?.filter((range) => frame >= range.startFrame && frame < range.endFrame).map((range) => range.role);
      return overrides?.length ? overrides : [plan.dominantRole];
    });
    if (cue.role && dominant.includes(cue.role)) continue;
    const alignment = snapshot.sourceAudioAlignments.find((entry) => entry.status === "ready" && entry.sourceTimelineItemId === item.id);
    const ranges = cue.role && alignment?.segments.length ? alignment.segments.map((segment) => ({ startFrame: Math.max(item.startFrame, item.startFrame + sourceAudioTimeOrigin(alignment) - item.sourceStartFrame + segment.startMs * snapshot.timeline.fps / 1000), endFrame: Math.min(item.endFrame, item.startFrame + sourceAudioTimeOrigin(alignment) - item.sourceStartFrame + segment.endMs * snapshot.timeline.fps / 1000) })) : [{ startFrame: item.startFrame, endFrame: item.endFrame }];
    if (cue.role) {
      for (const range of ranges) {
        const hold = ducking.holdFrames ?? 6;
        if (frame >= range.startFrame && frame < range.endFrame + hold) intensity = 1;
        else if (frame < range.startFrame && ducking.attackFrames > 0) intensity = Math.max(intensity, 1 - (range.startFrame - frame) / ducking.attackFrames);
        else if (frame >= range.endFrame + hold && ducking.releaseFrames > 0) intensity = Math.max(intensity, 1 - (frame - range.endFrame - hold) / ducking.releaseFrames);
      }
      continue;
    }
    if (frame >= item.startFrame && frame < item.endFrame) {
      const attack = ducking.attackFrames;
      intensity = Math.max(intensity, attack === 0 ? 1 : Math.min(1, (frame - item.startFrame + 1) / attack));
      continue;
    }
    if (frame >= item.endFrame && ducking.releaseFrames > 0) {
      intensity = Math.max(intensity, Math.max(0, 1 - (frame - item.endFrame) / ducking.releaseFrames));
    }
  }
  return Math.max(0, Math.min(1, intensity));
}

/** 明确让内容声音主导时，真实 Dialogue/人物原声也要退让，不能只取消演示声自己的 Duck。 */
export function plannedVoiceVolumeAt(snapshot: ProjectSnapshot, item: TimelineItem, role: "narration" | "source_speech", frame: number): number {
  let gain = 1;
  for (const plan of snapshot.soundPlans ?? []) {
    if (plan.status !== "current" || frame < plan.startFrame || frame >= plan.endFrame) continue;
    const ranges = plan.dominantRanges?.filter((range) => frame >= range.startFrame && frame < range.endFrame) ?? [];
    const dominant = ranges.length ? ranges.map((range) => range.role) : [plan.dominantRole];
    if (dominant.includes(role)) continue;
    for (const primary of snapshot.audioCues) {
      if (primary.status !== "ready" || !primary.role || !dominant.includes(primary.role) || primary.timelineItemId === item.id) continue;
      const voiceTarget = snapshot.timeline.items.find((entry) => entry.id === primary.timelineItemId);
      const track = snapshot.timeline.tracks.find((entry) => entry.id === voiceTarget?.trackId);
      if (!voiceTarget || !track || voiceTarget.disabled || itemVolume(voiceTarget, track) <= 0.0001) continue;
      const attack = primary.ducking?.attackFrames ?? 3, release = primary.ducking?.releaseFrames ?? 12;
      const strength = frame < voiceTarget.startFrame ? (attack ? 1 - (voiceTarget.startFrame - frame) / attack : 0)
        : frame >= voiceTarget.endFrame ? (release ? 1 - (frame - voiceTarget.endFrame) / release : 0) : 1;
      gain = Math.min(gain, dbToVolume((primary.ducking?.reductionDb ?? -14) * Math.max(0, Math.min(1, strength))));
    }
  }
  return gain;
}

/** 混音曲线同时消费淡入淡出与 Duck，避免 Web Player 和 Render Worker 各自计算一套音量。 */
export function audioCueVolumeAt(snapshot: ProjectSnapshot, item: TimelineItem, track: TimelineTrack, cue: AudioCue | undefined, localFrame: number): number {
  const voiceRole = cue?.role === "narration" || cue?.role === "source_speech" ? cue.role : !cue && track.name === "Dialogue" ? "narration" : undefined;
  const baseVolume = itemVolume(item, track) * (voiceRole ? plannedVoiceVolumeAt(snapshot, item, voiceRole, item.startFrame + localFrame) : 1);
  if (!cue) return baseVolume;
  const duration = itemDuration(item);
  const fadeIn = cue.fadeInFrames > 0 ? Math.min(1, (localFrame + 1) / cue.fadeInFrames) : 1;
  const fadeOut = cue.fadeOutFrames > 0 ? Math.min(1, (duration - localFrame) / cue.fadeOutFrames) : 1;
  const ducking = cue.ducking;
  const duckVolume = ducking ? dbToVolume(ducking.reductionDb * duckIntensityAt(snapshot, item.startFrame + localFrame, cue)) : 1;
  const points = cue.envelope ?? [];
  let envelopeDb = points[0]?.gainDb ?? 0;
  for (let index = 0; index < points.length; index++) {
    if (localFrame >= points[index].frame) envelopeDb = points[index].gainDb;
    if (index + 1 < points.length && localFrame >= points[index].frame && localFrame < points[index + 1].frame) {
      const ratio = (localFrame - points[index].frame) / (points[index + 1].frame - points[index].frame);
      envelopeDb = points[index].gainDb + ratio * (points[index + 1].gainDb - points[index].gainDb); break;
    }
  }
  return baseVolume * fadeIn * fadeOut * duckVolume * dbToVolume(envelopeDb);
}

