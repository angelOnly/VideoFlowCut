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
      visualPlan: { referenceMappings: [{ referenceId: "reference", referenceKind: "creative", targetRole: "主体", treatment: "结合实际素材" }] } }] });
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
      assignmentId: "original", inputRevision: f.revision(), objectIds: [f.scene.id], researchOutcome: "researched", decision: "旧负责人迟到结果", rationale: "保留供接任者判断" });
    const report = await f.app.readSkillExecutionReport({ projectId: f.projectId, runId: f.run.id });
    const issues = await evaluateProductionCoordination({ report, snapshot: f.app.readProject(f.projectId).snapshot, scope: { kind: "project" },
      readRevision: revision => f.app.readProject(f.projectId, revision).snapshot });
    assert.ok(issues.some(issue => issue.code === "RESEARCH_PENDING" && issue.assignmentId === "new-creative"));
    assert.ok(!issues.some(issue => issue.code === "ASSIGNMENT_MISSING" && issue.message.includes("视觉设计")));
    const late = lateReport.creativeDecisions.at(-1)!;
    const motionReport = await f.app.recordCreativeDecision({ projectId: f.projectId, runId: f.run.id, operationId: "motion-result", category: "visual",
      phase: "motion_research", assignmentId: "original", inputRevision: f.revision(), objectIds: [f.scene.id], researchOutcome: "researched", decision: "机制研究", rationale: "测试接替链" });
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
      decision: "研究已回传", rationale: "记录实际参考与比较" });
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
