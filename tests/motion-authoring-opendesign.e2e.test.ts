import test from "node:test";
import assert from "node:assert/strict";
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { createApplication } from "@videocut/application";
import { motionMediaForCue, motionWorkForCue } from "@videocut/contracts";
import { processClaimedJob } from "@videocut/job-runtime";
import { runMotionJob } from "../apps/render-worker/src/motion-job.js";
import { runMotionAuthoringJob } from "../apps/runtime/src/motion-authoring.js";
import { motionFixture } from "./fixtures/managed-motion.js";
import { prepareReferencePackage } from "../packages/edit-application/src/opendesign-reference-package.mjs";
import { createServer as createVfcServer } from "../apps/server/src/app.js";

test("隔离 OD 阶段交件、同作者反馈与 VFC 自动采用端到端联通", { timeout: 90_000 }, async (context) => {
  const root = await mkdtemp(join(tmpdir(), "vfc-od-authoring-e2e-"));
  const previousData = process.env.OD_DATA_DIR, previousTransport = process.env.OD_CODEX_TRANSPORT, previousRollout = process.env.OD_NEXT_STRATEGY_ROLLOUT;
  process.env.OD_DATA_DIR = join(root, "od-data");
  process.env.OD_CODEX_TRANSPORT = "app-server";
  process.env.OD_NEXT_STRATEGY_ROLLOUT = "off";
  const work = { ...motionFixture } as Record<string, unknown>, source = String(work.source); delete work.source;
  const executable = join(root, process.platform === "win32" ? "codex-fake.cmd" : "codex-fake");
  const script = process.platform === "win32" ? `${executable}.js` : executable;
  // 只在隔离测试进程模拟作者协议与阶段交件，不调用外部模型。
  const fake = `#!/usr/bin/env node
const fs = require('node:fs');
if (process.argv.includes('--version')) { console.log('codex-cli 0.153.4'); process.exit(0); }
if (process.argv.includes('login')) { console.log('Logged in'); process.exit(0); }
if (process.argv.includes('--help')) { console.log('codex app-server'); process.exit(0); }
if (!process.argv.includes('app-server')) { console.error('unexpected invocation'); process.exit(2); }
const source=${JSON.stringify(source)}, work=${JSON.stringify(work)};
let buffer='';
function send(frame){ process.stdout.write(JSON.stringify(frame)+'\\n'); }
async function stage(end, partial=false){
 fs.mkdirSync('output',{recursive:true}); fs.writeFileSync('output/film.html',source.replace('</body>','<!--stage-'+end+'-'+partial+'--></body>'));
 fs.writeFileSync('output/work.json',JSON.stringify({work,readyRanges:partial?[{startFrame:9,endFrame:18}]:[{startFrame:0,endFrame:end}],changedRanges:[]}));
 const response=await fetch(process.env.OD_DAEMON_URL+'/api/tools/motion-work/stage',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+process.env.OD_TOOL_TOKEN},body:JSON.stringify({source_path:'output/film.html',manifest_path:'output/work.json'})});
 if(!response.ok) throw Error('stage failed '+response.status+' '+await response.text());
}
process.stdin.setEncoding('utf8'); process.stdin.on('data',chunk=>{ buffer+=chunk; let at; while((at=buffer.indexOf('\\n'))>=0){const line=buffer.slice(0,at);buffer=buffer.slice(at+1);if(!line.trim())continue; const frame=JSON.parse(line);
 if(frame.method==='initialize') send({id:frame.id,result:{userAgent:'codex/0.153.4'}});
 else if(frame.method==='thread/start') send({id:frame.id,result:{thread:{id:'thread-e2e'}}});
 else if(frame.method==='turn/start'){send({id:frame.id,result:{turn:{id:'turn-e2e'}}});send({method:'turn/started',params:{threadId:'thread-e2e',turn:{id:'turn-e2e'}}});stage(9).catch(error=>{console.error(error);process.exit(3)});}
 else if(frame.method==='turn/steer'){send({id:frame.id,result:{turnId:'turn-e2e'}});stage(18,true).then(()=>stage(18)).then(()=>{send({method:'item/agentMessage/delta',params:{threadId:'thread-e2e',turnId:'turn-e2e',itemId:'message-e2e',delta:'画面源码已交付'}});send({method:'item/completed',params:{item:{id:'message-e2e',type:'agentMessage',text:'画面源码已交付'}}});send({method:'turn/completed',params:{threadId:'thread-e2e',turn:{id:'turn-e2e',status:'completed',items:[]}}});}).catch(error=>{console.error(error);process.exit(3)});}
 }});
process.stdin.on('end',()=>process.exit(0));
`;
  await writeFile(script, fake, "utf8");
  if (process.platform === "win32") await writeFile(executable, `@"${process.execPath}" "${script}" %*\r\n`, "utf8");
  await chmod(executable, 0o755);
  await mkdir(process.env.OD_DATA_DIR, { recursive: true });
  let od: { url: string; server: import("node:http").Server; shutdown?: () => Promise<void> | void } | undefined;
  let closeOdDatabase: (() => void) | undefined;
  const app = createApplication(join(root, "vfc"));
  let stop = false;
  const worker = (async () => {
    while (!stop) {
      const child = app.claimNextJob(["motion_generation", "motion_adoption"], 60_000);
      if (child) await processClaimedJob(app, child, (item, signal) => item.kind === "motion_generation" ? runMotionJob(app, item, undefined, signal) : app.completeMotionAdoption(item.id));
      else await new Promise(resolve => setTimeout(resolve, 50));
    }
  })();
  const controller = new AbortController();
  context.signal.addEventListener("abort", () => controller.abort(), { once: true });
  let authoring: Promise<unknown> | undefined;
  try {
    const modulePath = pathToFileURL(join(process.cwd(), "components", "open-design", "apps", "daemon", "src", "server.ts")).href;
    const { startServer } = await import(modulePath) as { startServer: (input: { port: number; returnServer: boolean }) => Promise<NonNullable<typeof od>> };
    const dbPath = pathToFileURL(join(process.cwd(), "components", "open-design", "apps", "daemon", "src", "db.ts")).href;
    closeOdDatabase = (await import(dbPath) as { closeDatabase: () => void }).closeDatabase;
    od = await startServer({ port: 0, returnServer: true });
    assert.ok(od?.url);
    const put = await fetch(`${od.url}/api/app-config`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ agentId: "codex",
      agentCliEnv: { codex: { CODEX_BIN: executable, CODEX_HOME: join(root, "fake-codex-home") } }, telemetry: { metrics: false, content: false, artifactManifest: false }, privacyDecisionAt: Date.now() }) });
    assert.equal(put.status, 200);
    const odProject = "authoring-e2e";
    const create = await fetch(`${od.url}/api/projects`, { method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: odProject, name: "阶段交件隔离", metadata: { kind: "prototype" }, skipDiscoveryBrief: true }) });
    assert.equal(create.status, 200, await create.text());
    const initial = app.createProject({ name: "阶段制作隔离验证" }), projectId = initial.snapshot.project.id, rev = () => app.readProject(projectId).revision.number;
    app.repository.commit(projectId, rev(), "隔离画布", snapshot => Object.assign(snapshot.timeline, { width: 320, height: 320, fps: 30 }));
    const scene = app.createScene({ projectId, baseRevision: rev(), type: "ExplainerScene", title: "连续场面", purpose: "验证", startFrame: 0, endFrame: 18 }).snapshot.scenes[0];
    const previewJob = app.registerMotionWork({ projectId, baseRevision: rev(), idempotencyKey: "preview", work: motionFixture });
    const preview = app.completeSourceMotionWork(projectId, previewJob.id);
    const brief = join(root, "brief.md"), timing = join(root, "timing.md"), projectSnapshot = join(root, "project.json"), output = join(root, "handoff");
    await writeFile(brief, "隔离制作的完整共同编排"); await writeFile(timing, "真实时间资料");
    await writeFile(projectSnapshot, JSON.stringify(app.readProject(projectId)));
    const manifest = await prepareReferencePackage({ projectId, revision: rev(), projectSnapshot, brief, timingPlan: timing, freezeInputs: true,
      deliveryPrefix: "handoffs/real-od", selectedSceneIds: [scene.id], scenes: [{ sceneId: scene.id, status: "ready",
        visualRoles: [{ role: "主体", referenceFunction: "连续发展", assetIds: [], usage: "原创图形" }],
        visualPlan: { status: "previewed", primaryRoles: ["主体"], graphicLed: true, graphicReasons: ["原创图形承担不可见的运动关系"],
          preview: { workId: preview.id, startFrame: 0, endFrame: 18 } },
        process: "主体建立、变化并接续", preserve: ["连续关系"], adapt: ["中文文字"] }] }, output);
    for (const file of manifest.files.filter(item => item.requiredForRun !== false)) {
      const content = (await readFile(join(output, file.deliveredPath))).toString("base64");
      const upload: Response = await fetch(`${od.url}/api/projects/${odProject}/files`, { method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: file.deliveredPath, content, encoding: "base64" }) });
      assert.equal(upload.status, 200, await upload.text());
    }
    const run = await app.startProductionRun({ operationId: globalThis.crypto.randomUUID(), baseRevision: app.readProject(projectId).revision.number, intent: "full_creation", completionScope: { kind: "project" }, projectId, loadedSkills: ["production-coordinator"] });
    await app.updateProductionRun({ projectId, runId: run.id, expectedAuditVersion: run.auditVersion, operationId: "director-assignment", action: "add_assignment",
      assignment: { agentId: "/fixture/director", assignmentId: "director", responsibilities: ["director", "narration", "creative_research", "visual_design", "motion_research"],
        skillIds: ["production-director", "narration-writing", "creative-sequence-design", "visual-treatment-planning", "motion-case-library"], inputRevision: rev(), scope: { kind: "project" } } });
    const manifestPath = join(output, "delivery-manifest.json");
    const manifestSha256 = createHash("sha256").update(await readFile(manifestPath)).digest("hex");
    const research = async (phase: "creative_research" | "motion_research") => (await app.recordCreativeDecision({ operationId: globalThis.crypto.randomUUID(),
      projectId, runId: run.id, category: "visual", decision: "本次不采用参考", rationale: "已研究候选，当前关系采用原创方案", phase,
      assignmentId: "director", inputRevision: rev(), objectIds: [scene.id], researchOutcome: "not_applicable", evidence: ["已核对相关候选及原片范围"] })).creativeDecisions.at(-1)!;
    const creative = await research("creative_research"), motion = await research("motion_research");
    const design = (await app.recordCreativeDecision({ operationId: globalThis.crypto.randomUUID(), projectId, runId: run.id, category: "visual", decision: "采用完整视觉设计", rationale: "结合实际预排",
      phase: "visual_design", assignmentId: "director", inputRevision: rev(), objectIds: [scene.id], inputDecisionIds: [creative.id, motion.id] })).creativeDecisions.at(-1)!;
    const decision = (await app.recordCreativeDecision({ operationId: globalThis.crypto.randomUUID(), projectId, runId: run.id, category: "scene", decision: "采用场面", rationale: "真实交付链路验证",
      phase: "adoption", assignmentId: "director", inputRevision: rev(), objectIds: [scene.id],
      inputDecisionIds: [design.id], deliveryRef: { manifestPath, manifestSha256, sceneIds: [scene.id] } })).creativeDecisions.at(-1)!;
    const treatment = app.manageVisualTreatment({ projectId, baseRevision: rev(), action: "upsert", sceneId: scene.id, mode: "remotion",
      intensity: "medium", primaryAttention: "主体", narrativePurpose: "验证", adoptedMaterialAssetIds: [],
      adoptedDecisionRef: { productionRunId: run.id, decisionId: decision.id } }).snapshot.visualTreatments[0];
    const job = await app.startMotionAuthoring({ projectId, baseRevision: rev(), productionRunId: run.id, visualTreatmentIds: [treatment.id], idempotencyKey: "real-od", target: { action: "create_cue", sceneId: scene.id,
      layer: "fullscreen", startFrame: 0, endFrame: 18, sourceStartFrame: 0, sourceEndFrame: 18, audioPolicy: "rebind_unchanged_events" },
      openDesignRequest: { project: odProject, prompt: "请依据已提供的完整演出稿交付连续画面。", agent: "codex" } });
    authoring = runMotionAuthoringJob(app, job, controller.signal, { url: od.url });
    void authoring.catch(() => undefined);
    const deadline = Date.now() + 45_000;
    let stage: { runId: string; receipts: Array<{ runId: string; frozenVersion: string; workId: string; revision: number; cueId: string; editorUrl: string }> } | undefined;
    while (Date.now() < deadline) {
      stage = app.trackJob(job.id).result?.authoring as typeof stage;
      if (stage?.receipts?.length) break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert.ok(stage?.runId && stage.receipts.length === 1, "首个真实 OD 阶段未进入 VFC");
    const firstReceipt = stage.receipts[0];
    assert.equal(firstReceipt.workId, preview.id, "首个交件沿用同源预排的作品身份");
    const firstUrl = new URL(firstReceipt.editorUrl);
    assert.equal(firstUrl.searchParams.get("productionRunId"), run.id);
    assert.equal(firstUrl.searchParams.get("fromFrame"), "0");
    assert.equal(firstUrl.searchParams.get("toFrame"), "9");
    const firstWork = app.readSourceMotionWork(projectId, firstReceipt.workId, firstReceipt.revision).work;
    assert.deepEqual(firstWork.readyRanges, [{ startFrame: 0, endFrame: 9 }]);
    assert.deepEqual(firstWork.author, { project: odProject, run_id: stage.runId, frozen_version: firstReceipt.frozenVersion });
    const feedback = await fetch(`${od.url}/api/runs/${encodeURIComponent(stage.runId)}/steer`, { method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ feedbackId: "feedback-e2e", frozenVersion: stage.receipts[0].frozenVersion, range: { startFrame: 0, endFrame: 9 }, expectedTurnId: "turn-e2e", text: "保持主体并继续完成后半段" }) });
    assert.equal(feedback.status, 200, await feedback.text());
    let timer: ReturnType<typeof setTimeout> | undefined;
    const result = await Promise.race([authoring, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("第二阶段未在时限内完成")), 25_000); })])
      .finally(() => { if (timer) clearTimeout(timer); }) as { authoring: { status: string; receipts: Array<{ runId: string; frozenVersion: string; workId: string; revision: number; cueId: string; editorUrl: string }> } };
    assert.equal(result.authoring.status, "succeeded");
    assert.equal(result.authoring.receipts.length, 3);
    const secondReceipt = result.authoring.receipts[1];
    const secondUrl = new URL(secondReceipt.editorUrl);
    assert.equal(secondUrl.searchParams.get("productionRunId"), run.id);
    assert.equal(secondUrl.searchParams.get("fromFrame"), "9");
    assert.equal(secondUrl.searchParams.get("toFrame"), "18");
    assert.equal(secondUrl.searchParams.get("effectCueId"), secondReceipt.cueId);
    const secondWork = app.readSourceMotionWork(projectId, secondReceipt.workId, secondReceipt.revision).work;
    assert.equal(secondReceipt.workId, firstReceipt.workId, "分阶段制作始终沿用同一作品");
    assert.equal(secondReceipt.runId, firstReceipt.runId);
    assert.notEqual(secondReceipt.frozenVersion, firstReceipt.frozenVersion);
    assert.deepEqual(secondWork.readyRanges, [{ startFrame: 9, endFrame: 18 }]);
    assert.deepEqual(secondWork.author, { project: odProject, run_id: stage.runId, frozen_version: secondReceipt.frozenVersion });
    const secondSnapshot = app.readProject(projectId, secondReceipt.revision).snapshot;
    const [firstPart, secondPart] = secondSnapshot.effectCues;
    assert.equal(firstPart.workId, secondPart.workId);
    assert.equal(motionWorkForCue(secondSnapshot, firstPart)?.definitionHash, firstWork.definitionHash);
    assert.equal(motionWorkForCue(secondSnapshot, secondPart)?.definitionHash, secondWork.definitionHash);
    assert.notEqual(firstPart.workDefinitionHash, secondPart.workDefinitionHash, "不同阶段的固定版本不能被后续交件覆盖");
    const finalReceipt = result.authoring.receipts[2];
    assert.deepEqual(app.readSourceMotionWork(projectId, finalReceipt.workId, finalReceipt.revision).work.readyRanges, [{ startFrame: 0, endFrame: 18 }]);
    assert.equal(finalReceipt.workId, preview.id);
    const finalSnapshot = app.readProject(projectId).snapshot;
    assert.equal(finalSnapshot.motionWorks?.length, 1);
    assert.equal(finalSnapshot.assets.length, 0, "阶段登记不会自动生成派生媒体");
    assert.ok((finalSnapshot.motionWorks?.[0].previousVersions?.length ?? 0) >= 2);
    assert.ok(finalSnapshot.effectCues.every(cue => motionWorkForCue(finalSnapshot, cue)?.definitionHash === cue.workDefinitionHash));
    assert.equal(app.readSourceMotionWork(projectId, preview.id, undefined, firstWork.definitionHash).work.definitionHash, firstWork.definitionHash);
    const { app: workbench, application: workbenchApp } = await createVfcServer({ workspaceRoot: join(root, "vfc") });
    try {
      for (const [version, marker] of [[firstWork, "stage-9-false"], [secondWork, "stage-18-true"]] as const) {
        const response = await workbench.inject({ method: "GET", url: `/motion-work/${projectId}/${preview.id}/${rev()}/${version.definitionHash}/document` });
        assert.equal(response.statusCode, 200, response.body);
        assert.ok(response.body.includes(`/${version.definitionHash}/resources/`), "工作台必须读取指定固定版本的资源");
        assert.ok(response.body.includes(marker), "工作台必须读取该阶段对应的源码内容");
      }
    } finally { await workbench.close(); workbenchApp.close(); }
    const baked = app.submitMotionBake({ projectId, baseRevision: rev(), idempotencyKey: "bake-first-stage", workId: preview.id,
      definitionHash: firstWork.definitionHash, frameRange: { startFrame: 0, endFrame: 9 }, outputIntent: "asset" });
    const bakeDeadline = Date.now() + 30_000;
    while (["queued", "running"].includes(app.trackJob(baked.id).status) && Date.now() < bakeDeadline) await new Promise(resolve => setTimeout(resolve, 100));
    const bakeResult = app.trackJob(baked.id);
    assert.equal(bakeResult.status, "succeeded", JSON.stringify(bakeResult.error));
    const bakedSnapshot = app.readProject(projectId).snapshot;
    const bakedAsset = bakedSnapshot.assets.find(asset => asset.id === bakeResult.result?.assetId);
    assert.equal(bakedAsset?.motion?.workId, preview.id);
    assert.equal(bakedAsset?.motion?.definitionHash, firstWork.definitionHash);
    assert.equal(motionMediaForCue(bakedSnapshot, firstPart)?.id, bakedAsset?.id, "旧阶段必须找到自己的派生媒体");
    assert.equal(motionMediaForCue(bakedSnapshot, finalSnapshot.effectCues[0]), undefined, "不能把旧源码的媒体用于新版片段");
    assert.deepEqual(app.readProject(projectId).snapshot.effectCues.map(cue => [cue.startFrame, cue.endFrame]), [[0, 9], [9, 18]]);
    assert.ok(app.readProject(projectId).snapshot.effectCues.every(cue => cue.authoringInputs?.[0].adoptedDecisionRef.decisionId === decision.id));
    assert.equal(app.readProject(projectId).snapshot.assets.length, 1);
  } finally {
    controller.abort(); if (authoring) await authoring.catch(() => undefined);
    stop = true; await worker;
    if (od) { await od.shutdown?.(); if (od.server.listening) await new Promise<void>(resolve => od!.server.close(() => resolve())); }
    closeOdDatabase?.();
    app.close();
    if (previousData === undefined) delete process.env.OD_DATA_DIR; else process.env.OD_DATA_DIR = previousData;
    if (previousTransport === undefined) delete process.env.OD_CODEX_TRANSPORT; else process.env.OD_CODEX_TRANSPORT = previousTransport;
    if (previousRollout === undefined) delete process.env.OD_NEXT_STRATEGY_ROLLOUT; else process.env.OD_NEXT_STRATEGY_ROLLOUT = previousRollout;
    await rm(root, { recursive: true, force: true });
  }
});
