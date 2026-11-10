import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { createHash } from "node:crypto";
import { createApplication } from "@videocut/application";
import type { MotionOnSuccess, MotionContinuationResult } from "@videocut/contracts";
import { motionFixture } from "./fixtures/managed-motion.js";
import { completeMotionFixture } from "./fixtures/motion-output.js";
import { processClaimedJob } from "../packages/job-runtime/src/index.js";
import { createRenderJobProcessor } from "../apps/render-worker/src/index.js";
import { runMotionJob } from "../apps/render-worker/src/motion-job.js";
import { runPreviewJob } from "../apps/render-worker/src/exporter.js";

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "vfc-continuation-")), app = createApplication(root);
  const created = app.createProject({ name: "采用接续隔离验证" }), projectId = created.snapshot.project.id;
  const rev = () => app.readProject(projectId).revision.number;
  app.repository.commit(projectId, rev(), "隔离画布", snapshot => Object.assign(snapshot.timeline, { width: 320, height: 320, fps: 30 }));
  const complete = (jobId: string, hash = "fixed", frame = 6) => completeMotionFixture(app, { projectId, jobId,
    engineVersion: String(app.trackJob(jobId).payload.engineVersion), sourceHash: hash,
    metadata: { width: 320, height: 320, durationMs: 600, hasAudio: false },
    eventMap: { version: String(app.trackJob(jobId).payload.version), fps: 30, frameCount: 18, events: [{ id: "hit", meaning: "落定", startFrame: frame }] } });
  const oldJob = app.submitManagedMotion({ projectId, baseRevision: rev(), idempotencyKey: "old", work: motionFixture });
  const old = complete(oldJob.id);
  const scene = app.createScene({ projectId, baseRevision: rev(), type: "ExplainerScene", title: "范围", purpose: "采用", startFrame: 0, endFrame: 18 }).snapshot.scenes[0];
  const cue = app.createEffectCue({ projectId, baseRevision: rev(), sceneId: scene.id, type: "ManagedMotion", layer: "fullscreen", startFrame: 0, endFrame: 18, workId: old.motion!.workId! }).snapshot.effectCues[0];
  const target: MotionOnSuccess = { action: "replace_cue", cueId: cue.id, audioPolicy: "rebind_unchanged_events" };
  const submit = (key: string) => app.submitManagedMotion({ projectId, baseRevision: rev(), idempotencyKey: key,
    work: { ...motionFixture, props: { text: "新版重点" } }, onSuccess: target });
  return { root, app, projectId, rev, complete, cue, old, target, submit,
    close: async () => { app.close(); await rm(root, { recursive: true, force: true }); } };
}

test("源码首次采用创建真实 Cue，缺少可用范围或目标变化时保留固定作品", async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-create-continuation-")), app = createApplication(root);
  try {
    const created = app.createProject({ name: "首次采用隔离验证" }), projectId = created.snapshot.project.id;
    const rev = () => app.readProject(projectId).revision.number;
    app.repository.commit(projectId, rev(), "隔离画布", snapshot => Object.assign(snapshot.timeline, { width: 320, height: 320, fps: 30 }));
    const scene = app.createScene({ projectId, baseRevision: rev(), type: "ExplainerScene", title: "首段", purpose: "采用", startFrame: 0, endFrame: 18 }).snapshot.scenes[0];
    const target: MotionOnSuccess = { action: "create_cue", sceneId: scene.id, layer: "fullscreen", startFrame: 0, endFrame: 18,
      sourceStartFrame: 0, sourceEndFrame: 18, audioPolicy: "rebind_unchanged_events" };
    const job = app.registerMotionWork({ projectId, baseRevision: rev(), idempotencyKey: "first", work: motionFixture, onSuccess: target });
    app.repository.commit(projectId, rev(), "无关名称", (snapshot, impact) => { snapshot.project.name = "仍可采用"; impact.changed.push(snapshot.project.id); });
    const work = app.completeSourceMotionWork(projectId, job.id);
    const result = app.trackJob(job.id).result!.continuation as MotionContinuationResult;
    assert.equal(result.status, "applied");
    if (result.status !== "applied") assert.fail(JSON.stringify(result));
    assert.equal(result.cueSegments.oldCueId, undefined);
    assert.equal(result.cueSegments.segments.length, 1);
    const cue = app.readProject(projectId).snapshot.effectCues.find(entry => entry.id === result.cueSegments.segments[0].cueId)!;
    assert.equal(cue.workId, work.id);
    const after = rev();
    app.completeSourceMotionWork(projectId, job.id);
    assert.equal(rev(), after);
    assert.equal(app.readProject(projectId).snapshot.effectCues.length, 1);
    assert.equal(app.listJobs(projectId).filter(entry => entry.kind === "preview").length, 0);

    const next = app.createScene({ projectId, baseRevision: rev(), type: "ExplainerScene", title: "后段", purpose: "未完成范围", startFrame: 18, endFrame: 36 }).snapshot.scenes.find(entry => entry.id !== scene.id)!;
    const pending = app.registerMotionWork({ projectId, baseRevision: rev(), idempotencyKey: "incomplete", work: { ...motionFixture, name: "部分完成" },
      readyRanges: [{ startFrame: 0, endFrame: 9 }], onSuccess: { ...target, sceneId: next.id, startFrame: 18, endFrame: 36 } });
    const incomplete = app.completeSourceMotionWork(projectId, pending.id);
    const blocked = app.trackJob(pending.id).result!.continuation as MotionContinuationResult;
    assert.equal(blocked.status, "needs_reconfirmation");
    assert.ok(app.readProject(projectId).snapshot.motionWorks!.some(entry => entry.id === incomplete.id));
    assert.equal(app.readProject(projectId).snapshot.effectCues.length, 1);

    const racing = app.registerMotionWork({ projectId, baseRevision: rev(), idempotencyKey: "racing", work: { ...motionFixture, name: "冲突前作品" },
      onSuccess: { ...target, sceneId: next.id, startFrame: 18, endFrame: 36 } });
    app.createEffectCue({ projectId, baseRevision: rev(), sceneId: next.id, type: "ManagedMotion", layer: "fullscreen", startFrame: 18, endFrame: 36, workId: work.id });
    const raceWork = app.completeSourceMotionWork(projectId, racing.id);
    assert.equal((app.trackJob(racing.id).result!.continuation as MotionContinuationResult).status, "needs_reconfirmation");
    assert.ok(app.readProject(projectId).snapshot.motionWorks!.some(entry => entry.id === raceWork.id));
    assert.equal(app.readProject(projectId).snapshot.effectCues.length, 2);
  } finally { app.close(); await rm(root, { recursive: true, force: true }); }
});

test("生成完成同事务采用、重绑真实不变事件，不自动生成预览；重复完成不多写", async () => {
  const f = await fixture();
  try {
    const imported = f.app.registerImportedAsset({ projectId: f.projectId, baseRevision: f.rev(), name: "落点", kind: "audio", managedPath: "assets/source/hit.wav" });
    f.app.applyMediaAnalysis({ projectId: f.projectId, assetId: imported.asset.id, metadata: { durationMs: 100, hasAudio: true } });
    f.app.manageAudio({ projectId: f.projectId, baseRevision: f.rev(), action: "create", kind: "sfx", assetId: imported.asset.id, purpose: "准确落定", eventFrame: 6, onsetOffsetFrames: 0,
      effectEvent: { effectCueId: f.cue.id, eventId: "hit", eventName: "落定", workVersion: f.old.motion!.version, localFrame: 6 } });
    const job = f.submit("new"), before = f.rev(), asset = f.complete(job.id);
    const saved = f.app.trackJob(job.id).result!.continuation as MotionContinuationResult;
    assert.equal(saved.status, "applied");
    if (saved.status !== "applied") assert.fail(JSON.stringify(saved));
    assert.equal(f.rev(), before + 1);
    const current = f.app.readProject(f.projectId);
    assert.equal(current.snapshot.effectCues[0].workId, asset.motion!.workId);
    assert.equal(current.snapshot.audioCues[0].status, "ready");
    assert.equal(current.snapshot.audioCues[0].effectEvent!.workVersion, asset.motion!.version);
    assert.notEqual(current.snapshot.timeline.items.find(item => item.id === current.snapshot.audioCues[0].timelineItemId)!.disabled, true);
    const changedEvent = f.app.submitManagedMotion({ projectId: f.projectId, baseRevision: f.rev(), idempotencyKey: "bound-event-changed",
      work: { ...motionFixture, props: { text: "绑定动作的新版本" } }, onSuccess: f.target }), beforeChanged = f.rev();
    f.complete(changedEvent.id, "bound-change", 7);
    const conflict = f.app.trackJob(changedEvent.id).result!.continuation as MotionContinuationResult;
    assert.equal(conflict.status, "needs_reconfirmation");
    if (conflict.status !== "needs_reconfirmation") assert.fail(JSON.stringify(conflict));
    assert.match(conflict.conflicts[0].reason, /准确落定.*hit/);
    assert.equal(f.rev(), beforeChanged + 1); // 作品登记成功，原画面与声音保持原子一致。
    assert.equal(f.app.readProject(f.projectId).snapshot.effectCues[0].workId, asset.motion!.workId);
    f.complete(job.id);
    assert.equal(f.rev(), beforeChanged + 1);
    assert.equal(f.app.repository.listJobs(f.projectId).filter(entry => entry.kind === "preview").length, 0);
    // 通用终态不能把已提交结果覆盖成处理器持有的旧值。
    await processClaimedJob(f.app, job, async () => ({ continuation: { status: "obsolete" } }));
    assert.deepEqual(f.app.trackJob(job.id).result!.continuation, saved);
    assert.throws(() => f.app.submitManagedMotion({ projectId: f.projectId, baseRevision: f.rev(), idempotencyKey: "new",
      work: { ...motionFixture, props: { text: "新版重点" } }, onSuccess: f.target }), { code: "MOTION_IDEMPOTENCY_CONFLICT" });
  } finally { await f.close(); }
});

test("无关编辑和无声音事件变化可继续；事务写入失败整笔回滚", async () => {
  const f = await fixture();
  try {
    const good = f.submit("unrelated");
    f.app.repository.commit(f.projectId, f.rev(), "无关素材备注", (snapshot, impact) => {
      snapshot.project.name = "无关名称"; impact.changed.push(snapshot.project.id);
    });
    f.complete(good.id);
    assert.equal((f.app.trackJob(good.id).result!.continuation as MotionContinuationResult).status, "applied");
    const changed = f.app.submitManagedMotion({ projectId: f.projectId, baseRevision: f.rev(), idempotencyKey: "event-changed", work: { ...motionFixture, props: { text: "不同事件的新作品" } }, onSuccess: f.target }), original = f.app.readProject(f.projectId).snapshot.effectCues[0].workId;
    const adopted = f.complete(changed.id, "changed", 7);
    assert.equal((f.app.trackJob(changed.id).result!.continuation as MotionContinuationResult).status, "applied");
    assert.notEqual(f.app.readProject(f.projectId).snapshot.effectCues[0].workId, original);
    assert.equal(f.app.readProject(f.projectId).snapshot.effectCues[0].workId, adopted.motion!.workId);
    const retry = f.submit("rollback"), before = f.rev(), update = f.app.repository.updateJob.bind(f.app.repository);
    f.app.repository.updateJob = (id, input) => { if (id === retry.id && input.result?.continuation) throw new Error("注入采用记录失败"); return update(id, input); };
    assert.throws(() => f.complete(retry.id), /注入/);
    assert.equal(f.rev(), before);
    assert.equal(f.app.trackJob(retry.id).result?.continuation, undefined);
    assert.equal(f.app.readProject(f.projectId).snapshot.assets.some(asset => asset.motion?.jobId === retry.id), false);
    f.app.repository.updateJob = update;
    f.complete(retry.id);
    assert.equal(f.rev(), before + 1);
    const race = f.submit("race"), commit = f.app.repository.commitMotionResult.bind(f.app.repository), raceBefore = f.rev();
    let firstId = "";
    f.app.repository.commitMotionResult = input => {
      f.app.repository.commitMotionResult = commit;
      firstId = f.complete(race.id).id;
      return commit(input);
    };
    assert.equal(f.complete(race.id).id, firstId);
    assert.equal(f.rev(), raceBefore + 1);
    assert.throws(() => f.app.submitManagedMotion({ projectId: f.projectId, baseRevision: f.rev(), idempotencyKey: "proof", work: motionFixture,
      frameRange: { startFrame: 0, endFrame: 6 }, onSuccess: f.target }), { code: "MOTION_PROOF_NOT_ASSET" });
  } finally { await f.close(); }
});

test("重新确认采用短任务由现有Worker消费；Web/MCP应用恢复身份一致且unknown不重放", async () => {
  const f = await fixture();
  try {
    const source = f.app.submitManagedMotion({ projectId: f.projectId, baseRevision: f.rev(), idempotencyKey: "ready", work: { ...motionFixture, props: { text: "已生成" } } });
    const bytes = Buffer.from("隔离媒体字节"), hash = createHash("sha256").update(bytes).digest("hex"), asset = f.complete(source.id, hash);
    const path = join(f.app.readProject(f.projectId).snapshot.project.rootPath, asset.managedPath);
    await mkdir(dirname(path), { recursive: true }); await writeFile(path, bytes);
    const adoption = f.app.submitMotionAdoption({ projectId: f.projectId, baseRevision: f.rev(), workId: asset.motion!.workId!, target: f.target, idempotencyKey: "explicit" });
    await processClaimedJob(f.app, adoption, createRenderJobProcessor(f.app));
    assert.equal(f.app.trackJob(adoption.id).status, "succeeded");
    assert.equal((f.app.trackJob(adoption.id).result!.continuation as MotionContinuationResult).status, "applied");
    const preview = f.app.submitPreview({ projectId: f.projectId, revision: f.rev(), fromFrame: 0, toFrame: 18 });
    f.app.updateJob(preview.id, { status: "failed" });
    const b = f.app.retryJob(f.projectId, preview.id);
    assert.equal(f.app.intelligence.retry(f.projectId, preview.id).id, b.id);
    f.app.updateJob(b.id, { status: "failed" });
    assert.equal(f.app.retryJob(f.projectId, preview.id).id, b.id);
    const c = f.app.retryJob(f.projectId, b.id);
    assert.notEqual(c.id, b.id);
    f.app.updateJob(c.id, { status: "unknown" });
    assert.throws(() => f.app.retryJob(f.projectId, c.id), { code: "JOB_RETRY_REQUIRES_RECONCILIATION" });
    const queued = f.app.submitMotionAdoption({ projectId: f.projectId, baseRevision: f.rev(), workId: asset.motion!.workId!, target: f.target, idempotencyKey: "candidate-change" });
    assert.throws(() => f.app.repository.commit(f.projectId, f.rev(), "错误原地修改作品", snapshot => {
      snapshot.motionWorks!.find(work => work.id === asset.motion!.workId)!.eventMap!.events[0].meaning = "已改变";
    }), { code: "MOTION_WORK_IMMUTABLE" });
    const definition = f.app.readSourceMotionWork(f.projectId, asset.motion!.workId!).work;
    await writeFile(join(f.app.readProject(f.projectId).snapshot.project.rootPath, definition.definitionPath), "损坏的固定输入");
    await processClaimedJob(f.app, queued, createRenderJobProcessor(f.app));
    assert.equal(f.app.trackJob(queued.id).status, "failed");
    assert.match(f.app.trackJob(queued.id).error!, /MOTION_DEFINITION_CHANGED/);
  } finally { await f.close(); }
});

test("真实画面生成后自动采用并合成可播放预览，状态与观察不混同", { timeout: 120_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-continuation-real-")), app = createApplication(root);
  try {
    const initial = app.createProject({ name: "真实接续隔离片" }), projectId = initial.snapshot.project.id, rev = () => app.readProject(projectId).revision.number;
    app.repository.commit(projectId, rev(), "隔离画布", snapshot => Object.assign(snapshot.timeline, { width: 320, height: 320, fps: 30 }));
    const oldJob = app.submitManagedMotion({ projectId, baseRevision: rev(), idempotencyKey: "real-old", work: motionFixture });
    const oldResult = await runMotionJob(app, oldJob);
    app.updateJob(oldJob.id, { status: "succeeded", result: oldResult });
    const scene = app.createScene({ projectId, baseRevision: rev(), type: "ExplainerScene", title: "完整接续", purpose: "真实输出", startFrame: 0, endFrame: 18 }).snapshot.scenes[0];
    const cue = app.createEffectCue({ projectId, baseRevision: rev(), sceneId: scene.id, type: "ManagedMotion", layer: "fullscreen", startFrame: 0, endFrame: 18,
      workId: String(oldResult.workId) }).snapshot.effectCues[0];
    const next = app.submitManagedMotion({ projectId, baseRevision: rev(), idempotencyKey: "real-next", work: { ...motionFixture, props: { text: "自动接续已实现" } },
      onSuccess: { action: "replace_cue", cueId: cue.id, audioPolicy: "rebind_unchanged_events" } });
    const generated = await runMotionJob(app, next);
    const adopted = generated.continuation as Extract<MotionContinuationResult, { status: "applied" }>;
    assert.equal(adopted.status, "applied");
    assert.equal(app.listJobs(projectId).filter(job => job.kind === "preview").length, 0);
    const preview = app.submitPreview({ projectId, revision: adopted.appliedRevision, fromFrame: 0, toFrame: 18 }), rendered = await runPreviewJob(app, preview);
    app.updateJob(preview.id, { status: "succeeded", result: rendered });
    assert.equal(rendered.frameCount, 18);
    assert.equal(rendered.fps, 30);
    assert.ok(typeof rendered.sourceHash === "string" && rendered.sourceHash.length === 64);
    const status = await app.readProductionStatus(projectId);
    assert.equal(status.work.adopted[0].assetId, generated.assetId);
    assert.equal(status.files.previews[0].status, "succeeded");
    assert.deepEqual(status.observations.sound, []);
    assert.deepEqual(status.user, []);
  } finally { app.close(); await rm(root, { recursive: true, force: true }); }
});
