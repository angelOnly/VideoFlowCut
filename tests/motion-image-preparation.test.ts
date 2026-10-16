import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PNG } from "pngjs";
import { prepareMotionImages } from "../apps/render-worker/src/motion-images.js";
import { renderManagedMotion } from "../apps/render-worker/src/motion-renderer.js";
import { motionFixture } from "./fixtures/managed-motion.js";
import { motionHash } from "../packages/motion-work/src/compiler.js";
import { createApplication } from "@videocut/application";
import { runMotionJob } from "../apps/render-worker/src/motion-job.js";

const fixture = (name: string) => readFile(new URL(`./fixtures/motion-images/${name}`, import.meta.url));
const digest = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
const decode = (url: string) => PNG.sync.read(Buffer.from(url.split(",")[1]!, "base64"));
const pixel = (png: PNG, x: number, y: number) => [...png.data.subarray((y * png.width + x) * 4, (y * png.width + x) * 4 + 3)];

test("JPEG固定解码保留EXIF方向与ICC颜色；PNG和WebP保留原字节及透明度", { timeout: 60_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-image-color-"));
  try {
    const orientation = await fixture("orientation-6.jpg"), linear = await fixture("linear-rgb.jpg");
    const rgba = new PNG({ width: 1, height: 1 }); rgba.data = Buffer.from([123, 56, 78, 91]);
    const originalPng = PNG.sync.write(rgba);
    const originalWebp = await fixture("transparent.webp");
    const result = await prepareMotionImages({ orientation, linear, transparent: originalPng, webp: originalWebp }, root);
    const rotated = decode(result.imageData.orientation!);
    assert.deepEqual([rotated.width, rotated.height], [64, 96]);
    // 原图四象限顺时针转90度；避开JPEG边缘压缩，核对稳定内部色块。
    const expected = [[30, 30, 220], [220, 30, 30], [220, 220, 30], [30, 220, 30]];
    [[16, 24], [48, 24], [16, 72], [48, 72]].forEach(([x, y], i) => {
      pixel(rotated, x!, y!).forEach((value, channel) => assert.ok(Math.abs(value - expected[i]![channel]!) <= 4));
    });
    // 自建线性RGB ICC输入(128,64,32)，转sRGB应约(188,137,99)，不可仅剥除ICC。
    const color = pixel(decode(result.imageData.linear!), 48, 32);
    color.forEach((value, i) => assert.ok(Math.abs(value - [188, 137, 99][i]!) <= 4, `ICC通道${i}实际为${value}`));
    assert.equal(result.imageData.transparent, `data:image/png;base64,${originalPng.toString("base64")}`);
    assert.equal(result.imageData.webp, `data:image/webp;base64,${originalWebp.toString("base64")}`);
    assert.deepEqual(result.imageDecodes.map(item => item.slot).sort(), ["linear", "orientation"]);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("真实动画任务保留JPEG原件及固定PNG缓存，派生图损坏必须拒绝复用", { timeout: 60_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-image-job-"));
  const previousWorkspace = process.env.VIDEOCUT_WORKSPACE;
  process.env.VIDEOCUT_WORKSPACE = root;
  const app = createApplication(root);
  try {
    const created = app.createProject({ name: "JPEG固定解码隔离验证" });
    const projectId = created.snapshot.project.id, projectRoot = created.snapshot.project.rootPath;
    const bytes = await fixture("linear-rgb.jpg"), managedPath = "assets/linear.jpg";
    await writeFile(join(projectRoot, managedPath), bytes);
    const imported = app.registerImportedAsset({ projectId, baseRevision: created.revision.number,
      name: "自建线性RGB图片", kind: "image", managedPath, sourceHash: digest(bytes),
      provenance: { source: "local_import", acquiredAt: new Date().toISOString() } });
    app.applyMediaAnalysis({ projectId, assetId: imported.asset.id, metadata: { width: 96, height: 64, durationMs: 0, hasAudio: false } });
    const job = app.submitManagedMotion({ projectId, baseRevision: app.readProject(projectId).revision.number, idempotencyKey: "jpeg-decode",
      work: { ...motionFixture, width: 96, height: 64, durationInFrames: 3, props: {}, imageBindings: { photo: imported.asset.id },
        source: "import React from 'react';import {Img} from 'remotion';export default function M(p){return <Img src={p.assets.photo} style={{width:96,height:64}}/>}" } });
    const result = await runMotionJob(app, job);
    const asset = app.readProject(projectId).snapshot.assets.find(item => item.id === result.assetId)!;
    const directory = join(projectRoot, asset.motion!.framesDirectory, "..");
    const manifest = JSON.parse(await readFile(join(directory, "manifest.json"), "utf8"));
    assert.equal(manifest.imageDecodes.length, 1);
    const decoded = manifest.imageDecodes[0];
    assert.equal(decoded.slot, "photo");
    assert.equal(decoded.sourceHash, digest(bytes));
    assert.equal(manifest.boundImages[0].hash, decoded.sourceHash);
    assert.deepEqual(await readFile(join(directory, "resources", "photo")), bytes);
    const decodedPath = join(directory, "resources", decoded.path);
    const pngBytes = await readFile(decodedPath);
    assert.equal(decoded.decodedHash, digest(pngBytes));
    assert.deepEqual([decoded.width, decoded.height, decoded.colorSpace], [96, 64, "srgb"]);
    const rendered = PNG.sync.read(await readFile(join(directory, "frames", "frame-00001.png")));
    assert.deepEqual(pixel(rendered, 48, 32), pixel(PNG.sync.read(pngBytes), 48, 32));
    await runMotionJob(app, job, async () => { assert.fail("完整缓存不得重新渲染"); });
    await writeFile(decodedPath, "损坏派生PNG");
    await assert.rejects(runMotionJob(app, job, async () => { assert.fail("派生PNG损坏不得回退或重生"); }), /MOTION_RESOURCE_CACHE_CORRUPT/u);
  } finally {
    app.close();
    if (previousWorkspace === undefined) delete process.env.VIDEOCUT_WORKSPACE;
    else process.env.VIDEOCUT_WORKSPACE = previousWorkspace;
    await rm(root, { recursive: true, force: true });
  }
});

test("固定PNG在首次缩小可见、隐藏解码及原尺寸历史后得到相同像素，卸载回跳也一致", { timeout: 120_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-image-seek-"));
  try {
    const prepared = await prepareMotionImages({ photo: await fixture("scaled-texture.jpg") }, root);
    const source = `import React from 'react';import {Img,useCurrentFrame} from 'remotion';export default function M(p){const f=useCurrentFrame(),natural=p.mode==='natural'&&f<2;return <div style={{position:'absolute',inset:0,background:'#eee9df'}}>{f<6&&<Img src={p.assets.photo} style={{position:'absolute',left:13,top:11,width:natural?960:237,height:natural?1280:316,opacity:p.mode==='hidden'&&f<2?0:1}}/>}</div>}`;
    const regions: Buffer[] = [];
    for (const mode of ["visible", "hidden", "natural"]) {
      const directory = join(root, mode);
      const rendered = await renderManagedMotion({ ...motionFixture, source, props: { mode }, width: 320, height: 360, durationInFrames: 9 }, directory, prepared.imageData);
      assert.equal(rendered.determinism!.status, "exact", `${mode}顺播与回跳必须完全一致`);
      assert.deepEqual(rendered.determinism!.sampledFrames, [0, 4, 8]);
      assert.deepEqual(rendered.determinism!.differences, []);
      // 第4帧三个历史均已到同一目标尺寸；逐像素比较照片ROI，避免背景平均掩盖差异。
      const frame = PNG.sync.read(await readFile(join(directory, "frames", "frame-00004.png")));
      const rows = Array.from({ length: 316 }, (_, y) => frame.data.subarray(((y + 11) * frame.width + 13) * 4, ((y + 11) * frame.width + 250) * 4));
      regions.push(Buffer.concat(rows));
    }
    assert.deepEqual(regions[1], regions[0], "隐藏解码后显露不得改变缩小图片像素");
    assert.deepEqual(regions[2], regions[0], "自然尺寸绘制历史不得改变缩小图片像素");
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("JPEG固定解码的新引擎缓存不复用第13代引擎身份", () => {
  assert.notEqual(motionHash(motionFixture), motionHash(motionFixture, [], "managed-motion-13"));
});

test("损坏JPEG和已取消准备明确失败，不将原JPEG作为回退输出", { timeout: 60_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-image-failure-"));
  try {
    await assert.rejects(prepareMotionImages({ broken: Buffer.from([255, 216, 255, 0]) }, root));
    const controller = new AbortController(); controller.abort();
    await assert.rejects(prepareMotionImages({ image: await fixture("orientation-6.jpg") }, root, controller.signal));
  } finally { await rm(root, { recursive: true, force: true }); }
});
