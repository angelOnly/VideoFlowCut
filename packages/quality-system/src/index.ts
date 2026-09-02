import { EFFECT_QUALITY_RULES, type EditorialQualityReview, type ExportPurpose, type ProjectSnapshot, type QualityIssue, type QualityReport } from "@videocut/contracts";
import { assertProjectGraphValid, createId, DomainError } from "@videocut/domain";

const issue = (input: Omit<QualityIssue, "id">): QualityIssue => ({ id: createId("quality"), ...input });
const effectQualityRuleSet = new Set<string>(EFFECT_QUALITY_RULES);

/** 返回相交帧区间；仅用于 Cue 的显式“不要争夺主视觉”规则。 */
function cuesOverlap(left: { startFrame: number; endFrame: number }, right: { startFrame: number; endFrame: number }): boolean {
  return left.startFrame < right.endFrame && right.startFrame < left.endFrame;
}

/**
 * 可确定的规则只报告可验证事实；遮挡、节奏与审美仍须由真实预览帧进行人工/视觉复核。
 */
export function evaluateQuality(snapshot: ProjectSnapshot, revision: number, editorialReview?: EditorialQualityReview): QualityReport {
  const issues: QualityIssue[] = [];
  const { timeline } = snapshot;
  const assetIds = new Set(snapshot.assets.map((asset) => asset.id));
  const actorTrack = timeline.tracks.find((track) => track.name === "Actor / A-roll");
  const dialogueTrack = timeline.tracks.find((track) => track.name === "Dialogue");
  try {
    assertProjectGraphValid(snapshot);
  } catch (error) {
    const message = error instanceof DomainError ? error.message : "项目对象关系校验失败。";
    issues.push(issue({ level: "blocking", code: "PROJECT_GRAPH_INVALID", message }));
  }
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
  // 只检查实际进入当前成片的外部素材；素材库中的候选可先保持 unknown，不能因尚未使用而阻塞导出。
  const usedAssetIds = new Set([
    ...timeline.items.filter((item) => !item.disabled).map((item) => item.assetId),
    ...snapshot.scenes.flatMap((scene) => scene.assetIds),
    ...snapshot.effectCues.flatMap((cue) => cue.assetBindings.map((binding) => binding.assetId)),
    ...(snapshot.actorPerformances ?? []).flatMap((performance) => performance.maskAssetId ? [performance.maskAssetId] : [])
  ]);
  for (const asset of snapshot.assets.filter((candidate) => usedAssetIds.has(candidate.id) && candidate.provenance?.source === "provider")) {
    const provenance = asset.provenance!;
    if (provenance.rightsStatus === "unknown") {
      issues.push(issue({ level: "blocking", code: "EXTERNAL_ASSET_RIGHTS_UNKNOWN", message: `外部素材“${asset.name}”尚未确认授权，不能正式导出。`, objectId: asset.id }));
    }
    if (provenance.rightsStatus === "restricted" || provenance.rightsStatus === "rejected") {
      issues.push(issue({ level: "blocking", code: "EXTERNAL_ASSET_RIGHTS_RESTRICTED", message: `外部素材“${asset.name}”当前授权状态为 ${provenance.rightsStatus}，不能正式导出。`, objectId: asset.id }));
    }
    if (provenance.rightsStatus === "attribution_required") {
      if (!provenance.attributionText?.trim()) {
        issues.push(issue({ level: "blocking", code: "ATTRIBUTION_TEXT_MISSING", message: `外部素材“${asset.name}”要求署名，但没有署名文本。`, objectId: asset.id }));
      } else {
        issues.push(issue({ level: "warning", code: "ATTRIBUTION_MANIFEST_REQUIRED", message: `外部素材“${asset.name}”需要随交付保存署名清单。`, objectId: asset.id }));
      }
    }
  }
  const performances = snapshot.actorPerformances ?? [];
  const performanceByItem = new Map(performances.map((performance) => [performance.timelineItemId, performance]));
  // 未登记的人物不能被推断为“已经有 Mask”；否则后景效果会假装拥有不存在的遮挡能力。
  const hasUsableActorMask = (sceneId: string) => timeline.items.some((item) => {
    if (item.sceneId !== sceneId) return false;
    const performance = performanceByItem.get(item.id);
    if (!performance) return false;
    if (performance.maskMode === "embedded_alpha") return true;
    return performance.maskMode === "alpha_asset"
      && Boolean(performance.maskAssetId)
      && snapshot.assets.some((asset) => asset.id === performance.maskAssetId && asset.status === "ready");
  });
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
  /**
   * 人物视频与 Dialogue 同时可听会直接造成重声。音频所有权只由 ActorPerformance 决定，
   * Renderer 与导出共用该判断，质量门禁则负责在明确选择原声时阻止错误交付。
   */
  const audibleDialogueItems = timeline.items.filter((item) => {
    const track = timeline.tracks.find((candidate) => candidate.id === item.trackId);
    if (!track) return false;
    return track.id === dialogueTrack?.id && !track.muted && !item.disabled && (item.gainDb ?? 0) > -80;
  });
  const overlapsDialogue = (item: { startFrame: number; endFrame: number }) => audibleDialogueItems.some((dialogue) => dialogue.startFrame < item.endFrame && dialogue.endFrame > item.startFrame);
  for (const item of timeline.items.filter((candidate) => candidate.trackId === actorTrack?.id && !candidate.disabled)) {
    const source = snapshot.assets.find((asset) => asset.id === item.assetId);
    if (!source?.metadata?.hasAudio || actorTrack?.muted || (item.gainDb ?? 0) <= -80 || !overlapsDialogue(item)) continue;
    const performance = performanceByItem.get(item.id);
    const audioMode = performance?.audioMode ?? (snapshot.speechAsset ? "use_dialogue_track" : "use_source_audio");
    if (!performance) {
      issues.push(issue({
        level: "warning",
        code: "ACTOR_AUDIO_MODE_IMPLICIT",
        message: "人物画面尚未声明声音所有权；为防重复播放，旧快照预览会优先使用 Dialogue，请补充人物音频模式。",
        objectId: item.id,
        frameRange: { startFrame: item.startFrame, endFrame: item.endFrame }
      }));
    }
    if (audioMode === "use_source_audio") {
      issues.push(issue({
        level: "blocking",
        code: "DUPLICATE_DIALOGUE_AUDIO",
        message: "人物原声与 Dialogue 旁白在同一时间范围内都会播放；请改为 use_dialogue_track 或移除重复 Dialogue。",
        objectId: performance?.id ?? item.id,
        frameRange: { startFrame: item.startFrame, endFrame: item.endFrame }
      }));
    }
  }
  for (const scene of snapshot.scenes.filter((candidate) => candidate.type === "PresenterScene")) {
    const actorItem = timeline.items.find((item) => item.sceneId === scene.id && item.trackId === actorTrack?.id && !item.disabled);
    if (actorItem && !performanceByItem.has(actorItem.id)) {
      issues.push(issue({ level: "warning", code: "ACTOR_PERFORMANCE_UNREGISTERED", message: "PresenterScene 尚未登记人物表演；无法对 Mask 和人物版本关系做校验。", objectId: scene.id, frameRange: { startFrame: scene.startFrame, endFrame: scene.endFrame } }));
    }
  }
  for (const cutaway of snapshot.cutaways ?? []) {
    const item = timeline.items.find((candidate) => candidate.id === cutaway.timelineItemId);
    if (cutaway.status === "stale") {
      issues.push(issue({
        level: "warning",
        code: "STALE_CUTAWAY",
        message: "Cutaway 的主线关联已变化，当前已停止参与合成；请重新确认素材相关性、进入和返回，或明确移除。",
        objectId: cutaway.id,
        frameRange: { startFrame: cutaway.startFrame, endFrame: cutaway.endFrame }
      }));
      continue;
    }
    if (!item || item.disabled) {
      issues.push(issue({ level: "blocking", code: "CUTAWAY_ITEM_MISSING", message: "已就绪 Cutaway 缺少可播放的顶层 Timeline Item。", objectId: cutaway.id }));
      continue;
    }
    if (cutaway.mode === "pip") {
      issues.push(issue({
        level: "warning",
        code: "PIP_CAPTION_SAFETY_REVIEW",
        message: "PiP Cutaway 需要在真实预览中检查人物、字幕、原画文字和平台安全区没有相互遮挡。",
        objectId: cutaway.id,
        frameRange: { startFrame: cutaway.startFrame, endFrame: cutaway.endFrame }
      }));
    }
    if (cutaway.audioMode === "include_source_audio" && overlapsDialogue(cutaway)) {
      issues.push(issue({
        level: "warning",
        code: "CUTAWAY_SOURCE_AUDIO_REVIEW",
        message: "Cutaway 同时保留了素材原声与 Dialogue；请在真实试听中确认现场声没有遮蔽旁白。",
        objectId: cutaway.id,
        frameRange: { startFrame: cutaway.startFrame, endFrame: cutaway.endFrame }
      }));
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
      if (!hasUsableActorMask(cue.sceneId)) {
        issues.push(issue({ level: "warning", code: "REAR_EFFECT_FALLBACK", message: "后景效果缺少可用人物 Mask，渲染会降级为前景可见层，需复核遮挡。", objectId: cue.id, frameRange: { startFrame: cue.startFrame, endFrame: cue.endFrame } }));
      }
    }
    const assetRequired = new Set(["ProductFan", "PortfolioWall", "EvidenceCard", "DeviceShowcase", "ContentCarousel"]);
    if (assetRequired.has(cue.type) && (cue.assetBindings?.length ?? 0) === 0) {
      issues.push(issue({
        level: "blocking",
        code: "EFFECT_ASSET_BINDING_REQUIRED",
        message: `效果“${cue.type}”必须绑定真实项目素材，不能使用占位卡片。`,
        objectId: cue.id,
        frameRange: { startFrame: cue.startFrame, endFrame: cue.endFrame }
      }));
    }
    if (cue.type === "CommentCloud" && !Array.isArray(cue.props?.comments)) {
      issues.push(issue({
        level: "blocking",
        code: "COMMENT_CONTENT_REQUIRED",
        message: "评论云必须提供项目真实评论文本，不能渲染固定示例评论。",
        objectId: cue.id,
        frameRange: { startFrame: cue.startFrame, endFrame: cue.endFrame }
      }));
    }

    /**
     * qualityRules 不是审美替代品，只执行能够从同一 Revision 确定的事实。
     * 遮挡、节奏与美感仍由真实 Preview + Editorial Review 判定。
     */
    const rules = cue.qualityRules ?? [];
    for (const rule of rules) {
      if (!effectQualityRuleSet.has(rule)) {
        issues.push(issue({
          level: "warning",
          code: "EFFECT_QUALITY_RULE_UNSUPPORTED",
          message: `效果“${cue.type}”引用了未执行的质量规则“${rule}”；请改用当前 Registry 中的具名规则或把说明移到叙事目的。`,
          objectId: cue.id,
          frameRange: { startFrame: cue.startFrame, endFrame: cue.endFrame }
        }));
        continue;
      }
      if (rule === "semantic_anchor_required") {
        const anchor = cue.semanticAnchor;
        if (anchor.type === "absolute" || !anchor.targetId?.trim()) {
          issues.push(issue({
            level: "blocking",
            code: "EFFECT_SEMANTIC_ANCHOR_REQUIRED",
            message: `效果“${cue.type}”要求语义锚点，但当前没有绑定 SpeechSegment、Story Beat 或 Scene。`,
            objectId: cue.id,
            frameRange: { startFrame: cue.startFrame, endFrame: cue.endFrame }
          }));
        }
      }
      if (rule === "asset_binding_required" && (cue.assetBindings?.length ?? 0) === 0) {
        issues.push(issue({
          level: "blocking",
          code: "EFFECT_RULE_ASSET_BINDING_REQUIRED",
          message: `效果“${cue.type}”要求真实素材绑定，但尚未绑定项目素材。`,
          objectId: cue.id,
          frameRange: { startFrame: cue.startFrame, endFrame: cue.endFrame }
        }));
      }
      if (rule === "settled_frame_required") {
        const stableFrames = cue.endFrame - cue.startFrame - cue.motion.enterFrames - cue.motion.exitFrames;
        const minimumStableFrames = Math.max(3, Math.round(timeline.fps * 0.25));
        if (stableFrames < minimumStableFrames) {
          issues.push(issue({
            level: "blocking",
            code: "EFFECT_RULE_SETTLED_FRAME_REQUIRED",
            message: `效果“${cue.type}”没有至少 ${minimumStableFrames} 帧的稳定阅读区；请缩短进出场或延长 Cue。`,
            objectId: cue.id,
            frameRange: { startFrame: cue.startFrame, endFrame: cue.endFrame }
          }));
        }
      }
      if (rule === "caption_safe_area" && cue.layer === "front" && cue.spatialAnchor === "full_frame") {
        issues.push(issue({
          level: "blocking",
          code: "EFFECT_RULE_CAPTION_SAFE_AREA",
          message: `前景效果“${cue.type}”占满画面，会与稳定字幕争夺阅读区域；请使用两侧安全区或改为 fullscreen 场景。`,
          objectId: cue.id,
          frameRange: { startFrame: cue.startFrame, endFrame: cue.endFrame }
        }));
      }
      if (rule === "no_competing_visual") {
        const competitor = snapshot.effectCues.find((candidate) => candidate.id !== cue.id
          && candidate.status === "ready"
          && candidate.type !== "CameraPunch"
          && cue.type !== "CameraPunch"
          && candidate.sceneId === cue.sceneId
          && cuesOverlap(candidate, cue));
        if (competitor) {
          issues.push(issue({
            level: "blocking",
            code: "EFFECT_RULE_COMPETING_VISUAL",
            message: `效果“${cue.type}”与“${competitor.type}”在同一时间段同时争夺主视觉；请错开、降低为辅助层，或移除此规则。`,
            objectId: cue.id,
            frameRange: {
              startFrame: Math.max(cue.startFrame, competitor.startFrame),
              endFrame: Math.min(cue.endFrame, competitor.endFrame)
            }
          }));
        }
      }
      if (rule === "actor_mask_required") {
        if (cue.layer !== "rear" || !hasUsableActorMask(cue.sceneId)) {
          issues.push(issue({
            level: "blocking",
            code: "EFFECT_RULE_ACTOR_MASK_REQUIRED",
            message: `效果“${cue.type}”要求人物 Mask，但当前不是有可用 Mask 的后景 Cue。`,
            objectId: cue.id,
            frameRange: { startFrame: cue.startFrame, endFrame: cue.endFrame }
          }));
        }
      }
    }
  }
  if (!snapshot.speechAsset && snapshot.speechSegments.length > 0) {
    issues.push(issue({ level: "warning", code: "SPEECH_PENDING", message: "已有 SpeechSegment，但尚未组装 SpeechAsset；不可将文字稿当作已生成旁白。" }));
    if (snapshot.project.profile === "presenter_motion") {
      // 第一阶段的 Presenter 交付必须有可播放声音与稳定字幕的同一事实源。
      // 当前没有源音频强制对齐器，不能把按字数猜出的字幕范围当成已经完成的字幕。
      issues.push(issue({ level: "blocking", code: "PRESENTER_CAPTION_SOURCE_REQUIRED", message: "Presenter 已有语义段但没有可用 SpeechAsset 与稳定字幕；请先完成段级语音组装，或接入真实源音频对齐后再交付。" }));
    }
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
    const captionedSegmentIds = new Set(timeline.captions.map((caption) => caption.speechSegmentId));
    const missingCaptionSegment = snapshot.speechSegments.find((segment) => !captionedSegmentIds.has(segment.id));
    if (missingCaptionSegment) {
      issues.push(issue({
        level: "blocking",
        code: "PRESENTER_CAPTION_MISSING",
        message: "SpeechAsset 已就绪，但至少一个 SpeechSegment 没有稳定字幕，不能作为 Presenter 交付。",
        objectId: missingCaptionSegment.id
      }));
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
  const technicalIssues = [...issues];
  const allIssues = [...technicalIssues];
  const editorial: QualityReport["editorial"] = {
    status: editorialReview ? editorialReview.revision === revision ? "reviewed" : "stale" : "not_recorded",
    passes: editorialReview?.revision === revision ? [...editorialReview.passes] : [],
    semantic: [],
    pacing: [],
    attention: [],
    motion: [],
    typography: [],
    audio: [],
    modeSpecific: [],
    previewEvidence: editorialReview?.revision === revision ? [...editorialReview.previewEvidence] : []
  };
  // 审片结论来自真实预览与 Skill 判断。仅 blocking/warning 进入确定性质量门禁，
  // major/minor/inconclusive 则留在 ProductionRun，不能被伪装成系统自动发现的问题。
  if (editorialReview?.revision === revision) {
    for (const finding of editorialReview.findings) {
      if (finding.severity !== "blocking" && finding.severity !== "warning") continue;
      const editorialIssue: QualityIssue = {
        id: finding.id,
        level: finding.severity,
        code: `EDITORIAL_${finding.category.toUpperCase()}`,
        message: finding.summary,
        objectId: finding.objectId,
        frameRange: finding.frameRange
      };
      const category = finding.category === "mode_specific" ? "modeSpecific" : finding.category;
      editorial[category].push(editorialIssue);
      allIssues.push(editorialIssue);
    }
  }
  return {
    revision,
    generatedAt: new Date().toISOString(),
    technical: technicalIssues,
    editorial,
    requiredFixes: allIssues.filter((entry) => entry.level === "blocking"),
    issues: allIssues
  };
}

/** Delivery 需要能证明当前 Revision 已经真实看过；Draft 只跳过这项人工审片要求。 */
export function requiresEditorialReview(report: QualityReport, purpose: ExportPurpose): boolean {
  if (purpose !== "delivery") return false;
  const requiredPasses = ["audiovisual", "first_viewer"] as const;
  return report.editorial.status !== "reviewed"
    || report.editorial.previewEvidence.length === 0
    || !requiredPasses.every((pass) => report.editorial.passes.includes(pass));
}

export function canExport(report: QualityReport, purpose: ExportPurpose = "delivery"): boolean {
  return !report.issues.some((entry) => entry.level === "blocking") && !requiresEditorialReview(report, purpose);
}
