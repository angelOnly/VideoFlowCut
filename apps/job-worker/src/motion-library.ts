import { resolve, join } from "node:path";
import type { EditingApplication } from "@videocut/application";
import { ComfyUIBridgeClient } from "@videocut/bridge";
import type { JobRecord } from "@videocut/contracts";
import { DomainError } from "@videocut/domain";
import { probeMedia, runProcess } from "@videocut/speech";
import { loadLibraryIndex, searchLibraryIndex, libraryVideo } from "../../../references/motion-cases/skillry/tools/library-store.mjs";
import { digest, timeRangeSchema } from "../../../packages/media-intelligence/src/index.js";
import { mechanismChunks, motionCacheKey, MOTION_TEXT_VERSION, LEGACY_MOTION_VIDEO_PROMPT } from "../../../packages/media-intelligence/src/motion-library.js";
import { deriveMediaInput, PREPROCESSING_VERSION } from "../../../packages/media-intelligence/src/derive.js";
import { hashMediaFile } from "../../../packages/edit-application/src/media-intelligence.js";
import { runLibrarySemanticSearch } from "./library-semantic.js";
import { semanticConfig, modelText } from "./model-http.js";

const libraryRoot = () => resolve(process.cwd(), "references/motion-cases/skillry");
export async function runMotionLibrarySearch(app: EditingApplication, job: JobRecord, bridge: ComfyUIBridgeClient): Promise<Record<string, unknown>> {
  const index = loadLibraryIndex(libraryRoot());
  const assertCurrent = () => {
    if (loadLibraryIndex(libraryRoot()).source_sha256 !== job.payload.source_sha256) throw new DomainError("机制原文已变化，请重新检索", "MOTION_LIBRARY_STALE");
  };
  assertCurrent();
  if (typeof job.payload.instruction !== "string" || typeof job.payload.instructionVersion !== "string" || job.payload.textVersion !== MOTION_TEXT_VERSION) {
    throw new DomainError("检索任务缺少有效指令快照，请重新检索", "LIBRARY_INSTRUCTION_SNAPSHOT_MISSING");
  }
  const snapshot = { instruction: job.payload.instruction, instructionVersion: job.payload.instructionVersion, textVersion: MOTION_TEXT_VERSION };
  const request = job.payload.request as Record<string, unknown>;
  searchLibraryIndex(index, request);
  const source = index.mechanisms.find(entry => entry.id === (request.similar_to ?? request.before ?? request.after));
  const queries = request.stages as string[] | undefined ?? [String(request.query ?? source?.search_text ?? "")];
  return runLibrarySemanticSearch(app, job, bridge, {
    namespace: "motion", source: index.source_sha256, instruction: snapshot.instruction, instructionVersion: snapshot.instructionVersion,
    documents: index.mechanisms.flatMap(mechanism => mechanismChunks(mechanism.search_text).map((text, chunk) => ({ id: mechanism.id, text, identity: [mechanism.id, mechanism.text_sha256, chunk, text] }))),
    queries, cacheKey: (identity, version, mode) => motionCacheKey(index.source_sha256, identity, version, mode, snapshot), assertCurrent,
    // 保存完整语义池，具体筛选、融合和分页由读取时的请求决定。
    project: pools => ({ source_sha256: index.source_sha256, pools })
  });
}

/** 只允许库编号和源范围；不接收任意文件路径，不创建项目素材或观察。 */
export async function runMotionReferenceAnalysis(app: EditingApplication, job: JobRecord, bridge: ComfyUIBridgeClient): Promise<Record<string, unknown>> {
  const id = String(job.payload.id), fingerprint = String(job.payload.source_sha256);
  const path = libraryVideo(libraryRoot(), id, fingerprint), range = timeRangeSchema.parse(job.payload.range);
  const metadata = await probeMedia(path);
  if (range.endMs > metadata.durationMs || range.endMs - range.startMs > 15000) throw new DomainError("原片分析范围必须在文件内且不超过15秒", "MOTION_REFERENCE_RANGE_INVALID");
  const hash = await hashMediaFile(path), config = semanticConfig(job);
  if (bridge.apiBaseUrl !== config.apiBaseUrl) bridge = new ComfyUIBridgeClient(config.apiBaseUrl);
  const schema = await bridge.getWorkflow(config.videoWorkflowId);
  const prompt = typeof job.payload.videoPrompt === "string" ? job.payload.videoPrompt : LEGACY_MOTION_VIDEO_PROMPT;
  const key = digest([id, fingerprint, hash, range, config, schema.schemaVersion, prompt, PREPROCESSING_VERSION]);
  const cached = app.intelligence.store.libraryCache<Record<string, unknown>>(`motion-video:${key}`);
  if (cached) return { ...cached, cache_hit: true };
  const probe = JSON.parse(await runProcess("ffprobe", ["-v", "error", "-show_format", "-of", "json", path], 120000));
  const directory = join(app.getProjectRoot(job.projectId), "cache", "motion-reference", key);
  const derived = await deriveMediaInput({ id: `library:${id}`, hash, path, kind: "video", hasAudio: false, startSeconds: Number(probe.format?.start_time ?? 0) }, directory, range);
  const inputFrames = JSON.parse(await runProcess("ffprobe", ["-v", "error", "-select_streams", "v:0", "-count_frames", "-show_entries", "stream=nb_read_frames,avg_frame_rate", "-of", "json", derived.path], 120000));
  const response = await modelText(app, job, bridge, `motion-video:${key}`, config.videoWorkflowId, async workflow => {
    const fieldValues: Record<string, unknown> = {};
    for (const [label, value] of Object.entries({ prompt, start_seconds: 0, duration_seconds: (range.endMs - range.startMs) / 1000 })) {
      const field = workflow.fields.find(entry => entry.label === label);
      if (!field) throw new DomainError(`原片理解接口缺少${label}`, "MEDIA_MODEL_SCHEMA_UNSUPPORTED");
      fieldValues[field.id] = value;
    }
    return { fieldValues, files: [{ slot: bridge.findRequiredSlot(workflow, "video"), path: derived.path, mime: "video/mp4" }] };
  }, undefined, key);
  const result = { id, source_sha256: fingerprint, source_hash: hash, range, description: response.text, model: config.modelRevision, schema: response.schemaVersion, run_id: response.runId, input: { path: derived.path, mapping: derived.mapping, streams: inputFrames.streams }, sampling: { model_frame_density: "unknown", limitation: "派生片段帧数不等于模型实际抽样；未返回模型采样证据，快速交叠与精确速度保持未知。" }, cache_hit: false };
  app.intelligence.store.saveLibraryCache(`motion-video:${key}`, result);
  return result;
}
