import {sizeMotionFixture} from "./fixtures/hyperframes.js";
import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApplication } from "@videocut/application";
import { compileVisualComposition, resolveCompositionReachability, primaryVisualRanges, uncoveredVisualRanges } from "@videocut/domain";
import { evaluateQuality } from "@videocut/quality";
import { completionReconciliationBlockers, productionReconciliation } from "../packages/quality-system/src/editorial-review.js";
import { motionFixture } from "./fixtures/managed-motion.js";
import { createServer } from "../apps/server/src/app.js";

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "vfc-presenter-composition-"));
  const app = createApplication(root);
  const projectId = app.createProject({ name: "人物接管合同隔离验证", profile: "presenter_motion" }).snapshot.project.id;
  const current = () => app.readProject(projectId);
  const rev = () => current().revision.number;
  const actor = app.registerImportedAsset({ projectId, baseRevision: rev(), name: "真实源身份夹具", kind: "video", managedPath: "assets/source/actor.mp4", sourceHash: "actor-source" }).asset;
  app.applyMediaAnalysis({ projectId, assetId: actor.id, metadata: { width: 320, height: 320, durationMs: 3000, fps: 30, hasAudio: true, videoCodec: "h264" } });
  app.repository.commit(projectId, rev(), "隔离测试画布", snapshot => { Object.assign(snapshot.timeline, { width: 320, height: 320, fps: 30 }); });
  app.assemblePresenterTrack({ projectId, baseRevision: rev(), assetIds: [actor.id] });
  const beat = app.updateStory({ projectId, baseRevision: rev(), beats: [{ title: "完整论证", purpose: "验证真实采用" }] }).snapshot.story.beats[0]!;
  app.compilePresenterScenes({ projectId, baseRevision: rev(), scenes: [{ title: "完整场面", purpose: "验证接管", startFrame: 0, endFrame: 90, narrativeBeatIds: [beat.id] }] });
  const item = current().snapshot.timeline.items[0]!;
  const scene = current().snapshot.scenes[0]!;
  const image = app.registerImportedAsset({ projectId, baseRevision: rev(), name: "已采用资料身份夹具", kind: "image", managedPath: "assets/source/material.png", sourceHash: "a".repeat(64) }).asset;
  app.applyMediaAnalysis({ projectId, assetId: image.id, metadata: { width: 32, height: 32, durationMs: 0, hasAudio: false } });
  const job = app.submitManagedMotion({ projectId, baseRevision: rev(), idempotencyKey: "contract", work: sizeMotionFixture({ ...motionFixture, durationInFrames: 30, imageBindings: { material: image.id } }) });
  // 此处只验证正式登记合同；真实像素与声音由独立渲染测试验证。
  const motion = app.completeManagedMotion({ projectId, jobId: job.id, sourceHash: "test-output", engineVersion: "fixture", metadata: { width: 320, height: 320, durationMs: 1000, fps: 30, hasAudio: false } });
  const create = (startFrame = 30, endFrame = 60, ids = [item.id]) => app.createEffectCue({ projectId, baseRevision: rev(), sceneId: scene.id, type: "ManagedMotion", layer: "fullscreen", startFrame, endFrame, visualComposition: { role: "primary", replacesActorItemIds: ids }, assetBindings: [{ slot: "motion", assetId: motion.id }] });
  return { root, app, projectId, current, rev, actor, item, scene, image, motion, create, close: async () => { app.close(); await rm(root, { recursive: true, force: true }); } };
}

test("正式接管创建、保持、清除和半开范围；保留原声资源并拒绝非法引用与重叠", async () => {
  const f = await fixture();
  try {
    const cue = f.create().snapshot.effectCues.at(-1)!;
    assert.deepEqual(compileVisualComposition(f.current().snapshot).nativeVisibleRanges.get(f.item.id), [{ startFrame: 0, endFrame: 30 }, { startFrame: 60, endFrame: 90 }]);
    assert.ok(resolveCompositionReachability(f.current().snapshot).videoItemIds.has(f.item.id));
    const preserved = f.app.updateEffectCue({ projectId: f.projectId, baseRevision: f.rev(), cueId: cue.id, note: "纯说明不影响固定作品" });
    assert.deepEqual(preserved.snapshot.effectCues[0]!.visualComposition, cue.visualComposition);
    assert.equal(preserved.snapshot.effectCues[0]!.status, "ready");
    const revision = f.rev();
    assert.throws(() => f.create(45, 75), { code: "VISUAL_COMPOSITION_OVERLAP" });
    assert.throws(() => f.create(60, 90, ["missing-item"]), { code: "VISUAL_COMPOSITION_ACTOR_INVALID" });
    assert.throws(() => f.create(60, 90, [f.item.id, f.item.id]), { code: "VISUAL_COMPOSITION_DUPLICATE_ITEM" });
    assert.equal(f.rev(), revision, "拒绝必须不写入 Revision");
    f.create(60, 90);
    const cleared = f.app.updateEffectCue({ projectId: f.projectId, baseRevision: f.rev(), cueId: cue.id, visualComposition: null });
    assert.equal(Object.hasOwn(cleared.snapshot.effectCues[0]!, "visualComposition"), false);
    assert.deepEqual(compileVisualComposition(cleared.snapshot).nativeVisibleRanges.get(f.item.id), [{ startFrame: 0, endFrame: 60 }]);
    f.app.repository.commit(f.projectId, f.rev(), "测试真实源映射改变", snapshot => { snapshot.timeline.items.find(item => item.id === f.item.id)!.sourceStartFrame = 1; });
    assert.ok(f.current().snapshot.effectCues.every(cue => cue.status === "stale"));
  } finally { await f.close(); }
});

test("人物空间依赖冲突、无用外层 Mask 和失效作品分别处理", async () => {
  const f = await fixture();
  try {
    f.create();
    assert.throws(() => f.app.createEffectCue({ projectId: f.projectId, baseRevision: f.rev(), sceneId: f.scene.id, type: "CameraPunch", layer: "front", startFrame: 35, endFrame: 45 }), { code: "VISUAL_COMPOSITION_ACTOR_SPACE_CONFLICT" });
    const snapshot = structuredClone(f.current().snapshot);
    const primary = snapshot.effectCues[0]!;
    primary.startFrame = 0; primary.endFrame = 90; primary.motion.holdFrames = 90;
    snapshot.assets.find(asset => asset.id === f.motion.id)!.motion!.frameCount = 90;
    snapshot.actorPerformances.push({ id: "performance", timelineItemId: f.item.id, source: "imported", audioMode: "use_source_audio", maskMode: "alpha_asset", maskAssetId: "unused-mask", status: "ready", note: "测试外层 Mask", createdAt: "test" });
    assert.ok(!resolveCompositionReachability(snapshot).assetIds.has("unused-mask"));
    assert.ok(!evaluateQuality(snapshot, 1).issues.some(issue => issue.code === "ACTOR_MASK_MISSING"));
    primary.status = "stale";
    assert.deepEqual(compileVisualComposition(snapshot).nativeVisibleRanges.get(f.item.id), [{ startFrame: 0, endFrame: 90 }]);
    assert.ok(evaluateQuality(snapshot, 1).issues.some(issue => issue.code === "ACTOR_MASK_MISSING"));
  } finally { await f.close(); }
});

test("人物早退后主作品覆盖结尾，装饰和失效作品不能填缺，解释片原路径保留", async () => {
  const f = await fixture();
  try {
    f.create(60, 90, []);
    const snapshot = structuredClone(f.current().snapshot);
    snapshot.timeline.items[0]!.endFrame = 60;
    snapshot.timeline.items[0]!.sourceEndFrame = 60;
    const range = { startFrame: 0, endFrame: 90 };
    assert.deepEqual(uncoveredVisualRanges(range, primaryVisualRanges(snapshot)), []);
    delete snapshot.effectCues[0]!.visualComposition;
    assert.deepEqual(uncoveredVisualRanges(range, primaryVisualRanges(snapshot)), [{ startFrame: 60, endFrame: 90 }]);
    snapshot.project.profile = "visual_explainer";
    snapshot.scenes[0]!.type = "ExplainerScene"; snapshot.scenes[0]!.status = "ready";
    assert.deepEqual(uncoveredVisualRanges(range, primaryVisualRanges(snapshot)), []);
    snapshot.effectCues[0]!.status = "stale";
    assert.deepEqual(uncoveredVisualRanges(range, primaryVisualRanges(snapshot)), [{ startFrame: 60, endFrame: 90 }]);
  } finally { await f.close(); }
});

test("采用资料沿作品真实来源对账，局部字幕不承担旧计划，Vlog 无虚假取材要求", async () => {
  const f = await fixture();
  try {
    f.create();
    const snapshot = structuredClone(f.current().snapshot);
    const beat = snapshot.story.beats[0]!;
    const cue = snapshot.effectCues[0]!;
    cue.coveredNarrativeBeatIds = [beat.id];
    const treatment = f.app.manageVisualTreatment({ projectId: f.projectId, baseRevision: f.rev(), action: "upsert", narrativeBeatId: beat.id, sceneId: f.scene.id, mode: "remotion", intensity: "medium", primaryAttention: "原件", narrativePurpose: "解释", adoptedMaterialAssetIds: [f.image.id] }).snapshot.visualTreatments.at(-1)!;
    snapshot.visualTreatments = [treatment];
    assert.deepEqual(productionReconciliation(snapshot)[0]!.structuralGaps, []);
    assert.ok(productionReconciliation(snapshot)[0]!.observationNeeds.length);
    snapshot.assets.find(asset => asset.id === f.motion.id)!.motion!.imageSources = [];
    assert.ok(productionReconciliation(snapshot)[0]!.structuralGaps.some(gap => gap.code === "material_not_connected" && gap.assetIds.includes(f.image.id)));
    assert.equal(completionReconciliationBlockers(snapshot, { kind: "project" }).length, 1);
    assert.deepEqual(completionReconciliationBlockers(snapshot, { kind: "objects", objectIds: ["caption-only"] }), []);
    assert.equal(completionReconciliationBlockers(snapshot, { kind: "objects", objectIds: [treatment.id] }).length, 1);
    // 视频身份不能凭 sourceAssetIds 汇总冒充出现在正确语句。
    const work = snapshot.assets.find(asset => asset.id === f.motion.id)!.motion!;
    treatment.adoptedMaterialAssetIds = [f.actor.id];
    work.videoSources = [{ slot: "material", assetId: f.actor.id, sourceHash: "actor-source", sourceStartMs: 0, sourceEndMs: 1000, startFrame: 0, endFrame: 30 }];
    assert.deepEqual(productionReconciliation(snapshot)[0]!.structuralGaps, []);
    // 30 fps 成片与 24 fps 作品：槽位 F12 才出现时，不能兑现只覆盖成片 F30–45 的语句。
    work.fps = 24; work.frameCount = 24;
    work.videoSources[0]!.startFrame = 12; work.videoSources[0]!.endFrame = 24;
    snapshot.semanticUnits = [{ id: "unit", text: "前半句", order: 0, status: "included", candidateIds: [], kind: "statement", dependencies: [], precedingContext: "", followingContext: "", confidence: 1 }];
    beat.semanticUnitIds = ["unit"];
    snapshot.speechSegments = [{ id: "segment", semanticUnitIds: ["unit"], text: "前半句", order: 0, pauseBefore: { durationMs: 0, reason: "sentence" }, status: "ready" }];
    snapshot.speechAsset = { id: "timing-fixture", assetId: "timing-source", scriptRevision: 1, segmentAssetIds: [], status: "ready", timing: { precision: "segment_exact", source: "隔离时序夹具", segments: [{ speechSegmentId: "segment", startMs: 1000, endMs: 1500, startFrame: 30, endFrame: 45 }] } };
    assert.ok(productionReconciliation(snapshot)[0]!.structuralGaps.some(gap => gap.code === "material_not_connected"));
    work.videoSources[0]!.startFrame = 0; work.videoSources[0]!.endFrame = 12;
    assert.deepEqual(productionReconciliation(snapshot)[0]!.structuralGaps, []);
    cue.status = "stale";
    assert.ok(completionReconciliationBlockers(snapshot, { kind: "objects", objectIds: [cue.id] }).length, "选定失效 Cue 仍追踪它应兑现的计划");
    snapshot.project.profile = "vlog"; snapshot.visualTreatments = [];
    assert.deepEqual(completionReconciliationBlockers(snapshot, { kind: "project" }), []);
  } finally { await f.close(); }
});

test("HTTP 正式创建和 PATCH 清除接管；Run 持久保存明确范围与结构缺项", async () => {
  const f = await fixture();
  const server = await createServer({ workspaceRoot: f.root, serveWeb: false });
  try {
    const response = await server.app.inject({ method: "POST", url: `/api/projects/${f.projectId}/effects`, payload: {
      baseRevision: f.rev(), sceneId: f.scene.id, type: "ManagedMotion", layer: "fullscreen", startFrame: 30, endFrame: 60,
      visualComposition: { role: "primary", replacesActorItemIds: [f.item.id] }, assetBindings: [{ slot: "motion", assetId: f.motion.id }]
    } });
    assert.equal(response.statusCode, 200, response.body);
    const cue = f.current().snapshot.effectCues[0]!;
    assert.deepEqual(cue.visualComposition?.replacesActorItemIds, [f.item.id]);
    const clear = await server.app.inject({ method: "PATCH", url: `/api/projects/${f.projectId}/effects/${cue.id}`, payload: { baseRevision: f.rev(), visualComposition: null } });
    assert.equal(clear.statusCode, 200, clear.body);
    assert.equal(f.current().snapshot.effectCues[0]!.visualComposition, undefined);
    const beat = f.current().snapshot.story.beats[0]!;
    const adopted = await server.app.inject({ method: "POST", url: `/api/projects/${f.projectId}/visual-treatments`, payload: { baseRevision: f.rev(), action: "upsert", narrativeBeatId: beat.id, mode: "evidence", intensity: "medium", primaryAttention: "原件", narrativePurpose: "解释", adoptedMaterialAssetIds: [f.image.id] } });
    assert.equal(adopted.statusCode, 200, adopted.body);
    const run = await f.app.startProductionRun({ projectId: f.projectId, loadedSkills: ["presenter-motion-director"] });
    const incomplete = await f.app.completeProductionRun({ projectId: f.projectId, runId: run.id, completionScope: { kind: "beats", beatIds: [beat.id] } });
    assert.equal(incomplete.status, "incomplete");
    assert.ok(incomplete.completionBlockers.some(message => message.startsWith("material_not_connected")));
    assert.deepEqual((await f.app.readSkillExecutionReport({ projectId: f.projectId, runId: run.id })).completionScope, { kind: "beats", beatIds: [beat.id] });
    await assert.rejects(f.app.completeProductionRun({ projectId: f.projectId, runId: run.id, completionScope: { kind: "beats", beatIds: ["missing"] } }), { code: "COMPLETION_SCOPE_INVALID" });
    f.app.importSrtCaptions({ projectId: f.projectId, baseRevision: f.rev(), srtText: "1\n00:00:00,000 --> 00:00:01,000\n局部字幕\n", sourceName: "对象范围", targetRange: { startFrame: 0, endFrame: 90 }, writePolicy: "reject_conflicts", idempotencyKey: "local-captions" });
    const caption = f.current().snapshot.timeline.captions[0]!;
    const local = await f.app.completeProductionRun({ projectId: f.projectId, runId: run.id, completionScope: { kind: "objects", objectIds: [caption.id] } });
    assert.ok(!local.completionBlockers.some(message => /material_not_connected|missing_implementation|missing_treatment/u.test(message)));
  } finally { await server.app.close(); server.application.close(); await f.close(); }
});
