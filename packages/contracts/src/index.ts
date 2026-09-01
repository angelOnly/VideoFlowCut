/**
 * Web、MCP、Worker 共用的契约。这里仅描述数据，不放业务规则，避免形成第二套状态。
 */
export type Id = string;

export type ProductionProfile =
  | "presenter_motion"
  | "visual_explainer"
  | "vlog"
  | "hybrid";

export type AssetKind =
  | "video"
  | "audio"
  | "image"
  | "document"
  | "actor_video"
  | "speech"
  | "derived";

export type AssetStatus = "queued" | "analyzing" | "ready" | "failed" | "missing";
export type JobStatus = "queued" | "running" | "succeeded" | "failed" | "unknown" | "cancelled";
export type JobKind =
  | "media_analysis"
  | "transcription"
  | "voice_synthesis"
  | "speech_assembly"
  | "preview"
  | "export";

export type TrackKind = "video" | "audio" | "caption";
export type SceneType =
  | "PresenterScene"
  | "ExplainerScene"
  | "VlogMontageScene"
  | "CutawayScene"
  | "EndCardScene";

export type EffectType =
  | "MetricBackdrop"
  | "ProductFan"
  | "GlowCTA"
  | "PortfolioWall"
  | "CommentCloud"
  | "EvidenceCard"
  | "CameraPunch"
  | "FullScreenMeme"
  | "DeviceShowcase"
  | "ContentCarousel"
  | "EndCard";

export type TimingPrecision = "segment_exact" | "chunk_coarse" | "word_exact" | "unavailable";

export interface CreativeBrief {
  platform: string;
  aspectRatio: "9:16" | "16:9" | "1:1";
  targetDurationSeconds: number;
  audience: string;
  tone: string;
  captionMode: "stable" | "none";
  allowHighDensityMotion: boolean;
}

export interface MediaMetadata {
  durationMs: number;
  width?: number;
  height?: number;
  fps?: number;
  hasAudio: boolean;
  audioCodec?: string;
  sampleRate?: number;
  channels?: number;
  videoCodec?: string;
  thumbnailPath?: string;
  waveformPath?: string;
  mime?: string;
}

export interface Asset {
  id: Id;
  name: string;
  kind: AssetKind;
  status: AssetStatus;
  managedPath: string;
  originalPath?: string;
  sourceHash?: string;
  tags: string[];
  metadata?: MediaMetadata;
  createdAt: string;
  failureReason?: string;
}

/**
 * Bridge 请求只保存公开字段和值摘要，不保存媒体二进制；这样 Bridge 重启后仍能诊断一次任务。
 */
export interface BridgeRequestSummary {
  fieldValues: Record<string, unknown>;
  fileSlots: Array<{ id: string; kind: string; fileName: string }>;
}

/** Bridge Run 的可持久化响应子集，避免项目长期依赖 Bridge 进程内的临时状态。 */
export interface BridgeResponseSummary {
  status: "queued" | "running" | "succeeded" | "failed";
  error?: string | null;
  outputs: Array<{
    outputSlotId: string;
    displayName: string;
    kind: string;
    fileName?: string;
    mime?: string;
    outputId?: string;
    downloadUrl?: string;
    text?: string;
  }>;
}

/**
 * 每次外部工作流均留下可读的运行审计。Run 丢失时至少能看到本地 Job、请求摘要和最后的 run_id。
 */
export interface BridgeRunAudit {
  workflowId: string;
  runId: string;
  schemaVersion: string;
  schemaRetryCount: number;
  submittedAt: string;
  completedAt?: string;
  request: BridgeRequestSummary;
  response?: BridgeResponseSummary;
}

export interface TranscriptText {
  id: Id;
  assetId: Id;
  text: string;
  source: "funasr" | "manual";
  bridgeRunId?: string;
  schemaVersion?: string;
  bridgeAudit?: BridgeRunAudit;
  createdAt: string;
}

export interface SemanticUnit {
  id: Id;
  transcriptId: Id;
  text: string;
  order: number;
  sourceAssetId: Id;
  status: "included" | "deleted";
}

export interface SpeechSegment {
  id: Id;
  semanticUnitIds: Id[];
  text: string;
  order: number;
  prePauseMs: number;
  postPauseMs: number;
  status: "pending" | "ready" | "stale" | "failed";
}

export interface SpeechSegmentTiming {
  speechSegmentId: Id;
  startMs: number;
  endMs: number;
  startFrame: number;
  endFrame: number;
}

export interface SpeechTiming {
  precision: TimingPrecision;
  source: string;
  segments: SpeechSegmentTiming[];
}

export interface SpeechSegmentAsset {
  id: Id;
  speechSegmentId: Id;
  voiceReferenceAssetId: Id;
  voiceReferenceId?: Id;
  assetId: Id;
  durationMs: number;
  bridgeRunId: string;
  schemaVersion: string;
  bridgeAudit?: BridgeRunAudit;
  quality: "passed" | "warning" | "failed";
}

export interface SpeechAsset {
  id: Id;
  assetId: Id;
  scriptRevision: number;
  segmentAssetIds: Id[];
  timing: SpeechTiming;
  status: "ready" | "failed";
}

/** VoiceReference 只记录本地参考音频 Asset，不保存或伪造远端 Voice ID。 */
export interface VoiceReference {
  id: Id;
  assetId: Id;
  label: string;
  /** 仅表示项目内的本地来源；绝不对应外部供应商的 Voice ID。 */
  source: "local_asset";
  /** 未取得明示信息时保留风险提示，而不虚构授权事实。 */
  authorizationNote: string;
  usageNote: string;
  recommendedRange: { startMs: number; endMs: number };
  quality: "passed" | "warning" | "failed";
  usable: boolean;
  createdAt: string;
}

/** Story 保存叙事意图；Timeline 仍保存最终播放结构，二者同属同一 Revision。 */
export interface StoryBeat {
  id: Id;
  order: number;
  title: string;
  purpose: string;
  semanticUnitIds: Id[];
  sceneIds: Id[];
}

export interface StoryDocument {
  id: Id;
  title: string;
  summary: string;
  beats: StoryBeat[];
  updatedAt: string;
}

/**
 * 第一阶段只管理已导入或已生成的人物成片；外部数字人 Provider 的能力协商留到阶段 2。
 * 人物表演绑定既有 Timeline Item，避免另建一条脱离时间线的播放真相。
 */
export type ActorPerformanceSource = "imported" | "generated";
export type ActorMaskMode = "alpha_asset" | "embedded_alpha" | "none";

export interface ActorPerformance {
  id: Id;
  timelineItemId: Id;
  source: ActorPerformanceSource;
  maskMode: ActorMaskMode;
  maskAssetId?: Id;
  speechAssetId?: Id;
  scriptRevision?: number;
  status: "ready" | "stale" | "failed";
  note: string;
  createdAt: string;
}

export interface ScriptDocument {
  semanticUnitIds: Id[];
  speechSegmentIds: Id[];
  revision: number;
}

export interface Scene {
  id: Id;
  type: SceneType;
  title: string;
  purpose: string;
  startFrame: number;
  endFrame: number;
  assetIds: Id[];
  narrativeBeatIds: Id[];
  status: "draft" | "ready" | "stale";
  stylePackId: string;
}

export interface EffectCue {
  id: Id;
  sceneId: Id;
  type: EffectType;
  layer: "rear" | "actor" | "front" | "fullscreen";
  anchor: "segment_start" | "segment_end" | "scene" | "timeline_absolute";
  anchorTargetId?: Id;
  startFrame: number;
  holdFrame: number;
  endFrame: number;
  intensity: number;
  status: "ready" | "stale";
  note: string;
}

export interface TimelineTrack {
  id: Id;
  name: string;
  kind: TrackKind;
  order: number;
  locked: boolean;
  hidden: boolean;
  muted: boolean;
}

export interface TimelineItem {
  id: Id;
  trackId: Id;
  sceneId?: Id;
  assetId: Id;
  startFrame: number;
  endFrame: number;
  sourceStartFrame: number;
  sourceEndFrame: number;
  disabled: boolean;
  directOverride?: boolean;
  gainDb?: number;
}

export interface CaptionCard {
  id: Id;
  speechSegmentId: Id;
  text: string;
  startFrame: number;
  endFrame: number;
  style: "stable";
  precision: TimingPrecision;
}

export interface TimelineDocument {
  fps: number;
  width: number;
  height: number;
  durationInFrames: number;
  tracks: TimelineTrack[];
  items: TimelineItem[];
  captions: CaptionCard[];
}

export interface Marker {
  id: Id;
  frame: number;
  label: string;
  level: "info" | "warning" | "blocking";
}

export interface QualityIssue {
  id: Id;
  level: "blocking" | "warning";
  code: string;
  message: string;
  objectId?: Id;
  frameRange?: { startFrame: number; endFrame: number };
}

export interface QualityReport {
  revision: number;
  generatedAt: string;
  issues: QualityIssue[];
}

export interface ProjectSnapshot {
  project: {
    id: Id;
    name: string;
    rootPath: string;
    profile: ProductionProfile;
    brief: CreativeBrief;
    stylePackId: string;
    createdAt: string;
    updatedAt: string;
  };
  story: StoryDocument;
  assets: Asset[];
  voiceReferences: VoiceReference[];
  transcripts: TranscriptText[];
  semanticUnits: SemanticUnit[];
  script: ScriptDocument;
  speechSegments: SpeechSegment[];
  speechSegmentAssets: SpeechSegmentAsset[];
  speechAsset?: SpeechAsset;
  actorPerformances: ActorPerformance[];
  scenes: Scene[];
  effectCues: EffectCue[];
  timeline: TimelineDocument;
  markers: Marker[];
}

export interface DirtyRange {
  startFrame: number;
  endFrame: number;
  reason: string;
}

export interface ImpactReport {
  changed: Id[];
  moved: Id[];
  recomputed: string[];
  stale: Id[];
  conflicts: string[];
  dirtyRanges: DirtyRange[];
  warnings: string[];
}

export interface RevisionRecord {
  id: Id;
  projectId: Id;
  number: number;
  parentId?: Id;
  summary: string;
  snapshot: ProjectSnapshot;
  impact: ImpactReport;
  createdAt: string;
}

export interface JobRecord {
  id: Id;
  projectId: Id;
  kind: JobKind;
  status: JobStatus;
  payload: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: string;
  idempotencyKey: string;
  attempt: number;
  leaseUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSummary {
  id: Id;
  name: string;
  profile: ProductionProfile;
  currentRevision: number;
  updatedAt: string;
  durationInFrames: number;
  assetCount: number;
}

export interface CommandResult {
  revision: RevisionRecord;
  impact: ImpactReport;
}

export interface EditorFocus {
  projectId: Id;
  revision: number;
  sceneId?: Id;
  itemId?: Id;
  effectCueId?: Id;
  frame?: number;
}

export const EFFECT_TYPES: EffectType[] = [
  "MetricBackdrop",
  "ProductFan",
  "GlowCTA",
  "PortfolioWall",
  "CommentCloud",
  "EvidenceCard",
  "CameraPunch",
  "FullScreenMeme",
  "DeviceShowcase",
  "ContentCarousel",
  "EndCard"
];

export const DEFAULT_TRACKS: Array<Pick<TimelineTrack, "name" | "kind">> = [
  { name: "Cutaway / Fullscreen", kind: "video" },
  { name: "Front FX", kind: "video" },
  { name: "Actor FX", kind: "video" },
  { name: "Actor / A-roll", kind: "video" },
  { name: "Rear FX", kind: "video" },
  { name: "Background", kind: "video" },
  { name: "Captions", kind: "caption" },
  { name: "Dialogue", kind: "audio" },
  { name: "SFX", kind: "audio" },
  { name: "BGM", kind: "audio" }
];
