import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type {
  Asset,
  ActorMaskMode,
  ActorPerformanceSource,
  BridgeRunAudit,
  CreativeBrief,
  EffectType,
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
  StoryBeat,
  SpeechAsset,
  SpeechSegmentAsset,
  SpeechTiming,
  TimelineItem,
  VoiceReference
} from "@videocut/contracts";
import {
  assetById,
  assertTimelineValid,
  cloneSnapshot,
  compileSpeechSegments,
  createActorPerformance,
  createEffectCue,
  createId,
  createMediaAsset,
  createProjectSnapshot,
  createScene,
  createSemanticUnits,
  createStoryDocument,
  createVoiceReference,
  createTimelineItem,
  DomainError,
  emptyImpact,
  framesToMilliseconds,
  millisecondsToFrames,
  now,
  trackByName
} from "@videocut/domain";

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
  snapshot.voiceReferences ??= [];
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
  return snapshot;
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
    for (const directory of ["assets/source", "assets/proxy", "assets/voice-reference", "assets/speech", "assets/actor", "assets/derived", "previews", "exports", "cache"]) {
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
    beats?: Array<Pick<StoryBeat, "title" | "purpose"> & Partial<Pick<StoryBeat, "semanticUnitIds" | "sceneIds">>>;
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
        snapshot.story.beats = input.beats.map((beat, order) => {
          const title = beat.title.trim();
          const purpose = beat.purpose.trim();
          if (!title || !purpose) throw new DomainError("Story Beat 必须包含标题和叙事目的", "INVALID_STORY_BEAT");
          const beatSemanticIds = beat.semanticUnitIds ?? [];
          const beatSceneIds = beat.sceneIds ?? [];
          for (const id of beatSemanticIds) if (!semanticIds.has(id)) throw new DomainError(`Story Beat 引用了未知语义单元：${id}`, "STORY_SEMANTIC_NOT_FOUND");
          for (const id of beatSceneIds) if (!sceneIds.has(id)) throw new DomainError(`Story Beat 引用了未知场景：${id}`, "STORY_SCENE_NOT_FOUND");
          return { id: createId("story_beat"), order, title, purpose, semanticUnitIds: beatSemanticIds, sceneIds: beatSceneIds };
        });
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

  registerImportedAsset(input: {
    projectId: Id;
    baseRevision: number;
    name: string;
    kind: Asset["kind"];
    managedPath: string;
    originalPath?: string;
    sourceHash?: string;
  }): { state: ProjectState; asset: Asset; job: JobRecord } {
    let asset!: Asset;
    const state = this.repository.commit(input.projectId, input.baseRevision, `导入素材：${input.name}`, (snapshot, impact) => {
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

  applyTranscript(input: { projectId: Id; assetId: Id; text: string; bridgeRunId?: string; schemaVersion?: string; bridgeAudit?: BridgeRunAudit; source?: "funasr" | "manual" }): ProjectState {
    const current = this.readProject(input.projectId);
    const state = this.repository.commit(input.projectId, current.revision.number, "写入转写并生成语义单元", (snapshot, impact) => {
      assetById(snapshot, input.assetId);
      const oldTranscriptIds = new Set(snapshot.transcripts.filter((transcript) => transcript.assetId === input.assetId).map((transcript) => transcript.id));
      snapshot.transcripts = snapshot.transcripts.filter((transcript) => transcript.assetId !== input.assetId);
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
      snapshot.semanticUnits.push(...createSemanticUnits(transcript.id, input.assetId, transcript.text));
      this.reconcileScript(snapshot, impact);
      impact.changed.push(transcript.id);
      impact.recomputed.push("SemanticUnit、Script、SpeechSegment");
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
      return old ? { ...segment, id: old.id, status: old.status, prePauseMs: old.prePauseMs, postPauseMs: old.postPauseMs } : segment;
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
    snapshot.timeline.captions = [];
    for (const performance of snapshot.actorPerformances) {
      if (performance.source === "generated" && performance.scriptRevision !== snapshot.script.revision) {
        performance.status = "stale";
        impact.stale.push(performance.id);
      }
    }
    for (const cue of snapshot.effectCues) {
      if (cue.anchorTargetId && !currentIds.has(cue.anchorTargetId)) {
        cue.status = "stale";
        impact.stale.push(cue.id);
      }
    }
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

  buildPresenterTimeline(input: { projectId: Id; baseRevision: number; assetIds: Id[]; sceneSize?: number }): ProjectState {
    const state = this.repository.commit(input.projectId, input.baseRevision, "建立 Presenter 主时间线", (snapshot, impact) => {
      const track = trackByName(snapshot, "Actor / A-roll");
      const selected = input.assetIds.map((assetId) => assetById(snapshot, assetId));
      if (selected.length === 0) throw new DomainError("至少需要一条素材", "EMPTY_TIMELINE");
      if (selected.some((asset) => asset.status !== "ready" || !asset.metadata)) throw new DomainError("存在尚未就绪的素材", "ASSET_NOT_READY");
      const removedActorItemIds = new Set(snapshot.timeline.items.filter((item) => item.trackId === track.id).map((item) => item.id));
      for (const performance of snapshot.actorPerformances) {
        if (removedActorItemIds.has(performance.timelineItemId)) impact.stale.push(performance.id);
      }
      snapshot.actorPerformances = snapshot.actorPerformances.filter((performance) => !removedActorItemIds.has(performance.timelineItemId));
      snapshot.timeline.items = snapshot.timeline.items.filter((item) => item.trackId !== track.id);
      snapshot.scenes = snapshot.scenes.filter((scene) => scene.type !== "PresenterScene");
      let cursor = 0;
      const sceneSize = Math.max(1, input.sceneSize ?? 2);
      for (let index = 0; index < selected.length; index += 1) {
        const asset = selected[index]!;
        const duration = millisecondsToFrames(asset.metadata!.durationMs, snapshot.timeline.fps);
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
        impact.changed.push(item.id);
        cursor = item.endFrame;
      }
      const actorItems = snapshot.timeline.items.filter((item) => item.trackId === track.id);
      for (let start = 0; start < actorItems.length; start += sceneSize) {
        const group = actorItems.slice(start, start + sceneSize);
        const scene = createScene({
          type: "PresenterScene",
          title: `口播场景 ${Math.floor(start / sceneSize) + 1}`,
          purpose: "承载主叙事与人物口播",
          startFrame: group[0]!.startFrame,
          endFrame: group[group.length - 1]!.endFrame,
          assetIds: group.map((item) => item.assetId)
        });
        snapshot.scenes.push(scene);
        for (const item of group) item.sceneId = scene.id;
        impact.changed.push(scene.id);
      }
      impact.recomputed.push("Scene Strip、主轨时长、预览快照");
      impact.dirtyRanges.push({ startFrame: 0, endFrame: cursor, reason: "重建 Presenter 主线" });
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

      const existing = snapshot.actorPerformances.find((candidate) => candidate.timelineItemId === item.id);
      const performance = existing ?? createActorPerformance({
        timelineItemId: item.id,
        source: input.source,
        maskMode: input.maskMode,
        maskAssetId: input.maskAssetId,
        speechAssetId,
        scriptRevision,
        note: input.note
      });
      if (existing) {
        existing.source = input.source;
        existing.maskMode = input.maskMode;
        existing.maskAssetId = input.maskAssetId;
        existing.speechAssetId = speechAssetId;
        existing.scriptRevision = scriptRevision;
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

  createEffectCue(input: { projectId: Id; baseRevision: number; sceneId: Id; type: EffectType; layer: "rear" | "actor" | "front" | "fullscreen"; startFrame: number; endFrame: number; anchorTargetId?: Id; note?: string }): ProjectState {
    const state = this.repository.commit(input.projectId, input.baseRevision, `添加视觉效果：${input.type}`, (snapshot, impact) => {
      const scene = snapshot.scenes.find((candidate) => candidate.id === input.sceneId);
      if (!scene) throw new DomainError("效果所属场景不存在", "SCENE_NOT_FOUND");
      if (input.startFrame < scene.startFrame || input.endFrame > scene.endFrame) {
        throw new DomainError("效果必须位于所属场景内", "CUE_OUT_OF_SCENE");
      }
      if (input.anchorTargetId && !snapshot.speechSegments.some((segment) => segment.id === input.anchorTargetId)) {
        throw new DomainError("效果锚点 SpeechSegment 不存在", "ANCHOR_NOT_FOUND");
      }
      const cue = createEffectCue(input);
      snapshot.effectCues.push(cue);
      impact.changed.push(cue.id);
      impact.dirtyRanges.push({ startFrame: cue.startFrame, endFrame: cue.endFrame, reason: "新增视觉效果" });
    });
    this.publish({ projectId: input.projectId, revision: state.revision.number, type: "revision" });
    return state;
  }

  updateEffectCue(input: { projectId: Id; baseRevision: number; cueId: Id; startFrame?: number; endFrame?: number; intensity?: number; note?: string }): ProjectState {
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
      if (cue.startFrame < scene.startFrame || cue.endFrame > scene.endFrame || cue.endFrame <= cue.startFrame) {
        throw new DomainError("调整后的效果范围无效", "INVALID_CUE_RANGE");
      }
      impact.changed.push(cue.id);
      impact.dirtyRanges.push({ startFrame: cue.startFrame, endFrame: cue.endFrame, reason: "调整视觉效果" });
    });
    this.publish({ projectId: input.projectId, revision: state.revision.number, type: "revision" });
    return state;
  }

  moveItem(input: { projectId: Id; baseRevision: number; itemId: Id; startFrame: number; ripple?: boolean }): ProjectState {
    const state = this.repository.commit(input.projectId, input.baseRevision, "移动时间线片段", (snapshot, impact) => {
      const item = snapshot.timeline.items.find((candidate) => candidate.id === input.itemId);
      if (!item) throw new DomainError("时间线片段不存在", "ITEM_NOT_FOUND");
      const track = snapshot.timeline.tracks.find((candidate) => candidate.id === item.trackId);
      if (!track || track.locked) throw new DomainError("轨道不存在或已锁定", "TRACK_LOCKED");
      const oldStart = item.startFrame;
      const duration = item.endFrame - item.startFrame;
      const delta = input.startFrame - oldStart;
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
          }
        }
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
    snapshot.timeline.captions = speechAsset.timing.segments.map((timing) => {
      const segment = snapshot.speechSegments.find((candidate) => candidate.id === timing.speechSegmentId);
      if (!segment) throw new DomainError("SpeechTiming 引用了不存在的 SpeechSegment", "SPEECH_TIMING_SEGMENT_MISSING");
      return {
        id: createId("caption"),
        speechSegmentId: segment.id,
        text: segment.text,
        startFrame: timing.startFrame,
        endFrame: timing.endFrame,
        style: "stable" as const,
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
      const synced = this.syncSpeechAssetTimeline(snapshot, speechAsset);
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
      impact.recomputed.push("Presenter 主画面、Scene Strip 与旁白时长对齐");
      assertTimelineValid(snapshot);
    });
    this.publish({ projectId: input.projectId, revision: state.revision.number, type: "revision" });
    return state;
  }

  submitExport(input: { projectId: Id; revision?: number; idempotencyKey?: string }): JobRecord {
    const state = this.readProject(input.projectId);
    const revision = input.revision ?? state.revision.number;
    this.repository.getRevision(input.projectId, revision);
    const job = this.repository.createJob({
      projectId: input.projectId,
      kind: "export",
      payload: { revision },
      idempotencyKey: input.idempotencyKey ?? `export:${revision}`
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
