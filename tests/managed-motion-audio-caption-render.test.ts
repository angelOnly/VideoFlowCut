import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApplication } from "@videocut/application";
import { runProcess, probeMedia } from "@videocut/speech";
import { runMotionJob } from "../apps/render-worker/src/motion-job.js";
import { runPreviewJob, RevisionRenderer } from "../apps/render-worker/src/exporter.js";

test("真实纯动效接原WAV和原SRT后可合成，音频起止与频率保持原速", { timeout: 240_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-motion-sound-caption-"));
  const priorWorkspace = process.env.VIDEOCUT_WORKSPACE;
  process.env.VIDEOCUT_WORKSPACE = root;
  const app = createApplication(root);
  try {
    const project = app.createProject({ name: "真实声音字幕合成隔离测试", profile: "visual_explainer" });
    const projectId = project.snapshot.project.id;
    const current = () => app.readProject(projectId);
    const revision = () => current().revision.number;
    app.repository.commit(projectId, revision(), "设置隔离测试画布", snapshot => {
      Object.assign(snapshot.timeline, { width: 480, height: 320, fps: 30 });
      Object.assign(snapshot.timeline.captionFormat!, { fontSize: 24, lineHeight: 1.4, maxLines: 2, backgroundColor: "#173955", textShadow: null });
    });
    const job = app.submitManagedMotion({ projectId, baseRevision: revision(), idempotencyKey: "真实动效", work: {
      name: "移动方块技术测试", creativeBrief: "独立技术测试，用实际移动方块验证原声和SRT的正式合成，不作为创作或审美样片。",
      width: 480, height: 320, fps: 30, durationInFrames: 60,
      props: {}, imageBindings: {},
      source: "import React from 'react';import {AbsoluteFill,useCurrentFrame} from 'remotion';export default function Motion(){const frame=useCurrentFrame();return <AbsoluteFill style={{backgroundColor:'#14283d'}}><div style={{position:'absolute',left:30+frame*3,top:50,width:60,height:60,backgroundColor:'#ea9944'}}/></AbsoluteFill>}"
    } });
    const motionResult = await runMotionJob(app, job);
    app.updateJob(job.id, { status: "succeeded", result: motionResult });
    const scene = app.createScene({ projectId, baseRevision: revision(), type: "ExplainerScene", title: "真实合成", purpose: "技术链路测试", startFrame: 0, endFrame: 60 }).snapshot.scenes.at(-1)!;
    app.createEffectCue({ projectId, baseRevision: revision(), sceneId: scene.id, type: "ManagedMotion", layer: "fullscreen", startFrame: 0, endFrame: 60, assetBindings: [{ slot: "motion", assetId: String(motionResult.assetId) }] });
    const wavPath = join(project.snapshot.project.rootPath, "assets", "original.wav");
    await mkdir(join(project.snapshot.project.rootPath, "assets"), { recursive: true });
    await runProcess("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=48000:duration=2", "-c:a", "pcm_s16le", wavPath]);
    const original = await readFile(wavPath);
    const sourceHash = createHash("sha256").update(original).digest("hex");
    const audio = app.registerImportedAsset({ projectId, baseRevision: revision(), name: "原声音技术正弦.wav", kind: "audio", managedPath: "assets/original.wav", sourceHash, provenance: { source: "local_import", acquiredAt: new Date().toISOString() } }).asset;
    app.applyMediaAnalysis({ projectId, assetId: audio.id, metadata: await probeMedia(wavPath) });
    app.placeNarration({ projectId, baseRevision: revision(), assetId: audio.id, startFrame: 9, sourceStartFrame: 15, sourceEndFrame: 45 });
    const srtText = "1\n00:00:00,300 --> 00:00:00,800\n原音字幕\n\n2\n00:00:00,800 --> 00:00:01,300\n两行字幕\n第二行\n";
    const imported = app.importSrtCaptions({ projectId, baseRevision: revision(), srtText, sourceName: "用户原SRT技术测试.srt", targetRange: { startFrame: 0, endFrame: 60 }, writePolicy: "reject_conflicts", idempotencyKey: "原字幕" });
    assert.deepEqual(imported.snapshot.timeline.captions.map(card => [card.startFrame, card.endFrame, card.text]), [[9, 24, "原音字幕"], [24, 39, "两行字幕\n第二行"]]);
    assert.ok(imported.snapshot.timeline.captions.every(card => card.sourceKind === "user_srt" && card.precision === "subtitle_exact"));
    const preview = app.submitPreview({ projectId, revision: revision(), fromFrame: 0, toFrame: 60 });
    const result = await runPreviewJob(app, preview, new RevisionRenderer(undefined, 1));
    app.updateJob(preview.id, { status: "succeeded", result });
    const path = String(result.path);
    const metadata = await probeMedia(path);
    assert.ok(metadata.hasAudio);
    // AAC 存在编码延迟与末尾填充；视频帧数必须精确，容器只允许三个 AAC 帧的公差。
    assert.equal(result.frameCount, 60);
    assert.ok(Math.abs(metadata.durationMs - 2000) <= 3 * 1024 / 48, JSON.stringify({ metadata, result }));
    const pcm = join(root, "decoded.f32");
    await runProcess("ffmpeg", ["-y", "-v", "error", "-i", path, "-vn", "-ac", "1", "-ar", "48000", "-f", "f32le", pcm]);
    const decoded = await readFile(pcm);
    const sample = (index: number) => decoded.readFloatLE(index * 4);
    const rms = (from: number, to: number) => {
      let energy = 0; const first = Math.round(from * 48000), last = Math.round(to * 48000);
      for (let index = first; index < last; index++) energy += sample(index) ** 2;
      return Math.sqrt(energy / (last - first));
    };
    assert.ok(rms(0.05, 0.2) < 0.001, "目标起点前没有重复或提前播放");
    assert.ok(rms(0.5, 1.1) > 0.04, "目标范围内实际输出声音");
    assert.ok(rms(1.5, 1.9) < 0.001, "源范围结束后没有循环或延长");
    let crossings = 0;
    for (let index = 24001; index < 48000; index++) if (sample(index - 1) <= 0 && sample(index) > 0) crossings++;
    assert.ok(Math.abs(crossings / 0.5 - 440) < 4, "实际解码频率保持原声，未发生隐式变速");
    const rgbaPath = join(root, "composed.rgba");
    await runProcess("ffmpeg", ["-y", "-v", "error", "-i", path, "-f", "rawvideo", "-pix_fmt", "rgba", rgbaPath]);
    const rgba = await readFile(rgbaPath), frameBytes = 480 * 320 * 4;
    assert.equal(rgba.length / frameBytes, 60);
    const whitePixels = (frame: number) => {
      let count = 0;
      for (let offset = frame * frameBytes + 180 * 480 * 4; offset < (frame + 1) * frameBytes; offset += 4) if (rgba[offset]! > 190 && rgba[offset + 1]! > 190 && rgba[offset + 2]! > 190) count++;
      return count;
    };
    assert.equal(whitePixels(3), 0, "字幕范围外无残留文字");
    assert.ok(whitePixels(15) > 40 && whitePixels(30) > 40, "真实合成含一行与两行原SRT字幕");
    assert.equal(whitePixels(48), 0);
    assert.notDeepEqual(rgba.subarray(0, frameBytes), rgba.subarray(48 * frameBytes, 49 * frameBytes), "ManagedMotion 实际运动进入合成");
    assert.deepEqual(await readFile(wavPath), original);
    assert.equal(current().snapshot.timeline.items.filter(item => item.assetId === audio.id).length, 1);
  } finally {
    app.close();
    if (priorWorkspace === undefined) delete process.env.VIDEOCUT_WORKSPACE; else process.env.VIDEOCUT_WORKSPACE = priorWorkspace;
    await rm(root, { recursive: true, force: true });
  }
});
