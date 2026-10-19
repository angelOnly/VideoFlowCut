import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { PNG } from "pngjs";
import { createApplication } from "@videocut/application";
import { probeMedia } from "@videocut/speech";
import { processClaimedJob } from "@videocut/job-runtime";
import { createMediaJobProcessor } from "../apps/job-worker/src/index.js";
import { runMotionJob } from "../apps/render-worker/src/motion-job.js";
import { runObjectResources } from "../apps/job-worker/src/object-resources.js";
import { registerObjectResourceTools } from "../apps/server/src/object-resource-tools.js";
import { objectResourceHash, type PrepareObjectResourcesInput } from "../packages/media-intelligence/src/object-resources/index.js";
import { readObjectResourceSource } from "../packages/edit-application/src/object-resources.js";
import { decodeRasterImages } from "../packages/media-intelligence/src/raster-decode.js";
import { motionFixture } from "./fixtures/managed-motion.js";

test("正式工具 → 媒体队列 → 派生图片与清单 → 真实绑定 → 受管作品；失败与重放保护已发布结果", { timeout: 120_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-object-resources-"));
  const previousWorkspace = process.env.VIDEOCUT_WORKSPACE; process.env.VIDEOCUT_WORKSPACE = root;
  const app = createApplication(root);
  try {
    const created = app.createProject({ name: "物件资源正式链路隔离验证" }), projectId = created.snapshot.project.id, projectRoot = created.snapshot.project.rootPath;
    const png = new PNG({ width: 64, height: 64 });
    for (let y = 8; y < 56; y++) for (let x = 16; x < 48; x++) { const i = (y * 64 + x) * 4; png.data.set([210, 70, 30, 255], i); }
    const bytes = PNG.sync.write(png), managedPath = "assets/source/object.png";
    await writeFile(join(projectRoot, managedPath), bytes);
    const imported = app.registerImportedAsset({ projectId, baseRevision: created.revision.number, name: "透明部件", kind: "image", managedPath, sourceHash: objectResourceHash(bytes), provenance: { source: "local_import", acquiredAt: new Date().toISOString() } });
    app.applyMediaAnalysis({ projectId, assetId: imported.asset.id, metadata: await probeMedia(join(projectRoot, managedPath)) });
    const handlers = new Map<string, (input: any) => Promise<any>>();
    registerObjectResourceTools({ registerTool: (name: string, _config: unknown, handler: any) => handlers.set(name, handler) } as any, app);
    const capability = JSON.parse((await handlers.get("read_object_resource_capabilities")!({})).content[0].text);
    assert.equal(capability.available, true); assert.equal(capability.imageBindings.maxSlots, 8);
    const input: PrepareObjectResourcesInput = { project_id: projectId, base_revision_id: app.readProject(projectId).revision.number, idempotency_key: "parts",
      sources: [{ id: "source", asset_id: imported.asset.id }], parts: [{ id: "body", source_id: "source", trim_transparent: true, local_rect: { x: 0, y: 0, width: 64, height: 64 } }], atlas: { enabled: true, max_side: 128, max_pages: 1 } };
    const response = await handlers.get("prepare_object_resources")!(input);
    assert.notEqual(response.isError, true);
    const job = JSON.parse(response.content[0].text);
    assert.equal((await app.prepareObjectResources(input)).id, job.id);
    const claimed = app.claimNextJob(["object_resource_preparation"])!;
    assert.equal(claimed.id, job.id);
    await processClaimedJob(app, claimed, createMediaJobProcessor(app));
    const completed = app.trackJob(job.id);
    assert.equal(completed.status, "succeeded", completed.error);
    const result = completed.result as any, layout = result.layout;
    assert.deepEqual(JSON.parse(await readFile(result.layoutPath, "utf8")), layout);
    const derived = app.readProject(projectId).snapshot.assets.find(a => a.id === result.assetIds[0])!;
    assert.equal(derived.kind, "image"); assert.equal(derived.status, "ready");
    assert.equal(derived.provenance?.objectResources?.sources[0]?.assetId, imported.asset.id);
    const before = app.readProject(projectId).revision.number;
    await runObjectResources(app, completed);
    assert.equal(app.readProject(projectId).revision.number, before);
    const motion = app.submitManagedMotion({ projectId, baseRevision: before, idempotencyKey: "bound-atlas", work: { ...motionFixture, width: 64, height: 64, durationInFrames: 3, props: { layout }, imageBindings: { atlas: derived.id },
      source: `import React from 'react';import {Img} from 'remotion';export default function M(p){const a=p.layout.parts[0],pg=p.layout.pages[0];return <div style={{position:'absolute',left:a.trimOffset.x,top:a.trimOffset.y,width:a.atlasRect.width,height:a.atlasRect.height,overflow:'hidden'}}><Img src={p.assets.atlas} style={{position:'absolute',maxWidth:'none',width:pg.width,height:pg.height,left:-a.atlasRect.x,top:-a.atlasRect.y}}/></div>}` } });
    const rendered = await runMotionJob(app, motion);
    const motionAsset = app.readProject(projectId).snapshot.assets.find(a => a.id === rendered.assetId)!;
    const frame = PNG.sync.read(await readFile(join(projectRoot, motionAsset.motion!.framesDirectory, "frame-00001.png")));
    assert.deepEqual([...frame.data.subarray((32 * 64 + 32) * 4, (32 * 64 + 32) * 4 + 4)], [210, 70, 30, 255]);
    assert.equal(frame.data[(4 * 64 + 4) * 4 + 3], 0);
    await assert.rejects(app.prepareObjectResources({ ...input, idempotency_key: "stale" }), /Revision/);
    await assert.rejects(app.prepareObjectResources({ ...input, parts: [{ ...input.parts[0]!, trim_transparent: false }] }), /幂等键/);
    const validAtlas = await readFile(join(projectRoot, derived.managedPath));
    const concurrent = await app.prepareObjectResources({ ...input, base_revision_id: app.readProject(projectId).revision.number, idempotency_key: "concurrent" });
    app.createScene({ projectId, baseRevision: app.readProject(projectId).revision.number, type: "ExplainerScene", title: "并发写入", purpose: "验证加工版本冲突", startFrame: 0, endFrame: 24 });
    await processClaimedJob(app, app.claimNextJob(["object_resource_preparation"])!, createMediaJobProcessor(app));
    assert.equal(app.trackJob(concurrent.id).status, "failed");
    assert.match(app.trackJob(concurrent.id).error!, /Revision/);
    assert.equal(app.readProject(projectId).snapshot.assets.filter(a => a.provenance?.objectResources).length, 1);
    const bad = await app.prepareObjectResources({ ...input, base_revision_id: app.readProject(projectId).revision.number, idempotency_key: "outside", parts: [{ ...input.parts[0]!, source_rect: { x: 63, y: 0, width: 2, height: 64 } }] });
    await processClaimedJob(app, app.claimNextJob(["object_resource_preparation"])!, createMediaJobProcessor(app));
    assert.equal(app.trackJob(bad.id).status, "failed");
    assert.deepEqual(await readFile(join(projectRoot, derived.managedPath)), validAtlas);
    assert.equal(app.readProject(projectId).snapshot.assets.filter(a => a.provenance?.objectResources).length, 1);
    await writeFile(join(projectRoot, managedPath), Buffer.from("changed"));
    await assert.rejects(app.prepareObjectResources({ ...input, base_revision_id: app.readProject(projectId).revision.number, idempotency_key: "changed-source" }), /图片|哈希/);
    const external = join(root, "external.png"); await writeFile(external, bytes);
    await assert.rejects(readObjectResourceSource(app.readProject(projectId).snapshot, { ...imported.asset, status: "ready", managedPath: external }), /受管目录/);
    await assert.rejects(app.prepareObjectResources({ ...input, project_id: app.createProject({ name: "另一个项目" }).snapshot.project.id, base_revision_id: 1, idempotency_key: "other-project" }), /素材|Asset/);
    await writeFile(join(projectRoot, derived.managedPath), "corrupt");
    await assert.rejects(runObjectResources(app, completed), /哈希/);
  } finally {
    app.close(); if (previousWorkspace === undefined) delete process.env.VIDEOCUT_WORKSPACE; else process.env.VIDEOCUT_WORKSPACE = previousWorkspace;
    await rm(root, { recursive: true, force: true });
  }
});

test("资源规范化复用真实 EXIF、ICC 与透明 WebP 解码，保持原尺寸", { timeout: 30_000 }, async () => {
  const fixture = (name: string) => readFile(new URL(`./fixtures/motion-images/${name}`, import.meta.url));
  const images = { orientation: await fixture("orientation-6.jpg"), color: await fixture("linear-rgb.jpg"), transparent: await fixture("transparent.webp") };
  const decoded = await decodeRasterImages(images, undefined, 16_777_216);
  assert.deepEqual([decoded.orientation!.width, decoded.orientation!.height], [64, 96]);
  const color = PNG.sync.read(decoded.color!.bytes), offset = (32 * color.width + 48) * 4;
  [188, 137, 99].forEach((expected, i) => assert.ok(Math.abs(color.data[offset + i]! - expected) <= 4));
  const transparent = PNG.sync.read(decoded.transparent!.bytes);
  assert.ok(transparent.data.some((value, i) => i % 4 === 3 && value < 255));
});
