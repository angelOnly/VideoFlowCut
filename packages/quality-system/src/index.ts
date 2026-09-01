import type { ProjectSnapshot, QualityIssue, QualityReport } from "@videocut/contracts";
import { createId } from "@videocut/domain";

const issue = (input: Omit<QualityIssue, "id">): QualityIssue => ({ id: createId("quality"), ...input });

/**
 * 可确定的规则只报告可验证事实；遮挡、节奏与审美仍须由真实预览帧进行人工/视觉复核。
 */
export function evaluateQuality(snapshot: ProjectSnapshot, revision: number): QualityReport {
  const issues: QualityIssue[] = [];
  const { timeline } = snapshot;
  const assetIds = new Set(snapshot.assets.map((asset) => asset.id));
  const actorTrack = timeline.tracks.find((track) => track.name === "Actor / A-roll");
  if (!actorTrack || !timeline.items.some((item) => item.trackId === actorTrack.id && !item.disabled)) {
    issues.push(issue({ level: "blocking", code: "MISSING_PRIMARY_VIDEO", message: "主画面轨道没有可播放素材。" }));
  }
  for (const item of timeline.items) {
    if (!assetIds.has(item.assetId)) {
      issues.push(issue({ level: "blocking", code: "MISSING_ASSET", message: "时间线片段引用的素材不存在。", objectId: item.id }));
    }
    if (item.startFrame < 0 || item.endFrame <= item.startFrame) {
      issues.push(issue({ level: "blocking", code: "INVALID_RANGE", message: "时间线片段的帧范围无效。", objectId: item.id }));
    }
  }
  for (const track of timeline.tracks) {
    const items = timeline.items.filter((item) => item.trackId === track.id && !item.disabled).sort((left, right) => left.startFrame - right.startFrame);
    for (let index = 1; index < items.length; index += 1) {
      if (items[index - 1]!.endFrame > items[index]!.startFrame) {
        issues.push(issue({ level: "blocking", code: "TRACK_OVERLAP", message: `轨道“${track.name}”存在重叠片段。`, objectId: track.id }));
      }
    }
  }
  for (const asset of snapshot.assets) {
    if (asset.status === "failed" || asset.status === "missing") {
      issues.push(issue({ level: "blocking", code: "ASSET_NOT_READY", message: `素材“${asset.name}”不可用：${asset.failureReason ?? asset.status}。`, objectId: asset.id }));
    }
  }
  for (const caption of timeline.captions) {
    if (caption.endFrame <= caption.startFrame) {
      issues.push(issue({ level: "blocking", code: "INVALID_CAPTION_RANGE", message: "字幕卡的帧范围无效。", objectId: caption.id }));
    }
    if (caption.text.length > 28) {
      issues.push(issue({ level: "warning", code: "CAPTION_READING_SPEED", message: "字幕卡文字较长，请在预览中确认阅读速度与安全区。", objectId: caption.id, frameRange: { startFrame: caption.startFrame, endFrame: caption.endFrame } }));
    }
    if (caption.precision !== "segment_exact" && caption.precision !== "word_exact") {
      issues.push(issue({ level: "warning", code: "CAPTION_TIMING_LIMITED", message: "字幕不是基于精确语音段时序，请勿将其当作逐词对齐。", objectId: caption.id }));
    }
  }
  for (const cue of snapshot.effectCues) {
    if (cue.status === "stale") {
      issues.push(issue({ level: "warning", code: "STALE_EFFECT", message: `效果“${cue.type}”的语义锚点已失效，需要重新确认。`, objectId: cue.id }));
    }
    const scene = snapshot.scenes.find((candidate) => candidate.id === cue.sceneId);
    if (!scene || cue.startFrame < scene.startFrame || cue.endFrame > scene.endFrame) {
      issues.push(issue({ level: "blocking", code: "CUE_OUT_OF_SCENE", message: "效果不在所属场景范围内。", objectId: cue.id }));
    }
    if (cue.layer === "front") {
      issues.push(issue({ level: "warning", code: "FRONT_LAYER_REVIEW", message: "前景效果需在真实预览中检查是否遮挡人物脸部、嘴部和字幕。", objectId: cue.id, frameRange: { startFrame: cue.startFrame, endFrame: cue.endFrame } }));
    }
  }
  if (!snapshot.speechAsset && snapshot.speechSegments.length > 0) {
    issues.push(issue({ level: "warning", code: "SPEECH_PENDING", message: "已有 SpeechSegment，但尚未组装 SpeechAsset；不可将文字稿当作已生成旁白。" }));
  }
  if (timeline.durationInFrames === 0) {
    issues.push(issue({ level: "blocking", code: "EMPTY_TIMELINE", message: "时间线为空，无法预览或导出。" }));
  }
  return { revision, generatedAt: new Date().toISOString(), issues };
}

export function canExport(report: QualityReport): boolean {
  return !report.issues.some((entry) => entry.level === "blocking");
}
