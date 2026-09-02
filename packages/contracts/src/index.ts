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

/**
 * 素材在当前成片中的明确职责。未分类素材不能被 Presenter 主线自动选中，
 * 避免把 B-roll、证据或参考图误当成 A-roll。
 */
export type AssetRole =
  | "a_roll"
  | "b_roll"
  | "actor_mask"
  | "voice_reference"
  | "evidence"
  | "cutaway"
  | "style_reference"
  | "generated_visual";

/**
 * 素材来源记录。二进制去重仍使用 Asset.sourceHash；这里保存人工可读的授权与署名事实，
 * 不把本地文件路径误当成可商用授权。
 */
export interface AssetProvenance {
  source: "local_import" | "generated" | "provider";
  provider?: string;
  sourceUrl?: string;
  originalAssetId?: string;
  creator?: string;
  license?: string;
  attributionText?: string;
  rightsStatus: "unknown" | "cleared" | "attribution_required" | "restricted" | "rejected";
  acquiredAt: string;
}

/**
 * 素材需求、搜索意图和候选都属于同一个 Project Revision。
 * 候选不是 Asset，未完成本地化、校验和授权检查前绝不能被 Scene 或 Timeline 引用。
 */
export type AssetRequestStatus = "open" | "candidates_ready" | "acquiring" | "fulfilled" | "closed";
export type AssetCandidateStatus = "available" | "rejected" | "acquisition_queued" | "acquiring" | "acquired" | "failed";
export type AssetRightsRequirement = "cleared_only" | "cleared_or_attribution";

export interface AssetRequest {
  id: Id;
  title: string;
  purpose: string;
  visualBrief: string;
  role: AssetRole;
  queryHints: string[];
  excludedTerms: string[];
  targetAspectRatio: "9:16" | "16:9" | "1:1";
  minDurationMs?: number;
  rightsRequirement: AssetRightsRequirement;
  fallbackPlan: "keep_presenter" | "remotion" | "minimax" | "ask_user";
  status: AssetRequestStatus;
  closeReason?: string;
  createdAt: string;
  updatedAt: string;
}

/** Provider 已归一化的查询，不泄露 API Key、下载 URL 或 Provider 私有字段。 */
export interface SearchIntent {
  id: Id;
  assetRequestId: Id;
  provider: string;
  query: string;
  createdAt: string;
}

export interface AssetCandidate {
  id: Id;
  assetRequestId: Id;
  searchIntentId: Id;
  provider: string;
  originalAssetId: string;
  name: string;
  kind: "video";
  sourceUrl: string;
  previewUrl?: string;
  width?: number;
  height?: number;
  durationMs?: number;
  creator?: string;
  license?: string;
  attributionText?: string;
  rightsStatus: AssetProvenance["rightsStatus"];
  tags: string[];
  hardFilterPassed: boolean;
  filterReasons: string[];
  status: AssetCandidateStatus;
  rejectionReason?: string;
  acquisitionError?: string;
  acquiredAssetId?: Id;
  createdAt: string;
  updatedAt: string;
}

export type AssetStatus = "queued" | "analyzing" | "ready" | "failed" | "missing";
export type JobStatus = "queued" | "running" | "succeeded" | "failed" | "unknown" | "cancelled";
/** 草稿只用于内部审片；交付版必须经过当前 Revision 的完整审片。 */
export type ExportPurpose = "draft" | "delivery";
export type JobKind =
  | "media_analysis"
  | "asset_acquisition"
  | "transcription"
  | "voice_synthesis"
  | "speech_assembly"
  | "preview"
  | "export";

export type TrackKind = "video" | "audio" | "caption";
/** 当前阶段只把独立 BGM / SFX 作为可编辑声音包装；主 Dialogue 仍由 SpeechAsset 管理。 */
export type AudioCueKind = "bgm" | "sfx";
export type AudioCueStatus = "ready" | "stale";
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
  role?: AssetRole;
  provenance?: AssetProvenance;
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

/**
 * FunASR 返回全文后，代码只按标点生成候选句，供专业 Skill 审阅；
 * 它不是可直接用于剪辑或 TTS 的语义结论。
 */
export interface TranscriptSentenceCandidate {
  id: Id;
  transcriptId: Id;
  text: string;
  order: number;
  sourceAssetId: Id;
}

export type SemanticUnitKind =
  | "statement"
  | "question"
  | "answer"
  | "cause"
  | "conclusion"
  | "contrast"
  | "list_item"
  | "setup"
  | "payoff"
  | "retake"
  | "intentional_repetition";

export interface SpeechPause {
  durationMs: number;
  reason: "sentence" | "contrast" | "emotion" | "breath" | "chapter";
}

export interface SemanticUnit {
  id: Id;
  transcriptId: Id;
  text: string;
  order: number;
  sourceAssetId: Id;
  status: "included" | "deleted";
  /** 该语义单元由哪些标点候选组合而来，保持可追溯性。 */
  candidateIds: Id[];
  kind: SemanticUnitKind;
  dependencies: Id[];
  precedingContext: string;
  followingContext: string;
  retakeGroupId?: Id;
  confidence: number;
  pauseBefore?: SpeechPause;
}

export interface SpeechSegment {
  id: Id;
  semanticUnitIds: Id[];
  text: string;
  order: number;
  /** 最终节奏由语义判断显式提供，而不是对所有句子套固定停顿。 */
  pauseBefore: SpeechPause;
  pauseAfter?: SpeechPause;
  /** 旧 Revision 兼容字段；新代码应使用 pauseBefore / pauseAfter。 */
  prePauseMs?: number;
  postPauseMs?: number;
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
export type ActorAudioMode = "use_source_audio" | "use_dialogue_track" | "muted";

export interface ActorPerformance {
  id: Id;
  timelineItemId: Id;
  source: ActorPerformanceSource;
  maskMode: ActorMaskMode;
  maskAssetId?: Id;
  speechAssetId?: Id;
  scriptRevision?: number;
  /** 人物画面的声音所有权，防止视频原声与 Dialogue 同时输出。 */
  audioMode: ActorAudioMode;
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

/** 主线稳定后保存的视觉决定；它解释为什么保持人物、进入解释或使用现实 Cutaway。 */
export type VisualTreatmentMode = "keep_presenter" | "quiet" | "light_overlay" | "remotion" | "b_roll" | "cutaway" | "evidence";
export type VisualTreatmentIntensity = "quiet" | "low" | "medium" | "high";

export interface VisualTreatment {
  id: Id;
  narrativeBeatId?: Id;
  sceneId?: Id;
  mode: VisualTreatmentMode;
  primaryAttention: string;
  narrativePurpose: string;
  intensity: VisualTreatmentIntensity;
  quietReason?: string;
  fallbackPlan?: string;
  status: "ready" | "stale";
  createdAt: string;
  updatedAt: string;
}

export type EffectSemanticAnchorType = "speech_segment" | "narrative_beat" | "scene" | "absolute";
export type EffectAnchorRelation = "anticipate" | "land_on" | "react_after" | "hold_through";
export type SpatialAnchor = "top_left" | "top_right" | "middle_left" | "middle_right" | "bottom_left" | "bottom_right" | "center" | "full_frame";

/**
 * 第一阶段可由 QualityReport 确定性执行的 Cue 级规则。
 * 旧项目中保存的自由文本仍会被保留并在质量报告中提示，但不会被误当成已执行的规则。
 */
export const EFFECT_QUALITY_RULES = [
  "semantic_anchor_required",
  "asset_binding_required",
  "settled_frame_required",
  "caption_safe_area",
  "no_competing_visual",
  "actor_mask_required"
] as const;
export type EffectQualityRule = typeof EFFECT_QUALITY_RULES[number];

export interface EffectSemanticAnchor {
  type: EffectSemanticAnchorType;
  targetId?: Id;
  relation: EffectAnchorRelation;
}

/** 具名插槽使效果消费真实项目素材，而不是在 Remotion 中伪造示意卡。 */
export interface EffectAssetBinding {
  slot: string;
  assetId: Id;
}

export interface EffectMotion {
  enterPreset: string;
  settlePreset: string;
  exitPreset: string;
  enterFrames: number;
  holdFrames: number;
  exitFrames: number;
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
  narrativePurpose: string;
  audienceTask: string;
  semanticAnchor: EffectSemanticAnchor;
  spatialAnchor: SpatialAnchor;
  assetBindings: EffectAssetBinding[];
  props: Record<string, unknown>;
  motion: EffectMotion;
  stylePackId: string;
  qualityRules: string[];
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

/**
 * Duck 是 BGM 相对自身基础增益的附加衰减，不保存一个与 Dialogue 脱节的固定音量。
 * 这样 Player 和正式 Render 能以同一份 Timeline 计算进出场与旁白重叠。
 */
export interface AudioDucking {
  enabled: boolean;
  reductionDb: number;
  attackFrames: number;
  releaseFrames: number;
}

/**
 * AudioCue 保存声音为什么出现在这里；物理播放、源裁切和基础增益仍由关联 TimelineItem 保存。
 * SFX 只接受显式 media_event 与 onsetOffset，首版不会猜测文件内能量峰值。
 */
export interface AudioCue {
  id: Id;
  kind: AudioCueKind;
  assetId: Id;
  timelineItemId: Id;
  purpose: string;
  anchor: "sequence_global" | "media_event";
  /** SFX 实际被听见的编辑事件帧；BGM 使用 sequence_global，不填写该字段。 */
  eventFrame?: number;
  /** 当前 SFX 源片段起点到可感知事件的已确认偏移，0 代表事件就在所选片段开头。 */
  onsetOffsetFrames?: number;
  fadeInFrames: number;
  fadeOutFrames: number;
  /** 仅 BGM 允许循环同一段受管本地音频。 */
  loop: boolean;
  ducking?: AudioDucking;
  status: AudioCueStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Cutaway 同时保存导演决定和物理播放范围。它引用由 Application 创建的顶层 TimelineItem，
 * 不能把未本地化的 Candidate 或远程 URL 直接写进 Renderer。
 */
export type CutawayMode = "fullscreen" | "pip";
export type CutawayFit = "cover" | "contain";
export type CutawayAudioMode = "continue_dialogue" | "include_source_audio" | "mute_source_audio";

export interface Cutaway {
  id: Id;
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
  status: "ready" | "stale";
  createdAt: string;
  updatedAt: string;
}

export interface CaptionCard {
  id: Id;
  speechSegmentId: Id;
  /** 当前 SpeechSegment 的原始可播放文字；手工改屏幕文案时仍可回到语音事实。 */
  sourceText?: string;
  text: string;
  /** derived 表示仍显示语音原文，manual 仅表示屏幕文案被单独编辑，不会改写 Script。 */
  textMode?: "derived" | "manual";
  startFrame: number;
  endFrame: number;
  style: "stable";
  /** 稳定字幕允许有限的排版与强调，不开放任意 CSS 或伪造词级时间。 */
  format?: CaptionFormat;
  emphasis?: CaptionEmphasis;
  precision: TimingPrecision;
}

export interface CaptionFormat {
  fontSize: number;
  fontWeight: number;
  color: string;
  backgroundColor?: string;
  bottomPercent: number;
  horizontalInsetPercent: number;
  textAlign: "left" | "center" | "right";
}

/** 第一版只支持一个连续短语强调；它始终在 Card 级时序内，不声称具备逐词时间。 */
export interface CaptionEmphasis {
  text: string;
  occurrence: number;
  color?: string;
  backgroundColor?: string;
  fontWeight?: number;
  scale?: number;
}

export const DEFAULT_CAPTION_FORMAT: CaptionFormat = {
  fontSize: 32,
  fontWeight: 750,
  color: "#ffffff",
  bottomPercent: 7,
  horizontalInsetPercent: 8,
  textAlign: "center"
};

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

/** 质量 Skill 的四轮审片及模式专项检查，必须说明实际看过的范围。 */
export type EditorialReviewPass = "audio_only" | "mute_visual" | "audiovisual" | "first_viewer" | "mode_specific";
export type EditorialReviewSeverity = "blocking" | "warning" | "major" | "minor" | "suggestion" | "inconclusive";
export type EditorialReviewCategory = "semantic" | "pacing" | "attention" | "motion" | "typography" | "audio" | "mode_specific";

export interface EditorialReviewFinding {
  id: Id;
  pass: EditorialReviewPass;
  severity: EditorialReviewSeverity;
  category: EditorialReviewCategory;
  summary: string;
  evidence: string;
  impact: string;
  suggestedFix?: string;
  verificationMethod?: string;
  objectId?: Id;
  frameRange?: { startFrame: number; endFrame: number };
}

/**
 * 这不是自动审美结论，而是 Skill 在真实预览后留下的可追溯审片记录。
 * blocking/warning 会投影到 QualityReport；其余严重级别保留在 ProductionRun 中供人判断。
 */
export interface EditorialQualityReview {
  revision: number;
  passes: EditorialReviewPass[];
  previewEvidence: string[];
  findings: EditorialReviewFinding[];
  reviewedAt: string;
}

export interface QualityReport {
  revision: number;
  generatedAt: string;
  /** 可由代码确定的结构与媒体规则。 */
  technical: QualityIssue[];
  /** 由 Skill + 真实预览补充的编辑判断；未评审时保持空数组而不是伪造通过。 */
  editorial: {
    status: "not_recorded" | "reviewed" | "stale";
    /** 仅在当前 Revision 已有真实审片记录时返回，供交付门禁确认审片覆盖范围。 */
    passes: EditorialReviewPass[];
    semantic: QualityIssue[];
    pacing: QualityIssue[];
    attention: QualityIssue[];
    motion: QualityIssue[];
    typography: QualityIssue[];
    audio: QualityIssue[];
    modeSpecific: QualityIssue[];
    previewEvidence: string[];
  };
  requiredFixes: QualityIssue[];
  /** 兼容现有 Web / API 的扁平视图。 */
  issues: QualityIssue[];
}

/** incomplete 表示已经尝试收口，但缺少阶段 1 的必需证据；仍可继续补充同一 Run。 */
export type ProductionRunStatus = "active" | "incomplete" | "completed" | "abandoned";

export interface CreativeDecision {
  id: Id;
  category: "story" | "semantic" | "scene" | "visual" | "audio" | "quality";
  decision: string;
  rationale: string;
  objectIds: Id[];
  evidence: string[];
  alternatives?: string[];
  createdAt: string;
}

/**
 * ProductionRun 是任务审计，不是 Project Snapshot 的副本；它持久化在项目 reports 目录，
 * 用于回答“这次为什么这样剪”。
 */
export interface SkillExecutionReport {
  id: Id;
  projectId: Id;
  status: ProductionRunStatus;
  baseRevision: number;
  finalRevision?: number;
  loadedSkills: string[];
  loadedReferences: string[];
  creativeDecisions: CreativeDecision[];
  quietRanges: Array<{ startFrame: number; endFrame: number; reason: string }>;
  effectDecisions: string[];
  rejectedAlternatives: string[];
  mcpCommands: Array<{ name: string; revision?: number; createdAt: string }>;
  previewEvidence: string[];
  /** inspect_composed_frames 真正产出的当前 Revision 帧文件，不接受人工字符串冒充。 */
  composedFrameEvidence: string[];
  qualityReview: string[];
  editorialReview?: EditorialQualityReview;
  /** 调用 complete 时未满足的条件；完成后为空。 */
  completionBlockers: string[];
  createdAt: string;
  completedAt?: string;
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
  assetRequests: AssetRequest[];
  searchIntents: SearchIntent[];
  assetCandidates: AssetCandidate[];
  visualTreatments: VisualTreatment[];
  cutaways: Cutaway[];
  audioCues: AudioCue[];
  voiceReferences: VoiceReference[];
  transcripts: TranscriptText[];
  transcriptSentenceCandidates: TranscriptSentenceCandidate[];
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
