import { mkdir, readdir, rename, rm } from "node:fs/promises";
import { basename, join } from "node:path";
import type { EditingApplication } from "@videocut/application";
import { BridgeError, ComfyUIBridgeClient, type BridgeOutput, type BridgeRun, type BridgeWorkflow } from "@videocut/bridge";
import type { BridgeRunAudit, GeneratedAudioFile, JobRecord, SfxGenerationPayload } from "@videocut/contracts";
import { DomainError } from "@videocut/domain";
import { assertSfxRequestCurrent, readSfxPayload } from "../../../packages/edit-application/src/sfx-generation.js";
import { digest } from "../../../packages/media-intelligence/src/index.js";
import { inspectGeneratedAudioFile, extensionForGeneratedAudio } from "./generated-audio.js";
import { restoreModelCheckpoints } from "./model-http.js";

interface SfxCheckpoint {
  status: "submitting" | "running" | "succeeded" | "failed";
  identity: string;
  sourceJobId: string;
  attemptJobId: string;
  workflowId: string;
  schemaVersion: string;
  submittedAt: string;
  runId?: string;
  audit?: BridgeRunAudit;
  run?: BridgeRun;
  localAudio?: GeneratedAudioFile;
}

/** 已明确的工作流按字段 ID 适配，不能把最大时长误识别成音乐的精确时长。 */
export function buildSfxBridgeRequest(payload: Pick<SfxGenerationPayload, "workflowId" | "prompt" | "maxDurationSeconds" | "seed">, workflow: BridgeWorkflow) {
  const badSchema = (detail: string): never => { throw new DomainError(`Stable Audio 接口不匹配：${detail}`, "SFX_SCHEMA_INVALID"); };
  if (workflow.id !== payload.workflowId || !workflow.schemaVersion) badSchema("工作流或版本不可用");
  if (!payload.prompt.trim() || !Number.isInteger(payload.maxDurationSeconds) || payload.maxDurationSeconds < 1 || payload.maxDurationSeconds > 120
    || !Number.isSafeInteger(payload.seed) || payload.seed < 0) badSchema("生成参数超出业务范围");
  const labels = ["提示词（英文）", "最大时长（秒）", "随机种子"];
  const fields = labels.map((label) => {
    const matches = workflow.fields.filter((field) => field.label === label);
    if (matches.length !== 1) return badSchema(`缺少唯一字段 ${label}`);
    return matches[0]!;
  });
  if (fields[0]!.kind !== "text" || fields[1]!.kind !== "number" || fields[2]!.kind !== "number") badSchema("字段类型改变");
  const values: Record<string, unknown> = { [fields[0]!.id]: payload.prompt, [fields[1]!.id]: payload.maxDurationSeconds, [fields[2]!.id]: payload.seed };
  for (const field of fields.slice(1)) {
    const value = Number(values[field.id]);
    if (field.min !== undefined && value < field.min || field.max !== undefined && value > field.max) badSchema(`${field.label} 超出实时范围`);
    if (field.step !== undefined && Math.abs((value - (field.min ?? 0)) / field.step - Math.round((value - (field.min ?? 0)) / field.step)) > 1e-7) badSchema(`${field.label} 不符合实时步长`);
  }
  if (workflow.fields.some((field) => field.required && !(field.id in values) && field.defaultValue === undefined)
    || workflow.itemSlots.some((slot) => slot.min > 0)) badSchema("出现新的必填输入");
  if (workflow.outputs.filter((output) => output.mediaKinds.includes("audio")).length !== 1) badSchema("缺少唯一音频输出槽");
  return { fieldValues: values };
}

async function localAudio(root: string, checkpoint: SfxCheckpoint): Promise<GeneratedAudioFile | undefined> {
  const directory = join(root, "assets", "sfx", checkpoint.sourceJobId);
  const names = await readdir(directory).catch((error: NodeJS.ErrnoException) => { if (error.code === "ENOENT") return []; throw error; });
  // 只恢复本次提交已经原子写完的文件，缓存中的 partial 不作为成果。
  const candidates = names.filter((name) => /^audio\.[a-z0-9]+$/u.test(name));
  if (candidates.length !== 1) return undefined;
  const relativePath = `assets/sfx/${checkpoint.sourceJobId}/${candidates[0]}`;
  const path = join(root, relativePath);
  try {
    const inspected = await inspectGeneratedAudioFile(path, undefined, true);
    if (checkpoint.localAudio && inspected.sourceHash !== checkpoint.localAudio.sourceHash) return undefined;
    return { path, relativePath, name: basename(path), ...inspected };
  } catch { return undefined; }
}

export async function runSfxGeneration(app: EditingApplication, job: JobRecord, bridgeOverride?: ComfyUIBridgeClient, signal?: AbortSignal): Promise<Record<string, unknown>> {
  const payload = readSfxPayload(job);
  const bridge = bridgeOverride ?? new ComfyUIBridgeClient(payload.bridgeApiBaseUrl);
  restoreModelCheckpoints(app, job);
  const identity = digest({ ...payload, retryOfJobId: undefined });
  const checkpoints = () => (app.trackJob(job.id).result?.externalRuns ?? {}) as Record<string, unknown>;
  let checkpoint = checkpoints().sfx as SfxCheckpoint | undefined;
  const save = (value: SfxCheckpoint) => {
    app.recordJobCheckpoint(job.id, { externalRuns: { ...checkpoints(), sfx: value } });
    checkpoint = value;
  };
  const checkActive = () => {
    signal?.throwIfAborted();
    if (app.trackJob(job.id).status === "cancelled") throw new DomainError("音效任务已取消，停止后续操作；外部推理可能仍在运行", "SFX_CANCELLED");
  };
  checkActive();
  if (checkpoint && (checkpoint.identity !== identity || checkpoint.workflowId !== payload.workflowId
    || !/^[a-zA-Z0-9_-]+$/u.test(checkpoint.sourceJobId))) throw new DomainError("音效恢复记录与原请求不一致", "SFX_CHECKPOINT_MISMATCH");
  if (checkpoint?.status === "submitting" && !checkpoint.runId) throw new DomainError("音效提交结果未知，须先对账，不能重复生成", "EXTERNAL_RUN_OUTCOME_UNKNOWN");
  if (checkpoint?.status === "failed") {
    if (!job.payload.retryOfJobId || checkpoint.attemptJobId === job.id) throw new DomainError("原音效运行明确失败，需要显式恢复任务", "SFX_RETRY_REQUIRED");
    checkpoint = undefined;
  }
  if (!checkpoint) {
    assertSfxRequestCurrent(app, job);
    try {
      const submission = await bridge.createRunWithWorkflow(payload.workflowId, async (workflow) => {
        checkActive();
        assertSfxRequestCurrent(app, job);
        const request = buildSfxBridgeRequest(payload, workflow);
        return request;
      }, { beforeSubmit: (pending) => {
        const submittedAt = new Date().toISOString();
        const audit: BridgeRunAudit = { workflowId: pending.workflow.id, runId: pending.run.id, schemaVersion: pending.workflow.schemaVersion,
          schemaRetryCount: 0, submittedAt, request: { fieldValues: pending.request.fieldValues, fileSlots: [], metadata: { prompt: payload.prompt, maxDurationSeconds: payload.maxDurationSeconds, seed: payload.seed } } };
        save({ status: "submitting", identity, sourceJobId: job.id, attemptJobId: job.id, workflowId: pending.workflow.id,
          schemaVersion: pending.workflow.schemaVersion, submittedAt, runId: pending.run.id, audit });
      } });
      if (!submission.run.id) throw new Error("Bridge 创建响应缺少 Run ID");
      const audit: BridgeRunAudit = { workflowId: submission.workflow.id, runId: submission.run.id,
        schemaVersion: submission.workflow.schemaVersion, schemaRetryCount: submission.schemaRetryCount,
        submittedAt: checkpoint!.submittedAt, request: { fieldValues: submission.request.fieldValues, fileSlots: [], metadata: { prompt: payload.prompt, maxDurationSeconds: payload.maxDurationSeconds, seed: payload.seed } } };
      save({ ...checkpoint!, status: "running", runId: submission.run.id, audit });
    } catch (error) {
      checkpoint = checkpoints().sfx as SfxCheckpoint | undefined;
      if (checkpoint?.status === "submitting") {
        // 只有明确的参数拒绝才允许重提；传输失败和 5xx 都可能已经执行。
        const rejected = error instanceof BridgeError && error.status !== undefined && error.status >= 400 && error.status < 500
          || error instanceof DomainError && ["SFX_SCHEMA_INVALID", "SFX_REQUEST_STALE", "SFX_CANCELLED"].includes(error.code);
        if (rejected) save({ ...checkpoint, status: "failed" });
        else throw new DomainError("音效 POST 已发出但结果未知，保留检查点等待对账", "EXTERNAL_RUN_OUTCOME_UNKNOWN");
      }
      throw error;
    }
  }
  if (!checkpoint?.runId || !checkpoint.audit) throw new DomainError("音效恢复记录缺少原 Run", "SFX_CHECKPOINT_INVALID");
  app.recordBridgeRun(job.id, checkpoint.audit);
  checkActive();
  const root = app.readProject(job.projectId).snapshot.project.rootPath;
  let audio = await localAudio(root, checkpoint);
  if (!checkpoint.run) {
    try {
      const run = await bridge.waitForRun(checkpoint.runId, { onUpdate: checkActive });
      const audit = { ...checkpoint.audit, completedAt: new Date().toISOString(), response: { status: run.status, error: run.error, outputs: run.outputs } };
      save({ ...checkpoint, status: "succeeded", run, audit });
      app.recordBridgeRun(job.id, audit);
    } catch (error) {
      if (error instanceof BridgeError && ["BRIDGE_RUN_FAILED", "BRIDGE_RUN_CANCELLED"].includes(error.code ?? "")) save({ ...checkpoint, status: "failed" });
      throw error;
    }
  }
  const outputs = checkpoint!.run!.outputs.filter((output) => output.kind === "audio" && output.outputId);
  if (outputs.length !== 1) throw new DomainError("生成结束但缺少唯一可下载音效", "SFX_OUTPUT_MISSING");
  const output: BridgeOutput = outputs[0]!;
  if (!audio) {
    checkActive();
    const cache = join(root, "cache", "sfx-generation", checkpoint.sourceJobId);
    await mkdir(cache, { recursive: true });
    const partial = join(cache, "audio.partial");
    try {
      await bridge.downloadOutput(checkpoint!.runId!, output, partial);
      const inspected = await inspectGeneratedAudioFile(partial, output.mime, true);
      const relativePath = `assets/sfx/${checkpoint.sourceJobId}/audio${extensionForGeneratedAudio(output, inspected.metadata)}`;
      const target = join(root, relativePath);
      await mkdir(join(root, "assets", "sfx", checkpoint.sourceJobId), { recursive: true });
      checkActive();
      await rename(partial, target);
      audio = { path: target, relativePath, name: basename(target), ...inspected };
    } finally { await rm(partial, { force: true }); }
  }
  save({ ...checkpoint, localAudio: audio });
  checkActive();
  return app.completeSfxGeneration({ projectId: job.projectId, jobId: job.id, audio, audit: checkpoint!.audit! });
}
