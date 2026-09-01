import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type {
  Asset,
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
  SpeechAsset,
  SpeechSegmentAsset,
  SpeechTiming,
  TimelineItem
} from "@videocut/contracts";
import {
  assetById,
  assertTimelineValid,
  cloneSnapshot,
  compileSpeechSegments,
  createEffectCue,
  createId,
  createMediaAsset,
  createProjectSnapshot,
  createScene,
  createSemanticUnits,
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
      snapshot: JSON.parse(row.snapshot_json) as ProjectSnapshot,
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
      const snapshot = JSON.parse(revisionRow.snapshot_json) as ProjectSnapshot;
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

  applyTranscript(input: { projectId: Id; assetId: Id; text: string; bridgeRunId?: string; schemaVersion?: string; source?: "funasr" | "manual" }): ProjectState {
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

  submitVoiceSynthesis(input: { projectId: Id; voiceReferenceAssetId: Id; speechSegmentIds?: Id[]; idempotencyKey?: string }): JobRecord {
    const state = this.readProject(input.projectId);
    const voiceReference = assetById(state.snapshot, input.voiceReferenceAssetId);
    if (voiceReference.kind !== "audio" || voiceReference.status !== "ready") {
      throw new DomainError("VoiceReference 必须是已就绪的音频素材", "INVALID_VOICE_REFERENCE");
    }
    const segments = input.speechSegmentIds ?? state.snapshot.speechSegments.filter((segment) => segment.status !== "ready").map((segment) => segment.id);
    if (segments.length === 0) throw new DomainError("没有需要生成的 SpeechSegment", "NO_SPEECH_SEGMENTS");
    const job = this.repository.createJob({
      projectId: input.projectId,
      kind: "voice_synthesis",
      payload: { voiceReferenceAssetId: input.voiceReferenceAssetId, speechSegmentIds: segments, scriptRevision: state.snapshot.script.revision },
      idempotencyKey: input.idempotencyKey ?? `voice:${state.snapshot.script.revision}:${segments.join(",")}`
    });
    this.publish({ projectId: input.projectId, revision: state.revision.number, type: "job" });
    return job;
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
      snapshot.speechAsset = speechAsset;
      snapshot.timeline.captions = speechAsset.timing.segments.map((timing) => {
        const segment = snapshot.speechSegments.find((candidate) => candidate.id === timing.speechSegmentId)!;
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
      impact.changed.push(speechAsset.id, ...input.segmentAssets.map((segmentAsset) => segmentAsset.id));
      impact.recomputed.push("segment_exact SpeechTiming、稳定短句字幕");
      impact.dirtyRanges.push({ startFrame: 0, endFrame: snapshot.timeline.durationInFrames, reason: "旁白时序更新" });
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
