import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runProcess } from "@videocut/speech";
import type { MediaSource } from "@videocut/contracts";
import { measureAudioVisualTiming } from "../packages/media-intelligence/src/timing.js";

test("同一硬切的声音延迟可定位，多个起音保持不确定", async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-av-timing-"));
  try {
    async function make(name: string, delay: number, multiple = false, timeOffset = 0): Promise<MediaSource> {
      const path = join(root, name + ".mp4");
      const audio = multiple
        ? `[2:a]asplit[x][y];[x]adelay=${delay}[a];[y]adelay=${delay + 350}[b];[a][b]amix=inputs=2:duration=longest,apad=whole_dur=2[aout]`
        : `[2:a]adelay=${delay},apad=whole_dur=2[aout]`;
      await runProcess("ffmpeg", ["-y", "-f", "lavfi", "-i", "color=c=black:s=64x64:r=25:d=1",
        "-f", "lavfi", "-i", "color=c=white:s=64x64:r=25:d=1",
        "-f", "lavfi", "-i", "sine=frequency=1000:sample_rate=48000:duration=0.12",
        "-filter_complex", `[0:v][1:v]concat=n=2:v=1:a=0[v];${audio}`, "-map", "[v]", "-map", "[aout]",
        "-t", "2", "-c:v", "mpeg4", "-c:a", "aac", ...(timeOffset ? ["-output_ts_offset", String(timeOffset)] : []), path]);
      const probe = JSON.parse(await runProcess("ffprobe", ["-v", "error", "-show_format", "-of", "json", path]));
      return { id: name, projectId: "test", target: { exportArtifactId: name }, identity: "derived", hash: name,
        path, kind: "video", durationMs: 2000, hasAudio: true, startSeconds: Number(probe.format.start_time ?? 0), streams: [],
        composition: { revision: 1, fromFrame: 0, toFrame: 50, fps: 25 }, createdAt: new Date().toISOString() };
    }
    const a = await make("aligned", 1000);
    const b = await make("delayed", 1200);
    const c = await make("ambiguous", 1000, true);
    const shifted = await make("shifted-start", 1200, false, 3);
    const range = { startMs: 500, endMs: 1800 };
    const aligned = await measureAudioVisualTiming(a, range, join(root, "a"));
    const delayed = await measureAudioVisualTiming(b, range, join(root, "b"));
    const ambiguous = await measureAudioVisualTiming(c, range, join(root, "c"));
    const shiftedResult = await measureAudioVisualTiming(shifted, range, join(root, "shifted"));
    assert.ok(shifted.startSeconds! > 2);
    assert.equal(shiftedResult.status, "measured", JSON.stringify(shiftedResult));
    assert.ok(Math.abs(shiftedResult.offsetMs! - 200) <= 40, JSON.stringify(shiftedResult));
    assert.equal(aligned.status, "measured", JSON.stringify(aligned));
    assert.equal(delayed.status, "measured", JSON.stringify(delayed));
    assert.ok(Math.abs(aligned.offsetMs!) <= 40, JSON.stringify(aligned));
    assert.ok(Math.abs(delayed.offsetMs! - 200) <= 40, JSON.stringify(delayed));
    assert.equal(ambiguous.status, "inconclusive", JSON.stringify(ambiguous));
    assert.equal(ambiguous.offsetMs, undefined);

    const { createApplication } = await import("@videocut/application");
    const { createScene } = await import("@videocut/domain");
    const { ComfyUIBridgeClient } = await import("@videocut/bridge");
    const { createDefaultAssetProviderRegistry } = await import("@videocut/acquisition");
    const { hashMediaFile } = await import("../packages/edit-application/src/media-intelligence.js");
    const { runMediaUnderstanding } = await import("../apps/job-worker/src/media-understanding.js");
    const { mkdir, copyFile, stat } = await import("node:fs/promises");
    const app = createApplication(join(root, "project-workspace"));
    try {
      const project = app.createProject({ name: "声画测量任务" });
      const projectId = project.snapshot.project.id;
      const revision = app.repository.commit(projectId, project.revision.number, "测试时间线", snapshot => {
        snapshot.timeline.fps = 25;
        snapshot.scenes.push(Object.assign(createScene({ type: "ExplainerScene", title: "测量", purpose: "验证时间", startFrame: 0, endFrame: 50 }), { status: "ready" as const }));
      });
      const exportsDir = join(project.snapshot.project.rootPath, "exports");
      await mkdir(exportsDir, { recursive: true });
      const output = join(exportsDir, "delayed.mp4");
      await copyFile(b.path, output);
      const exportJob = app.repository.createJob({ projectId, kind: "export", payload: { revision: revision.revision.number }, idempotencyKey: "timing-export" });
      app.updateJob(exportJob.id, { status: "succeeded", result: { path: output } });
      const artifact = app.registerExportArtifact({ id: "timing-artifact", projectId, revision: revision.revision.number,
        jobId: exportJob.id, purpose: "delivery", relativePath: "exports/delayed.mp4",
        fileHash: await hashMediaFile(output), fileSizeBytes: (await stat(output)).size, createdAt: new Date().toISOString(),
        preflight: {} as any, sourceManifest: {} as any, validation: { durationMs: 2000, fps: 25, frameCount: 50, hasAudio: true, blackSegments: [] } });
      const job = await app.intelligence.submitAnalysis(projectId, { exportArtifactId: artifact.id, depth: "review",
        modalities: ["visual", "audio"], range, timingCheck: { kind: "hard_cut_audio" } });
      const config = job.payload.modelConfig as { apiBaseUrl: string };
      await runMediaUnderstanding(app, job, new ComfyUIBridgeClient(config.apiBaseUrl), createDefaultAssetProviderRegistry());
      const observations = app.intelligence.inspect(projectId, { exportArtifactId: artifact.id }).observations;
      assert.equal(observations[0].timingMeasurement?.status, "measured");
      assert.ok(Math.abs(observations[0].timingMeasurement!.offsetMs! - 200) <= 40);
      const review = { projectId, artifactId: artifact.id, operationId: "timing-review", observer: "隔离测试",
        observations: [{ check: "event_sync" as const, subjectId: "cut-sound", required: true, method: "event_measurement" as const,
          outcome: "confirmed" as const, startFrame: 13, endFrame: 45, note: "确认同一事件的测量结果", mediaObservationIds: [observations[0].id] }] };
      const saved = await app.recordExportArtifactReview(review);
      assert.equal(saved.artifactReview?.observations?.[0].mediaObservationIds?.[0], observations[0].id);
      await assert.rejects(() => app.recordExportArtifactReview({ ...review, operationId: "fake-continuous",
        observations: [{ ...review.observations[0], check: "audiovisual", method: "audiovisual" }] }));
    } finally { app.close(); }

  } finally { await rm(root, { recursive: true, force: true }); }
});
