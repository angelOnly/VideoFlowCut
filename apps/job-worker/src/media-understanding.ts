import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { AssetProviderRegistry } from "@videocut/acquisition";
import { downloadHttpFile } from "@videocut/acquisition";
import type { EditingApplication } from "@videocut/application";
import { BridgeError, ComfyUIBridgeClient, type BridgeRunRequest, type BridgeWorkflow } from "@videocut/bridge";
import type { JobRecord, MediaAnalysisRecord, MediaObservation, MediaSource } from "@videocut/contracts";
import { assetById, DomainError, now } from "@videocut/domain";
import { probeMedia, runProcess } from "@videocut/speech";
import { hashMediaFile, managedSourcePath } from "../../../packages/edit-application/src/media-intelligence.js";
import { ANALYSIS_VERSION, MODEL_WORKFLOWS, EMBEDDING_VERSION, analysisInputSchema, analysisPrompt, digest, parseObservation, planWindows, searchQuerySchema } from "../../../packages/media-intelligence/src/index.js";
import { mediaId } from "../../../packages/media-intelligence/src/store.js";
import { detectSceneBoundaries } from "../../../packages/media-intelligence/src/structure.js";

type ExternalCheckpoint = { status: "submitting" | "running" | "succeeded" | "failed"; workflowId: string; schemaVersion: string; runId?: string; text?: string };
/** 发送前保存意图，取得 run 后立刻落盘；恢复不能把网络超时当成未提交。 */
async function modelText(app: EditingApplication, job: JobRecord, bridge: ComfyUIBridgeClient, key: string, workflowId: string, build: (schema: BridgeWorkflow) => Promise<BridgeRunRequest>) {
  const checkpoints = () => (app.trackJob(job.id).result?.externalRuns ?? {}) as Record<string, ExternalCheckpoint>;
  const save = (checkpoint: ExternalCheckpoint) => {
    const current = app.trackJob(job.id);
    app.updateJob(job.id, { status: current.status, result: { ...current.result, externalRuns: { ...checkpoints(), [key]: checkpoint } } });
  };
  let checkpoint = checkpoints()[key];
  if (checkpoint?.text !== undefined && checkpoint.status === "succeeded") return checkpoint;
    if (checkpoint?.status === "submitting" && !checkpoint.runId) throw new DomainError("外部提交结果未知，已保留提交意图，不能重复创建模型任务", "EXTERNAL_RUN_OUTCOME_UNKNOWN");
  if (!checkpoint?.runId) {
    const submission = await bridge.createRunWithSchemaRetry(workflowId, async (schema) => {
      const request = await build(schema);
      checkpoint = { status: "submitting", workflowId, schemaVersion: schema.schemaVersion };
      save(checkpoint);
      return request;
    });
    checkpoint = { status: "running", workflowId, schemaVersion: submission.workflow.schemaVersion, runId: submission.run.id };
    save(checkpoint);
  }
  const result = await bridge.waitForRun(checkpoint.runId!, { timeoutMs: 30 * 60_000, intervalMs: 1000 });
  const text = result.outputs.filter((output) => output.kind === "text" && typeof output.text === "string").map((output) => output.text).join("\n");
  if (!text) throw new DomainError("模型成功结果中缺少文本输出", "MEDIA_MODEL_TEXT_MISSING");
  checkpoint = { ...checkpoint, status: "succeeded", text };
  save(checkpoint);
  return checkpoint;
}

async function resolveSource(app: EditingApplication, job: JobRecord, providers: AssetProviderRegistry): Promise<MediaSource> {
  const input = analysisInputSchema.parse(job.payload.input);
  const state = app.readProject(job.projectId);
  let path: string, kind: MediaSource["kind"], identity: MediaSource["identity"];
  if (input.assetId) {
    const asset = assetById(state.snapshot, input.assetId);
    path = await managedSourcePath(state.snapshot.project.rootPath, asset.managedPath);
    const hash = await hashMediaFile(path);
    if (asset.sourceHash && hash !== job.payload.sourceVersion) throw new DomainError("源文件在提交分析后发生变化", "MEDIA_SOURCE_CHANGED");
    kind = asset.kind === "image" || asset.kind === "document" ? asset.kind : asset.kind === "audio" || asset.kind === "speech" ? "audio" : "video";
    identity = "original";
  } else {
    const { candidate, request } = app.readAssetCandidate({ projectId: job.projectId, assetCandidateId: input.candidateId! });
    if (digest([candidate.previewUrl, request.updatedAt]) !== job.payload.sourceVersion) throw new DomainError("候选或需求已更新，请重新分析", "MEDIA_CANDIDATE_CHANGED");
    // 只有 Provider 声明的媒体主机可用；不把任意网页 URL 交给下载器。
    providers.get(candidate.provider);
    const hosts: Record<string, string[]> = { mixkit: ["assets.mixkit.co"], freesound: ["cdn.freesound.org", "freesound.org"], pexels: ["videos.pexels.com", "images.pexels.com"] };
    const allowed = hosts[candidate.provider];
    if (!allowed || !candidate.previewUrl) throw new DomainError("此 Provider 尚未提供受控预览分析", "MEDIA_PREVIEW_PROVIDER_UNSUPPORTED");
    const directory = join(state.snapshot.project.rootPath, "cache", "media-intelligence", job.id);
    const extension = candidate.kind === "audio" ? ".mp3" : candidate.kind === "image" ? ".jpg" : ".mp4";
    const download = await downloadHttpFile(candidate.previewUrl, directory, `preview${extension}`, candidate.kind, undefined, {}, { allowedHosts: allowed });
    path = download.filePath; kind = candidate.kind; identity = "preview";
  }
  const hash = await hashMediaFile(path);
  const metadata = kind === "document" ? undefined : await probeMedia(path);
  const probe = kind === "document" ? { streams: [] } : JSON.parse(await runProcess("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", path], 120_000));
  const source: MediaSource = {
    id: `media_source_${digest([job.projectId, input.assetId ?? input.candidateId, identity, hash])}`,
    projectId: job.projectId, target: input.assetId ? { assetId: input.assetId } : { candidateId: input.candidateId! }, identity, hash, path, kind,
    durationMs: kind === "image" || kind === "document" ? 0 : metadata?.durationMs ?? 0,
    hasAudio: metadata?.hasAudio ?? false, width: metadata?.width, height: metadata?.height,
    streams: (probe.streams ?? []).map((stream: Record<string, unknown>) => ({ index: Number(stream.index), kind: String(stream.codec_type), timeBase: stream.time_base as string | undefined, startSeconds: Number(stream.start_time ?? 0), sampleRate: stream.sample_rate ? Number(stream.sample_rate) : undefined, rotation: undefined })), createdAt: now()
  };
  app.intelligence.store.saveSource(source);
  return source;
}

async function embed(app: EditingApplication, job: JobRecord, bridge: ComfyUIBridgeClient, texts: string[], mode: "document" | "query", key: string): Promise<number[][]> {
  const result = await modelText(app, job, bridge, key, process.env.VIDEOCUT_EMBEDDING_WORKFLOW_ID ?? MODEL_WORKFLOWS.embedding, async (schema) => {
    for (const id of ["texts_json", "mode"]) if (!schema.fields.some((field) => field.id === id)) throw new DomainError(`向量接口缺少 ${id}`, "MEDIA_MODEL_SCHEMA_UNSUPPORTED");
    return { fieldValues: { texts_json: JSON.stringify(texts), mode, ...(mode === "query" && schema.fields.some((field) => field.id === "instruction") ? { instruction: "根据中文检索需求，查找描述实际画面、声音或原文的相关素材片段。" } : {}) } };
  });
  const vectors = JSON.parse(result.text!).embeddings as unknown;
  if (!Array.isArray(vectors) || vectors.length !== texts.length || vectors.some((vector) => !Array.isArray(vector) || vector.length !== 1024 || vector.some((value) => typeof value !== "number" || !Number.isFinite(value)) || Math.abs(Math.hypot(...vector) - 1) > 0.02)) throw new DomainError("向量服务没有返回对应数量的归一化 1024 维向量", "MEDIA_EMBEDDING_INVALID");
  return vectors;
}

export async function runMediaUnderstanding(app: EditingApplication, job: JobRecord, bridge: ComfyUIBridgeClient, providers: AssetProviderRegistry): Promise<Record<string, unknown>> {
  const input = analysisInputSchema.parse(job.payload.input);
  const store = app.intelligence.store;
  let record = store.analysis(job.projectId, job.id);
  const source = record ? store.source(job.projectId, record.sourceId)! : await resolveSource(app, job, providers);
  if (await hashMediaFile(source.path) !== source.hash) throw new DomainError("恢复分析时源内容已变化", "MEDIA_SOURCE_CHANGED");
  const modalities = input.modalities.filter((modality) => source.kind === "audio" ? modality === "audio" || modality === "speech" : !source.hasAudio ? modality === "visual" || modality === "text" : true);
  if (!modalities.length) throw new DomainError("实际输入不具备请求的模态", "MEDIA_MODALITY_UNAVAILABLE");
  if (!record) {
    const ranges = source.durationMs ? planWindows(source.durationMs, input.depth, input.range) : [];
    const targetRange = source.durationMs ? input.range ?? { startMs: 0, endMs: source.durationMs } : undefined;
    const boundaries = source.kind === "video" ? await detectSceneBoundaries(source.path) : [];
    const cuts = [...new Set([0, ...boundaries.map((boundary) => boundary.seconds * 1000).filter((time) => time > 0 && time < source.durationMs), source.durationMs])].sort((a, b) => a - b);
    record = { id: job.id, projectId: job.projectId, sourceId: source.id, key: String(job.payload.analysisKey), depth: input.depth, modalities, targetRange, context: input.context,
      windows: ranges.length ? ranges.map((range, index) => ({ id: `${job.id}:${index}`, range, status: "pending" })) : [{ id: `${job.id}:0`, region: input.region, status: "pending" }],
      shotRanges: source.kind === "video" ? cuts.slice(0, -1).map((startMs, index) => ({ startMs, endMs: cuts[index + 1] })) : [], status: "running", updatedAt: now() };
    store.saveAnalysis(record);
  }
  let failed = false;
  for (const window of record.windows) {
    if (window.status === "succeeded") continue;
    const currentJob = app.trackJob(job.id);
    if (currentJob.status === "cancelled") throw new DomainError("分析已取消；已完成观察保留", "MEDIA_ANALYSIS_CANCELLED");
    try {
      const kind = source.kind === "document" ? "image" : source.kind;
      const workflowId = kind === "audio" ? process.env.VIDEOCUT_AUDIO_ANALYSIS_WORKFLOW_ID : kind === "image" ? process.env.VIDEOCUT_IMAGE_ANALYSIS_WORKFLOW_ID : process.env.VIDEOCUT_VIDEO_ANALYSIS_WORKFLOW_ID ?? MODEL_WORKFLOWS.video;
      if (!workflowId) throw new DomainError(`需要配置外部${kind === "audio" ? "纯音频" : "图片/页面"}工作流，不能伪造视频输入字段`, "MEDIA_MODEL_INPUT_UNAVAILABLE");
      if (source.kind === "document") throw new DomainError("文档需要先生成带页码映射的页面输入", "MEDIA_DOCUMENT_PAGE_REQUIRED");
      const response = await modelText(app, job, bridge, `window:${window.id}`, workflowId, async (schema) => {
        const slot = bridge.findRequiredSlot(schema, kind);
        const fields: Record<string, unknown> = {};
        const available = new Set(schema.fields.map((field) => field.id));
        if (!available.has("prompt")) throw new DomainError("分析工作流缺少 prompt 字段", "MEDIA_MODEL_SCHEMA_UNSUPPORTED");
        fields.prompt = analysisPrompt(modalities, window.range, record!.context);
        if (available.has("max_new_tokens")) fields.max_new_tokens = 4096;
        if (window.range) {
          if (!available.has("start_seconds") || !available.has("duration_seconds")) throw new DomainError("分析接口缺少真实源时间窗口", "MEDIA_MODEL_SCHEMA_UNSUPPORTED");
          fields.start_seconds = window.range.startMs / 1000;
          fields.duration_seconds = (window.range.endMs - window.range.startMs) / 1000;
        }
        return { fieldValues: fields, files: [{ slot, path: source.path, mime: kind === "audio" ? "audio/wav" : kind === "image" ? "image/png" : "video/mp4" }] };
      });
      const parsed = parseObservation(response.text!, window.range, modalities);
      const observation: MediaObservation = { id: `observation_${digest(window.id)}`, projectId: job.projectId, sourceId: source.id, sourceHash: source.hash, range: window.range, region: window.region, depth: input.depth, modalities, ...parsed,
        context: record.context, rawText: response.text!, version: { workflowId, schemaVersion: response.schemaVersion, model: process.env.VIDEOCUT_ANALYSIS_MODEL_REVISION ?? "073dbbc8c5bc0af2d789e1ce12e7c17a6be746e1", prompt: ANALYSIS_VERSION, preprocessing: "external-service-source-window-v1", samplingFps: kind === "video" ? 1 : undefined }, jobId: job.id, runId: response.runId, createdAt: now() };
      store.saveObservation(observation);
      window.observationId = observation.id;
      window.runId = response.runId; window.workflowId = workflowId; window.schemaVersion = response.schemaVersion;
      if (!parsed.facts.length) throw new DomainError("本窗口没有通过校验的事实，原文可读，覆盖仍未完成", "MEDIA_OBSERVATION_INVALID");
      window.status = "succeeded"; window.error = undefined;
    } catch (error) {
      failed = true;
      const message = error instanceof Error ? error.message : String(error);
      window.status = error instanceof DomainError && error.code === "EXTERNAL_RUN_OUTCOME_UNKNOWN" ? "unknown" : "failed";
      window.error = message;
      // 接口不可用时不把整个长片队列反复提交；保留剩余窗口供恢复。
      if (error instanceof BridgeError || window.status === "unknown" || error instanceof DomainError && error.code === "MEDIA_MODEL_INPUT_UNAVAILABLE") break;
    } finally {
      record.updatedAt = now(); store.saveAnalysis(record);
      const latest = app.trackJob(job.id);
      app.updateJob(job.id, { status: latest.status, result: { ...latest.result, analysisId: record.id, sourceId: source.id, completedWindows: record.windows.filter((entry) => entry.status === "succeeded").length, totalWindows: record.windows.length } });
    }
  }
  record.status = record.windows.every((window) => window.status === "succeeded") ? "succeeded" : record.windows.some((window) => window.status === "unknown") ? "unknown" : record.windows.some((window) => window.status === "succeeded") ? "partial" : "failed";
  store.saveAnalysis(record);
  if (failed || record.status !== "succeeded") throw new DomainError(record.windows.find((window) => window.error)?.error ?? "分析未完成", record.status === "unknown" ? "EXTERNAL_RUN_OUTCOME_UNKNOWN" : "MEDIA_ANALYSIS_INCOMPLETE");
  return { ...app.trackJob(job.id).result, analysisId: record.id, sourceId: source.id, coverage: app.intelligence.inspect(job.projectId, source.target).coverage };
}

export async function runMediaSearch(app: EditingApplication, job: JobRecord, bridge: ComfyUIBridgeClient): Promise<Record<string, unknown>> {
  const query = searchQuerySchema.parse(job.payload.query);
  const store = app.intelligence.store;
  const sources = new Set(store.sources(job.projectId).filter((source) => (!query.assetIds || Boolean(source.target.assetId && query.assetIds.includes(source.target.assetId))) && (!query.candidateIds || Boolean(source.target.candidateId && query.candidateIds.includes(source.target.candidateId)))).map((source) => source.id));
  const pending = store.observations(job.projectId).filter((observation) => sources.has(observation.sourceId)).map((observation) => ({ observation, text: observation.facts.filter((fact) => fact.modality === query.modality).map((fact) => `${fact.text} ${fact.keywords.join(" ")}`).join("\n") }))
    .filter((entry) => entry.text && !store.vector(entry.observation.id, query.modality, EMBEDDING_VERSION, digest(entry.text)));
  for (let start = 0; start < pending.length; start += 8) {
    const batch = pending.slice(start, start + 8);
    const vectors = await embed(app, job, bridge, batch.map((entry) => entry.text), "document", `documents:${digest(batch.map((entry) => entry.observation.id))}`);
    batch.forEach((entry, index) => store.saveVector(entry.observation.id, query.modality, EMBEDDING_VERSION, digest(entry.text), vectors[index]));
  }
  const [vector] = await embed(app, job, bridge, [query.query], "query", `query:${digest(query.query)}`);
  return { ...app.trackJob(job.id).result, ...app.intelligence.search(job.projectId, query, vector) };
}
