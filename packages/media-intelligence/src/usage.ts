import type { MediaAdoption, MediaUsageTarget, ProjectSnapshot } from "@videocut/contracts";
import { digest, regionContains } from "./index.js";

/** 同一素材的多次使用独立定位，避免一次纠错污染所有未关联使用。 */
export function mediaUsageState(snapshot: ProjectSnapshot, target: MediaUsageTarget) {
  const item = target.timelineItemId ? snapshot.timeline.items.find((entry) => entry.id === target.timelineItemId) : undefined;
  const effect = target.effectCueId ? snapshot.effectCues.find((entry) => entry.id === target.effectCueId) : undefined;
  if (target.motionVideoSlot) {
    const work = snapshot.assets.find(a => a.id === effect?.assetBindings.find(b => b.slot === "motion")?.assetId);
    const source = work?.motion?.videoSources?.find(v => v.slot === target.motionVideoSlot);
    const asset = snapshot.assets.find(a => a.id === source?.assetId);
    if (!effect || effect.type !== "ManagedMotion" || !work?.motion || !source || !asset || asset.sourceHash !== source.sourceHash) return undefined;
    return { asset, range: { startMs: source.sourceStartMs, endMs: source.sourceEndMs }, frameRange: { startFrame: effect.startFrame, endFrame: effect.endFrame }, active: effect.status === "ready", audioPolicy: "mute" as const,
      signature: digest({ target, effect, work: [work.id, work.motion.version], source, fps: [snapshot.timeline.fps, work.motion.fps] }) };
  }
  const binding = effect?.assetBindings.find((entry) => entry.slot === target.slot);
  const asset = snapshot.assets.find((entry) => entry.id === (item?.assetId ?? binding?.assetId));
  if (!asset || (!item && !binding)) return undefined;
  const cutaway = item && snapshot.cutaways.find((entry) => entry.timelineItemId === item.id);
  const frameRange = { startFrame: item?.startFrame ?? effect!.startFrame, endFrame: item?.endFrame ?? effect!.endFrame };
  const range = item && !["image", "document"].includes(asset.kind) ? { startMs: item.sourceStartFrame * 1000 / snapshot.timeline.fps, endMs: item.sourceEndFrame * 1000 / snapshot.timeline.fps } : undefined;
  return { asset, range, frameRange, active: item ? !item.disabled : effect!.status === "ready", audioPolicy: item?.mediaAudioPolicy,
    signature: digest({ target, asset: [asset.id, asset.sourceHash], fps: snapshot.timeline.fps, item, cutaway, effect }) };
}

export function mediaUsageProblem(snapshot: ProjectSnapshot, adoption: MediaAdoption, target: MediaUsageTarget): string | undefined {
  const usage = mediaUsageState(snapshot, target);
  if (!usage) return target.motionVideoSlot ? "缺少可核验的内部视频摘要，或作品、槽位、原片哈希已变化" : "实际使用对象已不存在";
  if (adoption.status !== "current" || usage.asset.id !== adoption.assetId || usage.asset.sourceHash !== adoption.sourceHash) return "采用依据或原文件已变化";
  if (usage.range && (!adoption.range || usage.range.startMs < adoption.range.startMs - 1 || usage.range.endMs > adoption.range.endMs + 1)) return "实际源范围超出采用依据";
  if (target.motionVideoSlot && adoption.audioPolicy === "retain") return "内部视频槽位静音；保留原声须关联真实 Timeline 声音用途";
  if (target.effectCueId && !target.motionVideoSlot && !["image", "document"].includes(usage.asset.kind)) return "时间素材请关联实际 Timeline Item，以核验裁切和原声策略";
  if (!usage.range && adoption.region && !regionContains(adoption.region, undefined)) return "局部页面/裁切观察不足以批准未经裁切的整图使用，请先生成并分析实际派生图";
  if (target.timelineItemId && adoption.audioPolicy === "mute" && usage.audioPolicy !== "mute") return "本次画面采用必须保持静音";
  return undefined;
}

export function mediaUsageFindings(snapshot: ProjectSnapshot) {
  return (snapshot.mediaAdoptions ?? []).flatMap((adoption) => (adoption.uses ?? []).flatMap((use) => {
    const state = mediaUsageState(snapshot, use.target);
    if (!state?.active && !(use.target.motionVideoSlot && snapshot.effectCues.some(c => c.id === use.target.effectCueId && c.status === "ready"))) return [];
    const reason = mediaUsageProblem(snapshot, adoption, use.target) ?? (state?.signature !== use.signature ? "实际使用范围或上下文已变化，需重新确认采用关系" : undefined);
    const cue = snapshot.effectCues.find(c => c.id === use.target.effectCueId);
    return reason ? [{ adoptionId: adoption.id, objectId: use.target.timelineItemId ?? use.target.effectCueId!, frameRange: state?.frameRange ?? { startFrame: cue!.startFrame, endFrame: cue!.endFrame }, reason }] : [];
  }));
}
