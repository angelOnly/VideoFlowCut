import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createApplication } from "@videocut/application";
import { prepareReferencePackage, scopeReferenceManifest, verifyReferenceDelivery } from "../packages/edit-application/src/opendesign-reference-package.mjs";
import { directorBrief, visualPlan } from "./fixtures/visual-plan.mjs";

test("采用检查必需素材，局部制作允许同一交付携带其他资料", { timeout: 60_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-visual-materials-"));
  const app = createApplication(root);
  try {
    const projectId = app.createProject({ name: "隔离素材交接" }).snapshot.project.id;
    const rev = () => app.readProject(projectId).revision.number;
    const first = app.createScene({ projectId, baseRevision: rev(), type: "ExplainerScene", title: "开场", purpose: "介绍", startFrame: 0, endFrame: 24 }).snapshot.scenes[0];
    const second = app.createScene({ projectId, baseRevision: rev(), type: "ExplainerScene", title: "后续", purpose: "接续", startFrame: 24, endFrame: 48 }).snapshot.scenes.find(scene => scene.id !== first.id)!;
    const beat = app.updateStory({ projectId, baseRevision: rev(), beats: [{ title: "跨场内容", purpose: "连续说明" }] }).snapshot.story.beats[0];
    app.repository.commit(projectId, rev(), "关联跨场内容", snapshot => {
      for (const scene of snapshot.scenes) scene.narrativeBeatIds = [beat.id];
      snapshot.story.beats[0].sceneIds = [first.id, second.id];
    });
    const projectRoot = app.getProjectRoot(projectId), sourceDir = join(projectRoot, "assets", "source");
    await mkdir(sourceDir, { recursive: true });
    const bytes = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+nmZkAAAAASUVORK5CYII=", "base64");
    const hash = createHash("sha256").update(bytes).digest("hex");
    const assets: string[] = [];
    for (const name of ["first.png", "background.png", "second.png", "missing.png"]) {
      await writeFile(join(sourceDir, name), bytes);
      const result = app.registerImportedAsset({ projectId, baseRevision: rev(), name, kind: "image", managedPath: `assets/source/${name}`, sourceHash: hash });
      app.applyMediaAnalysis({ projectId, assetId: result.asset.id, metadata: { width: 1, height: 1, durationMs: 1000, hasAudio: false } });
      assets.push(result.asset.id);
    }
    const createPlan = (sceneId?: string, narrativeBeatId?: string) => app.manageVisualTreatment({ projectId, baseRevision: rev(), action: "upsert",
      sceneId, narrativeBeatId, mode: "remotion", intensity: "medium", primaryAttention: "画面主体", narrativePurpose: "说明" }).snapshot.visualTreatments.at(-1)!;
    const firstPlan = createPlan(first.id), secondPlan = createPlan(first.id), laterPlan = createPlan(second.id), crossPlan = createPlan(undefined, beat.id);
    const run = await app.startProductionRun({ projectId, baseRevision: rev(), intent: "local_edit", completionScope: { kind: "project" },
      operationId: "start", loadedSkills: ["production-coordinator"] });
    await app.updateProductionRun({ projectId, runId: run.id, expectedAuditVersion: run.auditVersion, operationId: "assign", action: "add_assignment",
      assignment: { assignmentId: "authors", agentId: "/fixture/authors", responsibilities: ["director", "visual_design"],
        skillIds: ["production-director", "visual-treatment-planning"], scope: { kind: "project" }, inputRevision: rev() } });
    const brief = join(root, "brief.md"), timing = join(root, "timing.md"), snapshotPath = join(root, "snapshot.json"), output = join(root, "handoff");
    await writeFile(brief, directorBrief(visualPlan("主体"), visualPlan("后续")) + "\n背景");
    await writeFile(timing, "第一场 0—24 帧，第二场 24—48 帧。");
    const preparedRevision = rev();
    await writeFile(snapshotPath, JSON.stringify(app.readProject(projectId)));
    const role = (name: string, assetIds: string[]) => ({ role: name, referenceFunction: "连续说明", assetIds, usage: `${name}的照片、文字和图形共同呈现` });
    const manifest = await prepareReferencePackage({ projectId, revision: preparedRevision, projectSnapshot: snapshotPath, brief, timingPlan: timing,
      freezeInputs: true, selectedSceneIds: [first.id, second.id], scenes: [
        { sceneId: first.id, status: "ready", visualRoles: [role("主体", [assets[0], assets[1]]), role("背景", [assets[1]])],
          visualPlan: { ...visualPlan("主体"), primaryRoles: ["主体", "背景"] }, process: "建立主体并展示背景", preserve: ["画面关系"], adapt: ["细节"] },
        { sceneId: second.id, status: "ready", visualRoles: [role("后续", [assets[2]])],
          visualPlan: visualPlan("后续"), process: "展示后续并接续", preserve: ["画面关系"], adapt: ["细节"] }
      ] }, output);
    assert.deepEqual(manifest.scenes!.map(scene => scene.status), ["ready", "ready"]);
    assert.equal(manifest.files.filter(file => file.uses.some(use => use.kind === "source")).length, 3, "多个对象共用的素材只交付一次");
    assert.ok(manifest.scenes!.every(scene => scene.visualRoles!.every(item => !("kind" in item))));
    // 构造已固定的旧交付，验证读取原有 kind 时保留原字节与哈希。
    const legacy = structuredClone(manifest);
    for (const scene of legacy.scenes!) for (const item of scene.visualRoles!) Object.assign(item, { kind: "material" });
    const sceneFile = legacy.files.find(file => file.uses.some(use => use.kind === "brief" && use.id === "scenes"))!;
    const sceneBytes = Buffer.from(JSON.stringify({ projectId, revision: preparedRevision, scenes: legacy.scenes }, null, 2) + "\n");
    await writeFile(join(output, sceneFile.deliveredPath), sceneBytes);
    sceneFile.sha256 = sceneFile.sourceSha256 = createHash("sha256").update(sceneBytes).digest("hex");
    const manifestPath = join(output, "delivery-manifest.json");
    await writeFile(manifestPath, JSON.stringify(legacy, null, 2) + "\n");
    const legacyBytes = await readFile(manifestPath), manifestSha256 = createHash("sha256").update(legacyBytes).digest("hex");
    const listing = { files: legacy.files.map(file => ({ path: file.deliveredPath, localPath: join(output, file.deliveredPath) })) };
    const verified = await verifyReferenceDelivery(scopeReferenceManifest(legacy, [first.id]), listing, rev(), "isolated-od", app.readProject(projectId));
    assert.ok(verified.prompt, "旧交付可供新版制作端读取");
    assert.deepEqual(await readFile(manifestPath), legacyBytes, "读取旧交付不能改动固定字节");
    const deliveryRef = { manifestPath, manifestSha256, sceneIds: [first.id, second.id] };
    const record = async (phase: "visual_design" | "adoption", inputDecisionIds: string[] = []) =>
      (await app.recordCreativeDecision({ projectId, runId: run.id, operationId: randomUUID(), category: "visual", phase,
        assignmentId: "authors", inputRevision: phase === "visual_design" ? preparedRevision : rev(), objectIds: [first.id, second.id],
        inputDecisionIds, deliveryRef, decision: "画面设计", rationale: "按实际素材组织" })).creativeDecisions.at(-1)!;
    const design = await record("visual_design"), adoption = await record("adoption", [design.id]);
    const adoptedDecisionRef = { productionRunId: run.id, decisionId: adoption.id };
    const base = rev();
    assert.throws(() => app.applyVisualAdoptions({ projectId, baseRevision: base, adoptions: [
      { visualTreatmentId: firstPlan.id, adoptedDecisionRef, adoptedMaterialAssetIds: [assets[0]] },
      { visualTreatmentId: laterPlan.id, adoptedDecisionRef, adoptedMaterialAssetIds: [assets[0]] }
    ] }), { code: "VISUAL_TREATMENT_MATERIAL_INCOMPLETE" }, "另一场有素材不能抵消本场缺项");
    assert.equal(rev(), base, "批量失败应全部回滚");
    assert.equal(app.readProject(projectId).snapshot.visualTreatments.find(item => item.id === firstPlan.id)?.adoptedDecisionRef, undefined);
    app.applyVisualAdoptions({ projectId, baseRevision: rev(), adoptions: [
      { visualTreatmentId: firstPlan.id, adoptedDecisionRef, adoptedMaterialAssetIds: [assets[0]] },
      { visualTreatmentId: secondPlan.id, adoptedDecisionRef, adoptedMaterialAssetIds: [assets[1]] },
      { visualTreatmentId: laterPlan.id, adoptedDecisionRef, adoptedMaterialAssetIds: [assets[2]] },
      { visualTreatmentId: crossPlan.id, adoptedDecisionRef, adoptedMaterialAssetIds: [assets[0], assets[2]] }
    ] });
    const adoptedRevision = rev();
    assert.throws(() => app.manageVisualTreatment({ projectId, baseRevision: adoptedRevision, action: "upsert", visualTreatmentId: firstPlan.id,
      sceneId: first.id, mode: "remotion", intensity: "medium", primaryAttention: "修改", narrativePurpose: "说明", adoptedMaterialAssetIds: [assets[3]] }),
      { code: "VISUAL_TREATMENT_MATERIAL_INCOMPLETE" }, "普通更新沿用采用记录时也要检查素材");
    assert.equal(rev(), adoptedRevision);
    app.manageVisualTreatment({ projectId, baseRevision: rev(), action: "upsert", visualTreatmentId: firstPlan.id,
      sceneId: first.id, mode: "remotion", intensity: "medium", primaryAttention: "更新主体", narrativePurpose: "说明" });
    assert.deepEqual(app.readProject(projectId).snapshot.visualTreatments.find(item => item.id === firstPlan.id)?.adoptedMaterialAssetIds, [assets[0]]);
    const request = { projectId, baseRevision: rev(), productionRunId: run.id, intent: "local_edit" as const, visualTreatmentIds: [firstPlan.id],
      idempotencyKey: "local-first", target: { action: "create_cue" as const, sceneId: first.id, layer: "fullscreen" as const,
        startFrame: 0, endFrame: 24, sourceStartFrame: 0, sourceEndFrame: 24, audioPolicy: "rebind_unchanged_events" as const },
      openDesignRequest: { project: "isolated-od", prompt: "按已采用的画面制作" } };
    const job = await app.startMotionAuthoring(request);
    assert.ok(job.id, "同场其他计划的素材不会阻塞局部制作");
    app.updateJob(job.id, { status: "failed", result: {} });
    const laterFile = manifest.files.find(item => item.uses.some(use => use.kind === "source" && use.id === assets[2]))!;
    await writeFile(join(output, laterFile.deliveredPath), "另一场的损坏文件");
    const independent = await app.startMotionAuthoring({ ...request, idempotencyKey: "other-scene-damaged" });
    assert.ok(independent.id, "另一场的文件损坏不能阻止本场制作");
    app.updateJob(independent.id, { status: "failed", result: {} });
    const file = manifest.files.find(item => item.uses.some(use => use.kind === "source" && use.id === assets[0]))!;
    const path = join(output, file.deliveredPath);
    await writeFile(path, "损坏的交付");
    await assert.rejects(app.startMotionAuthoring({ ...request, idempotencyKey: "damaged" }), { code: "MOTION_AUTHORING_DELIVERY_INVALID" });
  } finally {
    app.close();
    await rm(root, { recursive: true, force: true });
  }
});
