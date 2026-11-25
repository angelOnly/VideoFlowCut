import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { getDefaultEnvironment, StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { createApplication } from "@videocut/application";
import type { MotionAuthoringTreatmentInput, SkillExecutionReport } from "@videocut/contracts";
import { processClaimedJob } from "@videocut/job-runtime";
import { prepareReferencePackage } from "../packages/edit-application/src/opendesign-reference-package.mjs";
import { motionBundleHash } from "../packages/edit-application/src/motion-input.js";
import { runMotionAuthoringJob } from "../apps/runtime/src/motion-authoring.js";
import { createServer as createVfcServer } from "../apps/server/src/app.js";
import { motionFixture } from "./fixtures/managed-motion.js";
import { completeResearchCoverage, directorBrief, visualPlan, researchPlan } from "./fixtures/visual-plan.mjs";

function frozenStage(endFrame: number) {
  const { source, ...work } = motionFixture;
  const sourceBytes = Buffer.from(source.replace("</body>", `<!--stage-${endFrame}--></body>`));
  const hash = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
  const manifest = Buffer.from(JSON.stringify({ authorSubmissionId: `stage-${endFrame}`, sourceFile: "film.html", sourceSha256: hash(sourceBytes), work,
    readyRanges: [{ startFrame: 0, endFrame }], changedRanges: [] }));
  const sourcePart = { sha256: hash(sourceBytes), bytes: sourceBytes.length }, manifestPart = { sha256: hash(manifest), bytes: manifest.length };
  const bundleHash = motionBundleHash(sourcePart, manifestPart);
  return { receipt: { project: "isolated-od", run_id: "run-one", frozen_version: `run-one_${bundleHash}`, bundle_sha256: bundleHash, source: sourcePart, manifest: manifestPart },
    source_base64: sourceBytes.toString("base64"), manifest_base64: manifest.toString("base64") };
}

test("候选登记不切换采用，正式采用在排队、传输和结果接回时生效", { timeout: 60_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-visual-revisions-"));
  const app = createApplication(root);
  const secondApp = createApplication(root);
  const transport = new StdioClientTransport({ command: process.execPath, args: ["--import", "tsx", "apps/server/src/mcp.ts"],
    cwd: process.cwd(), env: { ...getDefaultEnvironment(), VIDEOCUT_WORKSPACE: root }, stderr: "pipe" });
  const client = new Client({ name: "visual-revision-test", version: "1.0.0" });
  const files: Array<{ path: string; localPath: string }> = [];
  let starts = 0;
  let afterUpload: (() => Promise<void>) | undefined;
  let afterStart: (() => Promise<void>) | undefined;
  let stages: Array<ReturnType<typeof frozenStage>> = [];
  let visibleStages = 0;
  let stopping = false;
  let worker: Promise<void> | undefined;
  const server = createServer((request, response) => {
    const url = new URL(request.url!, "http://127.0.0.1");
    if (request.method === "GET" && url.pathname === "/api/projects/isolated-od/files") {
      void (async () => {
        if (afterUpload && files.some(file => file.path.endsWith("brief/scenes.json"))) {
          const callback = afterUpload;
          afterUpload = undefined;
          await callback();
        }
        response.end(JSON.stringify({ files }));
      })().catch(error => { response.statusCode = 500; response.end(String(error)); });
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/projects/isolated-od/files") {
      const chunks: Buffer[] = [];
      request.on("data", chunk => chunks.push(Buffer.from(chunk)));
      request.on("end", () => { void (async () => {
        const form = await new Request("http://isolated-od/files", { method: "POST", headers: { "content-type": request.headers["content-type"]! }, body: Buffer.concat(chunks) }).formData();
        const path = String(form.get("name")), file = form.get("file") as File;
        const localPath = join(root, "od", path);
        await mkdir(dirname(localPath), { recursive: true });
        await writeFile(localPath, Buffer.from(await file.arrayBuffer()));
        const previous = files.findIndex(item => item.path === path);
        if (previous >= 0) files.splice(previous, 1);
        files.push({ path, localPath });
        response.end(JSON.stringify({ file: { path } }));
      })().catch(error => { response.statusCode = 500; response.end(String(error)); }); });
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/runs") {
      starts++;
      if (afterStart) {
        const callback = afterStart; afterStart = undefined;
        void callback().then(() => response.end(JSON.stringify({ runId: "run-one" })))
          .catch(error => { response.statusCode = 500; response.end(String(error)); });
        return;
      }
      response.statusCode = 400;
      response.end("隔离测试已收到制作请求");
      return;
    }
    if (url.pathname === "/api/runs/run-one/events") {
      response.writeHead(200, { "content-type": "text/event-stream" });
      const after = Number(url.searchParams.get("after"));
      stages.slice(0, visibleStages).forEach((stage, index) => { if (index + 1 > after) response.write(`id: ${index + 1}\nevent: frozen_work\ndata: ${JSON.stringify(stage.receipt)}\n\n`); });
      response.end(); return;
    }
    if (url.pathname.includes("/frozen-work/")) {
      const version = decodeURIComponent(url.pathname.split("/").at(-1)!);
      response.end(JSON.stringify(stages.find(stage => stage.receipt.frozen_version === version))); return;
    }
    if (url.pathname === "/api/runs/run-one") { response.end(JSON.stringify({ status: visibleStages < stages.length ? "running" : "succeeded" })); return; }
    response.statusCode = 404;
    response.end();
  });
  try {
    const projectId = app.createProject({ name: "场面修订隔离验证" }).snapshot.project.id;
    const rev = () => app.readProject(projectId).revision.number;
    app.repository.commit(projectId, rev(), "隔离画布", snapshot => Object.assign(snapshot.timeline, { width: 320, height: 320, fps: 30 }));
    const a = app.createScene({ projectId, baseRevision: rev(), type: "ExplainerScene", title: "A", purpose: "建立", startFrame: 0, endFrame: 18 }).snapshot.scenes[0]!;
    const b = app.createScene({ projectId, baseRevision: rev(), type: "ExplainerScene", title: "B", purpose: "接续", startFrame: 18, endFrame: 36 }).snapshot.scenes.find(scene => scene.id !== a.id)!;
    const run = await app.startProductionRun({ projectId, baseRevision: rev(), intent: "visual_rework", completionScope: { kind: "project" }, operationId: "start", loadedSkills: ["production-coordinator"] });
    await app.updateProductionRun({ projectId, runId: run.id, expectedAuditVersion: run.auditVersion, operationId: "authors", action: "add_assignment",
      assignment: { assignmentId: "authors", agentId: "/fixture/authors", responsibilities: ["director", "narration", "asset_sourcing", "creative_research", "visual_design", "motion_research"],
        skillIds: ["production-director", "narration-writing", "visual-asset-sourcing", "creative-sequence-design", "visual-treatment-planning", "creative-reference-to-sequence", "motion-case-library"],
        scope: { kind: "project" }, inputRevision: rev() } });
    const research = async (phase: "creative_research" | "motion_research") => (await app.recordCreativeDecision({ projectId, runId: run.id,
      operationId: randomUUID(), category: "visual", phase, assignmentId: "authors", inputRevision: rev(), objectIds: [a.id, b.id],
      decision: "研究当前场面", rationale: "按本次素材判断", researchOutcome: phase === "creative_research" ? "researched" : "not_applicable",
      ...(phase === "creative_research" ? { researchCoverage: completeResearchCoverage } : {}), evidence: ["已检查候选并确认现有画面关系"] })).creativeDecisions.at(-1)!;
    const creative = await research("creative_research"), motion = await research("motion_research");
    const brief = join(root, "brief.md"), timing = join(root, "timing.md");
    const visualBrief = directorBrief(visualPlan("主体")) + `\n\n## 发给 OD 的完整请求\n### 场面 ${a.id}\n制作 A 场\n### 场面 ${b.id}\n制作 B 场`;
    await writeFile(brief, `A 原始画面；B 原始画面。\n${visualBrief}`);
    await writeFile(timing, "A 与 B 的时间安排。");
    const prepare = async (sceneIds: string[]) => {
      const revision = rev(), output = join(root, randomUUID());
      await mkdir(output, { recursive: true });
      const snapshotPath = join(output, "project-snapshot.json");
      await writeFile(snapshotPath, JSON.stringify(app.readProject(projectId)));
      const scene = (sceneId: string) => ({ sceneId, status: "ready", visualRoles: [{ role: "主体", referenceFunction: "连续发展", assetIds: [], usage: "原创主体" }],
        visualPlan: researchPlan("主体", creative.id), process: "主体建立、发展并接续", preserve: ["主体关系"], adapt: ["细节"] });
      await prepareReferencePackage({ projectId, revision, projectSnapshot: snapshotPath, brief, timingPlan: timing, freezeInputs: true,
        deliveryPrefix: `handoffs/${randomUUID()}`, selectedSceneIds: sceneIds, scenes: sceneIds.map(scene) }, output);
      const manifestPath = join(output, "delivery-manifest.json");
      return { inputRevision: revision, deliveryRef: { manifestPath, manifestSha256: createHash("sha256").update(await readFile(manifestPath)).digest("hex"), sceneIds } };
    };
    const design = async (pack: Awaited<ReturnType<typeof prepare>>, writer = app) => (await writer.recordCreativeDecision({
      projectId, runId: run.id, operationId: randomUUID(), category: "visual", phase: "visual_design", assignmentId: "authors", inputRevision: pack.inputRevision,
      objectIds: pack.deliveryRef.sceneIds, inputDecisionIds: [creative.id, motion.id], deliveryRef: pack.deliveryRef,
      decision: "视觉设计候选", rationale: "交导演判断" })).creativeDecisions.at(-1)!;
    const adopt = async (pack: Awaited<ReturnType<typeof prepare>>, designId: string) => (await app.recordCreativeDecision({ projectId, runId: run.id,
      operationId: randomUUID(), category: "visual", phase: "adoption", assignmentId: "authors", inputRevision: rev(), objectIds: pack.deliveryRef.sceneIds,
      inputDecisionIds: [designId], deliveryRef: pack.deliveryRef, decision: "采用设计", rationale: "已确认本次范围" })).creativeDecisions.at(-1)!;
    const initial = await prepare([a.id, b.id]);
    const original = await design(initial);
    const originalAdoption = await adopt(initial, original.id);
    const updateTreatment = (sceneId: string, adoptionId: string, visualTreatmentId?: string) => app.manageVisualTreatment({ projectId, baseRevision: rev(),
      action: "upsert", visualTreatmentId, sceneId, mode: "remotion", intensity: "medium", primaryAttention: "主体", narrativePurpose: "连续解释",
      adoptedMaterialAssetIds: [], adoptedDecisionRef: { productionRunId: run.id, decisionId: adoptionId } }).snapshot.visualTreatments.find(item => item.sceneId === sceneId)!;
    const treatmentA = updateTreatment(a.id, originalAdoption.id);
    const treatmentB = updateTreatment(b.id, originalAdoption.id);
    const target = (sceneId: string, startFrame: number) => ({ action: "create_cue" as const, sceneId, layer: "fullscreen" as const,
      startFrame, endFrame: startFrame + 18, sourceStartFrame: 0, sourceEndFrame: 18, audioPolicy: "rebind_unchanged_events" as const });
    const start = (sceneId: string, treatmentId: string, key: string, startFrame: number, continueFrom?: string) => app.startMotionAuthoring({ projectId, baseRevision: rev(),
      productionRunId: run.id, visualTreatmentIds: [treatmentId], idempotencyKey: key, target: target(sceneId, startFrame),
      openDesignRequest: { project: "isolated-od", ...(continueFrom ? { continue_from_run_id: continueFrom } : {}) } });
    const queuedA = await start(a.id, treatmentA.id, "a-queued", 0);
    await writeFile(brief, `A 原始画面；B 修改后的画面。\n${visualBrief}`);
    const bPack = await prepare([b.id]);
    const bManifest = JSON.parse(await readFile(bPack.deliveryRef.manifestPath, "utf8"));
    const bBrief = bManifest.files.find((file: any) => file.uses.some((use: any) => use.kind === "brief" && use.id === "brief"));
    const bBriefPath = join(bManifest.packageRoot, bBrief.deliveredPath);
    const bBriefBytes = await readFile(bBriefPath);
    await writeFile(bBriefPath, "固定副本损坏");
    await assert.rejects(design(bPack), (error: any) => error.code === "VISUAL_REVISION_DELIVERY_INVALID");
    await writeFile(bBriefPath, bBriefBytes);
    await client.connect(transport);
    const call = await client.callTool({ name: "record_creative_decision", arguments: { project_id: projectId, run_id: run.id, operation_id: "revise-b",
      category: "visual", phase: "visual_design", assignment_id: "authors", input_revision: bPack.inputRevision, object_ids: [b.id],
      input_decision_ids: [creative.id, motion.id],
      delivery_ref: { manifest_path: bPack.deliveryRef.manifestPath, manifest_sha256: bPack.deliveryRef.manifestSha256, scene_ids: [b.id] },
      decision: "修订 B", rationale: "B 的主体发展变化" } });
    assert.notEqual(call.isError, true, JSON.stringify(call.content));
    const bDesign = (JSON.parse((call.content as Array<{ text: string }>)[0]!.text) as SkillExecutionReport).creativeDecisions.at(-1)!;
    const statusB = await app.readProductionStatus(projectId, { runId: run.id, completionScope: { kind: "objects", objectIds: [b.id] } });
    assert.ok(!statusB.completion?.coordinationIssues.some(issue => issue.code === "VISUAL_DESIGN_SUPERSEDED"));

    await rename(brief, join(root, "moved-brief.md"));
    await rm(timing);
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
    const endpoint = { url: `http://127.0.0.1:${(server.address() as { port: number }).port}` };
    await assert.rejects(runMotionAuthoringJob(app, queuedA, new AbortController().signal, endpoint), /MOTION_AUTHORING_OD_HTTP: 400/);
    assert.equal(starts, 1, "B 的修订和原稿移动不能阻挡 A 使用固定副本启动");
    const copied = files.find(file => file.path.endsWith("brief/visual-director-brief.md"))!;
    assert.equal(await readFile(copied.localPath, "utf8"), `A 原始画面；B 原始画面。\n${visualBrief}`);
    app.updateJob(queuedA.id, { status: "failed", result: {} });

    const queuedAgain = await start(a.id, treatmentA.id, "a-before-revision", 0);
    await writeFile(brief, `A 修改后的画面；B 修改后的画面。\n${visualBrief}`);
    await writeFile(timing, "A 与 B 的时间安排。");
    const aPack = await prepare([a.id]);
    const b2Pack = await prepare([b.id]);
    const [aDesign, b2Design, b3Design] = await Promise.all([design(aPack), design(b2Pack), design(b2Pack, secondApp)]);
    assert.notEqual(b2Design.id, b3Design.id, "同一范围可并行登记候选");
    app.assertMotionAuthoringInputsCurrent(app.readProject(projectId).snapshot, a.id, queuedAgain.payload.authoringInputs as MotionAuthoringTreatmentInput[]);
    const adoptedA = await adopt(aPack, aDesign.id);
    app.assertMotionAuthoringInputsCurrent(app.readProject(projectId).snapshot, a.id, queuedAgain.payload.authoringInputs as MotionAuthoringTreatmentInput[]);
    app.applyVisualAdoptions({ projectId, baseRevision: rev(), adoptions: [{ visualTreatmentId: treatmentA.id,
      adoptedDecisionRef: { productionRunId: run.id, decisionId: adoptedA.id }, adoptedMaterialAssetIds: [] }] });
    await assert.rejects(runMotionAuthoringJob(app, queuedAgain, new AbortController().signal, endpoint), /采用稿已变化/);
    assert.equal(starts, 1, "排队期间正式采用新稿后不能发送旧制作请求");
    assert.equal((app.trackJob(queuedAgain.id).result?.authoring as { status: string }).status, "superseded");
    app.updateJob(queuedAgain.id, { status: "failed", result: {} });
    const currentJob = await start(a.id, treatmentA.id, "a-before-adoption", 0);
    const inputs = currentJob.payload.authoringInputs as MotionAuthoringTreatmentInput[];
    const registration = app.registerMotionWork({ projectId, baseRevision: rev(), idempotencyKey: "fixture-work", work: motionFixture });
    const work = app.completeSourceMotionWork(projectId, registration.id);
    const pendingAdoption = app.submitMotionAdoption({ projectId, baseRevision: rev(), idempotencyKey: "pending-adoption", workId: work.id,
      target: target(a.id, 0), authoringInputs: inputs });
    const a2Pack = await prepare([a.id]);
    const a2Design = await design(a2Pack);
    app.assertMotionAuthoringInputsCurrent(app.readProject(projectId).snapshot, a.id, inputs);
    const adoptedA2 = await adopt(a2Pack, a2Design.id);
    updateTreatment(a.id, adoptedA2.id, treatmentA.id);
    const adoptionResult = await app.completeMotionAdoption(pendingAdoption.id);
    assert.equal((adoptionResult.continuation as { status: string }).status, "needs_reconfirmation");
    assert.equal(app.readProject(projectId).snapshot.effectCues.length, 0, "接回期间的修订不能让旧作品写入时间线");
    app.updateJob(currentJob.id, { status: "failed", result: {} });

    const queuedDuringUpload = await start(a.id, treatmentA.id, "a-during-upload", 0);
    const a3Pack = await prepare([a.id]);
    files.length = 0;
    let a3Design: typeof a2Design | undefined;
    afterUpload = async () => {
      a3Design = await design(a3Pack);
      const adopted = await adopt(a3Pack, a3Design.id);
      updateTreatment(a.id, adopted.id, treatmentA.id);
    };
    await assert.rejects(runMotionAuthoringJob(app, queuedDuringUpload, new AbortController().signal, endpoint), /采用稿已变化/);
    assert.equal(starts, 1, "文件传输期间正式采用新稿后不能发送旧制作请求");
    assert.ok(a3Design);

    app.updateJob(queuedDuringUpload.id, { status: "failed", result: {} });
    const inFlight = await start(a.id, treatmentA.id, "a-in-flight", 0);
    const nextPack = await prepare([a.id]);
    const nextDesign = await design(nextPack);
    const nextAdoption = await adopt(nextPack, nextDesign.id);
    stages = [frozenStage(9), frozenStage(18)];
    visibleStages = 1;
    afterStart = async () => { updateTreatment(a.id, nextAdoption.id, treatmentA.id); };
    worker = (async () => {
      while (!stopping) {
        const child = app.claimNextJob(["motion_generation", "motion_adoption"], 60_000);
        if (child) await processClaimedJob(app, child, item => {
          if (item.kind === "motion_adoption") return app.completeMotionAdoption(item.id);
          const work = app.completeSourceMotionWork(item.projectId, item.id);
          return Promise.resolve({ workId: work.id, definitionHash: work.definitionHash });
        });
        else await new Promise(resolve => setTimeout(resolve, 25));
      }
    })();
    const controller = new AbortController();
    const firstRun = runMotionAuthoringJob(app, inFlight, controller.signal, endpoint);
    void firstRun.catch(() => undefined);
    const deadline = Date.now() + 10_000;
    while (Date.now() < deadline && !((app.trackJob(inFlight.id).result?.authoring as { receipts?: unknown[] } | undefined)?.receipts?.length)) {
      await new Promise(resolve => setTimeout(resolve, 25));
    }
    const firstReceipt = (app.trackJob(inFlight.id).result?.authoring as { receipts: unknown[] }).receipts[0];
    assert.ok(firstReceipt, "换稿后应先保存阶段回执");
    controller.abort();
    await assert.rejects(firstRun);
    visibleStages = 2;
    const returned = await runMotionAuthoringJob(app, inFlight, new AbortController().signal, endpoint) as {
      authoring: { status: string; cursor: number; receipts: Array<{ status: string; workId: string; definitionHash: string; pendingRanges: unknown[] }> }
    };
    assert.equal(returned.authoring.status, "incomplete");
    assert.equal(returned.authoring.cursor, 2);
    assert.equal(returned.authoring.receipts.length, 2, "换稿后继续接回后续阶段");
    assert.deepEqual(returned.authoring.receipts[0], firstReceipt, "恢复时保留已经接回的回执");
    for (const receipt of returned.authoring.receipts) {
      assert.equal(receipt.status, "needs_reconfirmation");
      assert.ok(receipt.pendingRanges.length);
      assert.ok(app.readSourceMotionWork(projectId, receipt.workId, undefined, receipt.definitionHash).work);
    }
    assert.equal(app.readProject(projectId).snapshot.effectCues.length, 0, "旧作品留存且未覆盖当前采用");
    stopping = true; await worker; worker = undefined;
    app.updateJob(inFlight.id, { status: "failed", result: { authoring: returned.authoring } });

    const crossScene = await prepare([a.id, b.id]);
    const crossDesign = await design(crossScene);
    const crossAdoption = await adopt(crossScene, crossDesign.id);
    const base = rev();
    const batch = [{ visual_treatment_id: treatmentA.id, adopted_decision_ref: { production_run_id: run.id, decision_id: crossAdoption.id }, adopted_material_asset_ids: [], primary_attention: "新的主体" },
      { visual_treatment_id: treatmentB.id, adopted_decision_ref: { production_run_id: run.id, decision_id: crossAdoption.id }, adopted_material_asset_ids: [] }];
    const invalid = await client.callTool({ name: "manage_visual_treatment", arguments: { project_id: projectId, base_revision_id: base, action: "adopt",
      adoptions: [batch[0], { ...batch[1], visual_treatment_id: "missing" }] } });
    assert.equal(invalid.isError, true);
    assert.equal(rev(), base, "批量采用失败应全部回滚");
    assert.notEqual(app.readProject(projectId).snapshot.visualTreatments.find(treatment => treatment.id === treatmentA.id)?.primaryAttention, "新的主体");
    const applied = await client.callTool({ name: "manage_visual_treatment", arguments: { project_id: projectId, base_revision_id: base, action: "adopt", adoptions: batch } });
    assert.notEqual(applied.isError, true, JSON.stringify(applied.content));
    assert.equal(rev(), base + 1);
    assert.equal(app.readProject(projectId).snapshot.visualTreatments.find(treatment => treatment.id === treatmentA.id)?.primaryAttention, "新的主体");
    for (const treatment of app.readProject(projectId).snapshot.visualTreatments) assert.equal(treatment.adoptedDecisionRef?.decisionId, crossAdoption.id);
    const repeated = await client.callTool({ name: "manage_visual_treatment", arguments: { project_id: projectId, base_revision_id: base, action: "adopt", adoptions: batch } });
    assert.notEqual(repeated.isError, true);
    assert.equal(rev(), base + 1, "重复请求返回已生效版本");
    const conflictCall = await client.callTool({ name: "manage_visual_treatment", arguments: { project_id: projectId, base_revision_id: base, action: "adopt",
      adoptions: [{ ...batch[0], adopted_decision_ref: { production_run_id: run.id, decision_id: originalAdoption.id } }] } });
    const conflict = JSON.parse((conflictCall.content as Array<{ text: string }>)[0]!.text);
    assert.equal(conflict.code, "REVISION_CONFLICT");
    assert.equal(conflict.currentRevision, base + 1);
    assert.equal(conflict.sideEffects, "none");
    const http = await createVfcServer({ workspaceRoot: root });
    try {
      const httpBatch = batch.map(item => ({ visualTreatmentId: item.visual_treatment_id,
        adoptedDecisionRef: { productionRunId: run.id, decisionId: crossAdoption.id }, adoptedMaterialAssetIds: [],
        ...(item.primary_attention ? { primaryAttention: item.primary_attention } : {}) }));
      const repeatedHttp = await http.app.inject({ method: "POST", url: `/api/projects/${projectId}/visual-treatments`,
        payload: { action: "adopt", baseRevision: base, adoptions: httpBatch } });
      assert.equal(repeatedHttp.statusCode, 200);
      const conflictingHttp = await http.app.inject({ method: "POST", url: `/api/projects/${projectId}/visual-treatments`,
        payload: { action: "adopt", baseRevision: base, adoptions: [{ ...httpBatch[0], adoptedDecisionRef: { productionRunId: run.id, decisionId: originalAdoption.id } }] } });
      assert.equal(conflictingHttp.statusCode, 409, "旧项目版本不能覆盖已生效的采用");
      assert.equal(rev(), base + 1);
    } finally {
      await http.app.close();
      http.application.close();
    }
    const finalJob = await start(a.id, treatmentA.id, "a-current", 0, "run-one");
    const currentInputs = finalJob.payload.authoringInputs as MotionAuthoringTreatmentInput[];
    const initialCueJob = app.submitMotionAdoption({ projectId, baseRevision: rev(), idempotencyKey: "create-cue", workId: work.id,
      target: target(a.id, 0), authoringInputs: currentInputs });
    const initialCueResult = await app.completeMotionAdoption(initialCueJob.id);
    assert.equal((initialCueResult.continuation as { status: string }).status, "applied");
    const cue = app.readProject(projectId).snapshot.effectCues[0]!;
    const replacementJob = app.registerMotionWork({ projectId, baseRevision: rev(), idempotencyKey: "register-with-replacement",
      work: { ...motionFixture, name: "修订后的候选作品" }, onSuccess: { action: "replace_cue", cueId: cue.id, audioPolicy: "rebind_unchanged_events" } });
    const a4Pack = await prepare([a.id]);
    const a4Design = await design(a4Pack);
    const adoptedA4 = await adopt(a4Pack, a4Design.id);
    updateTreatment(a.id, adoptedA4.id, treatmentA.id);
    const registered = app.completeSourceMotionWork(projectId, replacementJob.id);
    assert.ok(registered.id, "冲突时仍应保留已登记的固定作品");
    assert.equal((app.trackJob(replacementJob.id).result?.continuation as { status: string }).status, "needs_reconfirmation");
    assert.equal(app.readProject(projectId).snapshot.effectCues[0]!.workId, cue.workId, "旧设计下的替换不能写入时间线");
    assert.throws(() => app.replaceManagedMotionRange({ projectId, baseRevision: rev(), cueId: cue.id, workId: registered.id, startFrame: 0, endFrame: 9 }), /采用稿已变化/);
  } finally {
    stopping = true;
    if (worker) await worker;
    await client.close();
    if (server.listening) await new Promise<void>(resolve => server.close(() => resolve()));
    secondApp.close();
    app.close();
    await rm(root, { recursive: true, force: true });
  }
});
