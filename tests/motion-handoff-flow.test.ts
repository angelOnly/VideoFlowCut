import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { createServer } from "node:http";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { getDefaultEnvironment, StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { createApplication } from "@videocut/application";
import type { MotionAuthoringTreatmentInput, SkillExecutionReport } from "@videocut/contracts";
import { processClaimedJob } from "../packages/job-runtime/src/index.js";
import { motionBundleHash } from "../packages/edit-application/src/motion-input.js";
import { runMotionJob } from "../apps/render-worker/src/motion-job.js";
import { runMotionAuthoringJob } from "../apps/runtime/src/motion-authoring.js";
import { loadLibraryIndex } from "../references/motion-cases/skillry/tools/library-store.mjs";
import { loadCreativeIndex } from "../references/motion-cases/skillry/tools/creative-library.mjs";
import { motionFixture } from "./fixtures/managed-motion.js";
import { motionHtml } from "./fixtures/hyperframes.js";

function parse<T>(value: unknown): T {
  const result = value as { isError?: boolean; content: Array<{ type: string; text?: string }> };
  const text = result.content.filter(item => item.type === "text").map(item => item.text ?? "").join("\n");
  assert.notEqual(result.isError, true, text);
  return JSON.parse(text) as T;
}

function videoWork(assetId: string, text = "实际素材") {
  const source = motionHtml('<img id="subject" data-vfc-video-slot="footage" style="position:absolute;inset:0;width:320px;height:320px"><div id="title"></div>',
    "document.querySelector('#title').textContent=props.text;", { width: 320, height: 320, fps: 24, durationInFrames: 24 });
  return { ...motionFixture, source, fps: 24, durationInFrames: 24, props: { text },
    videoBindings: { footage: { assetId, sourceStartMs: 0, sourceEndMs: 1000, startFrame: 0, endFrame: 24 } } };
}

function frozenWork(assetId: string) {
  const { source, ...work } = videoWork(assetId);
  const sourceBytes = Buffer.from(source);
  const sha = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
  const manifest = Buffer.from(JSON.stringify({ authorSubmissionId: "stage", sourceFile: "film.html", sourceSha256: sha(sourceBytes), work,
    readyRanges: [{ startFrame: 0, endFrame: 24 }], changedRanges: [] }));
  const sourcePart = { sha256: sha(sourceBytes), bytes: sourceBytes.length };
  const manifestPart = { sha256: sha(manifest), bytes: manifest.length };
  const hash = motionBundleHash(sourcePart, manifestPart);
  return { receipt: { project: "isolated-od", run_id: "run-one", frozen_version: `run-one_${hash}`,
    bundle_sha256: hash, source: sourcePart, manifest: manifestPart },
    source_base64: sourceBytes.toString("base64"), manifest_base64: manifest.toString("base64") };
}

test("实际 MCP 交付、导演采用、阶段制作与失效局部续修贯通", { timeout: 120_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-handoff-flow-"));
  const app = createApplication(root);
  const transport = new StdioClientTransport({ command: process.execPath, args: ["--import", "tsx", "apps/server/src/mcp.ts"],
    cwd: process.cwd(), env: { ...getDefaultEnvironment(), VIDEOCUT_WORKSPACE: root }, stderr: "pipe" });
  const client = new Client({ name: "handoff-flow-regression", version: "1.0.0" });
  let stopWorker = false;
  let worker: Promise<void> | undefined;
  let server: ReturnType<typeof createServer> | undefined;
  try {
    const projectId = app.createProject({ name: "隔离场面交付" }).snapshot.project.id;
    const rev = () => app.readProject(projectId).revision.number;
    app.repository.commit(projectId, rev(), "隔离画布", snapshot => Object.assign(snapshot.timeline, { width: 320, height: 320, fps: 30 }));
    const scene = app.createScene({ projectId, baseRevision: rev(), type: "ExplainerScene", title: "已就绪场面", purpose: "验证交接", startFrame: 0, endFrame: 30 }).snapshot.scenes[0];
    const pendingScene = app.createScene({ projectId, baseRevision: rev(), type: "ExplainerScene", title: "待补场面", purpose: "并行取材", startFrame: 30, endFrame: 60 }).snapshot.scenes.find(item => item.id !== scene.id)!;
    const sourcePath = join(app.readProject(projectId).snapshot.project.rootPath, "assets", "source", "subject.mp4");
    await mkdir(join(app.readProject(projectId).snapshot.project.rootPath, "assets", "source"), { recursive: true });
    execFileSync("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "testsrc2=s=64x64:r=24:d=1", "-c:v", "libx264", "-pix_fmt", "yuv420p", sourcePath]);
    const sourceHash = createHash("sha256").update(await readFile(sourcePath)).digest("hex");
    const importedVideo = app.registerImportedAsset({ projectId, baseRevision: rev(), name: "实际主体", kind: "video",
      managedPath: "assets/source/subject.mp4", sourceHash });
    app.applyMediaAnalysis({ projectId, assetId: importedVideo.asset.id, metadata: { width: 64, height: 64, durationMs: 1000, hasAudio: false } });
    const previewJob = app.registerMotionWork({ projectId, baseRevision: rev(), idempotencyKey: "preview-before-handoff", work: videoWork(importedVideo.asset.id) });
    const previewClaim = app.claimNextJob(["motion_generation"], 60_000);
    assert.equal(previewClaim?.id, previewJob.id);
    await processClaimedJob(app, previewClaim!, (item, signal) => runMotionJob(app, item, undefined, signal));
    const previewWorkId = app.trackJob(previewJob.id).result?.workId;
    assert.equal(typeof previewWorkId, "string");
    const report = await app.startProductionRun({ operationId: globalThis.crypto.randomUUID(), baseRevision: app.readProject(projectId).revision.number, intent: "local_edit", completionScope: { kind: "project" }, projectId, loadedSkills: ["production-coordinator"] });
    const brief = join(root, "brief.md"), timing = join(root, "timing.md");
    await writeFile(brief, "完整连续画面及准确文字");
    await writeFile(timing, "依据实际声音安排时间");
    await client.connect(transport);
    const libraryRoot = join(process.cwd(), "references", "motion-cases", "skillry");
    const index = loadLibraryIndex(libraryRoot), creative = loadCreativeIndex(libraryRoot);
    const prepared = parse<{ manifestPath: string; manifestSha256: string; scenes: Array<{ sceneId: string; status: string }>;
      diagnostics: Array<{ id?: string; requiredForRun?: boolean }>; files: Array<{ path: string; localPath: string; requiredForRun: boolean; uses: Array<{ kind: string }> }> }>(await client.callTool({
      name: "prepare_motion_handoff", arguments: { project_id: projectId, base_revision_id: rev(), brief_path: brief, timing_plan_path: timing,
        selected_scene_ids: ["a"], assets: [{ id: importedVideo.asset.id, purpose: "真实主体" }, { id: "missing-b", purpose: "等待真实素材" }],
        creative: [{ id: "002-c01", sourceSha256: creative.source_sha256, usage: "adopted", purpose: "参考画面组织" }],
        motion: [{ id: "003-m01", sourceSha256: index.source_sha256, usage: "adopted", purpose: "待补场面的机制" }],
        references: [{ id: "missing-art", usage: "study", purpose: "下一场素材", files: [{ path: join(root, "missing-art.png"), deliveredPath: "references/art/missing.png" }] }], scenes: [
          { sceneId: "a", status: "ready", references: [{ kind: "creative", id: "002-c01", sourceSha256: creative.source_sha256,
            startMs: 0, endMs: 9800, purpose: "参考画面组织" }],
            visualRoles: [{ role: "主体", referenceFunction: "连续变化", assetIds: [importedVideo.asset.id],
              sourceRanges: [{ startMs: 0, endMs: 1000 }], usage: "展示真实主体" }],
            visualPlan: { status: "previewed", primaryRoles: ["主体"], preview: { workId: previewWorkId, startFrame: 0, endFrame: 24 },
              referenceMappings: [{ referenceId: "002-c01", referenceKind: "creative", targetRole: "主体", treatment: "真实主体接管", preserveRelation: "主体与文字共同变化" }] },
            process: "主体出现、发展并接续", preserve: ["连续过程"], adapt: ["中文文字"] },
          { sceneId: "b", status: "pending", references: [{ kind: "motion", id: "003-m01", sourceSha256: index.source_sha256,
            startMs: 0, endMs: 2080, purpose: "下一场机制" }], resourceIds: ["missing-art"],
            visualRoles: [{ role: "主体", referenceFunction: "动作", assetIds: ["missing-b"], usage: "待获取" }] }
        ] }
    }));
    assert.deepEqual(prepared.scenes.map(item => item.status), ["ready", "pending"]);
    const scenesFile = prepared.files.find(file => file.path.endsWith("/brief/scenes.json"));
    assert.ok(scenesFile);
    const deliveredScenes = JSON.parse(await readFile(scenesFile.localPath, "utf8"));
    assert.deepEqual(deliveredScenes.scenes[0].visualPlan.referenceMappings[0], { referenceId: "002-c01", referenceKind: "creative",
      targetRole: "主体", treatment: "真实主体接管", preserveRelation: "主体与文字共同变化" });
    assert.ok(prepared.diagnostics.some(item => item.requiredForRun === false));
    assert.ok(prepared.diagnostics.some(item => item.id === "003-m01" && item.requiredForRun === false));
    assert.ok(prepared.diagnostics.some(item => item.id === "missing-art" && item.requiredForRun === false));
    assert.ok(prepared.files.filter(file => file.uses.some(use => use.kind === "motion")).every(file => !file.requiredForRun));
    assert.ok(prepared.files.some(file => file.uses.some(use => use.kind === "preview")));
    assert.ok(prepared.files.every(file => file.path.startsWith("handoffs/")));
    await writeFile(brief, "另一场面更新后的原始稿");
    const fixedBrief = prepared.files.find(file => file.path.endsWith("brief/visual-director-brief.md"))!;
    assert.equal(await readFile(fixedBrief.localPath, "utf8"), "完整连续画面及准确文字");

    const delivery = { manifest_path: prepared.manifestPath, manifest_sha256: prepared.manifestSha256, scene_ids: ["a"] };
    const record = async (assignment: string) => {
      const current = await app.readSkillExecutionReport({ projectId, runId: report.id });
      const previous = current.assignments.at(-1);
      await app.updateProductionRun({ projectId, runId: report.id, expectedAuditVersion: current.auditVersion, operationId: `assign-${assignment}`, action: previous ? "replace_assignment" : "add_assignment",
        assignment: { agentId: "/test/director", assignmentId: assignment, responsibilities: ["director"], skillIds: ["production-director"], inputRevision: rev(), scope: { kind: "project" }, supersedesAssignmentId: previous?.assignmentId } });
      return parse<SkillExecutionReport>(await client.callTool({ name: "record_creative_decision", arguments: {
        project_id: projectId, run_id: report.id, operation_id: `decision-${assignment}`, category: "scene", decision: "采用共同场面", rationale: "依据实际编排",
        phase: "adoption", assignment_id: assignment, input_revision: rev(), object_ids: [scene.id], delivery_ref: delivery
      } })).creativeDecisions.at(-1)!;
    };
    const decision = await record("director-1");
    assert.equal(decision.assignmentId, "director-1");
    app.repository.commit(projectId, rev(), "其他场面独立变化", snapshot => {
      snapshot.project.name = "其他场面更新";
      snapshot.scenes.find(item => item.id === pendingScene.id)!.purpose = "继续补材";
    });
    const updateTreatment = async (decisionId: string, treatmentId?: string) => parse(await client.callTool({ name: "manage_visual_treatment", arguments: {
      project_id: projectId, base_revision_id: rev(), action: "upsert", visual_treatment_id: treatmentId, scene_id: scene.id,
      mode: "remotion", intensity: "medium", primary_attention: "主体", narrative_purpose: "连续解释",
      adopted_material_asset_ids: [importedVideo.asset.id], adopted_decision_ref: { production_run_id: report.id, decision_id: decisionId }
    } }));
    const beforeInvalid = rev();
    const invalidTreatment = await client.callTool({ name: "manage_visual_treatment", arguments: { project_id: projectId,
      base_revision_id: beforeInvalid, action: "upsert", scene_id: scene.id, mode: "remotion", intensity: "medium",
      primary_attention: "主体", narrative_purpose: "连续解释", adopted_decision_ref: { production_run_id: report.id, decision_id: "missing" } } });
    assert.equal(invalidTreatment.isError, true);
    assert.equal(rev(), beforeInvalid);
    await updateTreatment(decision.id);
    const treatmentId = app.readProject(projectId).snapshot.visualTreatments[0].id;
    const start = async (key: string, target: object) => parse<{ jobId: string }>(await client.callTool({ name: "start_motion_authoring", arguments: {
      project_id: projectId, base_revision_id: rev(), production_run_id: report.id, visual_treatment_ids: [treatmentId],
      idempotency_key: key, target, opendesign_request: { project: "isolated-od", prompt: "按完整共同编排制作" }
    } }));
    const target = { action: "create_cue", sceneId: scene.id, layer: "fullscreen", startFrame: 0, endFrame: 30,
      sourceStartFrame: 0, sourceEndFrame: 30, audioPolicy: "rebind_unchanged_events" };
    const missingTreatment = await client.callTool({ name: "start_motion_authoring", arguments: { project_id: projectId,
      base_revision_id: rev(), production_run_id: report.id, idempotency_key: "missing-treatment", target,
      opendesign_request: { project: "isolated-od", prompt: "当前场面" } } });
    assert.equal(missingTreatment.isError, true);
    app.repository.commit(projectId, rev(), "目标场面发生变化", snapshot => { snapshot.scenes.find(item => item.id === scene.id)!.purpose = "新的内容目标"; });
    const changedTarget = await client.callTool({ name: "start_motion_authoring", arguments: { project_id: projectId,
      base_revision_id: rev(), production_run_id: report.id, visual_treatment_ids: [treatmentId], idempotency_key: "changed-target", target,
      opendesign_request: { project: "isolated-od", prompt: "当前场面" } } });
    assert.equal(changedTarget.isError, true);
    assert.match(JSON.stringify(changedTarget.content), /场面、内容或声音时序.*变化/);
    app.repository.commit(projectId, rev(), "恢复已采用场面", snapshot => { snapshot.scenes.find(item => item.id === scene.id)!.purpose = "验证交接"; });
    const first = await start("first", target);
    assert.equal((await start("first", target)).jobId, first.jobId);
    assert.ok((await app.readProductionStatus(projectId)).work.pending.some(job => job.jobId === first.jobId));

    const bundle = frozenWork(importedVideo.asset.id);
    const delivered = prepared.files.filter(file => file.requiredForRun).map(file => ({ path: file.path, localPath: file.localPath }));
    let completeListing = false, starts = 0, receivedPrompt = "";
    let onRunStart: (() => Promise<void>) | undefined;
    server = createServer((request, response) => {
      const url = new URL(request.url!, "http://127.0.0.1");
      if (url.pathname === "/api/projects/isolated-od/files") {
        response.end(JSON.stringify({ files: completeListing ? delivered : delivered.slice(1) })); return;
      }
      if (request.method === "POST" && url.pathname === "/api/runs") {
        starts++;
        let body = ""; request.setEncoding("utf8"); request.on("data", chunk => { body += chunk; });
        request.on("end", () => { void (async () => {
          receivedPrompt = JSON.parse(body).message;
          if (onRunStart) await onRunStart();
          response.end(JSON.stringify({ runId: "run-one" }));
        })().catch(error => { response.statusCode = 500; response.end(String(error)); }); }); return;
      }
      if (url.pathname.endsWith("/events")) {
        response.setHeader("content-type", "text/event-stream");
        if (Number(url.searchParams.get("after")) < 1) response.write(`id: 1\nevent: frozen_work\ndata: ${JSON.stringify(bundle.receipt)}\n\n`);
        response.end(); return;
      }
      if (url.pathname.includes("/frozen-work/")) { response.end(JSON.stringify(bundle)); return; }
      if (url.pathname === "/api/runs/run-one") { response.end(JSON.stringify({ status: "succeeded" })); return; }
      response.statusCode = 404; response.end();
    });
    await new Promise<void>(resolve => server!.listen(0, "127.0.0.1", resolve));
    const endpoint = { url: `http://127.0.0.1:${(server.address() as { port: number }).port}` };
    const originalJob = app.trackJob(first.jobId);
    await assert.rejects(runMotionAuthoringJob(app, originalJob, new AbortController().signal, endpoint), /交付未就绪/);
    assert.equal(starts, 0, "文件未交付时不能启动制作作者");
    completeListing = true;
    app.repository.commit(projectId, rev(), "排队期间目标发生变化", snapshot => { snapshot.scenes.find(item => item.id === scene.id)!.purpose = "新的内容目标"; });
    await assert.rejects(runMotionAuthoringJob(app, originalJob, new AbortController().signal, endpoint), /启动前已变化/);
    assert.equal(starts, 0, "排队期间目标变化时不能启动制作作者");
    app.repository.commit(projectId, rev(), "恢复排队任务的目标", snapshot => { snapshot.scenes.find(item => item.id === scene.id)!.purpose = "验证交接"; });
    app.updateJob(first.jobId, { status: "queued", result: {} });
    worker = (async () => {
      while (!stopWorker) {
        const job = app.claimNextJob(["motion_generation", "motion_adoption"], 60_000);
        if (job) await processClaimedJob(app, job, (child, signal) => child.kind === "motion_generation" ? runMotionJob(app, child, undefined, signal) : app.completeMotionAdoption(child.id));
        else await new Promise(resolve => setTimeout(resolve, 25));
      }
    })();
    const result = await runMotionAuthoringJob(app, originalJob, new AbortController().signal, endpoint) as { authoring: { status: string; receipts: Array<{ authoringInputs: MotionAuthoringTreatmentInput[] }> } };
    assert.equal(result.authoring.status, "succeeded");
    assert.equal(starts, 1);
    assert.match(receivedPrompt, /完整共同编排/);
    assert.match(receivedPrompt, /就绪场面 a/);
    assert.match(receivedPrompt, /002-c01/);
    assert.match(receivedPrompt, /主体与文字共同变化/);
    assert.match(receivedPrompt, /预排引用仅供追溯/);
    assert.match(receivedPrompt, new RegExp(String(previewWorkId)));
    assert.match(receivedPrompt, new RegExp(importedVideo.asset.id));
    assert.equal(result.authoring.receipts[0].authoringInputs[0].adoptedDecisionRef.decisionId, decision.id);
    const cue = app.readProject(projectId).snapshot.effectCues[0];
    assert.equal(cue.authoringInputs?.[0].deliveryRef.manifestSha256, prepared.manifestSha256);
    assert.equal(app.readProject(projectId).snapshot.motionWorks?.find(work => work.id === cue.workId)?.videoSources[0].assetId, importedVideo.asset.id);
    app.updateJob(first.jobId, { status: "succeeded", result });
    app.repository.commit(projectId, rev(), "目标局部被缩短", snapshot => {
      const currentCue = snapshot.effectCues.find(item => item.id === cue.id)!;
      currentCue.endFrame = 20; currentCue.sourceEndFrame = 20;
    });
    const beforeScope = await app.readSkillExecutionReport({ projectId, runId: report.id });
    await app.updateProductionRun({ projectId, runId: report.id, expectedAuditVersion: beforeScope.auditVersion, operationId: "target-treatment",
      action: "update_scope", completionScope: { kind: "objects", objectIds: [treatmentId] }, reason: "本次收口该视觉计划" });
    const missingCoverage = await app.completeProductionRun({ operationId: globalThis.crypto.randomUUID(), projectId, runId: report.id, finalRevision: app.readProject(projectId).revision.number, completionScope: { kind: "objects", objectIds: [treatmentId] } });
    assert.ok(missingCoverage.completionBlockers.some(item => item.includes(first.jobId) && item.includes("20–30")));
    app.repository.commit(projectId, rev(), "恢复原目标范围", snapshot => {
      const currentCue = snapshot.effectCues.find(item => item.id === cue.id)!;
      currentCue.endFrame = 30; currentCue.sourceEndFrame = 30;
    });

    const imported = app.registerImportedAsset({ projectId, baseRevision: rev(), name: "动作声音", kind: "audio", managedPath: "assets/source/hit.wav" });
    app.applyMediaAnalysis({ projectId, assetId: imported.asset.id, metadata: { durationMs: 100, hasAudio: true } });
    app.manageAudio({ projectId, baseRevision: rev(), action: "create", kind: "sfx", assetId: imported.asset.id, purpose: "动作落点", eventFrame: 15, onsetOffsetFrames: 0,
      effectEvent: { effectCueId: cue.id, eventName: "动作落点", localFrame: 15 } });
    const nextDecision = await record("director-2");
    await updateTreatment(nextDecision.id, treatmentId);
    let snapshot = app.readProject(projectId).snapshot;
    assert.equal(snapshot.effectCues[0].status, "stale");
    assert.equal(snapshot.audioCues[0].status, "stale");
    app.updateEffectCue({ projectId, baseRevision: rev(), cueId: cue.id, assetBindings: [] });
    assert.equal(app.readProject(projectId).snapshot.effectCues[0].status, "stale");

    const replace = { action: "replace_range", cueId: cue.id, targetRange: { startFrame: 10, endFrame: 20 }, audioPolicy: "rebind_unchanged_events" };
    const second = await start("second", replace);
    const registration = app.registerMotionWork({ projectId, baseRevision: rev(), idempotencyKey: "revised-work",
      work: videoWork(importedVideo.asset.id, "修订内容") });
    const work = app.completeSourceMotionWork(projectId, registration.id);
    assert.throws(() => app.replaceManagedMotionRange({ projectId, baseRevision: rev(), cueId: cue.id, workId: work.id,
      startFrame: 10, endFrame: 20 }), /当前采用稿已变化/);
    const oldInputs = originalJob.payload.authoringInputs as MotionAuthoringTreatmentInput[];
    assert.throws(() => app.submitMotionAdoption({ projectId, baseRevision: rev(), idempotencyKey: "old-race",
      workId: work.id, target: replace as never, authoringInputs: oldInputs }), /当前采用稿已变化/);
    const authoringInputs = app.trackJob(second.jobId).payload.authoringInputs as MotionAuthoringTreatmentInput[];
    const adoption = app.submitMotionAdoption({ projectId, baseRevision: rev(), idempotencyKey: "partial-repair", workId: work.id, target: replace as never, authoringInputs });
    const adopted = await app.completeMotionAdoption(adoption.id);
    assert.equal((adopted.continuation as { status: string }).status, "applied");
    snapshot = app.readProject(projectId).snapshot;
    assert.deepEqual(snapshot.effectCues.map(item => [item.startFrame, item.endFrame, item.status]), [[0, 10, "stale"], [10, 20, "ready"], [20, 30, "stale"]]);
    assert.equal(snapshot.effectCues[1].authoringInputs?.[0].adoptedDecisionRef.decisionId, nextDecision.id);
    assert.equal(snapshot.audioCues[0].status, "stale");
    assert.equal(snapshot.timeline.items.find(item => item.id === snapshot.audioCues[0].timelineItemId)?.disabled, true);
    assert.ok((await app.readProductionStatus(projectId)).audio.pending.some(item => item.audioCueId === snapshot.audioCues[0].id));
    const completion = await app.completeProductionRun({ operationId: globalThis.crypto.randomUUID(), projectId, runId: report.id, finalRevision: app.readProject(projectId).revision.number, completionScope: { kind: "objects", objectIds: [treatmentId] } });
    assert.ok(completion.completionBlockers.some(item => item.includes(second.jobId)));
    app.updateJob(second.jobId, { status: "succeeded", result: { authoring: { status: "succeeded" } } });
    const unfinishedRepair = await app.completeProductionRun({ operationId: globalThis.crypto.randomUUID(), projectId, runId: report.id, finalRevision: app.readProject(projectId).revision.number, completionScope: { kind: "objects", objectIds: [treatmentId] } });
    assert.ok(unfinishedRepair.completionBlockers.some(item => item.includes("画面") && item.includes("仍待修订")));
    assert.ok(unfinishedRepair.completionBlockers.some(item => item.includes(snapshot.audioCues[0].id)));

    const thirdDecision = await record("director-3");
    const inFlight = await start("in-flight", { action: "replace_cue", cueId: snapshot.effectCues[1].id, audioPolicy: "rebind_unchanged_events" });
    onRunStart = async () => { await updateTreatment(thirdDecision.id, treatmentId); };
    await assert.rejects(runMotionAuthoringJob(app, app.trackJob(inFlight.jobId), new AbortController().signal, endpoint), /当前采用稿已变化/);
    const conflict = app.trackJob(inFlight.jobId).result?.authoring as { status: string; conflict: { code: string }; stage?: { workId?: string } };
    assert.equal(conflict.status, "incomplete");
    assert.equal(conflict.conflict.code, "MOTION_AUTHORING_TARGET_CONFLICT");
    assert.ok(conflict.stage?.workId, "冲突前已登记的作品应保留");
  } finally {
    stopWorker = true;
    await worker;
    if (server?.listening) await new Promise<void>(resolve => server!.close(() => resolve()));
    await client.close();
    app.close();
    assert.ok(relative(tmpdir(), root).startsWith("vfc-handoff-flow-"));
    await rm(root, { recursive: true, force: true });
  }
});
