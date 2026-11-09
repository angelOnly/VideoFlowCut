import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { join } from "node:path";
import type { EditingApplication } from "@videocut/application";
import type { EffectCue, JobRecord, MotionContinuationResult, MotionOnSuccess, ProjectSnapshot } from "@videocut/contracts";
import { effectBeatRanges, DomainError } from "@videocut/domain";
import { readRuntimeConfig } from "@videocut/project-overview";
import { processClaimedJob } from "@videocut/job-runtime";
import { motionTargetDependencyHash } from "../../../packages/edit-application/src/motion-adoption.js";
import { frozenMotionBundleSchema, importMotionBundle, readFrozenMotionWork } from "../../../packages/edit-application/src/motion-input.js";
import { resolveMcpWorkspaceContext } from "../../../components/open-design/apps/daemon/src/mcp-workspace-context.js";
import type { MotionAuthoringInput } from "../../../packages/contracts/src/motion-authoring.js";
import { AuthoredMotionValidationError, MotionSourceValidationError } from "../../../packages/contracts/src/authored-motion-manifest-v1.js";
import { ZodError } from "zod";

type Range = { startFrame: number; endFrame: number };
type TargetRange = Range & { sourceStartFrame: number; sourceEndFrame: number };
type OwnedCue = { cueId: string; hash: string };
type PendingOperation = { key: string; target: MotionOnSuccess; endFrame: number; childId?: string };
type Stage = { runId: string; eventId: number; frozenVersion: string; registrationKey: string; registrationRevision?: number; registrationJobId?: string;
  workId?: string; durationInFrames?: number; ranges?: Range[]; rangeIndex: number; cursor?: number; operation?: PendingOperation; adopted?: Range[] };
type AuthoringState = { sequence: number; requestId: string; startRequested?: boolean; runId?: string; activeRunId?: string; cursor: number; seenVersions: string[]; owned: OwnedCue[];
  continuation?: { runId: string; conversationId: string; taskExecutionId: string };
  stage?: Stage; receipts: Array<Record<string, unknown>>; status: string; conflict?: unknown };
type Endpoint = { url: string; headers?: Record<string, string> };
type StageFeedback = { feedbackId: string; status: string; request: { runId: string; frozenVersion: string; range: Range; text: string };
  observedRunId?: string; receivingRunId?: string; message?: string };
const execFileAsync = promisify(execFile);
const locks = new Map<string, Promise<void>>();

/** 与发行启动器使用相同的 sidecar 发现和版本核验，不启动或切换 OD。 */
async function resolveEndpoint(): Promise<Endpoint> {
  const config = readRuntimeConfig(), root = process.cwd(), component = join(root, "components", "open-design");
  const tool = join(component, "tools", "dev", "dist", "index.mjs");
  const result = await execFileAsync(process.execPath, [tool, "status", "daemon", "--namespace", process.env.VIDEOFLOWCUT_OD_NAMESPACE || "videoflowcut",
    "--tools-dev-root", join(config.workspace.root, ".videoflowcut-runtime", "open-design-sidecars"), "--json"], { cwd: component, timeout: 5000, windowsHide: true });
  const state = JSON.parse(result.stdout) as { url?: string };
  if (!state.url) throw new Error("MOTION_AUTHORING_OD_UNAVAILABLE: 画面服务未运行");
  const health = await fetch(new URL("/api/health", state.url), { signal: AbortSignal.timeout(3000) });
  if (!health.ok) throw new Error(`MOTION_AUTHORING_OD_UNAVAILABLE: HTTP ${health.status}`);
  const value = await health.json() as { videoflowcutReleaseId?: string };
  if (config.runtime.releaseId !== "manual" && value.videoflowcutReleaseId !== config.runtime.releaseId) throw new Error("MOTION_AUTHORING_RELEASE_MISMATCH");
  const context = await resolveMcpWorkspaceContext(state.url);
  return { url: state.url.replace(/\/$/u, ""), headers: context?.headers };
}

async function withTargetLock<T>(key: string, operation: () => Promise<T>): Promise<T> {
  const previous = locks.get(key) ?? Promise.resolve();
  let release!: () => void;
  const next = new Promise<void>(resolve => { release = resolve; });
  locks.set(key, next);
  await previous;
  try { return await operation(); }
  finally { release(); if (locks.get(key) === next) locks.delete(key); }
}

class OpenDesignHttpError extends Error {
  readonly code?: string;
  readonly details?: Record<string, unknown>;
  constructor(readonly status: number, detail: string) {
    super(`MOTION_AUTHORING_OD_HTTP: ${status} ${detail}`);
    try {
      const parsed = JSON.parse(detail) as { error?: { code?: string; details?: Record<string, unknown> } };
      this.code = parsed.error?.code;
      this.details = parsed.error?.details;
    } catch { /* 非结构化错误仍保留 HTTP 状态与原文。 */ }
  }
}
class OpenDesignTransportError extends Error {
  constructor(cause: unknown) { super("MOTION_AUTHORING_OD_DISCONNECTED", { cause }); }
}
class AuthorStageError extends Error {
  constructor(readonly code: string, message: string, readonly field?: string) { super(message); }
}
class ChildJobError extends Error {
  constructor(readonly child: JobRecord) { super(`MOTION_AUTHORING_CHILD_${child.status.toUpperCase()}: ${child.error ?? child.id}`); }
}
function authorStageError(error: unknown): AuthorStageError | undefined {
  if (error instanceof ZodError) return new AuthorStageError("MOTION_MANIFEST_INVALID", error.issues.map(issue => `${issue.path.join(".")}: ${issue.message}`).join("；"), error.issues[0]?.path.join("."));
  if (error instanceof AuthoredMotionValidationError) return new AuthorStageError(error.code, error.message, error.field);
  if (error instanceof SyntaxError) return new AuthorStageError("MOTION_MANIFEST_INVALID", error.message);
  if (error instanceof MotionSourceValidationError) return new AuthorStageError(error.code, error.message, `${error.location.line}:${error.location.column}`);
  if (error instanceof ChildJobError) {
    if (error.child.status === "unknown") throw new DomainError("阶段子任务结果未知，请先核对原任务", "EXTERNAL_RUN_OUTCOME_UNKNOWN");
    const diagnostic = error.child.result?.diagnostic as { code?: unknown } | undefined;
    const code = String(diagnostic?.code ?? "");
    if (["MOTION_SOURCE_INVALID", "MOTION_COMPOSITION_INVALID", "MOTION_COMPOSITION_MISMATCH", "MOTION_RESOURCE_INVALID", "MOTION_IMPORT_REJECTED", "MOTION_DOM_REJECTED"].includes(code)) return new AuthorStageError(code, error.child.error ?? code);
    return undefined;
  }
  if (error instanceof Error) {
    const code = "code" in error ? String(error.code) : /^([A-Z_]+)(?::|$)/u.exec(error.message)?.[1];
    if (code && ["MOTION_MANIFEST_RANGE_INVALID", "MOTION_BUNDLE_RANGE_INVALID", "MOTION_BUNDLE_AUTHOR_FIELD_INVALID", "ASSET_NOT_FOUND", "MOTION_IMAGE_NOT_READY", "MOTION_VIDEO_NOT_READY", "MOTION_VIDEO_SOURCE_RANGE", "MOTION_FONT_UNKNOWN", "MOTION_CREATIVE_BRIEF_REQUIRED", "MOTION_SOURCE_INVALID", "MOTION_COMPOSITION_INVALID", "MOTION_COMPOSITION_MISMATCH", "MOTION_RESOURCE_INVALID", "MOTION_IMPORT_REJECTED", "MOTION_DOM_REJECTED"].includes(code)) return new AuthorStageError(code, error.message);
  }
  return undefined;
}
function canReconnect(error: unknown): boolean {
  return error instanceof OpenDesignTransportError || error instanceof OpenDesignHttpError && error.status >= 500;
}
async function jsonRequest(endpoint: Endpoint, path: string, signal: AbortSignal, body?: unknown): Promise<Record<string, unknown>> {
  let response: Response;
  try {
    response = await fetch(`${endpoint.url}${path}`, { method: body === undefined ? "GET" : "POST",
      headers: { ...endpoint.headers, ...(body === undefined ? {} : { "content-type": "application/json" }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.any([signal, AbortSignal.timeout(15000)]) });
  } catch (error) { if (signal.aborted) throw error; throw new OpenDesignTransportError(error); }
  let bodyText: string;
  try { bodyText = await response.text(); }
  catch (error) { if (signal.aborted) throw error; throw new OpenDesignTransportError(error); }
  if (!response.ok) throw new OpenDesignHttpError(response.status, bodyText);
  return JSON.parse(bodyText) as Record<string, unknown>;
}

/** OD 事件日志提供跨进程游标；只在完成本条交件后推进该游标。 */
async function* events(endpoint: Endpoint, runId: string, cursor: number, signal: AbortSignal): AsyncGenerator<{ id: number; event: string; data: unknown }> {
  let response: Response;
  try { response = await fetch(`${endpoint.url}/api/runs/${encodeURIComponent(runId)}/events?after=${cursor}`, { headers: endpoint.headers, signal }); }
  catch (error) { if (signal.aborted) throw error; throw new OpenDesignTransportError(error); }
  if (!response.ok) throw new OpenDesignHttpError(response.status, "事件流不可用");
  if (!response.body) throw new Error("MOTION_AUTHORING_EVENTS_UNAVAILABLE: 空事件流");
  const reader = response.body.getReader(), decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      let part: ReadableStreamReadResult<Uint8Array>;
      try { part = await reader.read(); }
      catch (error) { if (signal.aborted) throw error; throw new OpenDesignTransportError(error); }
      if (part.done) break;
      buffer = (buffer + decoder.decode(part.value, { stream: true })).replaceAll("\r\n", "\n");
      let boundary: number;
      while ((boundary = buffer.indexOf("\n\n")) >= 0) {
        const block = buffer.slice(0, boundary); buffer = buffer.slice(boundary + 2);
        let id = 0, event = "message"; const data: string[] = [];
        for (const line of block.split("\n")) {
          if (line.startsWith("id:")) id = Number(line.slice(3).trim());
          else if (line.startsWith("event:")) event = line.slice(6).trim();
          else if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
        }
        if (!Number.isSafeInteger(id) || id <= cursor || !data.length) continue;
        yield { id, event, data: JSON.parse(data.join("\n")) };
      }
    }
  } finally { await reader.cancel().catch(() => undefined); reader.releaseLock(); }
}

async function waitChild(app: EditingApplication, id: string, signal: AbortSignal): Promise<JobRecord> {
  while (true) {
    signal.throwIfAborted();
    const job = app.trackJob(id);
    if (job.status === "succeeded") return job;
    if (["failed", "cancelled", "unknown"].includes(job.status)) throw new ChildJobError(job);
    await new Promise(resolve => setTimeout(resolve, 250));
  }
}

function readyProjectRanges(ready: Range[], target: TargetRange, projectFps: number, workFps: number): Range[] {
  const ranges = ready.map(range => {
    const sourceStart = Math.max(target.sourceStartFrame, Math.ceil(range.startFrame * projectFps / workFps));
    const sourceEnd = Math.min(target.sourceEndFrame, Math.ceil(range.endFrame * projectFps / workFps));
    return { startFrame: target.startFrame + sourceStart - target.sourceStartFrame, endFrame: target.startFrame + sourceEnd - target.sourceStartFrame };
  }).filter(range => range.endFrame > range.startFrame).sort((a, b) => a.startFrame - b.startFrame);
  const merged: Range[] = [];
  for (const range of ranges) {
    const last = merged.at(-1);
    if (last && range.startFrame <= last.endFrame) last.endFrame = Math.max(last.endFrame, range.endFrame);
    else merged.push({ ...range });
  }
  return merged;
}

function existingHash(snapshot: ProjectSnapshot, cueId: string): string {
  return motionTargetDependencyHash(snapshot, { action: "replace_cue", cueId, audioPolicy: "rebind_unchanged_events" });
}

/** 阶段状态和子任务身份均写回原 Job，重启后不会重启作者或重复采用。 */
export async function runMotionAuthoringJob(app: EditingApplication, job: JobRecord, signal: AbortSignal, endpointOverride?: Endpoint): Promise<Record<string, unknown>> {
  if (job.kind !== "motion_authoring") throw new Error("MOTION_AUTHORING_JOB_INVALID");
  const input = job.payload.input as MotionAuthoringInput, target = input.target, targetRange = job.payload.targetRange as TargetRange;
  const projectFps = Number(job.payload.projectFps), initialHash = String(job.payload.initialTargetHash);
  let state = app.trackJob(job.id).result?.authoring as AuthoringState | undefined;
  state ??= { sequence: 0, requestId: job.id.replace(/^job_/u, ""), cursor: 0, seenVersions: [], receipts: [], status: "starting",
    owned: target.action === "create_cue" ? [] : [{ cueId: target.cueId, hash: initialHash }] };
  const save = () => { state!.sequence++; app.recordJobCheckpoint(job.id, { authoring: state }); };
  let endpoint = endpointOverride ?? await resolveEndpoint();
  const lockKey = `${job.projectId}:${target.action === "create_cue" ? `${target.sceneId}:${target.layer}` : target.cueId}`;
  const sourceRequest = input.openDesignRequest;
  try {
    if (!state.runId) {
      const body = { projectId: sourceRequest.project, clientRequestId: state.requestId, message: sourceRequest.prompt, currentPrompt: sourceRequest.prompt,
        ...(sourceRequest.skill ? { skillId: sourceRequest.skill } : {}), ...(sourceRequest.skills ? { skillIds: sourceRequest.skills } : {}),
        ...(sourceRequest.plugin ? { pluginId: sourceRequest.plugin } : {}), ...(sourceRequest.inputs ? { pluginInputs: sourceRequest.inputs } : {}),
        ...(sourceRequest.agent ? { agentId: sourceRequest.agent } : {}), ...(sourceRequest.model ? { model: sourceRequest.model } : {}),
        ...(sourceRequest.serviceTier ? { serviceTier: sourceRequest.serviceTier } : {}) };
      while (!state.runId) {
        signal.throwIfAborted();
        try {
          if (state.startRequested) {
            const listed = await jsonRequest(endpoint, `/api/runs?projectId=${encodeURIComponent(sourceRequest.project)}`, signal);
            if (!Array.isArray(listed.runs)) throw new Error("MOTION_AUTHORING_RUN_LIST_INVALID");
            const matches = listed.runs.filter((item): item is { id: string; clientRequestId: string } => Boolean(item && typeof item === "object"
              && (item as { clientRequestId?: unknown }).clientRequestId === state!.requestId && typeof (item as { id?: unknown }).id === "string"));
            if (matches.length > 1) throw new DomainError("原请求对应多个作者 Run，不能自动选择", "EXTERNAL_RUN_OUTCOME_UNKNOWN");
            if (matches.length === 1) { state.runId = matches[0]!.id; break; }
          }
          if (sourceRequest.continue_from_run_id && !state.continuation) {
            const run = await jsonRequest(endpoint, `/api/runs/${encodeURIComponent(sourceRequest.continue_from_run_id)}`, signal);
            const task = run.strategyTask as { taskExecutionId?: unknown } | undefined;
            if (run.projectId !== sourceRequest.project || typeof run.conversationId !== "string" || !run.conversationId
              || typeof task?.taskExecutionId !== "string" || !task.taskExecutionId) {
              throw new DomainError("续修来源 Run 与项目不符或缺少制作任务身份", "MOTION_AUTHORING_CONTINUATION_INVALID");
            }
            state.continuation = { runId: sourceRequest.continue_from_run_id, conversationId: run.conversationId, taskExecutionId: task.taskExecutionId };
            save();
          }
          state.startRequested = true; state.status = "starting"; save();
          const started = await jsonRequest(endpoint, "/api/runs", signal, { ...body,
            ...(state.continuation ? { conversationId: state.continuation.conversationId, taskExecutionId: state.continuation.taskExecutionId } : {}) });
          if (typeof started.runId !== "string" || !started.runId) throw new DomainError("作者请求未返回 Run 身份", "EXTERNAL_RUN_OUTCOME_UNKNOWN");
          state.runId = started.runId;
        } catch (error) {
          if (signal.aborted || !canReconnect(error)) throw error;
          // 查询原请求身份后才以相同幂等键重试，不创建第二个作者。
          state.status = "start_reconciling"; save();
          await new Promise(resolve => setTimeout(resolve, 1000));
          if (!endpointOverride) { try { endpoint = await resolveEndpoint(); } catch { /* 保留原请求并继续对账。 */ } }
        }
      }
      state.status = "running"; save();
    }
    const logicalRunId = state.runId;
    if (!state.activeRunId) { state.activeRunId = logicalRunId; save(); }
    const processStage = async () => withTargetLock(lockKey, async () => {
      const stage = state!.stage!;
      const stageRunId = stage.runId;
      const path = `/api/runs/${encodeURIComponent(stageRunId)}/frozen-work/${encodeURIComponent(stage.frozenVersion)}?project=${encodeURIComponent(sourceRequest.project)}`;
      const bundle = frozenMotionBundleSchema.parse(await jsonRequest(endpoint, path, signal));
      if (bundle.receipt.run_id !== stageRunId || bundle.receipt.project !== sourceRequest.project || bundle.receipt.frozen_version !== stage.frozenVersion) throw new Error("MOTION_AUTHORING_FROZEN_MISMATCH");
      try {
        const duration = (JSON.parse(Buffer.from(bundle.manifest_base64, "base64").toString("utf8")) as { work?: { durationInFrames?: unknown } }).work?.durationInFrames;
        if (typeof duration === "number" && Number.isSafeInteger(duration) && duration > 0) stage.durationInFrames = duration;
      } catch { /* 清单本身无效时由导入校验给出原因。 */ }
      const root = app.readProject(job.projectId).snapshot.project.rootPath;
      let imported: Awaited<ReturnType<typeof importMotionBundle>>;
      try { imported = await importMotionBundle(root, job.projectId, stage.registrationKey, bundle); }
      catch (error) { throw authorStageError(error) ?? error; }
      const loaded = await readFrozenMotionWork(root, imported.bundle_path, imported.manifest_sha256);
      // 同内容可复用字节，但来源身份必须指向本次实际收到的 Run。
      loaded.inputBundle.source = { project: bundle.receipt.project, run_id: stageRunId, frozen_version: stage.frozenVersion };
      let registration = stage.registrationJobId ? app.trackJob(stage.registrationJobId)
        : app.listJobs(job.projectId).find(item => item.idempotencyKey === `motion:${stage.registrationKey}`);
      if (!registration) {
        stage.registrationRevision = app.readProject(job.projectId).revision.number; save();
        try { registration = app.registerMotionWork({ projectId: job.projectId, baseRevision: stage.registrationRevision, idempotencyKey: stage.registrationKey,
          work: loaded.work, readyRanges: loaded.readyRanges, inputBundle: loaded.inputBundle }); }
        catch (error) { throw authorStageError(error) ?? error; }
      }
      if (!stage.registrationJobId) { stage.registrationJobId = registration.id; state!.status = "registering"; save(); }
      try { registration = await waitChild(app, registration.id, signal); }
      catch (error) { throw authorStageError(error) ?? error; }
      if (typeof registration.result?.workId !== "string") throw new Error("MOTION_AUTHORING_WORK_MISSING");
      stage.workId = registration.result.workId;
      const work = app.readSourceMotionWork(job.projectId, stage.workId).work;
      if (projectFps !== app.readProject(job.projectId).snapshot.timeline.fps) throw new Error("MOTION_AUTHORING_TARGET_CONFLICT: 项目帧率已变化");
      stage.ranges ??= readyProjectRanges(work.readyRanges, targetRange, projectFps, work.fps);
      stage.adopted ??= [];
      state!.status = "adopting"; save();
      while (stage.rangeIndex < stage.ranges.length) {
        signal.throwIfAborted();
        const range = stage.ranges[stage.rangeIndex]!;
        const position = stage.cursor ?? range.startFrame;
        if (position >= range.endFrame) { stage.rangeIndex++; stage.cursor = undefined; save(); continue; }
        if (!stage.operation) {
          const current = app.readProject(job.projectId), snapshot = current.snapshot;
          if (target.action === "create_cue") {
            const own = new Set(state!.owned.map(item => item.cueId));
            const base = { ...snapshot, effectCues: snapshot.effectCues.filter(cue => !own.has(cue.id)) };
            if (motionTargetDependencyHash(base, target) !== initialHash) throw new Error("MOTION_AUTHORING_TARGET_CONFLICT: 目标场面或相关内容已改变");
          }
          const currentCues = state!.owned.map(entry => snapshot.effectCues.find(cue => cue.id === entry.cueId)).filter((cue): cue is EffectCue => Boolean(cue));
          if (currentCues.length !== state!.owned.length) throw new Error("MOTION_AUTHORING_TARGET_CONFLICT: 已采用画面已改变");
          const cue = currentCues.find(item => item.startFrame <= position && item.endFrame > position);
          let action: MotionOnSuccess, endFrame: number;
          if (cue) {
            const saved = state!.owned.find(item => item.cueId === cue.id)!;
            if (existingHash(snapshot, cue.id) !== saved.hash) throw new Error("MOTION_AUTHORING_TARGET_CONFLICT: 目标画面或关联声音已改变");
            endFrame = Math.min(cue.endFrame, range.endFrame);
            action = position === cue.startFrame && endFrame === cue.endFrame
              ? { action: "replace_cue", cueId: cue.id, audioPolicy: "rebind_unchanged_events" }
              : { action: "replace_range", cueId: cue.id, targetRange: { startFrame: position, endFrame }, audioPolicy: "rebind_unchanged_events" };
          } else {
            if (target.action !== "create_cue") throw new Error("MOTION_AUTHORING_TARGET_CONFLICT: 原目标范围不完整");
            endFrame = Math.min(range.endFrame, ...currentCues.filter(item => item.startFrame > position).map(item => item.startFrame));
            const sourceStartFrame = targetRange.sourceStartFrame + position - targetRange.startFrame;
            const coveredNarrativeBeatIds = target.coveredNarrativeBeatIds?.filter(id => effectBeatRanges(snapshot, id, target.sceneId)
              .some(item => item.startFrame < endFrame && item.endFrame > position));
            const replacesActorItemIds = target.visualComposition?.replacesActorItemIds.filter(id => snapshot.timeline.items.some(item => item.id === id && item.startFrame < endFrame && item.endFrame > position));
            action = { ...target, startFrame: position, endFrame, sourceStartFrame, sourceEndFrame: sourceStartFrame + endFrame - position,
              ...(coveredNarrativeBeatIds ? { coveredNarrativeBeatIds } : {}),
              ...(target.visualComposition ? { visualComposition: { role: "primary", replacesActorItemIds: replacesActorItemIds ?? [] } } : {}) };
          }
          stage.operation = { key: `${job.id}:${stageRunId}:${stage.eventId}:${stage.rangeIndex}:${position}`, target: action, endFrame }; save();
        }
        const operation = stage.operation;
        let child = operation.childId ? app.trackJob(operation.childId) : app.listJobs(job.projectId).find(item => item.idempotencyKey === `motion-adoption:${operation.key}`);
        if (!child) child = app.submitMotionAdoption({ projectId: job.projectId, baseRevision: app.readProject(job.projectId).revision.number,
          workId: stage.workId, target: operation.target, idempotencyKey: operation.key });
        if (!operation.childId) { operation.childId = child.id; save(); }
        child = await waitChild(app, child.id, signal);
        const result = child.result?.continuation as MotionContinuationResult | undefined;
        if (!result || result.status !== "applied") { state!.conflict = result ?? "未返回采用结果"; save(); throw new Error("MOTION_AUTHORING_TARGET_CONFLICT: 作品已登记但未采用"); }
        const current = app.readProject(job.projectId).snapshot;
        if (operation.target.action !== "create_cue") {
          const oldCueId = operation.target.cueId;
          state!.owned = state!.owned.filter(item => item.cueId !== oldCueId);
        }
        for (const segment of result.cueSegments.segments) state!.owned.push({ cueId: segment.cueId, hash: existingHash(current, segment.cueId) });
        stage.adopted.push({ startFrame: position, endFrame: operation.endFrame });
        stage.cursor = operation.endFrame; stage.operation = undefined; save();
      }
      const latest = app.readProject(job.projectId), currentCues = state!.owned.map(item => latest.snapshot.effectCues.find(cue => cue.id === item.cueId)).filter((cue): cue is EffectCue => Boolean(cue));
      const frames = [...new Set(stage.adopted.flatMap(range => [range.startFrame, Math.floor((range.startFrame + range.endFrame - 1) / 2), range.endFrame - 1])
        .map(frame => Math.floor((targetRange.sourceStartFrame + frame - targetRange.startFrame) * work.fps / projectFps)))];
      const inspectionKey = `${job.id}:${stageRunId}:${stage.eventId}`;
      const inspection = frames.length ? app.listJobs(job.projectId).find(item => item.idempotencyKey === `motion-inspection:${inspectionKey}`)
        ?? app.submitMotionInspection({ projectId: job.projectId, revision: latest.revision.number, workId: work.id, frames, idempotencyKey: inspectionKey }) : undefined;
      const editor = new URL("/", readRuntimeConfig().http.webOrigin);
      editor.searchParams.set("projectId", job.projectId); editor.searchParams.set("revision", String(latest.revision.number));
      if (currentCues[0]) { editor.searchParams.set("effectCueId", currentCues[0].id); editor.searchParams.set("frame", String(currentCues[0].startFrame)); }
      state!.receipts.push({ runId: stageRunId, eventId: stage.eventId, frozenVersion: stage.frozenVersion, workId: work.id, revision: latest.revision.number,
        cueId: currentCues[0]?.id, cueIds: currentCues.map(cue => cue.id), ranges: stage.adopted, editorUrl: editor.toString(), ...(inspection ? { inspectionJobId: inspection.id } : {}) });
      state!.seenVersions.push(stage.frozenVersion); state!.cursor = Math.max(state!.cursor, stage.eventId); state!.stage = undefined; state!.status = "running"; save();
    });
    const reconnect = async (error: unknown) => {
      if (signal.aborted || !canReconnect(error)) throw error;
      state!.status = "disconnected"; save();
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (!endpointOverride) { try { endpoint = await resolveEndpoint(); } catch { /* 按原 Run 和游标继续等待。 */ } }
    };
    const sendFeedback = async (receipt: Record<string, unknown>, feedback: StageFeedback) => {
      try {
        const { runId, ...body } = feedback.request;
        const response = await jsonRequest(endpoint, `/api/runs/${encodeURIComponent(runId)}/steer`, signal, { feedbackId: feedback.feedbackId, ...body });
        const accepted = response.feedback as { state?: string; observedRunId?: string; receivingRunId?: string } | undefined;
        receipt.feedback = { ...feedback, status: accepted?.state ?? "accepted", observedRunId: accepted?.observedRunId ?? runId,
          ...(accepted?.receivingRunId ? { receivingRunId: accepted.receivingRunId } : {}) };
      } catch (error) {
        if (signal.aborted) throw error;
        const details = error instanceof OpenDesignHttpError ? error.details : undefined;
        const previousState = error instanceof OpenDesignHttpError && error.code === "RUN_STEERING_PREVIOUS_RESULT" ? details?.state : undefined;
        const status = typeof previousState === "string" ? previousState
          : details?.refusal === "delivery_unknown" ? "unknown"
          : error instanceof OpenDesignHttpError && error.status < 500 ? "rejected" : "unknown";
        receipt.feedback = { ...feedback, status,
          ...(typeof details?.observedRunId === "string" ? { observedRunId: details.observedRunId } : {}),
          ...(typeof details?.receivingRunId === "string" ? { receivingRunId: details.receivingRunId } : {}),
          message: error instanceof Error ? error.message : String(error) };
      }
      save();
    };
    const reconcileFeedback = async (receipt: Record<string, unknown>) => {
      const feedback = receipt.feedback as StageFeedback | undefined;
      if (!feedback?.request || !["pending", "unknown"].includes(feedback.status)) return;
      try {
        const run = await jsonRequest(endpoint, `/api/runs/${encodeURIComponent(feedback.request.runId)}`, signal);
        if (run.projectId !== sourceRequest.project || typeof run.conversationId !== "string" || !run.conversationId) {
          throw new Error("反馈原 Run 缺少匹配的项目或会话");
        }
        const path = `/api/projects/${encodeURIComponent(sourceRequest.project)}/conversations/${encodeURIComponent(run.conversationId)}/messages`;
        const response = await jsonRequest(endpoint, path, signal);
        if (!Array.isArray(response.messages)) throw new Error("反馈记录不可用");
        const message = response.messages.find((item: { id?: unknown }) => item.id === feedback.feedbackId) as { content?: unknown; runContext?: { motionFeedback?: Record<string, unknown> } } | undefined;
        if (!message) { await sendFeedback(receipt, feedback); return; }
        const recorded = message.runContext?.motionFeedback;
        if (message.content !== feedback.request.text || recorded?.runId !== feedback.request.runId
          || recorded?.frozenVersion !== feedback.request.frozenVersion || JSON.stringify(recorded?.range) !== JSON.stringify(feedback.request.range)) {
          receipt.feedback = { ...feedback, status: "rejected", message: "反馈身份与原记录不一致" }; save(); return;
        }
        const status = typeof recorded.state === "string" ? recorded.state : "unknown";
        const next = { ...feedback, status,
          ...(typeof recorded.observedRunId === "string" ? { observedRunId: recorded.observedRunId } : {}),
          ...(typeof recorded.receivingRunId === "string" ? { receivingRunId: recorded.receivingRunId } : {}) };
        if (JSON.stringify(next) !== JSON.stringify(feedback)) { receipt.feedback = next; save(); }
      } catch (error) {
        if (signal.aborted) throw error;
        // 查询失败时保留原请求和待对账状态，避免盲目重发。
      }
    };
    const handleStageFailure = async (error: unknown) => {
      if (!(error instanceof AuthorStageError) || !state!.stage) { await reconnect(error); return; }
      const stage = state!.stage;
      const feedbackId = `${job.id}:${stage.runId}:${stage.eventId}:rejected`;
      const feedback: StageFeedback = { feedbackId, status: "pending", request: { runId: stage.runId, frozenVersion: stage.frozenVersion,
        range: { startFrame: 0, endFrame: stage.durationInFrames ?? 1 }, text: `阶段作品未能登记，请修正后发布新版本。${error.code}：${error.message}` } };
      const receipt: Record<string, unknown> = { runId: stage.runId, eventId: stage.eventId, frozenVersion: stage.frozenVersion,
        status: "rejected", code: error.code, message: error.message, ...(error.field ? { field: error.field } : {}), ranges: stage.adopted ?? [],
        feedback };
      state!.receipts.push(receipt);
      state!.seenVersions.push(stage.frozenVersion);
      state!.cursor = Math.max(state!.cursor, stage.eventId);
      state!.stage = undefined;
      state!.status = "awaiting_correction";
      save();
      await sendFeedback(receipt, feedback);
    };
    let terminalRun: { id: string; status: Record<string, unknown> } | undefined;
    while (true) {
      signal.throwIfAborted();
      for (const receipt of state.receipts) await reconcileFeedback(receipt);
      // 断线或重启后先续接已保存的阶段，避免重放事件覆盖未完成的采用进度。
      if (state.stage) {
        try { await processStage(); } catch (error) { await handleStageFailure(error); continue; }
      }
      const activeRunId: string = state.activeRunId!;
      const cachedTerminal = terminalRun?.id === activeRunId;
      let status: Record<string, unknown>;
      if (cachedTerminal) status = terminalRun!.status;
      else {
        const pendingFeedback = state.receipts.some(receipt => ["pending", "unknown"].includes((receipt.feedback as StageFeedback | undefined)?.status ?? ""));
        const eventSignal = pendingFeedback ? AbortSignal.any([signal, AbortSignal.timeout(5000)]) : signal;
        try { for await (const event of events(endpoint, activeRunId, state.cursor, eventSignal)) {
          if (event.event === "frozen_work") {
            const data = event.data as { frozen_version?: unknown; run_id?: unknown; project?: unknown };
            if (typeof data.frozen_version !== "string" || data.run_id !== activeRunId || data.project !== sourceRequest.project) throw new Error("MOTION_AUTHORING_FROZEN_MISMATCH");
            if (!state.seenVersions.includes(data.frozen_version)) {
              state.stage = { runId: activeRunId, eventId: event.id, frozenVersion: data.frozen_version, registrationKey: `${job.id}:${activeRunId}:${event.id}`, rangeIndex: 0 };
              save(); await processStage();
            }
          }
          state.cursor = Math.max(state.cursor, event.id);
        } } catch (error) {
          if (eventSignal.aborted && !signal.aborted) continue;
          await handleStageFailure(error); continue;
        }
        try { status = await jsonRequest(endpoint, `/api/runs/${encodeURIComponent(activeRunId)}`, signal); }
        catch (error) { await reconnect(error); continue; }
      }
      if (typeof status.status !== "string") throw new Error("MOTION_AUTHORING_STATUS_INVALID");
      if (["succeeded", "failed", "canceled", "cancelled"].includes(String(status.status))) {
        terminalRun = { id: activeRunId, status };
        let logical = status;
        if (activeRunId !== logicalRunId || cachedTerminal) {
          try { logical = await jsonRequest(endpoint, `/api/runs/${encodeURIComponent(logicalRunId)}`, signal); }
          catch (error) { await reconnect(error); continue; }
        }
        const task = logical.strategyTask && typeof logical.strategyTask === "object" && !Array.isArray(logical.strategyTask)
          ? logical.strategyTask as { terminal?: unknown; activeRunId?: unknown; outcome?: unknown } : undefined;
        if (activeRunId !== logicalRunId && !task) throw new Error("MOTION_AUTHORING_LINEAGE_INVALID: 无法核对自动续作身份");
        if (task && typeof task.activeRunId === "string" && task.activeRunId !== activeRunId) {
          // OD 自动续作是原逻辑任务的新物理轮次；游标按各自 Run 独立保存。
          state.activeRunId = task.activeRunId; state.cursor = 0; state.status = "continuing"; terminalRun = undefined; save();
          continue;
        }
        if (task && task.terminal === false) { await new Promise(resolve => setTimeout(resolve, 500)); continue; }
        if (task && (task.terminal !== true || task.outcome !== "completed")) {
          state.status = "incomplete"; state.conflict = { outcome: task.outcome ?? "unknown", reason: "原逻辑制作任务未完成" }; save();
          return { authoring: state };
        }
        if (status.status !== "succeeded") throw new Error(`MOTION_AUTHORING_OD_${String(status.status).toUpperCase()}`);
        const latestWorkId = state.receipts.at(-1)?.workId;
        const snapshot = app.readProject(job.projectId).snapshot;
        const ranges = state.owned.map(item => snapshot.effectCues.find(cue => cue.id === item.cueId))
          .filter((cue): cue is EffectCue => Boolean(cue && cue.workId === latestWorkId))
          .sort((a, b) => a.startFrame - b.startFrame);
        let covered = targetRange.startFrame;
        for (const range of ranges) if (range.startFrame <= covered && range.endFrame > covered) covered = range.endFrame;
        state.status = covered >= targetRange.endFrame ? "succeeded" : "incomplete"; save();
        return { authoring: state };
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  } finally {
    if (state.runId && app.trackJob(job.id).status === "cancelled") {
      try { await jsonRequest(endpoint, `/api/runs/${encodeURIComponent(state.runId)}/cancel`, AbortSignal.timeout(5000), {}); } catch { /* 原 Run 的取消状态需由调用方读回。 */ }
    }
  }
}

/** 同时跟进不同目标的作者任务；等待 OD 不占媒体或渲染 Worker。 */
export async function runMotionAuthoringWorkerForever(app: EditingApplication, signal: AbortSignal): Promise<void> {
  const active = new Set<Promise<void>>();
  while (!signal.aborted) {
    const job = app.claimNextJob(["motion_authoring"], 60_000);
    if (job) {
      const task = processClaimedJob(app, job, (current, currentSignal) => runMotionAuthoringJob(app, current, currentSignal!), 60_000, signal).then(() => {
        const stopped = app.trackJob(job.id);
        if (signal.aborted && stopped.status === "failed" && stopped.error?.includes("JOB_WORKER_STOPPED")) app.updateJob(job.id, { status: "queued" });
      });
      active.add(task); void task.finally(() => active.delete(task));
    } else await new Promise(resolve => setTimeout(resolve, 500));
  }
  await Promise.allSettled(active);
}
