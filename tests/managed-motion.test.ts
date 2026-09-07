import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createApplication } from "@videocut/application";
import { motionSubmissionSchema } from "../packages/motion-work/src/schema.js";
import { compileMotion, validateMotionSource } from "../packages/motion-work/src/compiler.js";
import { MOTION_SOURCES, motionSourceForUrl } from "../packages/motion-work/src/catalog.js";
import { motionFixture } from "./fixtures/managed-motion.js";
import { inspectEffectContentContract } from "@videocut/contracts";
import { runMotionJob } from "../apps/render-worker/src/motion-job.js";
import { evaluateQuality } from "@videocut/quality";

test("四个来源按视觉选型；不包含用户排除的官方 Elements", () => {
  assert.deepEqual(MOTION_SOURCES.map((source) => source.id), ["onda", "jitter", "remotionlab", "mixkit"]);
  assert.equal(motionSourceForUrl("https://mixkit.co/free-after-effects-templates/titles/").id, "mixkit");
  assert.throws(() => motionSourceForUrl("http://127.0.0.1/"));
  assert.throws(() => motionSourceForUrl("https://jitter.video.attacker.test/"));
});

test("源码可表达独立的 Remotion 作品，非法依赖和计时在构建前拒绝", async () => {
  assert.ok((await compileMotion(motionFixture)).length > 1000);
  for (const source of ["import fs from 'node:fs'; export default ()=>null", "export default ()=>fetch('https://example.com')", "export default ()=>Date.now()", "export default ()=>import('node:fs')", "export default ()=>Math.random()", "export default ()=> <iframe src='https://example.com'/>"]) assert.throws(() => validateMotionSource(source));
  assert.throws(() => motionSubmissionSchema.parse({ ...motionFixture, rights: { ...motionFixture.rights, status: "attribution_required" } }));
});

test("提交不改视频 Revision；同幂等键不同源码拒绝，断线重读不重复排队", async () => {
  const root = await mkdtemp(join(tmpdir(), "videocut-motion-contract-"));
  const app = createApplication(root);
  try {
    const state = app.createProject({ name: "受管动效隔离测试", profile: "presenter_motion" });
    const projectId = state.snapshot.project.id;
    const job = app.submitManagedMotion({ projectId, baseRevision: state.revision.number, idempotencyKey: "first", work: motionFixture });
    assert.equal(app.readProject(projectId).revision.number, state.revision.number);
    assert.equal(app.submitManagedMotion({ projectId, baseRevision: 0, idempotencyKey: "first", work: motionFixture }).id, job.id);
    assert.throws(() => app.submitManagedMotion({ projectId, baseRevision: state.revision.number, idempotencyKey: "first", work: { ...motionFixture, props: { text: "不同内容" } } }), /幂等/u);
    assert.equal(app.readManagedMotion(projectId, job.id).asset, undefined);
  } finally { app.repository.close(); await rm(root, { recursive: true, force: true }); }
});

test("技术生成成功不等于审美通过；更新作品不会覆盖旧版或自动重绑 Cue", async () => {
  const root = await mkdtemp(join(tmpdir(), "videocut-motion-version-"));
  const app = createApplication(root);
  try {
    const created = app.createProject({ name: "作品版本隔离", profile: "presenter_motion" });
    const projectId = created.snapshot.project.id;
    app.repository.commit(projectId, created.revision.number, "设置测试画布", (snapshot) => { Object.assign(snapshot.timeline, { width: 320, height: 320, fps: 30, durationInFrames: 60 }); });
    const revision = () => app.readProject(projectId).revision.number;
    const job = app.submitManagedMotion({ projectId, baseRevision: revision(), idempotencyKey: "v1", work: motionFixture });
    const asset = app.completeManagedMotion({ projectId, jobId: job.id, sourceHash: "fixture", engineVersion: "fixture-only", metadata: { durationMs: 600, width: 320, height: 320, fps: 30, videoCodec: "h264", hasAudio: false } });
    assert.throws(() => app.assemblePresenterTrack({ projectId, baseRevision: revision(), assetIds: [asset.id] }), /审阅代理/u);
    const sceneState = app.createScene({ projectId, baseRevision: revision(), type: "PresenterScene", title: "隔离测试", purpose: "验证受管作品", startFrame: 0, endFrame: 60 });
    const sceneId = sceneState.snapshot.scenes.at(-1)!.id;
    const placement = { projectId, sceneId, type: "ManagedMotion" as const, layer: "front" as const, startFrame: 20, endFrame: 38, assetBindings: [{ slot: "motion", assetId: asset.id }] };
    assert.throws(() => app.createEffectCue({ ...placement, baseRevision: revision() }), /审阅/u);
    const beforeInvalidReview = revision();
    assert.throws(() => app.reviewManagedMotion({ projectId, baseRevision: revision(), assetId: asset.id, referenceMatch: "unknown" as never, note: "非法枚举不能通过应用层入口伪装成待审状态。" }), /结论无效/u);
    assert.equal(revision(), beforeInvalidReview);
    app.reviewManagedMotion({ projectId, baseRevision: revision(), assetId: asset.id, referenceMatch: "inconclusive", note: "仅完成技术生成，尚未获得连续动态感知，草稿叠加后需要完整复核。" });
    const draft = app.createEffectCue({ ...placement, baseRevision: revision() });
    const draftCue = draft.snapshot.effectCues.at(-1)!;
    assert.equal(inspectEffectContentContract(draftCue, draft.snapshot.assets, draft.snapshot.timeline).ready, true);
    const pending = evaluateQuality(draft.snapshot, draft.revision.number);
    assert.equal(pending.technical.some((entry) => entry.code === "MOTION_REFERENCE_REVIEW_REQUIRED"), false);
    assert.ok(pending.editorial.motion.some((entry) => entry.code === "MOTION_REFERENCE_REVIEW_REQUIRED" && entry.level === "blocking" && entry.objectId === draftCue.id));
    app.reviewManagedMotion({ projectId, baseRevision: revision(), assetId: asset.id, referenceMatch: "failed", note: "隔离测试：确认失败仍拒绝把未修复的作品作为正常效果使用。" });
    const failed = app.readProject(projectId);
    assert.equal(inspectEffectContentContract(failed.snapshot.effectCues.at(-1)!, failed.snapshot.assets, failed.snapshot.timeline).ready, false);
    app.removeEffectCue({ projectId, baseRevision: revision(), cueId: draftCue.id });
    app.reviewManagedMotion({ projectId, baseRevision: revision(), assetId: asset.id, referenceMatch: "passed", note: "这是单元测试的固定审阅记录，不是正式成片的视觉判断。" });
    const placed = app.createEffectCue({ ...placement, baseRevision: revision() });
    const cue = placed.snapshot.effectCues.at(-1)!;
    assert.equal(inspectEffectContentContract(cue, placed.snapshot.assets, { width: 1920, height: 1080, fps: 30 }).ready, false);
    for (const override of [{ props: { text: "不会生效" } }, { spatialAnchor: "bottom_right" as const }, { intensity: 0.2 }, { motion: { enterPreset: "slide" } }, { stylePackId: "glow" }]) {
      assert.throws(() => app.updateEffectCue({ projectId, baseRevision: revision(), cueId: cue.id, ...override }), /固定作品参数/u);
    }
    assert.throws(() => app.updateEffectCue({ projectId, baseRevision: revision(), cueId: placed.snapshot.effectCues.at(-1)!.id, endFrame: 39 }), /完整时长/u);
    const v2 = app.submitManagedMotion({ projectId, baseRevision: revision(), idempotencyKey: "v2", work: { ...motionFixture, previousAssetId: asset.id, props: { text: "重新编辑的内容" } } });
    const next = app.completeManagedMotion({ projectId, jobId: v2.id, sourceHash: "fixture-v2", engineVersion: "fixture-only", metadata: asset.metadata! });
    assert.notEqual(next.id, asset.id);
    assert.equal(next.motion!.previousAssetId, asset.id);
    assert.equal(app.readProject(projectId).snapshot.effectCues.at(-1)!.assetBindings[0].assetId, asset.id);
    assert.equal(app.completeManagedMotion({ projectId, jobId: v2.id, sourceHash: "fixture-v2", engineVersion: "fixture-only", metadata: asset.metadata! }).id, next.id);
  } finally { app.repository.close(); await rm(root, { recursive: true, force: true }); }
});

test("解释片受管主视觉要求全场景连续覆盖，短装饰、缺失、过期和画幅不匹配不算通过", async () => {
  const root = await mkdtemp(join(tmpdir(), "videocut-managed-explainer-"));
  const app = createApplication(root);
  try {
    const created = app.createProject({ name: "受管解释主视觉合同", profile: "visual_explainer" });
    const projectId = created.snapshot.project.id;
    app.repository.commit(projectId, 1, "测试画布", snapshot => { Object.assign(snapshot.timeline, { width: 320, height: 320, fps: 30, durationInFrames: 36 }); });
    const revision = () => app.readProject(projectId).revision.number;
    const job = app.submitManagedMotion({ projectId, baseRevision: revision(), idempotencyKey: "primary", work: motionFixture });
    const asset = app.completeManagedMotion({ projectId, jobId: job.id, sourceHash: "fixture", engineVersion: "fixture-only", metadata: { durationMs: 600, width: 320, height: 320, fps: 30, hasAudio: false } });
    app.reviewManagedMotion({ projectId, baseRevision: revision(), assetId: asset.id, referenceMatch: "inconclusive", note: "仅测试结构门禁，不代表实际观感通过" });
    const sceneState = app.createScene({ projectId, baseRevision: revision(), type: "ExplainerScene", title: "连续机制", purpose: "受管作品承担主视觉", startFrame: 0, endFrame: 36 });
    const sceneId = sceneState.snapshot.scenes.at(-1)!.id;
    const placement = { projectId, sceneId, type: "ManagedMotion" as const, layer: "front" as const, assetBindings: [{ slot: "motion", assetId: asset.id }] };
    const short = app.createEffectCue({ ...placement, baseRevision: revision(), startFrame: 0, endFrame: 18 });
    const primaryMissing = (snapshot: typeof short.snapshot) => evaluateQuality(snapshot, revision()).issues.some(issue => issue.code === "EXPLAINER_PRIMARY_VISUAL_MISSING");
    assert.equal(primaryMissing(short.snapshot), true);
    assert.ok(evaluateQuality(short.snapshot, revision()).issues.some(issue => issue.code === "EXPLAINER_SCENE_PROGRAM_MISSING"));
    const whole = app.createEffectCue({ ...placement, baseRevision: revision(), startFrame: 18, endFrame: 36 });
    assert.equal(primaryMissing(whole.snapshot), false, JSON.stringify({ scenes: whole.snapshot.scenes, cues: whole.snapshot.effectCues.map(cue => ({ status: cue.status, layer: cue.layer, start: cue.startFrame, end: cue.endFrame, content: inspectEffectContentContract(cue, whole.snapshot.assets, whole.snapshot.timeline) })) }));
    const quality = evaluateQuality(whole.snapshot, revision());
    assert.equal(quality.issues.some(issue => issue.code === "EXPLAINER_SCENE_PROGRAM_MISSING"), false);
    assert.ok(quality.editorial.motion.some(issue => issue.code === "MOTION_REFERENCE_REVIEW_REQUIRED"), "仍保留真实动态审阅门禁");
    for (const change of [
      (snapshot: typeof short.snapshot) => { snapshot.effectCues[1]!.startFrame++; },
      (snapshot: typeof short.snapshot) => { snapshot.effectCues[1]!.status = "stale"; },
      (snapshot: typeof short.snapshot) => { snapshot.assets.find(candidate => candidate.id === asset.id)!.status = "missing"; },
      (snapshot: typeof short.snapshot) => { snapshot.timeline.width = 640; },
      (snapshot: typeof short.snapshot) => { snapshot.scenes.find(scene => scene.id === sceneId)!.status = "stale"; }
    ]) {
      const invalid = structuredClone(whole.snapshot);
      change(invalid);
      assert.equal(primaryMissing(invalid), true);
    }
    assert.equal(app.readProject(projectId).snapshot.explainerPrograms.length, 0, "不建立无意义占位 Program");
  } finally { app.close(); await rm(root, { recursive: true, force: true }); }
});

test("派生作品保留最严格权利与全部署名，不把已知限制降成 unknown", async () => {
  const root = await mkdtemp(join(tmpdir(), "videocut-motion-rights-"));
  const app = createApplication(root);
  try {
    const projectId = app.createProject({ name: "派生权利合同" }).snapshot.project.id;
    const revision = () => app.readProject(projectId).revision.number;
    const statuses = ["cleared", "attribution_required", "unknown", "restricted", "rejected"] as const;
    for (const workStatus of statuses.filter(value => value !== "rejected")) {
      for (const imageStatus of statuses) {
        const image = app.registerImportedAsset({ projectId, baseRevision: revision(), name: "绑定图", kind: "image", managedPath: `assets/${workStatus}-${imageStatus}.png`, sourceHash: "a".repeat(64), provenance: { source: "local_import", rightsStatus: imageStatus, attributionText: "图片署名", acquiredAt: new Date().toISOString() } }).asset;
        app.applyMediaAnalysis({ projectId, assetId: image.id, metadata: { durationMs: 0, width: 1, height: 1, hasAudio: false } });
        const work = { ...motionFixture, rights: { ...motionFixture.rights, status: workStatus, attribution: "作品署名" }, imageBindings: { picture: image.id } };
        const job = app.submitManagedMotion({ projectId, baseRevision: revision(), idempotencyKey: `${workStatus}-${imageStatus}`, work });
        const asset = app.completeManagedMotion({ projectId, jobId: job.id, engineVersion: "fixture", sourceHash: "fixture", metadata: { durationMs: 600, width: 320, height: 320, fps: 30, hasAudio: false } });
        assert.equal(asset.provenance?.rightsStatus, statuses[Math.max(statuses.indexOf(workStatus), statuses.indexOf(imageStatus))]);
        assert.equal(asset.provenance?.attributionText, "作品署名\n图片署名");
      }
    }
  } finally { app.close(); await rm(root, { recursive: true, force: true }); }
});

test("图片绑定固定哈希与授权，跨项目及提交后字节改变不会被后台偷偷接受", async () => {
  const root = await mkdtemp(join(tmpdir(), "videocut-motion-images-"));
  const app = createApplication(root);
  try {
    const created = app.createProject({ name: "受管图片测试", profile: "presenter_motion" });
    const projectId = created.snapshot.project.id;
    const revision = () => app.readProject(projectId).revision.number;
    const bytes = Buffer.from("fixture-image-bytes");
    const managedPath = "assets/image.png";
    const path = join(created.snapshot.project.rootPath, managedPath);
    await writeFile(path, bytes);
    const image = app.registerImportedAsset({ projectId, baseRevision: revision(), name: "受管图片", kind: "image", managedPath, sourceHash: createHash("sha256").update(bytes).digest("hex"), provenance: { source: "local_import", rightsStatus: "unknown", acquiredAt: new Date().toISOString() } }).asset;
    app.applyMediaAnalysis({ projectId, assetId: image.id, metadata: { durationMs: 0, width: 1, height: 1, hasAudio: false } });
    const work = { ...motionFixture, imageBindings: { logo: image.id } };
    const other = app.createProject({ name: "其他候选项目", profile: "presenter_motion" });
    assert.throws(() => app.submitManagedMotion({ projectId: other.snapshot.project.id, baseRevision: other.revision.number, idempotencyKey: "cross", work }));
    const job = app.submitManagedMotion({ projectId, baseRevision: revision(), idempotencyKey: "images", work });
    assert.throws(() => app.readManagedMotion(other.snapshot.project.id, job.id), /不属于/u);
    await writeFile(path, "changed");
    await assert.rejects(runMotionJob(app, job, async () => { assert.fail("字节变化不能进入渲染"); }), /MOTION_IMAGE_CHANGED/u);
    const asset = app.completeManagedMotion({ projectId, jobId: job.id, engineVersion: "fixture-only", sourceHash: "fixture", metadata: { width: 320, height: 320, fps: 30, durationMs: 600, hasAudio: false } });
    assert.equal(asset.provenance?.rightsStatus, "unknown", "作品声明 cleared 不能覆盖图片的未知授权");
    assert.throws(() => motionSubmissionSchema.parse({ ...work, props: { assets: { logo: "https://example.com/logo" } } }));
  } finally { app.repository.close(); await rm(root, { recursive: true, force: true }); }
});
