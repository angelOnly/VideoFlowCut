import { existsSync, mkdirSync } from "node:fs";
import { mkdir, readFile, readdir, rename, stat, writeFile } from "node:fs/promises";
import { isAbsolute, join, relative, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type {
  Asset,
  AssetCandidate,
  AssetRequest,
  AssetRightsRequirement,
  ActorAudioMode,
  ActorMaskMode,
  ActorPerformanceSource,
  AudioCue,
  AudioCueKind,
  AudioDucking,
  BridgeRunAudit,
  CaptionCard,
  CaptionEmphasis,
  CaptionFormat,
  CreativeBrief,
  Cutaway,
  CutawayAudioMode,
  CutawayFit,
  CutawayMode,
  EffectAssetBinding,
  EffectCue,
  EffectMotion,
  EffectType,
  EditorialQualityReview,
  EditorialReviewCategory,
  EditorialReviewPass,
  EditorialReviewSeverity,
  ExportPurpose,
  Id,
  ImpactReport,
  JobKind,
  JobRecord,
  JobStatus,
  MediaMetadata,
  ProjectSnapshot,
  ProjectSummary,
  RevisionRecord,
  SceneType,
  SemanticUnitKind,
  SearchIntent,
  SkillExecutionReport,
  SpatialAnchor,
  StoryBeat,
  SpeechAsset,
  SpeechSegmentAsset,
  SpeechTiming,
  TimelineItem,
  VisualTreatment,
  VisualTreatmentIntensity,
  VisualTreatmentMode,
  VoiceReference
} from "@videocut/contracts";
import {
  assetById,
  assertProjectGraphValid,
  assertTimelineValid,
  cloneSnapshot,
  compileSpeechSegments,
  createActorPerformance,
  createAudioCue,
  createCutaway,
  createEffectCue,
  createId,
  createMediaAsset,
  createProjectSnapshot,
  createScene,
  createSemanticUnit,
  createStoryDocument,
  createTranscriptSentenceCandidates,
  createVoiceReference,
  createTimelineItem,
  createVisualTreatment,
  DomainError,
  emptyImpact,
  framesToMilliseconds,
  millisecondsToFrames,
  now,
  trackByName
} from "@videocut/domain";
import { DEFAULT_CAPTION_FORMAT } from "@videocut/contracts";
import { evaluateQuality } from "@videocut/quality";

type ProjectRow = {
  id: string;
  name: string;
  profile: string;
  root_path: string;
  current_revision_id: string;
  current_revision_number: number;
  created_at: string;
  updated_at: string;
};

type RevisionRow = {
  id: string;
  project_id: string;
  revision_number: number;
  parent_id: string | null;
  summary: string;
  snapshot_json: string;
  impact_json: string;
  created_at: string;
};

type JobRow = {
  id: string;
  project_id: string;
  kind: JobKind;
  status: JobStatus;
  payload_json: string;
  result_json: string | null;
  error: string | null;
  idempotency_key: string;
  attempt: number;
  lease_until: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * 预览检查是 Job 的派生证据：只有 inspect_composed_frames 成功后才会写入。
 * 它不进入 Revision Snapshot，避免把审片产物误当成剪辑状态。
 */
type PreviewInspectionEvidence = {
  revision: number;
  sourcePreviewJobId: Id;
  inspectedAt: string;
  frames: Array<{ frame: number; relativePath: string }>;
};

export class RevisionConflictError extends Error {
  constructor(public readonly expected: number, public readonly actual: number) {
    super(`Revision 已过期：请求基于 ${expected}，当前为 ${actual}`);
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export interface ProjectState {
  revision: RevisionRecord;
  snapshot: ProjectSnapshot;
}

export interface AppEvent {
  projectId: Id;
  revision: number;
  type: "revision" | "job";
}

/** 为已有项目补齐新增的快照字段；旧 Revision 在下一次提交时自然升级，不改写历史记录。 */
function normalizeSnapshot(snapshot: ProjectSnapshot): ProjectSnapshot {
  snapshot.story ??= createStoryDocument(snapshot.project.name, snapshot.project.updatedAt);
  snapshot.assetRequests ??= [];
  snapshot.searchIntents ??= [];
  snapshot.assetCandidates ??= [];
  snapshot.visualTreatments ??= [];
  snapshot.cutaways ??= [];
  snapshot.audioCues ??= [];
  snapshot.voiceReferences ??= [];
  snapshot.transcriptSentenceCandidates ??= [];
  for (const caption of snapshot.timeline.captions ?? []) {
    // 旧快照没有保存原始语音文案时，以当时已经渲染的文字作为可回退来源。
    caption.sourceText ??= caption.text;
    caption.textMode ??= "derived";
    caption.format ??= { ...DEFAULT_CAPTION_FORMAT };
  }
  for (const reference of snapshot.voiceReferences) {
    // 旧 Revision 没有这些字段时只补默认提示，不伪造用户已取得授权的事实。
    reference.source ??= "local_asset";
    reference.authorizationNote ??= "未填写授权信息；仅在已获得声音使用授权的前提下使用。";
    reference.usageNote ??= "仅用于当前项目的本地语音合成。";
    reference.recommendedRange ??= { startMs: 0, endMs: 0 };
    reference.quality ??= "warning";
    reference.usable ??= true;
  }
  snapshot.actorPerformances ??= [];
  for (const performance of snapshot.actorPerformances) {
    // 旧快照缺少声音所有权时，优先选择 Dialogue，宁可提示复核也不能继续双声叠加。
    performance.audioMode ??= snapshot.speechAsset ? "use_dialogue_track" : "use_source_audio";
  }
  for (const unit of snapshot.semanticUnits ?? []) {
    if (!unit.candidateIds?.length) {
      const legacyCandidateId = `sentence_candidate_legacy_${unit.id}`;
      if (!snapshot.transcriptSentenceCandidates.some((candidate) => candidate.id === legacyCandidateId)) {
        snapshot.transcriptSentenceCandidates.push({
          id: legacyCandidateId,
          transcriptId: unit.transcriptId,
          sourceAssetId: unit.sourceAssetId,
          text: unit.text,
          order: unit.order
        });
      }
      unit.candidateIds = [legacyCandidateId];
    }
    unit.kind ??= "statement";
    unit.dependencies ??= [];
    unit.precedingContext ??= "";
    unit.followingContext ??= "";
    unit.confidence ??= 0.5;
  }
  for (const segment of snapshot.speechSegments ?? []) {
    segment.pauseBefore ??= { durationMs: segment.prePauseMs ?? 0, reason: "sentence" };
    if (segment.pauseAfter === undefined && (segment.postPauseMs ?? 0) > 0) {
      segment.pauseAfter = { durationMs: segment.postPauseMs ?? 0, reason: "sentence" };
    }
  }
  for (const cue of snapshot.effectCues ?? []) {
    cue.narrativePurpose ??= cue.note || "支持当前叙事重点";
    cue.audienceTask ??= "理解当前表达";
    cue.semanticAnchor ??= {
      type: cue.anchorTargetId ? "speech_segment" : "scene",
      targetId: cue.anchorTargetId ?? cue.sceneId,
      relation: "land_on"
    };
    cue.spatialAnchor ??= cue.layer === "fullscreen" ? "full_frame" : cue.layer === "rear" ? "middle_left" : "bottom_right";
    cue.assetBindings ??= [];
    cue.props ??= {};
    cue.motion ??= {
      enterPreset: "fade_slide",
      settlePreset: "hold",
      exitPreset: "fade",
      enterFrames: 10,
      holdFrames: Math.max(0, cue.endFrame - cue.startFrame - 20),
      exitFrames: 10
    };
    cue.stylePackId ??= "default-clean";
    cue.qualityRules ??= [];
  }
  return snapshot;
}

function assertAssetProvenanceValid(provenance: NonNullable<Asset["provenance"]>): void {
  if (provenance.source === "provider" && (!provenance.provider?.trim() || !provenance.sourceUrl?.trim())) {
    throw new DomainError("外部素材必须记录来源平台和原始页面", "PROVENANCE_SOURCE_REQUIRED");
  }
  if (provenance.rightsStatus === "attribution_required" && !provenance.attributionText?.trim()) {
    throw new DomainError("需要署名的素材必须记录署名文本", "ATTRIBUTION_TEXT_REQUIRED");
  }
}

function assetRequestById(snapshot: ProjectSnapshot, assetRequestId: Id): AssetRequest {
  const request = snapshot.assetRequests.find((candidate) => candidate.id === assetRequestId);
  if (!request) throw new NotFoundError(`素材需求不存在：${assetRequestId}`);
  return request;
}

function assetCandidateById(snapshot: ProjectSnapshot, assetCandidateId: Id): AssetCandidate {
  const candidate = snapshot.assetCandidates.find((entry) => entry.id === assetCandidateId);
  if (!candidate) throw new NotFoundError(`素材候选不存在：${assetCandidateId}`);
  return candidate;
}

function visualTreatmentById(snapshot: ProjectSnapshot, visualTreatmentId: Id): VisualTreatment {
  const treatment = snapshot.visualTreatments.find((candidate) => candidate.id === visualTreatmentId);
  if (!treatment) throw new NotFoundError(`VisualTreatment 不存在：${visualTreatmentId}`);
  return treatment;
}

function cutawayById(snapshot: ProjectSnapshot, cutawayId: Id): Cutaway {
  const cutaway = snapshot.cutaways.find((candidate) => candidate.id === cutawayId);
  if (!cutaway) throw new NotFoundError(`Cutaway 不存在：${cutawayId}`);
  return cutaway;
}

function requireText(value: string | undefined, label: string): string {
  const text = value?.trim() ?? "";
  if (!text) throw new DomainError(`${label}不能为空`, "REQUIRED_TEXT_MISSING");
  return text;
}

type CaptionFormatPatch = Partial<Omit<CaptionFormat, "backgroundColor">> & { backgroundColor?: string | null };
type AudioDuckingPatch = Partial<AudioDucking>;

const DEFAULT_BGM_DUCKING: AudioDucking = {
  enabled: true,
  reductionDb: -14,
  attackFrames: 4,
  releaseFrames: 14
};

/** BGM / SFX 只接收已本地化的独立音频，不能把任意带声视频悄悄当作音乐或音效。 */
function requireReadyAudioAsset(snapshot: ProjectSnapshot, assetId: Id): Asset {
  const asset = assetById(snapshot, assetId);
  if (asset.kind !== "audio" || asset.status !== "ready" || !asset.metadata?.hasAudio || !asset.managedPath.trim()) {
    throw new DomainError("BGM / SFX 必须使用已就绪、已本地化的独立音频素材", "AUDIO_ASSET_NOT_READY");
  }
  return asset;
}

function requireAudioFrame(value: number, label: string, minimum = 0, maximum = Number.MAX_SAFE_INTEGER): number {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new DomainError(`${label}必须是 ${minimum} 到 ${maximum} 之间的整数帧`, "INVALID_AUDIO_FRAME");
  }
  return value;
}

function normalizeAudioDucking(patch: AudioDuckingPatch | undefined, current?: AudioDucking): AudioDucking {
  // MCP / HTTP 的可选嵌套字段可能显式传入 undefined；这不应覆盖已有 Duck 参数。
  const definedPatch = Object.fromEntries(Object.entries(patch ?? {}).filter(([, value]) => value !== undefined)) as AudioDuckingPatch;
  const next = { ...DEFAULT_BGM_DUCKING, ...current, ...definedPatch };
  if (typeof next.enabled !== "boolean") throw new DomainError("Duck 开关必须是布尔值", "INVALID_AUDIO_DUCKING");
  if (!Number.isFinite(next.reductionDb) || next.reductionDb > -1 || next.reductionDb < -36) {
    throw new DomainError("Duck 衰减必须在 -36 到 -1 dB 之间", "INVALID_AUDIO_DUCKING");
  }
  for (const [label, value] of [["Duck 攻击", next.attackFrames], ["Duck 释放", next.releaseFrames]] as const) {
    if (!Number.isInteger(value) || value < 0 || value > 240) {
      throw new DomainError(`${label}必须是 0 到 240 帧`, "INVALID_AUDIO_DUCKING");
    }
  }
  return next;
}

const captionColorPattern = /^#[0-9a-f]{6}$/iu;

/** 保留用户主动换行，但限制为稳定双行字幕，避免把段级 Card 变成整页文字。 */
function normalizeCaptionText(value: string, label = "字幕文案"): string {
  const text = value
    .replace(/\r\n?/gu, "\n")
    .replace(/[ \t]+\n/gu, "\n")
    .replace(/\n[ \t]+/gu, "\n")
    .replace(/\n{3,}/gu, "\n\n")
    .trim();
  if (!text) throw new DomainError(`${label}不能为空`, "CAPTION_TEXT_REQUIRED");
  if (text.length > 80) throw new DomainError(`${label}不能超过 80 个字符`, "CAPTION_TEXT_TOO_LONG");
  if (text.split("\n").length > 2) throw new DomainError(`${label}最多允许两行`, "CAPTION_TOO_MANY_LINES");
  return text;
}

function requireCaptionColor(value: string | undefined, label: string): string | undefined {
  if (value === undefined) return undefined;
  if (!captionColorPattern.test(value)) throw new DomainError(`${label}必须是 #RRGGBB 颜色`, "INVALID_CAPTION_COLOR");
  return value.toLowerCase();
}

/** 只接收明确的字幕排版字段，避免把任意 CSS 写进可渲染 Project Snapshot。 */
function applyCaptionFormat(current: CaptionFormat | undefined, patch: CaptionFormatPatch): CaptionFormat {
  // backgroundColor 的 null 只表示显式移除背景，不应作为运行时颜色写入 Snapshot。
  const { backgroundColor, ...rawFormatPatch } = patch;
  // MCP 解构会携带未传字段的 undefined；它们不能覆盖既有安全排版值。
  const formatPatch = Object.fromEntries(Object.entries(rawFormatPatch).filter(([, value]) => value !== undefined)) as Partial<Omit<CaptionFormat, "backgroundColor">>;
  const next: CaptionFormat = { ...DEFAULT_CAPTION_FORMAT, ...current, ...formatPatch };
  if (backgroundColor === null) delete next.backgroundColor;
  else if (backgroundColor !== undefined) next.backgroundColor = backgroundColor;
  if (!Number.isInteger(next.fontSize) || next.fontSize < 16 || next.fontSize > 72) {
    throw new DomainError("字幕字号必须在 16 到 72 之间", "INVALID_CAPTION_FONT_SIZE");
  }
  if (!Number.isInteger(next.fontWeight) || next.fontWeight < 400 || next.fontWeight > 900) {
    throw new DomainError("字幕字重必须在 400 到 900 之间", "INVALID_CAPTION_FONT_WEIGHT");
  }
  if (!Number.isFinite(next.bottomPercent) || next.bottomPercent < 4 || next.bottomPercent > 20) {
    throw new DomainError("字幕底部安全区必须在 4% 到 20% 之间", "INVALID_CAPTION_BOTTOM");
  }
  if (!Number.isFinite(next.horizontalInsetPercent) || next.horizontalInsetPercent < 3 || next.horizontalInsetPercent > 20) {
    throw new DomainError("字幕左右安全区必须在 3% 到 20% 之间", "INVALID_CAPTION_INSET");
  }
  next.color = requireCaptionColor(next.color, "字幕颜色")!;
  const normalizedBackgroundColor = requireCaptionColor(next.backgroundColor, "字幕背景颜色");
  if (normalizedBackgroundColor === undefined) delete next.backgroundColor;
  else next.backgroundColor = normalizedBackgroundColor;
  if (!["left", "center", "right"].includes(next.textAlign)) {
    throw new DomainError("字幕对齐方式无效", "INVALID_CAPTION_ALIGNMENT");
  }
  return next;
}

function occurrenceIndex(text: string, phrase: string, occurrence: number): number {
  let index = -1;
  for (let offset = 0; offset <= occurrence; offset += 1) {
    index = text.indexOf(phrase, index + 1);
    if (index < 0) return -1;
  }
  return index;
}

function normalizeCaptionEmphasis(value: CaptionEmphasis, captionText: string): CaptionEmphasis {
  const text = requireText(value.text, "字幕强调短语");
  if (text.length > 40 || text.includes("\n")) {
    throw new DomainError("字幕强调短语必须是一行不超过 40 个字符的连续文字", "INVALID_CAPTION_EMPHASIS_TEXT");
  }
  if (!Number.isInteger(value.occurrence) || value.occurrence < 0 || occurrenceIndex(captionText, text, value.occurrence) < 0) {
    throw new DomainError("字幕强调短语必须是当前字幕中的连续文字", "CAPTION_EMPHASIS_NOT_FOUND");
  }
  if (value.scale !== undefined && (!Number.isFinite(value.scale) || value.scale < 0.8 || value.scale > 1.35)) {
    throw new DomainError("字幕强调缩放必须在 0.8 到 1.35 之间", "INVALID_CAPTION_EMPHASIS_SCALE");
  }
  if (value.fontWeight !== undefined && (!Number.isInteger(value.fontWeight) || value.fontWeight < 400 || value.fontWeight > 900)) {
    throw new DomainError("字幕强调字重必须在 400 到 900 之间", "INVALID_CAPTION_EMPHASIS_WEIGHT");
  }
  return {
    text,
    occurrence: value.occurrence,
    color: requireCaptionColor(value.color, "字幕强调颜色"),
    backgroundColor: requireCaptionColor(value.backgroundColor, "字幕强调背景颜色"),
    fontWeight: value.fontWeight,
    scale: value.scale
  };
}

function normalizedTextList(values: string[] | undefined): string[] {
  return [...new Set((values ?? []).map((value) => value.trim()).filter(Boolean))];
}

function candidateFilterReasons(
  candidate: Pick<AssetCandidate, "originalAssetId" | "sourceUrl" | "durationMs" | "rightsStatus">,
  request: Pick<AssetRequest, "minDurationMs" | "rightsRequirement">
): string[] {
  const reasons: string[] = [];
  if (!candidate.originalAssetId.trim()) reasons.push("Provider 未返回原始素材 ID。");
  if (!candidate.sourceUrl.trim()) reasons.push("Provider 未返回可追溯的来源页面。");
  if (request.minDurationMs !== undefined && (candidate.durationMs === undefined || candidate.durationMs < request.minDurationMs)) {
    reasons.push(`时长不足 ${Math.ceil(request.minDurationMs / 1000)} 秒。`);
  }
  const allowed = request.rightsRequirement === "cleared_only"
    ? candidate.rightsStatus === "cleared"
    : candidate.rightsStatus === "cleared" || candidate.rightsStatus === "attribution_required";
  if (!allowed) reasons.push("授权状态不满足当前素材需求。");
  return reasons;
}

function candidateIsAllowed(candidate: Pick<AssetCandidate, "originalAssetId" | "sourceUrl" | "durationMs" | "rightsStatus" | "hardFilterPassed">, request: Pick<AssetRequest, "minDurationMs" | "rightsRequirement">): boolean {
  if (!candidate.hardFilterPassed) return false;
  return candidateFilterReasons(candidate, request).length === 0;
}

/** Provider 已完成字段归一化后的候选；私有下载地址和 API Key 不进入 Revision。 */
export interface AssetSearchCandidateInput {
  originalAssetId: string;
  name: string;
  sourceUrl: string;
  previewUrl?: string;
  width?: number;
  height?: number;
  durationMs?: number;
  creator?: string;
  license?: string;
  attributionText?: string;
  rightsStatus: AssetCandidate["rightsStatus"];
  tags?: string[];
}

/**
 * SQLite 只保存不可变 Revision 快照与任务状态；任何编辑写入都通过此仓储提交，
 * 防止 Web、MCP 和 Worker 各自维护一份 Timeline。
 */
export class ProjectRepository {
  private readonly db: DatabaseSync;

  constructor(public readonly workspaceRoot: string) {
    mkdirSync(workspaceRoot, { recursive: true });
    mkdirSync(join(workspaceRoot, "projects"), { recursive: true });
    this.db = new DatabaseSync(join(workspaceRoot, "app.sqlite"));
    // Server 与独立 Worker 会同时访问同一份 SQLite；短暂等待可避免正常事务互相误判为失败。
    this.db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        profile TEXT NOT NULL,
        root_path TEXT NOT NULL,
        current_revision_id TEXT NOT NULL,
        current_revision_number INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS revisions (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        revision_number INTEGER NOT NULL,
        parent_id TEXT,
        summary TEXT NOT NULL,
        snapshot_json TEXT NOT NULL,
        impact_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE(project_id, revision_number),
        FOREIGN KEY(project_id) REFERENCES projects(id)
      );
      CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        kind TEXT NOT NULL,
        status TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        result_json TEXT,
        error TEXT,
        idempotency_key TEXT NOT NULL,
        attempt INTEGER NOT NULL,
        lease_until TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(project_id, idempotency_key),
        FOREIGN KEY(project_id) REFERENCES projects(id)
      );
    `);
  }

  close(): void {
    this.db.close();
  }

  private transaction<T>(work: () => T): T {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const result = work();
      this.db.exec("COMMIT");
      return result;
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  private revisionFromRow(row: RevisionRow): RevisionRecord {
    return {
      id: row.id,
      projectId: row.project_id,
      number: row.revision_number,
      parentId: row.parent_id ?? undefined,
      summary: row.summary,
      snapshot: normalizeSnapshot(JSON.parse(row.snapshot_json) as ProjectSnapshot),
      impact: JSON.parse(row.impact_json) as ImpactReport,
      createdAt: row.created_at
    };
  }

  private jobFromRow(row: JobRow): JobRecord {
    return {
      id: row.id,
      projectId: row.project_id,
      kind: row.kind,
      status: row.status,
      payload: JSON.parse(row.payload_json) as Record<string, unknown>,
      result: row.result_json ? (JSON.parse(row.result_json) as Record<string, unknown>) : undefined,
      error: row.error ?? undefined,
      idempotencyKey: row.idempotency_key,
      attempt: row.attempt,
      leaseUntil: row.lease_until ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  createProject(input: {
    name: string;
    profile?: ProjectSnapshot["project"]["profile"];
    brief?: Partial<CreativeBrief>;
  }): ProjectState {
    const projectId = createId("project");
    const rootPath = join(this.workspaceRoot, "projects", projectId);
    for (const directory of ["assets/source", "assets/proxy", "assets/voice-reference", "assets/speech", "assets/actor", "assets/derived", "previews", "exports", "cache", "reports"]) {
      mkdirSync(join(rootPath, directory), { recursive: true });
    }
    const snapshot = createProjectSnapshot({ projectId, rootPath, name: input.name, profile: input.profile, brief: input.brief });
    const revision: RevisionRecord = {
      id: createId("revision"),
      projectId,
      number: 1,
      summary: "创建项目",
      snapshot,
      impact: emptyImpact(),
      createdAt: now()
    };
    this.transaction(() => {
      this.db.prepare(`INSERT INTO projects (id, name, profile, root_path, current_revision_id, current_revision_number, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(projectId, input.name, snapshot.project.profile, rootPath, revision.id, revision.number, revision.createdAt, revision.createdAt);
      this.insertRevision(revision);
    });
    return { revision, snapshot };
  }

  private insertRevision(revision: RevisionRecord): void {
    this.db.prepare(`INSERT INTO revisions (id, project_id, revision_number, parent_id, summary, snapshot_json, impact_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(
        revision.id,
        revision.projectId,
        revision.number,
        revision.parentId ?? null,
        revision.summary,
        JSON.stringify(revision.snapshot),
        JSON.stringify(revision.impact),
        revision.createdAt
      );
  }

  getProjectRow(projectId: Id): ProjectRow {
    const row = this.db.prepare("SELECT * FROM projects WHERE id = ?").get(projectId) as ProjectRow | undefined;
    if (!row) throw new NotFoundError(`项目不存在：${projectId}`);
    return row;
  }

  getCurrent(projectId: Id): ProjectState {
    const project = this.getProjectRow(projectId);
    const row = this.db.prepare("SELECT * FROM revisions WHERE id = ?").get(project.current_revision_id) as RevisionRow | undefined;
    if (!row) throw new NotFoundError(`项目 ${projectId} 缺少当前 Revision`);
    const revision = this.revisionFromRow(row);
    return { revision, snapshot: revision.snapshot };
  }

  getRevision(projectId: Id, number: number): RevisionRecord {
    const row = this.db.prepare("SELECT * FROM revisions WHERE project_id = ? AND revision_number = ?").get(projectId, number) as RevisionRow | undefined;
    if (!row) throw new NotFoundError(`不存在 Revision ${number}`);
    return this.revisionFromRow(row);
  }

  listProjects(): ProjectSummary[] {
    const rows = this.db.prepare("SELECT * FROM projects ORDER BY updated_at DESC").all() as ProjectRow[];
    return rows.map((row) => {
      const revisionRow = this.db.prepare("SELECT snapshot_json FROM revisions WHERE id = ?").get(row.current_revision_id) as { snapshot_json: string };
      const snapshot = normalizeSnapshot(JSON.parse(revisionRow.snapshot_json) as ProjectSnapshot);
      return {
        id: row.id,
        name: row.name,
        profile: row.profile as ProjectSnapshot["project"]["profile"],
        currentRevision: row.current_revision_number,
        updatedAt: row.updated_at,
        durationInFrames: snapshot.timeline.durationInFrames,
        assetCount: snapshot.assets.length
      };
    });
  }

  listRevisions(projectId: Id): Array<Pick<RevisionRecord, "id" | "number" | "summary" | "createdAt" | "impact">> {
    this.getProjectRow(projectId);
    const rows = this.db.prepare("SELECT * FROM revisions WHERE project_id = ? ORDER BY revision_number DESC").all(projectId) as RevisionRow[];
    return rows.map((row) => {
      const revision = this.revisionFromRow(row);
      return { id: revision.id, number: revision.number, summary: revision.summary, createdAt: revision.createdAt, impact: revision.impact };
    });
  }

  commit(projectId: Id, baseRevision: number, summary: string, mutate: (snapshot: ProjectSnapshot, impact: ImpactReport) => void): ProjectState {
    return this.transaction(() => {
      const current = this.getCurrent(projectId);
      if (current.revision.number !== baseRevision) {
        throw new RevisionConflictError(baseRevision, current.revision.number);
      }
      const snapshot = cloneSnapshot(current.snapshot);
      const impact = emptyImpact();
      mutate(snapshot, impact);
      snapshot.project.updatedAt = now();
      assertTimelineValid(snapshot);
      assertProjectGraphValid(snapshot);
      const revision: RevisionRecord = {
        id: createId("revision"),
        projectId,
        number: current.revision.number + 1,
        parentId: current.revision.id,
        summary,
        snapshot,
        impact,
        createdAt: now()
      };
      this.insertRevision(revision);
      this.db.prepare(`UPDATE projects SET name = ?, profile = ?, current_revision_id = ?, current_revision_number = ?, updated_at = ? WHERE id = ?`)
        .run(snapshot.project.name, snapshot.project.profile, revision.id, revision.number, revision.createdAt, projectId);
      return { revision, snapshot };
    });
  }

  createJob(input: { projectId: Id; kind: JobKind; payload: Record<string, unknown>; idempotencyKey: string }): JobRecord {
    this.getProjectRow(input.projectId);
    const existing = this.db.prepare("SELECT * FROM jobs WHERE project_id = ? AND idempotency_key = ?").get(input.projectId, input.idempotencyKey) as JobRow | undefined;
    if (existing) return this.jobFromRow(existing);
    const createdAt = now();
    const job: JobRecord = {
      id: createId("job"),
      projectId: input.projectId,
      kind: input.kind,
      status: "queued",
      payload: input.payload,
      idempotencyKey: input.idempotencyKey,
      attempt: 0,
      createdAt,
      updatedAt: createdAt
    };
    this.db.prepare(`INSERT INTO jobs (id, project_id, kind, status, payload_json, result_json, error, idempotency_key, attempt, lease_until, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, NULL, NULL, ?, ?, NULL, ?, ?)`)
      .run(job.id, job.projectId, job.kind, job.status, JSON.stringify(job.payload), job.idempotencyKey, job.attempt, job.createdAt, job.updatedAt);
    return job;
  }

  listJobs(projectId: Id): JobRecord[] {
    this.getProjectRow(projectId);
    const rows = this.db.prepare("SELECT * FROM jobs WHERE project_id = ? ORDER BY created_at DESC").all(projectId) as JobRow[];
    return rows.map((row) => this.jobFromRow(row));
  }

  getJob(jobId: Id): JobRecord {
    const row = this.db.prepare("SELECT * FROM jobs WHERE id = ?").get(jobId) as JobRow | undefined;
    if (!row) throw new NotFoundError(`任务不存在：${jobId}`);
    return this.jobFromRow(row);
  }

  claimNextJob(kinds?: JobKind[], leaseMilliseconds = 60_000): JobRecord | undefined {
    return this.transaction(() => {
      const nowIso = now();
      const kindsClause = kinds?.length ? `AND kind IN (${kinds.map(() => "?").join(",")})` : "";
      const parameters = kinds?.length ? [nowIso, ...kinds] : [nowIso];
      const row = this.db.prepare(`SELECT * FROM jobs WHERE (status = 'queued' OR (status = 'running' AND lease_until < ?)) ${kindsClause} ORDER BY created_at ASC LIMIT 1`).get(...parameters) as JobRow | undefined;
      if (!row) return undefined;
      const leaseUntil = new Date(Date.now() + leaseMilliseconds).toISOString();
      const updatedAt = now();
      this.db.prepare("UPDATE jobs SET status = 'running', attempt = attempt + 1, lease_until = ?, updated_at = ? WHERE id = ?")
        .run(leaseUntil, updatedAt, row.id);
      return this.getJob(row.id);
    });
  }

  renewJobLease(jobId: Id, leaseMilliseconds = 60_000): JobRecord {
    const job = this.getJob(jobId);
    if (job.status !== "running") {
      throw new DomainError(`任务 ${jobId} 当前不是运行状态，不能续租`, "JOB_NOT_RUNNING");
    }
    const leaseUntil = new Date(Date.now() + leaseMilliseconds).toISOString();
    this.db.prepare("UPDATE jobs SET lease_until = ?, updated_at = ? WHERE id = ?")
      .run(leaseUntil, now(), jobId);
    return this.getJob(jobId);
  }

  updateJob(jobId: Id, input: { status: JobStatus; result?: Record<string, unknown>; error?: string; leaseUntil?: string }): JobRecord {
    const old = this.getJob(jobId);
    this.db.prepare("UPDATE jobs SET status = ?, result_json = ?, error = ?, lease_until = ?, updated_at = ? WHERE id = ?")
      .run(input.status, input.result ? JSON.stringify(input.result) : old.result ? JSON.stringify(old.result) : null, input.error ?? null, input.leaseUntil ?? null, now(), jobId);
    return this.getJob(jobId);
  }
}

/** Editing Application 是唯一命令入口；HTTP、MCP 和 Worker 都委托这里。 */
export class EditingApplication {
  private readonly listeners = new Set<(event: AppEvent) => void>();

  constructor(public readonly repository: ProjectRepository) {}

  close(): void {
    this.repository.close();
  }

  subscribe(listener: (event: AppEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private publish(event: AppEvent): void {
    for (const listener of this.listeners) listener(event);
  }

  createProject(input: { name: string; profile?: ProjectSnapshot["project"]["profile"]; brief?: Partial<CreativeBrief> }): ProjectState {
    const state = this.repository.createProject(input);
    this.publish({ projectId: state.snapshot.project.id, revision: state.revision.number, type: "revision" });
    return state;
  }

  listProjects(): ProjectSummary[] {
    return this.repository.listProjects();
  }

  readProject(projectId: Id): ProjectState {
    return this.repository.getCurrent(projectId);
  }

  readRevisions(projectId: Id) {
    return this.repository.listRevisions(projectId);
  }

  /** Story 与 Scene、Timeline 一样由 Revision 事务管理，避免 Web 另存一份叙事说明。 */
  updateStory(input: {
    projectId: Id;
    baseRevision: number;
    title?: string;
    summary?: string;
    beats?: Array<Pick<StoryBeat, "title" | "purpose"> & Partial<Pick<StoryBeat, "id" | "semanticUnitIds" | "sceneIds">>>;
  }): ProjectState {
    const state = this.repository.commit(input.projectId, input.baseRevision, "更新 Story", (snapshot, impact) => {
      if (input.title !== undefined) {
        const title = input.title.trim();
        if (!title) throw new DomainError("Story 标题不能为空", "INVALID_STORY_TITLE");
        snapshot.story.title = title;
      }
      if (input.summary !== undefined) snapshot.story.summary = input.summary.trim();
      if (input.beats !== undefined) {
        const semanticIds = new Set(snapshot.semanticUnits.map((unit) => unit.id));
        const sceneIds = new Set(snapshot.scenes.map((scene) => scene.id));
        const existingById = new Map(snapshot.story.beats.map((beat) => [beat.id, beat]));
        const existingByFingerprint = new Map(snapshot.story.beats.map((beat) => [`${beat.title}::${beat.purpose}`, beat]));
        const usedIds = new Set<Id>();
        const nextBeats = input.beats.map((beat, order) => {
          const title = beat.title.trim();
          const purpose = beat.purpose.trim();
          if (!title || !purpose) throw new DomainError("Story Beat 必须包含标题和叙事目的", "INVALID_STORY_BEAT");
          const beatSemanticIds = beat.semanticUnitIds ?? [];
          const beatSceneIds = beat.sceneIds ?? [];
          for (const id of beatSemanticIds) if (!semanticIds.has(id)) throw new DomainError(`Story Beat 引用了未知语义单元：${id}`, "STORY_SEMANTIC_NOT_FOUND");
          for (const id of beatSceneIds) if (!sceneIds.has(id)) throw new DomainError(`Story Beat 引用了未知场景：${id}`, "STORY_SCENE_NOT_FOUND");
          const requested = beat.id ? existingById.get(beat.id) : undefined;
          if (beat.id && !requested) throw new DomainError(`Story Beat 不存在：${beat.id}`, "STORY_BEAT_NOT_FOUND");
          const fallback = existingByFingerprint.get(`${title}::${purpose}`) ?? snapshot.story.beats[order];
          const id = requested?.id ?? (fallback && !usedIds.has(fallback.id) ? fallback.id : createId("story_beat"));
          if (usedIds.has(id)) throw new DomainError("Story Beat 不能在同一次更新中重复", "DUPLICATE_STORY_BEAT");
          usedIds.add(id);
          return { id, order, title, purpose, semanticUnitIds: [...beatSemanticIds], sceneIds: [...beatSceneIds] };
        });
        snapshot.story.beats = nextBeats;
        // Story 是 Scene 关系的唯一编辑入口之一，写入时同步反向边，避免图出现半边引用。
        for (const scene of snapshot.scenes) {
          scene.narrativeBeatIds = nextBeats.filter((beat) => beat.sceneIds.includes(scene.id)).map((beat) => beat.id);
        }
        const nextBeatIds = new Set(nextBeats.map((beat) => beat.id));
        const removedTreatmentIds = new Set<Id>();
        for (const treatment of snapshot.visualTreatments) {
          if (!treatment.narrativeBeatId || nextBeatIds.has(treatment.narrativeBeatId)) continue;
          if (treatment.sceneId) {
            treatment.narrativeBeatId = undefined;
            treatment.status = "stale";
            treatment.updatedAt = now();
            impact.changed.push(treatment.id);
            impact.stale.push(treatment.id);
          } else {
            removedTreatmentIds.add(treatment.id);
          }
        }
        if (removedTreatmentIds.size > 0) {
          snapshot.visualTreatments = snapshot.visualTreatments.filter((treatment) => !removedTreatmentIds.has(treatment.id));
          for (const cutaway of snapshot.cutaways.filter((candidate) => candidate.visualTreatmentId && removedTreatmentIds.has(candidate.visualTreatmentId))) {
            cutaway.visualTreatmentId = undefined;
            this.markCutawayStale(snapshot, cutaway, impact, "关联的 Story Beat 已被移除");
          }
          impact.stale.push(...removedTreatmentIds);
        }
        impact.changed.push(...nextBeats.map((beat) => beat.id), ...snapshot.scenes.map((scene) => scene.id));
        impact.recomputed.push("Story Beat 与 Scene 关联");
      }
      snapshot.story.updatedAt = now();
      impact.changed.push(snapshot.story.id);
    });
    this.publish({ projectId: input.projectId, revision: state.revision.number, type: "revision" });
    return state;
  }

  /** 将可用本地音频显式登记为 VoiceReference，避免把 Asset ID 误称为远端声音档案。 */
  registerVoiceReference(input: { projectId: Id; baseRevision: number; assetId: Id; label?: string; authorizationNote?: string; usageNote?: string }): ProjectState {
    const state = this.repository.commit(input.projectId, input.baseRevision, "登记 VoiceReference", (snapshot, impact) => {
      const asset = assetById(snapshot, input.assetId);
      if (asset.kind !== "audio" || asset.status !== "ready" || !asset.metadata?.hasAudio) {
        throw new DomainError("VoiceReference 必须是已就绪且含音频的本地 Asset", "INVALID_VOICE_REFERENCE");
      }
      const label = input.label?.trim() || asset.name;
      const durationMs = asset.metadata.durationMs;
      const suitableDuration = durationMs >= 3_000 && durationMs <= 15_000;
      const quality = suitableDuration && (asset.metadata.sampleRate ?? 0) >= 8_000 ? "passed" as const : "warning" as const;
      const authorizationNote = input.authorizationNote?.trim() || "未填写授权信息；仅在已获得声音使用授权的前提下使用。";
      const usageNote = input.usageNote?.trim() || "仅用于当前项目的本地语音合成。";
      const recommendedRange = { startMs: 0, endMs: Math.min(durationMs, 15_000) };
      const existing = snapshot.voiceReferences.find((reference) => reference.assetId === asset.id);
      if (existing) {
        existing.label = label;
        existing.authorizationNote = authorizationNote;
        existing.usageNote = usageNote;
        existing.recommendedRange = recommendedRange;
        existing.quality = quality;
        existing.usable = durationMs > 0;
        impact.changed.push(existing.id);
      } else {
        const reference: VoiceReference = createVoiceReference({
          assetId: asset.id,
          label,
          authorizationNote,
          usageNote,
          recommendedRange,
          quality,
          usable: durationMs > 0
        });
        snapshot.voiceReferences.push(reference);
        impact.changed.push(reference.id);
      }
      if (!suitableDuration) impact.warnings.push("参考声音建议使用 3～15 秒、单人且低噪声的片段；当前仅标记为可用但需复核。");
    });
    this.publish({ projectId: input.projectId, revision: state.revision.number, type: "revision" });
    return state;
  }

  getProjectRoot(projectId: Id): string {
    return this.repository.getProjectRow(projectId).root_path;
  }

  /** incomplete 不是终态；补充决定或审片后可继续同一份 ProductionRun。 */
  private resumeIncompleteProductionRun(report: SkillExecutionReport, action: string): void {
    if (report.status === "completed" || report.status === "abandoned") {
      throw new DomainError(`ProductionRun 已结束，不能继续${action}`, "PRODUCTION_RUN_CLOSED");
    }
    if (report.status === "incomplete") {
      report.status = "active";
      report.completedAt = undefined;
      report.completionBlockers = [];
    }
  }

  /** 只接受位于项目目录内的预览或帧文件，避免报告引用任意本机路径。 */
  private resolveProjectEvidencePath(projectId: Id, candidatePath: string): string | undefined {
    if (!candidatePath.trim()) return undefined;
    const rootPath = resolve(this.getProjectRoot(projectId));
    const resolvedPath = resolve(rootPath, candidatePath);
    const relativePath = relative(rootPath, resolvedPath);
    if (!relativePath || /^\.\.(?:[\\/]|$)/u.test(relativePath) || isAbsolute(relativePath)) return undefined;
    return resolvedPath;
  }

  /** Preview 必须由 Render Worker 成功产出当前 Revision 的真实文件，不能只登记一个 Job。 */
  private async hasSucceededPreviewForRevision(projectId: Id, revision: number): Promise<boolean> {
    for (const job of this.repository.listJobs(projectId)) {
      if (job.kind !== "preview" || job.status !== "succeeded" || Number(job.result?.revision ?? job.payload.revision) !== revision) continue;
      const previewPath = typeof job.result?.path === "string" ? this.resolveProjectEvidencePath(projectId, job.result.path) : undefined;
      if (!previewPath || !existsSync(previewPath)) continue;
      try {
        const preview = await stat(previewPath);
        if (preview.isFile() && preview.size > 0) return true;
      } catch {
        // Worker 写入失败或文件被清理时，这个 Job 不能成为交付证据。
      }
    }
    return false;
  }

  /**
   * 合成帧必须同时满足：来自成功 Preview Job、由 inspect_composed_frames 登记、文件仍可读。
   * 这样手工放一个同名 jpg，或仅伪造 Job.result.path，都不能让 ProductionRun 收口。
   */
  private async findComposedFrameEvidence(projectId: Id, revision: number): Promise<Array<{ frame: number; relativePath: string }>> {
    const evidence = new Map<string, { frame: number; relativePath: string }>();
    for (const job of this.repository.listJobs(projectId)) {
      if (job.kind !== "preview" || job.status !== "succeeded" || Number(job.result?.revision ?? job.payload.revision) !== revision) continue;
      const inspection = job.result?.inspection as Partial<PreviewInspectionEvidence> | undefined;
      if (!inspection || inspection.revision !== revision || inspection.sourcePreviewJobId !== job.id || !Array.isArray(inspection.frames)) continue;
      // 默认的检查会抽取进入、稳定、退出三帧；少于三帧不能支撑完整的效果审片。
      if (inspection.frames.length < 3) continue;
      const validFrames: Array<{ frame: number; relativePath: string }> = [];
      for (const artifact of inspection.frames) {
        if (!artifact || !Number.isInteger(artifact.frame) || typeof artifact.relativePath !== "string") continue;
        const artifactPath = this.resolveProjectEvidencePath(projectId, artifact.relativePath);
        if (!artifactPath || !existsSync(artifactPath)) continue;
        try {
          const artifactStat = await stat(artifactPath);
          if (artifactStat.isFile() && artifactStat.size > 0) validFrames.push({ frame: artifact.frame, relativePath: artifact.relativePath });
        } catch {
          // 文件被清理或损坏时，不再作为当前收口依据。
        }
      }
      if (validFrames.length === inspection.frames.length) {
        validFrames.forEach((artifact) => evidence.set(`${artifact.frame}:${artifact.relativePath}`, artifact));
      }
    }
    return [...evidence.values()].sort((left, right) => left.frame - right.frame || left.relativePath.localeCompare(right.relativePath));
  }

  /** ProductionRun 只落为项目内 JSON 审计，不进入 Revision Snapshot，避免制造第二份剪辑状态。 */
  private reportPath(projectId: Id, reportId: Id): string {
    if (!/^production_run_[a-zA-Z0-9-]+$/u.test(reportId)) {
      throw new DomainError("ProductionRun 标识不合法", "INVALID_PRODUCTION_RUN_ID");
    }
    return join(this.getProjectRoot(projectId), "reports", `production-run-${reportId}.json`);
  }

  private async writeSkillExecutionReport(report: SkillExecutionReport): Promise<void> {
    const path = this.reportPath(report.projectId, report.id);
    await mkdir(join(this.getProjectRoot(report.projectId), "reports"), { recursive: true });
    const temporaryPath = `${path}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    await rename(temporaryPath, path);
  }

  async readSkillExecutionReport(input: { projectId: Id; runId: Id }): Promise<SkillExecutionReport> {
    try {
      const raw = await readFile(this.reportPath(input.projectId, input.runId), "utf8");
      const report = JSON.parse(raw) as SkillExecutionReport;
      if (report.projectId !== input.projectId || report.id !== input.runId) {
        throw new DomainError("ProductionRun 报告与当前项目不匹配", "PRODUCTION_RUN_MISMATCH");
      }
      // 旧报告没有收口证据字段时按空值处理，不能把历史记录误判为已通过新门禁。
      report.composedFrameEvidence ??= [];
      report.completionBlockers ??= [];
      return report;
    } catch (error) {
      if (error instanceof DomainError) throw error;
      throw new DomainError("未找到 ProductionRun 报告", "PRODUCTION_RUN_NOT_FOUND");
    }
  }

  /**
   * QualityReport 只消费最新的一份审片记录；审片报告仍然留在项目目录，
   * 不把人工判断复制进 Revision Snapshot。
   */
  async readLatestEditorialQualityReview(input: { projectId: Id; revision?: number }): Promise<EditorialQualityReview | undefined> {
    const reportsDirectory = join(this.getProjectRoot(input.projectId), "reports");
    let entries: Array<{ name: string; isFile: () => boolean }>;
    try {
      entries = await readdir(reportsDirectory, { withFileTypes: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
      throw new DomainError("无法读取项目审片报告", "EDITORIAL_REVIEW_READ_FAILED");
    }
    const reports = await Promise.all(entries
      .filter((entry) => entry.isFile() && /^production-run-production_run_[a-zA-Z0-9-]+\.json$/u.test(entry.name))
      .map(async (entry) => {
        try {
          return JSON.parse(await readFile(join(reportsDirectory, entry.name), "utf8")) as SkillExecutionReport;
        } catch {
          // 单个历史审计文件损坏不应让整个项目失去技术质量检查；显式读取该报告时仍会返回错误。
          return undefined;
        }
      }));
    return reports
      .filter((report): report is SkillExecutionReport => Boolean(
        report
        && report.projectId === input.projectId
        && report.editorialReview
        && (input.revision === undefined || report.editorialReview.revision === input.revision)
      ))
      .sort((left, right) => (right.editorialReview!.reviewedAt).localeCompare(left.editorialReview!.reviewedAt))[0]
      ?.editorialReview;
  }

  /** 导出和当前 QualityReport 都必须读取目标 Revision 的审片，不能被另一版本的最新报告覆盖。 */
  async readEditorialQualityReview(input: { projectId: Id; revision: number }): Promise<EditorialQualityReview | undefined> {
    return this.readLatestEditorialQualityReview(input);
  }

  async startProductionRun(input: { projectId: Id; baseRevision?: number; loadedSkills: string[]; loadedReferences?: string[] }): Promise<SkillExecutionReport> {
    const current = this.readProject(input.projectId);
    const baseRevision = input.baseRevision ?? current.revision.number;
    this.repository.getRevision(input.projectId, baseRevision);
    const report: SkillExecutionReport = {
      id: createId("production_run"),
      projectId: input.projectId,
      status: "active",
      baseRevision,
      loadedSkills: [...new Set(input.loadedSkills.map((skill) => skill.trim()).filter(Boolean))],
      loadedReferences: [...new Set((input.loadedReferences ?? []).map((reference) => reference.trim()).filter(Boolean))],
      creativeDecisions: [],
      quietRanges: [],
      effectDecisions: [],
      rejectedAlternatives: [],
      mcpCommands: [{ name: "start_production_run", revision: current.revision.number, createdAt: now() }],
      previewEvidence: [],
      composedFrameEvidence: [],
      qualityReview: [],
      completionBlockers: [],
      createdAt: now()
    };
    await this.writeSkillExecutionReport(report);
    return report;
  }

  async recordCreativeDecision(input: {
    projectId: Id;
    runId: Id;
    category: "story" | "semantic" | "scene" | "visual" | "audio" | "quality";
    decision: string;
    rationale: string;
    objectIds?: Id[];
    evidence?: string[];
    alternatives?: string[];
    quietRange?: { startFrame: number; endFrame: number; reason: string };
    effectDecision?: string;
    rejectedAlternative?: string;
    mcpCommand?: string;
    previewEvidence?: string;
    qualityReview?: string;
  }): Promise<SkillExecutionReport> {
    const report = await this.readSkillExecutionReport({ projectId: input.projectId, runId: input.runId });
    this.resumeIncompleteProductionRun(report, "创作判断");
    const decision = input.decision.trim();
    const rationale = input.rationale.trim();
    if (!decision || !rationale) throw new DomainError("创作判断必须说明决定与原因", "INVALID_CREATIVE_DECISION");
    report.creativeDecisions.push({
      id: createId("creative_decision"),
      category: input.category,
      decision,
      rationale,
      objectIds: input.objectIds ?? [],
      evidence: input.evidence ?? [],
      alternatives: input.alternatives?.filter(Boolean),
      createdAt: now()
    });
    if (input.quietRange) {
      if (input.quietRange.startFrame < 0 || input.quietRange.endFrame <= input.quietRange.startFrame || !input.quietRange.reason.trim()) {
        throw new DomainError("安静区范围或原因无效", "INVALID_QUIET_RANGE");
      }
      report.quietRanges.push({ ...input.quietRange, reason: input.quietRange.reason.trim() });
    }
    if (input.effectDecision?.trim()) report.effectDecisions.push(input.effectDecision.trim());
    if (input.rejectedAlternative?.trim()) report.rejectedAlternatives.push(input.rejectedAlternative.trim());
    if (input.mcpCommand?.trim()) report.mcpCommands.push({ name: input.mcpCommand.trim(), revision: this.readProject(input.projectId).revision.number, createdAt: now() });
    if (input.previewEvidence?.trim()) report.previewEvidence.push(input.previewEvidence.trim());
    if (input.qualityReview?.trim()) report.qualityReview.push(input.qualityReview.trim());
    await this.writeSkillExecutionReport(report);
    return report;
  }

  /** 记录完整四轮审片；这里只保存人/Skill 的可观察结论，不尝试由程序伪造审美判断。 */
  async recordEditorialQualityReview(input: {
    projectId: Id;
    runId: Id;
    revision: number;
    passes: EditorialReviewPass[];
    previewEvidence: string[];
    findings: Array<{
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
    }>;
  }): Promise<SkillExecutionReport> {
    const report = await this.readSkillExecutionReport({ projectId: input.projectId, runId: input.runId });
    this.resumeIncompleteProductionRun(report, "审片");
    this.repository.getRevision(input.projectId, input.revision);
    const requiredPasses: EditorialReviewPass[] = ["audio_only", "mute_visual", "audiovisual", "first_viewer", "mode_specific"];
    const passes = [...new Set(input.passes)];
    if (!requiredPasses.every((pass) => passes.includes(pass))) {
      throw new DomainError("审片必须包含只听声音、静音画面、完整声画、首次观众和模式专项五轮记录", "EDITORIAL_REVIEW_INCOMPLETE");
    }
    const previewEvidence = [...new Set(input.previewEvidence.map((evidence) => evidence.trim()).filter(Boolean))];
    if (previewEvidence.length === 0) throw new DomainError("审片必须附至少一条真实预览证据", "PREVIEW_EVIDENCE_REQUIRED");
    const findings = input.findings.map((finding) => {
      if (!passes.includes(finding.pass)) throw new DomainError("审片问题引用了未执行的审片轮次", "EDITORIAL_REVIEW_PASS_MISSING");
      const summary = finding.summary.trim();
      const evidence = finding.evidence.trim();
      const impact = finding.impact.trim();
      if (!summary || !evidence || !impact) throw new DomainError("审片问题必须说明现象、证据和影响", "INVALID_EDITORIAL_FINDING");
      if (finding.frameRange && (finding.frameRange.startFrame < 0 || finding.frameRange.endFrame <= finding.frameRange.startFrame)) {
        throw new DomainError("审片问题的帧范围无效", "INVALID_EDITORIAL_FRAME_RANGE");
      }
      return {
        id: createId("editorial_finding"),
        pass: finding.pass,
        severity: finding.severity,
        category: finding.category,
        summary,
        evidence,
        impact,
        suggestedFix: finding.suggestedFix?.trim() || undefined,
        verificationMethod: finding.verificationMethod?.trim() || undefined,
        objectId: finding.objectId,
        frameRange: finding.frameRange
      };
    });
    report.editorialReview = {
      revision: input.revision,
      passes,
      previewEvidence,
      findings,
      reviewedAt: now()
    };
    report.previewEvidence = [...new Set([...report.previewEvidence, ...previewEvidence])];
    report.qualityReview.push(`R${input.revision} 已完成四轮审片与模式专项复核。`);
    report.mcpCommands.push({ name: "record_editorial_quality_review", revision: input.revision, createdAt: now() });
    await this.writeSkillExecutionReport(report);
    return report;
  }

  /**
   * Presenter 正式生产只能在真实结构、预览、合成帧和完整审片都已归属同一 Revision 时收口。
   * 未满足时保留 incomplete 状态，调用方可以继续补证据而不会丢失本次导演判断。
   */
  async completeProductionRun(input: { projectId: Id; runId: Id; finalRevision?: number; qualityReview?: string[]; previewEvidence?: string[] }): Promise<SkillExecutionReport> {
    const report = await this.readSkillExecutionReport({ projectId: input.projectId, runId: input.runId });
    this.resumeIncompleteProductionRun(report, "收口");
    const current = this.readProject(input.projectId);
    const finalRevision = input.finalRevision ?? current.revision.number;
    const target = this.repository.getRevision(input.projectId, finalRevision);
    if (input.previewEvidence) report.previewEvidence.push(...input.previewEvidence.map((value) => value.trim()).filter(Boolean));
    if (input.qualityReview) report.qualityReview.push(...input.qualityReview.map((value) => value.trim()).filter(Boolean));

    const blockers: string[] = [];
    if (finalRevision !== current.revision.number) blockers.push(`正式 ProductionRun 必须收口当前 Revision（当前 R${current.revision.number}，请求 R${finalRevision}）。`);
    const decisionCategories = new Set(report.creativeDecisions.map((decision) => decision.category));
    for (const category of ["semantic", "story", "visual"] as const) {
      if (!decisionCategories.has(category)) blockers.push(`缺少 ${category === "semantic" ? "语义" : category === "story" ? "故事" : "视觉处理"}决策记录。`);
    }
    if (!(await this.hasSucceededPreviewForRevision(input.projectId, finalRevision))) blockers.push(`R${finalRevision} 没有成功且文件仍可读的局部 Preview Job。`);
    const composedFrameEvidence = await this.findComposedFrameEvidence(input.projectId, finalRevision);
    const composedFramePaths = composedFrameEvidence.map((artifact) => artifact.relativePath);
    report.composedFrameEvidence = composedFramePaths;
    if (composedFrameEvidence.length === 0) blockers.push(`R${finalRevision} 没有 inspect_composed_frames 生成的合成帧证据。`);
    for (const cue of target.snapshot.effectCues.filter((candidate) => candidate.status === "ready")) {
      if (!composedFrameEvidence.some((artifact) => artifact.frame >= cue.startFrame && artifact.frame < cue.endFrame)) {
        blockers.push(`效果 ${cue.id} 没有任何对应的真实合成帧证据，不能确认进入、位置或遮挡。`);
      }
    }
    if (!report.editorialReview || report.editorialReview.revision !== finalRevision) {
      blockers.push(`R${finalRevision} 缺少当前 ProductionRun 的完整 Editorial Review。`);
    } else {
      // 审片必须指向 inspect_composed_frames 的实际文件，不能用“已看过”之类的自由文本替代。
      if (!report.editorialReview.previewEvidence.some((evidence) => composedFramePaths.includes(evidence))) {
        blockers.push(`R${finalRevision} 的 Editorial Review 没有引用本次真实合成帧证据。`);
      }
      if (report.editorialReview.findings.some((finding) => finding.severity === "inconclusive")) {
        blockers.push(`R${finalRevision} 仍有未决的审片结论，不能标记为 completed。`);
      }
    }

    const quality = evaluateQuality(target.snapshot, finalRevision, report.editorialReview);
    blockers.push(...quality.issues.filter((entry) => entry.level === "blocking").map((entry) => `质量门禁：${entry.message}`));
    report.finalRevision = finalRevision;
    report.mcpCommands.push({ name: "complete_production_run", revision: finalRevision, createdAt: now() });
    report.completionBlockers = [...new Set(blockers)];
    if (report.completionBlockers.length > 0) {
      report.status = "incomplete";
      report.completedAt = undefined;
      await this.writeSkillExecutionReport(report);
      return report;
    }
    report.status = "completed";
    report.completedAt = now();
    report.completionBlockers = [];
    await this.writeSkillExecutionReport(report);
    return report;
  }

  registerImportedAsset(input: {
    projectId: Id;
    baseRevision: number;
    name: string;
    kind: Asset["kind"];
    managedPath: string;
    originalPath?: string;
    sourceHash?: string;
    role?: Asset["role"];
    provenance?: Asset["provenance"];
    tags?: string[];
  }): { state: ProjectState; asset: Asset; job: JobRecord } {
    let asset!: Asset;
    const state = this.repository.commit(input.projectId, input.baseRevision, `导入素材：${input.name}`, (snapshot, impact) => {
      if (input.provenance) assertAssetProvenanceValid(input.provenance);
      asset = createMediaAsset(input);
      snapshot.assets.push(asset);
      impact.changed.push(asset.id);
      impact.recomputed.push("素材分析");
    });
    const job = this.repository.createJob({
      projectId: input.projectId,
      kind: "media_analysis",
      payload: { assetId: asset.id },
      idempotencyKey: `media_analysis:${asset.id}`
    });
    this.publish({ projectId: input.projectId, revision: state.revision.number, type: "revision" });
    this.publish({ projectId: input.projectId, revision: state.revision.number, type: "job" });
    return { state, asset, job };
  }

  /**
   * 角色、标签和来源由导入后的编辑判断补充。素材仍需经过媒体分析才可进入正式 Timeline，
   * 但不能因此丢失它来自哪里、可否使用的事实。
   */
  updateAssetEditorialMetadata(input: {
    projectId: Id;
    baseRevision: number;
    assetId: Id;
    role?: Asset["role"];
    tags?: string[];
    provenance?: Asset["provenance"];
  }): ProjectState {
    if (input.role === undefined && input.tags === undefined && input.provenance === undefined) {
      throw new DomainError("至少提供一种素材角色、标签或来源信息", "EMPTY_ASSET_METADATA_UPDATE");
    }
    const state = this.repository.commit(input.projectId, input.baseRevision, "更新素材来源与叙事角色", (snapshot, impact) => {
      const asset = assetById(snapshot, input.assetId);
      if (input.role !== undefined) asset.role = input.role;
      if (input.tags !== undefined) asset.tags = [...new Set(input.tags.map((tag) => tag.trim()).filter(Boolean))];
      if (input.provenance !== undefined) {
        assertAssetProvenanceValid(input.provenance);
        asset.provenance = input.provenance;
      }
      impact.changed.push(asset.id);
      impact.recomputed.push("素材角色、来源与授权状态");
      if (asset.provenance?.source === "provider" && asset.provenance.rightsStatus === "unknown") {
        impact.warnings.push(`外部素材“${asset.name}”尚未确认版权，不能作为正式交付素材。`);
      }
    });
    this.publish({ projectId: input.projectId, revision: state.revision.number, type: "revision" });
    return state;
  }

  /**
   * 素材需求只描述缺什么和为什么缺，不把候选 URL 或最终 Scene 使用方式写进需求。
   * 这样搜索、下载和 Cutaway 决策仍能分别审查。
   */
  manageAssetRequirement(input: {
    projectId: Id;
    baseRevision: number;
    action: "create" | "update" | "close";
    assetRequestId?: Id;
    title?: string;
    purpose?: string;
    visualBrief?: string;
    role?: Asset["role"];
    queryHints?: string[];
    excludedTerms?: string[];
    targetAspectRatio?: AssetRequest["targetAspectRatio"];
    minDurationMs?: number;
    rightsRequirement?: AssetRightsRequirement;
    fallbackPlan?: AssetRequest["fallbackPlan"];
    closeReason?: string;
  }): ProjectState {
    if (input.action !== "create" && !input.assetRequestId) {
      throw new DomainError("更新或关闭素材需求时必须提供 assetRequestId", "ASSET_REQUEST_ID_REQUIRED");
    }
    if (input.action === "create") {
      if (!input.title?.trim() || !input.purpose?.trim() || !input.visualBrief?.trim()) {
        throw new DomainError("创建素材需求必须说明标题、叙事用途和具体画面", "ASSET_REQUEST_CONTENT_REQUIRED");
      }
      if (input.minDurationMs !== undefined && (!Number.isFinite(input.minDurationMs) || input.minDurationMs <= 0)) {
        throw new DomainError("素材最小时长必须是正数", "INVALID_ASSET_REQUEST_DURATION");
      }
    }
    const state = this.repository.commit(input.projectId, input.baseRevision, input.action === "create" ? "创建素材需求" : input.action === "close" ? "关闭素材需求" : "更新素材需求", (snapshot, impact) => {
      const updatedAt = now();
      let request: AssetRequest;
      if (input.action === "create") {
        request = {
          id: createId("asset_request"),
          title: input.title!.trim(),
          purpose: input.purpose!.trim(),
          visualBrief: input.visualBrief!.trim(),
          role: input.role ?? "b_roll",
          queryHints: normalizedTextList(input.queryHints),
          excludedTerms: normalizedTextList(input.excludedTerms),
          targetAspectRatio: input.targetAspectRatio ?? snapshot.project.brief.aspectRatio,
          minDurationMs: input.minDurationMs,
          rightsRequirement: input.rightsRequirement ?? "cleared_or_attribution",
          fallbackPlan: input.fallbackPlan ?? "keep_presenter",
          status: "open",
          createdAt: updatedAt,
          updatedAt
        };
        snapshot.assetRequests.push(request);
      } else {
        request = assetRequestById(snapshot, input.assetRequestId!);
        if (input.action === "close") {
          request.status = "closed";
          request.closeReason = input.closeReason?.trim() || "当前需求不再需要外部素材。";
          request.updatedAt = updatedAt;
        } else {
          if (request.status === "closed") throw new DomainError("已关闭的素材需求不能直接更新，请新建需求", "ASSET_REQUEST_CLOSED");
          if (input.title !== undefined) {
            const title = input.title.trim();
            if (!title) throw new DomainError("素材需求标题不能为空", "INVALID_ASSET_REQUEST_TITLE");
            request.title = title;
          }
          if (input.purpose !== undefined) {
            const purpose = input.purpose.trim();
            if (!purpose) throw new DomainError("素材需求用途不能为空", "INVALID_ASSET_REQUEST_PURPOSE");
            request.purpose = purpose;
          }
          if (input.visualBrief !== undefined) {
            const visualBrief = input.visualBrief.trim();
            if (!visualBrief) throw new DomainError("素材需求必须保留具体画面说明", "INVALID_ASSET_REQUEST_VISUAL_BRIEF");
            request.visualBrief = visualBrief;
          }
          if (input.role !== undefined) request.role = input.role;
          if (input.queryHints !== undefined) request.queryHints = normalizedTextList(input.queryHints);
          if (input.excludedTerms !== undefined) request.excludedTerms = normalizedTextList(input.excludedTerms);
          if (input.targetAspectRatio !== undefined) request.targetAspectRatio = input.targetAspectRatio;
          if (input.minDurationMs !== undefined) {
            if (!Number.isFinite(input.minDurationMs) || input.minDurationMs <= 0) throw new DomainError("素材最小时长必须是正数", "INVALID_ASSET_REQUEST_DURATION");
            request.minDurationMs = input.minDurationMs;
          }
          if (input.rightsRequirement !== undefined) request.rightsRequirement = input.rightsRequirement;
          if (input.fallbackPlan !== undefined) request.fallbackPlan = input.fallbackPlan;
          request.updatedAt = updatedAt;
          const searchCriteriaChanged = input.purpose !== undefined
            || input.visualBrief !== undefined
            || input.queryHints !== undefined
            || input.excludedTerms !== undefined
            || input.targetAspectRatio !== undefined
            || input.minDurationMs !== undefined
            || input.rightsRequirement !== undefined;
          if (searchCriteriaChanged) {
            const hasDownloadInFlight = snapshot.assetCandidates.some((candidate) => candidate.assetRequestId === request.id && (candidate.status === "acquisition_queued" || candidate.status === "acquiring"));
            if (hasDownloadInFlight) throw new DomainError("已有候选正在下载，不能同时修改它的搜索条件", "ASSET_REQUEST_ACQUISITION_IN_PROGRESS");
            // 保留历史记录，但旧候选必须经新的 SearchIntent 再次检查，不能继续自动入库。
            for (const candidate of snapshot.assetCandidates.filter((entry) => entry.assetRequestId === request.id && entry.status === "available")) {
              candidate.status = "rejected";
              candidate.rejectionReason = "素材需求已更新，必须重新搜索并复核候选。";
              candidate.filterReasons = [...candidate.filterReasons, candidate.rejectionReason];
              candidate.updatedAt = updatedAt;
            }
            request.status = "open";
          }
        }
      }
      impact.changed.push(request.id);
      impact.recomputed.push("素材需求与搜索范围");
    });
    this.publish({ projectId: input.projectId, revision: state.revision.number, type: "revision" });
    return state;
  }

  /** 将 Provider 的结果写入同一 Revision；同一需求、Provider 和查询会复用已保存候选。 */
  recordAssetSearch(input: {
    projectId: Id;
    baseRevision: number;
    assetRequestId: Id;
    provider: string;
    query: string;
    candidates: AssetSearchCandidateInput[];
  }): { state: ProjectState; intent: SearchIntent; candidates: AssetCandidate[]; reused: boolean } {
    const current = this.readProject(input.projectId);
    if (current.revision.number !== input.baseRevision) throw new RevisionConflictError(input.baseRevision, current.revision.number);
    const query = input.query.trim();
    if (!query) throw new DomainError("搜索查询不能为空", "EMPTY_ASSET_SEARCH_QUERY");
    const currentRequest = assetRequestById(current.snapshot, input.assetRequestId);
    if (currentRequest.status === "closed") throw new DomainError("素材需求已关闭，不能继续搜索", "ASSET_REQUEST_CLOSED");
    const existingIntent = current.snapshot.searchIntents.find((intent) => intent.assetRequestId === input.assetRequestId && intent.provider === input.provider && intent.query === query);
    if (existingIntent && currentRequest.status !== "open") {
      return {
        state: current,
        intent: existingIntent,
        candidates: current.snapshot.assetCandidates.filter((candidate) => candidate.searchIntentId === existingIntent.id),
        reused: true
      };
    }

    let intent!: SearchIntent;
    let recordedCandidates: AssetCandidate[] = [];
    const state = this.repository.commit(input.projectId, input.baseRevision, `搜索素材候选：${input.provider}`, (snapshot, impact) => {
      const request = assetRequestById(snapshot, input.assetRequestId);
      if (request.status === "closed") throw new DomainError("素材需求已关闭，不能继续搜索", "ASSET_REQUEST_CLOSED");
      const createdAt = now();
      intent = { id: createId("search_intent"), assetRequestId: request.id, provider: input.provider, query, createdAt };
      snapshot.searchIntents.push(intent);
      recordedCandidates = input.candidates.map((source) => {
        const duplicate = snapshot.assetCandidates.find((candidate) => candidate.assetRequestId === request.id && candidate.provider === input.provider && candidate.originalAssetId === source.originalAssetId);
        const filterReasons = candidateFilterReasons(source, request);
        const hardFilterPassed = filterReasons.length === 0;
        if (duplicate) {
          // 同一远端内容不再复制一条 Candidate；条件变化后的再次搜索会刷新它的审查结果。
          if (duplicate.status !== "acquired" && duplicate.status !== "acquisition_queued" && duplicate.status !== "acquiring") {
            duplicate.searchIntentId = intent.id;
            duplicate.name = source.name.trim() || "未命名候选素材";
            duplicate.sourceUrl = source.sourceUrl.trim();
            duplicate.previewUrl = source.previewUrl?.trim() || undefined;
            duplicate.width = source.width;
            duplicate.height = source.height;
            duplicate.durationMs = source.durationMs;
            duplicate.creator = source.creator?.trim() || undefined;
            duplicate.license = source.license?.trim() || undefined;
            duplicate.attributionText = source.attributionText?.trim() || undefined;
            duplicate.rightsStatus = source.rightsStatus;
            duplicate.tags = normalizedTextList(source.tags);
            duplicate.hardFilterPassed = hardFilterPassed;
            duplicate.filterReasons = filterReasons;
            duplicate.status = hardFilterPassed ? "available" : "rejected";
            duplicate.rejectionReason = hardFilterPassed ? undefined : filterReasons.join(" ");
            duplicate.acquisitionError = undefined;
            duplicate.updatedAt = createdAt;
          }
          return duplicate;
        }
        const candidate: AssetCandidate = {
          id: createId("asset_candidate"),
          assetRequestId: request.id,
          searchIntentId: intent.id,
          provider: input.provider,
          originalAssetId: source.originalAssetId.trim(),
          name: source.name.trim() || "未命名候选素材",
          kind: "video",
          sourceUrl: source.sourceUrl.trim(),
          previewUrl: source.previewUrl?.trim() || undefined,
          width: source.width,
          height: source.height,
          durationMs: source.durationMs,
          creator: source.creator?.trim() || undefined,
          license: source.license?.trim() || undefined,
          attributionText: source.attributionText?.trim() || undefined,
          rightsStatus: source.rightsStatus,
          tags: normalizedTextList(source.tags),
          hardFilterPassed,
          filterReasons,
          status: hardFilterPassed ? "available" : "rejected",
          rejectionReason: hardFilterPassed ? undefined : filterReasons.join(" "),
          createdAt,
          updatedAt: createdAt
        };
        snapshot.assetCandidates.push(candidate);
        return candidate;
      });
      const hasEligibleCandidate = snapshot.assetCandidates.some((candidate) => candidate.assetRequestId === request.id && candidate.status === "available");
      request.status = hasEligibleCandidate ? "candidates_ready" : "open";
      request.updatedAt = createdAt;
      impact.changed.push(request.id, intent.id, ...recordedCandidates.map((candidate) => candidate.id));
      impact.recomputed.push("素材候选、技术过滤与来源检查");
      if (!hasEligibleCandidate) impact.warnings.push(`素材需求“${request.title}”没有满足时长和授权条件的候选。`);
    });
    this.publish({ projectId: input.projectId, revision: state.revision.number, type: "revision" });
    return { state, intent, candidates: recordedCandidates, reused: false };
  }

  readAssetCandidate(input: { projectId: Id; assetCandidateId: Id }): { revision: number; request: AssetRequest; intent: SearchIntent; candidate: AssetCandidate } {
    const state = this.readProject(input.projectId);
    const candidate = assetCandidateById(state.snapshot, input.assetCandidateId);
    const request = assetRequestById(state.snapshot, candidate.assetRequestId);
    const intent = state.snapshot.searchIntents.find((entry) => entry.id === candidate.searchIntentId);
    if (!intent) throw new DomainError("素材候选缺少搜索意图", "ASSET_CANDIDATE_INTENT_MISSING");
    return { revision: state.revision.number, request, intent, candidate };
  }

  /** Candidate 只有经过硬过滤且授权允许时才能进入下载队列。 */
  acquireAssetCandidate(input: { projectId: Id; baseRevision: number; assetCandidateId: Id; idempotencyKey?: string }): { state: ProjectState; candidate: AssetCandidate; job: JobRecord } {
    let candidateId!: Id;
    const state = this.repository.commit(input.projectId, input.baseRevision, "提交素材本地化任务", (snapshot, impact) => {
      const candidate = assetCandidateById(snapshot, input.assetCandidateId);
      const request = assetRequestById(snapshot, candidate.assetRequestId);
      if (candidate.status !== "available") throw new DomainError("只有可用候选才能提交本地化任务", "ASSET_CANDIDATE_NOT_AVAILABLE");
      if (!candidateIsAllowed(candidate, request)) {
        throw new DomainError("候选素材没有通过授权或技术过滤，不能下载", "ASSET_CANDIDATE_NOT_ALLOWED");
      }
      candidate.status = "acquisition_queued";
      candidate.acquisitionError = undefined;
      candidate.updatedAt = now();
      request.status = "acquiring";
      request.updatedAt = candidate.updatedAt;
      candidateId = candidate.id;
      impact.changed.push(candidate.id, request.id);
      impact.recomputed.push("素材本地化任务");
    });
    const job = this.repository.createJob({
      projectId: input.projectId,
      kind: "asset_acquisition",
      payload: { assetCandidateId: candidateId },
      idempotencyKey: input.idempotencyKey ?? `asset_acquisition:${candidateId}:${input.baseRevision}`
    });
    this.publish({ projectId: input.projectId, revision: state.revision.number, type: "revision" });
    this.publish({ projectId: input.projectId, revision: state.revision.number, type: "job" });
    return { state, candidate: assetCandidateById(state.snapshot, candidateId), job };
  }

  markAssetCandidateAcquiring(input: { projectId: Id; assetCandidateId: Id }): ProjectState {
    const current = this.readProject(input.projectId);
    const candidate = assetCandidateById(current.snapshot, input.assetCandidateId);
    if (candidate.status === "acquiring") return current;
    if (candidate.status !== "acquisition_queued") throw new DomainError("素材候选当前不在下载队列中", "ASSET_CANDIDATE_NOT_QUEUED");
    const state = this.repository.commit(input.projectId, current.revision.number, "开始素材本地化", (snapshot, impact) => {
      const target = assetCandidateById(snapshot, input.assetCandidateId);
      target.status = "acquiring";
      target.updatedAt = now();
      impact.changed.push(target.id);
    });
    this.publish({ projectId: input.projectId, revision: state.revision.number, type: "revision" });
    return state;
  }

  /** 下载文件已在受管临时目录校验完成后，才在这里注册正式 Asset 并触发媒体分析。 */
  completeAssetAcquisition(input: {
    projectId: Id;
    assetCandidateId: Id;
    name: string;
    managedPath: string;
    sourceHash: string;
  }): { state: ProjectState; candidate: AssetCandidate; asset: Asset; duplicate: boolean; mediaAnalysisJob?: JobRecord } {
    const current = this.readProject(input.projectId);
    let asset!: Asset;
    let duplicate = false;
    const state = this.repository.commit(input.projectId, current.revision.number, "完成素材本地化并登记来源", (snapshot, impact) => {
      const candidate = assetCandidateById(snapshot, input.assetCandidateId);
      const request = assetRequestById(snapshot, candidate.assetRequestId);
      if (candidate.status !== "acquiring" && candidate.status !== "acquisition_queued") {
        throw new DomainError("素材候选当前不允许完成本地化", "ASSET_CANDIDATE_NOT_ACQUIRING");
      }
      if (!candidateIsAllowed(candidate, request)) {
        throw new DomainError("候选素材授权状态已不满足需求，不能登记为项目素材", "ASSET_CANDIDATE_NOT_ALLOWED");
      }
      const acquiredAt = now();
      const existing = snapshot.assets.find((entry) => entry.sourceHash === input.sourceHash);
      if (existing) {
        asset = existing;
        duplicate = true;
      } else {
        const provenance: Asset["provenance"] = {
          source: "provider",
          provider: candidate.provider,
          sourceUrl: candidate.sourceUrl,
          originalAssetId: candidate.originalAssetId,
          creator: candidate.creator,
          license: candidate.license,
          attributionText: candidate.attributionText,
          rightsStatus: candidate.rightsStatus,
          acquiredAt
        };
        assertAssetProvenanceValid(provenance);
        asset = createMediaAsset({
          name: input.name,
          kind: "video",
          managedPath: input.managedPath,
          sourceHash: input.sourceHash,
          role: request.role,
          tags: [...candidate.tags, ...request.queryHints],
          provenance
        });
        snapshot.assets.push(asset);
        impact.recomputed.push("素材分析");
      }
      candidate.status = "acquired";
      candidate.acquiredAssetId = asset.id;
      candidate.acquisitionError = undefined;
      candidate.updatedAt = acquiredAt;
      request.status = "fulfilled";
      request.updatedAt = acquiredAt;
      impact.changed.push(candidate.id, request.id, asset.id);
      impact.recomputed.push("素材来源、授权状态与本地 Asset");
      if (asset.provenance?.rightsStatus === "attribution_required") {
        impact.warnings.push(`素材“${asset.name}”要求署名，正式交付前必须生成署名清单。`);
      }
    });
    const mediaAnalysisJob = duplicate ? undefined : this.repository.createJob({
      projectId: input.projectId,
      kind: "media_analysis",
      payload: { assetId: asset.id },
      idempotencyKey: `media_analysis:${asset.id}`
    });
    this.publish({ projectId: input.projectId, revision: state.revision.number, type: "revision" });
    if (mediaAnalysisJob) this.publish({ projectId: input.projectId, revision: state.revision.number, type: "job" });
    return { state, candidate: assetCandidateById(state.snapshot, input.assetCandidateId), asset, duplicate, mediaAnalysisJob };
  }

  failAssetCandidateAcquisition(input: { projectId: Id; assetCandidateId: Id; reason: string }): ProjectState {
    const current = this.readProject(input.projectId);
    const state = this.repository.commit(input.projectId, current.revision.number, "素材本地化失败", (snapshot, impact) => {
      const candidate = assetCandidateById(snapshot, input.assetCandidateId);
      const request = assetRequestById(snapshot, candidate.assetRequestId);
      candidate.status = "failed";
      candidate.acquisitionError = input.reason;
      candidate.updatedAt = now();
      const hasPending = snapshot.assetCandidates.some((entry) => entry.assetRequestId === request.id && (entry.status === "acquisition_queued" || entry.status === "acquiring"));
      const hasAlternative = snapshot.assetCandidates.some((entry) => entry.assetRequestId === request.id && entry.status === "available");
      request.status = hasPending ? "acquiring" : hasAlternative ? "candidates_ready" : "open";
      request.updatedAt = candidate.updatedAt;
      impact.changed.push(candidate.id, request.id);
      impact.warnings.push(`素材候选“${candidate.name}”本地化失败：${input.reason}`);
    });
    this.publish({ projectId: input.projectId, revision: state.revision.number, type: "revision" });
    return state;
  }

  readAssetProvenance(input: { projectId: Id; assetId: Id }): { revision: number; asset: Asset; provenance?: Asset["provenance"]; candidate?: AssetCandidate } {
    const state = this.readProject(input.projectId);
    const asset = assetById(state.snapshot, input.assetId);
    return {
      revision: state.revision.number,
      asset,
      provenance: asset.provenance,
      candidate: state.snapshot.assetCandidates.find((candidate) => candidate.acquiredAssetId === asset.id)
    };
  }

  applyMediaAnalysis(input: { projectId: Id; assetId: Id; metadata: MediaMetadata }): ProjectState {
    const current = this.readProject(input.projectId);
    const state = this.repository.commit(input.projectId, current.revision.number, "完成媒体分析", (snapshot, impact) => {
      const asset = assetById(snapshot, input.assetId);
      asset.status = "ready";
      asset.metadata = input.metadata;
      asset.failureReason = undefined;
      impact.changed.push(asset.id);
      impact.recomputed.push("素材元数据、缩略图与代理证据");
    });
    this.publish({ projectId: input.projectId, revision: state.revision.number, type: "revision" });
    return state;
  }

  failAssetAnalysis(input: { projectId: Id; assetId: Id; reason: string }): ProjectState {
    const current = this.readProject(input.projectId);
    const state = this.repository.commit(input.projectId, current.revision.number, "媒体分析失败", (snapshot, impact) => {
      const asset = assetById(snapshot, input.assetId);
      asset.status = "failed";
      asset.failureReason = input.reason;
      impact.changed.push(asset.id);
      impact.warnings.push(`素材 ${asset.name} 分析失败：${input.reason}`);
    });
    this.publish({ projectId: input.projectId, revision: state.revision.number, type: "revision" });
    return state;
  }

  markAssetAnalyzing(input: { projectId: Id; assetId: Id }): ProjectState {
    const current = this.readProject(input.projectId);
    const asset = assetById(current.snapshot, input.assetId);
    if (asset.status === "analyzing") return current;
    const state = this.repository.commit(input.projectId, current.revision.number, "开始媒体分析", (snapshot, impact) => {
      const target = assetById(snapshot, input.assetId);
      target.status = "analyzing";
      impact.changed.push(target.id);
    });
    this.publish({ projectId: input.projectId, revision: state.revision.number, type: "revision" });
    return state;
  }

  submitTranscription(input: { projectId: Id; assetId: Id; idempotencyKey?: string }): JobRecord {
    const state = this.readProject(input.projectId);
    const asset = assetById(state.snapshot, input.assetId);
    if (asset.status !== "ready") throw new DomainError("素材尚未就绪，不能提交转写", "ASSET_NOT_READY");
    if (!asset.metadata?.hasAudio) throw new DomainError("该素材没有音频，这是成功分析结果，不能转写", "NO_AUDIO");
    const job = this.repository.createJob({
      projectId: input.projectId,
      kind: "transcription",
      payload: { assetId: input.assetId },
      idempotencyKey: input.idempotencyKey ?? `transcription:${input.assetId}:${state.revision.number}`
    });
    this.publish({ projectId: input.projectId, revision: state.revision.number, type: "job" });
    return job;
  }

  applyTranscript(input: { projectId: Id; baseRevision?: number; assetId: Id; text: string; bridgeRunId?: string; schemaVersion?: string; bridgeAudit?: BridgeRunAudit; source?: "funasr" | "manual" }): ProjectState {
    const current = this.readProject(input.projectId);
    const state = this.repository.commit(input.projectId, input.baseRevision ?? current.revision.number, "写入转写候选", (snapshot, impact) => {
      assetById(snapshot, input.assetId);
      const oldTranscriptIds = new Set(snapshot.transcripts.filter((transcript) => transcript.assetId === input.assetId).map((transcript) => transcript.id));
      snapshot.transcripts = snapshot.transcripts.filter((transcript) => transcript.assetId !== input.assetId);
      snapshot.transcriptSentenceCandidates = snapshot.transcriptSentenceCandidates.filter((candidate) => !oldTranscriptIds.has(candidate.transcriptId));
      snapshot.semanticUnits = snapshot.semanticUnits.filter((unit) => !oldTranscriptIds.has(unit.transcriptId));
      const transcript = {
        id: createId("transcript"),
        assetId: input.assetId,
        text: input.text.trim(),
        source: input.source ?? "funasr",
        bridgeRunId: input.bridgeRunId,
        schemaVersion: input.schemaVersion,
        bridgeAudit: input.bridgeAudit,
        createdAt: now()
      } as const;
      snapshot.transcripts.push(transcript);
      snapshot.transcriptSentenceCandidates.push(...createTranscriptSentenceCandidates(transcript.id, input.assetId, transcript.text));
      // 已失效语义单元不能继续被 Story 误引用；Skill 会在候选基础上重新给出完整判断。
      const activeSemanticUnitIds = new Set(snapshot.semanticUnits.map((unit) => unit.id));
      for (const beat of snapshot.story.beats) {
        beat.semanticUnitIds = beat.semanticUnitIds.filter((id) => activeSemanticUnitIds.has(id));
      }
      this.reconcileScript(snapshot, impact);
      impact.changed.push(transcript.id);
      impact.recomputed.push("TranscriptSentenceCandidate、等待 SemanticUnit 判断、Script、SpeechSegment");
    });
    this.publish({ projectId: input.projectId, revision: state.revision.number, type: "revision" });
    return state;
  }

  private reconcileScript(snapshot: ProjectSnapshot, impact: ImpactReport): void {
    // Script 改动会使旧旁白与字幕失效；同时移除 Dialogue 上的系统 SpeechAsset，
    // 防止观众继续听到已经不属于当前 Script 的旧语音。
    const dialogueTrack = snapshot.timeline.tracks.find((track) => track.name === "Dialogue");
    const obsoleteSpeechAssetIds = new Set([
      snapshot.speechAsset?.assetId,
      ...snapshot.speechSegmentAssets.map((segmentAsset) => segmentAsset.assetId)
    ].filter((assetId): assetId is string => Boolean(assetId)));
    if (dialogueTrack && obsoleteSpeechAssetIds.size > 0) {
      const removed = snapshot.timeline.items.filter((item) => item.trackId === dialogueTrack.id && obsoleteSpeechAssetIds.has(item.assetId));
      snapshot.timeline.items = snapshot.timeline.items.filter((item) => !removed.includes(item));
      if (removed.length > 0) {
        impact.changed.push(...removed.map((item) => item.id));
        impact.recomputed.push("移除失效 Dialogue 旁白");
      }
    }
    const oldSegments = snapshot.speechSegments;
    const oldByIdentity = new Map(oldSegments.map((segment) => [`${segment.semanticUnitIds.join("|")}::${segment.text}`, segment]));
    const compiled = compileSpeechSegments(snapshot.semanticUnits).map((segment) => {
      const old = oldByIdentity.get(`${segment.semanticUnitIds.join("|")}::${segment.text}`);
      // 同一句的音频可复用；但停顿来自最新语义判断，必须覆盖旧的节奏参数。
      return old ? { ...segment, id: old.id, status: old.status } : segment;
    });
    const currentIds = new Set(compiled.map((segment) => segment.id));
    for (const oldSegment of oldSegments) {
      if (!currentIds.has(oldSegment.id)) {
        impact.stale.push(oldSegment.id);
      }
    }
    snapshot.speechSegments = compiled;
    snapshot.script = {
      semanticUnitIds: snapshot.semanticUnits.filter((unit) => unit.status === "included").sort((left, right) => left.order - right.order).map((unit) => unit.id),
      speechSegmentIds: compiled.map((segment) => segment.id),
      revision: snapshot.script.revision + 1
    };
    snapshot.speechSegmentAssets = snapshot.speechSegmentAssets.filter((segmentAsset) => currentIds.has(segmentAsset.speechSegmentId));
    snapshot.speechAsset = undefined;
    if (snapshot.timeline.captions.length > 0) {
      // 不能静默沿用旧语音的 Card；下一次 SpeechAsset 组装会以最新段级时序重建字幕。
      impact.stale.push(...snapshot.timeline.captions.map((caption) => caption.id));
      impact.recomputed.push("失效 Caption Program");
    }
    snapshot.timeline.captions = [];
    for (const performance of snapshot.actorPerformances) {
      if (performance.source === "generated" && performance.scriptRevision !== snapshot.script.revision) {
        performance.status = "stale";
        impact.stale.push(performance.id);
      }
    }
    for (const cue of snapshot.effectCues) {
      const semanticAnchorTarget = cue.semanticAnchor?.type === "speech_segment" ? cue.semanticAnchor.targetId : undefined;
      if ((cue.anchorTargetId && !currentIds.has(cue.anchorTargetId)) || (semanticAnchorTarget && !currentIds.has(semanticAnchorTarget))) {
        cue.status = "stale";
        impact.stale.push(cue.id);
      }
    }
    // 音乐长度、Duck 与音效事件都依赖主声音；Script 变化后不能悄悄沿用旧包装。
    this.staleAudioCuesForMainline(snapshot, impact, "Script 或主声音结构已变化");
  }

  /**
   * 将标点候选升级为经 semantic-continuity 审阅的 SemanticUnit。
   * 这一步才允许生成 Script / SpeechSegment，避免把标点边界误称为语义边界。
   */
  applySemanticUnits(input: {
    projectId: Id;
    baseRevision: number;
    units: Array<{
      candidateIds: Id[];
      text: string;
      kind: SemanticUnitKind;
      dependencies?: Id[];
      precedingContext?: string;
      followingContext?: string;
      retakeGroupId?: Id;
      confidence?: number;
      pauseBefore?: { durationMs: number; reason: "sentence" | "contrast" | "emotion" | "breath" | "chapter" };
    }>;
  }): ProjectState {
    const state = this.repository.commit(input.projectId, input.baseRevision, "应用语义单元判断", (snapshot, impact) => {
      const candidatesById = new Map(snapshot.transcriptSentenceCandidates.map((candidate) => [candidate.id, candidate]));
      const oldByIdentity = new Map(snapshot.semanticUnits.map((unit) => [`${unit.candidateIds.join("|")}::${unit.text}`, unit]));
      const nextUnits = input.units.map((draft, order) => {
        if (draft.candidateIds.length === 0) throw new DomainError("SemanticUnit 必须包含转写候选", "SEMANTIC_CANDIDATE_REQUIRED");
        const candidates = draft.candidateIds.map((candidateId) => {
          const candidate = candidatesById.get(candidateId);
          if (!candidate) throw new DomainError(`转写候选不存在：${candidateId}`, "SENTENCE_CANDIDATE_NOT_FOUND");
          return candidate;
        });
        const transcriptId = candidates[0]!.transcriptId;
        const sourceAssetId = candidates[0]!.sourceAssetId;
        if (candidates.some((candidate) => candidate.transcriptId !== transcriptId || candidate.sourceAssetId !== sourceAssetId)) {
          throw new DomainError("一个 SemanticUnit 只能组合来自同一转写素材的候选", "SEMANTIC_CANDIDATE_SOURCE_MISMATCH");
        }
        const unit = createSemanticUnit({
          transcriptId,
          sourceAssetId,
          candidateIds: draft.candidateIds,
          text: draft.text,
          order,
          kind: draft.kind,
          dependencies: draft.dependencies,
          precedingContext: draft.precedingContext,
          followingContext: draft.followingContext,
          retakeGroupId: draft.retakeGroupId,
          confidence: draft.confidence,
          pauseBefore: draft.pauseBefore
        });
        const old = oldByIdentity.get(`${unit.candidateIds.join("|")}::${unit.text}`);
        return old ? { ...unit, id: old.id, status: old.status } : unit;
      });
      const nextIds = new Set(nextUnits.map((unit) => unit.id));
      const oldIds = new Set(snapshot.semanticUnits.map((unit) => unit.id));
      snapshot.semanticUnits = nextUnits;
      for (const beat of snapshot.story.beats) {
        beat.semanticUnitIds = beat.semanticUnitIds.filter((id) => nextIds.has(id));
      }
      for (const oldId of oldIds) if (!nextIds.has(oldId)) impact.stale.push(oldId);
      impact.changed.push(...nextUnits.map((unit) => unit.id));
      this.reconcileScript(snapshot, impact);
      impact.recomputed.push("SemanticUnit、Script、SpeechSegment、语义锚点");
    });
    this.publish({ projectId: input.projectId, revision: state.revision.number, type: "revision" });
    return state;
  }

  applyScript(input: { projectId: Id; baseRevision: number; semanticUnitIds: Id[] }): ProjectState {
    const state = this.repository.commit(input.projectId, input.baseRevision, "更新最终 Script", (snapshot, impact) => {
      const wanted = new Set(input.semanticUnitIds);
      for (const unit of snapshot.semanticUnits) unit.status = wanted.has(unit.id) ? "included" : "deleted";
      input.semanticUnitIds.forEach((unitId, index) => {
        const unit = snapshot.semanticUnits.find((candidate) => candidate.id === unitId);
        if (!unit) throw new DomainError(`Script 包含未知语义单元：${unitId}`, "SEMANTIC_UNIT_NOT_FOUND");
        unit.order = index;
        impact.changed.push(unit.id);
      });
      this.reconcileScript(snapshot, impact);
      impact.recomputed.push("SpeechSegment、字幕、Cue 依赖关系");
      impact.warnings.push("没有词级时间时，字幕和动效只能使用段级边界。");
    });
    this.publish({ projectId: input.projectId, revision: state.revision.number, type: "revision" });
    return state;
  }

  /** 主线变化时先停止旧声音包装，避免旧 SFX 落在新语义上或 BGM 沿用过期 Duck。 */
  private markAudioCueStale(snapshot: ProjectSnapshot, cue: AudioCue, impact: ImpactReport, reason: string): void {
    const item = snapshot.timeline.items.find((candidate) => candidate.id === cue.timelineItemId);
    if (cue.status !== "stale") {
      cue.status = "stale";
      cue.updatedAt = now();
      impact.changed.push(cue.id);
    }
    if (item && !item.disabled) {
      item.disabled = true;
      impact.changed.push(item.id);
      impact.dirtyRanges.push({ startFrame: item.startFrame, endFrame: item.endFrame, reason: "声音包装等待主线复核" });
    }
    impact.stale.push(cue.id);
    impact.warnings.push(`${cue.kind === "bgm" ? "BGM" : "SFX"}「${cue.purpose}」${reason}，已停止参与合成，等待重新确认。`);
  }

  private staleAudioCuesForMainline(snapshot: ProjectSnapshot, impact: ImpactReport, reason: string): void {
    for (const cue of snapshot.audioCues ?? []) {
      this.markAudioCueStale(snapshot, cue, impact, reason);
    }
  }

  /** stale Cutaway 不再参与真实合成，但会保留在当前 Revision 供主工作流复核和替换。 */
  private markCutawayStale(snapshot: ProjectSnapshot, cutaway: Cutaway, impact: ImpactReport, reason: string): void {
    const scene = snapshot.scenes.find((candidate) => candidate.id === cutaway.cutawaySceneId);
    const item = snapshot.timeline.items.find((candidate) => candidate.id === cutaway.timelineItemId);
    if (cutaway.status !== "stale") {
      cutaway.status = "stale";
      cutaway.updatedAt = now();
      impact.changed.push(cutaway.id);
    }
    if (scene && scene.status !== "stale") {
      scene.status = "stale";
      impact.changed.push(scene.id);
    }
    if (item && !item.disabled) {
      item.disabled = true;
      impact.changed.push(item.id);
    }
    impact.stale.push(cutaway.id);
    impact.warnings.push(`Cutaway「${cutaway.purpose}」${reason}，已停止参与合成，等待重新确认。`);
  }

  /** Presenter 主线重新编译会移除旧 Scene；相关 Cutaway 不能遗留悬空引用。 */
  private removeCutawaysForHostScenes(snapshot: ProjectSnapshot, hostSceneIds: Set<Id>, impact: ImpactReport): void {
    const removed = snapshot.cutaways.filter((cutaway) => hostSceneIds.has(cutaway.hostSceneId));
    if (removed.length === 0) return;
    const cutawayIds = new Set(removed.map((cutaway) => cutaway.id));
    const sceneIds = new Set(removed.map((cutaway) => cutaway.cutawaySceneId));
    const itemIds = new Set(removed.map((cutaway) => cutaway.timelineItemId));
    const cueIds = snapshot.effectCues.filter((cue) => sceneIds.has(cue.sceneId)).map((cue) => cue.id);

    snapshot.cutaways = snapshot.cutaways.filter((cutaway) => !cutawayIds.has(cutaway.id));
    snapshot.timeline.items = snapshot.timeline.items.filter((item) => !itemIds.has(item.id));
    snapshot.effectCues = snapshot.effectCues.filter((cue) => !sceneIds.has(cue.sceneId));
    snapshot.scenes = snapshot.scenes.filter((scene) => !sceneIds.has(scene.id));
    for (const beat of snapshot.story.beats) {
      beat.sceneIds = beat.sceneIds.filter((sceneId) => !sceneIds.has(sceneId));
    }

    const removedTreatmentIds = new Set<Id>();
    for (const treatment of snapshot.visualTreatments) {
      if (!treatment.sceneId || !sceneIds.has(treatment.sceneId)) continue;
      if (treatment.narrativeBeatId) {
        treatment.sceneId = undefined;
        treatment.status = "stale";
        treatment.updatedAt = now();
        impact.changed.push(treatment.id);
        impact.stale.push(treatment.id);
      } else {
        removedTreatmentIds.add(treatment.id);
      }
    }
    if (removedTreatmentIds.size > 0) {
      snapshot.visualTreatments = snapshot.visualTreatments.filter((treatment) => !removedTreatmentIds.has(treatment.id));
    }
    impact.stale.push(...removed.map((cutaway) => cutaway.id), ...sceneIds, ...itemIds, ...cueIds, ...removedTreatmentIds);
    impact.recomputed.push("移除失效 Cutaway、CutawayScene 与顶层素材 Item");
  }

  /** 主场景仍存在时，不猜测旧 B-roll 是否仍相关；先标 stale 再交回 Cutaway 规划复核。 */
  private staleCutawaysForHostScenes(snapshot: ProjectSnapshot, hostSceneIds: Set<Id>, impact: ImpactReport, reason: string): void {
    for (const cutaway of snapshot.cutaways.filter((candidate) => hostSceneIds.has(candidate.hostSceneId))) {
      this.markCutawayStale(snapshot, cutaway, impact, reason);
    }
  }

  private resolveCutawayPlan(snapshot: ProjectSnapshot, input: {
    hostSceneId: Id;
    assetId: Id;
    visualTreatmentId?: Id;
    mode: CutawayMode;
    fit: CutawayFit;
    pipAnchor?: SpatialAnchor;
    pipScale?: number;
    sourceStartFrame: number;
    sourceEndFrame: number;
    startFrame: number;
    endFrame: number;
  }): { hostScene: ProjectSnapshot["scenes"][number]; asset: Asset } {
    const hostScene = snapshot.scenes.find((scene) => scene.id === input.hostSceneId);
    if (!hostScene) throw new DomainError("Cutaway 主场景不存在", "CUTAWAY_HOST_SCENE_NOT_FOUND");
    if (hostScene.type === "CutawayScene") throw new DomainError("Cutaway 不能以 CutawayScene 作为主场景", "INVALID_CUTAWAY_HOST");
    const asset = assetById(snapshot, input.assetId);
    if (asset.status !== "ready" || !asset.metadata?.videoCodec || !asset.managedPath.trim()) {
      throw new DomainError("Cutaway 只能使用已就绪且已本地化的视频素材", "CUTAWAY_ASSET_NOT_READY");
    }
    if (!Number.isInteger(input.startFrame) || !Number.isInteger(input.endFrame) || input.startFrame < hostScene.startFrame || input.endFrame > hostScene.endFrame || input.endFrame <= input.startFrame) {
      throw new DomainError("Cutaway 的目标范围必须完整位于主场景内", "CUTAWAY_OUT_OF_HOST_SCENE");
    }
    const sourceDuration = input.sourceEndFrame - input.sourceStartFrame;
    const targetDuration = input.endFrame - input.startFrame;
    const assetDuration = millisecondsToFrames(asset.metadata.durationMs, snapshot.timeline.fps);
    if (!Number.isInteger(input.sourceStartFrame) || !Number.isInteger(input.sourceEndFrame) || input.sourceStartFrame < 0 || input.sourceEndFrame > assetDuration || sourceDuration < targetDuration) {
      throw new DomainError("Cutaway 源范围无效或不足以覆盖目标播放时长", "INVALID_CUTAWAY_SOURCE_RANGE");
    }
    if (input.mode === "pip" && (!input.pipAnchor || input.pipAnchor === "full_frame")) {
      throw new DomainError("PiP Cutaway 必须指定非全屏安全区锚点", "PIP_ANCHOR_REQUIRED");
    }
    if (input.pipScale !== undefined && (input.pipScale < 0.2 || input.pipScale > 0.6)) {
      throw new DomainError("PiP 缩放必须在 0.2 到 0.6 之间", "INVALID_PIP_SCALE");
    }
    if (input.visualTreatmentId) {
      const treatment = visualTreatmentById(snapshot, input.visualTreatmentId);
      if (treatment.status !== "ready") throw new DomainError("关联的 VisualTreatment 已失效，请先重新确认视觉计划", "VISUAL_TREATMENT_STALE");
      if (treatment.sceneId && treatment.sceneId !== hostScene.id) {
        throw new DomainError("VisualTreatment 必须属于当前 Cutaway 的主场景", "VISUAL_TREATMENT_SCENE_MISMATCH");
      }
    }
    return { hostScene, asset };
  }

  /** 清理 Presenter Scene、反向 Story 引用和依附其上的 Cue，但保留物理 A-roll。 */
  private clearPresenterScenes(snapshot: ProjectSnapshot, impact: ImpactReport): void {
    const removedSceneIds = new Set(snapshot.scenes.filter((scene) => scene.type === "PresenterScene").map((scene) => scene.id));
    this.removeCutawaysForHostScenes(snapshot, removedSceneIds, impact);
    const removedTreatmentIds = new Set<Id>();
    for (const treatment of snapshot.visualTreatments) {
      if (!treatment.sceneId || !removedSceneIds.has(treatment.sceneId)) continue;
      if (treatment.narrativeBeatId) {
        treatment.sceneId = undefined;
        treatment.status = "stale";
        treatment.updatedAt = now();
        impact.changed.push(treatment.id);
        impact.stale.push(treatment.id);
      } else {
        removedTreatmentIds.add(treatment.id);
      }
    }
    if (removedTreatmentIds.size > 0) {
      snapshot.visualTreatments = snapshot.visualTreatments.filter((treatment) => !removedTreatmentIds.has(treatment.id));
      impact.stale.push(...removedTreatmentIds);
    }
    const removedCueIds = snapshot.effectCues.filter((cue) => removedSceneIds.has(cue.sceneId)).map((cue) => cue.id);
    snapshot.effectCues = snapshot.effectCues.filter((cue) => !removedSceneIds.has(cue.sceneId));
    snapshot.scenes = snapshot.scenes.filter((scene) => scene.type !== "PresenterScene");
    for (const item of snapshot.timeline.items) {
      if (item.sceneId && removedSceneIds.has(item.sceneId)) item.sceneId = undefined;
    }
    for (const beat of snapshot.story.beats) {
      beat.sceneIds = beat.sceneIds.filter((sceneId) => !removedSceneIds.has(sceneId));
    }
    impact.stale.push(...removedCueIds);
  }

  /** 清理重建会失效的 Presenter 对象，连同反向 Story 引用和 Cue 一起处理。 */
  private clearPresenterStructure(snapshot: ProjectSnapshot, impact: ImpactReport): void {
    const track = trackByName(snapshot, "Actor / A-roll");
    const removedActorItemIds = new Set(snapshot.timeline.items.filter((item) => item.trackId === track.id).map((item) => item.id));
    for (const performance of snapshot.actorPerformances) {
      if (removedActorItemIds.has(performance.timelineItemId)) impact.stale.push(performance.id);
    }
    snapshot.actorPerformances = snapshot.actorPerformances.filter((performance) => !removedActorItemIds.has(performance.timelineItemId));
    this.clearPresenterScenes(snapshot, impact);
    snapshot.timeline.items = snapshot.timeline.items.filter((item) => item.trackId !== track.id);
  }

  /** 物理素材组装：只按明确选择的 A-roll 拼接，不生成任何叙事 Scene。 */
  private assemblePresenterTrackInSnapshot(snapshot: ProjectSnapshot, impact: ImpactReport, assetIds: Id[]): TimelineItem[] {
    const track = trackByName(snapshot, "Actor / A-roll");
    const selected = assetIds.map((assetId) => assetById(snapshot, assetId));
    if (selected.length === 0) throw new DomainError("至少需要一条明确选择的 A-roll 素材", "EMPTY_TIMELINE");
    if (selected.some((asset) => asset.status !== "ready" || !asset.metadata?.videoCodec)) {
      throw new DomainError("Presenter 主线只能使用已就绪的视频素材", "ASSET_NOT_READY");
    }
    this.clearPresenterStructure(snapshot, impact);
    let cursor = 0;
    const items: TimelineItem[] = [];
    for (const asset of selected) {
      const duration = millisecondsToFrames(asset.metadata!.durationMs, snapshot.timeline.fps);
      if (duration <= 0) throw new DomainError(`A-roll 素材时长无效：${asset.name}`, "INVALID_ITEM_RANGE");
      // 这是调用方的显式选择，才将素材标为 A-roll；不会扫描所有视频自动加入。
      asset.role = "a_roll";
      const item = createTimelineItem({
        trackId: track.id,
        assetId: asset.id,
        startFrame: cursor,
        endFrame: cursor + duration,
        sourceStartFrame: 0,
        sourceEndFrame: duration,
        gainDb: 0
      });
      snapshot.timeline.items.push(item);
      items.push(item);
      impact.changed.push(item.id, asset.id);
      cursor = item.endFrame;
    }
    impact.recomputed.push("A-roll 物理拼接、主轨时长");
    impact.dirtyRanges.push({ startFrame: 0, endFrame: cursor, reason: "重建 Presenter A-roll 主线" });
    return items;
  }

  /**
   * 叙事 Scene 编译：必须由调用方提供目的与 Beat 关系，禁止按素材数量或固定 N 条视频猜测。
   */
  private compilePresenterScenesInSnapshot(snapshot: ProjectSnapshot, impact: ImpactReport, input: {
    scenes: Array<{ title: string; purpose: string; startFrame: number; endFrame: number; narrativeBeatIds?: Id[]; stylePackId?: string }>;
  }): void {
    const track = trackByName(snapshot, "Actor / A-roll");
    const actorItems = snapshot.timeline.items.filter((item) => item.trackId === track.id && !item.disabled).sort((left, right) => left.startFrame - right.startFrame);
    if (actorItems.length === 0) throw new DomainError("请先组装明确的 Presenter A-roll 主线", "MISSING_PRIMARY_VIDEO");
    const storyBeatIds = new Set(snapshot.story.beats.map((beat) => beat.id));
    const plans = [...input.scenes].sort((left, right) => left.startFrame - right.startFrame);
    if (plans.length === 0) throw new DomainError("至少需要一个叙事 Scene 计划", "EMPTY_SCENE_PLAN");
    for (let index = 0; index < plans.length; index += 1) {
      const plan = plans[index]!;
      if (!plan.title.trim() || !plan.purpose.trim() || plan.startFrame < 0 || plan.endFrame <= plan.startFrame) {
        throw new DomainError("Presenter Scene 计划缺少有效标题、目的或时间范围", "INVALID_SCENE_PLAN");
      }
      if (index > 0 && plans[index - 1]!.endFrame > plan.startFrame) throw new DomainError("Presenter Scene 计划不能重叠", "SCENE_OVERLAP");
      for (const beatId of plan.narrativeBeatIds ?? []) if (!storyBeatIds.has(beatId)) throw new DomainError(`Scene 引用了未知 Story Beat：${beatId}`, "STORY_BEAT_NOT_FOUND");
    }
    const coveredItemIds = new Set<Id>();
    for (const plan of plans) {
      const items = actorItems.filter((item) => item.startFrame >= plan.startFrame && item.endFrame <= plan.endFrame);
      if (items.length === 0) throw new DomainError("每个 Presenter Scene 必须覆盖至少一个完整 A-roll Item", "SCENE_ITEM_REQUIRED");
      for (const item of items) {
        if (coveredItemIds.has(item.id)) throw new DomainError("同一 A-roll Item 不能属于多个 Presenter Scene", "ITEM_MULTI_SCENE");
        coveredItemIds.add(item.id);
      }
      const scene = createScene({
        type: "PresenterScene",
        title: plan.title,
        purpose: plan.purpose,
        startFrame: plan.startFrame,
        endFrame: plan.endFrame,
        assetIds: [...new Set(items.map((item) => item.assetId))]
      });
      scene.narrativeBeatIds = [...(plan.narrativeBeatIds ?? [])];
      scene.stylePackId = plan.stylePackId?.trim() || snapshot.project.stylePackId;
      snapshot.scenes.push(scene);
      for (const item of items) item.sceneId = scene.id;
      for (const beatId of scene.narrativeBeatIds) {
        const beat = snapshot.story.beats.find((candidate) => candidate.id === beatId)!;
        beat.sceneIds = [...new Set([...beat.sceneIds, scene.id])];
        impact.changed.push(beat.id);
      }
      impact.changed.push(scene.id, ...items.map((item) => item.id));
    }
    if (coveredItemIds.size !== actorItems.length) {
      throw new DomainError("Presenter Scene 计划必须覆盖全部 A-roll Item；未覆盖片段不能偷偷归入场景", "SCENE_COVERAGE_INCOMPLETE");
    }
    impact.recomputed.push("Story Beat、PresenterScene、Scene Strip");
  }

  /** 对外的物理组装入口，供导演层在确定 A-roll 后调用。 */
  assemblePresenterTrack(input: { projectId: Id; baseRevision: number; assetIds: Id[] }): ProjectState {
    const state = this.repository.commit(input.projectId, input.baseRevision, "组装 Presenter A-roll 主线", (snapshot, impact) => {
      this.assemblePresenterTrackInSnapshot(snapshot, impact, input.assetIds);
      this.staleAudioCuesForMainline(snapshot, impact, "Presenter 主画面重新组装");
    });
    this.publish({ projectId: input.projectId, revision: state.revision.number, type: "revision" });
    return state;
  }

  /** 对外的叙事 Scene 编译入口，接受 Skill 已做出的 Story / Speech / VisualTreatment 判断。 */
  compilePresenterScenes(input: {
    projectId: Id;
    baseRevision: number;
    scenes: Array<{ title: string; purpose: string; startFrame: number; endFrame: number; narrativeBeatIds?: Id[]; stylePackId?: string }>;
  }): ProjectState {
    const state = this.repository.commit(input.projectId, input.baseRevision, "编译 Presenter 叙事场景", (snapshot, impact) => {
      // Scene 重新编译时，旧 Scene / Cue 必须成组失效，A-roll 物理拼接保持不动。
      this.clearPresenterScenes(snapshot, impact);
      this.compilePresenterScenesInSnapshot(snapshot, impact, { scenes: input.scenes });
      this.staleAudioCuesForMainline(snapshot, impact, "叙事 Scene 已重新编译");
    });
    this.publish({ projectId: input.projectId, revision: state.revision.number, type: "revision" });
    return state;
  }

  /**
   * 兼容旧客户端的单步入口。新 MCP/Web 不再调用它；它仍会明确标记为兼容路径，
   * 以防升级时把已有项目直接打断。
   */
  buildPresenterTimeline(input: { projectId: Id; baseRevision: number; assetIds: Id[]; sceneSize?: number }): ProjectState {
    const state = this.repository.commit(input.projectId, input.baseRevision, "兼容模式建立 Presenter 主时间线", (snapshot, impact) => {
      const items = this.assemblePresenterTrackInSnapshot(snapshot, impact, input.assetIds);
      const sceneSize = Math.max(1, input.sceneSize ?? 2);
      const plans = [] as Array<{ title: string; purpose: string; startFrame: number; endFrame: number }>;
      for (let start = 0; start < items.length; start += sceneSize) {
        const group = items.slice(start, start + sceneSize);
        plans.push({
          title: `兼容口播片段 ${Math.floor(start / sceneSize) + 1}`,
          purpose: "兼容旧客户端的临时主线分组；正式创作请使用 Story Beat 编译场景。",
          startFrame: group[0]!.startFrame,
          endFrame: group[group.length - 1]!.endFrame
        });
      }
      this.compilePresenterScenesInSnapshot(snapshot, impact, { scenes: plans });
      this.staleAudioCuesForMainline(snapshot, impact, "Presenter 主线与场景重新建立");
      impact.warnings.push("当前通过兼容入口按素材分组生成 Scene；正式创作请使用 assemblePresenterTrack + compilePresenterScenes。");
    });
    this.publish({ projectId: input.projectId, revision: state.revision.number, type: "revision" });
    return state;
  }

  /**
   * 将既有主画面 Item 明确登记为人物表演。Mask 只接受已就绪的本地透明图片；
   * 没有 Mask 时保留可播放的前景降级，而不伪造人物抠像。
   */
  registerActorPerformance(input: {
    projectId: Id;
    baseRevision: number;
    timelineItemId: Id;
    source: ActorPerformanceSource;
    maskMode: ActorMaskMode;
    audioMode?: ActorAudioMode;
    maskAssetId?: Id;
    speechAssetId?: Id;
    note?: string;
  }): ProjectState {
    const state = this.repository.commit(input.projectId, input.baseRevision, "登记人物表演", (snapshot, impact) => {
      const item = snapshot.timeline.items.find((candidate) => candidate.id === input.timelineItemId);
      if (!item) throw new DomainError("人物表演对应的 Timeline Item 不存在", "ACTOR_ITEM_NOT_FOUND");
      const track = snapshot.timeline.tracks.find((candidate) => candidate.id === item.trackId);
      if (track?.name !== "Actor / A-roll") throw new DomainError("人物表演必须绑定 Actor / A-roll 主画面 Item", "INVALID_ACTOR_TRACK");
      if (!item.sceneId) throw new DomainError("人物表演必须先归属一个 PresenterScene", "ACTOR_SCENE_REQUIRED");
      const actorAsset = assetById(snapshot, item.assetId);
      if (actorAsset.status !== "ready" || !actorAsset.metadata?.videoCodec) throw new DomainError("人物视频尚未就绪或不是有效视频", "ACTOR_ASSET_NOT_READY");

      if (input.maskMode === "alpha_asset") {
        if (!input.maskAssetId) throw new DomainError("alpha_asset 模式必须指定透明 Mask 素材", "MASK_REQUIRED");
        const mask = assetById(snapshot, input.maskAssetId);
        if (mask.status !== "ready" || !["image", "derived"].includes(mask.kind)) {
          throw new DomainError("Mask 必须是已就绪的图片或派生素材", "INVALID_MASK_ASSET");
        }
      } else if (input.maskAssetId) {
        throw new DomainError("仅 alpha_asset 模式允许指定独立 Mask 素材", "UNEXPECTED_MASK_ASSET");
      }

      let speechAssetId = input.speechAssetId;
      let scriptRevision: number | undefined;
      if (input.source === "generated") {
        const speech = snapshot.speechAsset;
        if (!speech || speech.status !== "ready") throw new DomainError("生成型人物表演必须绑定已就绪 SpeechAsset", "SPEECH_ASSET_REQUIRED");
        if (speechAssetId && speechAssetId !== speech.id) throw new DomainError("人物表演引用的 SpeechAsset 不是当前项目版本", "STALE_ACTOR_SPEECH");
        speechAssetId = speech.id;
        scriptRevision = speech.scriptRevision;
      }

      // 有已就绪 Dialogue 时默认由它承担旁白，避免旧工作流把人物原声与 OmniVoice 一起播放。
      const audioMode = input.audioMode ?? (snapshot.speechAsset?.status === "ready" ? "use_dialogue_track" : "use_source_audio");
      if (audioMode === "use_dialogue_track" && !snapshot.speechAsset) {
        impact.warnings.push("人物表演选择了 Dialogue 声音，但当前尚未组装 SpeechAsset；导出前需要补齐声音或改为原声。");
      }

      const existing = snapshot.actorPerformances.find((candidate) => candidate.timelineItemId === item.id);
      const performance = existing ?? createActorPerformance({
        timelineItemId: item.id,
        source: input.source,
        maskMode: input.maskMode,
        maskAssetId: input.maskAssetId,
        speechAssetId,
        scriptRevision,
        audioMode,
        note: input.note
      });
      if (existing) {
        existing.source = input.source;
        existing.maskMode = input.maskMode;
        existing.maskAssetId = input.maskAssetId;
        existing.speechAssetId = speechAssetId;
        existing.scriptRevision = scriptRevision;
        existing.audioMode = audioMode;
        existing.status = "ready";
        existing.note = input.note ?? existing.note;
      } else {
        snapshot.actorPerformances.push(performance);
      }
      actorAsset.kind = "actor_video";
      impact.changed.push(performance.id, actorAsset.id);
      impact.dirtyRanges.push({ startFrame: item.startFrame, endFrame: item.endFrame, reason: "人物表演或 Mask 更新" });
      if (input.maskMode === "none") impact.warnings.push("人物表演未提供 Mask，后景效果会降级为前景显示，需在预览中复核。");
    });
    this.publish({ projectId: input.projectId, revision: state.revision.number, type: "revision" });
    return state;
  }

  createScene(input: { projectId: Id; baseRevision: number; type: SceneType; title: string; purpose: string; startFrame: number; endFrame: number; assetIds?: Id[] }): ProjectState {
    const state = this.repository.commit(input.projectId, input.baseRevision, `创建场景：${input.title}`, (snapshot, impact) => {
      const scene = createScene(input);
      scene.assetIds.forEach((assetId) => assetById(snapshot, assetId));
      snapshot.scenes.push(scene);
      impact.changed.push(scene.id);
      impact.dirtyRanges.push({ startFrame: scene.startFrame, endFrame: scene.endFrame, reason: "新增场景" });
    });
    this.publish({ projectId: input.projectId, revision: state.revision.number, type: "revision" });
    return state;
  }

  /**
   * 保存主线稳定后做出的视觉选择。它不直接生成卡片或 B-roll，避免导演意图和物理播放重复存储。
   */
  manageVisualTreatment(input: {
    projectId: Id;
    baseRevision: number;
    action: "upsert" | "remove";
    visualTreatmentId?: Id;
    narrativeBeatId?: Id;
    sceneId?: Id;
    mode?: VisualTreatmentMode;
    primaryAttention?: string;
    narrativePurpose?: string;
    intensity?: VisualTreatmentIntensity;
    quietReason?: string;
    fallbackPlan?: string;
  }): ProjectState {
    const state = this.repository.commit(input.projectId, input.baseRevision, input.action === "remove" ? "移除视觉处理计划" : "更新视觉处理计划", (snapshot, impact) => {
      if (input.action === "remove") {
        const treatment = visualTreatmentById(snapshot, requireText(input.visualTreatmentId, "VisualTreatment ID"));
        snapshot.visualTreatments = snapshot.visualTreatments.filter((candidate) => candidate.id !== treatment.id);
        for (const cutaway of snapshot.cutaways.filter((candidate) => candidate.visualTreatmentId === treatment.id)) {
          cutaway.visualTreatmentId = undefined;
          this.markCutawayStale(snapshot, cutaway, impact, "失去了原有 VisualTreatment 依据");
        }
        impact.changed.push(treatment.id);
        impact.stale.push(treatment.id);
        return;
      }

      const mode = input.mode;
      const intensity = input.intensity;
      if (!mode || !intensity) throw new DomainError("VisualTreatment 必须指定处理模式和注意力强度", "VISUAL_TREATMENT_REQUIRED");
      if (!input.narrativeBeatId && !input.sceneId) {
        throw new DomainError("VisualTreatment 至少需要关联一个 Story Beat 或 Scene", "VISUAL_TREATMENT_TARGET_REQUIRED");
      }
      if (input.narrativeBeatId && !snapshot.story.beats.some((beat) => beat.id === input.narrativeBeatId)) {
        throw new DomainError("VisualTreatment 引用的 Story Beat 不存在", "VISUAL_TREATMENT_BEAT_NOT_FOUND");
      }
      if (input.sceneId && !snapshot.scenes.some((scene) => scene.id === input.sceneId)) {
        throw new DomainError("VisualTreatment 引用的 Scene 不存在", "VISUAL_TREATMENT_SCENE_NOT_FOUND");
      }

      const existing = input.visualTreatmentId ? visualTreatmentById(snapshot, input.visualTreatmentId) : undefined;
      const primaryAttention = requireText(input.primaryAttention, "第一注意目标");
      const narrativePurpose = requireText(input.narrativePurpose, "视觉叙事目的");
      if (existing) {
        existing.narrativeBeatId = input.narrativeBeatId;
        existing.sceneId = input.sceneId;
        existing.mode = mode;
        existing.primaryAttention = primaryAttention;
        existing.narrativePurpose = narrativePurpose;
        existing.intensity = intensity;
        existing.quietReason = input.quietReason?.trim() || undefined;
        existing.fallbackPlan = input.fallbackPlan?.trim() || undefined;
        existing.status = "ready";
        existing.updatedAt = now();
        impact.changed.push(existing.id);
      } else {
        const treatment = createVisualTreatment({
          narrativeBeatId: input.narrativeBeatId,
          sceneId: input.sceneId,
          mode,
          primaryAttention,
          narrativePurpose,
          intensity,
          quietReason: input.quietReason?.trim() || undefined,
          fallbackPlan: input.fallbackPlan?.trim() || undefined
        });
        snapshot.visualTreatments.push(treatment);
        impact.changed.push(treatment.id);
      }
    });
    this.publish({ projectId: input.projectId, revision: state.revision.number, type: "revision" });
    return state;
  }

  /**
   * 创建、调整或移除 Cutaway。每次写入同时维护 CutawayScene 和顶层 Timeline Item，
   * 从而让 Renderer 只消费同一 Revision 的本地 Asset。
   */
  manageCutaway(input: {
    projectId: Id;
    baseRevision: number;
    action: "create" | "update" | "remove";
    cutawayId?: Id;
    hostSceneId?: Id;
    assetId?: Id;
    visualTreatmentId?: Id;
    title?: string;
    mode?: CutawayMode;
    fit?: CutawayFit;
    pipAnchor?: SpatialAnchor;
    pipScale?: number;
    audioMode?: CutawayAudioMode;
    purpose?: string;
    audienceTask?: string;
    sourceStartFrame?: number;
    sourceEndFrame?: number;
    startFrame?: number;
    endFrame?: number;
  }): ProjectState {
    const state = this.repository.commit(input.projectId, input.baseRevision, input.action === "create" ? "创建 Cutaway" : input.action === "update" ? "调整 Cutaway" : "移除 Cutaway", (snapshot, impact) => {
      if (input.action === "remove") {
        const cutaway = cutawayById(snapshot, requireText(input.cutawayId, "Cutaway ID"));
        const sceneIds = new Set([cutaway.cutawaySceneId]);
        const cueIds = snapshot.effectCues.filter((cue) => sceneIds.has(cue.sceneId)).map((cue) => cue.id);
        snapshot.cutaways = snapshot.cutaways.filter((candidate) => candidate.id !== cutaway.id);
        snapshot.timeline.items = snapshot.timeline.items.filter((item) => item.id !== cutaway.timelineItemId);
        snapshot.effectCues = snapshot.effectCues.filter((cue) => !sceneIds.has(cue.sceneId));
        snapshot.scenes = snapshot.scenes.filter((scene) => !sceneIds.has(scene.id));
        for (const beat of snapshot.story.beats) {
          beat.sceneIds = beat.sceneIds.filter((sceneId) => !sceneIds.has(sceneId));
        }
        const removedTreatmentIds = new Set<Id>();
        for (const treatment of snapshot.visualTreatments) {
          if (treatment.sceneId !== cutaway.cutawaySceneId) continue;
          if (treatment.narrativeBeatId) {
            treatment.sceneId = undefined;
            treatment.status = "stale";
            treatment.updatedAt = now();
            impact.changed.push(treatment.id);
            impact.stale.push(treatment.id);
          } else {
            removedTreatmentIds.add(treatment.id);
          }
        }
        if (removedTreatmentIds.size > 0) {
          snapshot.visualTreatments = snapshot.visualTreatments.filter((treatment) => !removedTreatmentIds.has(treatment.id));
          impact.stale.push(...removedTreatmentIds);
        }
        impact.changed.push(cutaway.id, cutaway.timelineItemId, cutaway.cutawaySceneId);
        impact.stale.push(...cueIds);
        impact.dirtyRanges.push({ startFrame: cutaway.startFrame, endFrame: cutaway.endFrame, reason: "移除 Cutaway" });
        return;
      }

      const topTrack = trackByName(snapshot, "Cutaway / Fullscreen");
      if (topTrack.locked) throw new DomainError("Cutaway / Fullscreen 轨已锁定", "TRACK_LOCKED");

      if (input.action === "create") {
        const hostSceneId = requireText(input.hostSceneId, "Cutaway 主场景 ID");
        const assetId = requireText(input.assetId, "Cutaway 素材 ID");
        const mode = input.mode;
        const fit = input.fit;
        const audioMode = input.audioMode;
        if (!mode || !fit || !audioMode || input.sourceStartFrame === undefined || input.sourceEndFrame === undefined || input.startFrame === undefined || input.endFrame === undefined) {
          throw new DomainError("创建 Cutaway 必须提供模式、适配方式、声音策略及完整源/目标范围", "CUTAWAY_FIELDS_REQUIRED");
        }
        const purpose = requireText(input.purpose, "Cutaway 叙事目的");
        const audienceTask = requireText(input.audienceTask, "Cutaway 观众任务");
        const plan = this.resolveCutawayPlan(snapshot, {
          hostSceneId,
          assetId,
          visualTreatmentId: input.visualTreatmentId,
          mode,
          fit,
          pipAnchor: input.pipAnchor,
          pipScale: input.pipScale,
          sourceStartFrame: input.sourceStartFrame,
          sourceEndFrame: input.sourceEndFrame,
          startFrame: input.startFrame,
          endFrame: input.endFrame
        });
        const cutawayScene = createScene({
          type: "CutawayScene",
          title: input.title?.trim() || `Cutaway：${plan.asset.name}`,
          purpose,
          startFrame: input.startFrame,
          endFrame: input.endFrame,
          assetIds: [plan.asset.id]
        });
        cutawayScene.status = "ready";
        cutawayScene.stylePackId = plan.hostScene.stylePackId;
        const item = createTimelineItem({
          trackId: topTrack.id,
          sceneId: cutawayScene.id,
          assetId: plan.asset.id,
          startFrame: input.startFrame,
          endFrame: input.endFrame,
          sourceStartFrame: input.sourceStartFrame,
          sourceEndFrame: input.sourceEndFrame,
          gainDb: 0
        });
        const cutaway = createCutaway({
          hostSceneId,
          cutawaySceneId: cutawayScene.id,
          timelineItemId: item.id,
          assetId: plan.asset.id,
          visualTreatmentId: input.visualTreatmentId,
          mode,
          fit,
          pipAnchor: mode === "pip" ? input.pipAnchor : undefined,
          pipScale: mode === "pip" ? input.pipScale : undefined,
          audioMode,
          purpose,
          audienceTask,
          sourceStartFrame: input.sourceStartFrame,
          sourceEndFrame: input.sourceEndFrame,
          startFrame: input.startFrame,
          endFrame: input.endFrame
        });
        snapshot.scenes.push(cutawayScene);
        snapshot.timeline.items.push(item);
        snapshot.cutaways.push(cutaway);
        impact.changed.push(cutaway.id, cutawayScene.id, item.id);
        impact.dirtyRanges.push({ startFrame: cutaway.startFrame, endFrame: cutaway.endFrame, reason: "新增 Cutaway" });
        return;
      }

      const cutaway = cutawayById(snapshot, requireText(input.cutawayId, "Cutaway ID"));
      if (input.assetId && input.assetId !== cutaway.assetId) {
        throw new DomainError("替换 Cutaway 素材请使用 replaceSceneAsset，避免漏改 Source Range", "USE_REPLACE_SCENE_ASSET");
      }
      const mode = input.mode ?? cutaway.mode;
      const plan = this.resolveCutawayPlan(snapshot, {
        hostSceneId: input.hostSceneId ?? cutaway.hostSceneId,
        assetId: cutaway.assetId,
        visualTreatmentId: input.visualTreatmentId ?? cutaway.visualTreatmentId,
        mode,
        fit: input.fit ?? cutaway.fit,
        pipAnchor: mode === "pip" ? input.pipAnchor ?? cutaway.pipAnchor : undefined,
        pipScale: mode === "pip" ? input.pipScale ?? cutaway.pipScale : undefined,
        sourceStartFrame: input.sourceStartFrame ?? cutaway.sourceStartFrame,
        sourceEndFrame: input.sourceEndFrame ?? cutaway.sourceEndFrame,
        startFrame: input.startFrame ?? cutaway.startFrame,
        endFrame: input.endFrame ?? cutaway.endFrame
      });
      const cutawayScene = snapshot.scenes.find((scene) => scene.id === cutaway.cutawaySceneId);
      const item = snapshot.timeline.items.find((candidate) => candidate.id === cutaway.timelineItemId);
      if (!cutawayScene || !item) throw new DomainError("Cutaway 缺少可编辑的 Scene 或 Timeline Item", "CUTAWAY_STRUCTURE_MISSING");
      const oldRange = { startFrame: cutaway.startFrame, endFrame: cutaway.endFrame };
      cutaway.hostSceneId = plan.hostScene.id;
      cutaway.visualTreatmentId = input.visualTreatmentId ?? cutaway.visualTreatmentId;
      cutaway.mode = mode;
      cutaway.fit = input.fit ?? cutaway.fit;
      cutaway.pipAnchor = mode === "pip" ? input.pipAnchor ?? cutaway.pipAnchor : undefined;
      cutaway.pipScale = mode === "pip" ? input.pipScale ?? cutaway.pipScale : undefined;
      cutaway.audioMode = input.audioMode ?? cutaway.audioMode;
      cutaway.purpose = input.purpose ? requireText(input.purpose, "Cutaway 叙事目的") : cutaway.purpose;
      cutaway.audienceTask = input.audienceTask ? requireText(input.audienceTask, "Cutaway 观众任务") : cutaway.audienceTask;
      cutaway.sourceStartFrame = input.sourceStartFrame ?? cutaway.sourceStartFrame;
      cutaway.sourceEndFrame = input.sourceEndFrame ?? cutaway.sourceEndFrame;
      cutaway.startFrame = input.startFrame ?? cutaway.startFrame;
      cutaway.endFrame = input.endFrame ?? cutaway.endFrame;
      cutaway.status = "ready";
      cutaway.updatedAt = now();
      cutawayScene.title = input.title?.trim() || cutawayScene.title;
      cutawayScene.purpose = cutaway.purpose;
      cutawayScene.startFrame = cutaway.startFrame;
      cutawayScene.endFrame = cutaway.endFrame;
      cutawayScene.assetIds = [cutaway.assetId];
      cutawayScene.status = "ready";
      item.startFrame = cutaway.startFrame;
      item.endFrame = cutaway.endFrame;
      item.sourceStartFrame = cutaway.sourceStartFrame;
      item.sourceEndFrame = cutaway.sourceEndFrame;
      item.disabled = false;
      impact.changed.push(cutaway.id, cutawayScene.id, item.id);
      impact.dirtyRanges.push({ startFrame: Math.min(oldRange.startFrame, cutaway.startFrame), endFrame: Math.max(oldRange.endFrame, cutaway.endFrame), reason: "调整 Cutaway" });
    });
    this.publish({ projectId: input.projectId, revision: state.revision.number, type: "revision" });
    return state;
  }

  /** 只替换某一个 Cutaway 的本地源素材和源范围，不触碰主场景或该场景中的 Cue。 */
  replaceSceneAsset(input: {
    projectId: Id;
    baseRevision: number;
    cutawayId: Id;
    assetId: Id;
    sourceStartFrame: number;
    sourceEndFrame: number;
  }): ProjectState {
    const state = this.repository.commit(input.projectId, input.baseRevision, "替换 Cutaway 素材", (snapshot, impact) => {
      const cutaway = cutawayById(snapshot, input.cutawayId);
      const item = snapshot.timeline.items.find((candidate) => candidate.id === cutaway.timelineItemId);
      const scene = snapshot.scenes.find((candidate) => candidate.id === cutaway.cutawaySceneId);
      if (!item || !scene) throw new DomainError("Cutaway 缺少可替换的 Scene 或 Timeline Item", "CUTAWAY_STRUCTURE_MISSING");
      const track = snapshot.timeline.tracks.find((candidate) => candidate.id === item.trackId);
      if (!track || track.locked) throw new DomainError("Cutaway 所在轨道不存在或已锁定", "TRACK_LOCKED");
      this.resolveCutawayPlan(snapshot, {
        hostSceneId: cutaway.hostSceneId,
        assetId: input.assetId,
        visualTreatmentId: cutaway.visualTreatmentId,
        mode: cutaway.mode,
        fit: cutaway.fit,
        pipAnchor: cutaway.pipAnchor,
        pipScale: cutaway.pipScale,
        sourceStartFrame: input.sourceStartFrame,
        sourceEndFrame: input.sourceEndFrame,
        startFrame: cutaway.startFrame,
        endFrame: cutaway.endFrame
      });
      cutaway.assetId = input.assetId;
      cutaway.sourceStartFrame = input.sourceStartFrame;
      cutaway.sourceEndFrame = input.sourceEndFrame;
      cutaway.status = "ready";
      cutaway.updatedAt = now();
      scene.assetIds = [input.assetId];
      scene.status = "ready";
      item.assetId = input.assetId;
      item.sourceStartFrame = input.sourceStartFrame;
      item.sourceEndFrame = input.sourceEndFrame;
      item.disabled = false;
      impact.changed.push(cutaway.id, scene.id, item.id);
      impact.dirtyRanges.push({ startFrame: cutaway.startFrame, endFrame: cutaway.endFrame, reason: "替换 Cutaway 素材" });
    });
    this.publish({ projectId: input.projectId, revision: state.revision.number, type: "revision" });
    return state;
  }

  createEffectCue(input: {
    projectId: Id;
    baseRevision: number;
    sceneId: Id;
    type: EffectType;
    layer: "rear" | "actor" | "front" | "fullscreen";
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
  }): ProjectState {
    const state = this.repository.commit(input.projectId, input.baseRevision, `添加视觉效果：${input.type}`, (snapshot, impact) => {
      const scene = snapshot.scenes.find((candidate) => candidate.id === input.sceneId);
      if (!scene) throw new DomainError("效果所属场景不存在", "SCENE_NOT_FOUND");
      if (input.startFrame < scene.startFrame || input.endFrame > scene.endFrame) {
        throw new DomainError("效果必须位于所属场景内", "CUE_OUT_OF_SCENE");
      }
      if (input.anchorTargetId && !snapshot.speechSegments.some((segment) => segment.id === input.anchorTargetId)) {
        throw new DomainError("效果锚点 SpeechSegment 不存在", "ANCHOR_NOT_FOUND");
      }
      const semanticAnchor = input.semanticAnchor;
      if (semanticAnchor?.type === "speech_segment" && semanticAnchor.targetId && !snapshot.speechSegments.some((segment) => segment.id === semanticAnchor.targetId)) {
        throw new DomainError("效果语义锚点 SpeechSegment 不存在", "ANCHOR_NOT_FOUND");
      }
      if (semanticAnchor?.type === "narrative_beat" && semanticAnchor.targetId && !snapshot.story.beats.some((beat) => beat.id === semanticAnchor.targetId)) {
        throw new DomainError("效果语义锚点 Story Beat 不存在", "ANCHOR_NOT_FOUND");
      }
      if (semanticAnchor?.type === "scene" && semanticAnchor.targetId && !snapshot.scenes.some((candidate) => candidate.id === semanticAnchor.targetId)) {
        throw new DomainError("效果语义锚点 Scene 不存在", "ANCHOR_NOT_FOUND");
      }
      for (const binding of input.assetBindings ?? []) {
        const asset = assetById(snapshot, binding.assetId);
        if (asset.status !== "ready") throw new DomainError(`效果素材尚未就绪：${asset.name}`, "EFFECT_ASSET_NOT_READY");
      }
      const cue = createEffectCue(input);
      snapshot.effectCues.push(cue);
      impact.changed.push(cue.id);
      impact.dirtyRanges.push({ startFrame: cue.startFrame, endFrame: cue.endFrame, reason: "新增视觉效果" });
    });
    this.publish({ projectId: input.projectId, revision: state.revision.number, type: "revision" });
    return state;
  }

  updateEffectCue(input: {
    projectId: Id;
    baseRevision: number;
    cueId: Id;
    startFrame?: number;
    endFrame?: number;
    intensity?: number;
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
  }): ProjectState {
    const state = this.repository.commit(input.projectId, input.baseRevision, "调整视觉效果", (snapshot, impact) => {
      const cue = snapshot.effectCues.find((candidate) => candidate.id === input.cueId);
      if (!cue) throw new DomainError("效果不存在", "CUE_NOT_FOUND");
      const scene = snapshot.scenes.find((candidate) => candidate.id === cue.sceneId);
      if (!scene) throw new DomainError("效果所属场景不存在", "SCENE_NOT_FOUND");
      cue.startFrame = input.startFrame ?? cue.startFrame;
      cue.endFrame = input.endFrame ?? cue.endFrame;
      cue.holdFrame = Math.max(cue.startFrame + 1, Math.floor((cue.startFrame + cue.endFrame) / 2));
      cue.intensity = input.intensity ?? cue.intensity;
      cue.note = input.note ?? cue.note;
      cue.narrativePurpose = input.narrativePurpose?.trim() || cue.narrativePurpose;
      cue.audienceTask = input.audienceTask?.trim() || cue.audienceTask;
      cue.spatialAnchor = input.spatialAnchor ?? cue.spatialAnchor;
      cue.props = input.props ?? cue.props;
      cue.stylePackId = input.stylePackId?.trim() || cue.stylePackId;
      cue.qualityRules = input.qualityRules ?? cue.qualityRules;
      if (input.semanticAnchor) {
        const anchor = input.semanticAnchor;
        if (anchor.type === "speech_segment" && anchor.targetId && !snapshot.speechSegments.some((segment) => segment.id === anchor.targetId)) {
          throw new DomainError("效果语义锚点 SpeechSegment 不存在", "ANCHOR_NOT_FOUND");
        }
        if (anchor.type === "narrative_beat" && anchor.targetId && !snapshot.story.beats.some((beat) => beat.id === anchor.targetId)) {
          throw new DomainError("效果语义锚点 Story Beat 不存在", "ANCHOR_NOT_FOUND");
        }
        if (anchor.type === "scene" && anchor.targetId && !snapshot.scenes.some((candidate) => candidate.id === anchor.targetId)) {
          throw new DomainError("效果语义锚点 Scene 不存在", "ANCHOR_NOT_FOUND");
        }
        cue.semanticAnchor = anchor;
      }
      if (input.assetBindings) {
        for (const binding of input.assetBindings) {
          const asset = assetById(snapshot, binding.assetId);
          if (asset.status !== "ready") throw new DomainError(`效果素材尚未就绪：${asset.name}`, "EFFECT_ASSET_NOT_READY");
        }
        cue.assetBindings = input.assetBindings;
      }
      if (input.motion) {
        cue.motion = {
          ...cue.motion,
          ...input.motion,
          enterFrames: Math.max(1, input.motion.enterFrames ?? cue.motion.enterFrames),
          holdFrames: Math.max(0, input.motion.holdFrames ?? cue.motion.holdFrames),
          exitFrames: Math.max(1, input.motion.exitFrames ?? cue.motion.exitFrames)
        };
      }
      if (cue.startFrame < scene.startFrame || cue.endFrame > scene.endFrame || cue.endFrame <= cue.startFrame) {
        throw new DomainError("调整后的效果范围无效", "INVALID_CUE_RANGE");
      }
      impact.changed.push(cue.id);
      impact.dirtyRanges.push({ startFrame: cue.startFrame, endFrame: cue.endFrame, reason: "调整视觉效果" });
    });
    this.publish({ projectId: input.projectId, revision: state.revision.number, type: "revision" });
    return state;
  }

  /**
   * Timeline 变化后优先按语义锚点重新定位 Cue；不能安全推导的位置明确标 stale，
   * 而不是保留一个看似有效、实际已经漂移的绝对帧范围。
   */
  private recompileCueFromAnchor(snapshot: ProjectSnapshot, cue: EffectCue, previousScene: { startFrame: number; endFrame: number }, scene: { startFrame: number; endFrame: number }, impact: ImpactReport): void {
    const oldStart = cue.startFrame;
    const oldEnd = cue.endFrame;
    const duration = oldEnd - oldStart;
    const fit = (startFrame: number, desiredDuration = duration) => {
      const start = Math.max(scene.startFrame, Math.min(startFrame, scene.endFrame - 1));
      const end = Math.min(scene.endFrame, start + Math.max(1, desiredDuration));
      if (end <= start) return undefined;
      return { start, end };
    };
    let next: { start: number; end: number } | undefined;
    const anchor = cue.semanticAnchor;
    if (anchor.type === "scene") {
      const relativeStart = oldStart - previousScene.startFrame;
      next = fit(scene.startFrame + relativeStart);
    } else if (anchor.type === "speech_segment" && anchor.targetId) {
      const timing = snapshot.speechAsset?.timing.segments.find((segment) => segment.speechSegmentId === anchor.targetId);
      if (timing) {
        if (anchor.relation === "anticipate") next = fit(timing.startFrame - duration);
        else if (anchor.relation === "react_after") next = fit(timing.endFrame);
        else if (anchor.relation === "hold_through") next = fit(timing.startFrame, timing.endFrame - timing.startFrame);
        else next = fit(timing.startFrame);
      }
    } else if (anchor.type === "narrative_beat" && anchor.targetId) {
      const beat = snapshot.story.beats.find((candidate) => candidate.id === anchor.targetId);
      const anchorScene = beat?.sceneIds.map((sceneId) => snapshot.scenes.find((candidate) => candidate.id === sceneId)).find((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate));
      if (anchorScene) next = fit(anchor.relation === "react_after" ? anchorScene.endFrame - duration : anchorScene.startFrame);
    } else if (anchor.type === "absolute") {
      next = oldStart >= scene.startFrame && oldEnd <= scene.endFrame ? { start: oldStart, end: oldEnd } : undefined;
    }
    if (!next) {
      cue.status = "stale";
      impact.stale.push(cue.id);
      impact.warnings.push(`效果 ${cue.type} 无法根据 ${anchor.type} 锚点安全重算，已标记为需复核。`);
      return;
    }
    cue.startFrame = next.start;
    cue.endFrame = next.end;
    cue.holdFrame = Math.max(cue.startFrame + 1, Math.floor((cue.startFrame + cue.endFrame) / 2));
    cue.status = "ready";
    if (cue.startFrame !== oldStart || cue.endFrame !== oldEnd) {
      impact.changed.push(cue.id);
      impact.dirtyRanges.push({ startFrame: Math.min(oldStart, cue.startFrame), endFrame: Math.max(oldEnd, cue.endFrame), reason: "按语义锚点重算 EffectCue" });
    }
  }

  /**
   * 手工移动顶层 Cutaway 时同步其导演记录；移动主场景时则不擅自猜测 B-roll 是否仍相关。
   */
  private reconcileCutawaysAfterTimelineMove(snapshot: ProjectSnapshot, affectedItemIds: Set<Id>, affectedSceneIds: Set<Id>, impact: ImpactReport): void {
    for (const cutaway of snapshot.cutaways) {
      const item = snapshot.timeline.items.find((candidate) => candidate.id === cutaway.timelineItemId);
      const cutawayScene = snapshot.scenes.find((candidate) => candidate.id === cutaway.cutawaySceneId);
      const hostScene = snapshot.scenes.find((candidate) => candidate.id === cutaway.hostSceneId);
      if (!item || !cutawayScene || !hostScene) continue;

      if (affectedItemIds.has(item.id)) {
        cutaway.startFrame = item.startFrame;
        cutaway.endFrame = item.endFrame;
        cutaway.sourceStartFrame = item.sourceStartFrame;
        cutaway.sourceEndFrame = item.sourceEndFrame;
        cutaway.updatedAt = now();
        if (item.startFrame < hostScene.startFrame || item.endFrame > hostScene.endFrame) {
          this.markCutawayStale(snapshot, cutaway, impact, "移动后已超出主场景范围");
        } else {
          cutaway.status = "ready";
          cutawayScene.status = "ready";
          impact.changed.push(cutaway.id, cutawayScene.id);
        }
      } else if (affectedSceneIds.has(hostScene.id)) {
        this.markCutawayStale(snapshot, cutaway, impact, "主线时间或场景边界已变化");
      }
    }
  }

  /** Timeline Item 的移动会收口关联 Scene，并按 Cue 的语义锚点重编译可推导的视觉时序。 */
  private propagateTimelineMove(snapshot: ProjectSnapshot, affectedItemIds: Set<Id>, impact: ImpactReport): void {
    const affectedSceneIds = new Set(snapshot.timeline.items.filter((item) => affectedItemIds.has(item.id) && item.sceneId).map((item) => item.sceneId as Id));
    for (const sceneId of affectedSceneIds) {
      const scene = snapshot.scenes.find((candidate) => candidate.id === sceneId);
      if (!scene) continue;
      const previousScene = { startFrame: scene.startFrame, endFrame: scene.endFrame };
      const items = snapshot.timeline.items.filter((item) => item.sceneId === scene.id && !item.disabled).sort((left, right) => left.startFrame - right.startFrame);
      if (items.length === 0) {
        scene.status = "stale";
        impact.stale.push(scene.id);
        continue;
      }
      scene.startFrame = items[0]!.startFrame;
      scene.endFrame = items.reduce((latest, item) => Math.max(latest, item.endFrame), scene.startFrame + 1);
      scene.assetIds = [...new Set(items.map((item) => item.assetId))];
      impact.changed.push(scene.id);
      for (const cue of snapshot.effectCues.filter((candidate) => candidate.sceneId === scene.id)) {
        this.recompileCueFromAnchor(snapshot, cue, previousScene, scene, impact);
      }
    }
    this.reconcileCutawaysAfterTimelineMove(snapshot, affectedItemIds, affectedSceneIds, impact);
    if (affectedSceneIds.size > 0) {
      impact.recomputed.push("Scene 范围、EffectCue 语义锚点、Cutaway stale；字幕继续服从 SpeechTiming");
    }
  }

  moveItem(input: { projectId: Id; baseRevision: number; itemId: Id; startFrame: number; ripple?: boolean }): ProjectState {
    const state = this.repository.commit(input.projectId, input.baseRevision, "移动时间线片段", (snapshot, impact) => {
      const item = snapshot.timeline.items.find((candidate) => candidate.id === input.itemId);
      if (!item) throw new DomainError("时间线片段不存在", "ITEM_NOT_FOUND");
      if (snapshot.audioCues.some((cue) => cue.timelineItemId === item.id)) {
        throw new DomainError("BGM / SFX 必须通过 manage_audio 修改，不能直接移动后丢失事件与 Duck 关系", "MANAGED_AUDIO_ITEM_DIRECT_MOVE");
      }
      const movedCutaway = snapshot.cutaways.find((cutaway) => cutaway.timelineItemId === item.id);
      if (movedCutaway?.status === "stale") {
        throw new DomainError("该 Cutaway 已因主线变化失效，请先通过 manage_cutaways 重新确认范围", "CUTAWAY_STALE_NEEDS_REVIEW");
      }
      const track = snapshot.timeline.tracks.find((candidate) => candidate.id === item.trackId);
      if (!track || track.locked) throw new DomainError("轨道不存在或已锁定", "TRACK_LOCKED");
      const oldStart = item.startFrame;
      const duration = item.endFrame - item.startFrame;
      const delta = input.startFrame - oldStart;
      const affectedItemIds = new Set<Id>([item.id]);
      if (input.startFrame < 0) throw new DomainError("片段不能移动到时间线起点之前", "INVALID_ITEM_RANGE");
      item.startFrame = input.startFrame;
      item.endFrame = input.startFrame + duration;
      impact.changed.push(item.id);
      if (input.ripple && delta !== 0) {
        for (const sibling of snapshot.timeline.items) {
          if (sibling.trackId === item.trackId && sibling.id !== item.id && sibling.startFrame >= oldStart) {
            sibling.startFrame += delta;
            sibling.endFrame += delta;
            impact.moved.push(sibling.id);
            affectedItemIds.add(sibling.id);
          }
        }
      }
      this.propagateTimelineMove(snapshot, affectedItemIds, impact);
      if (track.kind === "video" || track.name === "Dialogue") {
        this.staleAudioCuesForMainline(snapshot, impact, "主线 Timeline Item 已移动");
      }
      impact.dirtyRanges.push({ startFrame: Math.min(oldStart, item.startFrame), endFrame: Math.max(oldStart + duration, item.endFrame), reason: "移动时间线片段" });
      if (!input.ripple) impact.warnings.push("未启用 ripple；请检查独立轨道和主轨之间是否留下空隙。");
    });
    this.publish({ projectId: input.projectId, revision: state.revision.number, type: "revision" });
    return state;
  }

  submitVoiceSynthesis(input: { projectId: Id; voiceReferenceId?: Id; voiceReferenceAssetId?: Id; speechSegmentIds?: Id[]; idempotencyKey?: string }): JobRecord {
    const state = this.readProject(input.projectId);
    const reference = input.voiceReferenceId
      ? state.snapshot.voiceReferences.find((candidate) => candidate.id === input.voiceReferenceId)
      : state.snapshot.voiceReferences.find((candidate) => candidate.assetId === input.voiceReferenceAssetId);
    if (!reference) throw new DomainError("必须先登记本地 VoiceReference，不能把普通 Asset 当作远端 Voice ID 使用", "VOICE_REFERENCE_NOT_FOUND");
    if (!reference.usable) throw new DomainError("VoiceReference 当前不可用于 OmniVoice，请先更换或重新分析参考音频", "VOICE_REFERENCE_UNUSABLE");
    const voiceReference = assetById(state.snapshot, reference.assetId);
    if (voiceReference.kind !== "audio" || voiceReference.status !== "ready") {
      throw new DomainError("VoiceReference 必须是已就绪的音频素材", "INVALID_VOICE_REFERENCE");
    }
    const changedSegments = state.snapshot.speechSegments.filter((segment) => segment.status !== "ready").map((segment) => segment.id);
    const hasCachedAssetsForAllSegments = state.snapshot.speechSegments.every((segment) => state.snapshot.speechSegmentAssets.some((asset) => asset.speechSegmentId === segment.id));
    // Script 只发生重排时可复用所有 SegmentAsset，只重新组装 SpeechAsset；不浪费调用 OmniVoice 的成本。
    const segments = input.speechSegmentIds ?? changedSegments;
    if (segments.length === 0 && (state.snapshot.speechAsset || !hasCachedAssetsForAllSegments)) {
      throw new DomainError("没有需要生成或可重新组装的 SpeechSegment", "NO_SPEECH_SEGMENTS");
    }
    const job = this.repository.createJob({
      projectId: input.projectId,
      kind: "voice_synthesis",
      payload: { voiceReferenceId: reference.id, voiceReferenceAssetId: reference.assetId, speechSegmentIds: segments, scriptRevision: state.snapshot.script.revision, workflowId: "ba6238d0-3ee4-41d5-a1f4-a2aefc3933ce" },
      idempotencyKey: input.idempotencyKey ?? `voice:${reference.id}:${state.snapshot.script.revision}:${segments.join(",")}`
    });
    this.publish({ projectId: input.projectId, revision: state.revision.number, type: "job" });
    return job;
  }

  /**
   * 外部 Run 一创建就写回本地 Job。即使 ComfyUI 重启导致 run_id 不可查，
   * 也能从 Job 读出 workflow、schema 和请求摘要并决定是否重试。
   */
  recordBridgeRun(jobId: Id, audit: BridgeRunAudit): JobRecord {
    const job = this.repository.getJob(jobId);
    const previous = job.result ?? {};
    const existingRuns = Array.isArray(previous.bridgeRuns) ? previous.bridgeRuns : [];
    const nextRuns = [...existingRuns.filter((entry) => !(entry && typeof entry === "object" && "runId" in entry && (entry as { runId?: unknown }).runId === audit.runId)), audit];
    const updated = this.repository.updateJob(jobId, {
      status: job.status,
      result: { ...previous, bridgeRuns: nextRuns }
    });
    this.publish({ projectId: updated.projectId, revision: this.readProject(updated.projectId).revision.number, type: "job" });
    return updated;
  }

  submitPreview(input: { projectId: Id; revision?: number; fromFrame?: number; toFrame?: number; idempotencyKey?: string }): JobRecord {
    const current = this.readProject(input.projectId);
    const revision = input.revision ?? current.revision.number;
    const target = this.repository.getRevision(input.projectId, revision);
    const fromFrame = input.fromFrame ?? 0;
    const toFrame = input.toFrame ?? target.snapshot.timeline.durationInFrames;
    if (!Number.isInteger(fromFrame) || !Number.isInteger(toFrame) || fromFrame < 0 || toFrame <= fromFrame || toFrame > target.snapshot.timeline.durationInFrames) {
      throw new DomainError("局部预览范围无效", "INVALID_PREVIEW_RANGE");
    }
    const job = this.repository.createJob({
      projectId: input.projectId,
      kind: "preview",
      payload: { revision, fromFrame, toFrame },
      idempotencyKey: input.idempotencyKey ?? `preview:${revision}:${fromFrame}:${toFrame}`
    });
    this.publish({ projectId: input.projectId, revision: current.revision.number, type: "job" });
    return job;
  }

  /**
   * 将 inspect_composed_frames 的真实产物回写到对应 Preview Job。
   * MCP 是唯一调用入口；此处仍重复校验 Job、帧范围和项目内文件，避免审片报告依赖自由文本。
   */
  async recordPreviewInspection(input: {
    projectId: Id;
    previewJobId: Id;
    revision: number;
    frames: Array<{ frame: number; relativePath: string }>;
  }): Promise<JobRecord> {
    const job = this.repository.getJob(input.previewJobId);
    if (job.projectId !== input.projectId || job.kind !== "preview") {
      throw new DomainError("该任务不是当前项目的局部预览", "PREVIEW_JOB_NOT_FOUND");
    }
    if (job.status !== "succeeded" || !job.result) {
      throw new DomainError("局部预览尚未成功，不能登记合成帧", "PREVIEW_NOT_READY");
    }
    const revision = Number(job.result.revision ?? job.payload.revision);
    const fromFrame = Number(job.result.fromFrame ?? job.payload.fromFrame);
    const toFrame = Number(job.result.toFrame ?? job.payload.toFrame);
    if (revision !== input.revision || !Number.isInteger(fromFrame) || !Number.isInteger(toFrame) || fromFrame < 0 || toFrame <= fromFrame) {
      throw new DomainError("Preview Job 的 Revision 或帧范围无效", "INVALID_PREVIEW_INSPECTION");
    }
    const previewPath = typeof job.result.path === "string" ? this.resolveProjectEvidencePath(input.projectId, job.result.path) : undefined;
    if (!previewPath || !existsSync(previewPath)) {
      throw new DomainError("局部预览文件不存在，不能登记合成帧", "PREVIEW_NOT_FOUND");
    }
    const uniqueFrames = new Map<number, string>();
    for (const artifact of input.frames) {
      if (!Number.isInteger(artifact.frame) || artifact.frame < fromFrame || artifact.frame >= toFrame || !artifact.relativePath?.trim()) {
        throw new DomainError("合成帧不在该 Preview 的有效范围内", "PREVIEW_FRAME_OUT_OF_RANGE");
      }
      if (uniqueFrames.has(artifact.frame)) throw new DomainError("合成帧不能重复登记同一帧", "DUPLICATE_COMPOSED_FRAME");
      const artifactPath = this.resolveProjectEvidencePath(input.projectId, artifact.relativePath);
      if (!artifactPath || !existsSync(artifactPath)) throw new DomainError("合成帧文件不存在或超出项目目录", "COMPOSED_FRAME_EXTRACTION_FAILED");
      const artifactStat = await stat(artifactPath);
      if (!artifactStat.isFile() || artifactStat.size === 0) throw new DomainError("合成帧文件为空，不能作为审片证据", "COMPOSED_FRAME_EXTRACTION_FAILED");
      uniqueFrames.set(artifact.frame, artifact.relativePath);
    }
    if (uniqueFrames.size === 0) throw new DomainError("至少需要一帧真实合成画面", "COMPOSED_FRAME_EVIDENCE_REQUIRED");
    const inspection: PreviewInspectionEvidence = {
      revision,
      sourcePreviewJobId: job.id,
      inspectedAt: now(),
      frames: [...uniqueFrames.entries()].sort(([left], [right]) => left - right).map(([frame, relativePath]) => ({ frame, relativePath }))
    };
    return this.updateJob(job.id, { status: "succeeded", result: { ...job.result, inspection } });
  }

  /** 将当前 SpeechAsset 的最终音频、字幕和真实段级时序同步到可播放 Timeline。 */
  private syncSpeechAssetTimeline(snapshot: ProjectSnapshot, speechAsset: SpeechAsset): { dialogueItem: TimelineItem; replacedItemIds: Id[]; durationFrames: number } {
    const dialogueTrack = trackByName(snapshot, "Dialogue");
    // Dialogue 轨只替换系统生成的 Speech Asset；用户手工放入的其它音频保持不动。
    const replacedItemIds = snapshot.timeline.items
      .filter((item) => item.trackId === dialogueTrack.id && snapshot.assets.find((asset) => asset.id === item.assetId)?.kind === "speech")
      .map((item) => item.id);
    const replacedItemIdSet = new Set(replacedItemIds);
    snapshot.timeline.items = snapshot.timeline.items.filter((item) => !replacedItemIdSet.has(item.id));
    const speechFile = assetById(snapshot, speechAsset.assetId);
    if (speechFile.status !== "ready" || !speechFile.metadata?.hasAudio || speechFile.metadata.durationMs <= 0) {
      throw new DomainError("SpeechAsset 对应音频未就绪，不能写入 Dialogue 轨", "SPEECH_ASSET_NOT_READY");
    }
    const durationFrames = millisecondsToFrames(speechFile.metadata.durationMs, snapshot.timeline.fps);
    if (durationFrames <= 0) throw new DomainError("SpeechAsset 时长无效", "INVALID_SPEECH_DURATION");
    const dialogueItem = createTimelineItem({
      trackId: dialogueTrack.id,
      assetId: speechFile.id,
      startFrame: 0,
      endFrame: durationFrames,
      sourceStartFrame: 0,
      sourceEndFrame: durationFrames,
      gainDb: 0
    });
    snapshot.timeline.items.push(dialogueItem);
    snapshot.speechAsset = speechAsset;
    const previousCaptions = new Map(snapshot.timeline.captions.map((caption) => [caption.speechSegmentId, caption]));
    snapshot.timeline.captions = speechAsset.timing.segments.map((timing) => {
      const segment = snapshot.speechSegments.find((candidate) => candidate.id === timing.speechSegmentId);
      if (!segment) throw new DomainError("SpeechTiming 引用了不存在的 SpeechSegment", "SPEECH_TIMING_SEGMENT_MISSING");
      const previous = previousCaptions.get(segment.id);
      const sourceUnchanged = previous && (previous.sourceText ?? previous.text) === segment.text;
      if (previous) {
        // 重新组装同一段语音时保留用户已确认的屏幕文案与排版；原文变化则回到语音事实，避免旧强调悄悄错位。
        return {
          ...previous,
          speechSegmentId: segment.id,
          sourceText: segment.text,
          text: sourceUnchanged ? previous.text : segment.text,
          textMode: sourceUnchanged ? previous.textMode ?? (previous.text === segment.text ? "derived" : "manual") : "derived",
          startFrame: timing.startFrame,
          endFrame: timing.endFrame,
          style: "stable" as const,
          format: previous.format ?? { ...DEFAULT_CAPTION_FORMAT },
          emphasis: sourceUnchanged ? previous.emphasis : undefined,
          precision: speechAsset.timing.precision
        };
      }
      return {
        id: createId("caption"),
        speechSegmentId: segment.id,
        sourceText: segment.text,
        text: segment.text,
        textMode: "derived" as const,
        startFrame: timing.startFrame,
        endFrame: timing.endFrame,
        style: "stable" as const,
        format: { ...DEFAULT_CAPTION_FORMAT },
        precision: speechAsset.timing.precision
      };
    });
    return { dialogueItem, replacedItemIds, durationFrames };
  }

  applySpeechAssembly(input: { projectId: Id; generatedAssets: Asset[]; segmentAssets: SpeechSegmentAsset[]; speechAsset?: SpeechAsset }): ProjectState {
    const current = this.readProject(input.projectId);
    const state = this.repository.commit(input.projectId, current.revision.number, "组装旁白与段级时序", (snapshot, impact) => {
      const knownSegmentIds = new Set(snapshot.speechSegments.map((segment) => segment.id));
      for (const segmentAsset of input.segmentAssets) {
        if (!knownSegmentIds.has(segmentAsset.speechSegmentId)) throw new DomainError("SpeechSegment 已过期，不能写入旧语音", "STALE_SPEECH_SEGMENT");
      }
      const replacing = new Set(input.segmentAssets.map((segmentAsset) => segmentAsset.speechSegmentId));
      snapshot.speechSegmentAssets = snapshot.speechSegmentAssets.filter((segmentAsset) => !replacing.has(segmentAsset.speechSegmentId));
      snapshot.speechSegmentAssets.push(...input.segmentAssets);
      for (const generatedAsset of input.generatedAssets) {
        const existing = snapshot.assets.find((asset) => asset.id === generatedAsset.id);
        if (!existing) snapshot.assets.push(generatedAsset);
      }
      for (const segment of snapshot.speechSegments) {
        if (replacing.has(segment.id)) segment.status = "ready";
      }
      if (!input.speechAsset) {
        impact.changed.push(...input.segmentAssets.map((segmentAsset) => segmentAsset.id));
        impact.recomputed.push("局部 SpeechSegmentAsset");
        return;
      }
      const speechAsset = input.speechAsset;
      const previousSpeechAssetId = snapshot.speechAsset?.assetId;
      const dialogueTrack = trackByName(snapshot, "Dialogue");
      const previousDialogueDuration = snapshot.timeline.items.find((item) => item.trackId === dialogueTrack.id && item.assetId === previousSpeechAssetId && !item.disabled);
      const synced = this.syncSpeechAssetTimeline(snapshot, speechAsset);
      if (previousSpeechAssetId && (previousSpeechAssetId !== speechAsset.assetId || previousDialogueDuration?.endFrame !== synced.durationFrames)) {
        this.staleAudioCuesForMainline(snapshot, impact, "SpeechAsset 时长或旁白文件已变化");
      }
      impact.changed.push(speechAsset.id, synced.dialogueItem.id, ...synced.replacedItemIds, ...input.segmentAssets.map((segmentAsset) => segmentAsset.id));
      impact.recomputed.push("Dialogue 旁白轨、segment_exact SpeechTiming、稳定短句字幕");
      impact.dirtyRanges.push({ startFrame: 0, endFrame: Math.max(snapshot.timeline.durationInFrames, synced.durationFrames), reason: "旁白时序更新" });
    });
    this.publish({ projectId: input.projectId, revision: state.revision.number, type: "revision" });
    return state;
  }

  /** 为旧 Revision 补回遗漏的 Dialogue Item 与稳定字幕，不重新调用 OmniVoice。 */
  rebuildSpeechAssetTimeline(input: { projectId: Id; baseRevision: number }): ProjectState {
    const state = this.repository.commit(input.projectId, input.baseRevision, "修复 SpeechAsset 的 Dialogue 与字幕", (snapshot, impact) => {
      const speechAsset = snapshot.speechAsset;
      if (!speechAsset || speechAsset.status !== "ready") throw new DomainError("当前项目没有可修复的 SpeechAsset", "SPEECH_ASSET_NOT_FOUND");
      if (speechAsset.scriptRevision !== snapshot.script.revision) {
        throw new DomainError("SpeechAsset 与当前 Script 不一致，必须先重新生成或组装旁白", "SPEECH_SCRIPT_STALE");
      }
      const synced = this.syncSpeechAssetTimeline(snapshot, speechAsset);
      impact.changed.push(speechAsset.id, synced.dialogueItem.id, ...synced.replacedItemIds);
      impact.recomputed.push("修复 Dialogue 旁白轨、稳定短句字幕");
      impact.dirtyRanges.push({ startFrame: 0, endFrame: Math.max(snapshot.timeline.durationInFrames, synced.durationFrames), reason: "修复旧 SpeechAsset Timeline" });
    });
    this.publish({ projectId: input.projectId, revision: state.revision.number, type: "revision" });
    return state;
  }

  /**
   * 字幕是对可播放 SpeechSegment 的独立屏幕呈现：只允许改 Card 文案与有限排版，
   * 不允许在这里修改 Script、语音文件或段级时间范围。
   */
  editCaptions(input: {
    projectId: Id;
    baseRevision: number;
    captionId: Id;
    action: "update" | "reset";
    text?: string;
    format?: CaptionFormatPatch;
    emphasis?: CaptionEmphasis | null;
  }): ProjectState {
    if (input.action === "update" && input.text === undefined && input.format === undefined && input.emphasis === undefined) {
      throw new DomainError("更新字幕至少需要文案、排版或强调之一", "EMPTY_CAPTION_UPDATE");
    }
    const state = this.repository.commit(input.projectId, input.baseRevision, input.action === "reset" ? "恢复字幕语音原文" : "编辑字幕卡", (snapshot, impact) => {
      const speechAsset = snapshot.speechAsset;
      if (!speechAsset || speechAsset.status !== "ready" || speechAsset.scriptRevision !== snapshot.script.revision) {
        throw new DomainError("当前没有与 Script 一致的 SpeechAsset，不能编辑字幕", "CAPTION_SOURCE_NOT_READY");
      }
      const caption = snapshot.timeline.captions.find((candidate) => candidate.id === input.captionId);
      if (!caption) throw new DomainError("未找到要编辑的字幕卡", "CAPTION_NOT_FOUND");
      const segment = snapshot.speechSegments.find((candidate) => candidate.id === caption.speechSegmentId);
      const timing = speechAsset.timing.segments.find((candidate) => candidate.speechSegmentId === caption.speechSegmentId);
      if (!segment || !timing || caption.startFrame !== timing.startFrame || caption.endFrame !== timing.endFrame) {
        throw new DomainError("字幕时序已不再对应当前 SpeechAsset；请先重建字幕", "CAPTION_TIMING_STALE");
      }
      if ((caption.sourceText ?? caption.text) !== segment.text) {
        throw new DomainError("字幕来源文字已变化；请先重建字幕，再进行屏幕文案微调", "CAPTION_SOURCE_STALE");
      }

      if (input.action === "reset") {
        caption.sourceText = segment.text;
        caption.text = segment.text;
        caption.textMode = "derived";
        caption.format = { ...DEFAULT_CAPTION_FORMAT };
        caption.emphasis = undefined;
      } else {
        const nextText = input.text === undefined ? caption.text : normalizeCaptionText(input.text);
        const textChanged = nextText !== caption.text;
        caption.sourceText = segment.text;
        caption.text = nextText;
        caption.textMode = nextText === segment.text ? "derived" : "manual";
        if (input.format !== undefined) caption.format = applyCaptionFormat(caption.format, input.format);
        else caption.format ??= { ...DEFAULT_CAPTION_FORMAT };

        if (input.emphasis === null || (textChanged && input.emphasis === undefined)) {
          // 改文案后旧短语不再可信，默认移除；调用方可在同一原子写入中提供新的强调。
          caption.emphasis = undefined;
        } else if (input.emphasis !== undefined) {
          caption.emphasis = normalizeCaptionEmphasis(input.emphasis, nextText);
        } else if (caption.emphasis) {
          caption.emphasis = normalizeCaptionEmphasis(caption.emphasis, nextText);
        }
      }
      impact.changed.push(caption.id);
      impact.recomputed.push("稳定字幕文案、有限排版与 Card 级强调");
      impact.dirtyRanges.push({ startFrame: caption.startFrame, endFrame: caption.endFrame, reason: "字幕卡编辑" });
    });
    this.publish({ projectId: input.projectId, revision: state.revision.number, type: "revision" });
    return state;
  }

  /**
   * BGM / SFX 的最小包装入口：用 AudioCue 记录编辑意图，再同步写入专用声音轨。
   * 不在这里生成音乐、猜测 onset 或实现通用 DAW；所有精确事件均由调用方显式给出。
   */
  manageAudio(input: {
    projectId: Id;
    baseRevision: number;
    action: "create" | "update" | "remove";
    audioCueId?: Id;
    kind?: AudioCueKind;
    assetId?: Id;
    purpose?: string;
    startFrame?: number;
    endFrame?: number;
    sourceStartFrame?: number;
    sourceEndFrame?: number;
    loop?: boolean;
    gainDb?: number;
    fadeInFrames?: number;
    fadeOutFrames?: number;
    eventFrame?: number;
    onsetOffsetFrames?: number;
    ducking?: AudioDuckingPatch;
  }): ProjectState {
    const summary = input.action === "create" ? "添加 BGM / SFX" : input.action === "remove" ? "移除 BGM / SFX" : "调整 BGM / SFX";
    const state = this.repository.commit(input.projectId, input.baseRevision, summary, (snapshot, impact) => {
      const managedAudioItemIds = new Set((snapshot.audioCues ?? []).map((cue) => cue.timelineItemId));
      // 声音包装不能悄悄拉长成片；目标范围始终以当前非 AudioCue 主线为准。
      const programEndFrame = snapshot.timeline.items
        .filter((item) => !item.disabled && !managedAudioItemIds.has(item.id))
        .reduce((maximum, item) => Math.max(maximum, item.endFrame), 0);

      const validateGain = (value: number): number => {
        if (!Number.isFinite(value) || value < -48 || value > 12) {
          throw new DomainError("声音增益必须在 -48 到 12 dB 之间", "INVALID_AUDIO_GAIN");
        }
        return value;
      };
      const validateFades = (fadeInFrames: number, fadeOutFrames: number, duration: number) => {
        requireAudioFrame(fadeInFrames, "淡入时长", 0, 480);
        requireAudioFrame(fadeOutFrames, "淡出时长", 0, 480);
        if (fadeInFrames + fadeOutFrames > duration) {
          throw new DomainError("淡入和淡出总时长不能超过声音片段时长", "INVALID_AUDIO_FADE");
        }
      };
      const sourceRangeFor = (asset: Asset, defaultStart: number, defaultEnd: number) => {
        const assetDuration = millisecondsToFrames(asset.metadata!.durationMs, snapshot.timeline.fps);
        if (assetDuration <= 0) throw new DomainError("声音素材时长无效", "INVALID_AUDIO_SOURCE_RANGE");
        const sourceStartFrame = input.sourceStartFrame ?? defaultStart;
        const sourceEndFrame = input.sourceEndFrame ?? defaultEnd;
        requireAudioFrame(sourceStartFrame, "声音源起点", 0, assetDuration - 1);
        requireAudioFrame(sourceEndFrame, "声音源终点", 1, assetDuration);
        if (sourceEndFrame <= sourceStartFrame) {
          throw new DomainError("声音源范围必须至少包含一帧", "INVALID_AUDIO_SOURCE_RANGE");
        }
        return { sourceStartFrame, sourceEndFrame };
      };
      const requireProgramRange = (startFrame: number, endFrame: number) => {
        if (programEndFrame <= 0) throw new DomainError("必须先建立可播放主线，才能添加 BGM 或 SFX", "AUDIO_PROGRAM_NOT_READY");
        requireAudioFrame(startFrame, "声音起点", 0, Math.max(0, programEndFrame - 1));
        requireAudioFrame(endFrame, "声音终点", 1, programEndFrame);
        if (endFrame <= startFrame) throw new DomainError("声音目标范围无效", "INVALID_AUDIO_RANGE");
      };
      const createOrUpdateItem = (cue: AudioCue | undefined, trackName: "BGM" | "SFX", assetId: Id, startFrame: number, endFrame: number, sourceStartFrame: number, sourceEndFrame: number, gainDb: number) => {
        const track = trackByName(snapshot, trackName);
        if (track.locked) throw new DomainError(`${trackName} 轨已锁定`, "TRACK_LOCKED");
        if (!cue) {
          const item = createTimelineItem({ trackId: track.id, assetId, startFrame, endFrame, sourceStartFrame, sourceEndFrame, gainDb });
          snapshot.timeline.items.push(item);
          return item;
        }
        const item = snapshot.timeline.items.find((candidate) => candidate.id === cue.timelineItemId);
        if (!item) throw new DomainError("AudioCue 缺少关联 Timeline Item", "AUDIO_ITEM_MISSING");
        if (item.trackId !== track.id) throw new DomainError("AudioCue 不在对应声音轨", "AUDIO_TRACK_MISMATCH");
        item.assetId = assetId;
        item.startFrame = startFrame;
        item.endFrame = endFrame;
        item.sourceStartFrame = sourceStartFrame;
        item.sourceEndFrame = sourceEndFrame;
        item.gainDb = gainDb;
        item.disabled = false;
        return item;
      };

      if (input.action === "remove") {
        if (!input.audioCueId) throw new DomainError("移除声音需要 audioCueId", "AUDIO_CUE_REQUIRED");
        const cue = snapshot.audioCues.find((candidate) => candidate.id === input.audioCueId);
        if (!cue) throw new NotFoundError("AudioCue 不存在");
        const item = snapshot.timeline.items.find((candidate) => candidate.id === cue.timelineItemId);
        snapshot.audioCues = snapshot.audioCues.filter((candidate) => candidate.id !== cue.id);
        snapshot.timeline.items = snapshot.timeline.items.filter((candidate) => candidate.id !== cue.timelineItemId);
        impact.changed.push(cue.id, cue.timelineItemId);
        if (item) impact.dirtyRanges.push({ startFrame: item.startFrame, endFrame: item.endFrame, reason: "移除声音包装" });
        impact.recomputed.push("移除 BGM / SFX Timeline Item");
        return;
      }

      if (input.action === "create") {
        if (!input.kind || !input.assetId) throw new DomainError("添加声音必须指定 kind 和 assetId", "AUDIO_CREATE_FIELDS_REQUIRED");
        const asset = requireReadyAudioAsset(snapshot, input.assetId);
        const purpose = requireText(input.purpose, "声音用途");
        const kind = input.kind;
        const assetDuration = millisecondsToFrames(asset.metadata!.durationMs, snapshot.timeline.fps);
        const loop = input.loop ?? false;
        const gainDb = validateGain(input.gainDb ?? (kind === "bgm" ? -18 : -6));
        let startFrame: number;
        let endFrame: number;
        let sourceStartFrame: number;
        let sourceEndFrame: number;
        let fadeInFrames: number;
        let fadeOutFrames: number;
        let eventFrame: number | undefined;
        let onsetOffsetFrames: number | undefined;
        let ducking: AudioDucking | undefined;

        if (kind === "bgm") {
          if (input.eventFrame !== undefined || input.onsetOffsetFrames !== undefined) {
            throw new DomainError("BGM 使用整片范围，不接受 SFX 事件与 onsetOffset", "UNEXPECTED_AUDIO_EVENT");
          }
          startFrame = input.startFrame ?? 0;
          endFrame = input.endFrame ?? programEndFrame;
          requireProgramRange(startFrame, endFrame);
          ({ sourceStartFrame, sourceEndFrame } = sourceRangeFor(asset, 0, assetDuration));
          if (!loop && sourceEndFrame - sourceStartFrame < endFrame - startFrame) {
            throw new DomainError("BGM 源范围不足以覆盖目标范围；请裁短、开启循环或更换音乐", "BGM_SOURCE_TOO_SHORT");
          }
          fadeInFrames = input.fadeInFrames ?? Math.min(12, Math.floor((endFrame - startFrame) / 2));
          fadeOutFrames = input.fadeOutFrames ?? Math.min(24, Math.floor((endFrame - startFrame) / 2));
          validateFades(fadeInFrames, fadeOutFrames, endFrame - startFrame);
          ducking = normalizeAudioDucking(input.ducking);
        } else {
          if (loop) throw new DomainError("SFX 不支持循环，请明确放置每个声音事件", "SFX_LOOP_UNSUPPORTED");
          if (input.startFrame !== undefined || input.endFrame !== undefined || input.ducking !== undefined) {
            throw new DomainError("SFX 的位置由 eventFrame 与 onsetOffset 决定，不能混用 BGM 范围或 Duck", "SFX_EVENT_FIELDS_REQUIRED");
          }
          if (input.eventFrame === undefined) throw new DomainError("SFX 必须提供实际听见的 eventFrame", "SFX_EVENT_REQUIRED");
          eventFrame = input.eventFrame;
          requireAudioFrame(eventFrame, "SFX 事件帧", 0, Math.max(0, programEndFrame - 1));
          onsetOffsetFrames = input.onsetOffsetFrames ?? 0;
          requireAudioFrame(onsetOffsetFrames, "SFX onsetOffset", 0, assetDuration - 1);
          ({ sourceStartFrame, sourceEndFrame } = sourceRangeFor(asset, 0, assetDuration));
          if (onsetOffsetFrames >= sourceEndFrame - sourceStartFrame) {
            throw new DomainError("SFX onsetOffset 必须落在当前源范围内", "INVALID_SFX_ONSET");
          }
          startFrame = eventFrame - onsetOffsetFrames;
          endFrame = startFrame + sourceEndFrame - sourceStartFrame;
          requireProgramRange(startFrame, endFrame);
          fadeInFrames = input.fadeInFrames ?? 0;
          fadeOutFrames = input.fadeOutFrames ?? 0;
          validateFades(fadeInFrames, fadeOutFrames, endFrame - startFrame);
        }

        const item = createOrUpdateItem(undefined, kind === "bgm" ? "BGM" : "SFX", asset.id, startFrame, endFrame, sourceStartFrame, sourceEndFrame, gainDb);
        const cue = createAudioCue({
          kind,
          assetId: asset.id,
          timelineItemId: item.id,
          purpose,
          anchor: kind === "bgm" ? "sequence_global" : "media_event",
          eventFrame,
          onsetOffsetFrames,
          fadeInFrames,
          fadeOutFrames,
          loop: kind === "bgm" && loop,
          ducking
        });
        snapshot.audioCues.push(cue);
        impact.changed.push(cue.id, item.id, asset.id);
        impact.dirtyRanges.push({ startFrame, endFrame, reason: `添加 ${kind === "bgm" ? "BGM" : "SFX"}` });
        impact.recomputed.push(kind === "bgm" ? "BGM 淡入淡出与 Dialogue Duck" : "SFX onset 与声音事件落点");
        return;
      }

      if (!input.audioCueId) throw new DomainError("更新声音需要 audioCueId", "AUDIO_CUE_REQUIRED");
      const cue = snapshot.audioCues.find((candidate) => candidate.id === input.audioCueId);
      if (!cue) throw new NotFoundError("AudioCue 不存在");
      if (input.kind && input.kind !== cue.kind) throw new DomainError("不能把既有 BGM 直接改成 SFX，或反向修改", "AUDIO_KIND_IMMUTABLE");
      const existingItem = snapshot.timeline.items.find((candidate) => candidate.id === cue.timelineItemId);
      if (!existingItem) throw new DomainError("AudioCue 缺少关联 Timeline Item", "AUDIO_ITEM_MISSING");
      const assetChanged = input.assetId !== undefined && input.assetId !== cue.assetId;
      const asset = requireReadyAudioAsset(snapshot, input.assetId ?? cue.assetId);
      const assetDuration = millisecondsToFrames(asset.metadata!.durationMs, snapshot.timeline.fps);
      const sourceDefaults = assetChanged ? { start: 0, end: assetDuration } : { start: existingItem.sourceStartFrame, end: existingItem.sourceEndFrame };
      const { sourceStartFrame, sourceEndFrame } = sourceRangeFor(asset, sourceDefaults.start, sourceDefaults.end);
      const gainDb = validateGain(input.gainDb ?? existingItem.gainDb ?? (cue.kind === "bgm" ? -18 : -6));
      const purpose = input.purpose === undefined ? cue.purpose : requireText(input.purpose, "声音用途");
      let startFrame: number;
      let endFrame: number;
      let eventFrame: number | undefined;
      let onsetOffsetFrames: number | undefined;
      let ducking: AudioDucking | undefined;
      let loop = false;

      if (cue.kind === "bgm") {
        if (input.eventFrame !== undefined || input.onsetOffsetFrames !== undefined) {
          throw new DomainError("BGM 使用整片范围，不接受 SFX 事件与 onsetOffset", "UNEXPECTED_AUDIO_EVENT");
        }
        startFrame = input.startFrame ?? existingItem.startFrame;
        endFrame = input.endFrame ?? existingItem.endFrame;
        requireProgramRange(startFrame, endFrame);
        loop = input.loop ?? cue.loop;
        if (!loop && sourceEndFrame - sourceStartFrame < endFrame - startFrame) {
          throw new DomainError("BGM 源范围不足以覆盖目标范围；请裁短、开启循环或更换音乐", "BGM_SOURCE_TOO_SHORT");
        }
        ducking = normalizeAudioDucking(input.ducking, cue.ducking);
      } else {
        if (input.startFrame !== undefined || input.endFrame !== undefined || input.ducking !== undefined || input.loop === true) {
          throw new DomainError("SFX 的位置由 eventFrame 与 onsetOffset 决定，不能混用 BGM 范围、Duck 或循环", "SFX_EVENT_FIELDS_REQUIRED");
        }
        eventFrame = input.eventFrame ?? cue.eventFrame;
        if (eventFrame === undefined) throw new DomainError("SFX 缺少实际听见的 eventFrame", "SFX_EVENT_REQUIRED");
        requireAudioFrame(eventFrame, "SFX 事件帧", 0, Math.max(0, programEndFrame - 1));
        onsetOffsetFrames = input.onsetOffsetFrames ?? cue.onsetOffsetFrames ?? 0;
        requireAudioFrame(onsetOffsetFrames, "SFX onsetOffset", 0, assetDuration - 1);
        if (onsetOffsetFrames >= sourceEndFrame - sourceStartFrame) {
          throw new DomainError("SFX onsetOffset 必须落在当前源范围内", "INVALID_SFX_ONSET");
        }
        startFrame = eventFrame - onsetOffsetFrames;
        endFrame = startFrame + sourceEndFrame - sourceStartFrame;
        requireProgramRange(startFrame, endFrame);
      }
      const fadeInFrames = input.fadeInFrames ?? cue.fadeInFrames;
      const fadeOutFrames = input.fadeOutFrames ?? cue.fadeOutFrames;
      validateFades(fadeInFrames, fadeOutFrames, endFrame - startFrame);
      const oldStartFrame = existingItem.startFrame;
      const oldEndFrame = existingItem.endFrame;
      const item = createOrUpdateItem(cue, cue.kind === "bgm" ? "BGM" : "SFX", asset.id, startFrame, endFrame, sourceStartFrame, sourceEndFrame, gainDb);
      cue.assetId = asset.id;
      cue.purpose = purpose;
      cue.anchor = cue.kind === "bgm" ? "sequence_global" : "media_event";
      cue.eventFrame = eventFrame;
      cue.onsetOffsetFrames = onsetOffsetFrames;
      cue.fadeInFrames = fadeInFrames;
      cue.fadeOutFrames = fadeOutFrames;
      cue.loop = loop;
      cue.ducking = ducking;
      cue.status = "ready";
      cue.updatedAt = now();
      impact.changed.push(cue.id, item.id, asset.id);
      impact.dirtyRanges.push({ startFrame: Math.min(oldStartFrame, startFrame), endFrame: Math.max(oldEndFrame, endFrame), reason: `调整 ${cue.kind === "bgm" ? "BGM" : "SFX"}` });
      impact.recomputed.push(cue.kind === "bgm" ? "BGM 淡入淡出与 Dialogue Duck" : "SFX onset 与声音事件落点");
    });
    this.publish({ projectId: input.projectId, revision: state.revision.number, type: "revision" });
    return state;
  }

  /**
   * 旁白是当前 Presenter 主线的节奏基准时，将未被手工覆盖的 A-roll 收齐到最终 SpeechAsset。
   * 只允许裁短已有素材；若需要补画面或会碰到既有 Cue，则拒绝自动改写，交回导演层决定。
   */
  alignPresenterToSpeech(input: { projectId: Id; baseRevision: number }): ProjectState {
    const state = this.repository.commit(input.projectId, input.baseRevision, "按旁白时长收齐 Presenter 主线", (snapshot, impact) => {
      const speechAsset = snapshot.speechAsset;
      if (!speechAsset || speechAsset.status !== "ready" || speechAsset.scriptRevision !== snapshot.script.revision) {
        throw new DomainError("必须先生成与当前 Script 一致的 SpeechAsset", "SPEECH_ASSET_NOT_READY");
      }
      const dialogueTrack = trackByName(snapshot, "Dialogue");
      const dialogueItem = snapshot.timeline.items.find((item) => item.trackId === dialogueTrack.id && item.assetId === speechAsset.assetId && !item.disabled);
      if (!dialogueItem) throw new DomainError("SpeechAsset 尚未写入 Dialogue 轨", "SPEECH_DIALOGUE_ITEM_MISSING");
      const actorTrack = trackByName(snapshot, "Actor / A-roll");
      if (actorTrack.locked) throw new DomainError("Actor / A-roll 轨已锁定，不能自动收齐", "TRACK_LOCKED");
      const actorItems = snapshot.timeline.items
        .filter((item) => item.trackId === actorTrack.id && !item.disabled)
        .sort((left, right) => left.startFrame - right.startFrame);
      if (actorItems.length === 0) throw new DomainError("没有可收齐的 Presenter 主画面", "MISSING_PRIMARY_VIDEO");

      const targetEndFrame = dialogueItem.endFrame;
      const currentEndFrame = actorItems[actorItems.length - 1]!.endFrame;
      if (targetEndFrame > currentEndFrame) {
        throw new DomainError("旁白长于现有 Presenter 主画面；请先补充可播放视频，系统不会凭空延长素材", "PRESENTER_VISUAL_TOO_SHORT");
      }
      if (targetEndFrame === currentEndFrame) return;

      const affectedItems = actorItems.filter((item) => item.endFrame > targetEndFrame);
      if (affectedItems.some((item) => item.directOverride)) {
        throw new DomainError("待收齐的主画面含有 direct_override，不能自动裁短", "DIRECT_OVERRIDE_PROTECTED");
      }
      const affectedSceneIds = new Set(affectedItems.map((item) => item.sceneId).filter((id): id is Id => Boolean(id)));
      const incompatibleCue = snapshot.effectCues.find((cue) => affectedSceneIds.has(cue.sceneId) && cue.endFrame > targetEndFrame);
      if (incompatibleCue) {
        throw new DomainError("待收齐范围已有 EffectCue；请先在当前 Revision 调整 Cue，再收齐主画面", "PRESENTER_TRIM_HAS_CUES");
      }

      const removedItemIds = new Set<Id>();
      for (const item of affectedItems) {
        if (item.startFrame >= targetEndFrame) {
          removedItemIds.add(item.id);
          impact.stale.push(item.id);
          continue;
        }
        const oldEndFrame = item.endFrame;
        item.endFrame = targetEndFrame;
        item.sourceEndFrame = item.sourceStartFrame + (targetEndFrame - item.startFrame);
        impact.changed.push(item.id);
        impact.dirtyRanges.push({ startFrame: targetEndFrame, endFrame: oldEndFrame, reason: "按 SpeechAsset 裁短 Presenter 主画面" });
      }
      snapshot.timeline.items = snapshot.timeline.items.filter((item) => !removedItemIds.has(item.id));

      const removedPerformanceIds = snapshot.actorPerformances
        .filter((performance) => removedItemIds.has(performance.timelineItemId))
        .map((performance) => performance.id);
      snapshot.actorPerformances = snapshot.actorPerformances.filter((performance) => !removedItemIds.has(performance.timelineItemId));
      impact.stale.push(...removedPerformanceIds);

      for (const scene of snapshot.scenes.filter((candidate) => candidate.type === "PresenterScene")) {
        const sceneItems = snapshot.timeline.items
          .filter((item) => item.sceneId === scene.id && item.trackId === actorTrack.id && !item.disabled)
          .sort((left, right) => left.startFrame - right.startFrame);
        if (sceneItems.length === 0) {
          throw new DomainError("收齐操作会移除整个已有 PresenterScene；请先手工调整场景边界", "PRESENTER_SCENE_REMOVAL_REQUIRED");
        }
        const nextEndFrame = sceneItems[sceneItems.length - 1]!.endFrame;
        if (nextEndFrame !== scene.endFrame) {
          scene.endFrame = nextEndFrame;
          scene.assetIds = [...new Set(sceneItems.map((item) => item.assetId))];
          impact.changed.push(scene.id);
        }
      }
      this.staleCutawaysForHostScenes(snapshot, affectedSceneIds, impact, "旁白时长收齐改变了主场景边界");
      this.staleAudioCuesForMainline(snapshot, impact, "旁白时长收齐改变了主线边界");
      impact.recomputed.push("Presenter 主画面、Scene Strip 与旁白时长对齐");
      assertTimelineValid(snapshot);
    });
    this.publish({ projectId: input.projectId, revision: state.revision.number, type: "revision" });
    return state;
  }

  submitExport(input: { projectId: Id; revision?: number; purpose?: ExportPurpose; idempotencyKey?: string }): JobRecord {
    const state = this.readProject(input.projectId);
    const revision = input.revision ?? state.revision.number;
    const purpose = input.purpose ?? "delivery";
    this.repository.getRevision(input.projectId, revision);
    const job = this.repository.createJob({
      projectId: input.projectId,
      kind: "export",
      payload: { revision, purpose },
      // 草稿不能复用正式交付 Job；否则一次旧草稿会绕过当前 Revision 的交付门禁。
      idempotencyKey: `${input.idempotencyKey ?? "export"}:${purpose}:${revision}`
    });
    this.publish({ projectId: input.projectId, revision: state.revision.number, type: "job" });
    return job;
  }

  rollbackToRevision(input: { projectId: Id; baseRevision: number; targetRevision: number }): ProjectState {
    const target = this.repository.getRevision(input.projectId, input.targetRevision);
    const state = this.repository.commit(input.projectId, input.baseRevision, `回退到 Revision ${input.targetRevision}`, (snapshot, impact) => {
      const restored = cloneSnapshot(target.snapshot);
      Object.assign(snapshot, restored);
      snapshot.project.updatedAt = now();
      impact.changed.push(snapshot.project.id);
      impact.recomputed.push("从不可变快照恢复全部项目对象");
      impact.dirtyRanges.push({ startFrame: 0, endFrame: snapshot.timeline.durationInFrames, reason: "Revision 回退" });
    });
    this.publish({ projectId: input.projectId, revision: state.revision.number, type: "revision" });
    return state;
  }

  trackJob(jobId: Id): JobRecord {
    return this.repository.getJob(jobId);
  }

  listJobs(projectId: Id): JobRecord[] {
    return this.repository.listJobs(projectId);
  }

  updateJob(jobId: Id, input: { status: JobStatus; result?: Record<string, unknown>; error?: string; leaseUntil?: string }): JobRecord {
    const job = this.repository.updateJob(jobId, input);
    const project = this.readProject(job.projectId);
    this.publish({ projectId: job.projectId, revision: project.revision.number, type: "job" });
    return job;
  }

  claimNextJob(kinds?: JobKind[], leaseMilliseconds?: number): JobRecord | undefined {
    return this.repository.claimNextJob(kinds, leaseMilliseconds);
  }

  renewJobLease(jobId: Id, leaseMilliseconds?: number): JobRecord {
    return this.repository.renewJobLease(jobId, leaseMilliseconds);
  }
}

export function createApplication(workspaceRoot = join(process.cwd(), "workspace")): EditingApplication {
  return new EditingApplication(new ProjectRepository(workspaceRoot));
}

export function resolveItemDuration(item: TimelineItem): number {
  return item.endFrame - item.startFrame;
}

export function durationMsForItem(item: TimelineItem, fps: number): number {
  return framesToMilliseconds(resolveItemDuration(item), fps);
}
