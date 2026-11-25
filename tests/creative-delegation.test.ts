import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { getDefaultEnvironment, StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { createApplication } from "@videocut/application";
import { createServer } from "../apps/server/src/app.js";
import { completeResearchCoverage, directorBrief, visualPlan, researchPlan } from "./fixtures/visual-plan.mjs";
import { evaluateProductionCoordination, referenceResearchOwnerAccepted, visualReferenceUnitCoverage } from "../packages/edit-application/src/production-coordination.js";
import { prepareReferencePackage, type ReferenceManifest, type ReferenceScene } from "../packages/edit-application/src/opendesign-reference-package.mjs";
import type { CreativeDecision, ProductionAssignment } from "@videocut/contracts";
import { motionFixture } from "./fixtures/managed-motion.js";
import { motionHtml } from "./fixtures/hyperframes.js";
import { loadCreativeIndex } from "../references/motion-cases/skillry/tools/creative-library.mjs";
import { loadLibraryIndex } from "../references/motion-cases/skillry/tools/library-store.mjs";
import { assignVisualResponsibilities, localProductionRun } from "./fixtures/production-run.js";

const libraryRoot = resolve("references/motion-cases/skillry");
const creativeFingerprint = loadCreativeIndex(libraryRoot).source_sha256;
const motionFingerprint = loadLibraryIndex(libraryRoot).source_sha256;

async function fixture(intent: "full_creation" | "visual_rework" = "full_creation") {
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
  const start = { projectId, baseRevision: revision(), intent, completionScope: { kind: "project" as const }, operationId: "start", loadedSkills: ["production-coordinator"] };
  const run = await app.startProductionRun(start);
  return { root, app, projectId, scene, assetId: imported.asset.id, revision, run, start, close: async () => { app.close(); await rm(root, { recursive: true, force: true }); } };
}

test("完整新制校验技能路由，局部编辑检查三项职责判断", async () => {
  const f = await fixture();
  try {
    const report = structuredClone(f.run);
    const responsibilities = ["director", "narration", "asset_sourcing", "creative_research", "visual_design", "motion_research"];
    const skills = ["production-director", "narration-writing", "visual-asset-sourcing", "creative-sequence-design",
      "visual-treatment-planning", "creative-reference-to-sequence", "motion-case-library"];
    const assignment = { assignmentId: "all", agentId: "/fixture/all", responsibilities, skillIds: skills.map(id => `videoflowcut:${id}`),
      scope: { kind: "project" }, inputRevision: f.revision() };
    report.assignments = [assignment as any];
    const evaluate = () => evaluateProductionCoordination({ report, snapshot: f.app.readProject(f.projectId).snapshot,
      scope: { kind: "project" }, phase: "authoring", readRevision: revision => f.app.readProject(f.projectId, revision).snapshot });
    assert.ok(!(await evaluate()).some(issue => issue.code === "SKILL_ROUTING_MISSING" || issue.code === "ASSET_ASSIGNMENT_MISSING"));
    for (const skill of skills) {
      assignment.skillIds = skills.filter(id => id !== skill);
      assert.ok((await evaluate()).some(issue => issue.code === "SKILL_ROUTING_MISSING" && issue.message.includes(skill)), skill);
    }
    assignment.skillIds = skills;
    report.assignments.push({ ...assignment, assignmentId: "second-visual", responsibilities: ["visual_design"], skillIds: ["visual-treatment-planning"] } as any);
    assert.ok((await evaluate()).some(issue => issue.assignmentId === "second-visual" && issue.code === "SKILL_ROUTING_MISSING"),
      "同一范围内的其他有效分派也要检查");
    report.assignments.pop();
    assignment.responsibilities = responsibilities.filter(item => item !== "asset_sourcing");
    assert.ok((await evaluate()).some(issue => issue.code === "ASSET_ASSIGNMENT_MISSING"));
    report.intent = "local_edit";
    assert.equal((await evaluate()).filter(issue => issue.code === "RESPONSIBILITY_DECISION_PENDING").length, 3);
  } finally { await f.close(); }
});

test("局部帧范围和跨任务沿用只覆盖实际研究范围", async () => {
  const f = await fixture();
  try {
    const createScoped = async (startFrame: number, endFrame: number) => {
      const scope = { kind: "frames" as const, startFrame, endFrame };
      const run = await f.app.startProductionRun({ projectId: f.projectId, baseRevision: f.revision(), intent: "local_edit",
        completionScope: scope, operationId: randomUUID(), loadedSkills: ["production-coordinator"] });
      await f.app.updateProductionRun({ projectId: f.projectId, runId: run.id, expectedAuditVersion: run.auditVersion,
        operationId: randomUUID(), action: "add_assignment", assignment: { assignmentId: "visual", agentId: "/fixture/visual",
          responsibilities: ["creative_research", "motion_research", "visual_design"],
          skillIds: ["creative-sequence-design", "motion-case-library", "visual-treatment-planning", "creative-reference-to-sequence"],
          scope, inputRevision: f.revision() } });
      return run;
    };
    const source = await createScoped(0, 12);
    const input = { projectId: f.projectId, category: "visual" as const, phase: "creative_research" as const,
      assignmentId: "visual", inputRevision: f.revision(), objectIds: [f.scene.id], researchOutcome: "researched" as const,
      decision: "本段素材接续", rationale: "实际查看本段", evidence: ["本段的主体和接点"] };
    const prior = (await f.app.recordCreativeDecision({ ...input, runId: source.id, operationId: randomUUID() })).creativeDecisions.at(-1)!;
    const wider = await createScoped(0, 24);
    await assert.rejects(f.app.recordCreativeDecision({ ...input, runId: wider.id, operationId: randomUUID(),
      reusedDecisionRefs: [{ productionRunId: source.id, decisionId: prior.id }] }), { code: "PRODUCTION_REUSED_DECISION_INVALID" });
    const gapSource = await createScoped(13, 24);
    const gapPrior = (await f.app.recordCreativeDecision({ ...input, runId: gapSource.id, operationId: randomUUID() })).creativeDecisions.at(-1)!;
    await assert.rejects(f.app.recordCreativeDecision({ ...input, runId: wider.id, operationId: randomUUID(), reusedDecisionRefs: [
      { productionRunId: source.id, decisionId: prior.id }, { productionRunId: gapSource.id, decisionId: gapPrior.id }
    ] }), { code: "PRODUCTION_REUSED_DECISION_INVALID" });
    const otherSource = await createScoped(12, 24);
    const otherPrior = (await f.app.recordCreativeDecision({ ...input, runId: otherSource.id, operationId: randomUUID() })).creativeDecisions.at(-1)!;
    const combined = await f.app.recordCreativeDecision({ ...input, runId: wider.id, operationId: randomUUID(), reusedDecisionRefs: [
      { productionRunId: source.id, decisionId: prior.id }, { productionRunId: otherSource.id, decisionId: otherPrior.id }
    ] });
    assert.deepEqual(combined.creativeDecisions.at(-1)!.reusedDecisionRefs, [
      { productionRunId: source.id, decisionId: prior.id }, { productionRunId: otherSource.id, decisionId: otherPrior.id }
    ]);
    const sameRange = await createScoped(0, 12);
    const reused = await f.app.recordCreativeDecision({ ...input, runId: sameRange.id, operationId: randomUUID(),
      reusedDecisionRefs: [{ productionRunId: source.id, decisionId: prior.id }] });
    assert.deepEqual(reused.creativeDecisions.at(-1)!.reusedDecisionRefs, [{ productionRunId: source.id, decisionId: prior.id }]);
    await assert.rejects(f.app.recordCreativeDecision({ ...input, runId: sameRange.id, operationId: randomUUID(), reusedDecisionRefs: [
      { productionRunId: source.id, decisionId: prior.id }, { productionRunId: otherSource.id, decisionId: otherPrior.id }
    ] }), { code: "PRODUCTION_REUSED_DECISION_INVALID" });
  } finally { await f.close(); }
});

test("局部判断在本范围变化后重新核对，无关场面继续沿用", async () => {
  const f = await fixture();
  try {
    const runId = await localProductionRun(f.app, f.projectId, f.scene.id);
    assert.equal((await f.app.readProductionStatus(f.projectId, { runId })).preparation?.ready, true);
    f.app.createScene({ projectId: f.projectId, baseRevision: f.revision(), type: "ExplainerScene", title: "其他场面",
      purpose: "无关范围", startFrame: 24, endFrame: 48 });
    assert.equal((await f.app.readProductionStatus(f.projectId, { runId })).preparation?.ready, true);
    f.app.repository.commit(f.projectId, f.revision(), "修改目标场面", snapshot => {
      snapshot.scenes.find(scene => scene.id === f.scene.id)!.purpose = "目标范围已变化";
    });
    const preparation = (await f.app.readProductionStatus(f.projectId, { runId })).preparation!;
    assert.equal(preparation.ready, false);
    assert.equal(preparation.issues.filter(issue => issue.code === "RESPONSIBILITY_DECISION_PENDING").length, 3);
  } finally { await f.close(); }
});

test("完整 Vlog 以事件和画面判断完成三职责", async () => {
  const f = await fixture();
  try {
    const runId = await localProductionRun(f.app, f.projectId, f.scene.id);
    const report = await f.app.readSkillExecutionReport({ projectId: f.projectId, runId });
    report.intent = "full_creation";
    const snapshot = f.app.readProject(f.projectId).snapshot;
    snapshot.project.profile = "vlog";
    const scope = { kind: "objects" as const, objectIds: [f.scene.id] };
    const issues = await evaluateProductionCoordination({ report, snapshot, scope, phase: "authoring",
      readRevision: revision => f.app.readProject(f.projectId, revision).snapshot });
    assert.deepEqual(issues, []);
    const pending = await evaluateProductionCoordination({ report, snapshot, scope,
      readRevision: revision => f.app.readProject(f.projectId, revision).snapshot });
    assert.equal(pending.filter(issue => issue.code === "RESPONSIBILITY_REVIEW_PENDING").length, 3);
  } finally { await f.close(); }
});

test("完整解说首版按整片核对主画面素材，局部图形可独立交件", async () => {
  const f = await fixture();
  try {
    const snapshot = f.app.readProject(f.projectId).snapshot;
    snapshot.project.profile = "visual_explainer";
    const source = snapshot.assets.find(asset => asset.id === f.assetId)!;
    const report = structuredClone(f.run);
    report.assignments.push({
      assignmentId: "materials", agentId: "/fixture/materials", responsibilities: ["asset_sourcing"],
      skillIds: ["visual-asset-sourcing"], scope: { kind: "project" }, inputRevision: f.revision(), operationId: "materials"
    });
    const sceneIds = [f.scene.id];
    const manifestPath = join(f.root, "material-handoff.json");
    const deliveryRef = { manifestPath, manifestSha256: "", sceneIds };
    const decision = {
      id: "adopt-materials", phase: "adoption" as const, category: "visual" as const, decision: "采用当前画面",
      rationale: "已核对画面", objectIds: sceneIds, inputRevision: f.revision(), evidence: [],
      inputDecisionIds: ["design-materials"], deliveryRef, createdAt: new Date().toISOString()
    };
    report.creativeDecisions.push({ ...decision, id: "design-materials", phase: "visual_design", inputDecisionIds: [] }, decision);
    const addTreatment = (sceneId: string) => snapshot.visualTreatments.push({
      id: `treatment-${sceneId}`, sceneId, mode: "remotion", intensity: "medium", narrativePurpose: "连续解释",
      primaryAttention: "主体", adoptedDecisionRef: { productionRunId: report.id, decisionId: decision.id }
    } as typeof snapshot.visualTreatments[number]);
    addTreatment(f.scene.id);
    const assetBinding = { assetId: source.id, deliveredPath: "references/source-materials/fixture.png",
      sourceHash: source.sourceHash!, sourceRanges: [] };
    const handoffScene = (sceneId: string, primaryAssets: typeof assetBinding[]) => ({
      sceneId, status: "ready", visualPlan: visualPlan("主画面"),
      visualRoles: [
        { role: "主画面", referenceFunction: "承载观看", usage: "主画面持续发展", assets: primaryAssets },
        { role: "辅助出处", referenceFunction: "辅助阅读", usage: "短暂呈现", assets: [assetBinding] }
      ]
    });
    const freeze = async (scenes: ReturnType<typeof handoffScene>[]) => {
      const bytes = JSON.stringify({ projectId: f.projectId, selectedSceneIds: sceneIds, scenes });
      await writeFile(manifestPath, bytes);
      deliveryRef.manifestSha256 = createHash("sha256").update(bytes).digest("hex");
    };
    const assess = async (scope: Parameters<typeof evaluateProductionCoordination>[0]["scope"],
      targetRange?: { startFrame: number; endFrame: number }) => (await evaluateProductionCoordination({
        report, snapshot, scope, targetRange, phase: "authoring", readRevision: () => snapshot
      })).filter(issue => issue.code === "PRIMARY_VISUAL_MATERIAL_MISSING");

    await freeze([handoffScene(f.scene.id, [])]);
    const sceneScope = { kind: "objects" as const, objectIds: [f.scene.id] };
    const full = await assess(sceneScope, { startFrame: 0, endFrame: 24 });
    assert.equal(full.length, 1, "辅助截图无法代替主画面素材");
    assert.equal(full[0].assignmentId, "materials");
    assert.match(full[0].message, /场面「场面」的主画面角色「主画面」/);
    assert.deepEqual(await assess(sceneScope, { startFrame: 0, endFrame: 12 }), []);

    sceneIds.push("next");
    snapshot.scenes.push({ ...snapshot.scenes[0], id: "next", title: "素材主导场面", startFrame: 24, endFrame: 48 });
    addTreatment("next");
    await freeze([handoffScene(f.scene.id, []), handoffScene("next", [])]);
    assert.equal((await assess({ kind: "project" })).length, 2, "整片状态列出缺材场面");
    await freeze([handoffScene(f.scene.id, []), handoffScene("next", [assetBinding])]);
    assert.deepEqual(await assess({ kind: "project" }), [], "可用真实素材与局部图形可以共同承担整片");
  } finally { await f.close(); }
});

test("同一受管场面逐单元校验完整创意或主机制，局部借用不能代替主参考", async () => {
  const f = await fixture();
  try {
    const snapshot = f.app.readProject(f.projectId).snapshot;
    snapshot.project.profile = "visual_explainer";
    const scene = snapshot.scenes[0]!;
    const report = structuredClone(f.run);
    const assignee = (id: string, responsibilities: ProductionAssignment["responsibilities"], skillIds: string[]): ProductionAssignment =>
      ({ assignmentId: id, agentId: `/fixture/${id}`, responsibilities, skillIds, scope: { kind: "project" },
        inputRevision: f.revision(), operationId: id });
    report.assignments = [
      assignee("creative", ["creative_research"], ["creative-sequence-design"]),
      assignee("visual", ["motion_research", "visual_design"], ["motion-case-library", "visual-treatment-planning", "creative-reference-to-sequence"]),
      assignee("director", ["director"], ["production-director"]),
      assignee("text", ["narration", "asset_sourcing"], ["narration-writing", "visual-asset-sourcing"])
    ];
    const decision = (id: string, phase: CreativeDecision["phase"], assignmentId: string): CreativeDecision =>
      ({ id, phase, assignmentId, inputRevision: f.revision(), category: "visual", decision: "采用持续画面关系", rationale: "打开原片核对",
        objectIds: [scene.id], evidence: ["原作者交稿"], createdAt: new Date().toISOString() });
    const creative = { ...decision("creative", "creative_research", "creative"), researchOutcome: "researched" as const,
      researchCoverage: completeResearchCoverage,
      researchReferences: [{ kind: "creative" as const, id: "134-c02", sourceSha256: creativeFingerprint,
        startMs: 0, endMs: 2000, observedRelation: "实拍与文字交叠" }] };
    const motion = { ...decision("motion", "motion_research", "visual"), researchOutcome: "researched" as const,
      researchReferences: [{ kind: "motion" as const, id: "032-m09", sourceSha256: motionFingerprint,
        startMs: 2000, endMs: 3600, observedRelation: "同一活动主体换位接管" }] };
    const manifestPath = join(f.root, "visual-units.json");
    const deliveryRef = { manifestPath, manifestSha256: "", sceneIds: [scene.id] };
    const design = { ...decision("design", "visual_design", "visual"), inputDecisionIds: [creative.id, motion.id], deliveryRef };
    const adoption = { ...decision("adoption", "adoption", "director"), inputDecisionIds: [design.id], deliveryRef };
    report.creativeDecisions = [creative, motion, design, adoption];
    snapshot.visualTreatments.push({
      id: "adopted", sceneId: scene.id, mode: "remotion", intensity: "medium", narrativePurpose: "连续画面", primaryAttention: "实拍主体",
      adoptedDecisionRef: { productionRunId: report.id, decisionId: adoption.id }
    } as typeof snapshot.visualTreatments[number]);

    const references = [creative.researchReferences[0]!, motion.researchReferences[0]!].map(ref => ({ ...ref, video: ref.id }));
    const material = snapshot.assets.find(asset => asset.id === f.assetId)!;
    const units = ["开场", "承接", "比较", "结尾"].map((title, i) => ({
      id: `unit-${i}`, title, startFrame: i * 6, endFrame: (i + 1) * 6,
      mode: "full_reference" as const, creativeDecisionId: creative.id, creativeDraftId: "draft", handoffReceiptId: "receipt-" + i,
      restage: { resourceId: `restage-${i}`, sourceMs: i === 3 ? 2600 : 1000, projectFrame: i * 6 + 2 }
    }));
    const mappings = units.map((unit, i) => {
      const ref = references[i === 3 ? 1 : 0]!;
      return { unitId: unit.id, use: "primary" as const, referenceKind: ref.kind, referenceId: ref.id,
        researchDecisionId: i === 3 ? motion.id : creative.id, startMs: ref.startMs, endMs: ref.endMs,
        targetRole: "主体", treatment: "沿用完整演出", preserveRelation: ref.observedRelation,
        targetRange: { startFrame: unit.startFrame, endFrame: unit.endFrame } };
    });
    const ids = ["draft", ...units.map(unit => unit.restage.resourceId)];
    const delivered: ReferenceScene = { sceneId: scene.id, status: "ready", resourceIds: ids, references,
      visualRoles: [{ role: "主体", referenceFunction: "持续活动", usage: "承担主画面",
        assets: [{ assetId: material.id, deliveredPath: material.managedPath, sourceHash: material.sourceHash!, sourceRanges: [] }] }],
      visualPlan: { primaryRoles: ["主体"], units, referenceMappings: mappings, sequence: units.map(unit =>
        ({ unitId: unit.id, subjects: ["主体"], action: "主体沿原路径进入并持续", transition: "保留主体直到下一幅接手" })) } };
    const manifest: ReferenceManifest = { projectId: f.projectId, revision: f.revision(), selectedSceneIds: [scene.id], scenes: [delivered], diagnostics: [],
      files: [...ids.map(id => ({ sourcePath: id, deliveredPath: id, sha256: "a".repeat(64), localReadable: true,
        ...(id === "draft" ? { mimeType: "text/markdown" } : { mimeType: "video/mp4", localDecode: "verified" as const }), uses: [{ kind: "reference" as const, id }] })),
      ...references.map(ref => ({ sourcePath: ref.video, deliveredPath: ref.video, sha256: "a".repeat(64), localReadable: true, localDecode: "verified" as const,
        uses: [{ kind: ref.kind, id: ref.id, usage: "adopted" as const, librarySourceSha256: ref.sourceSha256 }] }))] };
    report.unitHandoffs = units.flatMap((unit, i) => {
      const { researchDecisionId, referenceId, referenceKind, startMs, endMs } = mappings[i]!;
      const draft = { id: unit.id, sceneId: scene.id, unitId: unit.id, startFrame: unit.startFrame, endFrame: unit.endFrame,
        mode: unit.mode, assignmentId: "creative", inputRevision: f.revision(), creativeDecisionId: creative.id,
        reference: { researchDecisionId, kind: referenceKind, id: referenceId, startMs, endMs,
          sourceSha256: references[i === 3 ? 1 : 0]!.sourceSha256 },
        assets: [{ assetId: material.id, sourceHash: material.sourceHash! }], path: "draft", sha256: "a".repeat(64) };
      return [
        { action: "submit_draft" as const, draft },
        { action: "accept_draft" as const, id: unit.handoffReceiptId, draftId: unit.id, assignmentId: "visual",
          inputRevision: f.revision(), sourceMs: unit.restage.sourceMs, projectFrame: unit.restage.projectFrame,
          comparisonPath: unit.restage.resourceId, comparisonSha256: "a".repeat(64), observation: "试摆有交叠" }
      ];
    });
    const inspect = () => visualReferenceUnitCoverage({ report, snapshot, manifest, scene, delivered, designs: [design] });
    assert.deepEqual(inspect().map(unit => unit.issues), [[], [], [], []]);
    const restageImage = manifest.files[1]!;
    restageImage.mimeType = "text/markdown";
    assert.ok(inspect()[0]?.issues.some(issue => issue.code === "VISUAL_UNIT_RESTAGE_MISSING"));
    restageImage.mimeType = "video/mp4";
    assert.equal(inspect().at(-1)?.primary?.kind, "motion", "完整机制可承担主参考");
    report.assignments[0]!.agentId = report.assignments[1]!.agentId;
    assert.ok(inspect().every(unit => unit.issues.some(issue => issue.code === "VISUAL_UNIT_CREATIVE_DRAFT_MISSING")));
    report.assignments[0]!.agentId = "/fixture/creative";

    delivered.visualPlan!.referenceMappings = mappings.map((mapping, i) => i === 0
      ? { ...mapping, targetRange: { startFrame: 2, endFrame: 4 } }
      : i === 2 ? { ...mapping, use: "support" as const } : mapping).filter((_, i) => i !== 1);
    const bytes = JSON.stringify(manifest);
    await writeFile(manifestPath, bytes);
    deliveryRef.manifestSha256 = createHash("sha256").update(bytes).digest("hex");
    assert.deepEqual(inspect().filter(unit => unit.issues.some(issue => issue.code === "VISUAL_UNIT_PRIMARY_REFERENCE_MISSING"))
      .map(unit => unit.title), ["开场", "承接", "比较"]);
    const evaluate = (targetRange?: { startFrame: number; endFrame: number }) => evaluateProductionCoordination({
      report, snapshot, scope: { kind: "objects", objectIds: [scene.id] }, phase: "authoring", targetRange, readRevision: () => snapshot
    });
    assert.deepEqual((await evaluate({ startFrame: 0, endFrame: 24 })).filter(issue => issue.code === "VISUAL_UNIT_PRIMARY_REFERENCE_MISSING")
      .map(issue => issue.scope), [{ kind: "frames", startFrame: 0, endFrame: 6 }, { kind: "frames", startFrame: 6, endFrame: 12 },
      { kind: "frames", startFrame: 12, endFrame: 18 }]);
    assert.ok(!(await evaluate({ startFrame: 18, endFrame: 24 })).some(issue => issue.code.startsWith("VISUAL_UNIT_")));
    const local = units.at(-1)!;
    delivered.visualPlan!.units = units.map(unit => unit.id === local.id ? { ...unit, mode: "local_mechanism" } : unit);
    for (const event of report.unitHandoffs) {
      if (event.action === "submit_draft" && event.draft.unitId === local.id) event.draft.mode = "local_mechanism";
    }
    delivered.visualPlan!.referenceMappings = mappings.map(mapping => mapping.unitId === local.id
      ? { ...mapping, use: "support", targetRange: { startFrame: 19, endFrame: 22 } } : mapping);
    assert.equal(inspect().at(-1)?.issues[0]?.code, "VISUAL_UNIT_HANDOFF_DRAFT_REQUIRED", "局部机制不能成为完整新片的主模式");
    report.intent = "local_edit";
    assert.deepEqual(inspect().at(-1)?.issues, [], "独立局部机制在实际范围使用辅助映射");
    delivered.visualPlan!.referenceMappings.at(-1)!.targetRange = { startFrame: 21, endFrame: 22 };
    assert.equal(inspect().at(-1)?.issues[0]?.code, "VISUAL_UNIT_REFERENCE_MAPPING_MISMATCH", "对照帧须落在机制动作的范围内");
    delivered.visualPlan!.units = units.slice(1);
    assert.equal(inspect()[0]?.issues[0]?.code, "VISUAL_REFERENCE_UNITS_INCOMPLETE", "遗漏单元不能覆盖整个场面");
  } finally { await f.close(); }
});

test("完整 Vlog 可按三职责判断启动所需的局部画面制作", async () => {
  const f = await fixture();
  try {
    const created = f.app.createProject({ name: "实拍剪辑", profile: "vlog" });
    const projectId = created.snapshot.project.id;
    const scene = f.app.createScene({ projectId, baseRevision: created.revision.number, type: "ExplainerScene",
      title: "现场", purpose: "事件接续", startFrame: 0, endFrame: 24 }).snapshot.scenes[0]!;
    const revision = f.app.readProject(projectId).revision.number;
    const run = await f.app.startProductionRun({ projectId, baseRevision: revision, intent: "full_creation",
      completionScope: { kind: "project" }, operationId: randomUUID(), loadedSkills: ["vlog-director"] });
    await assignVisualResponsibilities(f.app, projectId, run.id, { kind: "project" }, [scene.id]);
    const job = await f.app.startMotionAuthoring({ projectId, baseRevision: revision, productionRunId: run.id,
      idempotencyKey: "vlog-local", target: { action: "create_cue", sceneId: scene.id, layer: "fullscreen",
        startFrame: 0, endFrame: 24, sourceStartFrame: 0, sourceEndFrame: 24, audioPolicy: "rebind_unchanged_events" },
      openDesignRequest: { project: "fixture", prompt: "按已确认的现场接续制作" } });
    assert.equal(job.kind, "motion_authoring");
  } finally { await f.close(); }
});

test("主要视觉重做通过真实 MCP 提交导演采用", { timeout: 60_000 }, async () => {
  const f = await fixture("visual_rework");
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
    assert.equal(f.app.readProject(f.projectId).snapshot.motionWorks?.length ?? 0, 0);
    const brief = join(f.root, "brief.md"), timing = join(f.root, "timing.md");
    await writeFile(brief, directorBrief(visualPlan("主体")) + `\n\n## 发给 OD 的完整请求\n### 场面 ${f.scene.id}\n沿用已采用的完整视觉方案`); await writeFile(timing, "实际时间安排");
    await client.connect(transport);
    const handoff = parse<{ inputRevision: number; manifestPath: string; manifestSha256: string; scenes: Array<{ status: string; diagnostics?: string[] }> }>(await client.callTool({
      name: "prepare_motion_handoff", arguments: { project_id: f.projectId, base_revision_id: f.revision(), brief_path: brief, timing_plan_path: timing,
        selected_scene_ids: [f.scene.id], assets: [{ id: f.assetId, purpose: "真实主体" }], scenes: [{ sceneId: f.scene.id, status: "ready",
          visualRoles: [{ role: "主体", referenceFunction: "连续组织", assetIds: [f.assetId], usage: "呈现真实主体" }],
          process: "主体建立、变化并接续", preserve: ["主体关系"], adapt: ["排版"],
          visualPlan: visualPlan("主体") }] }
    }) as never);
    assert.equal(handoff.scenes[0].status, "ready", JSON.stringify(handoff.scenes[0].diagnostics));
    const basePlan = visualPlan("主体");
    const layerPlan = { ...basePlan, researchLayers: [{ level: "overallVisual",
      researchDecisionId: "研究结果待关联", designExcerpt: "主体建立初始画面" }],
      sequence: basePlan.sequence };
    const layerHandoff = parse<{ scenes: Array<{ status: string; visualPlan: typeof layerPlan }> }>(
      await client.callTool({ name: "prepare_motion_handoff", arguments: { project_id: f.projectId, production_run_id: f.run.id,
        base_revision_id: f.revision(), brief_path: brief, timing_plan_path: timing, selected_scene_ids: [f.scene.id],
        assets: [{ id: f.assetId, purpose: "真实主体" }], scenes: [{ sceneId: f.scene.id, status: "ready",
          visualRoles: [{ role: "主体", referenceFunction: "连续组织", assetIds: [f.assetId], usage: "呈现真实主体" }],
          process: "主体建立、变化并接续", preserve: ["主体关系"], adapt: ["排版"], visualPlan: layerPlan }] } }) as never);
    assert.equal(layerHandoff.scenes[0].status, "ready");
    assert.deepEqual(layerHandoff.scenes[0].visualPlan.researchLayers, layerPlan.researchLayers);
    assert.deepEqual(layerHandoff.scenes[0].visualPlan.sequence, layerPlan.sequence);
    let activeHandoff = handoff;
    let deliveryRef = { manifestPath: handoff.manifestPath, manifestSha256: handoff.manifestSha256, sceneIds: [f.scene.id] };
    await f.app.updateProductionRun({ projectId: f.projectId, runId: f.run.id, expectedAuditVersion: f.run.auditVersion,
      operationId: "assign-all", action: "add_assignment", assignment: { assignmentId: "all", agentId: "/fixture/authors",
        responsibilities: ["director", "creative_research", "visual_design", "motion_research"],
        skillIds: ["production-director", "creative-sequence-design", "visual-treatment-planning", "creative-reference-to-sequence", "motion-case-library"],
        scope: { kind: "project" }, inputRevision: f.revision() } });
    const record = async (phase: "creative_research" | "motion_research" | "visual_design" | "adoption", options: {
      inputDecisionIds?: string[]; researchOutcome?: "pending" | "researched" | "not_applicable"; evidence?: string[]; delivery?: boolean;
      researchCoverage?: typeof completeResearchCoverage;
      researchReferences?: Array<{ kind: "creative" | "motion"; id: string; sourceSha256: string }> } = {}) => {
      const result = (await f.app.recordCreativeDecision({ projectId: f.projectId, runId: f.run.id, operationId: randomUUID(), category: "visual",
        phase, assignmentId: "all", inputRevision: phase === "visual_design" ? activeHandoff.inputRevision : f.revision(), objectIds: [f.scene.id], decision: phase, rationale: "按当前场面和实际研究判断",
        inputDecisionIds: options.inputDecisionIds, researchOutcome: options.researchOutcome, researchCoverage: options.researchCoverage, researchReferences: options.researchReferences, evidence: options.evidence,
        ...(phase === "visual_design" || options.delivery ? { deliveryRef } : {}) })).creativeDecisions.at(-1)!;
      return result;
    };
    await record("creative_research", { researchOutcome: "not_applicable" });
    const motion = await record("motion_research", { researchOutcome: "not_applicable", evidence: ["研究过相关机制，当前素材运动无需借用"] });
    const initialDesign = await record("visual_design");
    await assert.rejects(record("adoption", { inputDecisionIds: [initialDesign.id], delivery: true }), { code: "PRODUCTION_RESEARCH_INCOMPLETE" });
    const untraceable = await record("creative_research", { researchOutcome: "researched" });
    const untraceableDesign = await record("visual_design", { inputDecisionIds: [untraceable.id, motion.id] });
    await assert.rejects(record("adoption", { inputDecisionIds: [untraceableDesign.id], delivery: true }), { code: "PRODUCTION_RESEARCH_INCOMPLETE" });
    const shallow = await record("creative_research", { researchOutcome: "researched",
      researchCoverage: { ...completeResearchCoverage, layerNotes: { ...completeResearchCoverage.layerNotes, overallVisual: "" } },
      evidence: ["仅描述素材与数字共同构图"] });
    const shallowDesign = await record("visual_design", { inputDecisionIds: [shallow.id, motion.id] });
    await assert.rejects(record("adoption", { inputDecisionIds: [shallowDesign.id], delivery: true }),
      (error: any) => error.code === "PRODUCTION_RESEARCH_LAYERS_INCOMPLETE" && error.message.includes("整片美术研究正文"),
      "标记整体已覆盖但缺少研究正文时不能正式采用");
    const shallowStatus = parse<{ completion: { coordinationIssues: Array<{ code: string; message: string }> } }>(
      await client.callTool({ name: "read_production_status", arguments: { project_id: f.projectId, run_id: f.run.id } }) as never);
    assert.ok(shallowStatus.completion.coordinationIssues.some(issue => issue.code === "RESEARCH_PENDING" && issue.message.includes("创意研究")),
      "缺少分层正文的候选在生产状态中应保持待完成");
    const creative = await record("creative_research", { researchOutcome: "researched", researchCoverage: completeResearchCoverage,
      researchReferences: [{ kind: "creative", id: "001-c01", sourceSha256: creativeFingerprint }] });
    const unmappedDesign = await record("visual_design", { inputDecisionIds: [creative.id, motion.id] });
    await assert.rejects(record("adoption", { inputDecisionIds: [unmappedDesign.id], delivery: true }),
      (error: any) => error.code === "PRODUCTION_RESEARCH_LAYERS_INCOMPLETE" && error.message.includes("整片美术的导演稿关联"),
      "仅登记研究状态不能代表视觉稿已接收分层内容");
    const mcpUnmapped = await client.callTool({ name: "record_creative_decision", arguments: {
      project_id: f.projectId, run_id: f.run.id, operation_id: "mcp-unmapped-layers", category: "visual",
      phase: "adoption", assignment_id: "all", input_revision: f.revision(), object_ids: [f.scene.id],
      input_decision_ids: [unmappedDesign.id], decision: "采用视觉设计", rationale: "验证分层关联",
      delivery_ref: { manifest_path: deliveryRef.manifestPath, manifest_sha256: deliveryRef.manifestSha256, scene_ids: deliveryRef.sceneIds }
    } });
    assert.equal(mcpUnmapped.isError, true);
    const layerError = JSON.parse((mcpUnmapped.content as Array<{ text: string }>)[0].text);
    assert.equal(layerError.code, "PRODUCTION_RESEARCH_LAYERS_INCOMPLETE");
    assert.equal(layerError.sideEffects, "none");
    assert.ok(!(await f.app.readSkillExecutionReport({ projectId: f.projectId, runId: f.run.id })).operations
      .some(item => item.id === "mcp-unmapped-layers"));
    activeHandoff = parse(await client.callTool({
      name: "prepare_motion_handoff", arguments: { project_id: f.projectId, base_revision_id: f.revision(), brief_path: brief, timing_plan_path: timing,
        selected_scene_ids: [f.scene.id], assets: [{ id: f.assetId, purpose: "真实主体" }], scenes: [{ sceneId: f.scene.id, status: "ready",
          visualRoles: [{ role: "主体", referenceFunction: "连续组织", assetIds: [f.assetId], usage: "呈现真实主体" }],
          process: "主体建立、变化并接续", preserve: ["主体关系"], adapt: ["排版"], visualPlan: researchPlan("主体", creative.id) }] }
    }) as never);
    deliveryRef = { manifestPath: activeHandoff.manifestPath, manifestSha256: activeHandoff.manifestSha256, sceneIds: [f.scene.id] };
    const design = await record("visual_design", { inputDecisionIds: [creative.id, motion.id] });
    await assert.rejects(record("adoption", { delivery: true }), { code: "PRODUCTION_RESEARCH_INCOMPLETE" });
    const adopted = await record("adoption", { inputDecisionIds: [design.id], delivery: true });
    const updateTreatment = (decisionId: string, visualTreatmentId?: string) => f.app.manageVisualTreatment({ projectId: f.projectId, baseRevision: f.revision(),
      action: "upsert", visualTreatmentId, sceneId: f.scene.id, narrativeBeatId: beats[0]!.id, mode: "b_roll", intensity: "medium", primaryAttention: "主体", narrativePurpose: "解释",
      adoptedMaterialAssetIds: [f.assetId], adoptedDecisionRef: { productionRunId: f.run.id, decisionId } }).snapshot.visualTreatments[0];
    const treatment = updateTreatment(adopted.id);
    const target = { action: "create_cue", sceneId: f.scene.id, layer: "fullscreen", startFrame: 0, endFrame: 24,
      sourceStartFrame: 0, sourceEndFrame: 24, coveredNarrativeBeatIds: [beats[0]!.id] as string[] | undefined, audioPolicy: "rebind_unchanged_events" };
    const start = (key: string, requestedTarget = target) => client.callTool({ name: "start_motion_authoring", arguments: { project_id: f.projectId, base_revision_id: f.revision(),
      production_run_id: f.run.id, visual_treatment_ids: [treatment.id], target: requestedTarget, idempotency_key: key,
      opendesign_request: { project: "isolated-od" } } });
    f.app.repository.commit(f.projectId, f.revision(), "修改当前内容", snapshot => { snapshot.story.beats.find(beat => beat.id === beats[0]!.id)!.title = "当前内容已变"; });
    const changedTarget = await start("changed-target");
    assert.equal(changedTarget.isError, true);
    assert.ok(JSON.parse((changedTarget.content as Array<{ text: string }>)[0].text).issues.some((issue: { code: string }) => issue.code === "VISUAL_INPUT_STALE"));
    f.app.repository.commit(f.projectId, f.revision(), "恢复当前内容并修改其他内容", snapshot => {
      snapshot.story.beats.find(beat => beat.id === beats[0]!.id)!.title = beats[0]!.title;
      snapshot.story.beats.find(beat => beat.id === beats[1]!.id)!.title = "其他内容已变";
    });
    const created = parse<{ jobId: string }>(await start("ready") as never);
    assert.ok(created.jobId);
    assert.equal(parse<{ jobId: string }>(await start("ready") as never).jobId, created.jobId);
    assert.equal(f.app.repository.listJobs(f.projectId).filter(job => job.kind === "motion_authoring").length, 1);
    const busy = await start("other-key");
    assert.equal(busy.isError, true);
    assert.ok(JSON.parse((busy.content as Array<{ text: string }>)[0].text).issues.some((issue: { code: string }) => issue.code === "MOTION_AUTHORING_WORK_BUSY"));
    assert.equal(parse<{ jobId: string }>(await start("ready") as never).jobId, created.jobId, "同一幂等请求应读回原 Job");
    assert.equal(f.app.repository.listJobs(f.projectId).filter(job => job.kind === "motion_authoring").length, 1);
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
  const f = await fixture("visual_rework");
  try {
    const update = await f.app.updateProductionRun({ projectId: f.projectId, runId: f.run.id, expectedAuditVersion: f.run.auditVersion,
      operationId: "assign", action: "add_assignment", assignment: { assignmentId: "author", agentId: "/fixture/author",
        responsibilities: ["director", "narration", "asset_sourcing", "creative_research", "visual_design", "motion_research"],
        skillIds: ["production-director", "narration-writing", "visual-asset-sourcing", "creative-sequence-design", "visual-treatment-planning", "creative-reference-to-sequence", "motion-case-library"],
        scope: { kind: "project" }, inputRevision: f.revision() } });
    const evaluate = async () => evaluateProductionCoordination({ report: await f.app.readSkillExecutionReport({ projectId: f.projectId, runId: f.run.id }),
      snapshot: f.app.readProject(f.projectId).snapshot, scope: { kind: "project" },
      review: await f.app.readEditorialQualityReview({ projectId: f.projectId, revision: f.revision() }), readRevision: revision => f.app.readProject(f.projectId, revision).snapshot });
    assert.ok((await evaluate()).some(issue => issue.code === "RESEARCH_PENDING"));
    const preparedRevision = f.revision();
    const record = async (phase: "creative_research" | "motion_research" | "visual_design" | "adoption", inputDecisionIds: string[] = [], deliveryRef?: { manifestPath: string; manifestSha256: string; sceneIds: string[] }) => {
      const report = await f.app.recordCreativeDecision({ projectId: f.projectId, runId: f.run.id, operationId: randomUUID(), category: "visual",
        phase, assignmentId: "author", inputRevision: phase === "visual_design" && deliveryRef ? preparedRevision : f.revision(), objectIds: [f.scene.id], inputDecisionIds,
        ...(phase.endsWith("research") ? { researchOutcome: "researched" as const } : {}),
        ...(phase === "creative_research" ? { researchCoverage: completeResearchCoverage,
          researchReferences: [{ kind: "creative" as const, id: "001-c01", sourceSha256: creativeFingerprint, startMs: 0, endMs: 1000, observedRelation: "主体与文字共同变化" }] } : {}),
        ...(phase === "motion_research" ? { researchReferences: [{ kind: "motion" as const, id: "001-m01", sourceSha256: motionFingerprint, startMs: 0, endMs: 1000, observedRelation: "主体接管画面" }] } : {}),
        decision: phase, rationale: "核对范围与资料", deliveryRef });
      return report.creativeDecisions.at(-1)!;
    };
    const creative = await record("creative_research");
    const motion = await record("motion_research");
    const brief = join(f.root, "brief.md"), timing = join(f.root, "timing.md"), snapshotPath = join(f.root, "snapshot.json"), baseOutput = join(f.root, "base-handoff");
    await writeFile(brief, directorBrief(visualPlan("主体")) + "\n结合实际素材\n保持主体和文字的共同变化");
    await writeFile(timing, "本场时间安排");
    await writeFile(snapshotPath, JSON.stringify(f.app.readProject(f.projectId)));
    await prepareReferencePackage({ projectId: f.projectId, revision: preparedRevision, projectSnapshot: snapshotPath, brief, timingPlan: timing,
      freezeInputs: true, selectedSceneIds: [f.scene.id], scenes: [{ sceneId: f.scene.id, status: "ready",
        visualRoles: [{ role: "主体", referenceFunction: "连续变化", assetIds: [f.assetId], usage: "主体图片" }],
        visualPlan: researchPlan("主体", creative.id), process: "主体建立并发展", preserve: ["主体"], adapt: ["细节"] }] }, baseOutput);
    const deliveryFor = async (scenes: unknown[]) => {
      const output = join(f.root, randomUUID());
      await cp(baseOutput, output, { recursive: true });
      const manifestPath = join(output, "delivery-manifest.json");
      const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
      manifest.packageRoot = output;
      const baseScene = manifest.scenes[0];
      manifest.scenes = scenes.map((scene: any) => ({ ...baseScene, ...scene, visualRoles: baseScene.visualRoles,
        visualPlan: { ...baseScene.visualPlan, ...scene.visualPlan } }));
      const sceneFile = manifest.files.find((file: any) => file.uses.some((use: any) => use.kind === "brief" && use.id === "scenes"));
      const bytes = Buffer.from(JSON.stringify({ projectId: f.projectId, revision: preparedRevision, scenes: manifest.scenes }));
      await writeFile(join(output, sceneFile.deliveredPath), bytes);
      sceneFile.sha256 = createHash("sha256").update(bytes).digest("hex");
      sceneFile.sourceSha256 = sceneFile.sha256;
      const manifestBytes = Buffer.from(JSON.stringify(manifest));
      await writeFile(manifestPath, manifestBytes);
      return { manifestPath, manifestSha256: createHash("sha256").update(manifestBytes).digest("hex"), sceneIds: [f.scene.id] };
    };
    const delivery = await deliveryFor([{ sceneId: f.scene.id, status: "ready", references: [] }]);
    const layerDelivery = (researchDecisionId: string, level: string, designExcerpt: string) =>
      deliveryFor([{ sceneId: f.scene.id, status: "ready", references: [],
        visualPlan: { researchLayers: [{ level, researchDecisionId, designExcerpt }] } }]);
    const traced = await layerDelivery(creative.id, "overallVisual", "结合实际素材");
    const partialDesign = await record("visual_design", [creative.id, motion.id], traced);
    await assert.rejects(record("adoption", [partialDesign.id], traced),
      (error: any) => error.code === "PRODUCTION_RESEARCH_LAYERS_INCOMPLETE" && error.message.includes("场面构图的导演稿关联"),
      "整片美术已关联但场面构图和局部机制缺少关联时，不能把整体研究当成已落地");
    const wrongOwner = await layerDelivery(motion.id, "overallVisual", "结合实际素材");
    await assert.rejects(record("visual_design", [creative.id, motion.id], wrongOwner), { code: "VISUAL_REVISION_DELIVERY_INVALID" });
    const partial = (await f.app.recordCreativeDecision({ projectId: f.projectId, runId: f.run.id, operationId: randomUUID(),
      category: "visual", phase: "creative_research", assignmentId: "author", inputRevision: f.revision(), objectIds: [f.scene.id],
      researchOutcome: "pending", researchCoverage: { ...completeResearchCoverage, layerNotes: { overallVisual: "只完成整体观察" } },
      decision: "阶段研究", rationale: "场面构图仍待补充" })).creativeDecisions.at(-1)!;
    const missingNote = await layerDelivery(partial.id, "sceneComposition", "结合实际素材");
    await assert.rejects(record("visual_design", [partial.id, motion.id], missingNote), { code: "VISUAL_REVISION_DELIVERY_INVALID" });
    const fabricated = await layerDelivery(creative.id, "overallVisual", "导演稿中不存在的设计");
    await assert.rejects(record("visual_design", [creative.id, motion.id], fabricated), { code: "VISUAL_REVISION_DELIVERY_INVALID" });
    const beforeMissingDelivery = await f.app.readSkillExecutionReport({ projectId: f.projectId, runId: f.run.id });
    await assert.rejects(record("adoption"), { code: "PRODUCTION_ADOPTION_DELIVERY_INVALID" }, "没有固定交付不能登记正式视觉采用");
    await assert.rejects(f.app.recordCreativeDecision({ projectId: f.projectId, runId: f.run.id, operationId: "adopt-scene-without-delivery",
      category: "scene", phase: "adoption", assignmentId: "author", inputRevision: f.revision(), objectIds: [f.scene.id],
      decision: "采用场面", rationale: "验证交付检查" }), { code: "PRODUCTION_ADOPTION_DELIVERY_INVALID" });
    assert.deepEqual(await f.app.readSkillExecutionReport({ projectId: f.projectId, runId: f.run.id }), beforeMissingDelivery, "拒绝采用不写入制作记录");
    const audioDecision = await f.app.recordCreativeDecision({ projectId: f.projectId, runId: f.run.id, operationId: "adopt-audio-without-visual-delivery",
      category: "audio", phase: "adoption", assignmentId: "author", inputRevision: f.revision(), objectIds: [f.scene.id],
      decision: "采用声音方向", rationale: "无需视觉交付" });
    assert.equal(audioDecision.creativeDecisions.at(-1)?.category, "audio", "其他类型判断不受视觉交付限制");
    const unlinkedDelivery = await deliveryFor([{ sceneId: f.scene.id, status: "ready", references: [], visualPlan: { researchLayers: [] } }]);
    const initialDesign = await record("visual_design", [], unlinkedDelivery);
    await assert.rejects(record("adoption", [initialDesign.id], unlinkedDelivery), { code: "PRODUCTION_RESEARCH_INCOMPLETE" });
    const revised = await record("visual_design", [creative.id, motion.id], delivery);
    const adopted = await record("adoption", [revised.id], delivery);
    const treatment = f.app.manageVisualTreatment({ projectId: f.projectId, baseRevision: f.revision(), action: "upsert", sceneId: f.scene.id,
      mode: "b_roll", intensity: "medium", primaryAttention: "主体", narrativePurpose: "说明", adoptedMaterialAssetIds: [f.assetId], adoptedDecisionRef: { productionRunId: f.run.id, decisionId: adopted.id } }).snapshot.visualTreatments[0];
    assert.deepEqual((await evaluate()).map(issue => issue.code), Array(3).fill("RESPONSIBILITY_REVIEW_PENDING"));
    const incompleteDelivery = await deliveryFor([{ sceneId: f.scene.id, status: "ready",
      references: [{ kind: "creative", id: "unseen", sourceSha256: "b".repeat(64) }] }]);
    const incompleteDesign = await record("visual_design", [creative.id, motion.id], incompleteDelivery);
    const beforeRejectedAdoption = await f.app.readSkillExecutionReport({ projectId: f.projectId, runId: f.run.id });
    await assert.rejects(record("adoption", [incompleteDesign.id], incompleteDelivery), (error: any) =>
      error.code === "PRODUCTION_REFERENCE_RESEARCH_INVALID" && error.issues.some((issue: any) => issue.code === "REFERENCE_MAPPING_MISSING"));
    assert.equal((await f.app.readSkillExecutionReport({ projectId: f.projectId, runId: f.run.id })).creativeDecisions.length,
      beforeRejectedAdoption.creativeDecisions.length, "被拒绝的采用不写入审计");
    const reportPath = join(f.app.getProjectRoot(f.projectId), "reports", `production-run-${f.run.id}.json`);
    const priorReport = await readFile(reportPath);
    const historical = JSON.parse(priorReport.toString("utf8"));
    historical.creativeDecisions.push({ ...adopted, id: "historical-invalid-adoption", inputDecisionIds: [incompleteDesign.id], deliveryRef: incompleteDelivery });
    await writeFile(reportPath, JSON.stringify(historical));
    try {
      const revisionBefore = f.revision();
      assert.throws(() => f.app.manageVisualTreatment({ projectId: f.projectId, baseRevision: revisionBefore, action: "upsert", visualTreatmentId: treatment.id,
        sceneId: f.scene.id, mode: "b_roll", intensity: "medium", primaryAttention: "主体", narrativePurpose: "说明", adoptedMaterialAssetIds: [f.assetId],
        adoptedDecisionRef: { productionRunId: f.run.id, decisionId: "historical-invalid-adoption" } }), { code: "PRODUCTION_REFERENCE_RESEARCH_INVALID" });
      assert.equal(f.revision(), revisionBefore, "旧的无效采用不能通过 upsert 生效");
    } finally { await writeFile(reportPath, priorReport); }
    const withReference = JSON.stringify({ scenes: [{ sceneId: f.scene.id, status: "ready",
      references: [{ kind: "creative", id: "001-c01", sourceSha256: creativeFingerprint, startMs: 0, endMs: 1000 }],
      visualRoles: [{ role: "主体" }],
      visualPlan: { referenceMappings: [{ referenceId: "001-c01", referenceKind: "creative", researchDecisionId: creative.id, startMs: 0, endMs: 1000, targetRole: "主体", treatment: "结合实际素材", preserveRelation: "保持主体和文字的共同变化", targetRange: { startFrame: 0, endFrame: 24 } }] } }] });
    const uncheckedRange = withReference.replaceAll('"startMs":0,"endMs":1000', '"startMs":1000,"endMs":2000');
    const uncheckedDelivery = await deliveryFor(JSON.parse(uncheckedRange).scenes);
    const uncheckedDesign = await record("visual_design", [creative.id, motion.id], uncheckedDelivery);
    await assert.rejects(record("adoption", [uncheckedDesign.id], uncheckedDelivery), (error: any) =>
      error.code === "PRODUCTION_REFERENCE_RESEARCH_INVALID" && error.issues.some((issue: any) => issue.code === "REFERENCE_RESEARCH_UNLINKED"),
      "同一卡的另一段在正式采用前就要拒绝");
    const transport = new StdioClientTransport({ command: process.execPath, args: ["--import", "tsx", "apps/server/src/mcp.ts"], cwd: process.cwd(),
      env: { ...getDefaultEnvironment(), VIDEOCUT_WORKSPACE: f.root }, stderr: "pipe" });
    const client = new Client({ name: "reference-adoption-contract", version: "1.0.0" });
    try {
      await client.connect(transport);
      const rejected = await client.callTool({ name: "record_creative_decision", arguments: { project_id: f.projectId, run_id: f.run.id,
        operation_id: "mcp-reject-uncovered-reference", category: "visual", phase: "adoption", assignment_id: "author", input_revision: f.revision(),
        object_ids: [f.scene.id], input_decision_ids: [uncheckedDesign.id], decision: "采用", rationale: "验证缺失范围",
        delivery_ref: { manifest_path: uncheckedDelivery.manifestPath, manifest_sha256: uncheckedDelivery.manifestSha256, scene_ids: uncheckedDelivery.sceneIds } } });
      assert.equal(rejected.isError, true);
      const diagnostic = JSON.parse((rejected.content as Array<{ text: string }>)[0].text);
      assert.equal(diagnostic.sideEffects, "none");
      assert.ok(diagnostic.issues.some((issue: any) => issue.code === "REFERENCE_RESEARCH_UNLINKED" && issue.message.includes("1000–2000")));
    } finally { await client.close(); }
    const subsetDelivery = await deliveryFor(JSON.parse(withReference.replaceAll('"startMs":0,"endMs":1000', '"startMs":200,"endMs":800')).scenes);
    const subsetDesign = await record("visual_design", [creative.id, motion.id], subsetDelivery);
    assert.ok((await record("adoption", [subsetDesign.id], subsetDelivery)).id, "已研究区间内的子片段可以采用");
    const referenceDelivery = await deliveryFor(JSON.parse(withReference).scenes);
    const referenceDesign = await record("visual_design", [creative.id, motion.id], referenceDelivery);
    const referenceAdoption = await record("adoption", [referenceDesign.id], referenceDelivery);
    f.app.manageVisualTreatment({ projectId: f.projectId, baseRevision: f.revision(), action: "upsert", visualTreatmentId: treatment.id, sceneId: f.scene.id,
      mode: "b_roll", intensity: "medium", primaryAttention: "主体", narrativePurpose: "说明", adoptedMaterialAssetIds: [f.assetId], adoptedDecisionRef: { productionRunId: f.run.id, decisionId: referenceAdoption.id } });
    assert.ok((await evaluate()).some(issue => issue.code === "REFERENCE_REVIEW_PENDING"));
    const referenceReview = { productionRunId: f.run.id, decisionId: referenceAdoption.id,
      sceneId: f.scene.id, referenceKind: "creative" as const, referenceId: "001-c01", sourceSha256: creativeFingerprint, targetRole: "主体", startMs: 0, endMs: 1000 };
    await assert.rejects(f.app.recordEditorialQualityReview({ projectId: f.projectId, runId: f.run.id, revision: f.revision(), operationId: "reference-review-incomplete",
      passes: ["mute_visual"], previewEvidence: [], findings: [], observations: [{ source: "workbench", observer: "测试作者", pass: "mute_visual", method: "continuous_video",
        startFrame: 0, endFrame: 24, observation: "只登记参考身份", referenceReviews: [referenceReview] }] }), { code: "REFERENCE_REVIEW_DETAILS_REQUIRED" });
    await f.app.recordEditorialQualityReview({ projectId: f.projectId, runId: f.run.id, revision: f.revision(), operationId: "reference-review",
      passes: ["mute_visual"], previewEvidence: [], findings: [], observations: [{ source: "workbench", observer: "测试作者", pass: "mute_visual", method: "continuous_video",
        startFrame: 0, endFrame: 24, observation: "测试声明：已对照", referenceReviews: [{ ...referenceReview,
          originalRelation: "主体与文字共同变化", actualImplementation: "本片主体与文字接续", difference: "无", outcome: "confirmed" }],
        responsibilityReviews: [
          { responsibility: "creative_research", assignmentId: "author", decisionIds: [creative.id], outcome: "confirmed", observation: "已对照创意关系" },
          { responsibility: "motion_research", assignmentId: "author", decisionIds: [motion.id], outcome: "confirmed", observation: "已连续检查动作接续" },
          { responsibility: "visual_design", assignmentId: "author", decisionIds: [referenceDesign.id], outcome: "confirmed", observation: "已检查构图与素材" }
        ] }] });
    assert.deepEqual(await evaluate(), []);
    await f.app.recordEditorialQualityReview({ projectId: f.projectId, runId: f.run.id, revision: f.revision(), operationId: "reference-later-unknown",
      passes: ["mute_visual"], previewEvidence: [], findings: [], observations: [{ source: "workbench", observer: "测试作者", pass: "mute_visual", method: "continuous_video",
        startFrame: 0, endFrame: 24, observation: "后续观察仍需确认", referenceReviews: [{ ...referenceReview,
          originalRelation: "主体接管", actualImplementation: "暂不清楚", difference: "无法确认", outcome: "inconclusive" }] }] });
    assert.ok((await evaluate()).some(issue => issue.code === "REFERENCE_REVIEW_PENDING"), "后续待核不能被旧通过覆盖");
    const issueInput = { projectId: f.projectId, runId: f.run.id, revision: f.revision(), operationId: "reference-issue",
      passes: ["mute_visual" as const], previewEvidence: [], findings: [], observations: [{ source: "workbench" as const, observer: "测试作者", pass: "mute_visual" as const,
        method: "continuous_video" as const, startFrame: 0, endFrame: 24, observation: "连续观察发现窗口没有接管", referenceReviews: [{ ...referenceReview,
          originalRelation: "主体接管", actualImplementation: "主体未放大", difference: "缺少接管", outcome: "issue" as const, impact: "核心关系缺失" }] }] };
    const withIssue = await f.app.recordEditorialQualityReview(issueInput);
    const finding = withIssue.editorialReview!.findings.find(item => item.referenceReview?.referenceId === referenceReview.referenceId)!;
    assert.equal(finding.severity, "major");
    assert.equal((await f.app.recordEditorialQualityReview(issueInput)).editorialReview!.findings.filter(item => item.id === finding.id).length, 1);
    assert.ok(!(await evaluate()).some(issue => issue.code === "REFERENCE_REVIEW_PENDING"), "待修问题不重复生成参考待审");
    const pendingStatus = await f.app.readProductionStatus(f.projectId, { runId: f.run.id });
    const next = pendingStatus.completion?.nextActions?.find(action => action.relatedRefs.includes(finding.id));
    assert.equal(next?.assignmentId, "author");
    assert.equal(next?.referenceReview?.referenceId, referenceReview.referenceId);
    const recheck = { ...issueInput, operationId: "reference-uncertain", observations: [{ ...issueInput.observations[0],
      referenceReviews: [{ ...issueInput.observations[0].referenceReviews[0], outcome: "inconclusive" as const, findingId: finding.id }] }] };
    const uncertain = await f.app.recordEditorialQualityReview(recheck);
    const uncertainId = uncertain.editorialReview!.evidenceRecords!.at(-1)!.id;
    await assert.rejects(f.app.recordEditorialQualityReview({ projectId: f.projectId, runId: f.run.id, revision: f.revision(), operationId: "reference-close-uncertain",
      passes: ["mute_visual"], previewEvidence: [], findings: [], resolutions: [{ findingId: finding.id, evidenceIds: [uncertainId], note: "仍未看清" }] }),
      { code: "REFERENCE_REVIEW_RESOLUTION_REQUIRED" });
    const checked = await f.app.recordEditorialQualityReview({ ...recheck, operationId: "reference-confirmed", observations: [{ ...recheck.observations[0],
      referenceReviews: [{ ...recheck.observations[0].referenceReviews[0], outcome: "confirmed" as const, actualImplementation: "主体已经接管", difference: "已修复" }] }] });
    const checkedId = checked.editorialReview!.evidenceRecords!.at(-1)!.id;
    await f.app.recordEditorialQualityReview({ projectId: f.projectId, runId: f.run.id, revision: f.revision(), operationId: "reference-close",
      passes: ["mute_visual"], previewEvidence: [], findings: [], resolutions: [{ findingId: finding.id, evidenceIds: [checkedId], note: "已复查接管" }] });
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
  const f = await fixture("visual_rework");
  try {
    const assigned = await f.app.updateProductionRun({ projectId: f.projectId, runId: f.run.id, expectedAuditVersion: f.run.auditVersion,
      operationId: "assign-all", action: "add_assignment", assignment: { assignmentId: "original", agentId: "/fixture/original",
        responsibilities: ["creative_research", "visual_design", "motion_research", "director", "narration", "asset_sourcing"],
        skillIds: ["production-director", "narration-writing", "visual-asset-sourcing", "creative-sequence-design", "visual-treatment-planning", "creative-reference-to-sequence", "motion-case-library"],
        scope: { kind: "project" }, inputRevision: f.revision() } });
    await f.app.updateProductionRun({ projectId: f.projectId, runId: f.run.id, expectedAuditVersion: assigned.auditVersion,
      operationId: "replace-one", action: "replace_assignment", assignment: { assignmentId: "new-creative", agentId: "/fixture/new",
        responsibilities: ["creative_research"], skillIds: ["creative-sequence-design"], scope: { kind: "objects", objectIds: [f.scene.id] },
        inputRevision: f.revision(), supersedesAssignmentId: "original" } });
    const lateReport = await f.app.recordCreativeDecision({ projectId: f.projectId, runId: f.run.id, operationId: "late-result", category: "visual", phase: "creative_research",
      assignmentId: "original", inputRevision: f.revision(), objectIds: [f.scene.id], researchOutcome: "researched", researchCoverage: completeResearchCoverage,
      researchReferences: [{ kind: "creative", id: "001-c01", sourceSha256: creativeFingerprint, startMs: 0, endMs: 1000, observedRelation: "主体与文字共同变化" }], decision: "旧负责人迟到结果", rationale: "保留供接任者判断" });
    const report = await f.app.readSkillExecutionReport({ projectId: f.projectId, runId: f.run.id });
    const issues = await evaluateProductionCoordination({ report, snapshot: f.app.readProject(f.projectId).snapshot, scope: { kind: "project" },
      readRevision: revision => f.app.readProject(f.projectId, revision).snapshot });
    assert.ok(issues.some(issue => issue.code === "RESEARCH_PENDING" && issue.assignmentId === "new-creative"));
    assert.ok(!issues.some(issue => issue.code === "ASSIGNMENT_MISSING" && issue.message.includes("视觉设计")));
    const late = lateReport.creativeDecisions.at(-1)!;
    const motionReport = await f.app.recordCreativeDecision({ projectId: f.projectId, runId: f.run.id, operationId: "motion-result", category: "visual",
      phase: "motion_research", assignmentId: "original", inputRevision: f.revision(), objectIds: [f.scene.id], researchOutcome: "researched",
      researchReferences: [{ kind: "motion", id: "001-m01", sourceSha256: motionFingerprint }], evidence: ["已研究机制"], decision: "机制研究", rationale: "测试接替链" });
    const brief = join(f.root, "replacement-brief.md"), timing = join(f.root, "replacement-timing.md"), snapshot = join(f.root, "replacement-snapshot.json");
    const output = join(f.root, "replacement-handoff"), preparedRevision = f.revision();
    await writeFile(brief, directorBrief(visualPlan("主体"))); await writeFile(timing, "时间安排");
    await writeFile(snapshot, JSON.stringify(f.app.readProject(f.projectId)));
    await prepareReferencePackage({ projectId: f.projectId, revision: preparedRevision, projectSnapshot: snapshot, brief, timingPlan: timing,
      freezeInputs: true, selectedSceneIds: [f.scene.id], scenes: [{ sceneId: f.scene.id, status: "ready",
        visualRoles: [{ role: "主体", referenceFunction: "展示主体", usage: "主体图片", assetIds: [f.assetId] }],
        visualPlan: researchPlan("主体", late.id), process: "建立并发展", preserve: ["主体"], adapt: ["细节"] }] }, output);
    const manifestPath = join(output, "delivery-manifest.json"), manifestBytes = await readFile(manifestPath);
    const deliveryRef = { manifestPath, manifestSha256: createHash("sha256").update(manifestBytes).digest("hex"), sceneIds: [f.scene.id] };
    const designReport = await f.app.recordCreativeDecision({ projectId: f.projectId, runId: f.run.id, operationId: "design-result", category: "visual",
      phase: "visual_design", assignmentId: "original", inputRevision: preparedRevision, objectIds: [f.scene.id], inputDecisionIds: [late.id, motionReport.creativeDecisions.at(-1)!.id], decision: "视觉设计", rationale: "测试接替链", deliveryRef });
    const adoptionReport = await f.app.recordCreativeDecision({ projectId: f.projectId, runId: f.run.id, operationId: "adopt-late", category: "visual",
      phase: "adoption", assignmentId: "original", inputRevision: f.revision(), objectIds: [f.scene.id], inputDecisionIds: [designReport.creativeDecisions.at(-1)!.id], decision: "采用视觉", rationale: "测试接替链",
      deliveryRef });
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
    report = await f.app.recordCreativeDecision({ projectId: f.projectId, runId: f.run.id, operationId: "second-beat-research", category: "visual", phase: "creative_research",
      assignmentId: "author-1", inputRevision: f.revision(), objectIds: [beats[1]!.id], researchOutcome: "researched", decision: "第二拍研究", rationale: "只覆盖第二拍" });
    const second = report.creativeDecisions.at(-1)!;
    const snapshot = f.app.readProject(f.projectId).snapshot;
    assert.equal(referenceResearchOwnerAccepted(report, snapshot, snapshot.scenes.find(scene => scene.id === f.scene.id)!, undefined, second, "creative_research"), true,
      "同场其他拍的先前分派不能覆盖当前研究的真实负责人");
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
    const rejected = await client.callTool({ name: "record_creative_decision", arguments: { project_id: f.projectId, run_id: run.id,
      operation_id: "mcp-research", category: "visual", phase: "creative_research", assignment_id: "creative", input_revision: null,
      research_outcome: "pending", decision: "候选已回传", rationale: "仍需连续观察" } });
    assert.equal(rejected.isError, true);
    const rejection = JSON.parse((rejected.content as Array<{ text: string }>)[0]!.text);
    assert.deepEqual({ code: rejection.code, stage: rejection.stage, sideEffects: rejection.sideEffects,
      safeToRetry: rejection.safeToRetry, recovery: rejection.recovery }, { code: "PRODUCTION_DECISION_SOURCE_REQUIRED", stage: "validation",
      sideEffects: "none", safeToRetry: true, recovery: "correct_input" });
    const afterRejected = await f.app.readSkillExecutionReport({ projectId: f.projectId, runId: run.id });
    assert.ok(!afterRejected.operations!.some(operation => operation.id === "mcp-research"));
    const readCard = await call("read_creative_case", { id: "016-c01", include_storyboard: false });
    const originalHash = createHash("sha256").update(await readFile(readCard.resources.video.absolute_path)).digest("hex");
    const wrongHash = await client.callTool({ name: "record_creative_decision", arguments: { project_id: f.projectId, run_id: run.id,
      operation_id: "mcp-wrong-hash", category: "visual", phase: "creative_research", assignment_id: "creative", input_revision: f.revision(),
      object_ids: [f.projectId], research_outcome: "researched", research_references: [{ kind: "creative", id: "016-c01", source_sha256: originalHash }],
      decision: "研究记录", rationale: "验证原片哈希不能代替库指纹" } });
    assert.equal(wrongHash.isError, true);
    const wrongHashResult = JSON.parse((wrongHash.content as Array<{ text: string }>)[0]!.text);
    assert.equal(wrongHashResult.code, "PRODUCTION_RESEARCH_REFERENCE_STALE");
    assert.equal(wrongHashResult.sideEffects, "none");assert.match(wrongHashResult.message, /016-c01.*source_sha256/u);
    assert.ok(!(await f.app.readSkillExecutionReport({ projectId: f.projectId, runId: run.id })).operations!.some(operation => operation.id === "mcp-wrong-hash"));
    const pendingReport = await call("record_creative_decision", { project_id: f.projectId, run_id: run.id, operation_id: "mcp-research", category: "visual",
      phase: "creative_research", assignment_id: "creative", input_revision: f.revision(), object_ids: [f.projectId], research_outcome: "pending",
      research_references: [{ kind: "creative", id: "016-c01", source_sha256: creativeFingerprint }], decision: "候选已回传", rationale: "仍需连续观察" });
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
    const completeReport = await call("record_creative_decision", { project_id: f.projectId, run_id: run.id, operation_id: "mcp-research-complete", category: "visual",
      phase: "creative_research", assignment_id: "creative", input_revision: f.revision(), object_ids: [f.projectId], research_outcome: "researched",
      research_coverage: { overall_visual: "covered", scene_composition: "covered", motion_mechanisms: "covered", blocking_questions: [],
        layer_notes: { overall_visual: "暖白背景与真实素材共同构图", scene_composition: "机械臂与数字共同发展", motion_mechanisms: "扫描后数字接管" } },
      research_references: [{ kind: "creative", id: "016-c01", source_sha256: creativeFingerprint, start_ms: 100.5, end_ms: 900.25, observed_relation: "主体切入小窗" }], decision: "研究已回传", rationale: "记录实际参考与比较" });
    const savedResearch = completeReport.creativeDecisions.find((entry: { operationId: string }) => entry.operationId === "mcp-research-complete");
    assert.deepEqual(savedResearch.researchReferences[0], { kind: "creative", id: "016-c01", sourceSha256: creativeFingerprint,
      startMs: 100.5, endMs: 900.25, observedRelation: "主体切入小窗" });
    assert.deepEqual(savedResearch.researchCoverage, { ...completeResearchCoverage, layerNotes: {
      overallVisual: "暖白背景与真实素材共同构图", sceneComposition: "机械臂与数字共同发展", motionMechanisms: "扫描后数字接管"
    } });
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
        { referenceId: "ref-a", referenceKind: "creative", researchDecisionId: "creative", startMs: 100, endMs: 900, targetRole: "素材", treatment: "多画框", preserveRelation: "主体接管" },
        { referenceId: "ref-b", referenceKind: "creative", researchDecisionId: "creative", startMs: 200, endMs: 800, targetRole: "素材", treatment: "画框接续", preserveRelation: "持续运动" }
      ] } }] };
    const manifestBytes = JSON.stringify(manifest);
    const manifestPath = join(f.root, "two-refs.json");
    await writeFile(manifestPath, manifestBytes);
    const deliveryRef = { manifestPath, manifestSha256: createHash("sha256").update(manifestBytes).digest("hex"), sceneIds: [f.scene.id] };
    const assignment = { assignmentId: "creative-owner", agentId: "/fixture/creative", responsibilities: ["director", "narration", "asset_sourcing", "creative_research", "visual_design", "motion_research"],
      skillIds: ["production-director", "narration-writing", "visual-asset-sourcing", "creative-sequence-design", "visual-treatment-planning", "creative-reference-to-sequence", "motion-case-library"], scope: { kind: "project" }, inputRevision: f.revision(), operationId: "assign" } as const;
    const report = structuredClone(f.run);
    report.assignments = [assignment as any];
    const baseDecision = { category: "visual", decision: "测试", rationale: "测试", objectIds: [f.scene.id],
      assignmentId: assignment.assignmentId, inputRevision: f.revision(), evidence: ["测试"], createdAt: new Date().toISOString() };
    report.creativeDecisions = [
      { ...baseDecision, id: "creative", phase: "creative_research", researchOutcome: "researched", researchCoverage: completeResearchCoverage, researchReferences: [
        { kind: "creative", id: "ref-a", sourceSha256: sourceHashA, startMs: 100, endMs: 900, observedRelation: "主体接管" },
        { kind: "creative", id: "ref-b", sourceSha256: sourceHashB, startMs: 200, endMs: 800, observedRelation: "持续运动" }] },
      { ...baseDecision, id: "motion", phase: "motion_research", researchOutcome: "not_applicable" },
      { ...baseDecision, id: "design", phase: "visual_design", inputDecisionIds: ["creative", "motion"], deliveryRef },
      { ...baseDecision, id: "adoption", phase: "adoption", inputDecisionIds: ["design"], deliveryRef }
    ] as any;
    snapshot.visualTreatments.push({ id: "treatment", sceneId: f.scene.id, mode: "b_roll",
      adoptedDecisionRef: { productionRunId: report.id, decisionId: "adoption" } } as any);
    const ref = (referenceId: string, sourceSha256: string, startMs: number, endMs: number) => ({
      productionRunId: report.id, decisionId: "adoption", sceneId: f.scene.id, referenceKind: "creative" as const,
      referenceId, sourceSha256, targetRole: "素材", startMs, endMs, originalRelation: "参考主体运动", actualImplementation: "本片主体运动", difference: "无", outcome: "confirmed" as const
    });
    const evidence = (id: string, reference: ReturnType<typeof ref>) => ({ id, revision: f.revision(), source: "workbench" as const,
      pass: "mute_visual" as const, method: "continuous_video" as const, observer: "测试作者", observation: "实际对照声明",
      startFrame: 0, endFrame: 24, recordedAt: new Date().toISOString(), referenceReviews: [reference] });
    const first = evidence("observation-a", ref("ref-a", sourceHashA, 100, 900));
    const second = evidence("observation-b", ref("ref-b", sourceHashB, 200, 800));
    const review = { revision: f.revision(), passes: ["mute_visual" as const], previewEvidence: [], findings: [], reviewedAt: new Date().toISOString(),
      evidenceRecords: [first], applicableEvidence: [{ evidenceId: first.id, targetRevision: f.revision(), startFrame: 0, endFrame: 24 }] };
    const evaluate = () => evaluateProductionCoordination({ report, snapshot, scope: { kind: "project" }, review, readRevision: () => snapshot, phase: "completion" });
    const previousCoverage = report.creativeDecisions[0].researchCoverage!;
    report.creativeDecisions[0].researchCoverage = { overallVisual: "covered", sceneComposition: "covered", motionMechanisms: "covered", blockingQuestions: [] };
    assert.ok(!(await evaluate()).some(issue => issue.code === "RESEARCH_PENDING" || issue.code === "RESEARCH_INPUT_PENDING"),
      "升级前已采用的研究继续沿原作品使用");
    report.creativeDecisions[0].researchCoverage = previousCoverage;
    const initial = (await evaluate()).filter(issue => issue.code === "REFERENCE_REVIEW_PENDING");
    assert.equal(initial.length, 1, JSON.stringify(initial));
    assert.equal(initial[0].referenceReview?.referenceId, "ref-b");
    assert.equal(initial[0].assignmentId, assignment.assignmentId);
    review.evidenceRecords.push(second);
    review.applicableEvidence.push({ evidenceId: second.id, targetRevision: f.revision(), startFrame: 0, endFrame: 24 });
    assert.equal((await evaluate()).filter(issue => issue.code === "REFERENCE_REVIEW_PENDING").length, 0);
    const mixed = { ...first, id: "mixed", referenceReviews: [first.referenceReviews[0], { ...second.referenceReviews[0], outcome: "issue", impact: "核心关系缺失" }] };
    const mixedReview = { ...review, evidenceRecords: [mixed], applicableEvidence: [{ evidenceId: mixed.id, targetRevision: f.revision(), startFrame: 0, endFrame: 24 }], findings: [] as any[] };
    const mixedIssues = () => evaluateProductionCoordination({ report, snapshot, scope: { kind: "project" }, review: mixedReview as any, readRevision: () => snapshot, phase: "completion" });
    assert.deepEqual((await mixedIssues()).filter(issue => issue.code === "REFERENCE_REVIEW_PENDING").map(issue => issue.referenceReview?.referenceId), ["ref-b"]);
    mixedReview.findings.push({ id: "finding-b", revision: f.revision(), severity: "major", category: "motion", pass: "mute_visual",
      summary: "缺少接管", evidence: "观察", impact: "核心关系缺失", frameRange: { startFrame: 0, endFrame: 24 }, referenceReview: mixed.referenceReviews[1] });
    assert.equal((await mixedIssues()).filter(issue => issue.code === "REFERENCE_REVIEW_PENDING").length, 0, "待修参考由现有问题承接");

    // 历史清单未标目标范围时，仍按完整场面判断观察覆盖。
    first.endFrame = 12; review.applicableEvidence[0].endFrame = 12;
    assert.ok((await evaluate()).some(issue => issue.code === "REFERENCE_REVIEW_PENDING" && issue.referenceReview?.referenceId === "ref-a"));
    first.endFrame = 24; review.applicableEvidence[0].endFrame = 24;

    // 同一卡的两段分别交接；其他问题 pending 不能阻止已有依据的关系。
    const research = structuredClone(report.creativeDecisions.find(item => item.id === "creative")!);
    research.id = "creative-local";
    research.researchOutcome = "pending";
    research.researchReferences = [{ kind: "creative", id: "ref-a", sourceSha256: sourceHashA,
      startMs: 200, endMs: 800, observedRelation: "另一段窗口交接" }];
    manifest.scenes[0].references[1] = { kind: "creative", id: "ref-a", sourceSha256: sourceHashA, startMs: 200, endMs: 800 };
    manifest.scenes[0].visualPlan.referenceMappings[1].referenceId = "ref-a";
    manifest.scenes[0].visualPlan.referenceMappings[1].researchDecisionId = research.id;
    report.creativeDecisions.push(research);
    report.creativeDecisions.find(item => item.id === "design")!.inputDecisionIds!.push(research.id);
    const sameCardBytes = JSON.stringify(manifest);
    await writeFile(manifestPath, sameCardBytes);
    deliveryRef.manifestSha256 = createHash("sha256").update(sameCardBytes).digest("hex");
    const authoring = () => evaluateProductionCoordination({ report, snapshot, scope: { kind: "project" }, readRevision: () => snapshot, phase: "authoring" });
    const usable = await authoring();
    assert.ok(!usable.some(issue => ["RESEARCH_PENDING", "RESEARCH_INPUT_PENDING", "REFERENCE_RESEARCH_UNLINKED", "REFERENCE_MAPPING_MISSING"].includes(issue.code)), JSON.stringify(usable));
    research.researchReferences![0].endMs = 500;
    research.researchReferences!.push({ kind: "creative", id: "ref-a", sourceSha256: sourceHashA, startMs: 500, endMs: 800, observedRelation: "接续观察" });
    assert.ok(!(await authoring()).some(issue => issue.code === "REFERENCE_RESEARCH_UNLINKED"), "同一研究决定的连续范围可以合并");
    research.researchReferences![1].startMs = 501;
    assert.ok((await authoring()).some(issue => issue.code === "REFERENCE_RESEARCH_UNLINKED" && issue.message.includes("500–501")));
    research.researchReferences!.pop();
    research.researchReferences![0].endMs = 800;
    research.researchReferences![0].startMs = 300;
    const wrongRange = await authoring();
    assert.ok(wrongRange.some(issue => issue.code === "REFERENCE_RESEARCH_UNLINKED" && issue.message.includes("200–800")));
    Object.assign(manifest.scenes[0].visualPlan.referenceMappings[0], { targetRange: { startFrame: 0, endFrame: 12 } });
    Object.assign(manifest.scenes[0].visualPlan.referenceMappings[1], { targetRange: { startFrame: 12, endFrame: 24 } });
    const scopedBytes = JSON.stringify(manifest);
    await writeFile(manifestPath, scopedBytes);
    deliveryRef.manifestSha256 = createHash("sha256").update(scopedBytes).digest("hex");
    const targetIssues = (startFrame: number, endFrame: number) => evaluateProductionCoordination({ report, snapshot, scope: { kind: "project" },
      readRevision: () => snapshot, phase: "authoring", targetRange: { startFrame, endFrame } });
    assert.ok(!(await targetIssues(0, 12)).some(issue => issue.code === "REFERENCE_RESEARCH_UNLINKED"));
    assert.ok((await targetIssues(12, 24)).some(issue => issue.code === "REFERENCE_RESEARCH_UNLINKED"));
    research.researchReferences![0].startMs = 200;
    // 新清单按每条参考的实际目标范围分别核对，不要求各自覆盖整场。
    first.endFrame = 12; review.applicableEvidence[0].endFrame = 12;
    second.startFrame = 12; review.applicableEvidence[1].startFrame = 12;
    second.referenceReviews = [ref("ref-a", sourceHashA, 200, 800)];
    assert.equal((await evaluate()).filter(issue => issue.code === "REFERENCE_REVIEW_PENDING").length, 0);
    manifest.scenes[0].visualPlan.referenceMappings[1].researchDecisionId = "unrelated";
    const wrongIdBytes = JSON.stringify(manifest);
    await writeFile(manifestPath, wrongIdBytes);
    deliveryRef.manifestSha256 = createHash("sha256").update(wrongIdBytes).digest("hex");
    assert.ok((await authoring()).some(issue => issue.code === "REFERENCE_RESEARCH_UNLINKED"));
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
