import test from "node:test";
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApplication } from "@videocut/application";
import { prepareReferencePackage } from "../packages/edit-application/src/opendesign-reference-package.mjs";
import { motionFixture } from "./fixtures/managed-motion.js";
import { motionHtml } from "./fixtures/hyperframes.js";

test("无预排的完整新制跨场面沿用首个冻结作品", async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-continuous-scenes-")), app = createApplication(root);
  try {
    const projectId = app.createProject({ name: "跨场面连续作品隔离验证" }).snapshot.project.id;
    const rev = () => app.readProject(projectId).revision.number;
    app.repository.commit(projectId, rev(), "隔离画布", snapshot => Object.assign(snapshot.timeline, { width: 320, height: 320, fps: 30 }));
    const first = app.createScene({ projectId, baseRevision: rev(), type: "ExplainerScene", title: "第一场", purpose: "建立", startFrame: 0, endFrame: 24 }).snapshot.scenes[0];
    const second = app.createScene({ projectId, baseRevision: rev(), type: "ExplainerScene", title: "第二场", purpose: "接续", startFrame: 24, endFrame: 48 }).snapshot.scenes.find(scene => scene.id !== first.id)!;
    const work = { ...motionFixture, durationInFrames: 48, source: motionHtml('<div id="subject">初稿</div>', "", { durationInFrames: 48 }) };
    assert.equal(app.readProject(projectId).snapshot.motionWorks?.length ?? 0, 0);
    const brief = join(root, "brief.md"), timing = join(root, "timing.md"), snapshotPath = join(root, "snapshot.json"), output = join(root, "handoff");
    await writeFile(brief, "跨场面的完整画面设计"); await writeFile(timing, "两场真实时间资料");
    await writeFile(snapshotPath, JSON.stringify(app.readProject(projectId)));
    const sceneInput = (sceneId: string, startFrame: number, endFrame: number) => ({ sceneId, status: "ready",
      visualRoles: [{ role: "主体", referenceFunction: "连续画面", assetIds: [], usage: "原创示意" }], process: "主体建立并接续下一状态",
      preserve: ["主体连续"], adapt: ["文字细节"], visualPlan: { primaryRoles: ["主体"], graphicLed: true,
        graphicReasons: ["需要示意不可见的过程"] } });
    const manifest = await prepareReferencePackage({ projectId, revision: rev(), projectSnapshot: snapshotPath, brief, timingPlan: timing,
      freezeInputs: true, selectedSceneIds: [first.id, second.id], scenes: [sceneInput(first.id, 0, 24), sceneInput(second.id, 24, 48)] }, output);
    assert.deepEqual(manifest.scenes!.map(scene => scene.status), ["ready", "ready"]);
    const manifestPath = join(output, "delivery-manifest.json"), manifestSha256 = createHash("sha256").update(await readFile(manifestPath)).digest("hex");
    const run = await app.startProductionRun({ projectId, baseRevision: rev(), intent: "full_creation", completionScope: { kind: "project" },
      operationId: "start", loadedSkills: ["production-coordinator"] });
    await app.updateProductionRun({ projectId, runId: run.id, expectedAuditVersion: run.auditVersion, operationId: "assign", action: "add_assignment",
      assignment: { assignmentId: "authors", agentId: "/fixture/authors", responsibilities: ["director", "narration", "creative_research", "visual_design", "motion_research"],
        skillIds: ["production-director", "narration-writing", "creative-sequence-design", "visual-treatment-planning", "motion-case-library"], scope: { kind: "project" }, inputRevision: rev() } });
    const record = async (phase: "creative_research" | "motion_research" | "visual_design" | "adoption", inputDecisionIds: string[] = []) =>
      (await app.recordCreativeDecision({ projectId, runId: run.id, operationId: randomUUID(), category: "visual", phase, assignmentId: "authors", inputRevision: rev(),
        objectIds: [first.id, second.id], decision: phase, rationale: "按两个场面的真实范围判断", inputDecisionIds,
        ...(phase.endsWith("research") ? { researchOutcome: "not_applicable" as const, evidence: ["已研究候选，当前画面无适用参考"] } : {}),
        ...(phase === "adoption" ? { deliveryRef: { manifestPath, manifestSha256, sceneIds: [first.id, second.id] } } : {}) })).creativeDecisions.at(-1)!;
    const creative = await record("creative_research"), motion = await record("motion_research");
    const design = await record("visual_design", [creative.id, motion.id]), adoption = await record("adoption", [design.id]);
    const treatment = (sceneId: string) => app.manageVisualTreatment({ projectId, baseRevision: rev(), action: "upsert", sceneId, mode: "remotion",
      intensity: "medium", primaryAttention: "主体", narrativePurpose: "连续解释", adoptedMaterialAssetIds: [],
      adoptedDecisionRef: { productionRunId: run.id, decisionId: adoption.id } }).snapshot.visualTreatments.find(item => item.sceneId === sceneId)!;
    const firstTreatment = treatment(first.id), secondTreatment = treatment(second.id);
    const target = (sceneId: string, startFrame: number, endFrame: number) => ({ action: "create_cue" as const, sceneId, layer: "fullscreen" as const,
      startFrame, endFrame, sourceStartFrame: startFrame, sourceEndFrame: endFrame, audioPolicy: "rebind_unchanged_events" as const });
    const start = (key: string, sceneId: string, treatmentId: string, from: number, to: number, continueRun?: string, odProject = "isolated-od") => app.startMotionAuthoring({ projectId, baseRevision: rev(),
      productionRunId: run.id, visualTreatmentIds: [treatmentId], idempotencyKey: key, target: target(sceneId, from, to),
      openDesignRequest: { project: odProject, prompt: "沿同一完整作品继续制作", ...(continueRun ? { continue_from_run_id: continueRun } : {}) } });
    const firstJob = await start("first", first.id, firstTreatment.id, 0, 24);
    const workId = firstJob.payload.logicalWorkId as string;
    const replay = app.repository.createMotionAuthoringJob({ projectId, baseRevision: 1, idempotencyKey: "motion-authoring:first",
      payload: { input: firstJob.payload.input, authoringInputs: ["重新计算的交付不应覆盖原委托"] } });
    assert.equal(replay.job?.id, firstJob.id);
    assert.throws(() => app.repository.createMotionAuthoringJob({ projectId, baseRevision: 1, idempotencyKey: "motion-authoring:first",
      payload: { input: { different: true } } }), /幂等键已用于不同制作委托/);
    await assert.rejects(start("second-busy", second.id, secondTreatment.id, 24, 48), (error: any) => error.issues?.some((issue: { code: string }) => issue.code === "MOTION_AUTHORING_WORK_BUSY"));
    const firstStage = app.registerMotionWork({ projectId, baseRevision: rev(), idempotencyKey: "first-stage", logicalWorkId: workId,
      work: { ...work, source: work.source.replace("初稿", "第一场") }, readyRanges: [{ startFrame: 0, endFrame: 24 }],
      inputBundle: { bundlePath: "fixture", bundleSha256: "fixture", manifestSha256: "fixture", source: { project: "isolated-od", run_id: "first-run", frozen_version: "v1" } } });
    const firstVersion = app.completeSourceMotionWork(projectId, firstStage.id);
    app.updateJob(firstJob.id, { status: "succeeded", result: { authoring: { status: "succeeded" } } });
    await assert.rejects(start("second-no-run", second.id, secondTreatment.id, 24, 48), (error: any) => error.issues?.some((issue: { code: string }) => issue.code === "MOTION_AUTHORING_CONTINUATION_INVALID"));
    await assert.rejects(start("second-wrong-project", second.id, secondTreatment.id, 24, 48, "first-run", "another-project"), (error: any) => error.issues?.some((issue: { code: string }) => issue.code === "MOTION_AUTHORING_CONTINUATION_INVALID"));
    const secondJob = await start("second", second.id, secondTreatment.id, 24, 48, "first-run");
    assert.deepEqual(secondJob.payload.continuationAuthor, { project: "isolated-od", run_id: "first-run", frozen_version: "v1" });
    assert.equal(secondJob.payload.logicalWorkId, workId);
    const secondStage = app.registerMotionWork({ projectId, baseRevision: rev(), idempotencyKey: "second-stage", logicalWorkId: workId,
      work: { ...work, source: work.source.replace("初稿", "第二场") }, readyRanges: [{ startFrame: 24, endFrame: 48 }] });
    const secondVersion = app.completeSourceMotionWork(projectId, secondStage.id);
    assert.equal(firstVersion.id, workId); assert.equal(secondVersion.id, workId);
    assert.notEqual(firstVersion.definitionHash, secondVersion.definitionHash);
    assert.equal(app.readProject(projectId).snapshot.motionWorks?.length, 1);
    assert.equal(app.readSourceMotionWork(projectId, workId, undefined, firstVersion.definitionHash).work.definitionHash, firstVersion.definitionHash);
  } finally { app.close(); await rm(root, { recursive: true, force: true }); }
});

test("无整片制作记录的局部返修继续原作品及作者，并固定旧版本", async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-local-continuation-")), app = createApplication(root);
  try {
    const projectId = app.createProject({ name: "局部返修隔离验证" }).snapshot.project.id;
    const rev = () => app.readProject(projectId).revision.number;
    app.repository.commit(projectId, rev(), "隔离画布", snapshot => Object.assign(snapshot.timeline, { width: 320, height: 320, fps: 30 }));
    const scene = app.createScene({ projectId, baseRevision: rev(), type: "ExplainerScene", title: "局部返修", purpose: "继续原作品", startFrame: 0, endFrame: 18 }).snapshot.scenes[0];
    const source = { project: "isolated-od", run_id: "original-run", frozen_version: "v1" };
    const initialJob = app.registerMotionWork({ projectId, baseRevision: rev(), idempotencyKey: "initial", work: motionFixture,
      inputBundle: { bundlePath: "fixture", bundleSha256: "fixture", manifestSha256: "fixture", source } });
    const initial = app.completeSourceMotionWork(projectId, initialJob.id);
    const cue = app.createEffectCue({ projectId, baseRevision: rev(), sceneId: scene.id, type: "ManagedMotion", layer: "fullscreen",
      startFrame: 0, endFrame: 18, sourceStartFrame: 0, sourceEndFrame: 18, workId: initial.id }).snapshot.effectCues[0];
    const start = (key: string, project = source.project, continueRun?: string) => app.startMotionAuthoring({ projectId, baseRevision: rev(),
      intent: "local_edit", idempotencyKey: key, target: { action: "replace_cue", cueId: cue.id, audioPolicy: "rebind_unchanged_events" },
      openDesignRequest: { project, prompt: "继续原作者的局部返修", ...(continueRun ? { continue_from_run_id: continueRun } : {}) } });
    await assert.rejects(start("missing-run"), (error: any) => error.issues?.some((issue: { code: string }) => issue.code === "MOTION_AUTHORING_CONTINUATION_INVALID"));
    await assert.rejects(start("wrong-project", "another-project", source.run_id), (error: any) => error.issues?.some((issue: { code: string }) => issue.code === "MOTION_AUTHORING_CONTINUATION_INVALID"));
    const job = await start("local", source.project, source.run_id);
    assert.equal(job.payload.logicalWorkId, initial.id);
    assert.deepEqual(job.payload.continuationAuthor, source);
    await assert.rejects(start("busy", source.project, source.run_id), (error: any) => error.issues?.some((issue: { code: string }) => issue.code === "MOTION_AUTHORING_WORK_BUSY"));
    const stage = app.registerMotionWork({ projectId, baseRevision: rev(), idempotencyKey: "local-stage", logicalWorkId: String(job.payload.logicalWorkId),
      work: { ...motionFixture, source: motionFixture.source.replace("重点", "新重点") },
      inputBundle: { bundlePath: "fixture", bundleSha256: "fixture", manifestSha256: "fixture", source: { ...source, frozen_version: "v2" } } });
    const revised = app.completeSourceMotionWork(projectId, stage.id);
    assert.equal(revised.id, initial.id);
    assert.notEqual(revised.definitionHash, initial.definitionHash);
    const state = app.readProject(projectId).snapshot;
    assert.equal(state.motionWorks?.length, 1);
    assert.equal(state.effectCues[0].workDefinitionHash, initial.definitionHash, "未重新采用的旧片段继续引用旧版本");
    assert.equal(app.readSourceMotionWork(projectId, initial.id, undefined, initial.definitionHash).work.definitionHash, initial.definitionHash);
    app.updateJob(job.id, { status: "succeeded", result: { authoring: { status: "succeeded" } } });
    const partial = await app.startMotionAuthoring({ projectId, baseRevision: rev(), intent: "local_edit", idempotencyKey: "local-range",
      target: { action: "replace_range", cueId: cue.id, targetRange: { startFrame: 4, endFrame: 12 }, audioPolicy: "rebind_unchanged_events" },
      openDesignRequest: { project: source.project, prompt: "继续原版本的局部范围", continue_from_run_id: source.run_id } });
    assert.equal(partial.payload.logicalWorkId, initial.id);
    assert.deepEqual(partial.payload.continuationAuthor, source, "应续接目标 Cue 所采用的版本，而非其他片段的最新版本");
  } finally { app.close(); await rm(root, { recursive: true, force: true }); }
});
