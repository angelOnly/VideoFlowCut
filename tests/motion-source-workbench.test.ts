import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import puppeteer from "puppeteer-core";
import { createServer as createViteServer } from "vite";
import { PNG } from "pngjs";
import { createServer } from "../apps/server/src/app.js";
import { runMotionJob } from "../apps/render-worker/src/motion-job.js";
import { resolveRenderBrowser } from "../packages/remotion-runtime/src/browser.js";
import { runProcess } from "@videocut/speech";
import { motionHtml } from "./fixtures/hyperframes.js";
import { motionSubmissionSchema } from "../packages/motion-work/src/schema.js";
import { readOutputFrame } from "./fixtures/motion-output.js";
import { runPreviewJob, runExportJob } from "../apps/render-worker/src/exporter.js";
import { reviewSoundMix } from "../packages/edit-application/src/sound-review.js";

test("固定源码直接进入工作台，真实图片字体视频按根帧预览，换版后按需生成同作品媒体", { timeout: 180_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-source-workbench-"));
  const priorApi = process.env.VITE_API_BASE;
  const { app: server, application: app } = await createServer({ workspaceRoot: root });
  let vite: Awaited<ReturnType<typeof createViteServer>> | undefined;
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined;
  try {
    const created = app.createProject({ name: "固定源码全链路", profile: "visual_explainer", fps: 24 });
    const id = created.snapshot.project.id, projectRoot = created.snapshot.project.rootPath;
    const rev = () => app.readProject(id).revision.number;
    app.repository.commit(id, rev(), "隔离样片规格", snapshot => Object.assign(snapshot.timeline, { width: 320, height: 320, durationInFrames: 24 }));
    await mkdir(join(projectRoot, "assets/source"), { recursive: true });
    const png = new PNG({ width: 32, height: 32 }); png.data.fill(255);
    const imageBytes = PNG.sync.write(png);
    await writeFile(join(projectRoot, "assets/source/image.png"), imageBytes);
    const image = app.registerImportedAsset({ projectId: id, baseRevision: rev(), name: "实图", kind: "image", managedPath: "assets/source/image.png", sourceHash: createHash("sha256").update(imageBytes).digest("hex") });
    app.applyMediaAnalysis({ projectId: id, assetId: image.asset.id, metadata: { durationMs: 0, width: 32, height: 32, hasAudio: false } });
    const videoPath = join(projectRoot, "assets/source/video.mp4");
    await runProcess("ffmpeg", ["-v", "error", "-f", "lavfi", "-i", "testsrc2=s=64x64:r=30:d=2", "-c:v", "libx264", "-pix_fmt", "yuv420p", videoPath]);
    const { hashMediaFile } = await import("../packages/edit-application/src/media-intelligence.js");
    const video = app.registerImportedAsset({ projectId: id, baseRevision: rev(), name: "视频槽原件", kind: "video", managedPath: "assets/source/video.mp4", sourceHash: await hashMediaFile(videoPath) });
    app.applyMediaAnalysis({ projectId: id, assetId: video.asset.id, metadata: { durationMs: 2000, width: 64, height: 64, fps: 30, hasAudio: false, videoCodec: "h264" } });
    const scene = app.createScene({ projectId: id, baseRevision: rev(), type: "ExplainerScene", title: "源码场面", purpose: "核对真实资源及源帧", startFrame: 0, endFrame: 24 }).snapshot.scenes.at(-1)!;
    const audioPath = join(projectRoot, "assets/source/sound.wav");
    await runProcess("ffmpeg", ["-v", "error", "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=48000:duration=1", "-c:a", "pcm_s16le", audioPath]);
    const audio = app.registerImportedAsset({ projectId: id, baseRevision: rev(), name: "真实声音样片", kind: "audio", managedPath: "assets/source/sound.wav", sourceHash: await hashMediaFile(audioPath) });
    app.applyMediaAnalysis({ projectId: id, assetId: audio.asset.id, metadata: { durationMs: 1000, hasAudio: true, audioCodec: "pcm_s16le", sampleRate: 48000, channels: 1 } });
    const work = motionSubmissionSchema.parse({ name: "源码版本一", creativeBrief: "隔离技术样片，检查图片字体视频、非零源偏移及跨帧率，不能当作正式作品审美通过。", width: 320, height: 320, fps: 30, durationInFrames: 60,
      imageBindings: { image: image.asset.id }, fontBindings: { title: "noto-sans-sc-bold" },
      videoBindings: { clip: { assetId: video.asset.id, sourceStartMs: 0, sourceEndMs: 2000, startFrame: 0, endFrame: 60 } }, props: { label: "版本一" },
      source: motionHtml('<img data-vfc-image-slot="image" style="position:absolute;left:0;top:0;width:32px;height:32px"><img id="clip" data-vfc-video-slot="clip" style="position:absolute;left:64px;top:0;width:64px;height:64px"><div id="title" style="position:absolute;left:20px;top:150px;color:white;font-size:24px;font-family:var(--vfc-font-title)"></div><div id="marker" style="position:absolute;left:0;top:90px;width:20px;height:20px;background:#ff0000"></div>', "document.querySelector('#title').textContent=props.label;tl.to('#marker',{x:100,duration:2,ease:'none'},0);window.getVfcMotionEvents=()=>[{id:'move',meaning:'标记移动',startFrame:0,endFrame:60},{id:'land',meaning:'中段落定',startFrame:15,endFrame:30}];", { width: 320, height: 320, fps: 30, durationInFrames: 60 }) });
    const prepare = app.registerMotionWork({ projectId: id, baseRevision: rev(), idempotencyKey: "prepare-one", work });
    const result = await runMotionJob(app, prepare);
    assert.equal(result.capturedFrames, 0);
    assert.equal(app.readProject(id).snapshot.assets.filter(asset => asset.motion).length, 0);
    const workId = String(result.workId);
    const placed = app.createEffectCue({ projectId: id, baseRevision: rev(), sceneId: scene.id, type: "ManagedMotion", layer: "fullscreen", startFrame: 0, endFrame: 24, sourceStartFrame: 6, sourceEndFrame: 30, workId });
    const cueId = placed.snapshot.effectCues.at(-1)!.id;
    app.placeNarration({ projectId: id, baseRevision: rev(), assetId: audio.asset.id, startFrame: 0, sourceStartFrame: 0, sourceEndFrame: 24 });
    app.repository.commit(id, rev(), "隔离字幕规格", snapshot => { snapshot.timeline.captionFormat!.fontSize = 20; });
    app.importSrtCaptions({ projectId: id, baseRevision: rev(), srtText: "1\n00:00:00,250 --> 00:00:00,750\n技术样片\n", sourceName: "隔离字幕.srt", targetRange: { startFrame: 0, endFrame: 24 }, writePolicy: "reject_conflicts", idempotencyKey: "captions" });

    const apiUrl = await server.listen({ host: "127.0.0.1", port: 0 });
    process.env.VITE_API_BASE = apiUrl;
    vite = await createViteServer({ configFile: resolve("apps/web/vite.config.ts"), server: { host: "127.0.0.1", port: 0 }, logLevel: "silent" }); await vite.listen();
    const port = (vite.httpServer!.address() as { port: number }).port;
    browser = await puppeteer.launch({ executablePath: await resolveRenderBrowser(), headless: true, pipe: true });
    const page = await browser.newPage(); await page.setViewport({ width: 1440, height: 900 });
    const errors: string[] = []; page.on("pageerror", error => errors.push(String(error)));
    const coldStart = performance.now();
    await page.goto(`http://127.0.0.1:${port}/?projectId=${id}&revision=${rev()}&frame=6`, { waitUntil: "networkidle2" });
    await page.waitForFunction(() => document.querySelector('[data-motion-work]')?.getAttribute('data-displayed-frame') === "15", { timeout: 30_000 });
    console.log(`工作台冷打开至正确帧：${(performance.now() - coldStart).toFixed(1)}ms（含开发服务、页面与字体加载）`);
    const child = page.frames().find(frame => frame.url().includes("/motion-work/"))!;
    assert.equal(await child.$eval("#title", el => el.textContent), "版本一");
    assert.equal(await child.$eval("#clip", el => (el as HTMLImageElement).naturalWidth), 64);
    assert.ok(await page.$("audio"), "项目声音由外层合成统一播放");
    assert.ok((await page.content()).includes("技术样片"));
    assert.deepEqual(errors, []);
    await page.click('[data-testid="panel-audio"]');
    await page.waitForSelector('[data-testid="sound-library"]');
    assert.ok((await page.$eval('[data-testid="sound-library"]', el => el.textContent)).includes("中段落定 · 0.25 秒"), "声音面板直接读取作品事件并扣除源偏移");
    const observationRevision = rev();
    const observed = await app.reviewSourceMotionWork({ projectId: id, baseRevision: rev(), workId, outcome: "inconclusive", note: "隔离测试仅登记所选范围的模拟观察声明，尚未完整观看作品。", evidence: { kind: "workbench", observer: "隔离测试", startFrame: 0, endFrame: 12, method: "frames" } });
    assert.equal(observed.reviews.motions.at(-1)?.evidence?.relativePath, undefined);
    const identity = observed.reviews.motions.at(-1)!.evidence!.workbenchIdentity!;
    assert.equal(identity.works[0]!.workId, workId);
    assert.equal(identity.resources.length, 3, "同范围的图片、视频与外层声音均固定实际字节");
    assert.equal(identity.fonts[0]!.fontId, "noto-sans-sc-bold");
    await reviewSoundMix(app, id, { baseRevision: rev(), source: "workbench", observer: "隔离测试", fromFrame: 0, toFrame: 24, method: "audio", outcome: "inconclusive", note: "隔离测试保存工作台范围与声音身份，不代表真人完成听觉审阅。" });
    assert.equal(rev(), observationRevision, "两种工作台审阅都不改视频版本");
    const hotSeeks: number[] = [];
    for (let index = 0; index < 10; index++) hotSeeks.push(await page.evaluate(() => new Promise<number>((resolve, reject) => {
      const layer = document.querySelector('[data-motion-work]')!;
      const previous = layer.getAttribute("data-displayed-frame"), started = performance.now();
      const timeout = setTimeout(() => { observer.disconnect(); reject(new Error("显示帧未就绪")); }, 5000);
      const observer = new MutationObserver(() => {
        if (layer.getAttribute("data-displayed-frame") !== previous && layer.getAttribute("data-displayed-frame") === layer.getAttribute("data-requested-frame")) {
          clearTimeout(timeout); observer.disconnect(); resolve(performance.now() - started);
        }
      });
      observer.observe(layer, { attributes: true });
      [...document.querySelectorAll('.preview-controls button')].find(button => button.textContent === "帧 ›")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    })));
    hotSeeks.sort((a,b) => a-b);
    console.log(`工作台热定位：样本10，P95=${hotSeeks[9].toFixed(1)}ms`);
    assert.ok(hotSeeks[9] < 1000, "精确热定位不能退化为逐次媒体生成");
    await page.$$eval('.preview-controls button', buttons => buttons.find(button => button.textContent === "场景起点")!.click());
    await page.waitForFunction(() => document.querySelector('[data-motion-work]')?.getAttribute("data-displayed-frame") === "7");
    const playback = await page.evaluate(() => new Promise<{ frames: number[]; maxLag: number; maxAudioOffset: number }>(resolve => {
      const layer = document.querySelector('[data-motion-work]')!, frames: number[] = [];
      let maxLag = 0, maxAudioOffset = 0;
      const observer = new MutationObserver(() => {
        const shown = Number(layer.getAttribute("data-displayed-frame")), requested = Number(layer.getAttribute("data-requested-frame"));
        if (frames.at(-1) !== shown) frames.push(shown);
        // 播放结束回起点属于离散定位，不能当作连续播放落后了整段。
        if (requested >= shown) maxLag = Math.max(maxLag, requested - shown);
        const projectFrame = Number(/F(\d+)/u.exec(document.querySelector('.preview-toolbar span:last-child')?.textContent ?? "")?.[1] ?? 0);
        const audio = document.querySelector("audio");
        if (audio && !audio.paused) maxAudioOffset = Math.max(maxAudioOffset, Math.abs(audio.currentTime - projectFrame / 24));
      });
      observer.observe(layer, { attributes: true });
      [...document.querySelectorAll('.preview-controls button')].find(button => button.textContent === "播放")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      setTimeout(() => {
        [...document.querySelectorAll('.preview-controls button')].find(button => button.textContent === "暂停")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        observer.disconnect(); resolve({ frames, maxLag, maxAudioOffset });
      }, 1800);
    }));
    console.log(`工作台连续播放：显示${playback.frames.length}个状态，最大源帧差${playback.maxLag}，声音时钟偏差${(playback.maxAudioOffset * 1000).toFixed(1)}ms`);
    assert.ok(playback.frames.length >= 15, "连续播放必须实际求值多帧");
    assert.ok(Array.from({ length: 24 }, (_, frame) => Math.floor((6 + frame) * 30 / 24)).every(frame => playback.frames.includes(frame)), "该连续范围的每个项目采样帧都应实际显示");
    assert.ok(playback.maxLag <= 4, "连续请求与完成帧之间最多保留两个项目刷新周期，不能持续积压");
    assert.ok(playback.maxAudioOffset < 0.25, "声音必须随合成缓冲，不能独自跑完整段");
    await page.waitForFunction(() => { const el = document.querySelector('[data-motion-work]'); return el?.getAttribute("data-displayed-frame") === el?.getAttribute("data-requested-frame"); });
    const expectedRoot = await page.$eval('[data-motion-work]', el => el.getAttribute("data-requested-frame"));
    assert.equal(app.listJobs(id).filter(job => job.kind === "preview" || job.kind === "export").length, 0);
    const changed = app.registerMotionWork({ projectId: id, baseRevision: rev(), idempotencyKey: "prepare-two", work: { ...work, name: "源码版本二", props: { label: "版本二" } }, onSuccess: { action: "replace_cue", cueId, audioPolicy: "rebind_unchanged_events" } });
    const replacement = await runMotionJob(app, changed);
    const nextId = String(replacement.workId);
    assert.notEqual(nextId, workId);
    assert.equal(app.readProject(id).snapshot.effectCues.at(-1)!.workId, nextId);
    assert.equal(app.readProject(id).snapshot.timeline.captions[0]!.text, "技术样片");
    assert.equal(app.readProject(id).snapshot.timeline.items.filter(item => item.assetId === audio.asset.id).length, 1);
    const recheckStart = performance.now();
    await page.click('[data-testid="show-latest-revision"]');
    await page.waitForFunction((workId, rootFrame) => document.querySelector(`[data-motion-work="${workId}"]`)?.getAttribute("data-displayed-frame") === rootFrame, { timeout: 30_000 }, nextId, expectedRoot);
    console.log(`切换结果版至同位置就绪：${(performance.now() - recheckStart).toFixed(1)}ms`);
    assert.equal(await page.frames().find(frame => frame.url().includes(nextId))!.$eval("#title", el => el.textContent), "版本二");
    const fixedDefinition = app.readSourceMotionWork(id, nextId).work;
    app.updateCreativeBrief({ projectId: id, baseRevision: rev(), brief: { sourceDisplayPolicy: { mode: "specified", exceptions: [{ scopeId: id, text: "后续作品才采用的新署名策略", basis: "隔离回归" }] } } });
    const bake = app.submitMotionBake({ projectId: id, baseRevision: rev(), idempotencyKey: "bake-two", workId: nextId });
    assert.deepEqual(bake.payload.sourceDisplay, fixedDefinition.sourceDisplay, "简报变化不能改写已固定作品的输出身份");
    const media = await runMotionJob(app, bake);
    const asset = app.readProject(id).snapshot.assets.find(asset => asset.id === media.assetId)!;
    assert.equal(asset.derivedFromWorkId, nextId);
    assert.equal(asset.motion?.eventMap, undefined);
    assert.equal(app.readProject(id).snapshot.effectCues.at(-1)!.workId, nextId);
    const output = PNG.sync.read(await readOutputFrame(join(projectRoot, asset.managedPath), 15));
    const marker = (y: number, x: number) => [...output.data.subarray((y * 320 + x) * 4, (y * 320 + x) * 4 + 4)];
    assert.deepEqual(marker(100, 30), [255, 0, 0, 255]);
    const preview = app.submitPreview({ projectId: id, revision: rev(), fromFrame: 0, toFrame: 24, idempotencyKey: "same-work-output" });
    const composed = await runPreviewJob(app, preview);
    assert.ok(composed.path);
    const exported = app.submitExport({ projectId: id, revision: rev(), purpose: "draft", idempotencyKey: "same-work-delivery" });
    const delivery = await runExportJob(app, exported);
    assert.equal(delivery.revision, rev());
    assert.ok(delivery.artifactId);
  } finally {
    await browser?.close(); await vite?.close(); await server.close(); app.close();
    if (priorApi === undefined) delete process.env.VITE_API_BASE; else process.env.VITE_API_BASE = priorApi;
    await rm(root, { recursive: true, force: true });
  }
});
