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
import { deriveMediaInput, PREPROCESSING_VERSION, REFERENCE_PREPROCESSING_VERSION } from "../../../packages/media-intelligence/src/derive.js";
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
  if (job.payload.samplingVersion) identity.push("reference-sampling", job.payload.samplingVersion, job.payload.referencePreprocessingVersion ?? "reference-source-pts-v1");
  const key = digest(identity);
  const cached = app.intelligence.store.libraryCache<Record<string, unknown>>(`motion-video:${key}`);
  if (cached) return { ...cached, cache_hit: true };
  const probe = JSON.parse(await runProcess("ffprobe", ["-v", "error", "-show_format", "-of", "json", path], 120000));
  const directory = join(app.getProjectRoot(job.projectId), "cache", "motion-reference", key);
  const hasAudio = job.payload.analysisMode === "audiovisual" && Boolean(metadata.hasAudio);
  const origin = Number(probe.format?.start_time ?? 0);
  const newReference = job.payload.referencePreprocessingVersion === REFERENCE_PREPROCESSING_VERSION;
  let leadingFrameSeconds: number | undefined;
  let sourceFrames: Awaited<ReturnType<typeof referenceFrameTimes>> | undefined;
  if (job.payload.samplingVersion) {
    sourceFrames = await referenceFrameTimes(path, range);
    leadingFrameSeconds = sourceFrames.timestamps[0];
  }
  const derived = await deriveMediaInput({ id: `library:${id}`, hash, path, kind: "video", hasAudio, startSeconds: origin }, directory, range, undefined, false, leadingFrameSeconds, newReference && sourceFrames ? { frameCount: sourceFrames.timestamps.length, leadingPts: sourceFrames.leadingPts, endPts: sourceFrames.endPts } : undefined);
  const inputFrames = JSON.parse(await runProcess("ffprobe", ["-v", "error", "-count_frames", "-show_entries", "stream=codec_type,nb_read_frames,avg_frame_rate,start_time,duration,time_base", "-of", "json", derived.path], 120000));
  const derivedHasAudio = Array.isArray(inputFrames.streams) && inputFrames.streams.some((stream: { codec_type?: string }) => stream.codec_type === "audio");
  if (hasAudio && !derivedHasAudio) throw new DomainError("参考原片有声音，但提交分析的片段缺少音轨", "MOTION_REFERENCE_AUDIO_MISSING");
  let frameMapping: Array<{ derivedMs: number; sourceMs: number }> | undefined;
  let videoCoverage: Record<string, unknown> | undefined;
  let audioCoverage: Record<string, unknown> | undefined;
  if (newReference && sourceFrames) {
    if (await hashMediaFile(path) !== hash) throw new DomainError("参考原片在派生期间发生变化，请重新读卡", "MOTION_LIBRARY_STALE");
    const actual = JSON.parse(await runProcess("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_frames", "-show_entries", "frame=best_effort_timestamp_time", "-of", "json", derived.path], 120000));
    const times: number[] = actual.frames.map((frame: { best_effort_timestamp_time?: string }) => Number(frame.best_effort_timestamp_time) * 1000);
    const duration = range.endMs - range.startMs;
    const marker = times.at(-1);
    const stream = inputFrames.streams.find((entry: { codec_type?: string }) => entry.codec_type === "video");
    const streamStart = Number(stream?.start_time) * 1000, streamEnd = streamStart + Number(stream?.duration) * 1000;
    const expectedTimes = sourceFrames.timestamps.map(time => Math.max(0, (Math.round(time * 90000) - Math.round((origin + range.startMs / 1000) * 90000)) / 90));
    if (times.length !== sourceFrames.timestamps.length + 1 || times.some(time => !Number.isFinite(time)) || marker === undefined
      || expectedTimes.some((time, index) => Math.abs(times[index]! - time) > 0.03)
      || times.some((time, index) => index > 0 && time <= times[index - 1]!)
      || Math.abs(times[0]!) > 0.02 || marker < duration - 0.002 || times.at(-2)! >= duration || !Number.isFinite(streamEnd) || streamEnd < duration - 0.02) {
      throw new DomainError(`派生画面未覆盖请求窗口 ${range.startMs}–${range.endMs} 毫秒`, "MOTION_REFERENCE_VIDEO_COVERAGE_MISSING");
    }
    frameMapping = sourceFrames.timestamps.map((time, index) => ({ derivedMs: times[index]!, sourceMs: Math.round((time - origin) * 1_000_000) / 1000 }));
    videoCoverage = { source_start_ms: Math.round((sourceFrames.coverageStart - origin) * 1_000_000) / 1000,
      source_end_ms: Math.round((sourceFrames.coverageEnd - origin) * 1_000_000) / 1000, source_time_base: sourceFrames.timeBase,
      selected_first_source_ms: Math.round((sourceFrames.timestamps[0]! - origin) * 1_000_000) / 1000,
      derived_start_ms: streamStart, derived_end_ms: streamEnd, derived_time_base: stream.time_base,
      analysis_start_ms: range.startMs, analysis_end_ms: range.endMs, boundary_marker_ms: marker };
    const sourceInfo = JSON.parse(await runProcess("ffprobe", ["-v", "error", "-select_streams", "a:0", "-show_entries", "stream=start_time,duration,time_base", "-of", "json", path], 120000));
    const audio = sourceInfo.streams?.[0];
    const audioStart = Number(audio?.start_time), audioDuration = Number(audio?.duration);
    if (audio && Number.isFinite(audioStart) && Number.isFinite(audioDuration)) {
      const startMs = (audioStart - origin) * 1000, endMs = startMs + audioDuration * 1000;
      audioCoverage = { source_start_ms: startMs, source_end_ms: endMs, source_time_base: audio.time_base,
        requested_start_ms: range.startMs, requested_end_ms: range.endMs,
        padding_intervals_ms: [[range.startMs, Math.min(range.endMs, startMs)], [Math.max(range.startMs, endMs), range.endMs]].filter(([start, end]) => end! > start!) };
    } else audioCoverage = { source_start_ms: null, source_end_ms: null, source_time_base: audio?.time_base ?? null, requested_start_ms: range.startMs, requested_end_ms: range.endMs, padding_intervals_ms: null };
  }
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
          || (newReference && observed.frame_count !== Math.ceil((range.endMs - range.startMs) / 1000))
          || typeof audio?.included !== "boolean" || audio.included !== derivedHasAudio
          || !Number.isFinite(audio.input_start_ms) || !Number.isFinite(audio.input_end_ms)
          || !Array.isArray(audio.decoded_intervals_ms) || audio.decoded_intervals_ms.some((interval: unknown) => !Array.isArray(interval) || interval.length !== 2 || interval.some(value => typeof value !== "number" || !Number.isFinite(value)))
          || (newReference && (Math.abs(audio.input_start_ms) > 0.002 || Math.abs(audio.input_end_ms - (range.endMs - range.startMs)) > 0.002
            || audio.decoded_intervals_ms.some(([start, end]: [number, number]) => start < 0 || end > range.endMs - range.startMs + 0.002 || end <= start)))) {
          throw new Error("模型返回的采样回执不完整或与实际输入不符");
        }
        const offset = range.startMs;
        description = value.description;
        const modelTimes = observed.frame_timestamps_ms.map((time: number) => {
          if (!frameMapping) return leadingFrameSeconds !== undefined && Math.abs(time) < 0.001 ? Math.round((leadingFrameSeconds - origin) * 1_000_000) / 1000 : offset + time;
          const match = frameMapping.find(frame => Math.abs(frame.derivedMs - time) <= 0.002);
          if (!match || time < 0 || time >= range.endMs - range.startMs) throw new Error("模型采样时间与派生源帧不一致");
          return match.sourceMs;
        });
        sampling = { model_frame_density: "one_per_second", version: observed.version, model_frame_count: observed.frame_count,
          model_source_timestamps_ms: modelTimes,
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
  const result = { id, source_sha256: fingerprint, source_hash: hash, range, description, model: config.modelRevision, schema: response.schemaVersion, run_id: response.runId, input: { path: derived.path, mapping: derived.mapping, source_has_audio: Boolean(metadata.hasAudio), has_audio: derivedHasAudio, streams: inputFrames.streams, video_coverage: videoCoverage, source_audio_coverage: audioCoverage }, sampling, cache_hit: false };
  app.intelligence.store.saveLibraryCache(`motion-video:${key}`, result);
  return result;
}
