import { randomInt } from "node:crypto";
import { existsSync, realpathSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import { z } from "zod";
import type { EditingApplication } from "./index.js";
import type { BridgeRunAudit, GeneratedAudioFile, JobRecord, SfxGenerationInput, SfxGenerationPayload, SfxGenerationResult } from "@videocut/contracts";
import { createMediaAsset, DomainError, now } from "@videocut/domain";
import { RevisionConflictError } from "./persistence/index.js";
import { readRuntimeConfig } from "@videocut/project-overview";
import { assetRequestVersion, digest } from "../../media-intelligence/src/index.js";

export const SFX_WORKFLOW_ID = "stable-audio-3-medium-v1";
export const sfxGenerationInputSchema = z.object({
  projectId: z.string().trim().min(1), baseRevision: z.number().int().positive(),
  requestId: z.string().trim().min(1), prompt: z.string().trim().min(1).max(4000),
  maxDurationSeconds: z.number().int().min(1).max(120),
  seed: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER).optional(),
  idempotencyKey: z.string().trim().min(1).max(240)
}).strict();

export function readSfxPayload(job: JobRecord): SfxGenerationPayload {
  const p = job.payload as SfxGenerationPayload;
  if (job.kind !== "sfx_generation" || p.workflowId !== SFX_WORKFLOW_ID || !p.requestId || !p.requestVersion
    || !p.requestSnapshot || !p.soundPlanId || !p.soundIntentId || !Number.isInteger(p.planVersion)
    || !p.prompt?.trim() || !Number.isInteger(p.maxDurationSeconds) || p.maxDurationSeconds < 1 || p.maxDurationSeconds > 120
    || !Number.isSafeInteger(p.seed) || p.seed < 0 || !p.bridgeApiBaseUrl || !p.inputDigest) {
    throw new DomainError("音效生成任务缺少完整的固定输入", "SFX_JOB_PAYLOAD_INVALID");
  }
  return p;
}

/** 只在外部首次提交前检查；远端已开始后必须保留结果，再按当前意图决定是否采用。 */
export function assertSfxRequestCurrent(app: EditingApplication, job: JobRecord): void {
  const p = readSfxPayload(job), snapshot = app.readProject(job.projectId).snapshot;
  const request = snapshot.assetRequests.find((entry) => entry.id === p.requestId);
  const plan = snapshot.soundPlans?.find((entry) => entry.id === p.soundPlanId);
  if (!request || request.status === "closed" || assetRequestVersion(request) !== p.requestVersion
    || !plan || plan.status !== "current" || plan.version !== p.planVersion
    || !plan.intents.some((entry) => entry.id === p.soundIntentId && entry.function !== "silence")) {
    throw new DomainError("声音需求或计划已改变；旧生成请求不能继续提交", "SFX_REQUEST_STALE");
  }
}

export function submitSfxGeneration(app: EditingApplication, value: SfxGenerationInput): JobRecord {
  const input = sfxGenerationInputSchema.parse(value);
  // 不把当前 Revision、自动随机数放进重放身份；相同业务输入始终找到原任务。
  const inputDigest = digest({ requestId: input.requestId, prompt: input.prompt, maxDurationSeconds: input.maxDurationSeconds, seed: input.seed ?? null });
  const key = `sfx:${input.idempotencyKey}`;
  const previous = app.repository.listJobs(input.projectId).find((entry) => entry.idempotencyKey === key);
  if (previous) {
    if (previous.kind !== "sfx_generation" || previous.payload.inputDigest !== inputDigest) throw new DomainError("同一音效幂等键的输入不同，请为新候选使用新键", "SFX_IDEMPOTENCY_CONFLICT");
    return previous;
  }
  const state = app.readProject(input.projectId);
  if (state.revision.number !== input.baseRevision) throw new RevisionConflictError(input.baseRevision, state.revision.number);
  const request = state.snapshot.assetRequests.find((entry) => entry.id === input.requestId);
  const plan = state.snapshot.soundPlans?.find((entry) => entry.id === request?.sound?.soundPlanId);
  if (!request || request.mediaKind !== "audio" || request.role !== "sfx" || request.status === "closed" || !request.sound
    || !plan || plan.status !== "current" || !plan.intents.some((entry) => entry.id === request.sound!.soundIntentId && entry.function !== "silence")) {
    throw new DomainError("生成音效需要有效的 SFX 需求及当前声音意图", "SFX_REQUEST_INVALID");
  }
  const payload: SfxGenerationPayload = {
    requestedRevision: state.revision.number, requestId: request.id, requestVersion: assetRequestVersion(request), requestSnapshot: structuredClone(request),
    soundPlanId: plan.id, soundIntentId: request.sound.soundIntentId, planVersion: plan.version,
    workflowId: SFX_WORKFLOW_ID, bridgeApiBaseUrl: readRuntimeConfig().bridge.apiBaseUrl,
    prompt: input.prompt, maxDurationSeconds: input.maxDurationSeconds, seed: input.seed ?? randomInt(0, 2 ** 32), inputDigest
  };
  const job = app.repository.createJob({ projectId: input.projectId, kind: "sfx_generation", payload, idempotencyKey: key });
  if (job.payload.inputDigest !== inputDigest) throw new DomainError("音效幂等键已被不同输入使用", "SFX_IDEMPOTENCY_CONFLICT");
  app.publish({ projectId: input.projectId, revision: state.revision.number, type: "job" });
  return job;
}

export function completeSfxGeneration(app: EditingApplication, input: { projectId: string; jobId: string; audio: GeneratedAudioFile; audit: BridgeRunAudit }): SfxGenerationResult {
  const job = app.trackJob(input.jobId), payload = readSfxPayload(job);
  if (job.projectId !== input.projectId || job.status === "cancelled") throw new DomainError("不能登记其他项目或已取消任务的音效", "SFX_JOB_INVALID");
  const { audio, audit } = input;
  if (audit.workflowId !== payload.workflowId || !audit.runId || !audit.schemaVersion || audit.response?.status !== "succeeded"
    || audit.request.fieldValues.prompt !== payload.prompt || audit.request.fieldValues.duration_seconds !== payload.maxDurationSeconds || audit.request.fieldValues.seed !== payload.seed) {
    throw new DomainError("音效生成记录与固定请求不一致", "SFX_AUDIT_INVALID");
  }
  const current = app.readProject(input.projectId), root = resolve(current.snapshot.project.rootPath);
  const relativePath = relative(root, resolve(audio.path)).replace(/\\/gu, "/");
  if (!isAbsolute(audio.path) || !relativePath.startsWith("assets/sfx/") || audio.relativePath.replace(/\\/gu, "/") !== relativePath || !existsSync(audio.path)) {
    throw new DomainError("音效必须保存在当前项目的受管目录", "SFX_OUTPUT_PATH_INVALID");
  }
  const physicalPath = relative(realpathSync(root), realpathSync(audio.path));
  if (physicalPath.startsWith("..") || isAbsolute(physicalPath)) throw new DomainError("音效真实路径超出项目目录", "SFX_OUTPUT_PATH_INVALID");
  if (!audio.sourceHash || audio.sourceHash !== audio.contentHash || !audio.name?.trim() || !Number.isFinite(audio.durationMs) || audio.durationMs <= 0
    || !audio.metadata?.hasAudio || !audio.metadata.audioCodec || audio.metadata.durationMs !== audio.durationMs) throw new DomainError("音效原文件核验不完整", "SFX_OUTPUT_INVALID");
  // 事务完成但回执丢失时可从 hash 找回；不因为无关 Revision 改变而丢掉远端成果。
  let asset = current.snapshot.assets.find((entry) => entry.kind === "audio" && entry.sourceHash === audio.sourceHash && entry.status === "ready");
  let state = current;
  if (!asset) {
    state = app.repository.commit(input.projectId, current.revision.number, "登记生成音效候选", (snapshot, impact) => {
      asset = createMediaAsset({ name: audio.name, kind: "audio", role: "sfx", managedPath: relativePath, sourceHash: audio.sourceHash,
        tags: ["generated-sfx"], provenance: { source: "generated", provider: `bridge:${payload.workflowId}`, generationJobId: job.id, acquiredAt: now() } });
      asset.status = "ready";
      asset.metadata = structuredClone(audio.metadata);
      snapshot.assets.push(asset);
      impact.changed.push(asset.id);
    });
  }
  const result: SfxGenerationResult = { assetId: asset!.id, revision: state.revision.number, runId: audit.runId, workflowId: payload.workflowId,
    schemaVersion: audit.schemaVersion, sourceHash: audio.sourceHash, durationMs: audio.durationMs,
    requestedMaxDurationSeconds: payload.maxDurationSeconds, seed: payload.seed, requestId: payload.requestId, requestVersion: payload.requestVersion };
  app.recordJobCheckpoint(job.id, result);
  app.publish({ projectId: input.projectId, revision: state.revision.number, type: "revision" });
  return result;
}
