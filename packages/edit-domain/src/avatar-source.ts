import type { ActorPerformance, AvatarAudioSlice, ImpactReport, PresenterUse, ProjectSnapshot, TimelineItem } from "@videocut/contracts";
import { DomainError } from "./index.js";

/** 项目帧只负责定位，真正的生成输入始终落到原文件整数采样位置。 */
export function resolvePresenterUseAudio(snapshot: ProjectSnapshot, use: Pick<PresenterUse, "startFrame" | "endFrame">): AvatarAudioSlice {
  const fail = (message: string): never => { throw new DomainError(message, "AVATAR_AUDIO_MAPPING_INVALID"); };
  const fps = snapshot.timeline.fps;
  if (!Number.isInteger(use.startFrame) || !Number.isInteger(use.endFrame) || use.startFrame < 0 || use.endFrame <= use.startFrame) {
    fail("人物出镜范围必须是非空项目帧区间");
  }
  const dialogue = snapshot.timeline.tracks.find(track => track.name === "Dialogue");
  if (!dialogue || dialogue.muted) fail("人物出镜范围缺少可听的正式 Dialogue");
  const items = snapshot.timeline.items.filter(item => item.trackId === dialogue!.id && !item.disabled
    && item.startFrame < use.endFrame && item.endFrame > use.startFrame).sort((a, b) => a.startFrame - b.startFrame);
  let cursor = use.startFrame;
  let audio: AvatarAudioSlice | undefined;
  for (const item of items) {
    const start = Math.max(item.startFrame, use.startFrame), end = Math.min(item.endFrame, use.endFrame);
    const asset = snapshot.assets.find(candidate => candidate.id === item.assetId);
    const sampleRate = asset?.metadata?.sampleRate;
    if (start !== cursor || item.sourceEndFrame - item.sourceStartFrame !== item.endFrame - item.startFrame
      || item.mediaAudioPolicy === "mute" || (item.gainDb ?? 0) <= -80
      || asset?.status !== "ready" || !asset.sourceHash || !asset.metadata?.hasAudio
      || !sampleRate || !Number.isInteger(sampleRate) || sampleRate <= 0) {
      fail("人物出镜需要连续、正常速度且已分析采样率与文件摘要的 Dialogue；不能猜测断口或重叠");
    }
    const startSample = Math.round((item.sourceStartFrame + start - item.startFrame) * sampleRate! / fps);
    const endSample = Math.round((item.sourceStartFrame + end - item.startFrame) * sampleRate! / fps);
    if (startSample < 0 || endSample <= startSample || endSample > Math.ceil(asset!.metadata!.durationMs * sampleRate! / 1000)) {
      fail("人物出镜映射越过真实声音文件范围");
    }
    if (audio && (audio.sourceHash !== asset!.sourceHash || audio.sampleRate !== sampleRate || audio.endSample !== startSample)) {
      fail("人物连续表演必须对应同一声音文件的连续采样范围");
    }
    audio = audio ? { ...audio, endSample } : { assetId: asset!.id, sourceHash: asset!.sourceHash!, sampleRate: sampleRate!, startSample, endSample };
    cursor = end;
  }
  if (!audio || cursor !== use.endFrame) fail("人物出镜范围没有完整的 Dialogue 映射");
  return audio!;
}

const sameAudio = (left: AvatarAudioSlice, right: AvatarAudioSlice) => left.sourceHash === right.sourceHash
  && left.sampleRate === right.sampleRate && left.startSample === right.startSample && left.endSample === right.endSample;

/** 当前使用只比真实依赖；旧脚本编号和生成时的项目位置不决定嘴型是否有效。 */
export function avatarBindingMatches(snapshot: ProjectSnapshot, performance: ActorPerformance, item: TimelineItem): boolean {
  const binding = performance.sourceBinding;
  if (!binding) return false;
  const receipt = binding.receipt;
  const asset = snapshot.assets.find(candidate => candidate.id === item.assetId);
  const use = snapshot.visualTreatments.filter(treatment => treatment.status === "ready").flatMap(treatment => treatment.presenterUses ?? []).find(candidate => candidate.id === binding.presenterUseId);
  if (!use || receipt.contractVersion !== 2 || performance.source !== "generated" || performance.audioMode !== "use_dialogue_track"
    || asset?.status !== "ready" || !asset.metadata?.videoCodec || asset.id !== receipt.assetId
    || asset.sourceHash !== receipt.outputHash || asset.avatarSourceReceipt?.jobId !== receipt.jobId
    || JSON.stringify(asset.avatarSourceReceipt) !== JSON.stringify(receipt)
    || performance.generationJobId !== receipt.jobId
    || !Number.isFinite(receipt.outputOffsetSeconds) || receipt.outputOffsetSeconds < 0
    || item.startFrame < use.startFrame || item.endFrame > use.endFrame || item.endFrame <= item.startFrame
    || item.sourceEndFrame - item.sourceStartFrame !== item.endFrame - item.startFrame
    || receipt.input.performanceNote !== use.performanceNote) return false;
  const image = snapshot.assets.find(candidate => candidate.id === use.referenceImageAssetId);
  if (!image?.sourceHash || image.status !== "ready" || image.sourceHash !== receipt.input.referenceImageHash) return false;
  try {
    const current = resolvePresenterUseAudio(snapshot, use);
    const consumed = resolvePresenterUseAudio(snapshot, item);
    const original = receipt.input.audio;
    if (!sameAudio(current, binding.audio) || current.sourceHash !== original.sourceHash || current.sampleRate !== original.sampleRate
      || consumed.startSample < original.startSample || consumed.endSample > original.endSample) return false;
    // 源视频帧使用当前项目 fps；回执中的 generationFps 仅解释历史生成范围。
    const sourceStart = Math.round(((consumed.startSample - original.startSample) / original.sampleRate + receipt.outputOffsetSeconds) * snapshot.timeline.fps);
    const sourceEnd = sourceStart + item.endFrame - item.startFrame;
    return item.sourceStartFrame === sourceStart && item.sourceEndFrame === sourceEnd
      && sourceStart >= 0 && sourceEnd <= Math.floor(asset.metadata.durationMs * snapshot.timeline.fps / 1000 + 1e-6);
  } catch (error) {
    if (error instanceof DomainError) return false;
    throw error;
  }
}

/** 所有正式提交共用真实依赖协调；新采用的错误交给图校验，不能静默降为 stale。 */
export function reconcileAvatarSourceBindings(before: ProjectSnapshot, snapshot: ProjectSnapshot, impact: ImpactReport): void {
  const uses = snapshot.visualTreatments.filter(treatment => treatment.status === "ready").flatMap(treatment => treatment.presenterUses ?? []);
  for (const performance of snapshot.actorPerformances) {
    const previous = before.actorPerformances.find(entry => entry.id === performance.id);
    const oldItem = previous && before.timeline.items.find(entry => entry.id === previous.timelineItemId);
    const item = snapshot.timeline.items.find(entry => entry.id === performance.timelineItemId);
    if (!previous?.sourceBinding || !performance.sourceBinding || !oldItem || !item
      || oldItem.assetId !== item.assetId
      || previous.sourceBinding.presenterUseId !== performance.sourceBinding.presenterUseId
      || JSON.stringify(previous.sourceBinding.receipt) !== JSON.stringify(performance.sourceBinding.receipt)) continue;
    const prior = JSON.stringify({ item, binding: performance.sourceBinding, status: performance.status });
    const use = uses.find(entry => entry.id === performance.sourceBinding!.presenterUseId);
    let matches = false;
    if (use) {
      const startFrame = Math.max(item.startFrame, use.startFrame), endFrame = Math.min(item.endFrame, use.endFrame);
      if (endFrame > startFrame) {
        const candidate = { ...item, startFrame, endFrame,
          sourceStartFrame: item.sourceStartFrame + startFrame - item.startFrame,
          sourceEndFrame: item.sourceStartFrame + endFrame - item.startFrame };
        try {
          const binding = { ...performance.sourceBinding, audio: resolvePresenterUseAudio(snapshot, use) };
          if (avatarBindingMatches(snapshot, { ...performance, sourceBinding: binding }, candidate)) {
            Object.assign(item, candidate);
            performance.sourceBinding = binding;
            matches = true;
          }
        } catch (error) {
          if (!(error instanceof DomainError)) throw error;
        }
      }
    }
    if (!matches) {
      item.disabled = true;
      performance.status = "stale";
    }
    if (prior === JSON.stringify({ item, binding: performance.sourceBinding, status: performance.status })) continue;
    for (const id of [item.id, performance.id]) if (!impact.changed.includes(id)) impact.changed.push(id);
    if (!matches && !impact.stale.includes(performance.id)) impact.stale.push(performance.id);
    impact.dirtyRanges.push({
      startFrame: Math.min(oldItem.startFrame, item.startFrame), endFrame: Math.max(oldItem.endFrame, item.endFrame),
      reason: matches ? "人物当前使用已按真实声音和出镜范围更新" : "人物依赖已改变，撤回旧使用并保留可复用源"
    });
  }
}
