import { resolve, join } from "node:path";
import type { EditingApplication } from "@videocut/application";
import { ComfyUIBridgeClient } from "@videocut/bridge";
import type { JobRecord } from "@videocut/contracts";
import { DomainError } from "@videocut/domain";
import { probeMedia, runProcess } from "@videocut/speech";
import { loadLibraryIndex, searchLibraryIndex, libraryVideo } from "../../../references/motion-cases/skillry/tools/library-store.mjs";
import { readCreativeCase } from "../../../references/motion-cases/skillry/tools/creative-library.mjs";
import { digest, timeRangeSchema } from "../../../packages/media-intelligence/src/index.js";
import { mechanismChunks, motionCacheKey, MOTION_TEXT_VERSION, LEGACY_MOTION_VIDEO_PROMPT } from "../../../packages/media-intelligence/src/motion-library.js";
import { deriveMediaInput, PREPROCESSING_VERSION } from "../../../packages/media-intelligence/src/derive.js";
import { referenceFrameTimes } from "../../../packages/media-intelligence/src/reference-frame-times.js";
import { hashMediaFile } from "../../../packages/edit-application/src/media-intelligence.js";
import { runLibrarySemanticSearch } from "./library-semantic.js";
import { semanticConfig, modelText, rejectModelOutput } from "./model-http.js";

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
  const creative = id.includes("-c") ? readCreativeCase(libraryRoot(), { id, source_sha256: fingerprint, include_storyboard: false }) : undefined;
  const video = creative?.result.resources as { video?: { absolute_path?: string } } | undefined;
  const path = creative ? video?.video?.absolute_path : libraryVideo(libraryRoot(), id, fingerprint);
  if (!path) throw new DomainError("参考原片不可读取", "MOTION_REFERENCE_VIDEO_MISSING");
  const range = timeRangeSchema.parse(job.payload.range);
  const metadata = await probeMedia(path);
  if (range.endMs > metadata.durationMs || range.endMs - range.startMs > 15000) throw new DomainError("原片分析范围必须在文件内且不超过15秒", "MOTION_REFERENCE_RANGE_INVALID");
  const hash = await hashMediaFile(path), config = semanticConfig(job);
  if (bridge.apiBaseUrl !== config.apiBaseUrl) bridge = new ComfyUIBridgeClient(config.apiBaseUrl);
  const schema = await bridge.getWorkflow(config.videoWorkflowId);
  const prompt = typeof job.payload.videoPrompt === "string" ? job.payload.videoPrompt : LEGACY_MOTION_VIDEO_PROMPT;
  const identity: unknown[] = [id, fingerprint, hash, range, config, schema.schemaVersion, prompt, PREPROCESSING_VERSION];
  // 新请求的音轨处理必须参与缓存身份，旧任务仍沿原身份恢复。
  if (job.payload.analysisMode) identity.push("reference-audio-track-v2", job.payload.analysisMode);
  if (job.payload.samplingVersion) identity.push("reference-sampling", job.payload.samplingVersion, "reference-source-pts-v1");
  const key = digest(identity);
  const cached = app.intelligence.store.libraryCache<Record<string, unknown>>(`motion-video:${key}`);
  if (cached) return { ...cached, cache_hit: true };
  const probe = JSON.parse(await runProcess("ffprobe", ["-v", "error", "-show_format", "-of", "json", path], 120000));
  const directory = join(app.getProjectRoot(job.projectId), "cache", "motion-reference", key);
  const hasAudio = job.payload.analysisMode === "audiovisual" && Boolean(metadata.hasAudio);
  const origin = Number(probe.format?.start_time ?? 0);
  let leadingFrameSeconds: number | undefined;
  if (job.payload.samplingVersion) {
    leadingFrameSeconds = (await referenceFrameTimes(path, range)).timestamps[0];
  }
  const derived = await deriveMediaInput({ id: `library:${id}`, hash, path, kind: "video", hasAudio, startSeconds: origin }, directory, range, undefined, false, leadingFrameSeconds);
  const inputFrames = JSON.parse(await runProcess("ffprobe", ["-v", "error", "-count_frames", "-show_entries", "stream=codec_type,nb_read_frames,avg_frame_rate", "-of", "json", derived.path], 120000));
  const derivedHasAudio = Array.isArray(inputFrames.streams) && inputFrames.streams.some((stream: { codec_type?: string }) => stream.codec_type === "audio");
  if (hasAudio && !derivedHasAudio) throw new DomainError("参考原片有声音，但提交分析的片段缺少音轨", "MOTION_REFERENCE_AUDIO_MISSING");
  const response = await modelText(app, job, bridge, `motion-video:${key}`, config.videoWorkflowId, async workflow => {
    const fieldValues: Record<string, unknown> = {};
    for (const [label, value] of Object.entries({ prompt, start_seconds: 0, duration_seconds: (range.endMs - range.startMs) / 1000 })) {
      const field = workflow.fields.find(entry => entry.label === label);
      if (!field) throw new DomainError(`原片理解接口缺少${label}`, "MEDIA_MODEL_SCHEMA_UNSUPPORTED");
      fieldValues[field.id] = value;
    }
    return { fieldValues, files: [{ slot: bridge.findRequiredSlot(workflow, "video"), path: derived.path, mime: "video/mp4" }] };
  }, job.payload.samplingVersion ? "motion_reference" : undefined, key);
  let description = response.text!;
  let sampling: Record<string, unknown> = { model_frame_density: "unknown", limitation: "工作流未返回模型采样证据；快速交叠与精确速度保持未知。" };
  if (job.payload.samplingVersion) {
    try {
      const value = JSON.parse(response.text!);
      if (value?.schema === "motion-reference-observation-v1") {
        const observed = value.sampling, audio = observed?.audio;
        if (typeof value.description !== "string" || !value.description.trim() || observed?.version !== job.payload.samplingVersion
          || !Number.isSafeInteger(observed.frame_count) || observed.frame_count < 1
          || !Array.isArray(observed.frame_timestamps_ms) || observed.frame_timestamps_ms.length !== observed.frame_count
          || observed.frame_timestamps_ms.some((time: unknown) => typeof time !== "number" || !Number.isFinite(time))
          || typeof audio?.included !== "boolean" || audio.included !== derivedHasAudio
          || !Number.isFinite(audio.input_start_ms) || !Number.isFinite(audio.input_end_ms)
          || !Array.isArray(audio.decoded_intervals_ms) || audio.decoded_intervals_ms.some((interval: unknown) => !Array.isArray(interval) || interval.length !== 2 || interval.some(value => typeof value !== "number" || !Number.isFinite(value)))) {
          throw new Error("模型返回的采样回执不完整或与实际输入不符");
        }
        const offset = range.startMs;
        description = value.description;
        sampling = { model_frame_density: "one_per_second", version: observed.version, model_frame_count: observed.frame_count,
          model_source_timestamps_ms: observed.frame_timestamps_ms.map((time: number) => leadingFrameSeconds !== undefined && Math.abs(time) < 0.001
            ? Math.round((leadingFrameSeconds - origin) * 1_000_000) / 1000 : offset + time),
          audio: { included: audio.included, sample_rate: audio.sample_rate,
            input_start_ms: offset + audio.input_start_ms, input_end_ms: offset + audio.input_end_ms,
            decoded_intervals_ms: audio.decoded_intervals_ms.map(([start, end]: [number, number]) => [offset + start, offset + end]) },
          limitation: "模型约每秒接收一帧；快速交叠及精确速度仍需连续画面核查。" };
      }
    } catch (error) {
      if (!(error instanceof SyntaxError)) {
        rejectModelOutput(app, job, `motion-video:${key}`, error instanceof Error ? error.message : String(error));
        throw new DomainError("模型采样回执无效，请检查实际工作流后显式恢复", "MEDIA_MODEL_OUTPUT_INVALID");
      }
    }
  }
  const result = { id, source_sha256: fingerprint, source_hash: hash, range, description, model: config.modelRevision, schema: response.schemaVersion, run_id: response.runId, input: { path: derived.path, mapping: derived.mapping, source_has_audio: Boolean(metadata.hasAudio), has_audio: derivedHasAudio, streams: inputFrames.streams }, sampling, cache_hit: false };
  app.intelligence.store.saveLibraryCache(`motion-video:${key}`, result);
  return result;
}
