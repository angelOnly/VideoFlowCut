import { z } from "zod";

/** 项目与作品共用已验证规格；分数帧率须另做完整链路验证。 */
export const projectFrameRateSchema = z.number().int().min(15).max(60);

export function convertFrameRate(frame: number, fromFps: number, toFps: number): number {
  return Math.round(frame * toFps / fromFps);
}

export function motionDurationAtFps(frameCount: number, workFps: number, projectFps: number): number {
  return convertFrameRate(frameCount, workFps, projectFps);
}

/** 固定透明帧按时间采样；重复取帧是正常升采样，不生成运动细节。 */
export function motionFrameAtProjectFrame(localFrame: number, workFps: number, projectFps: number, frameCount: number): number {
  const frame = Math.floor(localFrame * workFps / projectFps + 1e-9);
  if (!Number.isInteger(localFrame) || localFrame < 0 || frame < 0 || frame >= frameCount) {
    throw new Error("MOTION_FRAME_OUT_OF_RANGE: 作品时间采样越界");
  }
  return frame;
}

/** 半开项目范围实际消费的完整作品帧；排他终点不能多算未被采样的一帧。 */
export function motionRootRangeAtProjectRange(startFrame: number, endFrame: number, workFps: number, projectFps: number) {
  return { startFrame: Math.floor(startFrame * workFps / projectFps + 1e-9), endFrame: Math.floor((endFrame - 1) * workFps / projectFps + 1e-9) + 1 };
}

/** Cue 源范围与 TimelineItem 一样使用项目帧单位；媒体帧始终从零开始。 */
export function motionSourceRange(cue: { sourceStartFrame?: number; sourceEndFrame?: number }, motion: { frameCount: number; fps: number }, projectFps: number) {
  return { startFrame: cue.sourceStartFrame ?? 0, endFrame: cue.sourceEndFrame ?? motionDurationAtFps(motion.frameCount, motion.fps, projectFps) };
}

/** 根事件先减媒体根起点，再转项目时钟、减选段入点。 */
export function motionEventLocalFrame(rootFrame: number, motion: { fps: number; rootRange?: { startFrame: number } }, cue: { sourceStartFrame?: number }, projectFps: number): number {
  return convertFrameRate(rootFrame - (motion.rootRange?.startFrame ?? 0), motion.fps, projectFps) - (cue.sourceStartFrame ?? 0);
}

/** 根素材可见范围与 floor 取帧互逆，首个能消费该帧的项目位置取 ceil。 */
export function motionRootSpanOnTimeline(start: number, end: number, motion: { fps: number; rootRange?: { startFrame: number } }, cue: { startFrame: number; endFrame: number; sourceStartFrame?: number }, projectFps: number) {
  const offset = motion.rootRange?.startFrame ?? 0, source = cue.sourceStartFrame ?? 0;
  return { startFrame: Math.max(cue.startFrame, cue.startFrame + Math.ceil((start - offset) * projectFps / motion.fps) - source),
    endFrame: Math.min(cue.endFrame, cue.startFrame + Math.ceil((end - offset) * projectFps / motion.fps) - source) };
}

export interface FrameRateChangeReport {
  revision: number;
  fromFps: number;
  toFps: number;
  changed: boolean;
  canApply: boolean;
  affectedObjectIds: string[];
  durationBeforeSeconds: number;
  durationAfterSeconds: number;
  maxBoundaryErrorMs: number;
  blockers: Array<{ code: string; objectId?: string; message: string }>;
  warnings: string[];
  rebuild: string[];
}
