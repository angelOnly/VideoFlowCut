import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { createApplication } from "@videocut/application";
import { processClaimedJob } from "@videocut/job-runtime";
import { readRuntimeConfig } from "@videocut/project-overview";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { registerMotionTools } from "../apps/server/src/motion-tools.js";
import { prepareReferencePackage } from "../packages/edit-application/src/opendesign-reference-package.mjs";
import { motionBundleHash } from "../packages/edit-application/src/motion-input.js";
import { runMotionAuthoringJob } from "../apps/runtime/src/motion-authoring.js";
import { loadCreativeIndex, readCreativeCase } from "../references/motion-cases/skillry/tools/creative-library.mjs";
import { readLibraryMechanism } from "../references/motion-cases/skillry/tools/library-store.mjs";
import { motionFixture } from "./fixtures/managed-motion.js";
import { motionHtml } from "./fixtures/hyperframes.js";
import { completeResearchCoverage, directorBrief, visualPlan, researchPlan } from "./fixtures/visual-plan.mjs";

for (const wholeFilm of [false, true]) test(wholeFilm
  ? "整片首版一次送出两场并将跨场阶段回件接入同一作品"
  : "完整新制从零作品准备参考、自动送件并接回同一冻结作品", { timeout: 60_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-full-handoff-")), app = createApplication(root);
  const originalFetch = globalThis.fetch;
  let stopping = false;
  let worker: Promise<void> | undefined;
  let mcpClient: Client | undefined;
  try {
    const projectId = app.createProject({ name: "完整新制隔离验证", ...(wholeFilm ? { profile: "visual_explainer" as const } : {}) }).snapshot.project.id;
    const rev = () => app.readProject(projectId).revision.number;
    app.repository.commit(projectId, rev(), "隔离画布", snapshot => Object.assign(snapshot.timeline, { width: 320, height: 320, fps: 25 }));
    const scene = app.createScene({ projectId, baseRevision: rev(), type: "ExplainerScene", title: "真实素材场面", purpose: "验证交接", startFrame: 100, endFrame: 125 }).snapshot.scenes[0]!;
    const secondScene = wholeFilm ? app.createScene({ projectId, baseRevision: rev(), type: "ExplainerScene",
      title: "第二场真实素材", purpose: "验证跨场接回", startFrame: 125, endFrame: 150 }).snapshot.scenes.at(-1) : undefined;
    const sceneIds = [scene.id, ...(secondScene ? [secondScene.id] : [])];
    const endFrame = secondScene?.endFrame ?? scene.endFrame;
    const workLength = endFrame - scene.startFrame;
    const projectRoot = app.getProjectRoot(projectId), assetRelative = "assets/source/真实 主体 (测试).png", assetPath = join(projectRoot, assetRelative);
    await mkdir(dirname(assetPath), { recursive: true });
    const imageBytes = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+nmZkAAAAASUVORK5CYII=", "base64");
    await writeFile(assetPath, imageBytes);
    const asset = app.registerImportedAsset({ projectId, baseRevision: rev(), name: "真实主体", kind: "image", managedPath: assetRelative,
      sourceHash: createHash("sha256").update(imageBytes).digest("hex") }).asset;
    app.applyMediaAnalysis({ projectId, assetId: asset.id, metadata: { durationMs: 1000, width: 1, height: 1, hasAudio: false } });
    assert.equal(app.readProject(projectId).snapshot.motionWorks?.length ?? 0, 0);

    const run = await app.startProductionRun({ projectId, baseRevision: rev(), intent: "full_creation", completionScope: { kind: "project" },
      operationId: "full-run", loadedSkills: ["production-coordinator"] });
    await app.updateProductionRun({ projectId, runId: run.id, expectedAuditVersion: run.auditVersion, operationId: "assign-authors", action: "add_assignment",
      assignment: { assignmentId: "authors", agentId: "/fixture/authors", responsibilities: ["director", "narration", "asset_sourcing", "visual_design", "motion_research",
        ...(wholeFilm ? [] : ["creative_research" as const])],
        skillIds: ["production-director", "narration-writing", "visual-asset-sourcing", "creative-sequence-design", "visual-treatment-planning", "creative-reference-to-sequence", "motion-case-library"],
        scope: { kind: "project" }, inputRevision: rev() } });
    if (wholeFilm) await app.updateProductionRun({ projectId, runId: run.id, operationId: "assign-creative", action: "add_assignment",
      expectedAuditVersion: (await app.readSkillExecutionReport({ projectId, runId: run.id })).auditVersion,
      assignment: { assignmentId: "creative", agentId: "/fixture/creative", responsibilities: ["creative_research"],
        skillIds: ["creative-sequence-design", "creative-reference-to-sequence"], scope: { kind: "project" }, inputRevision: rev() } });
    const fingerprint = loadCreativeIndex(resolve("references/motion-cases/skillry")).source_sha256;
    const record = async (phase: "creative_research" | "motion_research" | "visual_design" | "adoption", extra: Record<string, unknown>) =>
      (await app.recordCreativeDecision({ projectId, runId: run.id, operationId: randomUUID(), category: "visual", phase,
        assignmentId: wholeFilm && phase === "creative_research" ? "creative" : "authors",
        inputRevision: rev(), objectIds: sceneIds, decision: "隔离场面", rationale: "依据测试参考和真实素材", ...extra })).creativeDecisions.at(-1)!;
    const actualVideo = (readCreativeCase(resolve("references/motion-cases/skillry"), { id: "002-c01", include_storyboard: false }).result.resources as { video: { absolute_path: string } }).video.absolute_path;
    const fileHash = createHash("sha256").update(await readFile(actualVideo)).digest("hex");
    await assert.rejects(record("creative_research", { researchOutcome: "researched", researchReferences: [{ kind: "creative", id: "002-c01", sourceSha256: fileHash }] }),
      /002-c01.*source_sha256.*顶层/u);
    const originalMotionHash = (readLibraryMechanism(resolve("references/motion-cases/skillry"), { id: "001-m03", include_storyboard: false }).result.card as { clip: { source_sha256: string } }).clip.source_sha256;
    await assert.rejects(record("motion_research", { researchOutcome: "researched", researchReferences: [{ kind: "motion", id: "001-m03", sourceSha256: originalMotionHash }] }),
      /001-m03.*source_sha256.*顶层/u);
    const research = await record("creative_research", { researchOutcome: "pending", evidence: ["其余候选仍待确认"], researchReferences: [
      { kind: "creative", id: "002-c01", sourceSha256: fingerprint, startMs: 0, endMs: 500, observedRelation: "主体切入小窗" },
      { kind: "creative", id: "002-c01", sourceSha256: fingerprint, startMs: 400, endMs: 1000, observedRelation: "文字留场，下一层开始进入" }
    ] });
    const motion = await record("motion_research", { researchOutcome: "not_applicable", evidence: ["当前场面没有采用机制"] });
    const brief = join(root, "brief.md"), timing = join(root, "timing.md"), snapshotPath = join(root, "snapshot.json"), output = join(root, "handoff");
    const authorRequest = "让真实主体先占满画面，再退到小窗。\n\n保留主体与文字，停稳后接续下一幅。";
    const sceneRequest = [`### 场面 ${scene.id}\n${authorRequest}`,
      ...(secondScene ? [`### 场面 ${secondScene.id}\n第二场沿真实素材入口接手，保持花字层次直到落点。`] : [])].join("\n\n");
    const plan = { ...visualPlan("主体"), referenceMappings: [{ referenceId: "002-c01", referenceKind: "creative", researchDecisionId: research.id,
      startMs: 100, endMs: 900, targetRole: "主体", treatment: "主体进入小窗", preserveRelation: "主体接管", targetRange: { startFrame: 100, endFrame: 125 } }] };
    let latestBrief = `最新版导演稿：\n${directorBrief(plan)}`;
    await writeFile(brief, latestBrief);
    await writeFile(timing, `成片 100–${endFrame} 帧，作品 0–${workLength} 帧。`);
    await writeFile(snapshotPath, JSON.stringify(app.readProject(projectId)));
    let manifestPath: string, manifestSha256: string;
    if (!wholeFilm) {
    const manifest = await prepareReferencePackage({ projectId, revision: rev(), projectSnapshot: snapshotPath, brief, timingPlan: timing, freezeInputs: true,
      deliveryPrefix: "handoffs/isolated", selectedSceneIds: [scene.id], assets: [{ id: asset.id, path: assetPath, purpose: "真实主体" }],
      creative: [{ id: "002-c01", sourceSha256: fingerprint, usage: "adopted", purpose: "主体接管" }],
      scenes: [{ sceneId: scene.id, status: "ready", references: [{ kind: "creative", id: "002-c01", sourceSha256: fingerprint,
        startMs: 100, endMs: 900, purpose: "主体进入小窗" }],
        visualRoles: [{ role: "主体", referenceFunction: "进入并接管", assetIds: [asset.id], usage: "真实主体" }],
        visualPlan: plan,
        process: "主体建立、进入小窗并接续", preserve: ["主体接管"], adapt: ["文字排版"] }] }, output);
    assert.equal(manifest.scenes?.[0].status, "ready", JSON.stringify(manifest.scenes?.[0]));
    manifestPath = join(output, "delivery-manifest.json");
    manifestSha256 = createHash("sha256").update(await readFile(manifestPath)).digest("hex");
    const pendingDesign = await record("visual_design", { inputDecisionIds: [research.id, motion.id], deliveryRef: { manifestPath, manifestSha256, sceneIds: [scene.id] } });
    await assert.rejects(record("adoption", { inputDecisionIds: [pendingDesign.id], deliveryRef: { manifestPath, manifestSha256, sceneIds: [scene.id] } }),
      { code: "PRODUCTION_RESEARCH_INCOMPLETE" });
    const blockedResearch = await record("creative_research", { researchOutcome: "researched", evidence: ["整体设计仍待确定"],
      researchCoverage: { ...completeResearchCoverage, blockingQuestions: ["主体空间关系尚未确定"] } });
    const blockedDesign = await record("visual_design", { inputDecisionIds: [research.id, blockedResearch.id, motion.id], deliveryRef: { manifestPath, manifestSha256, sceneIds: [scene.id] } });
    await assert.rejects(record("adoption", { inputDecisionIds: [blockedDesign.id], deliveryRef: { manifestPath, manifestSha256, sceneIds: [scene.id] } }),
      { code: "PRODUCTION_RESEARCH_INCOMPLETE" });
    await assert.rejects(record("creative_research", { researchOutcome: "researched", evidence: ["整体设计"],
      researchCoverage: { ...completeResearchCoverage, motionMechanisms: "not_applicable" } }), { code: "PRODUCTION_RESEARCH_COVERAGE_INVALID" });
    }
    const complete = await record("creative_research", { researchOutcome: "researched", evidence: ["整体视觉系统由视觉作者原创，真实主体与文字共同构图，其他候选继续研究"],
      researchCoverage: { ...completeResearchCoverage, motionMechanisms: "not_applicable", notApplicableReasons: { motionMechanisms: "当前场面无需局部机制" } } });
    const finalPlan = { ...researchPlan("主体", complete.id, ["overallVisual", "sceneComposition"]), referenceMappings: plan.referenceMappings };
    const allScenes = [scene, ...(secondScene ? [secondScene] : [])];
    const draftPath = join(root, "creative.md"), restagePath = join(root, "restage.png");
    await writeFile(draftPath, "主体先建立、缩入小窗并接续");
    await writeFile(restagePath, imageBytes);
    const scenePlans = allScenes.map(item => wholeFilm ? { ...finalPlan,
      units: [{ id: item.id, title: item.title, startFrame: item.startFrame, endFrame: item.endFrame,
        creativeDecisionId: research.id, creativeDraftId: "draft", restage: { resourceId: "restage", sourceMs: 500, projectFrame: item.startFrame } }],
      referenceMappings: finalPlan.referenceMappings.map(mapping => ({ ...mapping, unitId: item.id, use: "primary" as const,
        targetRange: { startFrame: item.startFrame, endFrame: item.endFrame } })),
      sequence: finalPlan.sequence.map(step => ({ ...step, unitId: item.id }))
    } : finalPlan);
    latestBrief = `最新版导演稿：\n${directorBrief(...scenePlans)}\n\n## 发给 OD 的完整请求\n\n${sceneRequest}\n\n## 交接附注\n这段附注不发送为请求正文。`;
    await writeFile(brief, latestBrief);
    const finalOutput = join(root, "final-handoff");
    const finalManifest = await prepareReferencePackage({ projectId, revision: rev(), projectSnapshot: snapshotPath, brief, timingPlan: timing, freezeInputs: true,
      deliveryPrefix: "handoffs/isolated-final", selectedSceneIds: sceneIds, assets: [{ id: asset.id, path: assetPath, purpose: "真实主体" }],
      creative: [{ id: "002-c01", sourceSha256: fingerprint, usage: "adopted", purpose: "主体接管" }],
      ...(wholeFilm ? { references: [{ id: "draft", usage: "adopted", purpose: "创意原稿", files: [{ path: draftPath, deliveredPath: "references/creative.md" }] },
        { id: "restage", usage: "adopted", purpose: "视觉复摆", files: [{ path: restagePath, deliveredPath: "references/restage.png" }] }] } : {}),
      scenes: allScenes.map((item, index) => ({ sceneId: item.id, status: "ready", references: [{ kind: "creative", id: "002-c01", sourceSha256: fingerprint,
        startMs: 100, endMs: 900, purpose: "主体进入小窗" }],
        ...(wholeFilm ? { resourceIds: ["draft", "restage"] } : {}),
        visualRoles: [{ role: "主体", referenceFunction: "进入并接管", assetIds: [asset.id], usage: "真实主体" }],
        visualPlan: scenePlans[index], process: "主体建立、进入小窗并接续", preserve: ["主体接管"], adapt: ["文字排版"] })) }, finalOutput);
    assert.equal(finalManifest.scenes?.[0].status, "ready", JSON.stringify(finalManifest.scenes?.[0]));
    manifestPath = join(finalOutput, "delivery-manifest.json");
    manifestSha256 = createHash("sha256").update(await readFile(manifestPath)).digest("hex");
    const design = await record("visual_design", { inputDecisionIds: [research.id, complete.id, motion.id], deliveryRef: { manifestPath, manifestSha256, sceneIds } });
    const candidate = await app.readProductionStatus(projectId, { runId: run.id, referenceDecisionId: design.id });
    assert.ok("authorRequest" in candidate && candidate.authorRequest?.text === sceneRequest);
    const comparison = candidate.referenceComparisons![0]!;
    assert.deepEqual(comparison.observations.map(item => [item.startMs, item.endMs, item.observedRelation]),
      [[0, 500, "主体切入小窗"], [400, 1000, "文字留场，下一层开始进入"]]);
    assert.equal(comparison.preserveRelation, "主体接管");
    assert.equal(comparison.purpose, "主体进入小窗");
    assert.deepEqual(comparison.sequence, scenePlans[0]?.sequence);
    const adoption = await record("adoption", { inputDecisionIds: [design.id], deliveryRef: { manifestPath, manifestSha256, sceneIds } });
    const treatment = app.manageVisualTreatment({ projectId, baseRevision: rev(), action: "upsert", sceneId: scene.id, mode: "b_roll", intensity: "medium",
      primaryAttention: "主体", narrativePurpose: "说明", adoptedMaterialAssetIds: [asset.id], adoptedDecisionRef: { productionRunId: run.id, decisionId: adoption.id } }).snapshot.visualTreatments[0]!;
    const secondTreatment = secondScene ? app.manageVisualTreatment({ projectId, baseRevision: rev(), action: "upsert", sceneId: secondScene.id, mode: "b_roll", intensity: "medium",
      primaryAttention: "主体", narrativePurpose: "说明", adoptedMaterialAssetIds: [asset.id], adoptedDecisionRef: { productionRunId: run.id, decisionId: adoption.id } }).snapshot.visualTreatments.at(-1) : undefined;
    const request = { projectId, baseRevision: rev(), productionRunId: run.id, visualTreatmentIds: [treatment.id, ...(secondTreatment ? [secondTreatment.id] : [])], idempotencyKey: "first",
      target: wholeFilm ? { action: "whole_film" as const } : { action: "create_cue" as const, sceneId: scene.id, layer: "fullscreen" as const, startFrame: 100, endFrame: 125,
        sourceStartFrame: 0, sourceEndFrame: 25, audioPolicy: "rebind_unchanged_events" as const }, openDesignRequest: { project: "isolated-od" } };
    await writeFile(brief, "视觉作者更新的导演稿");
    await assert.rejects(record("adoption", { inputDecisionIds: [design.id], deliveryRef: { manifestPath, manifestSha256, sceneIds } }),
      { code: "PRODUCTION_ADOPTION_DELIVERY_INVALID" });
    await writeFile(brief, latestBrief);
    const adoptedManifest = await readFile(manifestPath);
    await writeFile(manifestPath, Buffer.concat([adoptedManifest, Buffer.from(" ")]));
    await assert.rejects(app.startMotionAuthoring(request), (error: any) => error.issues?.some((issue: { code: string }) => issue.code === "DELIVERY_INVALID"),
      "清单变化后不能冒用原采用哈希");
    await writeFile(manifestPath, adoptedManifest);
    await assert.rejects(app.startMotionAuthoring({ ...request, openDesignRequest: { ...request.openDesignRequest, prompt: "主体退到小窗" } }),
      { code: "MOTION_AUTHORING_REQUEST_MISMATCH" });
    assert.equal(app.repository.listJobs(projectId).filter(item => item.kind === "motion_authoring").length, 0);
    const updateMaterials = (assetIds: string[]) => app.manageVisualTreatment({ projectId, baseRevision: rev(), action: "upsert", visualTreatmentId: treatment.id,
      sceneId: scene.id, mode: "b_roll", intensity: "medium", primaryAttention: "主体", narrativePurpose: "说明", adoptedMaterialAssetIds: assetIds,
      adoptedDecisionRef: { productionRunId: run.id, decisionId: adoption.id } });
    updateMaterials([]);
    const extraDelivery = await app.startMotionAuthoring({ ...request, baseRevision: rev(), idempotencyKey: "extra-delivery" });
    assert.ok(extraDelivery.id, "交付中包含其他资料时仍可开始制作");
    app.updateJob(extraDelivery.id, { status: "failed", result: {} });
    updateMaterials([asset.id]);
    request.baseRevision = rev();
    const mcpServer = new McpServer({ name: "range-test", version: "1.0.0" });
    registerMotionTools(mcpServer, app, () => projectId);
    mcpClient = new Client({ name: "range-test-client", version: "1.0.0" });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await mcpServer.connect(serverTransport); await mcpClient.connect(clientTransport);
    const submission = await mcpClient.callTool({ name: "start_motion_authoring", arguments: {
      project_id: projectId, base_revision_id: request.baseRevision, production_run_id: run.id,
      visual_treatment_ids: request.visualTreatmentIds, target: request.target,
      opendesign_request: request.openDesignRequest, idempotency_key: request.idempotencyKey
    } });
    assert.notEqual(submission.isError, true, JSON.stringify(submission.content));
    const job = app.trackJob(JSON.parse((submission.content as Array<{ text: string }>)[0]!.text).jobId);
    assert.equal((await app.startMotionAuthoring(request)).id, job.id);

    const source = motionHtml('<img data-vfc-image-slot="subject" style="width:32px;height:32px">', "", { width: 320, height: 320, fps: 25, durationInFrames: workLength });
    const { source: _unused, ...work } = { ...motionFixture, source, fps: 25, durationInFrames: workLength, imageBindings: { subject: asset.id } };
    const sourceBytes = Buffer.from(source), sha = (value: Buffer) => createHash("sha256").update(value).digest("hex");
    const manifestBytes = Buffer.from(JSON.stringify({ authorSubmissionId: "first-stage", sourceFile: "film.html", sourceSha256: sha(sourceBytes), work,
      readyRanges: [{ startFrame: 0, endFrame: 25 }], changedRanges: [] }));
    const sourcePart = { sha256: sha(sourceBytes), bytes: sourceBytes.length }, manifestPart = { sha256: sha(manifestBytes), bytes: manifestBytes.length };
    const bundleHash = motionBundleHash(sourcePart, manifestPart), frozenVersion = `run-one_${bundleHash}`;
    const receipt = { project: "isolated-od", run_id: "run-one", frozen_version: frozenVersion, bundle_sha256: bundleHash, source: sourcePart, manifest: manifestPart };
    const bundle = { receipt, source_base64: sourceBytes.toString("base64"), manifest_base64: manifestBytes.toString("base64") };
    const revisedBytes = Buffer.from(source.replace("</body>", "<!-- 修改主体进入画面 -->\n</body>"));
    const revisedManifest = Buffer.from(JSON.stringify({ authorSubmissionId: "revised-stage", sourceFile: "film.html", sourceSha256: sha(revisedBytes), work,
      readyRanges: [{ startFrame: 0, endFrame: workLength }], changedRanges: [{ startFrame: 5, endFrame: 10, reason: "调整主体进入" }] }));
    const revisedSourcePart = { sha256: sha(revisedBytes), bytes: revisedBytes.length }, revisedManifestPart = { sha256: sha(revisedManifest), bytes: revisedManifest.length };
    const revisedBundleHash = motionBundleHash(revisedSourcePart, revisedManifestPart), revisedVersion = `run-one_${revisedBundleHash}`;
    const revisedReceipt = { project: "isolated-od", run_id: "run-one", frozen_version: revisedVersion, bundle_sha256: revisedBundleHash,
      source: revisedSourcePart, manifest: revisedManifestPart };
    const revisedBundle = { receipt: revisedReceipt, source_base64: revisedBytes.toString("base64"), manifest_base64: revisedManifest.toString("base64") };
    const odRoot = join(root, "fake-od"), files = new Map<string, string>();
    let starts = 0, prompt = "", returnedAuthoring: unknown, feedback: Record<string, unknown> | undefined;
    globalThis.fetch = (async (url, options) => {
      const endpoint = new URL(String(url));
      if (endpoint.pathname === `/api/projects/${projectId}/motion-authoring/${job.id}/wait`) {
        return Response.json({ authoring: returnedAuthoring }, { headers: { "x-videoflowcut-release-id": readRuntimeConfig().runtime.releaseId } });
      }
      if (endpoint.pathname === "/api/projects/isolated-od/files" && (!options?.method || options.method === "GET")) {
        return Response.json({ files: [...files].map(([path, localPath]) => ({ path, localPath })) });
      }
      if (endpoint.pathname === "/api/projects/isolated-od/files" && options?.method === "POST") {
        const form = options.body as FormData, path = String(form.get("name")), file = form.get("file") as File;
        const localPath = join(odRoot, path);
        await mkdir(dirname(localPath), { recursive: true }); await writeFile(localPath, Buffer.from(await file.arrayBuffer()));
        files.set(path, localPath);
        return Response.json({ file: { path } });
      }
      if (endpoint.pathname === "/api/runs" && options?.method === "POST") {
        starts++; prompt = JSON.parse(String(options.body)).message; return Response.json({ runId: "run-one" });
      }
      if (endpoint.pathname === "/api/runs/run-one/steer" && options?.method === "POST") {
        feedback = JSON.parse(String(options.body)) as Record<string, unknown>;
        return Response.json({ accepted: true });
      }
      if (endpoint.pathname.endsWith("/events")) {
        const after = Number(endpoint.searchParams.get("after"));
        const body = after < 1 ? `id: 1\nevent: frozen_work\ndata: ${JSON.stringify(receipt)}\n\n`
          : feedback && after < 2 ? `id: 2\nevent: frozen_work\ndata: ${JSON.stringify(revisedReceipt)}\n\n` : "";
        return new Response(body, { headers: { "content-type": "text/event-stream" } });
      }
      if (endpoint.pathname.includes("/frozen-work/")) return Response.json(endpoint.pathname.endsWith(revisedVersion) ? revisedBundle : bundle);
      if (endpoint.pathname === "/api/runs/run-one") return Response.json({ status: feedback ? "succeeded" : "running" });
      return new Response("missing", { status: 404 });
    }) as typeof fetch;
    // 此处模拟作品初始化，仍走真实的冻结登记、采用和阶段回执；不声称做过浏览器渲染。
    worker = (async () => {
      while (!stopping) {
        const child = app.claimNextJob(["motion_generation", "motion_adoption"], 60_000);
        if (!child) { await new Promise(resolveWait => setTimeout(resolveWait, 20)); continue; }
        await processClaimedJob(app, child, async item => {
          if (item.kind === "motion_adoption") return app.completeMotionAdoption(item.id);
          const registered = app.completeSourceMotionWork(item.projectId, item.id);
          return { workId: registered.id, definitionHash: registered.definitionHash };
        });
      }
    })();
    const authoring = runMotionAuthoringJob(app, job, AbortSignal.timeout(30_000), { url: "http://isolated-od.invalid" });
    void authoring.catch(() => undefined);
    const deadline = Date.now() + 15_000;
    while (Date.now() < deadline) {
      returnedAuthoring = app.trackJob(job.id).result?.authoring;
      if ((returnedAuthoring as { receipts?: unknown[] } | undefined)?.receipts?.length) break;
      await new Promise(resolveWait => setTimeout(resolveWait, 20));
    }
    assert.ok((returnedAuthoring as { receipts?: unknown[] } | undefined)?.receipts?.length, "未接回首版阶段");
    const argumentsFor = (project_range: { startFrame: number; endFrame: number }) => ({ project_id: projectId, job_id: job.id, timeout_ms: 0,
      range_request: { run_id: "run-one", frozen_version: frozenVersion, project_range } });
    const mapped = await mcpClient.callTool({ name: "wait_motion_authoring", arguments: argumentsFor({ startFrame: 105, endFrame: 110 }) });
    assert.notEqual(mapped.isError, true, JSON.stringify(mapped.content));
    const response = JSON.parse((mapped.content as Array<{ type: string; text: string }>)[0]!.text);
    assert.deepEqual(response.requestedRangeMapping, { runId: "run-one", frozenVersion, projectRange: { startFrame: 105, endFrame: 110 },
      workRootRange: { startFrame: 5, endFrame: 10 } });
    assert.equal(response.referenceComparisons[0].identity.decisionId, adoption.id);
    const outside = await mcpClient.callTool({ name: "wait_motion_authoring", arguments: argumentsFor({ startFrame: 99, endFrame: 110 }) });
    assert.equal(outside.isError, true);
    const submitted = await fetch("http://isolated-od.invalid/api/runs/run-one/steer", { method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ frozenVersion, range: response.requestedRangeMapping.workRootRange, text: "请修正主体的进入" }) });
    assert.equal(submitted.status, 200);
    const result = await authoring as any;
    returnedAuthoring = result.authoring;
    assert.equal(result.authoring.status, "succeeded", JSON.stringify(result.authoring));
    assert.deepEqual(feedback?.range, { startFrame: 5, endFrame: 10 });
    assert.equal(feedback?.frozenVersion, frozenVersion);
    assert.equal(starts, 1);
    assert.ok(prompt.startsWith(sceneRequest + "\n\n"), "实际送件首段保留本场冻结正文");
    assert.equal(prompt.includes("这段附注不发送为请求正文。"), false);
    assert.match(prompt, /002-c01/);
    assert.match(prompt, /真实主体/);
    const schemaPrefix = "阶段清单 videoflowcut.authored-motion-manifest.v1 的输入 Schema：";
    const schemaLine = prompt.split("\n").find(line => line.startsWith(schemaPrefix));
    assert.ok(schemaLine, "制作端未收到阶段清单合同");
    const schema = JSON.parse(schemaLine.slice(schemaPrefix.length));
    assert.ok(["work", "readyRanges", "changedRanges"].every(field => schema.required.includes(field)));
    assert.ok(schema.properties.work.properties.videoBindings, "制作端未收到视频素材绑定字段");
    assert.equal(schema.properties.work.properties.videoBindings.propertyNames.pattern, "^[a-z][A-Za-z0-9_]{0,39}$");
    assert.match(prompt, /<img data-vfc-video-slot=/, "制作端未收到受管视频槽用法");
    assert.ok([...files.keys()].some(path => path.endsWith("visual-director-brief.md")));
    assert.ok([...files.keys()].some(path => path.endsWith("timing-plan.md")));
    assert.ok([...files.keys()].some(path => path.endsWith("video.mp4")));
    assert.ok([...files.keys()].some(path => path.endsWith("真实-主体-_测试_.png")));
    const uploadedBrief = [...files].find(([path]) => path.endsWith("visual-director-brief.md"))!;
    const uploadedScene = [...files].find(([path]) => path.endsWith("brief/scenes.json"))!;
    assert.equal(await readFile(uploadedBrief[1], "utf8"), latestBrief);
    const deliveredScene = JSON.parse(await readFile(uploadedScene[1], "utf8")).scenes[0];
    assert.equal("kind" in deliveredScene.visualRoles[0], false);
    assert.equal(deliveredScene.visualRoles[0].assets[0].assetId, asset.id);
    assert.equal(deliveredScene.visualPlan.referenceMappings[0].researchDecisionId, research.id);
    assert.match(prompt, new RegExp(asset.id));
    assert.deepEqual(result.authoring.receipts[0].rangeMappings, [{ projectRange: { startFrame: 100, endFrame: 125 }, workRootRange: { startFrame: 0, endFrame: 25 } }]);
    assert.equal(result.authoring.receipts.length, 2);
    assert.equal(result.authoring.receipts[0].workId, result.authoring.receipts[1].workId);
    assert.notEqual(result.authoring.receipts[0].definitionHash, result.authoring.receipts[1].definitionHash);
    assert.equal(result.authoring.receipts[1].frozenVersion, revisedVersion);
    assert.equal(app.readProject(projectId).snapshot.motionWorks?.length, 1);
    if (secondScene) {
      assert.deepEqual(result.authoring.receipts[1].rangeMappings, [
        { projectRange: { startFrame: 100, endFrame: 125 }, workRootRange: { startFrame: 0, endFrame: 25 } },
        { projectRange: { startFrame: 125, endFrame: 150 }, workRootRange: { startFrame: 25, endFrame: 50 } }
      ]);
      const cues = app.readProject(projectId).snapshot.effectCues;
      assert.deepEqual(cues.map(cue => [cue.sceneId, cue.authoringInputs?.map(input => input.visualTreatmentId)]),
        [[scene.id, [treatment.id]], [secondScene.id, [secondTreatment!.id]]]);
      assert.ok(prompt.includes(secondScene.id));
      const secondRange = await mcpClient.callTool({ name: "wait_motion_authoring", arguments: {
        project_id: projectId, job_id: job.id, timeout_ms: 0,
        range_request: { run_id: "run-one", frozen_version: revisedVersion, project_range: { startFrame: 120, endFrame: 135 } }
      } });
      assert.notEqual(secondRange.isError, true, JSON.stringify(secondRange.content));
      const crossScene = JSON.parse((secondRange.content as Array<{ text: string }>)[0]!.text);
      assert.deepEqual(crossScene.requestedRangeMapping.workRootRange, { startFrame: 20, endFrame: 35 });
      assert.deepEqual(crossScene.referenceComparisons.map((comparison: { identity: { sceneId: string } }) => comparison.identity.sceneId), sceneIds);
    }

    app.repository.commit(projectId, rev(), "核对完整解说导出门禁", snapshot => { snapshot.project.profile = "visual_explainer"; });
    assert.equal(app.submitExport({ projectId }).kind, "export", "采用对应的冻结作品允许正式导出");
    app.repository.commit(projectId, rev(), "模拟只有临时合成", snapshot => {
      for (const cue of snapshot.effectCues) delete cue.authoringInputs;
    });
    assert.throws(() => app.submitExport({ projectId }), { code: "EXPORT_AUTHORED_SCENES_INCOMPLETE" });
    assert.equal(app.submitExport({ projectId, purpose: "draft" }).kind, "export");
  } finally {
    stopping = true;
    if (worker) await worker;
    await mcpClient?.close();
    globalThis.fetch = originalFetch;
    app.close(); await rm(root, { recursive: true, force: true });
  }
});
