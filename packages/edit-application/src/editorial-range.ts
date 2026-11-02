import type { EditorialReviewFinding, ProjectSnapshot } from "@videocut/contracts";
import { motionWorkForCue } from "@videocut/contracts";
import { motionSourceRange } from "../../contracts/src/frame-rate.js";

/** 只复用坐标映射，不复用旧版观看证据；映射不确定时仍检查完整对象。 */
export function editorialResolutionRange(finding: Pick<EditorialReviewFinding, "objectId" | "frameRange">, before: ProjectSnapshot, after: ProjectSnapshot) {
  const objects = (snapshot: ProjectSnapshot) => [...snapshot.effectCues, ...snapshot.cutaways, ...snapshot.scenes, ...snapshot.timeline.items, ...snapshot.timeline.captions];
  const old = objects(before).find(entry => entry.id === finding.objectId);
  const current = objects(after).find(entry => entry.id === finding.objectId);
  const full = { startFrame: 0, endFrame: after.timeline.durationInFrames };
  if (!current) return full;
  const range = finding.frameRange;
  if (!old || !range || before.timeline.fps !== after.timeline.fps || old.endFrame - old.startFrame !== current.endFrame - current.startFrame
    || range.startFrame < old.startFrame || range.endFrame > old.endFrame) return { startFrame: current.startFrame, endFrame: current.endFrame };
  // 源裁切或播放方式变化不能只按全局平移；内容/布局修订本身不改变时钟。
  const clock = (entry: typeof current, snapshot: ProjectSnapshot) => {
    if ("type" in entry && entry.type === "ManagedMotion") {
      const cue = entry as ProjectSnapshot["effectCues"][number];
      const work = motionWorkForCue(snapshot, cue);
      return [cue.type, cue.motion, work && motionSourceRange(cue, work, snapshot.timeline.fps), work?.fps, work?.frameCount];
    }
    if ("sourceStartFrame" in entry) return [entry.sourceStartFrame, entry.sourceEndFrame];
    return ["type" in entry ? entry.type : undefined];
  };
  if (JSON.stringify(clock(old, before)) !== JSON.stringify(clock(current, after))) return { startFrame: current.startFrame, endFrame: current.endFrame };
  const offset = current.startFrame - old.startFrame;
  // 保留两端一帧接点，以实际新版本连续证据检查问题及接管边界。
  return { startFrame: Math.max(0, range.startFrame + offset - 1), endFrame: Math.min(after.timeline.durationInFrames, range.endFrame + offset + 1) };
}
