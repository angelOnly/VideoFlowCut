import type { EditorialReviewFinding, ProjectSnapshot } from "@videocut/contracts";

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
  const clock = (entry: typeof current) => {
    if ("sourceStartFrame" in entry) return [entry.sourceStartFrame, entry.sourceEndFrame];
    if ("type" in entry && entry.type === "ManagedMotion") {
      const cue = entry as ProjectSnapshot["effectCues"][number];
      return [cue.type, cue.motion, cue.props];
    }
    return [];
  };
  if (JSON.stringify(clock(old)) !== JSON.stringify(clock(current))) return { startFrame: current.startFrame, endFrame: current.endFrame };
  const offset = current.startFrame - old.startFrame;
  // 保留两端一帧接点，以实际新版本连续证据检查问题及接管边界。
  return { startFrame: Math.max(0, range.startFrame + offset - 1), endFrame: Math.min(after.timeline.durationInFrames, range.endFrame + offset + 1) };
}
