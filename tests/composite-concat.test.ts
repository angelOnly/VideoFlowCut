import assert from "node:assert/strict";
import test from "node:test";
import { copyFile, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PNG } from "pngjs";
import { createApplication } from "@videocut/application";
import { runProcess } from "@videocut/speech";
import { compositeTimeline } from "../apps/render-worker/src/ffmpeg-compositor.js";
import { validateOutputFrameRate } from "../apps/render-worker/src/exporter.js";

test("Windows 长目录的 300 段异构画面逐帧拼接，声音及非零起点范围保持一致", { timeout: 180_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-concat-")), app = createApplication(join(root, "workspace"));
  try {
    const { snapshot } = app.createProject({ name: "清单拼接隔离回归" });
    Object.assign(snapshot.timeline, { width: 128, height: 128, fps: 30, durationInFrames: 600 });
    snapshot.project.brief.captionMode = "stable";
    snapshot.scenes.push({ id: "scene", type: "ExplainerScene", title: "混合范围", purpose: "验证接点", startFrame: 0, endFrame: 600 } as any);
    let cursor = 0;
    const expected: boolean[] = [];
    for (let i = 0; i < 300; i++) {
      const startFrame = cursor, endFrame = cursor += i % 3 + 1, browser = i % 3 === 1;
      snapshot.timeline.captions.push({ id: `caption-${i}`, text: String(i), startFrame, endFrame } as any);
      if (browser) snapshot.effectCues.push({ id: `special-${i}`, type: "CameraPunch", status: "ready", sceneId: "scene", layer: "front", startFrame, endFrame, assetBindings: [], props: {} } as any);
      expected.push(...Array(endFrame - startFrame).fill(browser));
    }
    // 浏览器夹具保留 H.264 / yuv444p / MP4 和错误音轨，必须统一视频并丢弃中间音轨。
    const browserSource = join(root, "browser.mp4");
    await runProcess("ffmpeg", ["-v","error","-f","lavfi","-i","color=c=blue:s=128x128:r=30","-f","lavfi","-i","sine=frequency=2000:sample_rate=48000","-t",String(2/30),"-c:v","libx264","-pix_fmt","yuv444p","-c:a","aac",browserSource]);
    const soundPath = join(snapshot.project.rootPath, "assets/source/constant.wav");
    await runProcess("ffmpeg", ["-v","error","-f","lavfi","-i","aevalsrc=0.125|0.125:s=48000:d=20","-c:a","pcm_f32le",soundPath]);
    snapshot.assets.push({ id: "sound", name: "稳定声音", tags: [], kind: "audio", status: "ready", managedPath: "assets/source/constant.wav", createdAt: new Date().toISOString(), metadata: { hasAudio: true, durationMs: 20_000 } });
    snapshot.timeline.tracks.push({ id: "audio", name: "BGM", kind: "audio", order: 0, hidden: false, muted: false, locked: false });
    snapshot.timeline.items.push({ id: "sound-item", assetId: "sound", trackId: "audio", startFrame: 0, endFrame: 600, sourceStartFrame: 0, sourceEndFrame: 600, disabled: false });
    const png = new PNG({ width: 128, height: 128 });
    for (let i = 0; i < png.data.length; i += 4) { png.data[i] = 255; png.data[i + 3] = 255; }
    const caption = PNG.sync.write(png);
    let browserCalls = 0;
    const callbacks = {
      browserRange: async (_state: unknown, from: number, to: number, target: string) => {
        assert.ok(to-from >= 1 && to-from <= 2); browserCalls++; await copyFile(browserSource, target);
      },
      caption: async (_state: unknown, _frame: number, target: string) => { await writeFile(target, caption); }
    };
    const directory = join(root, "Windows长路径与空格'目录_" + "abcdefghij".repeat(10));
    await mkdir(directory);
    const target = join(directory, "complete.mp4"), started = Date.now();
    const plan = await compositeTimeline(snapshot, target, callbacks);
    assert.equal(plan.spans.length, 300); assert.equal(browserCalls, 100);
    assert.ok(plan.spans.length * (target.length + 50) > 32767, "旧多输入命令应超出 Windows 长度限制");
    await validateOutputFrameRate(target, 30, 600);
    const probe = JSON.parse(await runProcess("ffprobe", ["-v","error","-show_streams","-of","json",target]));
    assert.deepEqual(probe.streams.map((s: any) => s.codec_type), ["video", "audio"]);
    assert.equal(probe.streams[0].width, 128); assert.equal(probe.streams[0].height, 128);
    const checkFrames = async (path: string, frames: boolean[]) => {
      const raw = join(root, "pixels.rgb");
      await runProcess("ffmpeg", ["-y","-v","error","-i",path,"-vf","scale=1:1","-pix_fmt","rgb24","-f","rawvideo",raw]);
      const pixels = await readFile(raw); assert.equal(pixels.length, frames.length*3);
      frames.forEach((browser, i) => {
        assert.ok(pixels[i*3+(browser ? 2 : 0)]! > 240 && pixels[i*3+(browser ? 0 : 2)]! < 12, `第 ${i} 帧丢失、重复或接点移位`);
      });
    };
    await checkFrames(target, expected);
    const audio = join(root, "audio.f32");
    await runProcess("ffmpeg", ["-v","error","-i",target,"-vn","-f","f32le",audio]);
    const samples = await readFile(audio);
    for (let frame = 1; frame < 599; frame++) {
      const sample = samples.readFloatLE((frame*1600+800)*8);
      assert.ok(Math.abs(sample-0.125) < 0.01, `第 ${frame} 帧声音丢失、移位或混入中间音轨：${sample}`);
    }
    const part = join(directory, "partial.mp4");
    await compositeTimeline(snapshot, part, callbacks, 19, 26);
    await validateOutputFrameRate(part, 30, 7); await checkFrames(part, expected.slice(19,26));
    assert.deepEqual((await readdir(directory)).filter(p => p.startsWith(".composite-")), []);
    console.log(JSON.stringify({ platform: process.platform, spans: 300, frames: 600, fps: 30, width: 128, height: 128, outputPathLength: target.length, elapsedMs: Date.now()-started, everyFrameVerified: true, audioFramesVerified: 598, partialRange: [19,26] }));
  } finally { app.close(); await rm(root, { recursive: true, force: true }); }
});

test("混合分段失败与已取消合成清除半成品和暂存", async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-concat-failure-")), app = createApplication(join(root, "workspace"));
  try {
    const { snapshot } = app.createProject({ name: "拼接失败清理" });
    Object.assign(snapshot.timeline, { width: 128, height: 128, fps: 30, durationInFrames: 3 });
    snapshot.scenes.push({ id: "scene", type: "ExplainerScene", title: "失败", purpose: "清理", startFrame: 0, endFrame: 3 } as any);
    snapshot.effectCues.push({ id: "special", type: "CameraPunch", status: "ready", sceneId: "scene", layer: "front", startFrame: 1, endFrame: 3, assetBindings: [], props: {} } as any);
    const target = join(root, "failed.mp4");
    const callbacks = { browserRange: async () => { throw new Error("真实阶段失败"); }, caption: async () => { assert.fail("没有字幕"); } };
    await assert.rejects(compositeTimeline(snapshot, target, callbacks), /真实阶段失败/);
    const controller = new AbortController(); controller.abort();
    await assert.rejects(compositeTimeline(snapshot, target, callbacks, 0, 3, controller.signal), { name: "AbortError" });
    assert.deepEqual((await readdir(root)).filter(p => p !== "workspace"), []);
  } finally { app.close(); await rm(root, { recursive: true, force: true }); }
});
