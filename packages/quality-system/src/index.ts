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
  const dialogueTrack = timeline.tracks.find((track) => track.name === "Dialogue");
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
  const performances = snapshot.actorPerformances ?? [];
  const performanceByItem = new Map(performances.map((performance) => [performance.timelineItemId, performance]));
  for (const performance of performances) {
    const item = timeline.items.find((candidate) => candidate.id === performance.timelineItemId);
    if (!item) {
      issues.push(issue({ level: "blocking", code: "ACTOR_ITEM_MISSING", message: "人物表演引用的 Timeline Item 不存在。", objectId: performance.id }));
      continue;
    }
    const actorAsset = snapshot.assets.find((candidate) => candidate.id === item.assetId);
    if (!actorAsset || actorAsset.status !== "ready" || !actorAsset.metadata?.videoCodec) {
      issues.push(issue({ level: "blocking", code: "ACTOR_ASSET_INVALID", message: "人物表演视频不可用或未完成媒体分析。", objectId: performance.id }));
    }
    if (performance.status === "stale") {
      issues.push(issue({ level: "blocking", code: "ACTOR_PERFORMANCE_STALE", message: "人物表演与当前 Script 或素材版本不一致，需要重新生成或重新绑定。", objectId: performance.id }));
    }
    if (performance.maskMode === "alpha_asset") {
      const mask = performance.maskAssetId ? snapshot.assets.find((candidate) => candidate.id === performance.maskAssetId) : undefined;
      if (!mask || mask.status !== "ready") {
        issues.push(issue({ level: "blocking", code: "ACTOR_MASK_MISSING", message: "人物表演声明使用独立 Mask，但 Mask 素材不可用。", objectId: performance.id }));
      }
    }
    if (performance.maskMode === "none") {
      issues.push(issue({ level: "warning", code: "ACTOR_MASK_FALLBACK", message: "人物表演没有 Mask，后景效果会以可见前景降级；请在预览中确认遮挡关系。", objectId: performance.id, frameRange: { startFrame: item.startFrame, endFrame: item.endFrame } }));
    }
    if (performance.source === "generated") {
      if (!snapshot.speechAsset || performance.speechAssetId !== snapshot.speechAsset.id || performance.scriptRevision !== snapshot.speechAsset.scriptRevision) {
        issues.push(issue({ level: "blocking", code: "ACTOR_SPEECH_VERSION_MISMATCH", message: "生成型人物表演没有绑定当前 SpeechAsset 与 Script Revision。", objectId: performance.id }));
      }
    }
  }
  for (const scene of snapshot.scenes.filter((candidate) => candidate.type === "PresenterScene")) {
    const actorItem = timeline.items.find((item) => item.sceneId === scene.id && item.trackId === actorTrack?.id && !item.disabled);
    if (actorItem && !performanceByItem.has(actorItem.id)) {
      issues.push(issue({ level: "warning", code: "ACTOR_PERFORMANCE_UNREGISTERED", message: "PresenterScene 尚未登记人物表演；无法对 Mask 和人物版本关系做校验。", objectId: scene.id, frameRange: { startFrame: scene.startFrame, endFrame: scene.endFrame } }));
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
    if (cue.layer === "rear") {
      const hasMask = timeline.items.some((item) => item.sceneId === cue.sceneId && performanceByItem.get(item.id)?.maskMode !== "none");
      if (!hasMask) {
        issues.push(issue({ level: "warning", code: "REAR_EFFECT_FALLBACK", message: "后景效果缺少可用人物 Mask，渲染会降级为前景可见层，需复核遮挡。", objectId: cue.id, frameRange: { startFrame: cue.startFrame, endFrame: cue.endFrame } }));
      }
    }
  }
  if (!snapshot.speechAsset && snapshot.speechSegments.length > 0) {
    issues.push(issue({ level: "warning", code: "SPEECH_PENDING", message: "已有 SpeechSegment，但尚未组装 SpeechAsset；不可将文字稿当作已生成旁白。" }));
  }
  if (snapshot.speechAsset) {
    if (snapshot.speechAsset.scriptRevision !== snapshot.script.revision) {
      issues.push(issue({ level: "blocking", code: "SPEECH_SCRIPT_STALE", message: "SpeechAsset 与当前 Script Revision 不一致，需要重新生成受影响的语音段。", objectId: snapshot.speechAsset.id }));
    }
    const dialogueItems = timeline.items.filter((item) => item.trackId === dialogueTrack?.id && item.assetId === snapshot.speechAsset?.assetId && !item.disabled);
    if (dialogueItems.length !== 1) {
      issues.push(issue({ level: "blocking", code: "SPEECH_DIALOGUE_ITEM_MISSING", message: "SpeechAsset 没有以唯一 Item 写入 Dialogue 轨，最终导出不会可靠包含旁白。", objectId: snapshot.speechAsset.id }));
    }
    if (timeline.captions.some((caption) => caption.precision !== snapshot.speechAsset?.timing.precision)) {
      issues.push(issue({ level: "warning", code: "CAPTION_SPEECH_MISMATCH", message: "字幕时序精度与当前 SpeechAsset 不一致，需要重新检查字幕。", objectId: snapshot.speechAsset.id }));
    }

    /**
     * 人物口播的主画面和旁白相差太大时，通常意味着只合成了首段旁白，
     * 却保留了整条视频主线。这个问题不能靠导出成功掩盖，必须先补齐 Script/语音或重剪主画面。
     */
    const primaryVideoEnd = timeline.items
      .filter((item) => item.trackId === actorTrack?.id && !item.disabled)
      .reduce((latest, item) => Math.max(latest, item.endFrame), 0);
    const speechEnd = dialogueItems[0]?.endFrame ?? 0;
    const permittedGap = timeline.fps * 4;
    if (primaryVideoEnd > 0 && speechEnd > 0 && Math.abs(primaryVideoEnd - speechEnd) > permittedGap) {
      issues.push(issue({
        level: "blocking",
        code: "PRESENTER_SPEECH_VISUAL_DURATION_MISMATCH",
        message: `人物主画面与旁白总轨相差超过 4 秒（主画面 F${primaryVideoEnd}，旁白 F${speechEnd}）；请补齐旁白或调整 Presenter 主线。`,
        objectId: snapshot.speechAsset.id,
        frameRange: { startFrame: Math.min(primaryVideoEnd, speechEnd), endFrame: Math.max(primaryVideoEnd, speechEnd) }
      }));
    }
  }
  if (timeline.durationInFrames === 0) {
    issues.push(issue({ level: "blocking", code: "EMPTY_TIMELINE", message: "时间线为空，无法预览或导出。" }));
  }
  return { revision, generatedAt: new Date().toISOString(), issues };
}

export function canExport(report: QualityReport): boolean {
  return !report.issues.some((entry) => entry.level === "blocking");
}
