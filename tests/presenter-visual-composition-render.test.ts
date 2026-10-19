import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PNG } from "pngjs";
import { createApplication } from "@videocut/application";
import { runProcess, probeMedia } from "@videocut/speech";
import { runMotionJob } from "../apps/render-worker/src/motion-job.js";
import { hashMotionFile } from "../apps/render-worker/src/motion-video.js";
import { runPreviewJob, RevisionRenderer } from "../apps/render-worker/src/exporter.js";

test("真实人物源缩窗与返回：透明接管无双人物，front/字幕在上，原声和 Dialogue 各自连续且静音生效", { timeout: 240_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-presenter-composition-render-"));
  const previousWorkspace = process.env.VIDEOCUT_WORKSPACE;
  process.env.VIDEOCUT_WORKSPACE = root;
  const app = createApplication(root);
  try {
    const project = app.createProject({ name: "人物共同合成技术验证", profile: "presenter_motion" });
    const projectId = project.snapshot.project.id;
    const current = () => app.readProject(projectId);
    const rev = () => current().revision.number;
    const source = join(project.snapshot.project.rootPath, "assets/source/actor.mp4");
    // 可重复的真实视频源带时间变化和声音，不代表 Provider 的人物生成能力。
    await runProcess("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "testsrc2=s=320x320:r=30:d=3", "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=48000:duration=3", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", source]);
    const actor = app.registerImportedAsset({ projectId, baseRevision: rev(), name: "时钟与声音测试源", kind: "video", managedPath: "assets/source/actor.mp4", sourceHash: await hashMotionFile(source) }).asset;
    app.applyMediaAnalysis({ projectId, assetId: actor.id, metadata: await probeMedia(source) });
    app.repository.commit(projectId, rev(), "隔离画布与字幕样式", snapshot => {
      Object.assign(snapshot.timeline, { width: 320, height: 320, fps: 30 });
      Object.assign(snapshot.timeline.captionFormat!, { fontSize: 24, maxLines: 1, backgroundColor: "#000000", textShadow: null });
    });
    app.assemblePresenterTrack({ projectId, baseRevision: rev(), assetIds: [actor.id] });
    const itemId = current().snapshot.timeline.items[0]!.id;
    app.repository.commit(projectId, rev(), "测试源裁切和原声增益", snapshot => {
      Object.assign(snapshot.timeline.items[0]!, { sourceStartFrame: 15, sourceEndFrame: 75, endFrame: 60, gainDb: -6 });
      snapshot.timeline.durationInFrames = 60;
    });
    const scene = app.compilePresenterScenes({ projectId, baseRevision: rev(), scenes: [{ title: "缩窗与返回", purpose: "共同合成技术验证", startFrame: 0, endFrame: 60 }] }).snapshot.scenes[0]!;
    const setMode = (audioMode: "use_source_audio" | "use_dialogue_track" | "muted") => app.registerActorPerformance({ projectId, baseRevision: rev(), timelineItemId: itemId, source: "imported", maskMode: "none", audioMode });
    setMode("use_source_audio");
    const png = new PNG({ width: 32, height: 32 });
    for (let i = 0; i < png.data.length; i += 4) { png.data[i] = 255; png.data[i + 3] = 255; }
    const materialPath = join(project.snapshot.project.rootPath, "assets/source/material.png");
    await writeFile(materialPath, PNG.sync.write(png));
    const material = app.registerImportedAsset({ projectId, baseRevision: rev(), name: "资料像素夹具", kind: "image", managedPath: "assets/source/material.png", sourceHash: await hashMotionFile(materialPath) }).asset;
    app.applyMediaAnalysis({ projectId, assetId: material.id, metadata: await probeMedia(materialPath) });
    const work = app.submitManagedMotion({ projectId, baseRevision: rev(), idempotencyKey: "primary", work: {
      name: "真实源持续缩窗", creativeBrief: "技术验证：透明主场面中连续缩窗、材料与图形展开、再返回；检验真实源帧及合成层序，不作为审美样片。",
      width: 320, height: 320, fps: 30, durationInFrames: 30, props: {}, imageBindings: { material: material.id },
      videoBindings: { actor: { assetId: actor.id, sourceStartMs: 1000, sourceEndMs: 2000, startFrame: 0, endFrame: 30 } },
      source: "import React from 'react';import {Img,useCurrentFrame,interpolate} from 'remotion';import {TimelineVideo} from '@videoflowcut/motion';export default function Motion(props){const f=useCurrentFrame();const size=interpolate(f,[0,10,20,29],[320,120,120,320]);return <><TimelineVideo slot='actor' style={{position:'absolute',left:0,top:0,width:size,height:size}}/>{f>=10&&f<=20?<><Img src={props.assets.material} style={{position:'absolute',left:220,top:50,width:80,height:80}}/><div style={{position:'absolute',left:150,top:170,width:f*4,height:10,background:'#00ffff'}}/></>:null}</>}"
    } });
    const motion = await runMotionJob(app, work); app.updateJob(work.id, { status: "succeeded", result: motion });
    app.createEffectCue({ projectId, baseRevision: rev(), sceneId: scene.id, type: "ManagedMotion", layer: "fullscreen", startFrame: 15, endFrame: 45, visualComposition: { role: "primary", replacesActorItemIds: [itemId] }, assetBindings: [{ slot: "motion", assetId: String(motion.assetId) }] });
    const frontJob = app.submitManagedMotion({ projectId, baseRevision: rev(), idempotencyKey: "front", work: {
      name: "前景层序夹具", creativeBrief: "验证普通 front 在主场面之上。", width: 320, height: 320, fps: 30, durationInFrames: 60, props: {}, imageBindings: {},
      source: "import React from 'react';export default function Motion(){return <div style={{position:'absolute',left:0,top:0,width:320,height:12,background:'#ff00ff'}}/>}"
    } });
    const front = await runMotionJob(app, frontJob); app.updateJob(frontJob.id, { status: "succeeded", result: front });
    app.createEffectCue({ projectId, baseRevision: rev(), sceneId: scene.id, type: "ManagedMotion", layer: "front", startFrame: 0, endFrame: 60, assetBindings: [{ slot: "motion", assetId: String(front.assetId) }] });
    app.importSrtCaptions({ projectId, baseRevision: rev(), srtText: "1\n00:00:00,000 --> 00:00:02,000\n统一字幕\n", sourceName: "技术字幕", targetRange: { startFrame: 0, endFrame: 60 }, writePolicy: "reject_conflicts", idempotencyKey: "captions" });
    const renderer = new RevisionRenderer(undefined, 1);
    async function render(label: string) {
      const job = app.submitPreview({ projectId, revision: rev(), fromFrame: 0, toFrame: 60 });
      const result = await runPreviewJob(app, job, renderer); app.updateJob(job.id, { status: "succeeded", result });
      const path = String(result.path), pcm = join(root, `${label}.f32`);
      if ((await probeMedia(path)).hasAudio) await runProcess("ffmpeg", ["-y", "-v", "error", "-i", path, "-vn", "-ac", "1", "-ar", "48000", "-f", "f32le", pcm]);
      const data = (await probeMedia(path)).hasAudio ? await readFile(pcm) : Buffer.alloc(96000 * 4);
      const rms = (from: number, to: number) => { let sum = 0; for (let n = from * 48000; n < to * 48000; n++) sum += data.readFloatLE(Math.floor(n) * 4) ** 2; return Math.sqrt(sum / ((to - from) * 48000)); };
      return { path, rms, data };
    }
    const sourceOutput = await render("source");
    const loudness = [sourceOutput.rms(0.15, 0.35), sourceOutput.rms(0.8, 1.2), sourceOutput.rms(1.65, 1.85)];
    assert.ok(loudness.every(value => value > 0.025 && value < 0.06), JSON.stringify(loudness));
    assert.ok(Math.max(...loudness) / Math.min(...loudness) < 1.15, "跨接管区间没有丢声或双声");
    const rgbaPath = join(root, "output.rgba");
    await runProcess("ffmpeg", ["-y", "-v", "error", "-i", sourceOutput.path, "-f", "rawvideo", "-pix_fmt", "rgba", rgbaPath]);
    const rgba = await readFile(rgbaPath), frameBytes = 320 * 320 * 4;
    const pixel = (frame: number, x: number, y: number) => [...rgba.subarray(frame * frameBytes + (y * 320 + x) * 4, frame * frameBytes + (y * 320 + x) * 4 + 3)];
    assert.ok(pixel(30, 300, 150).every(value => value < 35), "透明区域没有外层全屏人物残影");
    assert.ok(pixel(30, 260, 80)[0]! > 220 && pixel(30, 260, 80)[1]! < 40, "真实资料进入共同场面");
    for (const frame of [14, 15, 30, 44, 45]) {
      const top = pixel(frame, 160, 4); assert.ok(top[0]! > 220 && top[2]! > 220 && top[1]! < 40, "普通 front 仍在上层");
    }
    let captionPixels = 0;
    for (let y = 220; y < 315; y++) for (let x = 30; x < 290; x++) if (pixel(30, x, y).every(value => value > 200)) captionPixels++;
    assert.ok(captionPixels > 40, "最终画布字幕在主作品之上");
    // 对照原文件边界帧，既验证接入也验证返回，没有重播源起点。
    const rawSourcePath = join(root, "source.rgba");
    await runProcess("ffmpeg", ["-y", "-v", "error", "-i", source, "-an", "-f", "rawvideo", "-pix_fmt", "rgba", rawSourcePath]);
    const rawSource = await readFile(rawSourcePath);
    for (const frame of [14, 15, 44, 45]) {
      let error = 0, count = 0;
      for (let y = 20; y < 180; y += 4) for (let x = 10; x < 310; x += 4) for (let c = 0; c < 3; c++) {
        const offset = (y * 320 + x) * 4 + c;
        error += Math.abs(rgba[frame * frameBytes + offset]! - rawSource[(frame + 15) * frameBytes + offset]!); count++;
      }
      assert.ok(error / count < 12, `F${frame} 源帧连续误差 ${error / count}`);
    }
    const audioPath = join(project.snapshot.project.rootPath, "assets/source/dialogue.wav");
    await runProcess("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "sine=frequency=880:sample_rate=48000:duration=3", audioPath]);
    const dialogue = app.registerImportedAsset({ projectId, baseRevision: rev(), name: "独立 Dialogue 测试声", kind: "audio", managedPath: "assets/source/dialogue.wav", sourceHash: await hashMotionFile(audioPath) }).asset;
    app.applyMediaAnalysis({ projectId, assetId: dialogue.id, metadata: await probeMedia(audioPath) });
    app.placeNarration({ projectId, baseRevision: rev(), assetId: dialogue.id, startFrame: 0, sourceStartFrame: 15, sourceEndFrame: 75 });
    setMode("use_dialogue_track");
    const dialogueOutput = await render("dialogue");
    let crossings = 0;
    for (let i = 24001; i < 72000; i++) if (dialogueOutput.data.readFloatLE((i - 1) * 4) <= 0 && dialogueOutput.data.readFloatLE(i * 4) > 0) crossings++;
    assert.ok(Math.abs(crossings - 880) < 5, "实际输出只有 Dialogue 的声音频率");
    assert.ok(dialogueOutput.rms(0.8, 1.2) > 0.07 && dialogueOutput.rms(0.8, 1.2) < 0.11);
    setMode("muted");
    app.repository.commit(projectId, rev(), "验证明确静音", snapshot => { snapshot.timeline.tracks.find(track => track.name === "Dialogue")!.muted = true; });
    assert.ok((await render("muted")).rms(0.8, 1.2) < 0.001, "接管没有重新放出源视频声音");
  } finally {
    app.close();
    if (previousWorkspace === undefined) delete process.env.VIDEOCUT_WORKSPACE; else process.env.VIDEOCUT_WORKSPACE = previousWorkspace;
    await rm(root, { recursive: true, force: true });
  }
});
