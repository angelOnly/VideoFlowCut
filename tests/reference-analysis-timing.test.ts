import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createApplication } from "@videocut/application";
import { ComfyUIBridgeClient, type BridgeWorkflow } from "@videocut/bridge";
import { readRuntimeConfig } from "@videocut/project-overview";
import { runProcess } from "@videocut/speech";
import { runMotionReferenceAnalysis } from "../apps/job-worker/src/motion-library.js";
import { deriveMediaInput, REFERENCE_PREPROCESSING_VERSION } from "../packages/media-intelligence/src/derive.js";
import { loadLibraryIndex } from "../references/motion-cases/skillry/tools/library-store.mjs";
import { loadCreativeIndex, readCreativeCase } from "../references/motion-cases/skillry/tools/creative-library.mjs";
import { referenceFrameTimes } from "../packages/media-intelligence/src/reference-frame-times.js";

test("真实参考的分数边界和完整声画窗口进入派生文件并映射回源帧", { timeout: 180_000 }, async () => {
  const directory = await mkdtemp(join(tmpdir(), "vfc-reference-time-"));
  const app = createApplication(directory);
  try {
    const projectId = app.createProject({ name: "参考分析时间隔离验证" }).snapshot.project.id;
    const root = resolve("references/motion-cases/skillry"), motion = loadLibraryIndex(root), creative = loadCreativeIndex(root);
    const config = readRuntimeConfig(), modelConfig = { ...config.semantic, apiBaseUrl: config.bridge.apiBaseUrl };
    const workflow: BridgeWorkflow = { id: config.semantic.videoWorkflowId, schemaVersion: "timing-test", name: "时间验证",
      fields: ["prompt", "start_seconds", "duration_seconds"].map(id => ({ id, label: id, kind: "text", required: false })), itemSlots: [], outputs: [] };
    const bridge = new ComfyUIBridgeClient(config.bridge.apiBaseUrl);
    let sampling: Record<string, unknown> = {};
    bridge.getWorkflow = async () => workflow;
    bridge.findRequiredSlot = () => ({ id: "video", label: "视频", mediaKind: "video", min: 1, max: 1 });
    bridge.createRunWithWorkflow = async (_id, build) => {
      const request = await build(workflow), duration = Number(request.fieldValues.duration_seconds);
      const probe = JSON.parse(await runProcess("ffprobe", ["-v", "error", "-show_frames", "-show_entries", "frame=media_type,best_effort_timestamp_time", "-of", "json", request.files![0].path]));
      const frames: number[] = probe.frames.filter((frame: { media_type: string }) => frame.media_type === "video").map((frame: { best_effort_timestamp_time: string }) => Number(frame.best_effort_timestamp_time) * 1000);
      const timestamps = Array.from({ length: Math.ceil(duration) }, (_, second) => frames.filter(time => time <= second * 1000 + 0.001).at(-1)!);
      const included = probe.frames.some((frame: { media_type: string }) => frame.media_type === "audio");
      sampling = { version: "minicpmo-one-per-second-v1", frame_count: timestamps.length, frame_timestamps_ms: timestamps,
        audio: { included, sample_rate: included ? 16000 : null, input_start_ms: 0, input_end_ms: duration * 1000, decoded_intervals_ms: included ? [[0, duration * 1000]] : [] } };
      return { workflow, request, schemaRetryCount: 0, run: { id: "isolated-run", status: "running", outputs: [] } };
    };
    bridge.waitForRun = async id => ({ id, status: "succeeded", outputs: [{ outputSlotId: "observation", kind: "json", displayName: "采样",
      value: { schema: "motion-reference-observation-v1", description: "隔离采样", sampling } }] });
    for (const item of [
      { id: "026-m07", startMs: 10083, endMs: 22017, source_sha256: motion.source_sha256 },
      { id: "026-m07", startMs: 10083.5, endMs: 12017.25, source_sha256: motion.source_sha256 },
      { id: "032-m09", startMs: 3875, endMs: 11750, source_sha256: motion.source_sha256 },
      { id: "130-c01", startMs: 0, endMs: 10500, source_sha256: creative.source_sha256 },
      { id: "016-c01", startMs: 0, endMs: 15000, source_sha256: creative.source_sha256 }
    ]) {
      const range = { startMs: item.startMs, endMs: item.endMs };
      const payload = { id: item.id, source_sha256: item.source_sha256, range, modelConfig, analysisMode: "audiovisual",
        samplingVersion: "minicpmo-one-per-second-v1", referencePreprocessingVersion: REFERENCE_PREPROCESSING_VERSION };
      const job = app.repository.createJob({ projectId, kind: "motion_reference_analysis", payload, idempotencyKey: `${item.id}:${item.startMs}` });
      const result = await runMotionReferenceAnalysis(app, job, bridge);
      const input = result.input as { video_coverage: { source_start_ms: number; source_end_ms: number; selected_first_source_ms: number; boundary_marker_ms: number; derived_end_ms: number }; mapping: { preprocessing: string } };
      assert.equal(input.mapping.preprocessing, REFERENCE_PREPROCESSING_VERSION);
      assert.ok(input.video_coverage.source_start_ms <= input.video_coverage.selected_first_source_ms && input.video_coverage.selected_first_source_ms <= item.startMs, item.id);
      assert.ok(input.video_coverage.source_end_ms >= item.endMs, item.id);
      assert.ok(input.video_coverage.boundary_marker_ms >= item.endMs - item.startMs - 0.002, item.id);
      assert.ok(input.video_coverage.derived_end_ms >= item.endMs - item.startMs - 0.02, item.id);
      const times = (result.sampling as { model_source_timestamps_ms: number[] }).model_source_timestamps_ms;
      assert.equal(times.length, Math.ceil((item.endMs - item.startMs) / 1000));
      assert.ok(times.every(time => time < item.endMs), item.id);
    }
    const source016 = (readCreativeCase(root, { id: "016-c01", source_sha256: creative.source_sha256, include_storyboard: false }).result.resources as { video: { absolute_path: string } }).video.absolute_path;
    await assert.rejects(referenceFrameTimes(source016, { startMs: 14990, endMs: 15061 }), { code: "MOTION_REFERENCE_VIDEO_COVERAGE_MISSING" }, "音轨尾部不能伪造成视频画面覆盖");
  } finally { app.close(); await rm(directory, { recursive: true, force: true }); }
});

test("参考片段保留晚入音轨与 AAC 实际解码时间", { timeout: 60_000 }, async () => {
  const directory = await mkdtemp(join(tmpdir(), "vfc-reference-audio-offset-"));
  try {
    const source = join(directory, "late-audio.mp4"), rawAudio = join(directory, "decoded.pcm");
    await runProcess("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i", "testsrc=size=160x90:rate=30:duration=2",
      "-itsoffset", "0.4", "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=48000:duration=1.6", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-t", "2", source]);
    const range = { startMs: 200, endMs: 1200 }, frames = await referenceFrameTimes(source, range);
    const derived = await deriveMediaInput({ id: "offset", hash: "fixture", kind: "video", path: source, hasAudio: true, startSeconds: frames.origin },
      join(directory, "derived"), range, undefined, false, frames.timestamps[0], { frameCount: frames.timestamps.length, leadingPts: frames.leadingPts, endPts: frames.endPts });
    await runProcess("ffmpeg", ["-v", "error", "-y", "-i", derived.path, "-vn", "-ac", "1", "-ar", "16000", "-f", "s16le", rawAudio]);
    const pcm = await readFile(rawAudio);
    const average = (start: number, end: number) => {
      let total = 0;
      for (let i = Math.round(start * 16000); i < Math.round(end * 16000); i++) total += Math.abs(pcm.readInt16LE(i * 2));
      return total / Math.round((end - start) * 16000);
    };
    assert.ok(pcm.length >= 16000 * 2, "AAC 解码不能截断请求音频");
    assert.ok(average(0.02, 0.12) < 50, "晚入音轨之前保留静音");
    assert.ok(average(0.3, 0.5) > 500, "声轨按源时钟进入请求窗口");
  } finally { await rm(directory, { recursive: true, force: true }); }
});
