import type { MotionEventMap, ProjectSnapshot, EffectCue } from "./index.js";
import type { BoundMotionImage, BoundMotionVideo, BoundMotionFont } from "../../motion-work/src/schema.js";
import type { FrozenSourceDisplay } from "./source-display-policy.js";
import { motionRootRangeAtProjectRange } from "./frame-rate.js";

/** 一件连续作品可有多个固定源码版本；媒体仍只是版本的派生结果。 */
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
  /** 旧版本保留在同一作品内，已采用片段始终引用它实际使用的定义。 */
  previousVersions?: Array<Omit<MotionWork, "previousVersions">>;
}

export function motionWorkVersion(works: readonly MotionWork[] | undefined, workId: string | undefined, definitionHash?: string): MotionWork | undefined {
  const current = works?.find(work => work.id === workId);
  if (!current) return undefined;
  if (!definitionHash || current.definitionHash === definitionHash) {
    const { previousVersions: _previousVersions, ...version } = current;
    return version;
  }
  return current.previousVersions?.find(work => work.definitionHash === definitionHash);
}

export function motionWorkForCue(snapshot: ProjectSnapshot, cue: EffectCue): MotionWork | undefined {
  return motionWorkVersion(snapshot.motionWorks, cue.workId, cue.workDefinitionHash);
}

/** 派生文件选择不改变编排；返回文件根范围，由媒体层单独换算其零点。 */
export function motionMediaForCue(snapshot: ProjectSnapshot, cue: EffectCue, projectRange = { startFrame: cue.startFrame, endFrame: cue.endFrame }) {
  const work = motionWorkForCue(snapshot, cue);
  if (!work) return undefined;
  const from = Math.max(cue.startFrame, projectRange.startFrame), to = Math.min(cue.endFrame, projectRange.endFrame);
  if (from >= to) return undefined;
  const sourceStart = (cue.sourceStartFrame ?? 0) + from - cue.startFrame;
  const { startFrame: start, endFrame: end } = motionRootRangeAtProjectRange(sourceStart, sourceStart + to - from, work.fps, snapshot.timeline.fps);
  return snapshot.assets.find(asset => asset.status === "ready" && asset.motion?.workId === work.id && asset.motion.version === work.version && asset.motion.output
    && (asset.motion.rootRange?.startFrame ?? 0) <= start
    && (asset.motion.rootRange?.endFrame ?? asset.motion.frameCount) >= end);
}
