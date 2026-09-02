import { EFFECT_QUALITY_RULES, type EditorialQualityReview, type ExportPurpose, type ProjectSnapshot, type QualityIssue, type QualityReport } from "@videocut/contracts";
import { assertProjectGraphValid, createId, DomainError, millisecondsToFrames } from "@videocut/domain";

const issue = (input: Omit<QualityIssue, "id">): QualityIssue => ({ id: createId("quality"), ...input });
const effectQualityRuleSet = new Set<string>(EFFECT_QUALITY_RULES);

/** 返回相交帧区间；仅用于 Cue 的显式“不要争夺主视觉”规则。 */
function cuesOverlap(left: { startFrame: number; endFrame: number }, right: { startFrame: number; endFrame: number }): boolean {
  return left.startFrame < right.endFrame && right.startFrame < left.endFrame;
}

function captionOccurrenceIndex(text: string, phrase: string, occurrence: number): number {
  let index = -1;
  for (let current = 0; current <= occurrence; current += 1) {
    index = text.indexOf(phrase, index + 1);
    if (index < 0) return -1;
  }
  return index;
}

const isCaptionColor = (value: string | undefined) => value === undefined || /^#[0-9a-f]{6}$/iu.test(value);
const normalizeAlignmentText = (value: string) => value.normalize("NFKC").toLocaleLowerCase().replace(/[\s\p{P}\p{S}]+/gu, "");

/**
 * word_exact 不是普通的显示标签：它必须由当前 SpeechAsset、当前 Script 和已完成 Bridge Run 的
 * 实际 token 返回共同支撑。这里重复核心事实校验，确保手工改写快照时也能在交付 Gate 被阻止。
 */
function evaluateSpeechAlignmentQuality(snapshot: ProjectSnapshot, issues: QualityIssue[]): void {
  const speechAsset = snapshot.speechAsset;
  const alignment = snapshot.speechAlignment;
  if (!speechAsset) return;
  if (speechAsset.timing.precision !== "word_exact") {
    if (alignment?.status === "stale") {
      issues.push(issue({
        level: "warning",
        code: "SPEECH_ALIGNMENT_STALE",
        message: "词级对齐已过期，当前已回退到段级时序；若需要逐词效果，请对当前 SpeechAsset 重新强制对齐。",
        objectId: alignment.id
      }));
    }
    return;
  }
  if (!alignment || alignment.status !== "ready" || alignment.speechAssetId !== speechAsset.id
    || alignment.scriptRevision !== speechAsset.scriptRevision || alignment.scriptRevision !== snapshot.script.revision) {
    issues.push(issue({
      level: "blocking",
      code: "WORD_ALIGNMENT_REQUIRED",
      message: "当前 SpeechTiming 标记为 word_exact，但没有绑定同一 SpeechAsset 与 Script Revision 的已就绪真实词级对齐。",
      objectId: speechAsset.id
    }));
    return;
  }
  const speechFile = snapshot.assets.find((asset) => asset.id === speechAsset.assetId);
  const durationMs = speechFile?.metadata?.durationMs;
  const segmentById = new Map(speechAsset.timing.segments.map((timing) => [timing.speechSegmentId, timing]));
  let invalid = !speechFile?.metadata?.hasAudio || typeof durationMs !== "number" || !Number.isInteger(durationMs) || durationMs <= 0
    || !alignment.audit.workflowId?.trim() || !alignment.audit.runId?.trim() || !alignment.audit.schemaVersion?.trim() || !alignment.audit.completedAt
    || alignment.words.length === 0;
  let previousEndMs = -1;
  const normalizedWords: string[] = [];
  for (const word of alignment.words) {
    const segment = segmentById.get(word.speechSegmentId);
    const normalized = typeof word.text === "string" ? normalizeAlignmentText(word.text) : "";
    if (!segment || !normalized || word.normalizedText !== normalized
      || !Number.isInteger(word.startMs) || !Number.isInteger(word.endMs) || word.startMs < 0 || word.endMs <= word.startMs
      || word.endMs > (durationMs ?? 0) || word.startMs < previousEndMs
      || word.startMs < segment.startMs || word.endMs > segment.endMs
      || !Number.isInteger(word.startFrame) || !Number.isInteger(word.endFrame)
      || word.startFrame !== millisecondsToFrames(word.startMs, snapshot.timeline.fps)
      || word.endFrame !== millisecondsToFrames(word.endMs, snapshot.timeline.fps)
      || word.endFrame <= word.startFrame
      || (word.confidence !== undefined && (!Number.isFinite(word.confidence) || word.confidence < 0 || word.confidence > 1))) {
      invalid = true;
      break;
    }
    previousEndMs = word.endMs;
    normalizedWords.push(normalized);
  }
  const expectedText = speechAsset.timing.segments
    .slice()
    .sort((left, right) => left.startMs - right.startMs)
    .map((timing) => snapshot.speechSegments.find((segment) => segment.id === timing.speechSegmentId)?.text ?? "")
    .join("");
  if (!normalizeAlignmentText(expectedText) || normalizedWords.join("") !== normalizeAlignmentText(expectedText)) invalid = true;
  if (invalid) {
    issues.push(issue({
      level: "blocking",
      code: "WORD_ALIGNMENT_INVALID",
      message: "当前词级对齐的文本、段边界、真实音频范围、帧换算或 Bridge 审计不一致，不能用于逐词效果或交付。",
      objectId: alignment.id
    }));
    return;
  }
  const lowConfidence = alignment.words.filter((word) => word.confidence !== undefined && word.confidence < 0.5);
  if (lowConfidence.length > 0) {
    issues.push(issue({
      level: "warning",
      code: "WORD_ALIGNMENT_LOW_CONFIDENCE_REVIEW",
      message: `真实词级对齐中有 ${lowConfidence.length} 个 token 的 Provider 置信度低于 0.5；请在对应预览区间复听，不要只依赖数值。`,
      objectId: alignment.id,
      frameRange: {
        startFrame: Math.min(...lowConfidence.map((word) => word.startFrame)),
        endFrame: Math.max(...lowConfidence.map((word) => word.endFrame))
      }
    }));
  }
}

/**
 * Vlog 的确定性检查只验证已写入 Revision 的镜头、事件、现场声和拍点绑定。
 * 动作是否顺、反应是否真实、音乐是否好听仍必须通过连续 Preview 和专项审片判断。
 */
function evaluateVlogSpecificQuality(snapshot: ProjectSnapshot, issues: QualityIssue[]): void {
  const { timeline } = snapshot;
  const backgroundTrack = timeline.tracks.find((track) => track.name === "Background");
  const ambientTrack = timeline.tracks.find((track) => track.name === "Ambient");
  const shotById = new Map((snapshot.vlogShotAnalyses ?? []).map((shot) => [shot.id, shot]));
  const eventById = new Map((snapshot.vlogEvents ?? []).map((event) => [event.id, event]));
  const itemById = new Map(timeline.items.map((item) => [item.id, item]));
  const sceneById = new Map(snapshot.scenes.map((scene) => [scene.id, scene]));
  const activeItems = timeline.items.filter((item) => !item.disabled);
  const readyMontageScenes = snapshot.scenes.filter((scene) => scene.type === "VlogMontageScene" && scene.status === "ready");

  for (const shot of snapshot.vlogShotAnalyses ?? []) {
    if (shot.status === "stale") {
      issues.push(issue({
        level: "warning",
        code: "VLOG_SHOT_ANALYSIS_STALE",
        message: "Vlog 镜头边界证据已过期；不要继续将它当作当前 Event 或 Select 的依据。",
        objectId: shot.id,
        frameRange: { startFrame: shot.sourceStartFrame, endFrame: shot.sourceEndFrame }
      }));
    }
  }
  for (const event of snapshot.vlogEvents ?? []) {
    if (event.status === "stale") {
      issues.push(issue({
        level: "warning",
        code: "VLOG_EVENT_STALE",
        message: "Vlog Event Map 已因镜头证据或事件说明变化而过期，需要重新确认后再编译 Montage。",
        objectId: event.id
      }));
    }
  }

  for (const scene of readyMontageScenes) {
    const sceneItems = activeItems.filter((item) => item.sceneId === scene.id && item.trackId === backgroundTrack?.id);
    if (!sceneItems.length) {
      issues.push(issue({
        level: "blocking",
        code: "VLOG_MONTAGE_SCENE_EMPTY",
        message: "已就绪 VlogMontageScene 没有位于 Background 轨的可播放主画面。",
        objectId: scene.id,
        frameRange: { startFrame: scene.startFrame, endFrame: scene.endFrame }
      }));
    }
  }

  const selectKeyGroups = new Map<string, string[]>();
  const keepSelectIds = new Set<string>();
  for (const select of snapshot.vlogShotSelects ?? []) {
    const shot = shotById.get(select.shotAnalysisId);
    const event = eventById.get(select.eventId);
    if (select.status === "stale") {
      issues.push(issue({
        level: "warning",
        code: "VLOG_SELECT_STALE",
        message: "Vlog Shot Select 已过期，不能继续作为当前 Montage 主线的一部分。",
        objectId: select.id
      }));
      continue;
    }
    if (select.status !== "ready") continue;
    if (!shot || !event || shot.status !== "ready" || event.status !== "ready") {
      issues.push(issue({
        level: "blocking",
        code: "VLOG_SELECT_SOURCE_STALE",
        message: "已就绪 Vlog Shot Select 引用了缺失或过期的 Event / 镜头边界证据。",
        objectId: select.id
      }));
      continue;
    }
    const scene = select.sceneId ? sceneById.get(select.sceneId) : undefined;
    const item = select.timelineItemId ? itemById.get(select.timelineItemId) : undefined;
    if (!scene || scene.type !== "VlogMontageScene" || scene.status !== "ready" || !item || item.disabled
      || item.trackId !== backgroundTrack?.id || item.sceneId !== scene.id || item.assetId !== shot.assetId
      || item.sourceStartFrame !== select.sourceStartFrame || item.sourceEndFrame !== select.sourceEndFrame) {
      issues.push(issue({
        level: "blocking",
        code: "VLOG_SELECT_TIMELINE_BINDING_INVALID",
        message: "已就绪 Vlog Shot Select 没有以同一源范围绑定到 Background / VlogMontageScene。",
        objectId: select.id
      }));
    }

    const key = `${shot.assetId}:${select.sourceStartFrame}-${select.sourceEndFrame}`;
    const duplicates = selectKeyGroups.get(key) ?? [];
    duplicates.push(select.id);
    selectKeyGroups.set(key, duplicates);

    const ambientCues = (snapshot.vlogAmbientCues ?? []).filter((cue) => cue.shotSelectId === select.id && cue.status === "ready");
    if (select.sourceAudioMode === "keep") {
      keepSelectIds.add(select.id);
      const ambient = ambientCues[0];
      const ambientItem = ambient ? itemById.get(ambient.timelineItemId) : undefined;
      if (ambientCues.length !== 1 || !ambient || !ambientItem || ambientItem.disabled || ambientTrack?.muted
        || ambientItem.trackId !== ambientTrack?.id || ambient.assetId !== shot.assetId || ambientItem.assetId !== shot.assetId
        || ambientItem.sourceStartFrame !== select.sourceStartFrame || ambientItem.sourceEndFrame !== select.sourceEndFrame
        || select.ambientTimelineItemId !== ambientItem.id || (ambientItem.gainDb ?? 0) <= -80) {
        issues.push(issue({
          level: "blocking",
          code: "VLOG_AMBIENT_BINDING_INVALID",
          message: "标记为保留现场声的 Vlog Select 缺少同源、可播放的 Ambient 绑定，或该现场声已被静音。",
          objectId: select.id
        }));
      }
    } else if (ambientCues.length > 0 || select.ambientTimelineItemId) {
      issues.push(issue({
        level: "blocking",
        code: "VLOG_AMBIENT_UNEXPECTED",
        message: "标记为静音原声的 Vlog Select 仍保留 Ambient 绑定，会造成与剪辑意图不一致的现场声。",
        objectId: select.id
      }));
    }
  }

  for (const [sourceRange, selectIds] of selectKeyGroups) {
    if (selectIds.length > 1) {
      issues.push(issue({
        level: "warning",
        code: "VLOG_DUPLICATE_SHOT_REVIEW",
        message: `同一源范围 ${sourceRange} 被多个已就绪 Shot Select 重复使用；请在连续预览中确认不是无意重复镜头。`,
        objectId: selectIds[0]
      }));
    }
  }

  for (const ambient of snapshot.vlogAmbientCues ?? []) {
    if (ambient.status === "stale") {
      issues.push(issue({ level: "warning", code: "VLOG_AMBIENT_STALE", message: "Vlog 环境声已过期，必须重新试听并确认对应镜头。", objectId: ambient.id }));
      continue;
    }
    if (!keepSelectIds.has(ambient.shotSelectId)) {
      issues.push(issue({
        level: "blocking",
        code: "VLOG_AMBIENT_ORPHAN",
        message: "已就绪 Ambient Cue 没有对应的、明确保留原声的 Vlog Shot Select。",
        objectId: ambient.id
      }));
    }
  }
  if (readyMontageScenes.length > 0 && keepSelectIds.size === 0) {
    const hasMulticamMasterAudio = (snapshot.multicamGroups ?? []).some((group) => group.status === "ready" && Boolean(group.masterAudioTimelineItemId));
    if (hasMulticamMasterAudio) return;
    issues.push(issue({
      level: "warning",
      code: "VLOG_AMBIENT_ABSENT_REVIEW",
      message: "当前 Vlog Montage 没有保留任何现场声；请在真实试听中确认这是有意的声音策略，而不是被 BGM 或静音覆盖。"
    }));
  }
  for (const item of activeItems.filter((candidate) => candidate.trackId === ambientTrack?.id && candidate.sceneId && sceneById.get(candidate.sceneId)?.type === "VlogMontageScene")) {
    const linked = (snapshot.vlogAmbientCues ?? []).some((cue) => cue.status === "ready" && cue.timelineItemId === item.id);
    const multicamMaster = (snapshot.multicamGroups ?? []).some((group) => group.status === "ready" && group.masterAudioTimelineItemId === item.id && group.sceneId === item.sceneId);
    if (!linked && !multicamMaster) {
      issues.push(issue({
        level: "warning",
        code: "VLOG_AMBIENT_ITEM_UNMANAGED",
        message: "Vlog Montage 的 Ambient 轨存在未登记的现场声 Item；请明确它来自哪个 Shot Select 或停止该 Item。",
        objectId: item.id,
        frameRange: { startFrame: item.startFrame, endFrame: item.endFrame }
      }));
    }
  }

  const beatsByCueAndFrame = new Set<string>();
  const readyBeatFrames = new Set<number>();
  for (const beat of snapshot.vlogMusicBeats ?? []) {
    if (beat.status === "stale") {
      issues.push(issue({ level: "warning", code: "VLOG_MUSIC_BEAT_STALE", message: "Vlog 音乐拍点已过期；BGM 或主线变化后不能继续用它判断切点。", objectId: beat.id }));
      continue;
    }
    const cue = (snapshot.audioCues ?? []).find((candidate) => candidate.id === beat.audioCueId);
    const item = cue ? itemById.get(cue.timelineItemId) : undefined;
    const key = `${beat.audioCueId}:${beat.frame}`;
    if (beatsByCueAndFrame.has(key) || !cue || cue.kind !== "bgm" || cue.status !== "ready" || !item || item.disabled
      || item.startFrame > beat.frame || item.endFrame <= beat.frame) {
      issues.push(issue({
        level: "blocking",
        code: "VLOG_MUSIC_BEAT_BINDING_INVALID",
        message: "Vlog 音乐拍点没有绑定当前可播放 BGM，或同一 BGM 的同一帧被重复登记。",
        objectId: beat.id
      }));
    }
    beatsByCueAndFrame.add(key);
    readyBeatFrames.add(beat.frame);
  }
  const montageCuts = [...(snapshot.vlogShotSelects ?? [])]
    .filter((select) => select.status === "ready" && Boolean(select.timelineItemId))
    .map((select) => itemById.get(select.timelineItemId!)?.startFrame)
    .filter((frame): frame is number => frame !== undefined)
    .sort((left, right) => left - right)
    .slice(1);
  if (montageCuts.length >= 3 && montageCuts.every((frame) => readyBeatFrames.has(frame))) {
    issues.push(issue({
      level: "warning",
      code: "VLOG_MUSIC_CUT_DOMINANCE_REVIEW",
      message: "所有已记录的 Vlog 切点都恰好落在人工音乐拍点；请在连续预览中确认动作、视线和现场声没有被机械卡点覆盖。"
    }));
  }
}

/**
 * 多机位只验证可确定的同步事实、平铺绑定和单一主声音；口型、手势、反应和切点是否合适仍要在连续预览中确认。
 * 自动音频相关在未记录人工确认前永远只是 candidate，不能以“相关分数高”绕过这道门。
 */
function evaluateMulticamQuality(snapshot: ProjectSnapshot, issues: QualityIssue[]): void {
  const groups = snapshot.multicamGroups ?? [];
  const cuts = snapshot.multicamCuts ?? [];
  if (!groups.length && !cuts.length) return;
  const groupById = new Map(groups.map((group) => [group.id, group]));
  const itemById = new Map(snapshot.timeline.items.map((item) => [item.id, item]));
  const sceneById = new Map(snapshot.scenes.map((scene) => [scene.id, scene]));
  const assetById = new Map(snapshot.assets.map((asset) => [asset.id, asset]));
  const background = snapshot.timeline.tracks.find((track) => track.name === "Background");
  const ambient = snapshot.timeline.tracks.find((track) => track.name === "Ambient");
  /** 旧 Group 缺失 sourceRange 时按整条素材解释，保持历史项目可审片。 */
  const sourceRangeFor = (sync: typeof groups[number]["angleSyncs"][number]) => {
    const asset = assetById.get(sync.assetId);
    const duration = asset?.metadata ? millisecondsToFrames(asset.metadata.durationMs, snapshot.timeline.fps) : 0;
    const range = sync.sourceRange ?? { startFrame: 0, endFrame: duration };
    if (!Number.isInteger(range.startFrame) || !Number.isInteger(range.endFrame)
      || range.startFrame < 0 || range.endFrame <= range.startFrame || range.endFrame > duration) return undefined;
    return range;
  };
  const commonSessionRangeFor = (group: typeof groups[number]) => {
    let startFrame = Number.NEGATIVE_INFINITY;
    let endFrame = Number.POSITIVE_INFINITY;
    for (const sync of group.angleSyncs) {
      const range = sourceRangeFor(sync);
      if (!range) return undefined;
      startFrame = Math.max(startFrame, range.startFrame + sync.sessionOffsetFrames);
      endFrame = Math.min(endFrame, range.endFrame + sync.sessionOffsetFrames);
    }
    return Number.isInteger(startFrame) && Number.isInteger(endFrame) && startFrame >= 0 && endFrame > startFrame
      ? { startFrame, endFrame }
      : undefined;
  };

  for (const group of groups) {
    const groupCuts = cuts.filter((cut) => cut.groupId === group.id);
    const hasProgram = Boolean(group.sceneId || group.masterAudioTimelineItemId || groupCuts.some((cut) => cut.status === "ready"));
    const commonSessionRange = commonSessionRangeFor(group);
    if (!commonSessionRange) {
      issues.push(issue({
        level: "blocking",
        code: "MULTICAM_SYNC_RANGE_INVALID",
        message: "多机位同步源范围无效，或各机位没有共同可切换会话区间；不能把不同会话片段当成同一 Group。",
        objectId: group.id
      }));
    }
    if (group.status !== "ready" && hasProgram) {
      issues.push(issue({
        level: "blocking",
        code: "MULTICAM_SYNC_NOT_VERIFIED",
        message: "多机位同步仍是候选或已过期，却已有切机位/主声音参与 Timeline；请先重新确认同步证据。",
        objectId: group.id
      }));
    }
    if (group.status === "candidate") {
      issues.push(issue({
        level: "warning",
        code: "MULTICAM_SYNC_CANDIDATE_REVIEW",
        message: "多机位音频相关只生成了候选偏移；必须连续预览确认口型、动作和现场声后才能开始切机位。",
        objectId: group.id
      }));
    }
    if (group.status === "ready" && group.angleSyncs.some((sync) => sync.status !== "verified" || !sync.evidence.verifiedAt)) {
      issues.push(issue({
        level: "blocking",
        code: "MULTICAM_EVIDENCE_UNVERIFIED",
        message: "已就绪多机位 Group 含未完成预览确认的同步证据，不能作为剪辑基线。",
        objectId: group.id
      }));
    }
    const scene = group.sceneId ? sceneById.get(group.sceneId) : undefined;
    const masterItem = group.masterAudioTimelineItemId ? itemById.get(group.masterAudioTimelineItemId) : undefined;
    if (hasProgram && (!scene || scene.type !== "VlogMontageScene" || scene.status !== "ready" || !masterItem || masterItem.disabled
      || masterItem.trackId !== ambient?.id || masterItem.assetId !== group.masterAudioAssetId
      || masterItem.startFrame !== group.programStartFrame || masterItem.endFrame !== group.programEndFrame
      || (masterItem.gainDb ?? 0) <= -80)) {
      issues.push(issue({
        level: "blocking",
        code: "MULTICAM_MASTER_AUDIO_BINDING_INVALID",
        message: "多机位主声音没有作为一条可播放 Ambient Item 绑定到当前同步 Group；不能随镜头切换声源或叠加多个原声。",
        objectId: group.id,
        frameRange: group.programStartFrame !== undefined && group.programEndFrame !== undefined
          ? { startFrame: group.programStartFrame, endFrame: group.programEndFrame }
          : undefined
      }));
    }
    const masterAsset = assetById.get(group.masterAudioAssetId);
    if (hasProgram && (!masterAsset?.metadata?.hasAudio || masterAsset.status !== "ready")) {
      issues.push(issue({ level: "blocking", code: "MULTICAM_MASTER_AUDIO_UNAVAILABLE", message: "多机位主声音机位已不可用或没有真实音轨。", objectId: group.id }));
    }
    const masterSync = group.angleSyncs.find((sync) => sync.assetId === group.masterAudioAssetId);
    const masterSourceRange = masterSync ? sourceRangeFor(masterSync) : undefined;
    if (hasProgram && masterItem && masterSync && masterSourceRange && commonSessionRange
      && (masterItem.sourceStartFrame < masterSourceRange.startFrame || masterItem.sourceEndFrame > masterSourceRange.endFrame
        || masterItem.sourceStartFrame + masterSync.sessionOffsetFrames < commonSessionRange.startFrame
        || masterItem.sourceEndFrame + masterSync.sessionOffsetFrames > commonSessionRange.endFrame)) {
      issues.push(issue({
        level: "blocking",
        code: "MULTICAM_MASTER_AUDIO_OUTSIDE_SYNC_RANGE",
        message: "多机位 Ambient 主声音越过了本次确认的同步源范围，不能把另一会话的原声拼入当前 Program。",
        objectId: group.id
      }));
    }
  }

  for (const cut of cuts) {
    const group = groupById.get(cut.groupId);
    if (!group) {
      issues.push(issue({ level: "blocking", code: "MULTICAM_CUT_GROUP_MISSING", message: "多机位 Cut 引用了不存在的同步 Group。", objectId: cut.id }));
      continue;
    }
    const sync = group.angleSyncs.find((entry) => entry.assetId === cut.angleAssetId);
    if (!sync || sync.status !== "verified" || cut.sourceStartFrame !== cut.sessionStartFrame - sync.sessionOffsetFrames
      || cut.sourceEndFrame !== cut.sessionEndFrame - sync.sessionOffsetFrames
      || cut.sourceEndFrame - cut.sourceStartFrame !== cut.sessionEndFrame - cut.sessionStartFrame) {
      issues.push(issue({
        level: "blocking",
        code: "MULTICAM_CUT_SYNC_MAPPING_INVALID",
        message: "多机位 Cut 的源范围没有严格映射到已确认的 1:1 同步会话范围。",
        objectId: cut.id,
        frameRange: { startFrame: cut.sessionStartFrame, endFrame: cut.sessionEndFrame }
      }));
    }
    const sourceRange = sync ? sourceRangeFor(sync) : undefined;
    const commonSessionRange = commonSessionRangeFor(group);
    if (!sourceRange || !commonSessionRange || cut.sourceStartFrame < sourceRange.startFrame || cut.sourceEndFrame > sourceRange.endFrame
      || cut.sessionStartFrame < commonSessionRange.startFrame || cut.sessionEndFrame > commonSessionRange.endFrame) {
      issues.push(issue({
        level: "blocking",
        code: "MULTICAM_CUT_OUTSIDE_SYNC_RANGE",
        message: "多机位 Cut 超出了当前 Group 已确认的源范围或共同会话范围，必须缩短 Cut 或重新建立同步 Group。",
        objectId: cut.id,
        frameRange: { startFrame: cut.sessionStartFrame, endFrame: cut.sessionEndFrame }
      }));
    }
    if (cut.status !== "ready") continue;
    const item = cut.timelineItemId ? itemById.get(cut.timelineItemId) : undefined;
    const scene = cut.sceneId ? sceneById.get(cut.sceneId) : undefined;
    if (!item || item.disabled || !scene || scene.id !== group.sceneId || scene.type !== "VlogMontageScene" || scene.status !== "ready"
      || item.trackId !== background?.id || item.assetId !== cut.angleAssetId || item.sceneId !== scene.id
      || item.sourceStartFrame !== cut.sourceStartFrame || item.sourceEndFrame !== cut.sourceEndFrame
      || (item.gainDb ?? 0) > -80) {
      issues.push(issue({
        level: "blocking",
        code: "MULTICAM_CUT_TIMELINE_BINDING_INVALID",
        message: "多机位 Cut 没有以静音视频层、同一同步 Group 和正确源范围平铺到 Background。",
        objectId: cut.id
      }));
    }
  }

  for (const group of groups.filter((entry) => entry.sceneId && entry.programStartFrame !== undefined && entry.programEndFrame !== undefined)) {
    const readyCuts = cuts.filter((cut) => cut.groupId === group.id && cut.status === "ready")
      .sort((left, right) => left.sessionStartFrame - right.sessionStartFrame || left.order - right.order);
    if (!readyCuts.length || readyCuts[0]!.sessionStartFrame > readyCuts[0]!.sessionEndFrame) continue;
    for (let index = 1; index < readyCuts.length; index += 1) {
      if (readyCuts[index - 1]!.sessionEndFrame !== readyCuts[index]!.sessionStartFrame) {
        issues.push(issue({
          level: "blocking",
          code: "MULTICAM_PROGRAM_NOT_CONTIGUOUS",
          message: "已编译多机位主线包含会话空档或重叠；第一版不做隐藏黑帧或自动变速补偿。",
          objectId: group.id
        }));
        break;
      }
    }
  }
}

/**
 * 解释片的确定性规则只核对 Program、证据和事实合同；
 * “是否一眼看懂”仍必须由场景级 Preview 与 Editorial Review 判断，不能在这里伪造审美结论。
 */
function evaluateExplainerSpecificQuality(snapshot: ProjectSnapshot, issues: QualityIssue[]): void {
  const sceneById = new Map(snapshot.scenes.map((scene) => [scene.id, scene]));
  const captureById = new Map((snapshot.evidenceCaptures ?? []).map((capture) => [capture.id, capture]));
  const assetById = new Map(snapshot.assets.map((asset) => [asset.id, asset]));
  const programBySceneId = new Map<string, typeof snapshot.explainerPrograms>();
  const phaseOrder = { entry: 0, progressive: 1, settled: 2, exit: 3 } as const;
  const hasText = (value: unknown): value is string => typeof value === "string" && Boolean(value.trim());
  const textList = (value: unknown): string[] => Array.isArray(value)
    ? value.filter((item): item is string => hasText(item)).map((item) => item.trim())
    : [];
  const hasHistoryEvents = (value: unknown): boolean => Array.isArray(value) && value.length >= 2 && value.every((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return false;
    const event = item as Record<string, unknown>;
    return hasText(event.date) && hasText(event.label);
  });
  const hasReadyRealVisualAsset = (assetIds: string[]): boolean => assetIds.length > 0 && assetIds.every((assetId) => {
    const asset = assetById.get(assetId);
    return Boolean(asset && asset.status === "ready" && (asset.kind === "image" || asset.kind === "video") && asset.provenance?.source !== "generated");
  });

  for (const program of snapshot.explainerPrograms ?? []) {
    const scene = sceneById.get(program.sceneId);
    const sceneRange = scene ? { startFrame: scene.startFrame, endFrame: scene.endFrame } : undefined;
    if (!scene || scene.type !== "ExplainerScene") {
      issues.push(issue({ level: "blocking", code: "EXPLAINER_PROGRAM_SCENE_INVALID", message: "Explainer Program 没有绑定有效的 ExplainerScene。", objectId: program.id }));
      continue;
    }
    const sameScenePrograms = programBySceneId.get(scene.id) ?? [];
    sameScenePrograms.push(program);
    programBySceneId.set(scene.id, sameScenePrograms);
    if (program.status === "stale" || scene.status === "stale") {
      issues.push(issue({
        level: "blocking",
        code: "EXPLAINER_PROGRAM_STALE",
        message: "Explainer Scene 的 NarrativeMap、证据或可视素材已变化；必须重新编译并预览后才能交付。",
        objectId: program.id,
        frameRange: sceneRange
      }));
      continue;
    }
    if (scene.status !== "ready") {
      issues.push(issue({ level: "blocking", code: "EXPLAINER_SCENE_NOT_READY", message: "Explainer Program 对应的场景尚未就绪。", objectId: scene.id, frameRange: sceneRange }));
    }
    const duration = scene.endFrame - scene.startFrame;
    const requiredPhases = ["entry", "progressive", "settled", "exit"] as const;
    const phases = new Set(program.states.map((state) => state.phase));
    const stateOrderValid = program.states.every((state, index) => index === 0 || phaseOrder[program.states[index - 1]!.phase] <= phaseOrder[state.phase]);
    const stateCoverageValid = program.states.length >= 4
      && program.states[0]?.startFrame === 0
      && program.states.at(-1)?.endFrame === duration
      && program.states.every((state, index) => Number.isInteger(state.startFrame) && Number.isInteger(state.endFrame)
        && state.startFrame >= 0 && state.endFrame > state.startFrame && state.endFrame <= duration
        && (index === 0 || program.states[index - 1]!.endFrame === state.startFrame));
    if (!requiredPhases.every((phase) => phases.has(phase)) || !stateOrderValid || !stateCoverageValid) {
      issues.push(issue({
        level: "blocking",
        code: "EXPLAINER_STATE_PROGRAM_INVALID",
        message: "Explainer Scene 必须以 Entry → Progressive → Settled → Exit 的连续局部状态完整覆盖当前场景。",
        objectId: program.id,
        frameRange: sceneRange
      }));
    }
    if (!program.cacheKey.trim()) {
      issues.push(issue({ level: "blocking", code: "EXPLAINER_CACHE_KEY_MISSING", message: "Explainer Program 缺少场景级缓存键，无法证明当前 Preview 对应输入事实。", objectId: program.id }));
    }
    if (program.kind === "EvidenceDocument") {
      const capture = program.evidenceCaptureId ? captureById.get(program.evidenceCaptureId) : undefined;
      const source = capture ? assetById.get(capture.sourceAssetId) : undefined;
      const visual = capture ? assetById.get(capture.snapshotAssetId ?? capture.sourceAssetId) : undefined;
      if (!capture || capture.status !== "ready" || !source || source.status !== "ready" || source.provenance?.source === "generated"
        || !visual || visual.status !== "ready" || visual.provenance?.source === "generated" || (visual.kind !== "image" && visual.kind !== "derived")
        || !capture.sourceUrl.trim() || !capture.excerpt.trim() || !capture.claim.trim() || !capture.limitation.trim() || capture.highlights.length === 0) {
        issues.push(issue({
          level: "blocking",
          code: "EVIDENCE_DOCUMENT_FACTS_INVALID",
          message: "EvidenceDocument 必须绑定非生成的真实来源、可视页面截图、原文摘录、主张、适用限制和高亮范围。",
          objectId: program.id,
          frameRange: sceneRange
        }));
      }
    }
    if (program.kind === "UIWalkthrough") {
      const assets = program.assetIds.map((assetId) => assetById.get(assetId)).filter((asset): asset is NonNullable<typeof asset> => Boolean(asset));
      if (assets.length === 0 || assets.some((asset) => asset.status !== "ready" || asset.provenance?.source === "generated")) {
        issues.push(issue({
          level: "blocking",
          code: "UI_WALKTHROUGH_FACTS_INVALID",
          message: "UIWalkthrough 必须使用已就绪、非生成的真实产品界面截图或录屏。",
          objectId: program.id,
          frameRange: sceneRange
        }));
      }
    }
    if (program.kind === "DataConclusion") {
      const values = Array.isArray(program.props.values) ? program.props.values : [];
      const labels = Array.isArray(program.props.labels) ? program.props.labels : [];
      if (values.length === 0 || values.some((value) => typeof value !== "number" || !Number.isFinite(value))
        || labels.length !== values.length || labels.some((label) => !hasText(label))
        || !hasText(program.props.source) || !hasText(program.props.unit) || !hasText(program.props.baseline)) {
        issues.push(issue({
          level: "blocking",
          code: "DATA_CONCLUSION_FACTS_INVALID",
          message: "DataConclusion 必须保存同长度数据/标签、来源、单位和基线，不能用装饰性图表替代事实。",
          objectId: program.id,
          frameRange: sceneRange
        }));
      }
    }
    if (program.kind === "PeopleGrouping" && (textList(program.props.groups).length < 2 || !hasText(program.props.dimension))) {
      issues.push(issue({
        level: "blocking",
        code: "PEOPLE_GROUPING_FACTS_INVALID",
        message: "PeopleGrouping 必须保存至少两个人群及清晰分组维度，不能根据人物外观临时推断身份。",
        objectId: program.id,
        frameRange: sceneRange
      }));
    }
    if (program.kind === "LayerStack" && (textList(program.props.layers).length < 2 || !hasText(program.props.relationship))) {
      issues.push(issue({
        level: "blocking",
        code: "LAYER_STACK_FACTS_INVALID",
        message: "LayerStack 必须保存至少两层结构与层间关系，不能将装饰卡片当作结构解释。",
        objectId: program.id,
        frameRange: sceneRange
      }));
    }
    if (program.kind === "HistoryTimeline" && (!hasHistoryEvents(program.props.events) || !hasText(program.props.source))) {
      issues.push(issue({
        level: "blocking",
        code: "HISTORY_TIMELINE_FACTS_INVALID",
        message: "HistoryTimeline 必须保存至少两个日期和事件标签完整的节点，以及可追溯来源。",
        objectId: program.id,
        frameRange: sceneRange
      }));
    }
    if (program.kind === "QuotePortrait" && (Boolean(program.evidenceCaptureId)
      || !hasText(program.props.quote) || !hasText(program.props.attribution) || !hasText(program.props.source)
      || !hasReadyRealVisualAsset(program.assetIds))) {
      issues.push(issue({
        level: "blocking",
        code: "QUOTE_PORTRAIT_FACTS_INVALID",
        message: "QuotePortrait 必须保留引语、归属、来源和已就绪的非生成真实人物或机构素材；文档举证请使用 EvidenceDocument。",
        objectId: program.id,
        frameRange: sceneRange
      }));
    }
    if (program.kind === "RealityBroll" && (Boolean(program.evidenceCaptureId) || !hasReadyRealVisualAsset(program.assetIds))) {
      issues.push(issue({
        level: "blocking",
        code: "REALITY_BROLL_FACTS_INVALID",
        message: "RealityBroll 必须绑定已就绪、非生成的真实图片或视频，且不能把 EvidenceCapture 当作现实素材。",
        objectId: program.id,
        frameRange: sceneRange
      }));
    }
  }

  for (const scene of snapshot.scenes.filter((candidate) => candidate.type === "ExplainerScene" && candidate.status === "ready")) {
    const programs = programBySceneId.get(scene.id) ?? [];
    if (programs.length !== 1 || programs[0]?.status !== "ready") {
      issues.push(issue({
        level: "blocking",
        code: "EXPLAINER_SCENE_PROGRAM_MISSING",
        message: "已就绪 ExplainerScene 必须恰好关联一个当前已就绪的 Explainer Program。",
        objectId: scene.id,
        frameRange: { startFrame: scene.startFrame, endFrame: scene.endFrame }
      }));
    }
  }
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
  const backgroundTrack = timeline.tracks.find((track) => track.name === "Background");
  const isVlogProfile = snapshot.project.profile === "vlog";
  const isExplainerProfile = snapshot.project.profile === "visual_explainer";
  const hasVlogContent = snapshot.scenes.some((scene) => scene.type === "VlogMontageScene") || (snapshot.vlogShotSelects ?? []).length > 0;
  const readyVlogSceneIds = new Set(snapshot.scenes
    .filter((scene) => scene.type === "VlogMontageScene" && scene.status === "ready")
    .map((scene) => scene.id));
  const hasVlogPrimaryVideo = Boolean(backgroundTrack && timeline.items.some((item) => (
    !item.disabled && item.trackId === backgroundTrack.id && Boolean(item.sceneId) && readyVlogSceneIds.has(item.sceneId!)
  )));
  const hasMulticamPrimaryVideo = Boolean(backgroundTrack && (snapshot.multicamGroups ?? []).some((group) => (
    group.status === "ready" && Boolean(group.sceneId) && timeline.items.some((item) => !item.disabled && item.trackId === backgroundTrack.id && item.sceneId === group.sceneId)
  )));
  const hasExplainerContent = snapshot.scenes.some((scene) => scene.type === "ExplainerScene") || (snapshot.explainerPrograms ?? []).length > 0;
  try {
    assertProjectGraphValid(snapshot);
  } catch (error) {
    const message = error instanceof DomainError ? error.message : "项目对象关系校验失败。";
    issues.push(issue({ level: "blocking", code: "PROJECT_GRAPH_INVALID", message }));
  }
  if (isVlogProfile) {
    if (!hasVlogPrimaryVideo) {
      issues.push(issue({ level: "blocking", code: "VLOG_PRIMARY_MONTAGE_MISSING", message: "Vlog 必须以 Background 轨上的已就绪 VlogMontageScene 承担主画面。" }));
    }
  } else if (isExplainerProfile) {
    const hasExplainerPrimaryVisual = (snapshot.explainerPrograms ?? []).some((program) => {
      const scene = snapshot.scenes.find((candidate) => candidate.id === program.sceneId);
      return program.status === "ready" && scene?.type === "ExplainerScene" && scene.status === "ready";
    });
    if (!hasExplainerPrimaryVisual) {
      issues.push(issue({ level: "blocking", code: "EXPLAINER_PRIMARY_VISUAL_MISSING", message: "视觉解释片必须由当前已就绪的 ExplainerScene / Program 承担主视觉。" }));
    }
  // Hybrid 的实拍主线可以由 VlogMontageScene 承担；Presenter / Explainer 仍各自保留原有门禁。
  } else if ((!actorTrack || !timeline.items.some((item) => item.trackId === actorTrack.id && !item.disabled))
    && !hasMulticamPrimaryVideo
    && !(snapshot.project.profile === "hybrid" && hasVlogPrimaryVideo)) {
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
  if (isVlogProfile || hasVlogContent) evaluateVlogSpecificQuality(snapshot, issues);
  evaluateMulticamQuality(snapshot, issues);
  if (isExplainerProfile || hasExplainerContent) evaluateExplainerSpecificQuality(snapshot, issues);
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
  for (const asset of snapshot.assets.filter((candidate) => usedAssetIds.has(candidate.id) && (candidate.provenance?.source === "provider" || candidate.provenance?.source === "generated"))) {
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
  const capabilityById = new Map((snapshot.actorCapabilityProfiles ?? []).map((profile) => [profile.id, profile]));
  const assetsById = new Map(snapshot.assets.map((asset) => [asset.id, asset]));
  const tracksById = new Map(timeline.tracks.map((track) => [track.id, track]));
  const maskAssetFor = (performance: typeof performances[number]) => performance.maskAssetId
    ? assetsById.get(performance.maskAssetId)
    : undefined;
  const isUsableActorMask = (performance: typeof performances[number], item: typeof timeline.items[number]) => {
    const actorAsset = assetsById.get(item.assetId);
    if (performance.maskMode === "embedded_alpha") return Boolean(actorAsset?.metadata?.hasAlpha);
    const mask = maskAssetFor(performance);
    return performance.maskMode === "alpha_asset"
      && Boolean(mask && mask.status === "ready" && ["image", "derived"].includes(mask.kind)
        && mask.role === "actor_mask" && mask.metadata?.hasAlpha
        && actorAsset?.metadata?.width && actorAsset.metadata.height
        && mask.metadata?.width === actorAsset.metadata.width && mask.metadata.height === actorAsset.metadata.height
        && performance.layout);
  };
  /**
   * 精确人物锚点只能从当前范围内 Actor / A-roll 轨的已就绪人物表演选择。
   * 不允许同一 Scene 中的 Dialogue、Cutaway 或数组顺序抢走人物布局。
   */
  const readyActorPerformancesForRange = (sceneId: string, startFrame: number, endFrame: number) => timeline.items
    .filter((item) => item.sceneId === sceneId && !item.disabled && item.startFrame < endFrame && item.endFrame > startFrame
      && tracksById.get(item.trackId)?.name === "Actor / A-roll")
    .flatMap((item) => {
      const performance = performanceByItem.get(item.id);
      return performance?.status === "ready" ? [{ item, performance }] : [];
    });
  // 未登记、尺寸不匹配或无 Alpha 的人物不能被推断为“已经有 Mask”。
  const hasUsableActorMask = (sceneId: string, startFrame: number, endFrame: number) => readyActorPerformancesForRange(sceneId, startFrame, endFrame)
    .some(({ item, performance }) => item.startFrame <= startFrame && item.endFrame >= endFrame && isUsableActorMask(performance, item));
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
      const mask = maskAssetFor(performance);
      if (!mask || mask.status !== "ready") {
        issues.push(issue({ level: "blocking", code: "ACTOR_MASK_MISSING", message: "人物表演声明使用独立 Mask，但 Mask 素材不可用。", objectId: performance.id }));
      } else if (!actorAsset?.metadata?.width || !actorAsset.metadata.height || !mask.metadata?.width || !mask.metadata.height) {
        issues.push(issue({ level: "blocking", code: "ACTOR_MASK_DIMENSIONS_MISSING", message: "人物视频或静态 Mask 缺少已分析尺寸，无法确认遮挡对齐。", objectId: performance.id }));
      } else if (mask.kind !== "image" && mask.kind !== "derived") {
        issues.push(issue({ level: "blocking", code: "ACTOR_MASK_KIND_INVALID", message: "独立人物 Mask 只能是静态图片或派生图片，动态遮挡尚未实现。", objectId: performance.id }));
      } else if (mask.role !== "actor_mask" || !mask.metadata.hasAlpha) {
        issues.push(issue({ level: "blocking", code: "ACTOR_MASK_ALPHA_INVALID", message: "独立人物 Mask 必须标为 actor_mask 且经媒体分析确认包含 Alpha。", objectId: performance.id }));
      } else if (mask.metadata.width !== actorAsset?.metadata?.width || mask.metadata.height !== actorAsset?.metadata?.height) {
        issues.push(issue({ level: "blocking", code: "ACTOR_MASK_DIMENSIONS_MISMATCH", message: "独立人物 Mask 与人物视频尺寸不一致，不能通过拉伸伪造遮挡对齐。", objectId: performance.id }));
      } else if (!performance.layout) {
        issues.push(issue({ level: "blocking", code: "ACTOR_MASK_STATIC_LAYOUT_REQUIRED", message: "静态人物 Mask 只能用于已登记人工静态布局的人物；动态动作请降级为前景效果。", objectId: performance.id }));
      } else if (!(editorialReview?.revision === revision
        && editorialReview.passes.includes("mute_visual")
        && editorialReview.passes.includes("audiovisual")
        && editorialReview.previewEvidence.length > 0)) {
        // 静态图 Mask 在单帧正确仍可能在动作中错位，必须由当前 Revision 的真实连续预览审片收口。
        issues.push(issue({ level: "blocking", code: "ACTOR_MASK_CONTINUOUS_PREVIEW_REQUIRED", message: "静态人物 Mask 需要当前 Revision 的静音画面与声画连续预览证据，确认头发、手部和动作过程中没有错位。", objectId: performance.id, frameRange: { startFrame: item.startFrame, endFrame: item.endFrame } }));
      }
    }
    if (performance.maskMode === "embedded_alpha" && !actorAsset?.metadata?.hasAlpha) {
      issues.push(issue({ level: "blocking", code: "ACTOR_EMBEDDED_ALPHA_INVALID", message: "人物表演声明 embedded_alpha，但视频媒体分析没有确认 Alpha 通道。", objectId: performance.id }));
    }
    if (performance.maskMode === "none") {
      issues.push(issue({ level: "warning", code: "ACTOR_MASK_FALLBACK", message: "人物表演没有 Mask，后景效果会以可见前景降级；请在预览中确认遮挡关系。", objectId: performance.id, frameRange: { startFrame: item.startFrame, endFrame: item.endFrame } }));
    }
    if (performance.source === "generated") {
      if (!snapshot.speechAsset || performance.speechAssetId !== snapshot.speechAsset.id || performance.scriptRevision !== snapshot.speechAsset.scriptRevision) {
        issues.push(issue({ level: "blocking", code: "ACTOR_SPEECH_VERSION_MISMATCH", message: "生成型人物表演没有绑定当前 SpeechAsset 与 Script Revision。", objectId: performance.id }));
      }
      if (!performance.capabilityProfileId || !capabilityById.has(performance.capabilityProfileId)) {
        issues.push(issue({ level: "blocking", code: "ACTOR_CAPABILITY_PROFILE_MISSING", message: "生成型人物表演缺少可读回的 Provider 能力档案。", objectId: performance.id }));
      } else if (!capabilityById.get(performance.capabilityProfileId)?.supportsAudioDrivenLipSync) {
        // H3 多参考工作流能接收参考音频，不等于已经验证音频驱动口型；未声明时不能以“数字人口播”交付。
        issues.push(issue({ level: "blocking", code: "ACTOR_LIP_SYNC_CAPABILITY_UNVERIFIED", message: "当前人物 Provider 未明确声明音频驱动口型同步能力；请改用已验证 Provider、重新登记能力，或不要把该生成画面作为同步口播人物交付。", objectId: performance.id, frameRange: { startFrame: item.startFrame, endFrame: item.endFrame } }));
      }
      if (!performance.generationJobId || !performance.generationRange) {
        issues.push(issue({ level: "blocking", code: "ACTOR_GENERATION_TRACE_MISSING", message: "生成型人物表演缺少生成 Job 或可局部重生成的 SpeechSegment 范围。", objectId: performance.id }));
      } else if (performance.generationRange.startFrame < item.startFrame || performance.generationRange.endFrame > item.endFrame) {
        issues.push(issue({ level: "blocking", code: "ACTOR_GENERATION_RANGE_INVALID", message: "人物生成范围没有被对应 Timeline Item 完整覆盖。", objectId: performance.id }));
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
  const managedAudioItemIds = new Set((snapshot.audioCues ?? []).map((cue) => cue.timelineItemId));
  for (const cue of snapshot.audioCues ?? []) {
    const item = timeline.items.find((candidate) => candidate.id === cue.timelineItemId);
    const asset = snapshot.assets.find((candidate) => candidate.id === cue.assetId);
    const expectedTrackName = cue.kind === "bgm" ? "BGM" : "SFX";
    const track = item ? timeline.tracks.find((candidate) => candidate.id === item.trackId) : undefined;
    if (cue.status === "stale") {
      issues.push(issue({
        level: "warning",
        code: "STALE_AUDIO_CUE",
        message: `${cue.kind === "bgm" ? "BGM" : "SFX"} 的主线关联已变化，当前应停止参与合成；请重新确认时长、Duck 或事件落点。`,
        objectId: cue.id,
        frameRange: item ? { startFrame: item.startFrame, endFrame: item.endFrame } : undefined
      }));
      if (item && !item.disabled) {
        issues.push(issue({ level: "blocking", code: "STALE_AUDIO_CUE_AUDIBLE", message: "已过期的 AudioCue 仍在可播放声音轨上；请重新确认或停止该 Item。", objectId: cue.id }));
      }
      continue;
    }
    if (!item || item.disabled || !asset || asset.status !== "ready" || asset.kind !== "audio" || !asset.metadata?.hasAudio || track?.name !== expectedTrackName || item.assetId !== cue.assetId) {
      issues.push(issue({ level: "blocking", code: "AUDIO_CUE_BINDING_INVALID", message: "已就绪 AudioCue 缺少可播放的独立音频、专用轨道或一致的 Timeline Item 绑定。", objectId: cue.id }));
      continue;
    }
    const duration = item.endFrame - item.startFrame;
    const sourceDuration = item.sourceEndFrame - item.sourceStartFrame;
    if (!Number.isFinite(item.gainDb ?? 0) || (item.gainDb ?? 0) < -48 || (item.gainDb ?? 0) > 12
      || !Number.isInteger(cue.fadeInFrames) || !Number.isInteger(cue.fadeOutFrames)
      || cue.fadeInFrames < 0 || cue.fadeOutFrames < 0 || cue.fadeInFrames + cue.fadeOutFrames > duration) {
      issues.push(issue({ level: "blocking", code: "AUDIO_CUE_MIX_INVALID", message: "声音增益或淡入淡出参数超出当前可渲染范围。", objectId: cue.id, frameRange: { startFrame: item.startFrame, endFrame: item.endFrame } }));
    }
    if (cue.kind === "bgm") {
      if (cue.anchor !== "sequence_global" || (!cue.loop && sourceDuration < duration)) {
        issues.push(issue({ level: "blocking", code: "BGM_RANGE_INVALID", message: "BGM 必须绑定整片/章节，且非循环音乐的源范围必须覆盖目标时长。", objectId: cue.id, frameRange: { startFrame: item.startFrame, endFrame: item.endFrame } }));
      }
      const ducking = cue.ducking;
      if (!ducking || !Number.isFinite(ducking.reductionDb) || ducking.reductionDb > -1 || ducking.reductionDb < -36
        || !Number.isInteger(ducking.attackFrames) || !Number.isInteger(ducking.releaseFrames) || ducking.attackFrames < 0 || ducking.releaseFrames < 0) {
        issues.push(issue({ level: "blocking", code: "BGM_DUCKING_INVALID", message: "BGM 缺少可执行的 Duck 配置；请明确开关、衰减、攻击和释放。", objectId: cue.id }));
      } else if (overlapsDialogue(item) && !ducking.enabled) {
        issues.push(issue({ level: "warning", code: "BGM_DIALOGUE_DUCK_REVIEW", message: "BGM 与 Dialogue 重叠但 Duck 已关闭；请在真实试听中确认旁白仍清楚。", objectId: cue.id, frameRange: { startFrame: item.startFrame, endFrame: item.endFrame } }));
      }
    } else if (cue.anchor !== "media_event" || cue.eventFrame === undefined || cue.onsetOffsetFrames === undefined
      || cue.onsetOffsetFrames < 0 || cue.eventFrame !== item.startFrame + cue.onsetOffsetFrames
      || cue.eventFrame < item.startFrame || cue.eventFrame >= item.endFrame || cue.loop || cue.ducking !== undefined) {
      issues.push(issue({ level: "blocking", code: "SFX_EVENT_INVALID", message: "SFX 必须以显式 media_event 与可追溯 onsetOffset 放置，且不能循环或承载 Duck。", objectId: cue.id, frameRange: { startFrame: item.startFrame, endFrame: item.endFrame } }));
    }
  }
  for (const item of timeline.items.filter((candidate) => !candidate.disabled && ["BGM", "SFX"].includes(timeline.tracks.find((track) => track.id === candidate.trackId)?.name ?? "") && !managedAudioItemIds.has(candidate.id))) {
    issues.push(issue({ level: "warning", code: "UNMANAGED_AUDIO_ITEM", message: "BGM / SFX 轨存在未关联 AudioCue 的旧 Item；请通过 manage_audio 重新登记用途、淡化与事件。", objectId: item.id, frameRange: { startFrame: item.startFrame, endFrame: item.endFrame } }));
  }
  if ((snapshot.audioCues ?? []).some((cue) => cue.status === "ready")) {
    issues.push(issue({ level: "warning", code: "AUDIO_ONLY_PREVIEW_REQUIRED", message: "当前存在 BGM 或 SFX；请在真实 Preview 和最终导出中只听声音，确认 Duck、淡化、SFX 落点与头尾没有爆点或突兀回升。" }));
  }
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
    const speechSegment = snapshot.speechSegments.find((segment) => segment.id === caption.speechSegmentId);
    const timing = snapshot.speechAsset?.timing.segments.find((segment) => segment.speechSegmentId === caption.speechSegmentId);
    if (caption.endFrame <= caption.startFrame) {
      issues.push(issue({ level: "blocking", code: "INVALID_CAPTION_RANGE", message: "字幕卡的帧范围无效。", objectId: caption.id }));
    }
    if (!caption.text.trim()) {
      issues.push(issue({ level: "blocking", code: "CAPTION_TEXT_EMPTY", message: "字幕卡文案不能为空。", objectId: caption.id }));
    }
    if (caption.text.length > 80 || caption.text.split("\n").length > 2) {
      issues.push(issue({ level: "blocking", code: "CAPTION_TEXT_LAYOUT_INVALID", message: "稳定字幕最多 80 个字符、两行；请拆分语义 Card，而不是缩小文字。", objectId: caption.id }));
    }
    const sourceText = caption.sourceText ?? caption.text;
    if (speechSegment && sourceText !== speechSegment.text) {
      issues.push(issue({
        level: "blocking",
        code: "CAPTION_SOURCE_STALE",
        message: "字幕引用的语音原文已经变化；请按当前 SpeechAsset 重建 Card，不能静默沿用旧字幕。",
        objectId: caption.id,
        frameRange: { startFrame: caption.startFrame, endFrame: caption.endFrame }
      }));
    }
    if (caption.textMode === "derived" && caption.text !== sourceText) {
      issues.push(issue({
        level: "blocking",
        code: "CAPTION_DERIVED_TEXT_MISMATCH",
        message: "标记为语音原文的字幕与来源文字不一致；请恢复原文或明确标记为手工屏幕文案。",
        objectId: caption.id
      }));
    }
    if (caption.textMode === "manual" && caption.text !== sourceText) {
      issues.push(issue({
        level: "warning",
        code: "CAPTION_MANUAL_TEXT_REVIEW",
        message: "该字幕已单独编辑屏幕文案；请在有声预览中确认没有改变事实、否定和数字。",
        objectId: caption.id,
        frameRange: { startFrame: caption.startFrame, endFrame: caption.endFrame }
      }));
    }
    if (timing && (caption.startFrame !== timing.startFrame || caption.endFrame !== timing.endFrame)) {
      issues.push(issue({
        level: "blocking",
        code: "CAPTION_TIMING_STALE",
        message: "字幕卡范围与当前 SpeechAsset 的段级时序不一致；请重新生成或重建字幕。",
        objectId: caption.id,
        frameRange: { startFrame: caption.startFrame, endFrame: caption.endFrame }
      }));
    }
    if (caption.emphasis && (!Number.isInteger(caption.emphasis.occurrence)
      || caption.emphasis.occurrence < 0
      || captionOccurrenceIndex(caption.text, caption.emphasis.text, caption.emphasis.occurrence) < 0)) {
      issues.push(issue({
        level: "blocking",
        code: "CAPTION_EMPHASIS_STALE",
        message: "字幕强调短语不再位于当前 Card 文案中；请重新选择强调或清除它。",
        objectId: caption.id
      }));
    }
    const format = caption.format;
    if (format && (!Number.isInteger(format.fontSize) || format.fontSize < 16 || format.fontSize > 72
      || !Number.isInteger(format.fontWeight) || format.fontWeight < 400 || format.fontWeight > 900
      || format.bottomPercent < 4 || format.bottomPercent > 20
      || format.horizontalInsetPercent < 3 || format.horizontalInsetPercent > 20
      || !["left", "center", "right"].includes(format.textAlign)
      || !isCaptionColor(format.color) || !isCaptionColor(format.backgroundColor))) {
      issues.push(issue({ level: "blocking", code: "CAPTION_FORMAT_INVALID", message: "字幕排版参数超出稳定字幕支持范围；请恢复默认或使用受支持的字号、颜色与安全区。", objectId: caption.id }));
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
      if (!hasUsableActorMask(cue.sceneId, cue.startFrame, cue.endFrame)) {
        issues.push(issue({ level: "warning", code: "REAR_EFFECT_FALLBACK", message: "后景效果缺少可用人物 Mask，渲染会降级为前景可见层，需复核遮挡。", objectId: cue.id, frameRange: { startFrame: cue.startFrame, endFrame: cue.endFrame } }));
      }
    }
    const actorCandidatesForCue = readyActorPerformancesForRange(cue.sceneId, cue.startFrame, cue.endFrame);
    if (cue.spatialAnchor === "actor_head" || cue.spatialAnchor === "actor_hands") {
      if (actorCandidatesForCue.length > 1) {
        issues.push(issue({
          level: "blocking",
          code: "EFFECT_ACTOR_ANCHOR_AMBIGUOUS",
          message: `效果“${cue.type}”在当前范围内命中多个 Actor / A-roll 人物，不能按 Timeline 数组顺序猜测头部或手部锚点。`,
          objectId: cue.id,
          frameRange: { startFrame: cue.startFrame, endFrame: cue.endFrame }
        }));
      } else if (!actorCandidatesForCue[0]
        || actorCandidatesForCue[0].item.startFrame > cue.startFrame
        || actorCandidatesForCue[0].item.endFrame < cue.endFrame) {
        issues.push(issue({
          level: "blocking",
          code: "EFFECT_ACTOR_ANCHOR_RANGE_UNCOVERED",
          message: `效果“${cue.type}”的${cue.spatialAnchor === "actor_head" ? "头部" : "手部"}锚点没有被同一人物完整覆盖；请缩短 Cue 或改用安全区。`,
          objectId: cue.id,
          frameRange: { startFrame: cue.startFrame, endFrame: cue.endFrame }
        }));
      } else {
        const performance = actorCandidatesForCue[0].performance;
        const point = cue.spatialAnchor === "actor_head" ? performance.layout?.actorHead : performance.layout?.actorHands;
        if (!point) {
          issues.push(issue({
            level: "blocking",
            code: "EFFECT_ACTOR_ANCHOR_MISSING",
            message: `效果“${cue.type}”要求${cue.spatialAnchor === "actor_head" ? "人物头部" : "人物手部"}锚点，但当前场景没有已确认的人物布局。`,
            objectId: cue.id,
            frameRange: { startFrame: cue.startFrame, endFrame: cue.endFrame }
          }));
        } else {
          issues.push(issue({
            level: "warning",
            code: "EFFECT_ACTOR_ANCHOR_MANUAL_REVIEW",
            message: `效果“${cue.type}”使用人工静态人物锚点；必须通过连续预览确认动作过程中没有漂移或遮挡。`,
            objectId: cue.id,
            frameRange: { startFrame: cue.startFrame, endFrame: cue.endFrame }
          }));
        }
      }
    }
    if (cue.spatialAnchor === "behind_actor" && (cue.layer !== "rear" || !hasUsableActorMask(cue.sceneId, cue.startFrame, cue.endFrame))) {
      issues.push(issue({
        level: "blocking",
        code: "EFFECT_BEHIND_ACTOR_MASK_REQUIRED",
        message: `效果“${cue.type}”要求人物后景遮挡，但当前没有同场景可用 Mask 的 rear Cue。`,
        objectId: cue.id,
        frameRange: { startFrame: cue.startFrame, endFrame: cue.endFrame }
      }));
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
        if (cue.layer !== "rear" || !hasUsableActorMask(cue.sceneId, cue.startFrame, cue.endFrame)) {
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
    evaluateSpeechAlignmentQuality(snapshot, issues);
    if (snapshot.speechAsset.scriptRevision !== snapshot.script.revision) {
      issues.push(issue({ level: "blocking", code: "SPEECH_SCRIPT_STALE", message: "SpeechAsset 与当前 Script Revision 不一致，需要重新生成受影响的语音段。", objectId: snapshot.speechAsset.id }));
    }
    const dialogueItems = timeline.items.filter((item) => item.trackId === dialogueTrack?.id && item.assetId === snapshot.speechAsset?.assetId && !item.disabled);
    if (dialogueItems.length !== 1) {
      issues.push(issue({ level: "blocking", code: "SPEECH_DIALOGUE_ITEM_MISSING", message: "SpeechAsset 没有以唯一 Item 写入 Dialogue 轨，最终导出不会可靠包含旁白。", objectId: snapshot.speechAsset.id }));
    }
    if (!isVlogProfile && timeline.captions.some((caption) => caption.precision !== snapshot.speechAsset?.timing.precision)) {
      issues.push(issue({ level: "warning", code: "CAPTION_SPEECH_MISMATCH", message: "字幕时序精度与当前 SpeechAsset 不一致，需要重新检查字幕。", objectId: snapshot.speechAsset.id }));
    }
    const captionedSegmentIds = new Set(timeline.captions.map((caption) => caption.speechSegmentId));
    const missingCaptionSegment = snapshot.speechSegments.find((segment) => !captionedSegmentIds.has(segment.id));
    if (!isVlogProfile && missingCaptionSegment) {
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
    if (!isVlogProfile) {
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
