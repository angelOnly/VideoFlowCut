import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApplication } from "@videocut/application";
import { processClaimedJob } from "@videocut/job-runtime";
import { motionBundleHash } from "../packages/edit-application/src/motion-input.js";
import { runMotionJob } from "../apps/render-worker/src/motion-job.js";
import { runMotionAuthoringJob } from "../apps/runtime/src/motion-authoring.js";
import { createServer as createVfcServer } from "../apps/server/src/app.js";
import { motionFixture } from "./fixtures/managed-motion.js";
import { sizeMotionFixture } from "./fixtures/hyperframes.js";

function frozen(endFrame: number, runId = "run-one") {
  const { source, ...work } = sizeMotionFixture({ ...motionFixture, fps: 24, durationInFrames: 24 }), sourceBytes = Buffer.from(source);
  const sha = (value: Buffer) => createHash("sha256").update(value).digest("hex");
  const manifest = Buffer.from(JSON.stringify({ authorSubmissionId: `stage-${endFrame}`, sourceFile: "film.html", sourceSha256: sha(sourceBytes), work,
    readyRanges: [{ startFrame: 0, endFrame }], changedRanges: [] }));
  const sourcePart = { sha256: sha(sourceBytes), bytes: sourceBytes.length }, manifestPart = { sha256: sha(manifest), bytes: manifest.length };
  const hash = motionBundleHash(sourcePart, manifestPart);
  return { receipt: { project: "od-project", run_id: runId, frozen_version: `${runId}_${hash}`, bundle_sha256: hash, source: sourcePart, manifest: manifestPart },
    source_base64: sourceBytes.toString("base64"), manifest_base64: manifest.toString("base64") };
}

function invalidFrozen() {
  const bundle = frozen(24), source = Buffer.from(bundle.source_base64, "base64");
  const manifest = JSON.parse(Buffer.from(bundle.manifest_base64, "base64").toString("utf8"));
  manifest.work.videoBindings = { subject: { assetId: "missing", sourceStartMs: 0.5, sourceEndMs: 1000, startFrame: 0, endFrame: 24 } };
  const bytes = Buffer.from(JSON.stringify(manifest));
  const hash = (value: Buffer) => createHash("sha256").update(value).digest("hex");
  const sourcePart = { sha256: hash(source), bytes: source.length }, manifestPart = { sha256: hash(bytes), bytes: bytes.length };
  const bundleHash = motionBundleHash(sourcePart, manifestPart);
  return { receipt: { project: "od-project", run_id: "run-one", frozen_version: `run-one_${bundleHash}`, bundle_sha256: bundleHash, source: sourcePart, manifest: manifestPart },
    source_base64: source.toString("base64"), manifest_base64: bytes.toString("base64") };
}

test("阶段清单被拒后接回修正版，最后交件被拒时保留未完成状态", { timeout: 120_000 }, async () => {
  for (const rejectedLast of [false, true]) {
    const root = await mkdtemp(join(tmpdir(), "vfc-stage-rejection-")), app = createApplication(root);
    const good = frozen(24), bad = invalidFrozen(), stages = rejectedLast ? [good, bad] : [bad, good];
    const feedback: Array<Record<string, unknown>> = [];
    const server = createServer((req, res) => {
      const url = new URL(req.url!, "http://127.0.0.1");
      if (req.method === "POST" && url.pathname === "/api/runs") { res.writeHead(200); res.end(JSON.stringify({ runId: "run-one" })); return; }
      if (req.method === "POST" && url.pathname.endsWith("/steer")) {
        let body = ""; req.setEncoding("utf8"); req.on("data", part => { body += part; });
        req.on("end", () => { feedback.push(JSON.parse(body)); res.writeHead(200); res.end(JSON.stringify({ delivered: true })); }); return;
      }
      if (url.pathname.endsWith("/events")) {
        res.writeHead(200, { "content-type": "text/event-stream" });
        const after = Number(url.searchParams.get("after"));
        stages.forEach((stage, index) => { if (index + 1 > after) res.write(`id: ${index + 1}\nevent: frozen_work\ndata: ${JSON.stringify(stage.receipt)}\n\n`); });
        res.end(); return;
      }
      if (url.pathname.includes("/frozen-work/")) {
        const version = decodeURIComponent(url.pathname.split("/").at(-1)!);
        res.writeHead(200); res.end(JSON.stringify(stages.find(stage => stage.receipt.frozen_version === version))); return;
      }
      if (url.pathname === "/api/runs/run-one") { res.writeHead(200); res.end(JSON.stringify({ status: "succeeded" })); return; }
      res.writeHead(404); res.end();
    });
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
    const endpoint = { url: `http://127.0.0.1:${(server.address() as { port: number }).port}` };
    let stopping = false;
    const worker = (async () => {
      while (!stopping) {
        const child = app.claimNextJob(["motion_generation", "motion_adoption"], 60_000);
        if (child) await processClaimedJob(app, child, (item, signal) => item.kind === "motion_generation" ? runMotionJob(app, item, undefined, signal) : app.completeMotionAdoption(item.id));
        else await new Promise(resolve => setTimeout(resolve, 25));
      }
    })();
    try {
      const projectId = app.createProject({ name: "阶段修正隔离验证" }).snapshot.project.id;
      const rev = () => app.readProject(projectId).revision.number;
      app.repository.commit(projectId, rev(), "隔离画布", snapshot => Object.assign(snapshot.timeline, { width: 320, height: 320, fps: 30 }));
      const scene = app.createScene({ projectId, baseRevision: rev(), type: "ExplainerScene", title: "范围", purpose: "阶段修正", startFrame: 0, endFrame: 30 }).snapshot.scenes[0];
      const job = await app.startMotionAuthoring({ projectId, baseRevision: rev(), intent: "local_edit", idempotencyKey: "one", target: { action: "create_cue", sceneId: scene.id,
        layer: "fullscreen", startFrame: 0, endFrame: 30, sourceStartFrame: 0, sourceEndFrame: 30, audioPolicy: "rebind_unchanged_events" },
        openDesignRequest: { project: "od-project", prompt: "按参考制作" } });
      const result = await runMotionAuthoringJob(app, job, new AbortController().signal, endpoint) as { authoring: { status: string; receipts: Array<Record<string, unknown>> } };
      assert.equal(result.authoring.status, rejectedLast ? "incomplete" : "succeeded");
      assert.equal(result.authoring.receipts.length, 2);
      assert.equal(result.authoring.receipts[rejectedLast ? 1 : 0].status, "rejected");
      assert.equal(feedback.length, 1);
      assert.equal(feedback[0].frozenVersion, bad.receipt.frozen_version);
      assert.match(String(feedback[0].text), /sourceStartMs/);
      assert.equal(app.readProject(projectId).snapshot.effectCues.length, 1);
    } finally {
      stopping = true; await worker;
      await new Promise<void>(resolve => server.close(() => resolve()));
      app.close(); await rm(root, { recursive: true, force: true });
    }
  }
});

test("统一制作入口持久化委托，Runtime 按序号返回进展与有限等待", async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-authoring-api-"));
  const { app: server, application } = await createVfcServer({ workspaceRoot: root });
  try {
    const project = application.createProject({ name: "制作接口隔离验证" }), projectId = project.snapshot.project.id;
    const rev = () => application.readProject(projectId).revision.number;
    const scene = application.createScene({ projectId, baseRevision: rev(), type: "ExplainerScene", title: "目标", purpose: "验证", startFrame: 0, endFrame: 18 }).snapshot.scenes[0];
    const body = { baseRevision: rev(), intent: "local_edit", idempotencyKey: "one", target: { action: "create_cue", sceneId: scene.id, layer: "fullscreen", startFrame: 0, endFrame: 18,
      sourceStartFrame: 0, sourceEndFrame: 18, audioPolicy: "rebind_unchanged_events" }, openDesignRequest: { project: "od-project", prompt: "读取完整演出稿与参考" } };
    const submitted = await server.inject({ method: "POST", url: `/api/projects/${projectId}/motion-authoring`, payload: body });
    assert.equal(submitted.statusCode, 200, submitted.body);
    const { jobId } = submitted.json() as { jobId: string };
    const repeated = await server.inject({ method: "POST", url: `/api/projects/${projectId}/motion-authoring`, payload: body });
    assert.equal(repeated.json().jobId, jobId);
    const tracked = await server.inject({ method: "GET", url: `/api/jobs/${jobId}` });
    assert.equal(tracked.json().payload.input.openDesignRequest.project, "od-project");
    assert.equal(tracked.json().payload.input.target.sceneId, scene.id);
    assert.equal(tracked.json().payload.input.openDesignRequest.prompt, undefined);
    assert.equal((application.trackJob(jobId).payload.input as typeof body).openDesignRequest.prompt, body.openDesignRequest.prompt);
    const path = `/api/projects/${projectId}/motion-authoring/${jobId}/wait`;
    const headers = { "x-videoflowcut-release-id": "manual" };
    const empty = await server.inject({ method: "GET", url: `${path}?afterSequence=0&timeoutMs=0`, headers });
    assert.equal(empty.statusCode, 200);
    assert.equal(empty.json().timedOut, true);
    application.recordJobCheckpoint(jobId, { authoring: { sequence: 1, runId: "run-1", status: "running" } });
    const updated = await server.inject({ method: "GET", url: `${path}?afterSequence=0&timeoutMs=0`, headers });
    assert.equal(updated.json().sequence, 1);
    assert.equal(updated.json().authoring.runId, "run-1");
    assert.equal(updated.json().timedOut, false);
    assert.equal(updated.headers["x-videoflowcut-release-id"], "manual");
  } finally { await server.close(); application.close(); await rm(root, { recursive: true, force: true }); }
});

test("终态后的修订精确使用指定来源 Run 的会话与制作任务", async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-authoring-continuation-")), app = createApplication(root);
  const prompt = "依据参考重排素材和花字。\n简报：brief/视觉编排.md\n参考：references/创意视频.mp4";
  const inputs = { scene: "本次采用的连续场面", briefPath: "brief/视觉编排.md" };
  let submitted: Record<string, unknown> | undefined;
  let starts = 0;
  const server = createServer((req, res) => {
    const url = new URL(req.url!, "http://127.0.0.1");
    res.setHeader("content-type", "application/json");
    if (["/api/runs/old-run", "/api/runs/prior-run"].includes(url.pathname)) { res.end(JSON.stringify({ projectId: "od-project", conversationId: "old-conversation", strategyTask: { taskExecutionId: "old-task" } })); return; }
    if (url.pathname === "/api/runs/unrelated-run") { res.end(JSON.stringify({ projectId: "od-project", conversationId: "unrelated", strategyTask: { taskExecutionId: "other-task" } })); return; }
    if (req.method === "POST" && url.pathname === "/api/runs") {
      starts++;
      let body = ""; req.setEncoding("utf8"); req.on("data", part => { body += part; });
      req.on("end", () => { submitted = JSON.parse(body); res.end(JSON.stringify({ runId: "new-run" })); }); return;
    }
    if (url.pathname.endsWith("/events")) { res.setHeader("content-type", "text/event-stream"); res.end(); return; }
    if (url.pathname === "/api/runs/new-run") { res.end(JSON.stringify({ status: "succeeded" })); return; }
    res.statusCode = 404; res.end();
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  try {
    const projectId = app.createProject({ name: "续修上下文" }).snapshot.project.id;
    const rev = () => app.readProject(projectId).revision.number;
    const scene = app.createScene({ projectId, baseRevision: rev(), type: "ExplainerScene", title: "目标", purpose: "续修", startFrame: 0, endFrame: 18 }).snapshot.scenes[0]!;
    const job = await app.startMotionAuthoring({ projectId, baseRevision: rev(), intent: "local_edit", idempotencyKey: "new-revision", target: { action: "create_cue", sceneId: scene.id,
      layer: "fullscreen", startFrame: 0, endFrame: 18, sourceStartFrame: 0, sourceEndFrame: 18, audioPolicy: "rebind_unchanged_events" },
      openDesignRequest: { project: "od-project", prompt, plugin: "motion-design", inputs, continue_from_run_id: "old-run" } });
    const endpoint = { url: `http://127.0.0.1:${(server.address() as { port: number }).port}` };
    job.payload.continuationAuthor = { project: "od-project", run_id: "prior-run", frozen_version: "v1" };
    const result = await runMotionAuthoringJob(app, job, new AbortController().signal, endpoint) as { authoring: { continuation: Record<string, string>; status: string } };
    assert.equal(submitted?.conversationId, "old-conversation");
    assert.equal(submitted?.taskExecutionId, "old-task");
    assert.equal(submitted?.message, prompt);
    assert.equal(submitted?.currentPrompt, prompt);
    assert.equal(submitted?.pluginId, "motion-design");
    assert.deepEqual(submitted?.pluginInputs, inputs);
    assert.equal(result.authoring.continuation.runId, "old-run");
    assert.equal(result.authoring.status, "incomplete");
    const wrongProject = await app.startMotionAuthoring({ projectId, baseRevision: rev(), intent: "local_edit", idempotencyKey: "wrong-source", target: { action: "create_cue", sceneId: scene.id,
      layer: "fullscreen", startFrame: 0, endFrame: 18, sourceStartFrame: 0, sourceEndFrame: 18, audioPolicy: "rebind_unchanged_events" },
      openDesignRequest: { project: "other-project", prompt: "继续指定作品", continue_from_run_id: "old-run" } });
    await assert.rejects(runMotionAuthoringJob(app, wrongProject, new AbortController().signal, endpoint), /续修来源 Run 与项目不符/);
    const unrelated = await app.startMotionAuthoring({ projectId, baseRevision: rev(), intent: "local_edit", idempotencyKey: "wrong-task", target: { action: "create_cue", sceneId: scene.id,
      layer: "fullscreen", startFrame: 0, endFrame: 18, sourceStartFrame: 0, sourceEndFrame: 18, audioPolicy: "rebind_unchanged_events" },
      openDesignRequest: { project: "od-project", prompt: "继续当前作品", continue_from_run_id: "unrelated-run" } });
    unrelated.payload.continuationAuthor = { project: "od-project", run_id: "prior-run", frozen_version: "v1" };
    await assert.rejects(runMotionAuthoringJob(app, unrelated, new AbortController().signal, endpoint), /不属于当前作品的制作任务/);
    assert.equal(starts, 1, "来源项目或制作任务不一致时不能启动错误的修订任务");
  } finally {
    await new Promise<void>(resolve => server.close(() => resolve())); app.close(); await rm(root, { recursive: true, force: true });
  }
});

test("拒收反馈重启后按原 ID 对账，未知结果不会被当成拒绝或重复发送", async () => {
  for (const mode of ["unsent", "accepted", "unknown", "remote_unknown"] as const) {
    const root = await mkdtemp(join(tmpdir(), "vfc-feedback-resume-")), app = createApplication(root);
    const feedbackId = "feedback-one", request = { runId: "run-one", frozenVersion: "run-one-version", range: { startFrame: 0, endFrame: 18 }, text: "修正阶段作品" };
    let sent = 0;
    const server = createServer((req, res) => {
      const url = new URL(req.url!, "http://127.0.0.1");
      res.setHeader("content-type", "application/json");
      if (req.method === "POST" && url.pathname.endsWith("/steer")) {
        sent++;
        if (mode === "unknown") { res.statusCode = 409; res.end(JSON.stringify({ error: { code: "RUN_STEERING_CLOSED", details: { refusal: "delivery_unknown" } } })); }
        else res.end(JSON.stringify({ feedback: { state: "accepted", observedRunId: "run-one", receivingRunId: "run-two" } }));
        return;
      }
      if (url.pathname.endsWith("/messages")) {
        const messages = mode === "accepted" || mode === "remote_unknown" ? [{ id: feedbackId, content: request.text, runContext: { motionFeedback: { ...request, state: mode === "accepted" ? "accepted" : "unknown", observedRunId: "run-one", receivingRunId: "run-two" } } }] : [];
        res.end(JSON.stringify({ messages })); return;
      }
      if (url.pathname.endsWith("/events")) { res.setHeader("content-type", "text/event-stream"); res.end(); return; }
      if (url.pathname === "/api/runs/run-one") { res.end(JSON.stringify({ projectId: "od-project", conversationId: "conversation", status: "succeeded" })); return; }
      res.statusCode = 404; res.end();
    });
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
    try {
      const projectId = app.createProject({ name: "反馈恢复" }).snapshot.project.id;
      const rev = () => app.readProject(projectId).revision.number;
      const scene = app.createScene({ projectId, baseRevision: rev(), type: "ExplainerScene", title: "目标", purpose: "恢复反馈", startFrame: 0, endFrame: 18 }).snapshot.scenes[0]!;
      const job = await app.startMotionAuthoring({ projectId, baseRevision: rev(), intent: "local_edit", idempotencyKey: "one", target: { action: "create_cue", sceneId: scene.id,
        layer: "fullscreen", startFrame: 0, endFrame: 18, sourceStartFrame: 0, sourceEndFrame: 18, audioPolicy: "rebind_unchanged_events" },
        openDesignRequest: { project: "od-project", prompt: "制作" } });
      app.recordJobCheckpoint(job.id, { authoring: { sequence: 1, requestId: "request", runId: "run-one", activeRunId: "run-one", cursor: 1,
        seenVersions: [request.frozenVersion], owned: [], status: "awaiting_correction", receipts: [{ status: "rejected", feedback: { feedbackId, status: "pending", request } }] } });
      const endpoint = { url: `http://127.0.0.1:${(server.address() as { port: number }).port}` };
      const result = await runMotionAuthoringJob(app, job, new AbortController().signal, endpoint) as { authoring: { receipts: Array<{ feedback: { status: string; receivingRunId?: string } }> } };
      assert.equal(result.authoring.receipts[0]!.feedback.status, mode === "unknown" || mode === "remote_unknown" ? "unknown" : "accepted");
      assert.equal(sent, mode === "accepted" || mode === "remote_unknown" ? 0 : 1);
      if (mode !== "unknown") assert.equal(result.authoring.receipts[0]!.feedback.receivingRunId, "run-two");
    } finally {
      await new Promise<void>(resolve => server.close(() => resolve())); app.close(); await rm(root, { recursive: true, force: true });
    }
  }
});

test("启动回执丢失与阶段断线后续接原作者，并按物理 Run 交接续作", { timeout: 90_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-authoring-")), app = createApplication(root);
  const first = frozen(12), second = frozen(24, "run-two"); let starts = 0, streams = 0, continued = false, finished = false, allowContinuation = false;
  let requestId = "", recoveredByList = 0, firstBundleRequests = 0, runOneStreams = 0, logicalPolls = 0;
  let streamsAtFirstWait = 0, streamsAfterWait = 0;
  const server = createServer((req, res) => {
    const url = new URL(req.url!, "http://127.0.0.1");
    if (req.method === "POST" && url.pathname === "/api/runs") {
      starts++;
      let body = ""; req.setEncoding("utf8"); req.on("data", chunk => { body += chunk; });
      req.on("end", () => { requestId = (JSON.parse(body) as { clientRequestId: string }).clientRequestId; res.destroy(); });
      return;
    }
    if (req.method === "GET" && url.pathname === "/api/runs") {
      recoveredByList++; res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ runs: [{ id: "run-one", clientRequestId: requestId }] })); return;
    }
    if (url.pathname.endsWith("/events")) {
      streams++; res.writeHead(200, { "content-type": "text/event-stream" });
      const send = (id: number, bundle: ReturnType<typeof frozen>) => res.write(`id: ${id}\nevent: frozen_work\ndata: ${JSON.stringify(bundle.receipt)}\n\n`);
      if (url.pathname.includes("run-one")) {
        runOneStreams++;
        if (Number(url.searchParams.get("after")) < 1) { send(1, first); return; }
        if (!allowContinuation) return;
        continued = true; res.end(); return;
      }
      send(1, second); send(2, second); finished = true; res.end(); return;
    }
    if (url.pathname.includes("/frozen-work/")) {
      const bundle = decodeURIComponent(url.pathname.split("/").at(-1)!) === first.receipt.frozen_version ? first : second;
      if (bundle === first && ++firstBundleRequests === 1) { res.destroy(); return; }
      res.writeHead(200, { "content-type": "application/json" }); res.end(JSON.stringify(bundle)); return;
    }
    if (url.pathname === "/api/runs/run-one") {
      if (continued && !finished) {
        logicalPolls++;
        if (logicalPolls === 1) streamsAtFirstWait = runOneStreams;
        if (logicalPolls === 4) streamsAfterWait = runOneStreams;
      }
      res.writeHead(200, { "content-type": "application/json" }); res.end(JSON.stringify({ status: continued ? "succeeded" : "running",
        ...(continued ? { strategyTask: { terminal: finished, activeRunId: logicalPolls >= 4 ? "run-two" : "run-one", outcome: finished ? "completed" : "running" } } : {}) })); return;
    }
    if (url.pathname === "/api/runs/run-two") { res.writeHead(200, { "content-type": "application/json" }); res.end(JSON.stringify({ status: "succeeded" })); return; }
    res.writeHead(404); res.end();
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const endpoint = { url: `http://127.0.0.1:${(server.address() as { port: number }).port}` };
  let stopWorker = false;
  const worker = (async () => {
    while (!stopWorker) {
      const child = app.claimNextJob(["motion_generation", "motion_adoption"], 60_000);
      if (child) await processClaimedJob(app, child, (item, signal) => item.kind === "motion_generation" ? runMotionJob(app, item, undefined, signal) : app.completeMotionAdoption(item.id));
      else await new Promise(resolve => setTimeout(resolve, 25));
    }
  })();
  try {
    const created = app.createProject({ name: "阶段交件隔离验证" }), projectId = created.snapshot.project.id;
    const rev = () => app.readProject(projectId).revision.number;
    app.repository.commit(projectId, rev(), "隔离画布", snapshot => Object.assign(snapshot.timeline, { width: 320, height: 320, fps: 30 }));
    const scene = app.createScene({ projectId, baseRevision: rev(), type: "ExplainerScene", title: "连续范围", purpose: "阶段交件", startFrame: 0, endFrame: 30 }).snapshot.scenes[0];
    const input = { projectId, baseRevision: rev(), intent: "local_edit" as const, idempotencyKey: "authoring-once", target: { action: "create_cue" as const, sceneId: scene.id, layer: "fullscreen" as const,
      startFrame: 0, endFrame: 30, sourceStartFrame: 0, sourceEndFrame: 30, audioPolicy: "rebind_unchanged_events" as const },
      openDesignRequest: { project: "od-project", prompt: "按已经交付的完整演出稿与参考制作" } };
    const job = await app.startMotionAuthoring(input);
    assert.equal((await app.startMotionAuthoring(input)).id, job.id);
    const interrupted = new AbortController();
    const running = runMotionAuthoringJob(app, job, interrupted.signal, endpoint);
    const deadline = Date.now() + 30_000;
    while (Date.now() < deadline) {
      const state = app.trackJob(job.id).result?.authoring as { receipts?: unknown[] } | undefined;
      if (state?.receipts?.length === 1) break;
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    assert.equal(((app.trackJob(job.id).result?.authoring as { receipts?: unknown[] }).receipts ?? []).length, 1);
    interrupted.abort();
    await assert.rejects(running);
    allowContinuation = true;
    const result = await runMotionAuthoringJob(app, job, new AbortController().signal, endpoint) as { authoring: { receipts: Array<{ runId: string; ranges: Array<{ startFrame: number; endFrame: number }> }>; cursor: number } };
    assert.equal(starts, 1);
    assert.equal(recoveredByList, 1);
    assert.ok(firstBundleRequests >= 2);
    assert.equal(streamsAtFirstWait, streamsAfterWait);
    assert.ok(streams >= 2);
    assert.equal(result.authoring.receipts.length, 2);
    assert.deepEqual(result.authoring.receipts.map(receipt => receipt.runId), ["run-one", "run-two"]);
    assert.equal(result.authoring.cursor, 2);
    const cues = app.readProject(projectId).snapshot.effectCues.sort((a, b) => a.startFrame - b.startFrame);
    assert.deepEqual(cues.map(cue => [cue.startFrame, cue.endFrame]), [[0, 15], [15, 30]]);
    assert.equal(cues[0].workId, cues[1].workId);
    assert.equal(app.listJobs(projectId).filter(item => item.kind === "motion_inspection").length, 2);
    assert.equal(app.listJobs(projectId).filter(item => item.kind === "preview").length, 0);
    assert.equal(app.readProject(projectId).snapshot.assets.length, 0);
  } finally {
    stopWorker = true; await worker;
    await new Promise<void>(resolve => server.close(() => resolve()));
    app.close(); await rm(root, { recursive: true, force: true });
  }
});
