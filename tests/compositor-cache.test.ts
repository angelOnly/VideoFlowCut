import assert from "node:assert/strict";
import test from "node:test";
import { copyFile, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { PNG } from "pngjs";
import { createApplication } from "@videocut/application";
import type { ProjectSnapshot } from "@videocut/contracts";
import { runProcess } from "@videocut/speech";
import { compositeTimeline } from "../apps/render-worker/src/ffmpeg-compositor.js";
import { validateOutputFrameRate } from "../apps/render-worker/src/exporter.js";
import { RenderFileCache } from "../apps/render-worker/src/visual-range-cache.js";
import { timelineAudioDependencies } from "../packages/edit-domain/src/timeline-audio-dependencies.js";
import { validateRenderOutput } from "../apps/render-worker/src/render-output-validation.js";

function pixels(red: number, green: number, blue: number, caption = false) {
  const image = new PNG({ width: 128, height: 128 });
  for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
    if (caption && (x >= 24 || y >= 24)) continue;
    const i = (y * 128 + x) * 4;
    image.data.set([red, green, blue, 255], i);
  }
  return PNG.sync.write(image);
}

const report = async (path: string) => JSON.parse(await readFile(`${path}.render-plan.json`, "utf8"));
const ofKind = (value: any, kind: string) => value.timings.filter((timing: any) => timing.kind === kind);
const videoPackets = async (path: string) => {
  const result = JSON.parse(await runProcess("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_packets", "-show_data_hash", "sha256", "-of", "json", path]));
  return result.packets.map((packet: any) => [packet.pts, packet.dts, packet.duration, packet.data_hash]);
};

test("媒体合成整片命中；字幕只重建覆盖段；音量修改复制视频流；同路径源变化正确失效", { timeout: 90_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-compositor-cache-"));
  const app = createApplication(join(root, "workspace"));
  try {
    const { snapshot } = app.createProject({ name: "声画分层缓存隔离验证" });
    Object.assign(snapshot.timeline, { width: 128, height: 128, fps: 4, durationInFrames: 8 });
    snapshot.project.brief.captionMode = "stable";
    const image = join(snapshot.project.rootPath, "assets/source/image.png");
    await writeFile(image, pixels(190, 20, 20));
    const sound = join(snapshot.project.rootPath, "assets/source/sound.wav");
    await runProcess("ffmpeg", ["-v", "error", "-f", "lavfi", "-i", "aevalsrc=0.125|0.125:s=48000:d=2", "-c:a", "pcm_f32le", sound]);
    snapshot.assets.push(
      { id: "image", name: "主视觉", kind: "image", status: "ready", tags: [], managedPath: "assets/source/image.png", createdAt: "test", metadata: { width: 128, height: 128, durationMs: 2000, hasAudio: false } },
      { id: "sound", name: "声音", kind: "audio", status: "ready", tags: [], managedPath: "assets/source/sound.wav", createdAt: "test", metadata: { hasAudio: true, durationMs: 2000 } }
    );
    snapshot.timeline.tracks = [
      { id: "picture", name: "Background", kind: "video", order: 0, hidden: false, muted: false, locked: false },
      { id: "music", name: "BGM", kind: "audio", order: 1, hidden: false, muted: false, locked: false }
    ];
    snapshot.timeline.items = [
      { id: "picture-item", assetId: "image", trackId: "picture", startFrame: 0, endFrame: 8, sourceStartFrame: 0, sourceEndFrame: 8, disabled: false },
      { id: "music-item", assetId: "sound", trackId: "music", startFrame: 0, endFrame: 8, sourceStartFrame: 0, sourceEndFrame: 8, disabled: false }
    ];
    snapshot.timeline.captions = [
      { id: "first", text: "原字", startFrame: 0, endFrame: 4 },
      { id: "second", text: "保留", startFrame: 4, endFrame: 8 }
    ] as any;
    let captionCalls = 0;
    const callbacks = {
      browserRange: async () => { assert.fail("普通媒体和稳定字幕不应重画主视觉"); },
      caption: async (state: ProjectSnapshot, _frame: number, path: string) => {
        captionCalls++;
        await writeFile(path, state.timeline.captions[0]!.text === "改字" ? pixels(255, 255, 255, true) : pixels(20, 20, 255, true));
      }
    };
    const first = join(root, "preview.mp4");
    await compositeTimeline(snapshot, first, callbacks);
    const initial = await report(first);
    assert.equal(captionCalls, 2);
    assert.equal(initial.reuse, "segments");
    assert.equal(ofKind(initial, "media").length, 2);
    assert.equal(ofKind(initial, "output_validation")[0].frameCount, 8);
    const expected = { width: 128, height: 128, fps: 4, frameCount: 8 };
    await assert.rejects(validateRenderOutput(first, { ...expected, frameCount: 9 }), /帧数不符/);
    await assert.rejects(validateRenderOutput(first, { ...expected, fps: 5 }), /画幅或帧率不符/);
    await assert.rejects(validateRenderOutput(first, { ...expected, width: 192 }), /画幅或帧率不符/);

    const identical = structuredClone(snapshot);
    identical.project.name = "改名不重算"; identical.assets[0]!.name = "素材说明改名";
    const second = join(root, "delivery.mp4");
    await compositeTimeline(identical, second, callbacks);
    assert.equal((await report(second)).reuse, "complete");
    assert.equal(ofKind(await report(second), "output_validation").length, 0, "完整命中只核验字节，不重复解码计数");
    assert.equal(captionCalls, 2);
    assert.deepEqual(await readFile(second), await readFile(first));

    const changed = structuredClone(snapshot);
    changed.timeline.captions[0]!.text = "改字";
    const captionsChanged = join(root, "caption-edit.mp4");
    await compositeTimeline(changed, captionsChanged, callbacks);
    const captionReport = await report(captionsChanged);
    assert.equal(captionCalls, 3);
    assert.deepEqual(ofKind(captionReport, "media").map((entry: any) => entry.cacheHit), [false, true]);
    assert.equal(ofKind(captionReport, "audio")[0].hit, true);
    assert.equal(captionReport.audioKey, initial.audioKey);
    assert.notDeepEqual(await videoPackets(captionsChanged), await videoPackets(first));

    const quiet = structuredClone(changed);
    quiet.audioMixGainDb = -6;
    const quieter = join(root, "quieter.mp4");
    await compositeTimeline(quiet, quieter, callbacks);
    const quietReport = await report(quieter);
    assert.equal(quietReport.reuse, "video_stream");
    assert.equal(ofKind(quietReport, "media").length, 0);
    assert.equal(ofKind(quietReport, "caption").length, 0);
    assert.equal(ofKind(quietReport, "audio")[0].hit, false);
    assert.equal(captionCalls, 3);
    assert.deepEqual(await videoPackets(quieter), await videoPackets(captionsChanged), "视频包内容和时钟必须原样复制");
    await validateOutputFrameRate(quieter, 4, 8);
    const rms = async (path: string, name: string) => {
      const raw = join(root, name);
      await runProcess("ffmpeg", ["-v", "error", "-i", path, "-vn", "-ac", "2", "-ar", "48000", "-f", "f32le", raw]);
      const samples = await readFile(raw); let sum = 0;
      for (let offset = 0; offset < samples.length; offset += 4) sum += samples.readFloatLE(offset) ** 2;
      return Math.sqrt(sum / (samples.length / 4));
    };
    const ratio = await rms(quieter, "quiet.f32") / await rms(captionsChanged, "original.f32");
    assert.ok(Math.abs(ratio - 10 ** (-6 / 20)) < 0.03, `新音量必须真实生效，实测比例 ${ratio}`);

    // 模拟隔离目录中的源文件原地变化，不能因文件名没变而复用旧画面。
    await writeFile(image, pixels(20, 190, 20));
    const replacement = join(root, "source-replaced.mp4");
    await compositeTimeline(quiet, replacement, callbacks);
    const replaced = await report(replacement);
    assert.notEqual(replaced.visualKey, quietReport.visualKey);
    assert.equal(replaced.audioKey, quietReport.audioKey, "没有声音的图片变化不影响混音缓存");
    assert.deepEqual(ofKind(replaced, "media").map((entry: any) => entry.cacheHit), [false, false]);
    assert.equal(ofKind(replaced, "audio")[0].hit, true);
    assert.equal(captionCalls, 3, "已有字幕图仍可复用");
    assert.notDeepEqual(await videoPackets(replacement), await videoPackets(quieter));
    assert.deepEqual((await readdir(root)).filter(name => name.startsWith(".composite-")), []);
  } finally { app.close(); await rm(root, { recursive: true, force: true }); }
});

test("浏览器提前结束时不足帧的分段不发布，下一次完整生成可恢复", { timeout: 30_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-output-validation-")), app = createApplication(root);
  try {
    const { snapshot } = app.createProject({ name: "不足帧缓存验证" });
    Object.assign(snapshot.timeline, { width: 128, height: 128, fps: 4, durationInFrames: 8 });
    const image = join(snapshot.project.rootPath, "assets/source/image.png");
    await writeFile(image, pixels(190, 20, 20));
    snapshot.assets.push({ id: "alpha", name: "需浏览器合成", kind: "image", status: "ready", tags: [], managedPath: "assets/source/image.png", createdAt: "test", metadata: { width: 128, height: 128, durationMs: 2000, hasAudio: false, hasAlpha: true } });
    snapshot.timeline.tracks = [{ id: "picture", name: "Background", kind: "video", order: 0, hidden: false, muted: false, locked: false }];
    snapshot.timeline.items = [{ id: "picture-item", assetId: "alpha", trackId: "picture", startFrame: 0, endFrame: 8, sourceStartFrame: 0, sourceEndFrame: 8, disabled: false }];
    const target = join(root, "output.mp4"), cacheDirectory = join(snapshot.project.rootPath, ".cache/visual-ranges");
    let frames = 4, browserCalls = 0;
    const callbacks = {
      caption: async () => { assert.fail("本例没有字幕"); },
      browserRange: async (_snapshot: ProjectSnapshot, _start: number, _end: number, path: string) => {
        browserCalls++;
        await runProcess("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "color=s=128x128:r=4", "-frames:v", String(frames), "-c:v", "libx264", "-pix_fmt", "yuv420p", path]);
        await assert.rejects(validateRenderOutput(path, { width: 128, height: 128, fps: 4, frameCount: frames }), /声音流/);
      }
    };
    await assert.rejects(compositeTimeline(snapshot, target, callbacks), /帧数不符/);
    assert.deepEqual((await readdir(cacheDirectory)).filter(name => /\.(mp4|nut)(\.json)?$/u.test(name)), []);
    await assert.rejects(stat(target), { code: "ENOENT" });
    frames = 8;
    await compositeTimeline(snapshot, target, callbacks);
    assert.equal(browserCalls, 2);
    assert.equal(ofKind(await report(target), "output_validation")[0].frameCount, 8);
    await compositeTimeline(snapshot, target, callbacks);
    assert.equal(browserCalls, 2);
    assert.equal((await report(target)).reuse, "complete");
  } finally { app.close(); await rm(root, { recursive: true, force: true }); }
});

test("视觉缓存核对实际 Motion 输出路径及可见人物遮罩的字节", { timeout: 30_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-visual-input-hash-")), app = createApplication(root);
  try {
    const { snapshot } = app.createProject({ name: "实际媒体依赖" });
    Object.assign(snapshot.timeline, { width: 128, height: 128, fps: 4, durationInFrames: 8 });
    const source = join(snapshot.project.rootPath, "assets/source/motion.mp4"), mask = join(snapshot.project.rootPath, "assets/source/mask.png");
    const generateSource = (color: string) => runProcess("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", `color=c=${color}:s=128x128:r=4`, "-frames:v", "8", "-c:v", "libx264", "-pix_fmt", "yuv420p", source]);
    await generateSource("red"); await writeFile(mask, pixels(255, 255, 255));
    snapshot.assets.push(
      { id: "motion", name: "实际输出", kind: "video", status: "ready", tags: [], managedPath: "assets/source/not-consumed.mp4", createdAt: "test", metadata: { width: 128, height: 128, durationMs: 2000, hasAudio: false }, motion: { fps: 4, frameCount: 8, output: { path: "assets/source/motion.mp4" } } } as any,
      { id: "mask", name: "人物遮罩", kind: "image", status: "ready", tags: [], managedPath: "assets/source/mask.png", createdAt: "test", metadata: { width: 128, height: 128, durationMs: 2000, hasAudio: false } }
    );
    snapshot.timeline.tracks = [{ id: "picture", name: "Actor / A-roll", kind: "video", order: 0, hidden: false, muted: false, locked: false }];
    snapshot.timeline.items = [{ id: "actor", assetId: "motion", trackId: "picture", startFrame: 0, endFrame: 8, sourceStartFrame: 0, sourceEndFrame: 8, disabled: false }];
    snapshot.actorPerformances.push({ id: "performance", timelineItemId: "actor", status: "ready", maskMode: "alpha_asset", maskAssetId: "mask" } as any);
    let browserCalls = 0;
    const target = join(root, "output.mp4"), callbacks = {
      caption: async () => { assert.fail("本例没有字幕"); },
      browserRange: async (_snapshot: ProjectSnapshot, _start: number, _end: number, path: string) => { browserCalls++; await copyFile(source, path); }
    };
    await compositeTimeline(snapshot, target, callbacks);
    const initial = await report(target);
    await compositeTimeline(snapshot, target, callbacks);
    assert.equal(browserCalls, 1);
    await writeFile(mask, pixels(0, 0, 0));
    await compositeTimeline(snapshot, target, callbacks);
    const maskChanged = await report(target);
    assert.equal(browserCalls, 2);
    assert.notEqual(maskChanged.visualKey, initial.visualKey);
    assert.equal(maskChanged.audioKey, initial.audioKey);
    await generateSource("blue");
    await compositeTimeline(snapshot, target, callbacks);
    assert.equal(browserCalls, 3);
    assert.notEqual((await report(target)).visualKey, maskChanged.visualKey);
  } finally { app.close(); await rm(root, { recursive: true, force: true }); }
});

test("缓存预算耗尽时先保护后续命中段，本次只生成缺失段", { timeout: 30_000 }, async (context) => {
  const root = await mkdtemp(join(tmpdir(), "vfc-cache-consumption-")), app = createApplication(root);
  try {
    const { snapshot } = app.createProject({ name: "消费保护" });
    Object.assign(snapshot.timeline, { width: 128, height: 128, fps: 4, durationInFrames: 8 });
    snapshot.project.brief.captionMode = "stable";
    snapshot.timeline.captions = [
      { id: "first", text: "前段", startFrame: 0, endFrame: 4 },
      { id: "last", text: "后段", startFrame: 4, endFrame: 8 }
    ] as any;
    let captionCalls = 0;
    const target = join(root, "output.mp4"), callbacks = {
      browserRange: async () => { assert.fail("稳定字幕无需浏览器重画整段"); },
      caption: async (_state: ProjectSnapshot, _frame: number, path: string) => { captionCalls++; await writeFile(path, pixels(255, 255, 255, true)); }
    };
    await compositeTimeline(snapshot, target, callbacks);
    const initial = await report(target), laterKey = initial.plan.spans[1].cacheKey;
    const directory = join(snapshot.project.rootPath, ".cache/visual-ranges"), laterName = `${laterKey}.nut`;
    // 只保留后段，让预算恰好容纳它；前段的新字幕入库必然触发真实淘汰。
    for (const name of await readdir(directory)) if (![laterName, `${laterName}.json`].includes(name)) await rm(join(directory, name));
    const budget = (await stat(join(directory, laterName))).size;
    assert.ok(budget > pixels(255, 255, 255, true).length);
    const save = RenderFileCache.prototype.save;
    context.mock.method(RenderFileCache.prototype, "save", async (...args: Parameters<RenderFileCache["save"]>) => save.call(new RenderFileCache(snapshot.project.rootPath, budget), ...args));
    await compositeTimeline(snapshot, target, callbacks);
    const consumed = await report(target);
    assert.deepEqual(ofKind(consumed, "media").map((entry: any) => entry.cacheHit), [false, true]);
    assert.ok(ofKind(consumed, "media").every((entry: any) => entry.lookupElapsedMs >= 0));
    assert.equal(captionCalls, 3, "后段已经取出，本次不得因缓存淘汰再绘制它的字幕");
    assert.equal(ofKind(consumed, "output_validation")[0].frameCount, 8);
    await assert.rejects(stat(join(directory, laterName)), { code: "ENOENT" });
  } finally { context.mock.restoreAll(); app.close(); await rm(root, { recursive: true, force: true }); }
});

test("缓存损坏只重建原键，覆盖容量不重复计数，过大和失败结果不发布", async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-file-cache-"));
  try {
    const cache = new RenderFileCache(root, 100), directory = join(root, ".cache/visual-ranges");
    const a = "a".repeat(64), b = "b".repeat(64), c = "c".repeat(64);
    const source = join(root, "source.bin"), output = join(root, "result.bin");
    await writeFile(source, Buffer.alloc(40, 1));
    assert.equal(await cache.save(a, "nut", source), true);
    await writeFile(source, Buffer.alloc(40, 2));
    assert.equal(await cache.save(b, "nut", source), true);
    await writeFile(source, Buffer.alloc(40, 3));
    assert.equal(await cache.save(a, "nut", source), true);
    assert.equal((await cache.restore(b, "nut", output)).hit, true, "覆盖40字节旧文件时不应误淘汰另一个40字节缓存");

    await writeFile(join(directory, `${a}.nut`), "坏字节");
    let generated = 0;
    const corrupt = await cache.obtain(a, "nut", output, async () => { generated++; await writeFile(output, Buffer.alloc(40, 4)); });
    assert.deepEqual(corrupt, { hit: false, reason: "corrupt" });
    assert.equal(generated, 1);
    assert.equal((await cache.restore(a, "nut", output)).hit, true);

    // 复制目标出错不是源缓存损坏；真实错误应返回，不能删掉已经校验的源文件。
    const unavailable = join(root, "unavailable"); await mkdir(unavailable);
    await assert.rejects(cache.restore(a, "nut", unavailable));
    assert.equal((await cache.restore(a, "nut", output)).hit, true);

    const oversized = await cache.obtain(c, "png", output, async () => { await writeFile(output, Buffer.alloc(101)); });
    assert.deepEqual(oversized, { hit: false, reason: "capacity" });
    assert.equal((await stat(output)).size, 101, "缓存空间不足不影响本次结果");
    assert.equal((await cache.restore(a, "nut", output)).hit, true, "超大结果不能先清空已有缓存");
    await assert.rejects(cache.obtain(c, "wav", output, async () => { throw new Error("生成失败"); }), /生成失败/);
    assert.equal((await cache.restore(c, "wav", output)).hit, false);
    assert.ok((await readdir(directory)).every(name => !name.includes("pending")));
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("声音身份忽略字幕和审阅说明，保留实际 Duck 与混音输入", async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-audio-key-")), app = createApplication(root);
  try {
    const { snapshot } = app.createProject({ name: "声音身份" });
    snapshot.audioCues.push({ timelineItemId: "music", status: "ready", role: "music", purpose: "原说明", updatedAt: "old", ducking: { enabled: true, reductionDb: -12, attackFrames: 3, releaseFrames: 6 } } as any);
    const original = structuredClone(timelineAudioDependencies(snapshot, 0, 30));
    snapshot.timeline.captions.push({ id: "caption", text: "新字幕", startFrame: 0, endFrame: 30 } as any);
    snapshot.audioCues[0]!.purpose = "仅修改说明"; snapshot.audioCues[0]!.updatedAt = "new";
    assert.deepEqual(timelineAudioDependencies(snapshot, 0, 30), original);
    snapshot.audioCues[0]!.ducking!.reductionDb = -18;
    assert.notDeepEqual(timelineAudioDependencies(snapshot, 0, 30), original);
  } finally {
    app.close();
    // 测试目录由本例独立创建，不接触正式 workspace。
    await rm(root, { recursive: true, force: true });
  }
});
