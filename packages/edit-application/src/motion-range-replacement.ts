import { motionWorkForCue } from "@videocut/contracts";
import type { Asset, ImpactReport, ProjectSnapshot, EffectCue, MotionEvent } from "@videocut/contracts";
import { motionDurationAtFps } from "../../contracts/src/frame-rate.js";
import { createId, DomainError, effectBeatRanges } from "@videocut/domain";
import { bindEffectAudioEvent } from "./effect-audio-events.js";

type Motion = NonNullable<Asset["motion"]>;
export interface MotionRangeExpectation {
  cueStart: number; cueEnd: number; cueSourceStart: number; projectFps: number;
  width: number; height: number; fps: number; fullDuration: number; oldRootStart: number;
  events: MotionEvent[]; startFrame: number; endFrame: number;
}
export interface MotionRangeCandidate {
  width: number; height: number; fps: number; frameCount: number;
  rootRange: NonNullable<Motion["rootRange"]>; events?: MotionEvent[];
}

/** 原 Revision 是唯一预期来源，不能用生成期间变化的当前 Cue 代替。 */
export function motionRangeExpectation(snapshot: ProjectSnapshot, input: { cueId: string; startFrame: number; endFrame: number }): MotionRangeExpectation {
  const cue = snapshot.effectCues.find(entry => entry.id === input.cueId);
  const old = cue ? motionWorkForCue(snapshot, cue) : undefined;
  if (!cue || cue.type !== "ManagedMotion" || cue.status !== "ready" || !old) throw new DomainError("需要有效的现有受管 Cue 和已登记的正式范围素材", "MOTION_RANGE_ASSET_REQUIRED");
  if (!Number.isInteger(input.startFrame) || !Number.isInteger(input.endFrame) || input.startFrame < cue.startFrame || input.endFrame > cue.endFrame || input.endFrame <= input.startFrame) throw new DomainError("修改范围必须位于当前 Cue 内", "MOTION_RANGE_INVALID");
  return { cueStart: cue.startFrame, cueEnd: cue.endFrame, cueSourceStart: cue.sourceStartFrame ?? 0, projectFps: snapshot.timeline.fps,
    width: old.width, height: old.height, fps: old.fps, fullDuration: old.frameCount,
    oldRootStart: 0, events: old.eventMap?.events ?? [], startFrame: input.startFrame, endFrame: input.endFrame };
}

/** 提交、捕帧前与正式采用共用同一规则；事件只有实际执行后才可比较。 */
export function checkMotionRangeCompatibility(expected: MotionRangeExpectation, next: MotionRangeCandidate, compareEvents = true): number {
  if (expected.width !== next.width || expected.height !== next.height || expected.fps !== next.fps || expected.fullDuration !== next.rootRange.fullDurationInFrames
    || (compareEvents && JSON.stringify(expected.events) !== JSON.stringify(next.events ?? []))) throw new DomainError("局部替换保持画幅、作品帧率、完整时长及事件时序；结构变化须重新编排", "MOTION_RANGE_STRUCTURE_CHANGED");
  const delta = (next.rootRange.startFrame - expected.oldRootStart) * expected.projectFps / expected.fps;
  if (!Number.isInteger(delta)) throw new DomainError("局部素材根起点未落在项目共用帧网格，请向前扩展生成窗口至两种帧率的共同边界", "MOTION_RANGE_PHASE_MISMATCH");
  const sourceStart = expected.cueSourceStart + expected.startFrame - expected.cueStart - delta;
  const sourceEnd = sourceStart + expected.endFrame - expected.startFrame;
  if (sourceStart < 0 || sourceEnd > motionDurationAtFps(next.frameCount, next.fps, expected.projectFps)) throw new DomainError("新素材没有完整覆盖目标窗口", "MOTION_RANGE_SOURCE_SHORT");
  return sourceStart;
}

/** 仅组织现有 Cue；前、新、后三段及声音引用在同一 Revision 中生效。 */
export function replaceMotionRange(snapshot: ProjectSnapshot, impact: ImpactReport, input: { cueId: string; workId: string; startFrame: number; endFrame: number }): EffectCue[] {
  const cue = snapshot.effectCues.find(c => c.id === input.cueId);
  const old = cue ? motionWorkForCue(snapshot, cue) : undefined;
  const next = snapshot.motionWorks?.find(work => work.id === input.workId);
  if (!cue || cue.type !== "ManagedMotion" || cue.status !== "ready" || !old || !next) throw new DomainError("需要有效的现有受管 Cue 和已登记的正式范围素材", "MOTION_RANGE_ASSET_REQUIRED");
  const expected = motionRangeExpectation(snapshot, input);
  const sourceStart = checkMotionRangeCompatibility(expected, { width: next.width, height: next.height, fps: next.fps, frameCount: next.frameCount, rootRange: { startFrame: 0, endFrame: next.frameCount, fullDurationInFrames: next.frameCount }, events: next.eventMap?.events });
  const segments: EffectCue[] = [];
  const add = (startFrame: number, endFrame: number, source: number, workId: string) => {
    if (endFrame <= startFrame) return;
    segments.push({ ...structuredClone(cue), id: segments.length ? createId("cue") : cue.id, startFrame, endFrame,
      ...(cue.coveredNarrativeBeatIds === undefined ? {} : { coveredNarrativeBeatIds: cue.coveredNarrativeBeatIds.filter(id =>
        effectBeatRanges(snapshot, id, cue.sceneId).some(range => range.startFrame < endFrame && range.endFrame > startFrame)) }),
      sourceStartFrame: source, sourceEndFrame: source + endFrame - startFrame,
      holdFrame: Math.min(endFrame - 1, startFrame + Math.floor((endFrame - startFrame) / 2)),
      motion: { ...cue.motion, holdFrames: endFrame - startFrame }, workId, assetBindings: [], status: "ready" });
  };
  const oldWork = old.id;
  add(cue.startFrame, input.startFrame, cue.sourceStartFrame ?? 0, oldWork);
  add(input.startFrame, input.endFrame, sourceStart, next.id);
  add(input.endFrame, cue.endFrame, (cue.sourceStartFrame ?? 0) + input.endFrame - cue.startFrame, oldWork);
  snapshot.effectCues.splice(snapshot.effectCues.indexOf(cue), 1, ...segments);
  for (const audio of snapshot.audioCues.filter(a => a.effectEvent?.effectCueId === cue.id && a.status === "ready")) {
    const binding = audio.effectEvent!, point = audio.eventFrame! - binding.syncOffsetFrames;
    const owner = segments.find(s => point >= s.startFrame && point < s.endFrame);
    if (!owner) throw new DomainError("声音事件不在替换后的有效范围，请先核对原绑定", "MOTION_RANGE_EVENT_UNRESOLVED");
    const selected = motionWorkForCue(snapshot, owner)!;
    audio.effectEvent = bindEffectAudioEvent(snapshot, { ...binding, effectCueId: owner.id, localFrame: point - owner.startFrame,
      ...(binding.endLocalFrame === undefined ? {} : { endLocalFrame: cue.startFrame + binding.endLocalFrame - owner.startFrame }),
      ...(binding.eventId ? { workVersion: selected.version } : {}) }, audio.eventFrame!);
    impact.changed.push(audio.id);
  }
  impact.changed.push(...segments.map(s => s.id));
  impact.dirtyRanges.push({ startFrame: input.startFrame, endFrame: input.endFrame, reason: "采用正式局部动画；检查两个接点及声画同步" });
  return segments;
}
