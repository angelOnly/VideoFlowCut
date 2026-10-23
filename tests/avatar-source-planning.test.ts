import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApplication } from "@videocut/application";
import type { PresenterUse, AvatarSourceJobPayload, BridgeRunAudit } from "@videocut/contracts";
import { avatarBindingMatches } from "@videocut/domain";

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "vfc-avatar-source-"));
  const app = createApplication(root);
  const projectId = app.createProject({ name: "按需人物源隔离测试", profile: "presenter_motion" }).snapshot.project.id;
  const current = () => app.readProject(projectId);
  const rev = () => current().revision.number;
  const add = (kind: "image" | "speech", name: string) => {
    const asset = app.registerImportedAsset({ projectId, baseRevision: rev(), kind, name, managedPath: `assets/${name}`, sourceHash: `${name}-hash` }).asset;
    app.applyMediaAnalysis({ projectId, assetId: asset.id, metadata: kind === "speech"
      ? { durationMs: 15000, hasAudio: true, sampleRate: 48000, audioCodec: "pcm_s16le" }
      : { durationMs: 0, hasAudio: false, width: 128, height: 128 } });
    return asset.id;
  };
  app.applyAuthoredScript({ projectId, baseRevision: rev(), sourceNote: "测试当前完整自然语音段",
    units: [{ text: "这是完整的十五秒自然语音段，只在其中两个分离范围需要人物。", kind: "statement", confidence: 1, pauseBefore: { durationMs: 0, reason: "sentence" } }] });
  const audioId = add("speech", "speech.wav"), imageId = add("image", "portrait.png");
  const segment = current().snapshot.speechSegments[0]!;
  app.applySpeechAssembly({ projectId, generatedAssets: [], segmentAssets: [{
    id: "sa", speechSegmentId: segment.id, assetId: audioId, voiceReferenceAssetId: audioId,
    durationMs: 15000, bridgeRunId: "test", schemaVersion: "test", quality: "passed"
  }], speechAsset: { id: "speech-v1", assetId: audioId, scriptRevision: current().snapshot.script.revision,
    segmentAssetIds: ["sa"], status: "ready", timing: { precision: "segment_exact", source: "测试段级实测",
      segments: [{ speechSegmentId: segment.id, startMs: 0, endMs: 15000, startFrame: 0, endFrame: 360 }] } } });
  const scene = app.createScene({ projectId, baseRevision: rev(), type: "PresenterScene", title: "测试场面", purpose: "验证供应",
    startFrame: 0, endFrame: 360 }).snapshot.scenes[0]!;
  const profile = app.manageActorCapabilityProfile({ projectId, baseRevision: rev(), action: "create", provider: "ltx23_audio_to_video",
    label: "隔离工作流", workflowId: "ltx-test", inputModes: ["audio"], maskModes: ["none"],
    supportsReferenceImage: true, supportsAudioDrivenLipSync: true, supportsPartialRegeneration: false,
    maxDurationSeconds: 20, privacyNote: "隔离测试" }).snapshot.actorCapabilityProfiles[0]!;
  const use = (id: string, startFrame: number, endFrame: number): PresenterUse => ({
    id, startFrame, endFrame, speechAssetId: "speech-v1", referenceImageAssetId: imageId,
    performanceNote: "自然讲述", timingEvidence: { kind: "audio_review", note: "隔离测试已知采样边界" }
  });
  let treatmentId: string | undefined;
  const save = (uses: PresenterUse[]) => {
    const s = app.manageVisualTreatment({ projectId, baseRevision: rev(), action: "upsert", visualTreatmentId: treatmentId,
      sceneId: scene.id, mode: "remotion", primaryAttention: "内容", narrativePurpose: "验证源", intensity: "medium", presenterUses: uses });
    treatmentId = s.snapshot.visualTreatments[0]!.id;
    return s;
  };
  const prepare = (ids?: string[]) => app.prepareAvatarSources({ projectId, capabilityProfileId: profile.id, presenterUseIds: ids });
  const submit = (ids: string[], extra: { attempt?: string; sourceGroupKey?: string; planFingerprint?: string } = {}) =>
    app.submitAvatarSourceGeneration({ projectId, baseRevision: rev(), contractVersion: 2, capabilityProfileId: profile.id, presenterUseIds: ids, ...extra });
  const complete = async (jobId: string, durationMs: number) => {
    const path = join(current().snapshot.project.rootPath, "assets", `${jobId}.mp4`);
    await mkdir(join(current().snapshot.project.rootPath, "assets"), { recursive: true });
    // 应用层合同测试；真实编码和解码另由 Worker 测试验证。
    await writeFile(path, "test-output");
    return app.completeAvatarSourceGeneration({ projectId, jobId, bridgeAudit: { runId: "test-run" } as BridgeRunAudit,
      actorVideo: { path, relativePath: `assets/${jobId}.mp4`, name: "测试人物源", contentHash: jobId, sourceHash: jobId,
        durationMs, metadata: { durationMs, hasAudio: false, videoCodec: "h264", width: 128, height: 128, fps: 24 } } });
  };
  return { root, app, projectId, current, rev, use, save, prepare, submit, complete, audioId, imageId,
    close: async () => { app.close(); await rm(root, { recursive: true, force: true }); } };
}

test("长自然段按分离中段生成；不强制全文，提交固定采样且只登记源", async () => {
  const f = await fixture();
  try {
    f.save([f.use("a", 48, 120), f.use("b", 240, 288)]);
    const plan = f.prepare();
    assert.equal(plan.groups.length, 2);
    assert.equal(plan.gaps.length, 0);
    assert.deepEqual(plan.groups.map(g => [g.input.audio.startSample, g.input.audio.endSample]), [[96000, 240000], [480000, 576000]]);
    assert.throws(() => f.submit(["a", "b"]), { code: "AVATAR_SOURCE_GROUP_REQUIRED" });
    const a = f.submit(["a"]), b = f.submit(["b"]);
    assert.equal((a.payload as AvatarSourceJobPayload).input.profile.supportsPartialRegeneration, false);
    const first = await f.complete(a.id, 3000);
    const second = await f.complete(b.id, 2000);
    assert.equal(second.state.snapshot.actorPerformances.length, 0);
    assert.equal(second.state.snapshot.assets.filter(a => a.avatarSourceReceipt).length, 2);
    assert.equal((await f.complete(a.id, 3000)).duplicate, true);
    const adopted = f.app.adoptAvatarSource({ projectId: f.projectId, baseRevision: f.rev(), presenterUseId: "a", assetId: first.asset.id });
    const performance = adopted.snapshot.actorPerformances[0]!;
    const item = adopted.snapshot.timeline.items.find(i => i.id === performance.timelineItemId)!;
    assert.equal(item.mediaAudioPolicy, "mute");
    assert.equal(avatarBindingMatches(adopted.snapshot, performance, item), true);
    assert.equal(f.prepare().groups.length, 0);
  } finally { await f.close(); }
});

test("新增子范围直接复用，延长只补缺口；缩短或取消不重新插回旧位置", async () => {
  const f = await fixture();
  try {
    f.save([f.use("a", 48, 120)]);
    const a = f.submit(["a"]);
    const result = await f.complete(a.id, 3000);
    f.app.adoptAvatarSource({ projectId: f.projectId, baseRevision: f.rev(), presenterUseId: "a", assetId: result.asset.id });
    f.save([f.use("a", 48, 144)]);
    assert.equal(f.current().snapshot.timeline.items.filter(i => !i.disabled && i.assetId === result.asset.id).length, 1,
      "补缺口期间原有有效源必须继续播放");
    f.save([f.use("a", 48, 120)]);
    f.save([f.use("inside", 72, 96)]);
    assert.equal(f.prepare(["inside"]).groups.length, 0);
    f.app.adoptAvatarSource({ projectId: f.projectId, baseRevision: f.rev(), presenterUseId: "inside", assetId: result.asset.id });
    const inside = f.current().snapshot.actorPerformances.find(p => p.sourceBinding?.presenterUseId === "inside")!;
    assert.equal(f.current().snapshot.timeline.items.find(i => i.id === inside.timelineItemId)!.sourceStartFrame, 24);
    f.save([f.use("a", 48, 144)]);
    const gap = f.prepare(["a"]);
    assert.deepEqual(gap.groups.map(g => [g.input.audio.startSample, g.input.audio.endSample]), [[240000, 288000]]);
    const b = f.submit(["a"]);
    f.save([]);
    await f.complete(b.id, 1000);
    assert.equal(f.current().snapshot.assets.filter(a => a.avatarSourceReceipt).length, 2);
    assert.equal(f.current().snapshot.timeline.items.filter(i => !i.disabled && i.assetId === result.asset.id).length, 0);
    assert.throws(() => f.app.adoptAvatarSource({ projectId: f.projectId, baseRevision: f.rev(), presenterUseId: "a", assetId: result.asset.id }),
      { code: "PRESENTER_USE_NOT_FOUND" });
  } finally { await f.close(); }
});

test("短源拒收、依赖变更拒绝旧预检、明确重抽样保留独立尝试", async () => {
  const f = await fixture();
  try {
    f.save([f.use("a", 48, 120)]);
    const initial = f.prepare();
    const a = f.submit(["a"]);
    assert.equal(f.submit(["a"]).id, a.id);
    assert.notEqual(f.submit(["a"], { attempt: "另一种表演" }).id, a.id);
    await assert.rejects(f.complete(a.id, 2990), { code: "AVATAR_OUTPUT_TOO_SHORT" });
    f.save([f.use("a", 72, 120)]);
    assert.throws(() => f.submit(["a"], { planFingerprint: initial.planFingerprint }), { code: "AVATAR_PLAN_STALE" });
    const result = await f.complete(a.id, 3000);
    assert.notEqual(f.submit(["a"], { attempt: "完成后再抽一次" }).id, a.id);
    assert.equal(result.asset.avatarSourceReceipt!.generationRange.startFrame, 48);
    const adopted = f.app.adoptAvatarSource({ projectId: f.projectId, baseRevision: f.rev(), presenterUseId: "a", assetId: result.asset.id });
    const item = adopted.snapshot.timeline.items.find(i => i.assetId === result.asset.id)!;
    assert.equal(item.sourceStartFrame, 24);
  } finally { await f.close(); }
});

test("正式移动 Dialogue 后可更新出镜并复用原源，不让图校验阻断改编排", async () => {
  const f = await fixture();
  try {
    f.save([f.use("a", 48, 120)]);
    const source = await f.complete(f.submit(["a"]).id, 3000);
    f.app.adoptAvatarSource({ projectId: f.projectId, baseRevision: f.rev(), presenterUseId: "a", assetId: source.asset.id });
    const before = f.current().snapshot;
    const dialogue = before.timeline.items.find(item => item.assetId === f.audioId)!;
    const performance = before.actorPerformances[0]!;
    const moved = f.app.moveItem({ projectId: f.projectId, baseRevision: f.rev(), itemId: dialogue.id, startFrame: 24 });
    assert.equal(moved.snapshot.timeline.items.find(item => item.id === performance.timelineItemId)!.disabled, true);
    assert.ok(moved.revision.impact.stale.includes(performance.id));
    assert.ok(moved.revision.impact.changed.includes(performance.timelineItemId));
    const jobsBefore = f.app.repository.listJobs(f.projectId).length;
    f.save([f.use("a", 72, 144)]);
    assert.equal(f.prepare(["a"]).groups.length, 0);
    const adopted = f.app.adoptAvatarSource({ projectId: f.projectId, baseRevision: f.rev(), presenterUseId: "a", assetId: source.asset.id });
    const active = adopted.snapshot.actorPerformances.find(entry => !adopted.snapshot.timeline.items.find(item => item.id === entry.timelineItemId)!.disabled)!;
    const item = adopted.snapshot.timeline.items.find(entry => entry.id === active.timelineItemId)!;
    assert.deepEqual([item.startFrame, item.endFrame, item.sourceStartFrame, item.sourceEndFrame], [72, 144, 0, 72]);
    assert.equal(avatarBindingMatches(adopted.snapshot, active, item), true);
    assert.equal(f.app.repository.listJobs(f.projectId).length, jobsBefore);
  } finally { await f.close(); }
});

test("依赖协调不会把错误的新人物采用降级后写入", async () => {
  const f = await fixture();
  try {
    f.save([f.use("a", 48, 120)]);
    const source = await f.complete(f.submit(["a"]).id, 3000);
    f.app.adoptAvatarSource({ projectId: f.projectId, baseRevision: f.rev(), presenterUseId: "a", assetId: source.asset.id });
    const revision = f.rev();
    assert.throws(() => f.app.repository.commit(f.projectId, revision, "隔离验证错误新采用", snapshot => {
      const original = snapshot.actorPerformances[0]!;
      const item = snapshot.timeline.items.find(entry => entry.id === original.timelineItemId)!;
      item.disabled = true;
      snapshot.timeline.items.push({ ...item, id: "invalid-new-item", disabled: false, sourceStartFrame: 1, sourceEndFrame: 73 });
      snapshot.actorPerformances.push({ ...structuredClone(original), id: "invalid-new-performance", timelineItemId: "invalid-new-item" });
    }), { code: "PROJECT_GRAPH_INVALID" });
    assert.equal(f.rev(), revision);
  } finally { await f.close(); }
});

test("同一用途局部替换只切换中间，保留两侧真实源且无重叠", async () => {
  const f = await fixture();
  try {
    f.save([f.use("a", 48, 120)]);
    const first = await f.complete(f.submit(["a"]).id, 3000);
    f.app.adoptAvatarSource({ projectId: f.projectId, baseRevision: f.rev(), presenterUseId: "a", assetId: first.asset.id });
    const second = await f.complete(f.submit(["a"], { attempt: "换表演" }).id, 3000);
    const adopted = f.app.adoptAvatarSource({ projectId: f.projectId, baseRevision: f.rev(), presenterUseId: "a",
      assetId: second.asset.id, startFrame: 72, endFrame: 96 });
    const items = adopted.snapshot.timeline.items.filter(i => !i.disabled && [first.asset.id, second.asset.id].includes(i.assetId)).sort((a, b) => a.startFrame - b.startFrame);
    assert.deepEqual(items.map(i => [i.startFrame, i.endFrame, i.assetId]), [[48, 72, first.asset.id], [72, 96, second.asset.id], [96, 120, first.asset.id]]);
    for (const item of items) assert.ok(avatarBindingMatches(adopted.snapshot, adopted.snapshot.actorPerformances.find(p => p.timelineItemId === item.id)!, item));
  } finally { await f.close(); }
});

test("旧长源依据历史 Job 的真实音频只读复用，采用中段不改生成历史", async () => {
  const f = await fixture();
  try {
    const snapshot = f.current().snapshot;
    const profile = snapshot.actorCapabilityProfiles[0]!;
    const job = f.app.repository.createJob({ projectId: f.projectId, kind: "avatar_generation", idempotencyKey: "legacy",
      payload: { requestedRevision: f.rev(), capabilityProfileId: profile.id, workflowId: profile.workflowId,
        referenceImageAssetId: f.imageId, speechAssetId: snapshot.speechAsset!.id,
        generationRange: { startFrame: 0, endFrame: 360, speechSegmentIds: [snapshot.speechSegments[0]!.id] },
        placement: { sceneId: snapshot.scenes[0]!.id, startFrame: 0, endFrame: 360 },
        maskMode: "none", audioMode: "use_dialogue_track", note: "自然讲述" } });
    const path = join(snapshot.project.rootPath, "assets", "legacy.mp4");
    await mkdir(join(snapshot.project.rootPath, "assets"), { recursive: true });
    await writeFile(path, "legacy-application-fixture");
    const completed = f.app.completeAvatarGeneration({ projectId: f.projectId, jobId: job.id,
      bridgeAudit: { runId: "legacy-run" } as BridgeRunAudit,
      actorVideo: { path, relativePath: "assets/legacy.mp4", name: "历史长源", contentHash: "legacy", sourceHash: "legacy",
        durationMs: 15000, metadata: { durationMs: 15000, hasAudio: false, videoCodec: "h264", fps: 24 } } });
    f.app.repository.commit(f.projectId, f.rev(), "隔离样本撤回旧全屏使用", state => {
      state.timeline.items.find(i => i.id === completed.timelineItem.id)!.disabled = true;
    });
    f.save([f.use("middle", 48, 120)]);
    const before = f.rev();
    const plan = f.prepare();
    assert.equal(plan.groups.length, 0);
    assert.equal(plan.reusable[0]!.assetId, completed.asset.id);
    assert.equal(f.rev(), before);
    assert.equal(f.current().snapshot.assets.find(a => a.id === completed.asset.id)!.avatarSourceReceipt, undefined);
    const adopted = f.app.adoptAvatarSource({ projectId: f.projectId, baseRevision: f.rev(), presenterUseId: "middle", assetId: completed.asset.id });
    const performance = adopted.snapshot.actorPerformances.find(p => p.sourceBinding?.presenterUseId === "middle")!;
    assert.equal(performance.generationRange!.endFrame, 360);
    assert.equal(adopted.snapshot.timeline.items.find(i => i.id === performance.timelineItemId)!.sourceStartFrame, 48);
    assert.equal(f.app.repository.listJobs(f.projectId).filter(j => j.kind === "avatar_generation").length, 1);
  } finally { await f.close(); }
});

test("段级时序不能冒充段内词级边界，缺口要求真实局部核验", async () => {
  const f = await fixture();
  try {
    const use = f.use("middle", 48, 120);
    use.timingEvidence = { kind: "aligned", note: "只有段首尾，没有段内词对齐" };
    f.save([use]);
    assert.equal(f.prepare().gaps[0]?.code, "AVATAR_TIMING_EVIDENCE_REQUIRED");
    assert.throws(() => f.submit(["middle"]), { code: "AVATAR_TIMING_EVIDENCE_REQUIRED" });
    f.save([f.use("middle", 48, 120)]);
    assert.equal(f.prepare().gaps.length, 0);
  } finally { await f.close(); }
});
