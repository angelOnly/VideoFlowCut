import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test, { type TestContext } from "node:test";
import { z } from "zod";
import { createApplication } from "@videocut/application";
import { ComfyUIBridgeClient, type BridgeWorkflow } from "@videocut/bridge";
import { DomainError } from "@videocut/domain";
import { runOneQueuedJob } from "@videocut/job-runtime";
import type { JobRecord, SfxGenerationPayload } from "@videocut/contracts";
import { manageSoundPlan } from "../packages/edit-application/src/sound-design.js";
import { SFX_WORKFLOW_ID } from "../packages/edit-application/src/sfx-generation.js";
import { runSfxGeneration, buildSfxBridgeRequest } from "../apps/job-worker/src/sfx-generation.js";
import { inspectGeneratedAudioFile } from "../apps/job-worker/src/generated-audio.js";
import { MEDIA_JOB_KINDS } from "../apps/job-worker/src/index.js";
import { registerSoundTools } from "../apps/server/src/sound-tools.js";
import { createServer } from "../apps/server/src/app.js";

const workflow: BridgeWorkflow = {
  id: SFX_WORKFLOW_ID, name: "音效接口夹具", available: true, schemaVersion: "fixture-v1", itemSlots: [],
  fields: [
    { id: "prompt", label: "提示词（英文）", kind: "text", required: true },
    { id: "duration_seconds", label: "最大时长（秒）", kind: "number", required: false, min: 1, max: 120, step: 1 },
    { id: "seed", label: "随机种子", kind: "number", required: false, min: 0, max: Number.MAX_SAFE_INTEGER, step: 1 }
  ], outputs: [{ id: "audio", label: "音频", kind: "audio" }]
};

function wave() {
  const samples = 4800, bytes = Buffer.alloc(44 + samples * 2);
  bytes.write("RIFF"); bytes.writeUInt32LE(bytes.length - 8, 4); bytes.write("WAVEfmt ", 8);
  bytes.writeUInt32LE(16, 16); bytes.writeUInt16LE(1, 20); bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(48000, 24); bytes.writeUInt32LE(96000, 28); bytes.writeUInt16LE(2, 32); bytes.writeUInt16LE(16, 34);
  bytes.write("data", 36); bytes.writeUInt32LE(samples * 2, 40);
  for (let i = 0; i < samples; i++) bytes.writeInt16LE(Math.round(Math.sin(i * Math.PI * 880 / 48000) * 4000), 44 + i * 2);
  return bytes;
}

async function fixture(t: TestContext) {
  const root = await mkdtemp(join(tmpdir(), "vfc-sfx-generation-"));
  const app = createApplication(root), created = app.createProject({ name: "音效生成隔离测试", profile: "visual_explainer" });
  const id = created.snapshot.project.id, rev = () => app.readProject(id).revision.number;
  const state = manageSoundPlan(app, id, rev(), { action: "create", startFrame: 0, endFrame: 120,
    narrationDirection: "说明数字关系", dominantRole: "narration", musicDirection: "保持轻音乐或留白",
    intents: [{ id: "settle", function: "settle", brief: "短木质轻敲强化落定" }] });
  const plan = state.snapshot.soundPlans![0]!;
  const requirement = app.manageAssetRequirement({ projectId: id, baseRevision: rev(), action: "create", title: "单次落定", purpose: "强调关系",
    mediaKind: "audio", audioBrief: "轻巧木质、单次、短尾", role: "sfx", sound: { soundPlanId: plan.id, soundIntentId: "settle", excludeSpeech: true, excludeMusic: true } });
  const request = requirement.snapshot.assetRequests[0]!;
  const input = { projectId: id, baseRevision: rev(), requestId: request.id, prompt: "TrackType: SFX. One isolated wooden tap, close and dry, short decay.", maxDurationSeconds: 1, idempotencyKey: "candidate-1" };
  const bridge = new ComfyUIBridgeClient("http://bridge.test/comfyui-bridge/v1", { readinessTimeoutMs: 0 });
  t.after(async () => { app.close(); await rm(root, { recursive: true, force: true }); });
  return { root, app, id, rev, plan, request, input, bridge };
}

function mockBridge(t: TestContext) {
  const calls = { post: 0, get: 0, schema: 0, download: 0, requests: [] as Record<string, unknown>[] };
  const behavior = { mode: "ok", onPost: undefined as (() => void) | undefined };
  t.mock.method(globalThis, "fetch", async (url: string | URL | Request, init?: RequestInit) => {
    const path = String(url);
    if (path.endsWith(`/workflows/${SFX_WORKFLOW_ID}`)) {
      calls.schema++;
      if (behavior.mode === "409-refresh-error" && calls.schema > 1) throw new TypeError("fetch failed");
      return Response.json(workflow);
    }
    if (path.endsWith(`/workflows/${SFX_WORKFLOW_ID}/runs`)) {
      calls.post++; calls.requests.push(JSON.parse(String(init?.body))); behavior.onPost?.();
      if (behavior.mode === "unknown") throw new TypeError("fetch failed");
      if (behavior.mode === "500") return Response.json({ error: "提交后连接中断" }, { status: 500 });
      if (["409", "409-refresh-error"].includes(behavior.mode) && calls.post === 1) return Response.json({ error: "旧 Schema" }, { status: 409 });
      if (behavior.mode === "400") return Response.json({ error: "参数拒绝" }, { status: 400 });
      return Response.json({ id: `run-${calls.post}`, status: "queued", outputs: [] }, { status: 201 });
    }
    if (/\/runs\/run-\d+$/u.test(path)) {
      calls.get++;
      if (behavior.mode === "poll-error") throw new TypeError("fetch failed");
      if (behavior.mode === "lost") return Response.json({ error: "Run 丢失" }, { status: 404 });
      return Response.json({ id: path.split("/").at(-1), status: behavior.mode === "failed" ? "failed" : "succeeded", error: behavior.mode === "failed" ? "模型明确失败" : null,
        outputs: behavior.mode === "missing" ? [] : [{ outputSlotId: "audio", displayName: "音效", kind: "audio", mime: "audio/wav", fileName: "audio.wav", downloadUrl: "/audio.wav" }] });
    }
    if (path === "http://bridge.test/audio.wav") {
      calls.download++;
      if (behavior.mode === "download-error") return new Response("临时错误", { status: 503 });
      return new Response(new Uint8Array(wave()), { headers: { "content-type": "audio/wav" } });
    }
    throw new Error(`未允许的测试网络请求：${path}`);
  });
  return { calls, behavior };
}

test("音效 Schema 使用最大时长与实际约束，不传未公开字段", () => {
  const p = { workflowId: SFX_WORKFLOW_ID, prompt: "One tap", maxDurationSeconds: 1, seed: 42 };
  assert.deepEqual(buildSfxBridgeRequest(p, workflow), { fieldValues: { prompt: "One tap", duration_seconds: 1, seed: 42 } });
  for (const invalid of [0, 121, 1.5]) assert.throws(() => buildSfxBridgeRequest({ ...p, maxDurationSeconds: invalid }, workflow));
  assert.throws(() => buildSfxBridgeRequest({ ...p, seed: Number.MAX_SAFE_INTEGER + 1 }, workflow));
  const narrowed = structuredClone(workflow); narrowed.fields[1]!.min = 2;
  assert.throws(() => buildSfxBridgeRequest(p, narrowed), /实时范围/u);
  narrowed.fields[1]!.min = 0; narrowed.fields[1]!.step = 2;
  assert.throws(() => buildSfxBridgeRequest(p, narrowed), /步长/u);
  const missing = structuredClone(workflow); missing.fields.pop();
  assert.throws(() => buildSfxBridgeRequest(p, missing), /seed/u);
});

test("音效输入幂等、自动种子固定，旧版本重放不新增 Job", async (t) => {
  const f = await fixture(t);
  const job = f.app.submitSfxGeneration(f.input);
  f.app.repository.commit(f.id, f.rev(), "无关修改", (s) => { s.project.name = "修改项目名称"; });
  assert.equal(f.app.submitSfxGeneration(f.input).id, job.id);
  assert.equal(f.app.submitSfxGeneration({ ...f.input, baseRevision: f.rev() }).payload.seed, job.payload.seed);
  assert.throws(() => f.app.submitSfxGeneration({ ...f.input, prompt: "Another tap" }), /幂等键/u);
  assert.throws(() => f.app.submitSfxGeneration({ ...f.input, requestId: "missing", baseRevision: f.rev(), idempotencyKey: "other" }), /需求/u);
  assert.ok(MEDIA_JOB_KINDS.includes("sfx_generation"));
});

test("真实文件短于请求仍可登记，只生成候选，重放不重复登记或调用模型", async (t) => {
  const f = await fixture(t), { calls, behavior } = mockBridge(t);
  const job = f.app.submitSfxGeneration(f.input);
  behavior.onPost = () => f.app.repository.commit(f.id, f.rev(), "生成期间无关修改", (s) => { s.project.name = "剪辑继续"; });
  const result = await runSfxGeneration(f.app, job, f.bridge);
  assert.equal(result.durationMs, 100);
  const snapshot = f.app.readProject(f.id).snapshot;
  assert.equal(snapshot.assets.length, 1); assert.equal(snapshot.audioCues.length, 0);
  assert.equal(snapshot.assets[0]!.role, "sfx"); assert.equal(snapshot.assets[0]!.provenance?.generationJobId, job.id);
  assert.notEqual(snapshot.assetRequests[0]!.status, "fulfilled");
  const revision = f.rev();
  behavior.mode = "lost";
  assert.equal((await runSfxGeneration(f.app, job, f.bridge)).assetId, result.assetId);
  assert.equal(f.rev(), revision); assert.equal(calls.post, 1); assert.equal(calls.download, 1);
  assert.deepEqual(calls.requests[0], { schemaVersion: workflow.schemaVersion, fieldValues: { prompt: f.input.prompt, duration_seconds: 1, seed: job.payload.seed } });
});

test("需求在首次 POST 前变化会拒绝；生成已开始后取消需求仍保留候选", async (t) => {
  const f = await fixture(t), { calls, behavior } = mockBridge(t);
  const job = f.app.submitSfxGeneration(f.input);
  f.app.manageAssetRequirement({ projectId: f.id, baseRevision: f.rev(), action: "update", assetRequestId: f.request.id, audioBrief: "改变音色" });
  await assert.rejects(runSfxGeneration(f.app, job, f.bridge), /已改变/u);
  assert.equal(calls.post, 0);
  const next = f.app.submitSfxGeneration({ ...f.input, baseRevision: f.rev(), idempotencyKey: "new" });
  behavior.onPost = () => f.app.manageAssetRequirement({ projectId: f.id, baseRevision: f.rev(), action: "close", assetRequestId: f.request.id, closeReason: "导演决定这一处留白，不再需要采用声音", closeOutcome: "cancelled" });
  const result = await runSfxGeneration(f.app, next, f.bridge);
  assert.ok(result.assetId); assert.equal(f.app.readProject(f.id).snapshot.audioCues.length, 0);
});

for (const mode of ["unknown", "500"]) test(`提交结果未知（${mode}）不自动重放，Runtime 保留 unknown`, async (t) => {
  const f = await fixture(t), { calls, behavior } = mockBridge(t); behavior.mode = mode;
  const job = f.app.submitSfxGeneration(f.input);
  await runOneQueuedJob(f.app, ["sfx_generation"], (claimed) => runSfxGeneration(f.app, claimed, f.bridge));
  assert.equal(f.app.trackJob(job.id).status, "unknown");
  await assert.rejects(runSfxGeneration(f.app, job, f.bridge), /未知/u);
  assert.equal(calls.post, 1);
  assert.throws(() => f.app.intelligence.retry(f.id, job.id), /明确失败/u);
});

for (const mode of ["poll-error", "download-error"]) test(`${mode} 恢复原 Run，不再次生成`, async (t) => {
  const f = await fixture(t), { calls, behavior } = mockBridge(t); behavior.mode = mode;
  const job = f.app.submitSfxGeneration(f.input);
  await assert.rejects(runSfxGeneration(f.app, job, f.bridge));
  f.app.updateJob(job.id, { status: "failed", error: "测试中断" });
  const retry = f.app.intelligence.retry(f.id, job.id);
  behavior.mode = "ok";
  const result = await runSfxGeneration(f.app, retry, f.bridge);
  assert.ok(result.assetId); assert.equal(calls.post, 1);
  assert.equal(result.seed, job.payload.seed);
});

test("409 刷新后提交；明确远端失败只有显式恢复才重新生成", async (t) => {
  const f = await fixture(t), { calls, behavior } = mockBridge(t);
  behavior.mode = "409";
  const job = f.app.submitSfxGeneration(f.input);
  await runSfxGeneration(f.app, job, f.bridge);
  assert.equal(calls.post, 2);
  behavior.mode = "failed";
  const failed = f.app.submitSfxGeneration({ ...f.input, baseRevision: f.rev(), idempotencyKey: "failed" });
  await assert.rejects(runSfxGeneration(f.app, failed, f.bridge), /失败/u);
  const before = calls.post;
  await assert.rejects(runSfxGeneration(f.app, failed, f.bridge), /显式恢复/u);
  assert.equal(calls.post, before);
  f.app.updateJob(failed.id, { status: "failed" });
  const retry = f.app.intelligence.retry(f.id, failed.id);
  behavior.mode = "ok";
  await runSfxGeneration(f.app, retry, f.bridge);
  assert.equal(calls.post, before + 1);
});

test("本地登记失败与 Bridge 索引丢失可使用已保存文件，不重新下载或生成", async (t) => {
  const f = await fixture(t), { calls, behavior } = mockBridge(t);
  const job = f.app.submitSfxGeneration(f.input);
  const mocked = t.mock.method(f.app, "completeSfxGeneration", () => { throw new DomainError("本地提交被中断", "REVISION_CONFLICT"); });
  await assert.rejects(runSfxGeneration(f.app, job, f.bridge), /中断/u);
  mocked.mock.restore();
  behavior.mode = "lost";
  const result = await runSfxGeneration(f.app, job, f.bridge);
  assert.ok(result.assetId); assert.equal(calls.post, 1); assert.equal(calls.download, 1);
});

test("409 已明确拒绝后刷新失败，保存可恢复状态而不是未知提交", async (t) => {
  const f = await fixture(t), { calls, behavior } = mockBridge(t);
  behavior.mode = "409-refresh-error";
  const job = f.app.submitSfxGeneration(f.input);
  await runOneQueuedJob(f.app, ["sfx_generation"], (claimed) => runSfxGeneration(f.app, claimed, f.bridge));
  assert.equal(f.app.trackJob(job.id).status, "failed");
  const retry = f.app.intelligence.retry(f.id, job.id);
  behavior.mode = "ok";
  assert.ok((await runSfxGeneration(f.app, retry, f.bridge)).assetId);
  assert.equal(calls.post, 2, "第一次为明确拒绝，恢复只创建一次有效 Run");
});

test("缺少输出或原 Run 丢失不隐式再次生成", async (t) => {
  const f = await fixture(t), { calls, behavior } = mockBridge(t);
  for (const mode of ["missing", "lost"]) {
    behavior.mode = mode;
    const job = f.app.submitSfxGeneration({ ...f.input, baseRevision: f.rev(), idempotencyKey: mode });
    await assert.rejects(runSfxGeneration(f.app, job, f.bridge));
    const count = calls.post;
    f.app.updateJob(job.id, { status: "failed" });
    await assert.rejects(runSfxGeneration(f.app, f.app.intelligence.retry(f.id, job.id), f.bridge));
    assert.equal(calls.post, count);
  }
});

test("坏文件不登记为素材；原始文件核验不伪造听感", async (t) => {
  const f = await fixture(t), path = join(f.root, "bad.wav");
  await writeFile(path, "<html>error</html>");
  await assert.rejects(inspectGeneratedAudioFile(path, "audio/wav", true), /网页/u);
  await writeFile(path, "");
  await assert.rejects(inspectGeneratedAudioFile(path, "audio/wav", true), /为空/u);
  await writeFile(path, wave());
  await assert.rejects(inspectGeneratedAudioFile(path, "text/html"), /MIME/u);
  assert.equal((await inspectGeneratedAudioFile(path, "audio/wav", true)).durationMs, 100);
  assert.equal(f.app.readProject(f.id).snapshot.assets.length, 0);
});

test("MCP 新入口的真实 Schema 和处理器生成可追踪 Job", async (t) => {
  const f = await fixture(t);
  const tools = new Map<string, { definition: { inputSchema: z.ZodRawShape }; handler: (input: unknown) => Promise<{ isError?: boolean; content: Array<{ text: string }> }> }>();
  registerSoundTools({ registerTool(name: string, definition: { inputSchema: z.ZodRawShape }, handler: never) { tools.set(name, { definition, handler }); } } as never, f.app, () => f.id);
  const tool = tools.get("submit_sfx_generation")!;
  const input = z.object(tool.definition.inputSchema).parse({ base_revision_id: f.rev(), request_id: f.request.id, prompt: f.input.prompt, max_duration_seconds: 1, idempotency_key: "mcp" });
  const response = await tool.handler(input);
  assert.notEqual(response.isError, true);
  const job = JSON.parse(response.content[0]!.text) as JobRecord;
  assert.equal(job.kind, "sfx_generation"); assert.equal(f.app.trackJob(job.id).id, job.id);
  assert.throws(() => z.object(tool.definition.inputSchema).parse({ ...input, max_duration_seconds: 0 }));
});

test("Web 音效重试保留来源 Job，未知状态拒绝重放", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "vfc-sfx-web-")), server = await createServer({ workspaceRoot: root });
  t.after(async () => { await server.app.close(); server.application.close(); await rm(root, { recursive: true, force: true }); });
  const project = server.application.createProject({ name: "Web 重试隔离测试" });
  const original = server.application.repository.createJob({ projectId: project.snapshot.project.id, kind: "sfx_generation", payload: { seed: 42 }, idempotencyKey: "web" });
  server.application.updateJob(original.id, { status: "failed" });
  const response = await server.app.inject({ method: "POST", url: `/api/jobs/${original.id}/retry` });
  assert.equal(response.statusCode, 202); assert.equal(response.json().payload.retryOfJobId, original.id);
  const repeated = await server.app.inject({ method: "POST", url: `/api/jobs/${original.id}/retry` });
  assert.equal(repeated.json().id, response.json().id, "重复点击与 MCP 恢复复用同一子 Job");
  server.application.updateJob(original.id, { status: "unknown" });
  assert.equal((await server.app.inject({ method: "POST", url: `/api/jobs/${original.id}/retry` })).statusCode, 400);
});
