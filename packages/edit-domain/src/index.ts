import { randomUUID } from "node:crypto";
import type {
  Asset,
  ActorMaskMode,
  ActorAudioMode,
  ActorPerformance,
  ActorPerformanceSource,
  AssetKind,
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
  SpeechPause,
  StoryDocument,
  SpeechSegment,
  TimelineDocument,
  TimelineItem,
  TimelineTrack,
  TranscriptSentenceCandidate,
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
    voiceReferences: [],
    transcripts: [],
    transcriptSentenceCandidates: [],
    semanticUnits: [],
    script: { semanticUnitIds: [], speechSegmentIds: [], revision: 0 },
    speechSegments: [],
    speechSegmentAssets: [],
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
  timeline.durationInFrames = timeline.items.reduce((maximum, item) => Math.max(maximum, item.endFrame), 0);
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
}

/**
 * Project Snapshot 中的对象虽然存于同一 Revision，但仍然是一个有向图。
 * 每次提交前校验引用，可在 SQLite 写入前阻止 Scene、Cue、字幕等形成悬空状态。
 */
export function assertProjectGraphValid(snapshot: ProjectSnapshot): void {
  const assetIds = new Set(snapshot.assets.map((asset) => asset.id));
  const transcriptIds = new Set(snapshot.transcripts.map((transcript) => transcript.id));
  const candidateIds = new Set((snapshot.transcriptSentenceCandidates ?? []).map((candidate) => candidate.id));
  const semanticIds = new Set(snapshot.semanticUnits.map((unit) => unit.id));
  const speechSegmentIds = new Set(snapshot.speechSegments.map((segment) => segment.id));
  const sceneById = new Map(snapshot.scenes.map((scene) => [scene.id, scene]));
  const beatById = new Map(snapshot.story.beats.map((beat) => [beat.id, beat]));
  const itemIds = new Set(snapshot.timeline.items.map((item) => item.id));

  const requireId = (set: Set<Id>, id: Id, description: string) => {
    if (!set.has(id)) throw new DomainError(`${description} 指向不存在对象：${id}`, "PROJECT_GRAPH_INVALID");
  };

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
  for (const item of snapshot.timeline.items) {
    if (item.sceneId) requireId(new Set(sceneById.keys()), item.sceneId, "Timeline Item");
  }
  for (const performance of snapshot.actorPerformances ?? []) requireId(itemIds, performance.timelineItemId, "ActorPerformance");
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
