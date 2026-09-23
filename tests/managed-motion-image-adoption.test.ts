import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Fastify from "fastify";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createApplication } from "@videocut/application";
import type { MediaAdoption, MediaUsageTarget, ProjectSnapshot } from "@videocut/contracts";
import { registerMediaIntelligenceRoutes, registerMediaIntelligenceTools } from "../apps/server/src/media-intelligence-tools.js";
import { mediaUsageFindings, mediaUsageProblem, mediaUsageState } from "../packages/media-intelligence/src/usage.js";
import { motionFixture } from "./fixtures/managed-motion.js";

test("内部图片采用按槽位、原图哈希、作品版本和每次放置追溯，局部观察不能覆盖整图", () => {
  const snapshot = { assets: [{ id: "source", kind: "image", sourceHash: "hash" }, { id: "work", kind: "video", motion: { version: "v1", imageSources: [{ slot: "photo", assetId: "source", sourceHash: "hash" }] } }], timeline: { fps: 30, items: [] }, effectCues: [0, 30].map((startFrame, i) => ({ id: `cue${i}`, type: "ManagedMotion", status: "ready", startFrame, endFrame: startFrame + 30, assetBindings: [{ slot: "motion", assetId: "work" }] })), cutaways: [] } as unknown as ProjectSnapshot;
  const adoption = { id: "adopt", status: "current", assetId: "source", sourceHash: "hash", audioPolicy: "not_applicable" } as MediaAdoption;
  const target = { effectCueId: "cue0", motionImageSlot: "photo" } as unknown as MediaUsageTarget;
  const usage = mediaUsageState(snapshot, target)!;
  assert.equal(usage?.asset.id, "source");
  assert.equal(mediaUsageProblem(snapshot, adoption, target), undefined);
  assert.notEqual(usage.signature, mediaUsageState(snapshot, { ...target, effectCueId: "cue1" } as MediaUsageTarget)!.signature);
  assert.match(mediaUsageProblem(snapshot, { ...adoption, region: { x: 0, y: 0, width: 0.5, height: 0.5 } }, target)!, /局部/);
  assert.match(mediaUsageProblem(snapshot, adoption, { effectCueId: "cue0", slot: "motion" })!, /依据或原文件/);
  snapshot.mediaAdoptions = [{ ...adoption, uses: [{ target, signature: usage.signature }] }];
  snapshot.assets[1].motion!.version = "v2";
  assert.equal(mediaUsageFindings(snapshot).length, 1);
  snapshot.assets[1].motion!.version = "v1";
  snapshot.assets[0].sourceHash = "changed";
  assert.equal(mediaUsageFindings(snapshot).length, 1);
  snapshot.assets[0].sourceHash = "hash";
  delete (snapshot.assets[1].motion as Record<string, unknown>).imageSources;
  assert.equal(mediaUsageFindings(snapshot).length, 1, "摘要丢失也不能隐藏已关联用途的问题");
});

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "vfc-image-adoption-"));
  const app = createApplication(root);
  const initial = app.createProject({ name: "内部图片采用合同回归" });
  const projectId = initial.snapshot.project.id;
  const rev = () => app.readProject(projectId).revision.number;
  const bytes = Buffer.from("isolated image identity fixture");
  await writeFile(join(initial.snapshot.project.rootPath, "assets/photo.png"), bytes);
  const image = app.registerImportedAsset({ projectId, baseRevision: rev(), name: "测试图片身份", kind: "image", managedPath: "assets/photo.png", sourceHash: createHash("sha256").update(bytes).digest("hex") }).asset;
  app.applyMediaAnalysis({ projectId, assetId: image.id, metadata: { durationMs: 0, width: 10, height: 10, hasAudio: false } });
  app.repository.commit(projectId, rev(), "隔离测试画布", snapshot => { Object.assign(snapshot.timeline, { width: 320, height: 320, fps: 30 }); });
  const job = app.submitManagedMotion({ projectId, baseRevision: rev(), idempotencyKey: "image", work: { ...motionFixture, imageBindings: { photo: image.id } } });
  // 本夹具只验证登记与采用合同，不把模拟完成当作真实渲染或审美证据。
  const work = app.completeManagedMotion({ projectId, jobId: job.id, engineVersion: "fixture", sourceHash: "fixture-preview", metadata: { durationMs: 600, width: 320, height: 320, fps: 30, hasAudio: false } });
  app.updateJob(job.id, { status: "succeeded", result: { assetId: work.id } });
  const scene = app.createScene({ projectId, baseRevision: rev(), type: "ExplainerScene", title: "图片采用", purpose: "隔离协议回归", startFrame: 0, endFrame: 18 }).snapshot.scenes.at(-1)!;
  const cue = app.createEffectCue({ projectId, baseRevision: rev(), sceneId: scene.id, type: "ManagedMotion", layer: "fullscreen", startFrame: 0, endFrame: 18, assetBindings: [{ slot: "motion", assetId: work.id }] }).snapshot.effectCues.at(-1)!;
  app.repository.commit(projectId, rev(), "隔离测试已复核采用", snapshot => { snapshot.mediaAdoptions = [{ id: "adopt", assetId: image.id, sourceHash: image.sourceHash!, observationIds: ["fixture-reviewed"], purpose: "仅验证关联规则", audioPolicy: "not_applicable", conditions: [], status: "current", createdAt: "test" }]; });
  return { app, projectId, image, work, job, cue, rev, close: async () => { app.close(); await rm(root, { recursive: true, force: true }); } };
}

test("MCP与HTTP接受内部图片槽，旧作品仅在显式绑定时从固定成功Job补摘要且不重新生成", async () => {
  const f = await fixture();
  const server = Fastify();
  try {
    assert.deepEqual((f.work.motion as Record<string, unknown>).imageSources, [{ slot: "photo", assetId: f.image.id, sourceHash: f.image.sourceHash }]);
    f.app.repository.commit(f.projectId, f.rev(), "模拟缺摘要旧作品", snapshot => { delete (snapshot.assets.find(a => a.id === f.work.id)!.motion as Record<string, unknown>).imageSources; });
    const registrations = new Map<string, { config: any; handler: any }>();
    registerMediaIntelligenceTools({ registerTool: (name: string, config: any, handler: any) => registrations.set(name, { config, handler }) } as unknown as McpServer, f.app, id => id ?? f.projectId);
    const tool = registrations.get("bind_media_adoption")!;
    const request = { baseRevision: f.rev(), adoptionId: "adopt", target: { effectCueId: f.cue.id, motionImageSlot: "photo" } };
    const beforeJobs = f.app.repository.listJobs(f.projectId).length;
    const beforePayload = f.app.trackJob(f.job.id).payload;
    const result = await tool.handler({ project_id: f.projectId, input: tool.config.inputSchema.input.parse(request) });
    assert.notEqual(result.isError, true);
    const state = f.app.readProject(f.projectId);
    assert.equal(state.revision.number, request.baseRevision + 1);
    assert.deepEqual((state.snapshot.assets.find(a => a.id === f.work.id)!.motion as Record<string, unknown>).imageSources, [{ slot: "photo", assetId: f.image.id, sourceHash: f.image.sourceHash }]);
    assert.equal(state.snapshot.mediaAdoptions![0].uses!.length, 1);
    assert.equal(state.snapshot.effectCues.find(cue => cue.id === f.cue.id)!.status, "ready");
    assert.equal(state.snapshot.assets.find(asset => asset.id === f.work.id)!.motion!.version, f.work.motion!.version);
    assert.equal(f.app.repository.listJobs(f.projectId).length, beforeJobs);
    assert.deepEqual(f.app.trackJob(f.job.id).payload, beforePayload, "旧固定Job不可被重写");
    assert.equal(mediaUsageFindings(state.snapshot).length, 0);
    assert.throws(() => tool.config.inputSchema.input.parse({ ...request, target: { ...request.target, slot: "motion" } }), "不能混用内外槽位");
    registerMediaIntelligenceRoutes(server, f.app);
    const response = await server.inject({ method: "POST", url: `/api/projects/${f.projectId}/media-fragments/bind`, payload: { ...request, baseRevision: f.rev() } });
    assert.equal(response.statusCode, 200, response.body);
    assert.equal(response.json().snapshot.mediaAdoptions[0].uses.length, 1);
  } finally { await server.close(); await f.close(); }
});

test("旧图片摘要恢复拒绝损坏输入及未知槽，失败原子回滚，不能凭sourceAssetIds猜绑定", async () => {
  const f = await fixture();
  try {
    f.app.repository.commit(f.projectId, f.rev(), "模拟缺摘要旧作品", snapshot => { delete (snapshot.assets.find(a => a.id === f.work.id)!.motion as Record<string, unknown>).imageSources; });
    const target = { effectCueId: f.cue.id, motionImageSlot: "missing" } as unknown as MediaUsageTarget;
    let before = f.rev();
    assert.throws(() => f.app.intelligence.bind(f.projectId, { baseRevision: before, adoptionId: "adopt", target }));
    assert.equal(f.rev(), before);
    assert.equal((f.app.readProject(f.projectId).snapshot.assets.find(a => a.id === f.work.id)!.motion as Record<string, unknown>).imageSources, undefined);
    const badJob = f.app.repository.createJob({ projectId: f.projectId, kind: "motion_generation", idempotencyKey: "damaged", payload: { ...f.job.payload, work: { ...(f.job.payload.work as object), source: "export default function M(){return null}" } } });
    f.app.updateJob(badJob.id, { status: "succeeded" });
    f.app.repository.commit(f.projectId, f.rev(), "隔离损坏源任务夹具", snapshot => { snapshot.assets.find(a => a.id === f.work.id)!.motion!.jobId = badJob.id; });
    before = f.rev();
    assert.throws(() => f.app.intelligence.bind(f.projectId, { baseRevision: before, adoptionId: "adopt", target: { effectCueId: f.cue.id, motionImageSlot: "photo" } as unknown as MediaUsageTarget }));
    assert.equal(f.rev(), before);
    assert.equal(f.app.readProject(f.projectId).snapshot.mediaAdoptions![0].uses?.length ?? 0, 0);
  } finally { await f.close(); }
});
