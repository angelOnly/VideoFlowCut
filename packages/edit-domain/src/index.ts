import { randomUUID } from "node:crypto";
import type {
  AgentWorkOrder,
  Asset,
  ActorGenerationRange,
  ActorLayout,
  ActorMaskMode,
  ActorAudioMode,
  ActorPerformance,
  ActorPerformanceSource,
  AudioCue,
  AssetKind,
  Cutaway,
  CutawayAudioMode,
  CutawayFit,
  CutawayMode,
  CreativeBrief,
  EffectCue,
  EffectAssetBinding,
  EffectMotion,
  EffectType,
  Id,
  ImpactReport,
  ProjectSnapshot,
  Scene,
  SceneType,
  SemanticUnitKind,
  SemanticUnit,
  SpatialAnchor,
  SpeechPause,
  StoryDocument,
  SpeechSegment,
  TimelineDocument,
  TimelineItem,
  TimelineTrack,
  TranscriptSentenceCandidate,
  VisualTreatment,
  VisualTreatmentIntensity,
  VisualTreatmentMode,
  VoiceReference
} from "@videocut/contracts";
import { DEFAULT_TRACKS } from "@videocut/contracts";

export const DEFAULT_BRIEF: CreativeBrief = {
  platform: "短视频",
  aspectRatio: "9:16",
  targetDurationSeconds: 60,
  audience: "泛内容用户",
  tone: "清晰、可信、自然",
  captionMode: "stable",
  allowHighDensityMotion: false
};

export class DomainError extends Error {
  constructor(message: string, public readonly code = "DOMAIN_ERROR") {
    super(message);
  }
}

export const createId = (prefix: string): Id => `${prefix}_${randomUUID()}`;
export const now = (): string => new Date().toISOString();

export const secondsToFrames = (seconds: number, fps: number): number => Math.max(0, Math.round(seconds * fps));
export const millisecondsToFrames = (milliseconds: number, fps: number): number => Math.max(0, Math.round((milliseconds / 1000) * fps));
export const framesToMilliseconds = (frames: number, fps: number): number => Math.round((frames / fps) * 1000);

export function createTimeline(fps = 24, width = 768, height = 1344): TimelineDocument {
  const tracks: TimelineTrack[] = DEFAULT_TRACKS.map((track, index) => ({
    id: createId("track"),
    ...track,
    order: index,
    locked: false,
    hidden: false,
    muted: false
  }));
  return { fps, width, height, durationInFrames: 0, tracks, items: [], captions: [] };
}

export function createStoryDocument(name: string, createdAt = now()): StoryDocument {
  return { id: createId("story"), title: name, summary: "", beats: [], updatedAt: createdAt };
}

/** 工作单只记录待办意图和对象引用，避免在 Web 与 Codex 之间复制一份时间线。 */
export function createAgentWorkOrder(input: {
  title: string;
  intent: string;
  relatedObjectIds: Id[];
  createdRevision: number;
}): AgentWorkOrder {
  const createdAt = now();
  return {
    id: createId("agent_work_order"),
    title: input.title,
    intent: input.intent,
    relatedObjectIds: [...input.relatedObjectIds],
    status: "open",
    createdRevision: input.createdRevision,
    createdAt,
    updatedAt: createdAt
  };
}

export function createProjectSnapshot(input: {
  projectId: string;
  name: string;
  rootPath: string;
  profile?: ProjectSnapshot["project"]["profile"];
  brief?: Partial<CreativeBrief>;
}): ProjectSnapshot {
  const createdAt = now();
  const brief = { ...DEFAULT_BRIEF, ...input.brief };
  const isPortrait = brief.aspectRatio === "9:16";
  return {
    project: {
      id: input.projectId,
      name: input.name,
      rootPath: input.rootPath,
      profile: input.profile ?? "presenter_motion",
      brief,
      stylePackId: "default-clean",
      createdAt,
      updatedAt: createdAt
    },
    story: createStoryDocument(input.name, createdAt),
    assets: [],
    assetRequests: [],
    searchIntents: [],
    assetCandidates: [],
    evidenceCaptures: [],
    explainerPrograms: [],
    vlogShotAnalyses: [],
    vlogEvents: [],
    vlogShotSelects: [],
    vlogAmbientCues: [],
    vlogMusicBeats: [],
    multicamGroups: [],
    multicamCuts: [],
    agentWorkOrders: [],
    visualTreatments: [],
    cutaways: [],
    audioCues: [],
    voiceReferences: [],
    transcripts: [],
    transcriptSentenceCandidates: [],
    semanticUnits: [],
    script: { semanticUnitIds: [], speechSegmentIds: [], revision: 0 },
    speechSegments: [],
    speechSegmentAssets: [],
    speechAlignment: undefined,
    actorCapabilityProfiles: [],
    actorPerformances: [],
    scenes: [],
    effectCues: [],
    timeline: createTimeline(24, isPortrait ? 768 : 1920, isPortrait ? 1344 : 1080),
    markers: []
  };
}

export function cloneSnapshot(snapshot: ProjectSnapshot): ProjectSnapshot {
  return structuredClone(snapshot);
}

export function trackByName(snapshot: ProjectSnapshot, name: string): TimelineTrack {
  const track = snapshot.timeline.tracks.find((candidate) => candidate.name === name);
  if (!track) throw new DomainError(`未找到轨道：${name}`, "TRACK_NOT_FOUND");
  return track;
}

export function assetById(snapshot: ProjectSnapshot, assetId: Id): Asset {
  const asset = snapshot.assets.find((candidate) => candidate.id === assetId);
  if (!asset) throw new DomainError(`未找到素材：${assetId}`, "ASSET_NOT_FOUND");
  return asset;
}

export function recomputeTimelineDuration(timeline: TimelineDocument): void {
  // disabled Item 只保留供 Revision 审计，已不参与合成；把它算入时长会让重编后的成片留下黑尾。
  timeline.durationInFrames = timeline.items
    .filter((item) => !item.disabled)
    .reduce((maximum, item) => Math.max(maximum, item.endFrame), 0);
}

/** 同轨不能重叠；不同轨通过层级表达叠加，不偷偷改写轨道。 */
export function assertTimelineValid(snapshot: ProjectSnapshot): void {
  const { timeline } = snapshot;
  for (const item of timeline.items) {
    if (!Number.isInteger(item.startFrame) || !Number.isInteger(item.endFrame) || item.startFrame < 0 || item.endFrame <= item.startFrame) {
      throw new DomainError(`时间线片段 ${item.id} 的帧范围无效`, "INVALID_ITEM_RANGE");
    }
    if (item.sourceEndFrame <= item.sourceStartFrame || item.sourceStartFrame < 0) {
      throw new DomainError(`时间线片段 ${item.id} 的源范围无效`, "INVALID_SOURCE_RANGE");
    }
    if (!timeline.tracks.some((track) => track.id === item.trackId)) {
      throw new DomainError(`时间线片段 ${item.id} 指向不存在的轨道`, "TRACK_NOT_FOUND");
    }
    assetById(snapshot, item.assetId);
  }
  for (const track of timeline.tracks) {
    const items = timeline.items
      .filter((item) => item.trackId === track.id && !item.disabled)
      .sort((left, right) => left.startFrame - right.startFrame);
    for (let index = 1; index < items.length; index += 1) {
      if (items[index - 1]!.endFrame > items[index]!.startFrame) {
        throw new DomainError(`轨道 ${track.name} 存在重叠片段`, "TRACK_OVERLAP");
      }
    }
  }
  recomputeTimelineDuration(timeline);
  // ExplainerScene 可由 Remotion Program 直接生成而没有物理视频 Item；但 stale / draft Scene 不能继续撑大可交付成片的时长。
  timeline.durationInFrames = Math.max(
    timeline.durationInFrames,
    ...snapshot.scenes.filter((scene) => scene.status === "ready").map((scene) => scene.endFrame)
  );
}

/**
 * Project Snapshot 中的对象虽然存于同一 Revision，但仍然是一个有向图。
 * 每次提交前校验引用，可在 SQLite 写入前阻止 Scene、Cue、字幕等形成悬空状态。
 */
export function assertProjectGraphValid(snapshot: ProjectSnapshot): void {
  const assetIds = new Set(snapshot.assets.map((asset) => asset.id));
  const assetRequestIds = new Set((snapshot.assetRequests ?? []).map((request) => request.id));
  const searchIntentById = new Map((snapshot.searchIntents ?? []).map((intent) => [intent.id, intent]));
  const vlogShotById = new Map((snapshot.vlogShotAnalyses ?? []).map((shot) => [shot.id, shot]));
  const vlogEventById = new Map((snapshot.vlogEvents ?? []).map((event) => [event.id, event]));
  const vlogSelectById = new Map((snapshot.vlogShotSelects ?? []).map((select) => [select.id, select]));
  const multicamGroupById = new Map((snapshot.multicamGroups ?? []).map((group) => [group.id, group]));
  const transcriptIds = new Set(snapshot.transcripts.map((transcript) => transcript.id));
  const candidateIds = new Set((snapshot.transcriptSentenceCandidates ?? []).map((candidate) => candidate.id));
  const semanticIds = new Set(snapshot.semanticUnits.map((unit) => unit.id));
  const speechSegmentIds = new Set(snapshot.speechSegments.map((segment) => segment.id));
  const sceneById = new Map(snapshot.scenes.map((scene) => [scene.id, scene]));
  const beatById = new Map(snapshot.story.beats.map((beat) => [beat.id, beat]));
  const itemIds = new Set(snapshot.timeline.items.map((item) => item.id));
  const visualTreatmentById = new Map((snapshot.visualTreatments ?? []).map((treatment) => [treatment.id, treatment]));
  const agentWorkOrderIds = new Set<Id>();

  const requireId = (set: Set<Id>, id: Id, description: string) => {
    if (!set.has(id)) throw new DomainError(`${description} 指向不存在对象：${id}`, "PROJECT_GRAPH_INVALID");
  };

  for (const workOrder of snapshot.agentWorkOrders ?? []) {
    if (agentWorkOrderIds.has(workOrder.id) || !workOrder.id.trim()) {
      throw new DomainError("Agent 工作单 ID 重复或为空", "PROJECT_GRAPH_INVALID");
    }
    agentWorkOrderIds.add(workOrder.id);
    if (!workOrder.title.trim() || !workOrder.intent.trim()
      || !Number.isInteger(workOrder.createdRevision) || workOrder.createdRevision <= 0
      || new Set(workOrder.relatedObjectIds).size !== workOrder.relatedObjectIds.length
      || !["open", "claimed", "completed", "cancelled"].includes(workOrder.status)) {
      throw new DomainError("Agent 工作单的意图、关联对象或状态无效", "PROJECT_GRAPH_INVALID");
    }
    const claimedRevision = workOrder.claimedRevision;
    if ((workOrder.status === "claimed" || workOrder.status === "completed")
      && (!workOrder.claimedBy?.trim() || !Number.isInteger(claimedRevision) || claimedRevision === undefined || claimedRevision <= workOrder.createdRevision)) {
      throw new DomainError("已接手的 Agent 工作单缺少接手者或接手 Revision", "PROJECT_GRAPH_INVALID");
    }
    const resultRevision = workOrder.resultRevision;
    const completedRevision = workOrder.completedRevision;
    if (workOrder.status === "completed"
      && (!workOrder.completionSummary?.trim() || !Number.isInteger(resultRevision) || resultRevision === undefined
        || !Number.isInteger(completedRevision) || completedRevision === undefined || claimedRevision === undefined
        || resultRevision < claimedRevision || completedRevision <= resultRevision
        || !workOrder.completionKind)) {
      throw new DomainError("已完成 Agent 工作单缺少真实结果 Revision 或完成摘要", "PROJECT_GRAPH_INVALID");
    }
    if (workOrder.status === "completed" && workOrder.completionKind === "edited"
      && (!workOrder.resultChangedObjectIds?.length || !workOrder.resultImpact)) {
      throw new DomainError("已编辑完成的 Agent 工作单缺少实际对象变化或影响证据", "PROJECT_GRAPH_INVALID");
    }
    if (workOrder.status === "completed" && workOrder.completionKind === "reviewed_no_change"
      && ((workOrder.resultChangedObjectIds?.length ?? 0) > 0 || workOrder.resultImpact)) {
      throw new DomainError("无改动审查工作单不能携带编辑结果证据", "PROJECT_GRAPH_INVALID");
    }
    if (workOrder.status === "cancelled"
      && (!Number.isInteger(workOrder.cancelledRevision) || !workOrder.cancellationReason?.trim())) {
      throw new DomainError("已取消 Agent 工作单缺少取消 Revision 或原因", "PROJECT_GRAPH_INVALID");
    }
    if (workOrder.releasedRevision !== undefined
      && (!Number.isInteger(workOrder.releasedRevision) || !workOrder.releaseReason?.trim())) {
      throw new DomainError("已释放 Agent 工作单缺少释放 Revision 或原因", "PROJECT_GRAPH_INVALID");
    }
    for (const issue of workOrder.relatedObjectIssues ?? []) {
      if (!workOrder.relatedObjectIds.includes(issue.objectId) || issue.kind !== "stale" || !issue.message.trim()) {
        throw new DomainError("Agent 工作单关联对象提示无效", "PROJECT_GRAPH_INVALID");
      }
    }
  }

  for (const intent of snapshot.searchIntents ?? []) {
    requireId(assetRequestIds, intent.assetRequestId, "搜索意图");
  }
  for (const candidate of snapshot.assetCandidates ?? []) {
    requireId(assetRequestIds, candidate.assetRequestId, "素材候选");
    const intent = searchIntentById.get(candidate.searchIntentId);
    if (!intent || intent.assetRequestId !== candidate.assetRequestId) {
      throw new DomainError("素材候选没有指向同一需求的搜索意图", "PROJECT_GRAPH_INVALID");
    }
    if (candidate.acquiredAssetId) requireId(assetIds, candidate.acquiredAssetId, "已本地化素材候选");
    if (candidate.status === "acquired" && !candidate.acquiredAssetId) {
      throw new DomainError("已本地化素材候选缺少 Asset 引用", "PROJECT_GRAPH_INVALID");
    }
  }

  const narrativeMapBeatById = new Map((snapshot.narrativeMap?.beats ?? []).map((beat) => [beat.id, beat]));
  if (snapshot.narrativeMap) {
    const narrativeBeatIds = new Set<Id>();
    for (const mapBeat of snapshot.narrativeMap.beats) {
      if (narrativeBeatIds.has(mapBeat.narrativeBeatId)) {
        throw new DomainError("一个 Story Beat 只能在当前 NarrativeMap 中出现一次", "PROJECT_GRAPH_INVALID");
      }
      narrativeBeatIds.add(mapBeat.narrativeBeatId);
      if (!beatById.has(mapBeat.narrativeBeatId)) throw new DomainError("NarrativeMap 指向不存在的 Story Beat", "PROJECT_GRAPH_INVALID");
      for (const evidenceId of mapBeat.evidenceCaptureIds) {
        if (!(snapshot.evidenceCaptures ?? []).some((capture) => capture.id === evidenceId)) {
          throw new DomainError("NarrativeMap 指向不存在的 EvidenceCapture", "PROJECT_GRAPH_INVALID");
        }
      }
      for (const sceneId of mapBeat.sceneIds) requireId(new Set(sceneById.keys()), sceneId, "NarrativeMap Scene");
    }
  }

  const evidenceCaptureById = new Map((snapshot.evidenceCaptures ?? []).map((capture) => [capture.id, capture]));
  for (const capture of snapshot.evidenceCaptures ?? []) {
    requireId(assetIds, capture.sourceAssetId, "EvidenceCapture 原始素材");
    if (capture.snapshotAssetId) requireId(assetIds, capture.snapshotAssetId, "EvidenceCapture 页面快照");
    if (!capture.sourceUrl.trim() || !capture.sourceTitle.trim() || !capture.excerpt.trim() || !capture.claim.trim() || !capture.limitation.trim()) {
      throw new DomainError("EvidenceCapture 必须保存来源、原文摘录、主张和限制", "PROJECT_GRAPH_INVALID");
    }
    for (const highlight of capture.highlights) {
      if (![highlight.x, highlight.y, highlight.width, highlight.height].every(Number.isFinite)
        || highlight.x < 0 || highlight.y < 0 || highlight.width <= 0 || highlight.height <= 0
        || highlight.x + highlight.width > 1 || highlight.y + highlight.height > 1) {
        throw new DomainError("EvidenceCapture 高亮必须位于 0 到 1 的页面归一化范围内", "PROJECT_GRAPH_INVALID");
      }
    }
  }

  const explainerSceneIds = new Set<Id>();
  for (const program of snapshot.explainerPrograms ?? []) {
    const scene = sceneById.get(program.sceneId);
    if (!scene || scene.type !== "ExplainerScene") throw new DomainError("Explainer Program 必须绑定 ExplainerScene", "PROJECT_GRAPH_INVALID");
    if (explainerSceneIds.has(program.sceneId)) throw new DomainError("一个 ExplainerScene 只能绑定一个 Program", "PROJECT_GRAPH_INVALID");
    explainerSceneIds.add(program.sceneId);
    if (program.narrativeMapBeatId && !narrativeMapBeatById.has(program.narrativeMapBeatId)) {
      throw new DomainError("Explainer Program 指向不存在的 NarrativeMap Beat", "PROJECT_GRAPH_INVALID");
    }
    for (const assetId of program.assetIds) requireId(assetIds, assetId, "Explainer Program 素材");
    if (program.evidenceCaptureId && !evidenceCaptureById.has(program.evidenceCaptureId)) {
      throw new DomainError("Explainer Program 指向不存在的 EvidenceCapture", "PROJECT_GRAPH_INVALID");
    }
    if (!program.primaryTask.trim() || !program.cacheKey.trim() || program.states.length === 0) {
      throw new DomainError("Explainer Program 必须包含任务、状态和缓存键", "PROJECT_GRAPH_INVALID");
    }
    const phaseIds = new Set<Id>();
    for (const state of program.states) {
      if (phaseIds.has(state.id) || !state.label.trim() || !Number.isInteger(state.startFrame) || !Number.isInteger(state.endFrame)
        || state.startFrame < 0 || state.endFrame <= state.startFrame || state.endFrame > scene.endFrame - scene.startFrame) {
        throw new DomainError("Explainer Program 的局部状态范围无效", "PROJECT_GRAPH_INVALID");
      }
      phaseIds.add(state.id);
    }
  }

  for (const shot of snapshot.vlogShotAnalyses ?? []) {
    requireId(assetIds, shot.assetId, "Vlog 镜头分析素材");
    if (!Number.isInteger(shot.sourceStartFrame) || !Number.isInteger(shot.sourceEndFrame) || shot.sourceStartFrame < 0 || shot.sourceEndFrame <= shot.sourceStartFrame) {
      throw new DomainError("Vlog 镜头分析的源范围无效", "PROJECT_GRAPH_INVALID");
    }
    if (!Number.isFinite(shot.technicalScore) || shot.technicalScore < 0 || shot.technicalScore > 1) {
      throw new DomainError("Vlog 镜头分析的技术评分必须在 0 到 1 之间", "PROJECT_GRAPH_INVALID");
    }
  }
  for (const event of snapshot.vlogEvents ?? []) {
    if (!event.shotAnalysisIds.length) throw new DomainError("Vlog 事件必须关联至少一个镜头分析", "PROJECT_GRAPH_INVALID");
    for (const shotId of event.shotAnalysisIds) requireId(new Set(vlogShotById.keys()), shotId, "Vlog 事件镜头分析");
  }
  for (const select of snapshot.vlogShotSelects ?? []) {
    requireId(new Set(vlogEventById.keys()), select.eventId, "Vlog Shot Select 事件");
    const shot = vlogShotById.get(select.shotAnalysisId);
    if (!shot) throw new DomainError("Vlog Shot Select 指向不存在的镜头分析", "PROJECT_GRAPH_INVALID");
    const event = vlogEventById.get(select.eventId)!;
    if (!event.shotAnalysisIds.includes(shot.id)) throw new DomainError("Vlog Shot Select 的镜头不属于其事件", "PROJECT_GRAPH_INVALID");
    if (!Number.isInteger(select.sourceStartFrame) || !Number.isInteger(select.sourceEndFrame)
      || select.sourceStartFrame < shot.sourceStartFrame || select.sourceEndFrame > shot.sourceEndFrame || select.sourceEndFrame <= select.sourceStartFrame) {
      throw new DomainError("Vlog Shot Select 的源范围必须位于已分析镜头内", "PROJECT_GRAPH_INVALID");
    }
    if (select.status === "ready") {
      if (!select.sceneId || !select.timelineItemId) throw new DomainError("已就绪 Vlog Shot Select 缺少 Scene 或 Timeline Item", "PROJECT_GRAPH_INVALID");
      const scene = sceneById.get(select.sceneId);
      const item = snapshot.timeline.items.find((candidate) => candidate.id === select.timelineItemId);
      if (!scene || scene.type !== "VlogMontageScene" || !item || item.sceneId !== scene.id || item.assetId !== shot.assetId
        || item.sourceStartFrame !== select.sourceStartFrame || item.sourceEndFrame !== select.sourceEndFrame) {
        throw new DomainError("Vlog Shot Select、VlogMontageScene 与 Timeline Item 绑定不一致", "PROJECT_GRAPH_INVALID");
      }
    }
  }
  for (const ambient of snapshot.vlogAmbientCues ?? []) {
    const select = vlogSelectById.get(ambient.shotSelectId);
    if (!select) throw new DomainError("Vlog 环境声指向不存在的 Shot Select", "PROJECT_GRAPH_INVALID");
    requireId(assetIds, ambient.assetId, "Vlog 环境声素材");
    const item = snapshot.timeline.items.find((candidate) => candidate.id === ambient.timelineItemId);
    const track = item ? snapshot.timeline.tracks.find((candidate) => candidate.id === item.trackId) : undefined;
    if (!item || track?.name !== "Ambient" || item.assetId !== ambient.assetId) {
      throw new DomainError("Vlog 环境声必须绑定对应 Select 的 Ambient Timeline Item", "PROJECT_GRAPH_INVALID");
    }
    if (ambient.status === "ready" && (item.sourceStartFrame !== select.sourceStartFrame || item.sourceEndFrame !== select.sourceEndFrame
      || select.sourceAudioMode !== "keep" || select.ambientTimelineItemId !== item.id || item.disabled)) {
      throw new DomainError("只有明确保留原声的 Vlog Select 才能拥有环境声绑定", "PROJECT_GRAPH_INVALID");
    }
  }
  for (const beat of snapshot.vlogMusicBeats ?? []) {
    const cue = (snapshot.audioCues ?? []).find((candidate) => candidate.id === beat.audioCueId);
    const item = cue ? snapshot.timeline.items.find((candidate) => candidate.id === cue.timelineItemId) : undefined;
    if (!cue || cue.kind !== "bgm") {
      throw new DomainError("Vlog 音乐拍点必须关联 BGM", "PROJECT_GRAPH_INVALID");
    }
    if (beat.status === "ready" && (cue.status !== "ready" || !item || beat.frame < item.startFrame || beat.frame >= item.endFrame)) {
      throw new DomainError("Vlog 音乐拍点必须落在已就绪 BGM 的实际播放范围内", "PROJECT_GRAPH_INVALID");
    }
  }

  /**
   * sourceRange 缺失仅兼容旧项目的“整条素材同步”语义。新自动 Group 会明确保存范围，
   * 以项目 Timeline FPS 验证，绝不混用不同素材的原生物理帧率。
   */
  const multicamSourceRangeFor = (assetId: Id, sourceRange: { startFrame: number; endFrame: number } | undefined) => {
    const asset = assetById(snapshot, assetId);
    const duration = millisecondsToFrames(asset.metadata?.durationMs ?? 0, snapshot.timeline.fps);
    const range = sourceRange ?? { startFrame: 0, endFrame: duration };
    if (!Number.isInteger(range.startFrame) || !Number.isInteger(range.endFrame)
      || range.startFrame < 0 || range.endFrame <= range.startFrame || range.endFrame > duration) {
      throw new DomainError("多机位同步源范围必须位于对应素材的有效范围内", "PROJECT_GRAPH_INVALID");
    }
    return range;
  };
  const multicamCommonSessionRangeFor = (group: typeof snapshot.multicamGroups[number]) => {
    let startFrame = Number.NEGATIVE_INFINITY;
    let endFrame = Number.POSITIVE_INFINITY;
    for (const sync of group.angleSyncs) {
      const range = multicamSourceRangeFor(sync.assetId, sync.sourceRange);
      startFrame = Math.max(startFrame, range.startFrame + sync.sessionOffsetFrames);
      endFrame = Math.min(endFrame, range.endFrame + sync.sessionOffsetFrames);
    }
    if (!Number.isInteger(startFrame) || !Number.isInteger(endFrame) || startFrame < 0 || endFrame <= startFrame) {
      throw new DomainError("多机位各机位没有共同的已同步会话范围", "PROJECT_GRAPH_INVALID");
    }
    return { startFrame, endFrame };
  };

  for (const group of snapshot.multicamGroups ?? []) {
    const uniqueAngles = [...new Set(group.angleAssetIds)];
    if (uniqueAngles.length < 2 || uniqueAngles.length !== group.angleAssetIds.length) {
      throw new DomainError("多机位 Group 必须包含至少两个且不重复的机位素材", "PROJECT_GRAPH_INVALID");
    }
    for (const assetId of uniqueAngles) requireId(assetIds, assetId, "多机位机位素材");
    if (!uniqueAngles.includes(group.referenceAssetId) || !uniqueAngles.includes(group.masterAudioAssetId)) {
      throw new DomainError("多机位参考机位和主声音必须属于同一个 Group", "PROJECT_GRAPH_INVALID");
    }
    const syncByAsset = new Map(group.angleSyncs.map((sync) => [sync.assetId, sync]));
    if (syncByAsset.size !== uniqueAngles.length || group.angleSyncs.length !== uniqueAngles.length) {
      throw new DomainError("多机位 Group 必须为每个机位保存唯一的同步证据", "PROJECT_GRAPH_INVALID");
    }
    for (const assetId of uniqueAngles) {
      const sync = syncByAsset.get(assetId);
      if (!sync || !sync.label.trim() || !Number.isInteger(sync.sessionOffsetFrames) || !Number.isFinite(sync.confidence)
        || sync.confidence < 0 || sync.confidence > 1 || !sync.evidence
        || !["candidate", "verified", "rejected", "insufficient"].includes(sync.status)
        || (sync.peakMargin !== undefined && (!Number.isFinite(sync.peakMargin) || sync.peakMargin < 0 || sync.peakMargin > 1))
        || (sync.driftFrames !== undefined && (!Number.isInteger(sync.driftFrames) || sync.driftFrames < 0))
        || !Number.isInteger(sync.evidence.referenceSourceFrame) || sync.evidence.referenceSourceFrame < 0
        || !Number.isInteger(sync.evidence.angleSourceFrame) || sync.evidence.angleSourceFrame < 0
        || !Number.isInteger(sync.evidence.windowFrames) || sync.evidence.windowFrames <= 0
        || !sync.evidence.analysisVersion.trim() || !sync.evidence.referenceSourceHash.trim()
        || !sync.evidence.angleSourceHash.trim() || !sync.evidence.note.trim()) {
        throw new DomainError("多机位同步偏移、置信度或证据无效", "PROJECT_GRAPH_INVALID");
      }
      const asset = assetById(snapshot, assetId);
      const referenceAsset = assetById(snapshot, group.referenceAssetId);
      const sourceRange = multicamSourceRangeFor(assetId, sync.sourceRange);
      const referenceSyncForEvidence = syncByAsset.get(group.referenceAssetId);
      const referenceRange = referenceSyncForEvidence
        ? multicamSourceRangeFor(group.referenceAssetId, referenceSyncForEvidence.sourceRange)
        : undefined;
      if (sync.evidence.angleSourceHash !== asset.sourceHash || sync.evidence.referenceSourceHash !== referenceAsset.sourceHash) {
        throw new DomainError("多机位同步证据不再对应当前受管素材二进制", "PROJECT_GRAPH_INVALID");
      }
      if (!referenceRange || sync.evidence.angleSourceFrame < sourceRange.startFrame
        || sync.evidence.angleSourceFrame + sync.evidence.windowFrames > sourceRange.endFrame
        || sync.evidence.referenceSourceFrame < referenceRange.startFrame
        || sync.evidence.referenceSourceFrame + sync.evidence.windowFrames > referenceRange.endFrame) {
        throw new DomainError("多机位同步证据锚点超出了其已确认源范围", "PROJECT_GRAPH_INVALID");
      }
      if (sync.status === "verified" && !sync.evidence.verifiedAt) {
        throw new DomainError("已确认多机位同步证据必须记录确认时间", "PROJECT_GRAPH_INVALID");
      }
    }
    const referenceSync = syncByAsset.get(group.referenceAssetId);
    if (!referenceSync || referenceSync.sessionOffsetFrames !== 0) {
      throw new DomainError("多机位参考机位的会话偏移必须为 0", "PROJECT_GRAPH_INVALID");
    }
    const commonSessionRange = multicamCommonSessionRangeFor(group);
    if (group.status === "ready" && group.angleSyncs.some((sync) => sync.status !== "verified")) {
      throw new DomainError("多机位 Group 只有全部同步证据已人工确认后才能就绪", "PROJECT_GRAPH_INVALID");
    }
    const hasProgramFields = Boolean(group.sceneId || group.masterAudioTimelineItemId || group.programStartFrame !== undefined || group.programEndFrame !== undefined);
    if (hasProgramFields) {
      const programStartFrame = group.programStartFrame;
      const programEndFrame = group.programEndFrame;
      if (!group.sceneId || !group.masterAudioTimelineItemId || !Number.isInteger(programStartFrame) || programStartFrame === undefined
        || !Number.isInteger(programEndFrame) || programEndFrame === undefined || programStartFrame < 0 || programEndFrame <= programStartFrame) {
        throw new DomainError("多机位 Group 的编译产物字段必须完整且范围有效", "PROJECT_GRAPH_INVALID");
      }
      const resolvedProgramStartFrame: number = programStartFrame;
      const resolvedProgramEndFrame: number = programEndFrame;
      const scene = sceneById.get(group.sceneId);
      const masterItem = snapshot.timeline.items.find((item) => item.id === group.masterAudioTimelineItemId);
      const masterTrack = masterItem ? snapshot.timeline.tracks.find((track) => track.id === masterItem.trackId) : undefined;
      const masterSync = syncByAsset.get(group.masterAudioAssetId);
      const masterSourceRange = masterSync ? multicamSourceRangeFor(group.masterAudioAssetId, masterSync.sourceRange) : undefined;
      const readyCuts = (snapshot.multicamCuts ?? []).filter((cut) => cut.groupId === group.id && cut.status === "ready");
      const sessionStart = readyCuts.length ? Math.min(...readyCuts.map((cut) => cut.sessionStartFrame)) : undefined;
      const sessionEnd = readyCuts.length ? Math.max(...readyCuts.map((cut) => cut.sessionEndFrame)) : undefined;
      if (!scene || scene.type !== "VlogMontageScene" || scene.status !== "ready" || !masterItem || masterItem.disabled
        || masterTrack?.name !== "Ambient" || masterItem.sceneId !== scene.id || masterItem.assetId !== group.masterAudioAssetId
        || masterItem.startFrame !== resolvedProgramStartFrame || masterItem.endFrame !== resolvedProgramEndFrame
        || !masterSync || sessionStart === undefined || sessionEnd === undefined || masterItem.sourceStartFrame < 0
        || masterItem.sourceStartFrame + masterSync.sessionOffsetFrames !== sessionStart
        || masterItem.sourceEndFrame + masterSync.sessionOffsetFrames !== sessionEnd
        || !masterSourceRange || masterItem.sourceStartFrame < masterSourceRange.startFrame || masterItem.sourceEndFrame > masterSourceRange.endFrame
        || sessionStart < commonSessionRange.startFrame || sessionEnd > commonSessionRange.endFrame) {
        throw new DomainError("多机位 Group 的 Scene 或唯一主声音绑定不一致", "PROJECT_GRAPH_INVALID");
      }
    }
  }
  for (const cut of snapshot.multicamCuts ?? []) {
    const group = multicamGroupById.get(cut.groupId);
    if (!group || !group.angleAssetIds.includes(cut.angleAssetId)) {
      throw new DomainError("多机位切换引用了不存在的 Group 或机位", "PROJECT_GRAPH_INVALID");
    }
    const sync = group.angleSyncs.find((candidate) => candidate.assetId === cut.angleAssetId);
    if (!sync || !Number.isInteger(cut.order) || cut.order < 0
      || !Number.isInteger(cut.sessionStartFrame) || !Number.isInteger(cut.sessionEndFrame)
      || cut.sessionStartFrame < 0 || cut.sessionEndFrame <= cut.sessionStartFrame
      || cut.sourceStartFrame !== cut.sessionStartFrame - sync.sessionOffsetFrames
      || cut.sourceEndFrame !== cut.sessionEndFrame - sync.sessionOffsetFrames
      || cut.sourceStartFrame < 0 || cut.sourceEndFrame <= cut.sourceStartFrame) {
      throw new DomainError("多机位切换的会话范围或源范围与同步偏移不一致", "PROJECT_GRAPH_INVALID");
    }
    const sourceRange = multicamSourceRangeFor(cut.angleAssetId, sync.sourceRange);
    const commonSessionRange = multicamCommonSessionRangeFor(group);
    if (cut.sourceStartFrame < sourceRange.startFrame || cut.sourceEndFrame > sourceRange.endFrame
      || cut.sessionStartFrame < commonSessionRange.startFrame || cut.sessionEndFrame > commonSessionRange.endFrame) {
      throw new DomainError("多机位切换超出了已确认同步的源范围或共同会话范围", "PROJECT_GRAPH_INVALID");
    }
    if (cut.status === "ready") {
      if (group.status !== "ready" || !cut.sceneId || !cut.timelineItemId || group.sceneId !== cut.sceneId) {
        throw new DomainError("已就绪多机位切换缺少当前 Group 的 Scene 或同步已过期", "PROJECT_GRAPH_INVALID");
      }
      const scene = sceneById.get(cut.sceneId);
      const item = snapshot.timeline.items.find((candidate) => candidate.id === cut.timelineItemId);
      if (!scene || scene.type !== "VlogMontageScene" || scene.status !== "ready" || !item || item.disabled
        || item.sceneId !== scene.id || item.assetId !== cut.angleAssetId
        || item.sourceStartFrame !== cut.sourceStartFrame || item.sourceEndFrame !== cut.sourceEndFrame) {
        throw new DomainError("多机位切换、Scene 与 Timeline Item 绑定不一致", "PROJECT_GRAPH_INVALID");
      }
    }
  }

  for (const candidate of snapshot.transcriptSentenceCandidates ?? []) {
    requireId(transcriptIds, candidate.transcriptId, "转写候选");
    requireId(assetIds, candidate.sourceAssetId, "转写候选素材");
  }
  for (const unit of snapshot.semanticUnits) {
    requireId(transcriptIds, unit.transcriptId, "SemanticUnit");
    requireId(assetIds, unit.sourceAssetId, "SemanticUnit 素材");
    for (const candidateId of unit.candidateIds ?? []) requireId(candidateIds, candidateId, "SemanticUnit 候选");
    for (const dependencyId of unit.dependencies ?? []) requireId(semanticIds, dependencyId, "SemanticUnit 依赖");
  }
  for (const segment of snapshot.speechSegments) {
    for (const semanticUnitId of segment.semanticUnitIds) requireId(semanticIds, semanticUnitId, "SpeechSegment");
  }
  for (const beat of snapshot.story.beats) {
    for (const semanticUnitId of beat.semanticUnitIds) requireId(semanticIds, semanticUnitId, "Story Beat");
    for (const sceneId of beat.sceneIds) {
      const scene = sceneById.get(sceneId);
      if (!scene) throw new DomainError(`Story Beat 指向不存在场景：${sceneId}`, "PROJECT_GRAPH_INVALID");
      if (!scene.narrativeBeatIds.includes(beat.id)) throw new DomainError("Story Beat 与 Scene 缺少双向关联", "PROJECT_GRAPH_INVALID");
    }
  }
  for (const scene of snapshot.scenes) {
    for (const assetId of scene.assetIds) requireId(assetIds, assetId, "Scene 素材");
    for (const beatId of scene.narrativeBeatIds) {
      const beat = beatById.get(beatId);
      if (!beat) throw new DomainError(`Scene 指向不存在 Story Beat：${beatId}`, "PROJECT_GRAPH_INVALID");
      if (!beat.sceneIds.includes(scene.id)) throw new DomainError("Scene 与 Story Beat 缺少双向关联", "PROJECT_GRAPH_INVALID");
    }
  }
  for (const treatment of snapshot.visualTreatments ?? []) {
    if (!treatment.narrativeBeatId && !treatment.sceneId) {
      throw new DomainError("VisualTreatment 必须关联 Story Beat 或 Scene", "PROJECT_GRAPH_INVALID");
    }
    if (treatment.narrativeBeatId && !beatById.has(treatment.narrativeBeatId)) {
      throw new DomainError("VisualTreatment 指向不存在 Story Beat", "PROJECT_GRAPH_INVALID");
    }
    if (treatment.sceneId && !sceneById.has(treatment.sceneId)) {
      throw new DomainError("VisualTreatment 指向不存在 Scene", "PROJECT_GRAPH_INVALID");
    }
  }
  for (const item of snapshot.timeline.items) {
    if (item.sceneId) requireId(new Set(sceneById.keys()), item.sceneId, "Timeline Item");
  }
  for (const cutaway of snapshot.cutaways ?? []) {
    requireId(assetIds, cutaway.assetId, "Cutaway 素材");
    requireId(new Set(sceneById.keys()), cutaway.hostSceneId, "Cutaway 主场景");
    requireId(new Set(sceneById.keys()), cutaway.cutawaySceneId, "Cutaway 场景");
    requireId(itemIds, cutaway.timelineItemId, "Cutaway Timeline Item");
    if (cutaway.visualTreatmentId && !visualTreatmentById.has(cutaway.visualTreatmentId)) {
      throw new DomainError("Cutaway 指向不存在 VisualTreatment", "PROJECT_GRAPH_INVALID");
    }
    const hostScene = sceneById.get(cutaway.hostSceneId)!;
    const cutawayScene = sceneById.get(cutaway.cutawaySceneId)!;
    const item = snapshot.timeline.items.find((candidate) => candidate.id === cutaway.timelineItemId)!;
    if (hostScene.type === "CutawayScene") {
      throw new DomainError("Cutaway 不能嵌套在 CutawayScene 中", "PROJECT_GRAPH_INVALID");
    }
    if (cutawayScene.type !== "CutawayScene") {
      throw new DomainError("Cutaway 必须关联 CutawayScene", "PROJECT_GRAPH_INVALID");
    }
    if (!cutawayScene.assetIds.includes(cutaway.assetId) || item.assetId !== cutaway.assetId || item.sceneId !== cutaway.cutawaySceneId) {
      throw new DomainError("Cutaway、Scene 与 Timeline Item 的素材绑定不一致", "PROJECT_GRAPH_INVALID");
    }
    if (item.startFrame !== cutaway.startFrame || item.endFrame !== cutaway.endFrame
      || item.sourceStartFrame !== cutaway.sourceStartFrame || item.sourceEndFrame !== cutaway.sourceEndFrame
      || cutawayScene.startFrame !== cutaway.startFrame || cutawayScene.endFrame !== cutaway.endFrame) {
      throw new DomainError("Cutaway 的播放范围没有同步到 Scene 或 Timeline", "PROJECT_GRAPH_INVALID");
    }
    const itemTrack = snapshot.timeline.tracks.find((track) => track.id === item.trackId);
    if (itemTrack?.name !== "Cutaway / Fullscreen") {
      throw new DomainError("Cutaway 必须位于 Cutaway / Fullscreen 顶层轨道", "PROJECT_GRAPH_INVALID");
    }
    if (cutaway.mode === "pip" && (!cutaway.pipAnchor || cutaway.pipAnchor === "full_frame")) {
      throw new DomainError("PiP Cutaway 必须使用有效的安全区锚点", "PROJECT_GRAPH_INVALID");
    }
    if (cutaway.pipScale !== undefined && (cutaway.pipScale < 0.2 || cutaway.pipScale > 0.6)) {
      throw new DomainError("PiP 缩放必须在 0.2 到 0.6 之间", "PROJECT_GRAPH_INVALID");
    }
    // stale Cutaway 会临时保留旧决定供导演复核，但不再要求它仍覆盖新的主场景边界。
    if (cutaway.status === "ready" && (item.disabled || cutaway.startFrame < hostScene.startFrame || cutaway.endFrame > hostScene.endFrame)) {
      throw new DomainError("已就绪 Cutaway 必须位于主场景内且可播放", "PROJECT_GRAPH_INVALID");
    }
  }
  for (const cue of snapshot.audioCues ?? []) {
    requireId(assetIds, cue.assetId, "AudioCue 素材");
    requireId(itemIds, cue.timelineItemId, "AudioCue Timeline Item");
    const item = snapshot.timeline.items.find((candidate) => candidate.id === cue.timelineItemId)!;
    const track = snapshot.timeline.tracks.find((candidate) => candidate.id === item.trackId);
    const expectedTrack = cue.kind === "bgm" ? "BGM" : "SFX";
    if (track?.name !== expectedTrack || item.assetId !== cue.assetId) {
      throw new DomainError("AudioCue、Timeline Item 与声音轨的绑定不一致", "PROJECT_GRAPH_INVALID");
    }
    if (cue.kind === "bgm" && cue.anchor !== "sequence_global") {
      throw new DomainError("BGM 必须绑定整条时间线或明确章节", "PROJECT_GRAPH_INVALID");
    }
    if (cue.kind === "sfx") {
      if (cue.anchor !== "media_event" || cue.eventFrame === undefined || cue.onsetOffsetFrames === undefined
        || cue.eventFrame !== item.startFrame + cue.onsetOffsetFrames) {
        throw new DomainError("SFX 必须保存与物理 Item 一致的显式事件与 onsetOffset", "PROJECT_GRAPH_INVALID");
      }
    }
    if (cue.status === "ready" && item.disabled) {
      throw new DomainError("已就绪 AudioCue 必须关联可播放 Timeline Item", "PROJECT_GRAPH_INVALID");
    }
  }
  const actorCapabilityIds = new Set((snapshot.actorCapabilityProfiles ?? []).map((profile) => profile.id));
  for (const performance of snapshot.actorPerformances ?? []) {
    requireId(itemIds, performance.timelineItemId, "ActorPerformance");
    if (performance.capabilityProfileId) requireId(actorCapabilityIds, performance.capabilityProfileId, "ActorPerformance 能力档案");
    if (performance.generationRange) {
      const range = performance.generationRange;
      if (range.startFrame < 0 || range.endFrame <= range.startFrame) {
        throw new DomainError("人物生成范围无效", "PROJECT_GRAPH_INVALID");
      }
      for (const segmentId of range.speechSegmentIds) requireId(speechSegmentIds, segmentId, "人物生成范围 SpeechSegment");
    }
  }
  for (const caption of snapshot.timeline.captions) requireId(speechSegmentIds, caption.speechSegmentId, "Caption");
  for (const segmentAsset of snapshot.speechSegmentAssets) {
    requireId(speechSegmentIds, segmentAsset.speechSegmentId, "SpeechSegmentAsset");
    requireId(assetIds, segmentAsset.assetId, "SpeechSegmentAsset 素材");
  }
  if (snapshot.speechAsset) {
    for (const segmentAssetId of snapshot.speechAsset.segmentAssetIds) {
      if (!snapshot.speechSegmentAssets.some((asset) => asset.id === segmentAssetId)) {
        throw new DomainError(`SpeechAsset 指向不存在段级语音：${segmentAssetId}`, "PROJECT_GRAPH_INVALID");
      }
    }
    for (const timing of snapshot.speechAsset.timing.segments) requireId(speechSegmentIds, timing.speechSegmentId, "SpeechTiming");
  }
  const alignment = snapshot.speechAlignment;
  if (alignment) {
    if (!snapshot.speechAsset || alignment.speechAssetId !== snapshot.speechAsset.id) {
      throw new DomainError("词级对齐必须绑定当前 SpeechAsset", "PROJECT_GRAPH_INVALID");
    }
    if (alignment.scriptRevision !== snapshot.speechAsset.scriptRevision || alignment.scriptRevision !== snapshot.script.revision) {
      throw new DomainError("词级对齐的 Script Revision 已过期", "PROJECT_GRAPH_INVALID");
    }
    if (!alignment.id.trim() || !alignment.generationJobId.trim() || !alignment.source.trim()
      || !alignment.audit.workflowId.trim() || !alignment.audit.runId.trim() || !alignment.audit.schemaVersion.trim()
      || !alignment.audit.completedAt || alignment.words.length === 0) {
      throw new DomainError("词级对齐缺少真实工作流审计或词级结果", "PROJECT_GRAPH_INVALID");
    }
    if (alignment.status === "ready" && snapshot.speechAsset.timing.precision !== "word_exact") {
      throw new DomainError("就绪词级对齐必须把当前 SpeechTiming 标记为 word_exact", "PROJECT_GRAPH_INVALID");
    }
    let previousEndMs = -1;
    for (const word of alignment.words) {
      requireId(speechSegmentIds, word.speechSegmentId, "词级对齐 SpeechSegment");
      if (!word.text.trim() || !word.normalizedText.trim()
        || !Number.isInteger(word.startMs) || !Number.isInteger(word.endMs) || word.startMs < 0 || word.endMs <= word.startMs
        || !Number.isInteger(word.startFrame) || !Number.isInteger(word.endFrame) || word.startFrame < 0 || word.endFrame <= word.startFrame
        || word.startFrame !== millisecondsToFrames(word.startMs, snapshot.timeline.fps)
        || word.endFrame !== millisecondsToFrames(word.endMs, snapshot.timeline.fps)
        || (word.confidence !== undefined && (!Number.isFinite(word.confidence) || word.confidence < 0 || word.confidence > 1))
        || word.startMs < previousEndMs) {
        throw new DomainError("词级对齐的文本、时间范围、帧换算或置信度无效", "PROJECT_GRAPH_INVALID");
      }
      previousEndMs = word.endMs;
    }
  }
  if (snapshot.speechAsset?.timing.precision === "word_exact" && alignment?.status !== "ready") {
    throw new DomainError("没有当前就绪对齐证据时不能声明 word_exact", "PROJECT_GRAPH_INVALID");
  }
  for (const cue of snapshot.effectCues) {
    requireId(new Set(sceneById.keys()), cue.sceneId, "EffectCue");
    const semanticAnchor = cue.semanticAnchor;
    if (semanticAnchor?.targetId) {
      if (semanticAnchor.type === "speech_segment") requireId(speechSegmentIds, semanticAnchor.targetId, "EffectCue SpeechSegment 锚点");
      if (semanticAnchor.type === "narrative_beat") {
        if (!beatById.has(semanticAnchor.targetId)) throw new DomainError(`EffectCue Story Beat 锚点不存在：${semanticAnchor.targetId}`, "PROJECT_GRAPH_INVALID");
      }
      if (semanticAnchor.type === "scene") requireId(new Set(sceneById.keys()), semanticAnchor.targetId, "EffectCue Scene 锚点");
    }
    // 兼容仍只保存 anchorTargetId 的旧 Revision。
    if (!semanticAnchor && cue.anchorTargetId) requireId(speechSegmentIds, cue.anchorTargetId, "EffectCue 旧 SpeechSegment 锚点");
    for (const binding of cue.assetBindings ?? []) requireId(assetIds, binding.assetId, "EffectCue 素材绑定");
  }
}

export function createMediaAsset(input: {
  name: string;
  kind: AssetKind;
  managedPath: string;
  originalPath?: string;
  sourceHash?: string;
  role?: Asset["role"];
  provenance?: Asset["provenance"];
  tags?: string[];
}): Asset {
  return {
    id: createId("asset"),
    name: input.name,
    kind: input.kind,
    status: "queued",
    managedPath: input.managedPath,
    originalPath: input.originalPath,
    sourceHash: input.sourceHash,
    role: input.role,
    provenance: input.provenance ?? { source: "local_import", rightsStatus: "unknown", acquiredAt: now() },
    tags: [...new Set((input.tags ?? []).map((tag) => tag.trim()).filter(Boolean))],
    createdAt: now()
  };
}

/**
 * FunASR 只有全文，分句仅用于语义讨论，绝不把这里的顺序误写成词级时序。
 */
export function createTranscriptSentenceCandidates(transcriptId: Id, assetId: Id, text: string): TranscriptSentenceCandidate[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  const chunks = normalized
    .split(/(?<=[。！？!?；;])\s*|\n+/u)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
  const source = chunks.length > 0 ? chunks : normalized ? [normalized] : [];
  return source.map((candidateText, order) => ({
    id: createId("sentence_candidate"),
    transcriptId,
    sourceAssetId: assetId,
    text: candidateText,
    order
  }));
}

/** 由 semantic-continuity 的判断调用，而不是把标点候选直接伪装成语义结论。 */
export function createSemanticUnit(input: {
  transcriptId: Id;
  sourceAssetId: Id;
  candidateIds: Id[];
  text: string;
  order: number;
  kind: SemanticUnitKind;
  dependencies?: Id[];
  precedingContext?: string;
  followingContext?: string;
  retakeGroupId?: Id;
  confidence?: number;
  pauseBefore?: SpeechPause;
}): SemanticUnit {
  const text = input.text.trim();
  if (!text) throw new DomainError("SemanticUnit 文本不能为空", "INVALID_SEMANTIC_UNIT");
  if (input.candidateIds.length === 0) throw new DomainError("SemanticUnit 必须引用至少一个转写候选", "SEMANTIC_CANDIDATE_REQUIRED");
  return {
    id: createId("semantic"),
    transcriptId: input.transcriptId,
    sourceAssetId: input.sourceAssetId,
    candidateIds: [...input.candidateIds],
    text,
    order: input.order,
    kind: input.kind,
    dependencies: input.dependencies ?? [],
    precedingContext: input.precedingContext?.trim() ?? "",
    followingContext: input.followingContext?.trim() ?? "",
    retakeGroupId: input.retakeGroupId,
    confidence: Math.min(1, Math.max(0, input.confidence ?? 0.8)),
    pauseBefore: input.pauseBefore,
    status: "included"
  };
}

/**
 * 首版以完整语义句为分段边界。若句子过长，再只在显式停顿处分开，避免机械按字数断句。
 */
export function compileSpeechSegments(units: SemanticUnit[]): SpeechSegment[] {
  const included = units.filter((unit) => unit.status === "included").sort((left, right) => left.order - right.order);
  return included.map((unit, order) => ({
    id: createId("speech_segment"),
    semanticUnitIds: [unit.id],
    text: unit.text,
    order,
    // 没有专业节奏判断时保守地不插入人工静音；绝不再用 180/80ms 伪造统一节奏。
    pauseBefore: order === 0 ? { durationMs: 0, reason: "sentence" } : (unit.pauseBefore ?? { durationMs: 0, reason: "sentence" }),
    pauseAfter: undefined,
    prePauseMs: order === 0 ? 0 : (unit.pauseBefore?.durationMs ?? 0),
    postPauseMs: 0,
    status: "pending"
  }));
}

export function createScene(input: {
  type: SceneType;
  title: string;
  purpose: string;
  startFrame: number;
  endFrame: number;
  assetIds?: Id[];
}): Scene {
  if (input.endFrame <= input.startFrame) throw new DomainError("Scene 时长必须大于 0", "INVALID_SCENE_RANGE");
  return {
    id: createId("scene"),
    type: input.type,
    title: input.title,
    purpose: input.purpose,
    startFrame: input.startFrame,
    endFrame: input.endFrame,
    assetIds: input.assetIds ?? [],
    narrativeBeatIds: [],
    status: "draft",
    stylePackId: "default-clean"
  };
}

/** 视觉处理只保存导演层的可追溯选择；真正的物理播放仍写入 Scene、Cutaway 和 Timeline。 */
export function createVisualTreatment(input: {
  narrativeBeatId?: Id;
  sceneId?: Id;
  mode: VisualTreatmentMode;
  primaryAttention: string;
  narrativePurpose: string;
  intensity: VisualTreatmentIntensity;
  quietReason?: string;
  fallbackPlan?: string;
}): VisualTreatment {
  const createdAt = now();
  return {
    id: createId("visual_treatment"),
    narrativeBeatId: input.narrativeBeatId,
    sceneId: input.sceneId,
    mode: input.mode,
    primaryAttention: input.primaryAttention,
    narrativePurpose: input.narrativePurpose,
    intensity: input.intensity,
    quietReason: input.quietReason,
    fallbackPlan: input.fallbackPlan,
    status: "ready",
    createdAt,
    updatedAt: createdAt
  };
}

/** Cutaway 的导演决定和顶层播放范围使用同一个创建时刻，避免两套独立状态失配。 */
export function createCutaway(input: {
  hostSceneId: Id;
  cutawaySceneId: Id;
  timelineItemId: Id;
  assetId: Id;
  visualTreatmentId?: Id;
  mode: CutawayMode;
  fit: CutawayFit;
  pipAnchor?: SpatialAnchor;
  pipScale?: number;
  audioMode: CutawayAudioMode;
  purpose: string;
  audienceTask: string;
  sourceStartFrame: number;
  sourceEndFrame: number;
  startFrame: number;
  endFrame: number;
}): Cutaway {
  const createdAt = now();
  return {
    id: createId("cutaway"),
    ...input,
    status: "ready",
    createdAt,
    updatedAt: createdAt
  };
}

/** AudioCue 只创建声音决策与 Item 的稳定关联，不在 Domain 层猜测音乐或音效时机。 */
export function createAudioCue(input: Omit<AudioCue, "id" | "status" | "createdAt" | "updatedAt">): AudioCue {
  const createdAt = now();
  return { id: createId("audio_cue"), ...input, status: "ready", createdAt, updatedAt: createdAt };
}

export function createEffectCue(input: {
  sceneId: Id;
  type: EffectType;
  layer: EffectCue["layer"];
  startFrame: number;
  endFrame: number;
  anchorTargetId?: Id;
  note?: string;
  narrativePurpose?: string;
  audienceTask?: string;
  semanticAnchor?: EffectCue["semanticAnchor"];
  spatialAnchor?: EffectCue["spatialAnchor"];
  assetBindings?: EffectAssetBinding[];
  props?: Record<string, unknown>;
  motion?: Partial<EffectMotion>;
  stylePackId?: string;
  qualityRules?: string[];
}): EffectCue {
  if (input.endFrame <= input.startFrame) throw new DomainError("效果范围无效", "INVALID_CUE_RANGE");
  const enterFrames = Math.max(1, input.motion?.enterFrames ?? 10);
  const exitFrames = Math.max(1, input.motion?.exitFrames ?? 10);
  const defaultSpatialAnchor = input.layer === "fullscreen" ? "full_frame" : input.layer === "rear" ? "middle_left" : "bottom_right";
  return {
    id: createId("cue"),
    sceneId: input.sceneId,
    type: input.type,
    layer: input.layer,
    anchor: input.anchorTargetId ? "segment_start" : "scene",
    anchorTargetId: input.anchorTargetId,
    startFrame: input.startFrame,
    holdFrame: Math.max(input.startFrame + 1, Math.floor((input.startFrame + input.endFrame) / 2)),
    endFrame: input.endFrame,
    intensity: 0.6,
    status: "ready",
    note: input.note ?? "",
    narrativePurpose: input.narrativePurpose?.trim() || input.note?.trim() || "支持当前叙事重点",
    audienceTask: input.audienceTask?.trim() || "理解当前表达",
    semanticAnchor: input.semanticAnchor ?? {
      type: input.anchorTargetId ? "speech_segment" : "scene",
      targetId: input.anchorTargetId ?? input.sceneId,
      relation: "land_on"
    },
    spatialAnchor: input.spatialAnchor ?? defaultSpatialAnchor,
    assetBindings: input.assetBindings ?? [],
    props: input.props ?? {},
    motion: {
      enterPreset: input.motion?.enterPreset ?? "fade_slide",
      settlePreset: input.motion?.settlePreset ?? "hold",
      exitPreset: input.motion?.exitPreset ?? "fade",
      enterFrames,
      holdFrames: Math.max(0, input.motion?.holdFrames ?? Math.max(0, input.endFrame - input.startFrame - enterFrames - exitFrames)),
      exitFrames
    },
    stylePackId: input.stylePackId ?? "default-clean",
    qualityRules: input.qualityRules ?? []
  };
}

export function createActorPerformance(input: {
  timelineItemId: Id;
  source: ActorPerformanceSource;
  maskMode: ActorMaskMode;
  maskAssetId?: Id;
  speechAssetId?: Id;
  scriptRevision?: number;
  audioMode?: ActorAudioMode;
  capabilityProfileId?: Id;
  generationJobId?: Id;
  generationRange?: ActorGenerationRange;
  layout?: ActorLayout;
  bridgeAudit?: ActorPerformance["bridgeAudit"];
  note?: string;
}): ActorPerformance {
  return {
    id: createId("actor_performance"),
    timelineItemId: input.timelineItemId,
    source: input.source,
    maskMode: input.maskMode,
    maskAssetId: input.maskAssetId,
    speechAssetId: input.speechAssetId,
    scriptRevision: input.scriptRevision,
    audioMode: input.audioMode ?? "use_source_audio",
    capabilityProfileId: input.capabilityProfileId,
    generationJobId: input.generationJobId,
    generationRange: input.generationRange,
    layout: input.layout,
    bridgeAudit: input.bridgeAudit,
    status: "ready",
    note: input.note ?? "",
    createdAt: now()
  };
}

export function createVoiceReference(input: {
  assetId: Id;
  label: string;
  authorizationNote: string;
  usageNote: string;
  recommendedRange: { startMs: number; endMs: number };
  quality: VoiceReference["quality"];
  usable: boolean;
}): VoiceReference {
  return {
    id: createId("voice_reference"),
    assetId: input.assetId,
    label: input.label,
    source: "local_asset",
    authorizationNote: input.authorizationNote,
    usageNote: input.usageNote,
    recommendedRange: input.recommendedRange,
    quality: input.quality,
    usable: input.usable,
    createdAt: now()
  };
}

export function createTimelineItem(input: Omit<TimelineItem, "id" | "disabled">): TimelineItem {
  return { id: createId("item"), ...input, disabled: false };
}

export function emptyImpact(): ImpactReport {
  return { changed: [], moved: [], recomputed: [], stale: [], conflicts: [], dirtyRanges: [], warnings: [] };
}

export function sceneForFrame(snapshot: ProjectSnapshot, frame: number): Scene | undefined {
  return snapshot.scenes.find((scene) => scene.startFrame <= frame && frame < scene.endFrame);
}
