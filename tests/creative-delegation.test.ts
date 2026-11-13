import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { getDefaultEnvironment, StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { createApplication } from "@videocut/application";
import { createServer } from "../apps/server/src/app.js";
import { evaluateProductionCoordination } from "../packages/edit-application/src/production-coordination.js";
import { motionFixture } from "./fixtures/managed-motion.js";
import { motionHtml } from "./fixtures/hyperframes.js";

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "videocut-coordination-"));
  const app = createApplication(root);
  const projectId = app.createProject({ name: "协作链隔离测试" }).snapshot.project.id;
  const scene = app.createScene({ projectId, baseRevision: 1, type: "ExplainerScene", title: "场面", purpose: "验证交接", startFrame: 0, endFrame: 24 }).snapshot.scenes[0];
  const bytes = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+nmZkAAAAASUVORK5CYII=", "base64");
  const sourceDirectory = join(app.getProjectRoot(projectId), "assets", "source");
  await mkdir(sourceDirectory, { recursive: true });
  await writeFile(join(sourceDirectory, "fixture.png"), bytes);
  const imported = app.registerImportedAsset({ projectId, baseRevision: app.readProject(projectId).revision.number, name: "fixture.png", kind: "image",
    managedPath: "assets/source/fixture.png", sourceHash: createHash("sha256").update(bytes).digest("hex") });
  app.applyMediaAnalysis({ projectId, assetId: imported.asset.id, metadata: { durationMs: 1000, width: 1, height: 1, hasAudio: false } });
  app.repository.commit(projectId, app.readProject(projectId).revision.number, "建立观察范围", snapshot => {
    snapshot.timeline.items.push({ id: "fixture-item", trackId: snapshot.timeline.tracks.find(track => track.kind === "video")!.id, sceneId: scene.id,
      assetId: imported.asset.id, startFrame: 0, endFrame: 24, sourceStartFrame: 0, sourceEndFrame: 24, disabled: false });
  });
  const revision = () => app.readProject(projectId).revision.number;
  const start = { projectId, baseRevision: revision(), intent: "full_creation" as const, completionScope: { kind: "project" as const }, operationId: "start", loadedSkills: ["production-coordinator"] };
  const run = await app.startProductionRun(start);
  return { root, app, projectId, scene, assetId: imported.asset.id, revision, run, start, close: async () => { app.close(); await rm(root, { recursive: true, force: true }); } };
}

test("正式制作通过真实 MCP 检查当前范围的研究、采用与预排", { timeout: 60_000 }, async () => {
  const f = await fixture();
  const transport = new StdioClientTransport({ command: process.execPath, args: ["--import", "tsx", "apps/server/src/mcp.ts"],
    cwd: process.cwd(), env: { ...getDefaultEnvironment(), VIDEOCUT_WORKSPACE: f.root }, stderr: "pipe" });
  const client = new Client({ name: "authoring-admission-test", version: "1.0.0" });
  const parse = <T>(response: { isError?: boolean; content: Array<{ type: string; text?: string }> }): T => {
    assert.notEqual(response.isError, true, JSON.stringify(response.content));
    return JSON.parse(response.content.find(item => item.type === "text")!.text!) as T;
  };
  try {
    f.app.repository.commit(f.projectId, f.revision(), "隔离画布", snapshot => Object.assign(snapshot.timeline, { width: 320, height: 320, fps: 30 }));
    const beats = f.app.updateStory({ projectId: f.projectId, baseRevision: f.revision(), beats: [
      { title: "当前内容", purpose: "当前制作范围" }, { title: "其他内容", purpose: "同场但无关的范围" }
    ] }).snapshot.story.beats;
    f.app.repository.commit(f.projectId, f.revision(), "关联同一场的不同内容", snapshot => {
      snapshot.scenes.find(scene => scene.id === f.scene.id)!.narrativeBeatIds = beats.map(beat => beat.id);
      for (const beat of snapshot.story.beats) beat.sceneIds = [f.scene.id];
    });
    f.app.createScene({ projectId: f.projectId, baseRevision: f.revision(), type: "ExplainerScene", title: "尚未就绪的另一场", purpose: "不阻塞当前场面", startFrame: 24, endFrame: 48 });
    const source = motionHtml('<img data-vfc-image-slot="subject" style="width:32px;height:32px">', "", { durationInFrames: 24 });
    const previewJob = f.app.registerMotionWork({ projectId: f.projectId, baseRevision: f.revision(), idempotencyKey: "preview",
      work: { ...motionFixture, source, durationInFrames: 24, imageBindings: { subject: f.assetId } } });
    const work = f.app.completeSourceMotionWork(f.projectId, previewJob.id);
    const brief = join(f.root, "brief.md"), timing = join(f.root, "timing.md");
    await writeFile(brief, "当前场面的完整视觉方案"); await writeFile(timing, "实际时间安排");
    await client.connect(transport);
    const handoff = parse<{ manifestPath: string; manifestSha256: string; scenes: Array<{ status: string; diagnostics?: string[] }> }>(await client.callTool({
      name: "prepare_motion_handoff", arguments: { project_id: f.projectId, base_revision_id: f.revision(), brief_path: brief, timing_plan_path: timing,
        selected_scene_ids: [f.scene.id], assets: [{ id: f.assetId, purpose: "真实主体" }], scenes: [{ sceneId: f.scene.id, status: "ready",
          visualRoles: [{ role: "主体", referenceFunction: "连续组织", assetIds: [f.assetId], usage: "呈现真实主体" }],
          process: "主体建立、变化并接续", preserve: ["主体关系"], adapt: ["排版"],
          visualPlan: { status: "previewed", primaryRoles: ["主体"], preview: { workId: work.id, startFrame: 0, endFrame: 24 } } }] }
    }) as never);
    assert.equal(handoff.scenes[0].status, "ready", JSON.stringify(handoff.scenes[0].diagnostics));
    const deliveryRef = { manifestPath: handoff.manifestPath, manifestSha256: handoff.manifestSha256, sceneIds: [f.scene.id] };
    await f.app.updateProductionRun({ projectId: f.projectId, runId: f.run.id, expectedAuditVersion: f.run.auditVersion,
      operationId: "assign-all", action: "add_assignment", assignment: { assignmentId: "all", agentId: "/fixture/authors",
        responsibilities: ["director", "creative_research", "visual_design", "motion_research"],
        skillIds: ["production-director", "creative-sequence-design", "visual-treatment-planning", "motion-case-library"],
        scope: { kind: "project" }, inputRevision: f.revision() } });
    const record = async (phase: "creative_research" | "motion_research" | "visual_design" | "adoption", options: {
      inputDecisionIds?: string[]; researchOutcome?: "pending" | "researched" | "not_applicable"; evidence?: string[]; delivery?: boolean;
      researchReferences?: Array<{ kind: "creative" | "motion"; id: string; sourceSha256: string }> } = {}) =>
      (await f.app.recordCreativeDecision({ projectId: f.projectId, runId: f.run.id, operationId: randomUUID(), category: "visual",
        phase, assignmentId: "all", inputRevision: f.revision(), objectIds: [f.scene.id], decision: phase, rationale: "按当前场面和实际研究判断",
        inputDecisionIds: options.inputDecisionIds, researchOutcome: options.researchOutcome, researchReferences: options.researchReferences, evidence: options.evidence,
        ...(options.delivery ? { deliveryRef } : {}) })).creativeDecisions.at(-1)!;
    await record("creative_research", { researchOutcome: "not_applicable" });
    const motion = await record("motion_research", { researchOutcome: "not_applicable", evidence: ["研究过相关机制，当前素材运动无需借用"] });
    const initialDesign = await record("visual_design");
    const initialAdoption = await record("adoption", { inputDecisionIds: [initialDesign.id], delivery: true });
    const updateTreatment = (decisionId: string, visualTreatmentId?: string) => f.app.manageVisualTreatment({ projectId: f.projectId, baseRevision: f.revision(),
      action: "upsert", visualTreatmentId, sceneId: f.scene.id, narrativeBeatId: beats[0]!.id, mode: "b_roll", intensity: "medium", primaryAttention: "主体", narrativePurpose: "解释",
      adoptedMaterialAssetIds: [f.assetId], adoptedDecisionRef: { productionRunId: f.run.id, decisionId } }).snapshot.visualTreatments[0];
    const treatment = updateTreatment(initialAdoption.id);
    const target = { action: "create_cue", sceneId: f.scene.id, layer: "fullscreen", startFrame: 0, endFrame: 24,
      sourceStartFrame: 0, sourceEndFrame: 24, coveredNarrativeBeatIds: [beats[0]!.id] as string[] | undefined, audioPolicy: "rebind_unchanged_events" };
    const start = (key: string, requestedTarget = target) => client.callTool({ name: "start_motion_authoring", arguments: { project_id: f.projectId, base_revision_id: f.revision(),
      production_run_id: f.run.id, visual_treatment_ids: [treatment.id], target: requestedTarget, idempotency_key: key,
      opendesign_request: { project: "isolated-od", prompt: "沿用已采用的完整视觉方案" } } });
    const pending = await start("pending");
    assert.equal(pending.isError, true);
    const pendingError = JSON.parse((pending.content as Array<{ text: string }>)[0].text);
    assert.ok(pendingError.issues.some((issue: { code: string }) => issue.code === "NARRATION_ASSIGNMENT_MISSING"));
    assert.ok(pendingError.issues.some((issue: { code: string }) => issue.code === "RESEARCH_PENDING"));
    assert.ok(pendingError.issues.some((issue: { code: string }) => issue.code === "RESEARCH_NOT_CONSUMED"));
    assert.equal(pendingError.sideEffects, "none");
    assert.equal(f.app.repository.listJobs(f.projectId).filter(job => job.kind === "motion_authoring").length, 0);

    const latestReport = await f.app.readSkillExecutionReport({ projectId: f.projectId, runId: f.run.id });
    parse(await client.callTool({ name: "update_production_run", arguments: { project_id: f.projectId, run_id: f.run.id,
      expected_audit_version: latestReport.auditVersion, operation_id: "assign-narration-and-assets", action: "add_assignment",
      assignment: { assignment_id: "narration-and-assets", agent_id: "/fixture/narration", responsibilities: ["narration", "asset_sourcing"],
        skill_ids: ["narration-writing", "visual-asset-sourcing"], scope: { kind: "project" }, input_revision: f.revision() } } }) as never);

    const untraceable = await record("creative_research", { researchOutcome: "researched" });
    const untraceableDesign = await record("visual_design", { inputDecisionIds: [untraceable.id, motion.id] });
    const untraceableAdoption = await record("adoption", { inputDecisionIds: [untraceableDesign.id], delivery: true });
    updateTreatment(untraceableAdoption.id, treatment.id);
    const withoutSource = await start("research-without-source");
    assert.equal(withoutSource.isError, true);
    assert.ok(JSON.parse((withoutSource.content as Array<{ text: string }>)[0].text).issues.some((issue: { code: string }) =>
      issue.code === "RESEARCH_PENDING" || issue.code === "RESEARCH_INPUT_PENDING"));
    assert.equal(f.app.repository.listJobs(f.projectId).filter(job => job.kind === "motion_authoring").length, 0);

    const creative = await record("creative_research", { researchOutcome: "not_applicable", evidence: ["已研究相关原片，当前场面没有适用关系"],
      researchReferences: [{ kind: "creative", id: "studied-but-not-used", sourceSha256: "a".repeat(64) }] });
    const design = await record("visual_design", { inputDecisionIds: [creative.id, motion.id] });
    const missingDesign = await record("adoption", { delivery: true });
    updateTreatment(missingDesign.id, treatment.id);
    const missing = await start("missing-design");
    assert.equal(missing.isError, true);
    assert.ok(JSON.parse((missing.content as Array<{ text: string }>)[0].text).issues.some((issue: { code: string }) => issue.code === "VISUAL_INPUT_MISSING"));

    const adopted = await record("adoption", { inputDecisionIds: [design.id], delivery: true });
    updateTreatment(adopted.id, treatment.id);
    f.app.repository.commit(f.projectId, f.revision(), "修改当前内容", snapshot => { snapshot.story.beats.find(beat => beat.id === beats[0]!.id)!.title = "当前内容已变"; });
    const changedTarget = await start("changed-target");
    assert.equal(changedTarget.isError, true);
    assert.ok(JSON.parse((changedTarget.content as Array<{ text: string }>)[0].text).issues.some((issue: { code: string }) => issue.code === "VISUAL_INPUT_STALE"));
    f.app.repository.commit(f.projectId, f.revision(), "恢复当前内容并修改其他内容", snapshot => {
      snapshot.story.beats.find(beat => beat.id === beats[0]!.id)!.title = beats[0]!.title;
      snapshot.story.beats.find(beat => beat.id === beats[1]!.id)!.title = "其他内容已变";
    });
    const outside = await start("outside-preview", { ...target, sourceStartFrame: 1, sourceEndFrame: 25 });
    assert.equal(outside.isError, true);
    assert.ok(JSON.parse((outside.content as Array<{ text: string }>)[0].text).issues.some((issue: { code: string }) => issue.code === "MOTION_AUTHORING_PREVIEW_INVALID"));
    const created = parse<{ jobId: string }>(await start("ready") as never);
    assert.ok(created.jobId);
    assert.equal(parse<{ jobId: string }>(await start("ready") as never).jobId, created.jobId);
    assert.equal(f.app.repository.listJobs(f.projectId).filter(job => job.kind === "motion_authoring").length, 1);
    const busy = await start("other-key");
    assert.equal(busy.isError, true);
    assert.ok(JSON.parse((busy.content as Array<{ text: string }>)[0].text).issues.some((issue: { code: string }) => issue.code === "MOTION_AUTHORING_WORK_BUSY"));
    const previewPath = join(f.app.getProjectRoot(f.projectId), work.definitionPath), originalPreview = await readFile(previewPath);
    await writeFile(previewPath, "已变化的预排源码");
    const stale = await start("stale-preview");
    assert.equal(stale.isError, true);
    assert.ok(JSON.parse((stale.content as Array<{ text: string }>)[0].text).issues.some((issue: { code: string }) => issue.code === "MOTION_AUTHORING_PREVIEW_INVALID"));
    assert.equal(parse<{ jobId: string }>(await start("ready") as never).jobId, created.jobId, "同一幂等请求应读回原 Job");
    assert.equal(f.app.repository.listJobs(f.projectId).filter(job => job.kind === "motion_authoring").length, 1);
    await writeFile(previewPath, originalPreview);
    f.app.updateJob(created.jobId, { status: "succeeded", result: { authoring: { status: "succeeded" } } });
    const inferred = parse<{ jobId: string }>(await start("infer-treatment-beat", { ...target, coveredNarrativeBeatIds: undefined }) as never);
    assert.ok(inferred.jobId, "未显式指定 Beat 时，沿已选视觉计划确定当前内容范围");
  } finally { await client.close(); await f.close(); }
});

test("分派、结果和真实输入版本可回读，同一请求安全重试", async () => {
  const f = await fixture();
  try {
    const originalRevision = f.revision();
    assert.equal((await f.app.startProductionRun(f.start)).id, f.run.id);
    const assignment = { assignmentId: "author", agentId: "/fixture/author", responsibilities: ["creative_research", "visual_design", "motion_research", "director"] as const,
      skillIds: ["creative-sequence-design", "visual-treatment-planning"], scope: { kind: "project" as const }, inputRevision: f.revision() };
    const update = { projectId: f.projectId, runId: f.run.id, expectedAuditVersion: f.run.auditVersion, operationId: "assign", action: "add_assignment" as const,
      assignment: { ...assignment, responsibilities: [...assignment.responsibilities] } };
    const assigned = await f.app.updateProductionRun(update);
    assert.deepEqual(await f.app.updateProductionRun(update), assigned);
    await assert.rejects(() => f.app.updateProductionRun({ ...update, assignment: { ...update.assignment, agentId: "/other" } }), { code: "PRODUCTION_OPERATION_CONFLICT" });
    const result = { projectId: f.projectId, runId: f.run.id, operationId: "research", category: "visual" as const,
      phase: "creative_research" as const, assignmentId: "author", inputRevision: f.revision(), objectIds: [f.projectId],
      researchOutcome: "researched" as const, decision: "研究完整场面", rationale: "记录候选与采用依据", evidence: ["fixture-reference"] };
    const recorded = await f.app.recordCreativeDecision(result);
    assert.deepEqual(await f.app.recordCreativeDecision(result), JSON.parse(JSON.stringify(recorded)));
    assert.equal(recorded.creativeDecisions.length, 1);
    assert.equal(recorded.creativeDecisions[0].inputRevision, f.revision());
    assert.equal(recorded.creativeDecisions[0].assignmentId, "author");
    assert.equal(f.revision(), originalRevision);
  } finally { await f.close(); }
});

test("视觉采用必须追溯已接回研究，研究后未采用参考可以成立", async () => {
  const f = await fixture();
  try {
    const update = await f.app.updateProductionRun({ projectId: f.projectId, runId: f.run.id, expectedAuditVersion: f.run.auditVersion,
      operationId: "assign", action: "add_assignment", assignment: { assignmentId: "author", agentId: "/fixture/author",
        responsibilities: ["director", "creative_research", "visual_design", "motion_research"], skillIds: ["visual-treatment-planning"],
        scope: { kind: "project" }, inputRevision: f.revision() } });
    const evaluate = async () => evaluateProductionCoordination({ report: await f.app.readSkillExecutionReport({ projectId: f.projectId, runId: f.run.id }),
      snapshot: f.app.readProject(f.projectId).snapshot, scope: { kind: "project" },
      review: await f.app.readEditorialQualityReview({ projectId: f.projectId, revision: f.revision() }), readRevision: revision => f.app.readProject(f.projectId, revision).snapshot });
    assert.ok((await evaluate()).some(issue => issue.code === "RESEARCH_PENDING"));
    const record = async (phase: "creative_research" | "motion_research" | "visual_design" | "adoption", inputDecisionIds: string[] = [], deliveryRef?: { manifestPath: string; manifestSha256: string; sceneIds: string[] }) => {
      const report = await f.app.recordCreativeDecision({ projectId: f.projectId, runId: f.run.id, operationId: randomUUID(), category: "visual",
        phase, assignmentId: "author", inputRevision: f.revision(), objectIds: [f.scene.id], inputDecisionIds,
        ...(phase.endsWith("research") ? { researchOutcome: "researched" as const } : {}),
        ...(phase === "creative_research" ? { researchReferences: [{ kind: "creative" as const, id: "reference", sourceSha256: "a".repeat(64) }] } : {}),
        ...(phase === "motion_research" ? { researchReferences: [{ kind: "motion" as const, id: "mechanism", sourceSha256: "b".repeat(64) }] } : {}),
        decision: phase, rationale: "核对范围与资料", deliveryRef });
      return report.creativeDecisions.at(-1)!;
    };
    const creative = await record("creative_research");
    const motion = await record("motion_research");
    const initialDesign = await record("visual_design");
    const manifestPath = join(f.root, "manifest.json");
    const manifest = JSON.stringify({ projectId: f.projectId, selectedSceneIds: [f.scene.id], scenes: [{ sceneId: f.scene.id, references: [] }] });
    await writeFile(manifestPath, manifest);
    const delivery = { manifestPath, manifestSha256: createHash("sha256").update(manifest).digest("hex"), sceneIds: [f.scene.id] };
    const first = await record("adoption", [initialDesign.id], delivery);
    const treatment = f.app.manageVisualTreatment({ projectId: f.projectId, baseRevision: f.revision(), action: "upsert", sceneId: f.scene.id,
      mode: "b_roll", intensity: "medium", primaryAttention: "主体", narrativePurpose: "说明", adoptedMaterialAssetIds: [f.assetId], adoptedDecisionRef: { productionRunId: f.run.id, decisionId: first.id } }).snapshot.visualTreatments[0];
    assert.ok((await evaluate()).some(issue => issue.code === "RESEARCH_NOT_CONSUMED"));
    const revised = await record("visual_design", [creative.id, motion.id]);
    const adopted = await record("adoption", [revised.id], delivery);
    f.app.manageVisualTreatment({ projectId: f.projectId, baseRevision: f.revision(), action: "upsert", visualTreatmentId: treatment.id, sceneId: f.scene.id,
      mode: "b_roll", intensity: "medium", primaryAttention: "主体", narrativePurpose: "说明", adoptedMaterialAssetIds: [f.assetId], adoptedDecisionRef: { productionRunId: f.run.id, decisionId: adopted.id } });
    assert.deepEqual(await evaluate(), []);
    const incompleteReference = JSON.stringify({ projectId: f.projectId, selectedSceneIds: [f.scene.id], scenes: [{ sceneId: f.scene.id,
      references: [{ kind: "creative", id: "unseen", sourceSha256: "b".repeat(64) }] }] });
    await writeFile(manifestPath, incompleteReference);
    const incompleteAdoption = await record("adoption", [revised.id], { ...delivery, manifestSha256: createHash("sha256").update(incompleteReference).digest("hex") });
    f.app.manageVisualTreatment({ projectId: f.projectId, baseRevision: f.revision(), action: "upsert", visualTreatmentId: treatment.id, sceneId: f.scene.id,
      mode: "b_roll", intensity: "medium", primaryAttention: "主体", narrativePurpose: "说明", adoptedMaterialAssetIds: [f.assetId], adoptedDecisionRef: { productionRunId: f.run.id, decisionId: incompleteAdoption.id } });
    const missingReference = await evaluate();
    assert.ok(missingReference.some(issue => issue.code === "REFERENCE_MAPPING_MISSING"));
    assert.ok(missingReference.some(issue => issue.code === "REFERENCE_RESEARCH_UNLINKED"));
    const withReference = JSON.stringify({ projectId: f.projectId, selectedSceneIds: [f.scene.id], scenes: [{ sceneId: f.scene.id,
      references: [{ kind: "creative", id: "reference", sourceSha256: "a".repeat(64) }],
      visualRoles: [{ role: "主体" }],
      visualPlan: { referenceMappings: [{ referenceId: "reference", referenceKind: "creative", targetRole: "主体", treatment: "结合实际素材", preserveRelation: "保持主体和文字的共同变化" }] } }] });
    await writeFile(manifestPath, withReference);
    const referenceDelivery = { ...delivery, manifestSha256: createHash("sha256").update(withReference).digest("hex") };
    const referenceAdoption = await record("adoption", [revised.id], referenceDelivery);
    f.app.manageVisualTreatment({ projectId: f.projectId, baseRevision: f.revision(), action: "upsert", visualTreatmentId: treatment.id, sceneId: f.scene.id,
      mode: "b_roll", intensity: "medium", primaryAttention: "主体", narrativePurpose: "说明", adoptedMaterialAssetIds: [f.assetId], adoptedDecisionRef: { productionRunId: f.run.id, decisionId: referenceAdoption.id } });
    assert.ok((await evaluate()).some(issue => issue.code === "REFERENCE_REVIEW_PENDING"));
    await f.app.recordEditorialQualityReview({ projectId: f.projectId, runId: f.run.id, revision: f.revision(), operationId: "reference-review",
      passes: ["mute_visual"], previewEvidence: [], findings: [], observations: [{ source: "workbench", observer: "测试作者", pass: "mute_visual", method: "continuous_video",
        startFrame: 0, endFrame: 24, observation: "测试声明：已对照", adoptionRefs: [{ productionRunId: f.run.id, decisionId: referenceAdoption.id }] }] });
    assert.deepEqual(await evaluate(), []);
    const beforeReplacement = await f.app.readSkillExecutionReport({ projectId: f.projectId, runId: f.run.id });
    await f.app.updateProductionRun({ projectId: f.projectId, runId: f.run.id, expectedAuditVersion: beforeReplacement.auditVersion, operationId: "replace-creative",
      action: "replace_assignment", assignment: { assignmentId: "new-creative", agentId: "/fixture/new-creative", responsibilities: ["creative_research"],
        skillIds: ["creative-sequence-design"], scope: { kind: "objects", objectIds: [f.scene.id] }, inputRevision: f.revision(), supersedesAssignmentId: "author" } });
    assert.deepEqual(await evaluate(), [], "已采用的旧结果在负责人接替前已经成立");
    await record("creative_research");
    f.app.updateStory({ projectId: f.projectId, baseRevision: f.revision(), title: "不影响场面的更新" });
    assert.deepEqual(await evaluate(), [], "新候选及无关变更不替换当前采用链");
    f.app.repository.commit(f.projectId, f.revision(), "调整场面内容", snapshot => { snapshot.scenes.find(scene => scene.id === f.scene.id)!.purpose = "变化后的内容"; });
    assert.ok((await evaluate()).some(issue => issue.code === "VISUAL_INPUT_STALE"));
    assert.equal(update.assignments.length, 1);
  } finally { await f.close(); }
});

test("兼任分派只接替指定职责和范围，迟到研究需要当前负责人确认", async () => {
  const f = await fixture();
  try {
    const assigned = await f.app.updateProductionRun({ projectId: f.projectId, runId: f.run.id, expectedAuditVersion: f.run.auditVersion,
      operationId: "assign-all", action: "add_assignment", assignment: { assignmentId: "original", agentId: "/fixture/original",
        responsibilities: ["creative_research", "visual_design", "motion_research", "director"], skillIds: ["visual-treatment-planning"],
        scope: { kind: "project" }, inputRevision: f.revision() } });
    await f.app.updateProductionRun({ projectId: f.projectId, runId: f.run.id, expectedAuditVersion: assigned.auditVersion,
      operationId: "replace-one", action: "replace_assignment", assignment: { assignmentId: "new-creative", agentId: "/fixture/new",
        responsibilities: ["creative_research"], skillIds: ["creative-sequence-design"], scope: { kind: "objects", objectIds: [f.scene.id] },
        inputRevision: f.revision(), supersedesAssignmentId: "original" } });
    const lateReport = await f.app.recordCreativeDecision({ projectId: f.projectId, runId: f.run.id, operationId: "late-result", category: "visual", phase: "creative_research",
      assignmentId: "original", inputRevision: f.revision(), objectIds: [f.scene.id], researchOutcome: "researched",
      researchReferences: [{ kind: "creative", id: "late-reference", sourceSha256: "a".repeat(64) }], decision: "旧负责人迟到结果", rationale: "保留供接任者判断" });
    const report = await f.app.readSkillExecutionReport({ projectId: f.projectId, runId: f.run.id });
    const issues = await evaluateProductionCoordination({ report, snapshot: f.app.readProject(f.projectId).snapshot, scope: { kind: "project" },
      readRevision: revision => f.app.readProject(f.projectId, revision).snapshot });
    assert.ok(issues.some(issue => issue.code === "RESEARCH_PENDING" && issue.assignmentId === "new-creative"));
    assert.ok(!issues.some(issue => issue.code === "ASSIGNMENT_MISSING" && issue.message.includes("视觉设计")));
    const late = lateReport.creativeDecisions.at(-1)!;
    const motionReport = await f.app.recordCreativeDecision({ projectId: f.projectId, runId: f.run.id, operationId: "motion-result", category: "visual",
      phase: "motion_research", assignmentId: "original", inputRevision: f.revision(), objectIds: [f.scene.id], researchOutcome: "researched",
      researchReferences: [{ kind: "motion", id: "mechanism", sourceSha256: "b".repeat(64) }], decision: "机制研究", rationale: "测试接替链" });
    const designReport = await f.app.recordCreativeDecision({ projectId: f.projectId, runId: f.run.id, operationId: "design-result", category: "visual",
      phase: "visual_design", assignmentId: "original", inputRevision: f.revision(), objectIds: [f.scene.id], inputDecisionIds: [late.id, motionReport.creativeDecisions.at(-1)!.id], decision: "视觉设计", rationale: "测试接替链" });
    const manifestPath = join(f.root, "replacement-manifest.json");
    const manifest = JSON.stringify({ projectId: f.projectId, selectedSceneIds: [f.scene.id], scenes: [{ sceneId: f.scene.id, references: [] }] });
    await writeFile(manifestPath, manifest);
    const adoptionReport = await f.app.recordCreativeDecision({ projectId: f.projectId, runId: f.run.id, operationId: "adopt-late", category: "visual",
      phase: "adoption", assignmentId: "original", inputRevision: f.revision(), objectIds: [f.scene.id], inputDecisionIds: [designReport.creativeDecisions.at(-1)!.id], decision: "采用视觉", rationale: "测试接替链",
      deliveryRef: { manifestPath, manifestSha256: createHash("sha256").update(manifest).digest("hex"), sceneIds: [f.scene.id] } });
    f.app.manageVisualTreatment({ projectId: f.projectId, baseRevision: f.revision(), action: "upsert", sceneId: f.scene.id, mode: "b_roll", intensity: "medium",
      primaryAttention: "主体", narrativePurpose: "说明", adoptedMaterialAssetIds: [f.assetId], adoptedDecisionRef: { productionRunId: f.run.id, decisionId: adoptionReport.creativeDecisions.at(-1)!.id } });
    const beforeSecondReplacement = await f.app.readSkillExecutionReport({ projectId: f.projectId, runId: f.run.id });
    const nextReport = await f.app.updateProductionRun({ projectId: f.projectId, runId: f.run.id, expectedAuditVersion: beforeSecondReplacement.auditVersion,
      operationId: "replace-again", action: "replace_assignment", assignment: { assignmentId: "newer-creative", agentId: "/fixture/newer",
        responsibilities: ["creative_research"], skillIds: ["creative-sequence-design"], scope: { kind: "objects", objectIds: [f.scene.id] },
        inputRevision: f.revision(), supersedesAssignmentId: "new-creative" } });
    const afterSecondReplacement = await evaluateProductionCoordination({ report: nextReport, snapshot: f.app.readProject(f.projectId).snapshot, scope: { kind: "project" },
      readRevision: revision => f.app.readProject(f.projectId, revision).snapshot });
    assert.ok(afterSecondReplacement.some(issue => issue.code === "RESEARCH_INPUT_PENDING" && issue.assignmentId === "newer-creative"), "第二次接替不能追认第一次接替后的迟到结果");
  } finally { await f.close(); }
});

test("同一场面内不同 Beat 的职责独立分派并按目标范围核对", async () => {
  const f = await fixture();
  try {
    const beats = f.app.updateStory({ projectId: f.projectId, baseRevision: f.revision(), beats: [{ title: "第一拍", purpose: "第一范围" }, { title: "第二拍", purpose: "第二范围" }] }).snapshot.story.beats;
    f.app.repository.commit(f.projectId, f.revision(), "关联同一场面的两拍", snapshot => {
      snapshot.scenes.find(scene => scene.id === f.scene.id)!.narrativeBeatIds = beats.map(beat => beat.id);
      for (const beat of snapshot.story.beats) beat.sceneIds = [f.scene.id];
    });
    let report = await f.app.readSkillExecutionReport({ projectId: f.projectId, runId: f.run.id });
    for (const [index, beat] of beats.entries()) {
      report = await f.app.updateProductionRun({ projectId: f.projectId, runId: f.run.id, expectedAuditVersion: report.auditVersion,
        operationId: `assign-beat-${index}`, action: "add_assignment", assignment: { assignmentId: `author-${index}`, agentId: `/fixture/author-${index}`,
          responsibilities: ["creative_research"], skillIds: ["creative-sequence-design"], scope: { kind: "beats", beatIds: [beat.id] }, inputRevision: f.revision() } });
    }
    report = await f.app.recordCreativeDecision({ projectId: f.projectId, runId: f.run.id, operationId: "first-beat-research", category: "visual", phase: "creative_research",
      assignmentId: "author-0", inputRevision: f.revision(), objectIds: [beats[0]!.id], researchOutcome: "researched", decision: "第一拍研究", rationale: "只覆盖第一拍" });
    const issues = await evaluateProductionCoordination({ report, snapshot: f.app.readProject(f.projectId).snapshot, scope: { kind: "beats", beatIds: [beats[1]!.id] },
      readRevision: revision => f.app.readProject(f.projectId, revision).snapshot });
    assert.ok(issues.some(issue => issue.code === "RESEARCH_PENDING" && issue.assignmentId === "author-1"));
    assert.ok(!issues.some(issue => issue.assignmentId === "author-0"));
  } finally { await f.close(); }
});

test("完整任务不能通过局部范围收口", async () => {
  const f = await fixture();
  try {
    await assert.rejects(f.app.completeProductionRun({ projectId: f.projectId, runId: f.run.id, finalRevision: f.revision(), operationId: "wrong-scope",
      completionScope: { kind: "objects", objectIds: [f.scene.id] } }), { code: "PRODUCTION_SCOPE_MISMATCH" });
    assert.equal((await f.app.readSkillExecutionReport({ projectId: f.projectId, runId: f.run.id })).status, "active");
  } finally { await f.close(); }
});

test("仅审阅的制作记录不能用于启动画面制作", async () => {
  const f = await fixture();
  try {
    const review = await f.app.startProductionRun({ projectId: f.projectId, baseRevision: f.revision(), intent: "review_only",
      completionScope: { kind: "frames", startFrame: 0, endFrame: 24 }, operationId: "review-only", loadedSkills: [] });
    await assert.rejects(f.app.startMotionAuthoring({ projectId: f.projectId, baseRevision: f.revision(), productionRunId: review.id,
      idempotencyKey: "review-cannot-author", target: { action: "create_cue", sceneId: f.scene.id, layer: "fullscreen",
        startFrame: 0, endFrame: 24, sourceStartFrame: 0, sourceEndFrame: 24, audioPolicy: "rebind_unchanged_events" },
      openDesignRequest: { project: "isolated-od", prompt: "审阅不应触发制作" } }),
      (error: any) => error.issues?.some((issue: { code: string }) => issue.code === "PRODUCTION_RUN_REVIEW_ONLY"));
    assert.equal(f.app.repository.listJobs(f.projectId).filter(job => job.kind === "motion_authoring").length, 0);
  } finally { await f.close(); }
});

test("真实 MCP 合同可接回研究，HTTP 与 MCP 返回同一待办", async () => {
  const f = await fixture();
  const { app: server, application } = await createServer({ workspaceRoot: f.root });
  const transport = new StdioClientTransport({ command: process.execPath, args: ["--import", "tsx", "apps/server/src/mcp.ts"], cwd: process.cwd(),
    env: { ...getDefaultEnvironment(), VIDEOCUT_WORKSPACE: f.root }, stderr: "pipe" });
  const client = new Client({ name: "production-coordination-contract", version: "1.0.0" });
  const call = async (name: string, args: Record<string, unknown>) => {
    const result = await client.callTool({ name, arguments: args });
    assert.notEqual(result.isError, true, JSON.stringify(result.content));
    const content = result.content as Array<{ type: string; text?: string }>;
    return JSON.parse(content.find(item => item.type === "text")!.text!);
  };
  try {
    await client.connect(transport);
    const run = await call("start_production_run", { project_id: f.projectId, base_revision_id: f.revision(), intent: "full_creation",
      completion_scope: { kind: "project" }, operation_id: "mcp-run", loaded_skills: ["production-coordinator"] });
    await call("update_production_run", { project_id: f.projectId, run_id: run.id, expected_audit_version: run.auditVersion,
      operation_id: "mcp-assign", action: "add_assignment", assignment: { assignment_id: "creative", agent_id: "/fixture/creative",
        responsibilities: ["creative_research"], skill_ids: ["creative-sequence-design"], scope: { kind: "project" }, input_revision: f.revision() } });
    const pendingReport = await call("record_creative_decision", { project_id: f.projectId, run_id: run.id, operation_id: "mcp-research", category: "visual",
      phase: "creative_research", assignment_id: "creative", input_revision: f.revision(), object_ids: [f.projectId], research_outcome: "pending",
      research_references: [{ kind: "creative", id: "016-c01", source_sha256: "a".repeat(64) }], decision: "候选已回传", rationale: "仍需连续观察" });
    await call("update_production_run", { project_id: f.projectId, run_id: run.id, expected_audit_version: pendingReport.auditVersion,
      operation_id: "mcp-visual-assign", action: "add_assignment", assignment: { assignment_id: "visual", agent_id: "/fixture/visual",
        responsibilities: ["visual_design"], skill_ids: ["visual-treatment-planning"], scope: { kind: "project" }, input_revision: f.revision() } });
    await call("record_creative_decision", { project_id: f.projectId, run_id: run.id, operation_id: "mcp-visual", category: "visual", phase: "visual_design",
      assignment_id: "visual", input_revision: f.revision(), object_ids: [f.scene.id], input_decision_ids: [pendingReport.creativeDecisions[0].id],
      decision: "已考虑阶段结果", rationale: "候选仍待核实" });
    f.app.manageVisualTreatment({ projectId: f.projectId, baseRevision: f.revision(), action: "upsert", sceneId: f.scene.id,
      mode: "b_roll", intensity: "medium", primaryAttention: "主体", narrativePurpose: "说明" });
    const revisionAfterTreatment = f.revision();
    const pending = await call("read_production_status", { project_id: f.projectId, run_id: run.id });
    assert.ok(pending.completion.coordinationIssues.some((issue: { code: string; message: string }) => issue.code === "RESEARCH_PENDING" && issue.message.includes("创意研究")));
    assert.ok(pending.completion.coordinationIssues.some((issue: { code: string; message: string }) => issue.code === "RESEARCH_INPUT_PENDING" && issue.message.includes("创意研究")));
    assert.ok(!pending.completion.coordinationIssues.some((issue: { code: string; message: string }) => issue.code === "RESEARCH_NOT_CONSUMED" && issue.message.includes("创意研究")));
    await call("record_creative_decision", { project_id: f.projectId, run_id: run.id, operation_id: "mcp-research-complete", category: "visual",
      phase: "creative_research", assignment_id: "creative", input_revision: f.revision(), object_ids: [f.projectId], research_outcome: "researched",
      research_references: [{ kind: "creative", id: "016-c01", source_sha256: "a".repeat(64) }], decision: "研究已回传", rationale: "记录实际参考与比较" });
    const mcp = await call("read_production_status", { project_id: f.projectId, run_id: run.id });
    const http = await server.inject({ method: "GET", url: `/api/projects/${f.projectId}/production-status?runId=${run.id}` });
    assert.equal(http.statusCode, 200, http.body);
    assert.deepEqual(http.json().completion.coordinationIssues, mcp.completion.coordinationIssues);
    assert.ok(mcp.completion.coordinationIssues.some((issue: { code: string }) => issue.code === "ASSIGNMENT_MISSING"));
    assert.ok(!mcp.completion.coordinationIssues.some((issue: { code: string; message: string }) => issue.code === "RESEARCH_PENDING" && issue.message.includes("创意研究")));
    assert.ok(mcp.completion.coordinationIssues.some((issue: { code: string; message: string }) => issue.code === "RESEARCH_INPUT_PENDING" && issue.message.includes("创意研究")));
    assert.equal(f.revision(), revisionAfterTreatment);
  } finally { await client.close(); await server.close(); application.close(); await f.close(); }
});

test("独立 MCP 与 HTTP 并发读取旧审计时拒绝覆盖，重试后保留两项结果", async () => {
  const f = await fixture();
  const { app: server, application } = await createServer({ workspaceRoot: f.root });
  const transport = new StdioClientTransport({ command: process.execPath, args: ["--import", "tsx", "apps/server/src/mcp.ts"], cwd: process.cwd(),
    env: { ...getDefaultEnvironment(), VIDEOCUT_WORKSPACE: f.root }, stderr: "pipe" });
  const client = new Client({ name: "production-audit-concurrency", version: "1.0.0" });
  try {
    await client.connect(transport);
    let signalRead!: () => void;
    let continueWrite!: () => void;
    const readStarted = new Promise<void>(resolve => { signalRead = resolve; });
    const release = new Promise<void>(resolve => { continueWrite = resolve; });
    const originalRead = application.readSkillExecutionReport.bind(application);
    let firstRead = true;
    application.readSkillExecutionReport = async input => {
      const report = await originalRead(input);
      if (firstRead && input.runId === f.run.id) { firstRead = false; signalRead(); await release; }
      return report;
    };
    const payload = { runId: f.run.id, operationId: "http-review", revision: f.revision(), pass: "mute_visual", method: "frames",
      observer: "测试作者", observation: "测试声明", startFrame: 0, endFrame: 1 };
    const request = () => server.inject({ method: "POST", url: `/api/projects/${f.projectId}/workbench-observations`, payload });
    const pending = request();
    const started = await Promise.race([readStarted.then(() => "started"), pending.then(response => response.body)]);
    assert.equal(started, "started");
    try {
      const mcpResult = await client.callTool({ name: "record_creative_decision", arguments: { project_id: f.projectId, run_id: f.run.id,
        operation_id: "mcp-decision", category: "visual", decision: "独立进程结果", rationale: "并发验证" } });
      assert.notEqual(mcpResult.isError, true);
    } finally { continueWrite(); }
    const conflicted = await pending;
    assert.notEqual(conflicted.statusCode, 200);
    assert.match(conflicted.body, /PRODUCTION_AUDIT_CONFLICT/u);
    const retried = await request();
    assert.equal(retried.statusCode, 200, retried.body);
    const report = await f.app.readSkillExecutionReport({ projectId: f.projectId, runId: f.run.id });
    assert.equal(report.creativeDecisions[0].decision, "独立进程结果");
    assert.equal(report.editorialReview?.evidenceRecords?.length, 1);
    assert.equal(JSON.parse(await readFile(join(f.app.getProjectRoot(f.projectId), "reports", `production-run-${f.run.id}.json`), "utf8")).creativeDecisions.length, 1);
    assert.equal(f.revision(), f.run.baseRevision);
  } finally { await client.close(); await server.close(); application.close(); await f.close(); }
});

test("工作台独立审阅只以实际观察帧范围建立任务，重试不重复记录", async () => {
  const f = await fixture();
  const { app: server, application } = await createServer({ workspaceRoot: f.root });
  try {
    const revision = f.revision();
    const payload = { operationId: "a".repeat(160), revision, pass: "mute_visual", method: "continuous_video",
      observer: "隔离测试", observation: "测试声明：连续观察局部范围", startFrame: 4, endFrame: 12 };
    const request = () => server.inject({ method: "POST", url: `/api/projects/${f.projectId}/workbench-observations`, payload });
    const first = await request();
    assert.equal(first.statusCode, 200, first.body);
    const second = await request();
    assert.equal(second.statusCode, 200, second.body);
    assert.equal(second.json().runId, first.json().runId);
    const another = await server.inject({ method: "POST", url: `/api/projects/${f.projectId}/workbench-observations`,
      payload: { ...payload, runId: first.json().runId, operationId: "another-observation", startFrame: 14, endFrame: 16,
        finding: { category: "motion", severity: "major", summary: "范围外问题", impact: "仅影响其他区间" } } });
    assert.equal(another.statusCode, 200, another.body);
    const afterAnother = await request();
    assert.equal(afterAnother.statusCode, 200, afterAnother.body);
    assert.equal(afterAnother.json().evidenceId, first.json().evidenceId);
    assert.notEqual(afterAnother.json().evidenceId, another.json().evidenceId);
    const run = await f.app.readSkillExecutionReport({ projectId: f.projectId, runId: first.json().runId });
    assert.equal(run.intent, "review_only");
    assert.deepEqual(run.completionScope, { kind: "frames", startFrame: 4, endFrame: 12 });
    assert.equal(run.editorialReview?.evidenceRecords?.length, 2);
    const status = await f.app.readProductionStatus(f.projectId, { runId: run.id });
    assert.deepEqual(status.completion?.completionScope, run.completionScope);
    assert.deepEqual(status.completion?.observationGaps, []);
    assert.deepEqual(status.completion?.validObservations.map(({ startFrame, endFrame }) => ({ startFrame, endFrame })), [{ startFrame: 4, endFrame: 12 }]);
    assert.equal(status.completion?.ready, true, "独立审阅只检查自身范围，不承担范围外问题和导出条件");
    assert.equal((await f.app.completeProductionRun({ projectId: f.projectId, runId: run.id, finalRevision: revision, operationId: "finish-local-review", completionScope: run.completionScope })).status, "completed");
    const confirm = { projectId: f.projectId, runId: run.id, finalRevision: revision, operationId: "confirm-local-review", completionScope: run.completionScope };
    await f.app.completeProductionRun(confirm);
    await f.app.completeProductionRun(confirm);
    await assert.rejects(f.app.completeProductionRun({ ...confirm, qualityReview: ["不同内容"] }), { code: "PRODUCTION_OPERATION_CONFLICT" });
    const still = await server.inject({ method: "POST", url: `/api/projects/${f.projectId}/workbench-observations`,
      payload: { ...payload, operationId: "single-frame-review", method: "frames", startFrame: 18, endFrame: 19 } });
    assert.equal(still.statusCode, 200, still.body);
    const staticStatus = await f.app.readProductionStatus(f.projectId, { runId: still.json().runId });
    assert.equal(staticStatus.completion?.ready, true);
    assert.equal(staticStatus.completion?.validObservations[0]?.method, "frames");
    assert.equal(f.revision(), revision);
  } finally { await server.close(); application.close(); await f.close(); }
});

test("两个采用参考必须分别复核并续接原作者", async () => {
  const f = await fixture();
  try {
    const snapshot = f.app.readProject(f.projectId).snapshot;
    const sourceHashA = "a".repeat(64), sourceHashB = "b".repeat(64);
    const manifest = { projectId: f.projectId, selectedSceneIds: [f.scene.id], scenes: [{ sceneId: f.scene.id,
      references: [{ kind: "creative", id: "ref-a", sourceSha256: sourceHashA, startMs: 100, endMs: 900 },
        { kind: "creative", id: "ref-b", sourceSha256: sourceHashB, startMs: 200, endMs: 800 }],
      visualRoles: [{ role: "素材" }], visualPlan: { referenceMappings: [
        { referenceId: "ref-a", referenceKind: "creative", targetRole: "素材", treatment: "多画框", preserveRelation: "主体接管" },
        { referenceId: "ref-b", referenceKind: "creative", targetRole: "素材", treatment: "画框接续", preserveRelation: "持续运动" }
      ] } }] };
    const manifestBytes = JSON.stringify(manifest);
    const manifestPath = join(f.root, "two-refs.json");
    await writeFile(manifestPath, manifestBytes);
    const deliveryRef = { manifestPath, manifestSha256: createHash("sha256").update(manifestBytes).digest("hex"), sceneIds: [f.scene.id] };
    const assignment = { assignmentId: "creative-owner", agentId: "/fixture/creative", responsibilities: ["director", "creative_research", "visual_design", "motion_research"],
      skillIds: ["creative"], scope: { kind: "project" }, inputRevision: f.revision(), operationId: "assign" } as const;
    const report = structuredClone(f.run);
    report.assignments = [assignment as any];
    const baseDecision = { category: "visual", decision: "测试", rationale: "测试", objectIds: [f.scene.id],
      assignmentId: assignment.assignmentId, inputRevision: f.revision(), evidence: ["测试"], createdAt: new Date().toISOString() };
    report.creativeDecisions = [
      { ...baseDecision, id: "creative", phase: "creative_research", researchOutcome: "researched", researchReferences: [
        { kind: "creative", id: "ref-a", sourceSha256: sourceHashA }, { kind: "creative", id: "ref-b", sourceSha256: sourceHashB }] },
      { ...baseDecision, id: "motion", phase: "motion_research", researchOutcome: "not_applicable" },
      { ...baseDecision, id: "design", phase: "visual_design", inputDecisionIds: ["creative", "motion"] },
      { ...baseDecision, id: "adoption", phase: "adoption", inputDecisionIds: ["design"], deliveryRef }
    ] as any;
    snapshot.visualTreatments.push({ id: "treatment", sceneId: f.scene.id, mode: "b_roll",
      adoptedDecisionRef: { productionRunId: report.id, decisionId: "adoption" } } as any);
    const ref = (referenceId: string, sourceSha256: string, startMs: number, endMs: number) => ({
      productionRunId: report.id, decisionId: "adoption", sceneId: f.scene.id, referenceKind: "creative" as const,
      referenceId, sourceSha256, targetRole: "素材", startMs, endMs
    });
    const evidence = (id: string, reference: ReturnType<typeof ref>) => ({ id, revision: f.revision(), source: "workbench" as const,
      pass: "mute_visual" as const, method: "continuous_video" as const, observer: "测试作者", observation: "实际对照声明",
      startFrame: 0, endFrame: 24, recordedAt: new Date().toISOString(), referenceReviews: [reference] });
    const first = evidence("observation-a", ref("ref-a", sourceHashA, 100, 900));
    const second = evidence("observation-b", ref("ref-b", sourceHashB, 200, 800));
    const review = { revision: f.revision(), passes: ["mute_visual" as const], previewEvidence: [], findings: [], reviewedAt: new Date().toISOString(),
      evidenceRecords: [first], applicableEvidence: [{ evidenceId: first.id, targetRevision: f.revision(), startFrame: 0, endFrame: 24 }] };
    const evaluate = () => evaluateProductionCoordination({ report, snapshot, scope: { kind: "project" }, review, readRevision: () => snapshot, phase: "completion" });
    const initial = (await evaluate()).filter(issue => issue.code === "REFERENCE_REVIEW_PENDING");
    assert.equal(initial.length, 1, JSON.stringify(initial));
    assert.equal(initial[0].referenceReview?.referenceId, "ref-b");
    assert.equal(initial[0].assignmentId, assignment.assignmentId);
    review.evidenceRecords.push(second);
    review.applicableEvidence.push({ evidenceId: second.id, targetRevision: f.revision(), startFrame: 0, endFrame: 24 });
    assert.equal((await evaluate()).filter(issue => issue.code === "REFERENCE_REVIEW_PENDING").length, 0);
  } finally { await f.close(); }
});

test("同场多个视觉计划的相同缺项只产生一次续办", async () => {
  const f = await fixture();
  try {
    f.app.repository.commit(f.projectId, f.revision(), "建立同场视觉计划", snapshot => {
      snapshot.visualTreatments.push(
        { id: "treatment-a", sceneId: f.scene.id, mode: "b_roll" } as any,
        { id: "treatment-b", sceneId: f.scene.id, mode: "b_roll" } as any
      );
    });
    const completionScope = { kind: "project" as const };
    const status = await f.app.readProductionStatus(f.projectId, { runId: f.run.id, completionScope });
    const actions = status.completion!.nextActions!;
    assert.equal(actions.filter(action => action.code === "ADOPTION_PENDING").length, 1);
    const result = await f.app.completeProductionRun({ projectId: f.projectId, runId: f.run.id,
      finalRevision: f.revision(), operationId: "finish-with-pending", completionScope });
    assert.deepEqual(result.evaluation.nextActions, actions);
  } finally { await f.close(); }
});
