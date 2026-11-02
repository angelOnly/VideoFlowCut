import type { MotionEventMap, ProjectSnapshot, EffectCue } from "./index.js";
import type { BoundMotionImage, BoundMotionVideo, BoundMotionFont } from "../../motion-work/src/schema.js";
import type { FrozenSourceDisplay } from "./source-display-policy.js";
import { motionRootRangeAtProjectRange } from "./frame-rate.js";

/** 固定源码作品；媒体只是此作品的派生结果，不能成为第二份源码或事件来源。 */
export interface MotionWork {
  id: string;
  version: string;
  name: string;
  jobId: string;
  engineVersion: string;
  definitionPath: string;
  definitionHash: string;
  width: number;
  height: number;
  fps: number;
  frameCount: number;
  compositing: "opaque" | "alpha";
  creativeBrief?: string;
  imageSources: BoundMotionImage[];
  videoSources: BoundMotionVideo[];
  fontSources: BoundMotionFont[];
  eventMap?: MotionEventMap;
  sourceDisplay?: FrozenSourceDisplay;
  readyRanges: Array<{ startFrame: number; endFrame: number }>;
  author?: { project: string; run_id: string; frozen_version: string };
}

export function motionWorkForCue(snapshot: ProjectSnapshot, cue: EffectCue): MotionWork | undefined {
  return snapshot.motionWorks?.find(work => work.id === cue.workId);
}

/** 派生文件选择不改变编排；返回文件根范围，由媒体层单独换算其零点。 */
export function motionMediaForCue(snapshot: ProjectSnapshot, cue: EffectCue) {
  const work = motionWorkForCue(snapshot, cue);
  if (!work) return undefined;
  const { startFrame: start, endFrame: end } = motionRootRangeAtProjectRange(cue.sourceStartFrame ?? 0, cue.sourceEndFrame ?? (cue.sourceStartFrame ?? 0) + cue.endFrame - cue.startFrame, work.fps, snapshot.timeline.fps);
  return snapshot.assets.find(asset => asset.status === "ready" && asset.motion?.workId === work.id && asset.motion.output
    && (asset.motion.rootRange?.startFrame ?? 0) <= start
    && (asset.motion.rootRange?.endFrame ?? asset.motion.frameCount) >= end);
}
