import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import test from "node:test";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { BridgeUnavailableError, ComfyUIBridgeClient } from "@videocut/bridge";

const workflow = { id: "recovery", name: "恢复验证", schemaVersion: "v1", fields: [], itemSlots: [], outputs: [] };

test("超过 260 字符的受管文件正常 multipart 上传，上传前错误不算未知提交", async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-bridge-path-"));
  let submissions = 0;
  const server = createServer(async (request, response) => {
    const chunks: Buffer[] = []; for await (const chunk of request) chunks.push(Buffer.from(chunk));
    const body = Buffer.concat(chunks).toString("utf8");
    assert.ok(body.includes('name="file_audio"') && body.includes("原声测试"));
    submissions++; response.setHeader("content-type", "application/json"); response.end(JSON.stringify({ id: "00000000-0000-4000-8000-000000000001", status: "queued", outputs: [] }));
  });
  const port = await listen(server);
  try {
    const directory = join(root, ...Array.from({ length: 8 }, (_, index) => `segment-${index}-${"x".repeat(30)}`));
    await mkdir(directory, { recursive: true }); const path = join(directory, "source.wav"); await writeFile(path, "原声测试");
    const client = new ComfyUIBridgeClient(`http://127.0.0.1:${port}`);
    const slot = { id: "audio", label: "音频", mediaKind: "audio", min: 1, max: 1 };
    assert.equal((await client.createRun({ workflow, runId: "00000000-0000-4000-8000-000000000001", fieldValues: {}, files: [{ slot, path, mime: "audio/wav" }] })).id, "00000000-0000-4000-8000-000000000001");
    await assert.rejects(client.createRun({ workflow, runId: "00000000-0000-4000-8000-000000000001", fieldValues: {}, files: [{ slot, path: join(root, "missing.wav") }] }), (error: unknown) => error instanceof Error && "code" in error && error.code === "BRIDGE_INPUT_UNREADABLE");
    assert.equal(submissions, 1);
  } finally { await close(server); await rm(root, { recursive: true, force: true }); }
});
const listen = (server: Server, port = 0) => new Promise<number>((resolve, reject) => {
  server.once("error", reject);
  server.listen(port, "127.0.0.1", () => {
    server.off("error", reject);
    resolve((server.address() as AddressInfo).port);
  });
});
const close = (server: Server) => new Promise<void>((resolve, reject) => {
  server.closeAllConnections();
  server.close((error) => error ? reject(error) : resolve());
});

test("真实 Bridge 离线后恢复：诊断拒绝连接，恢复后只提交一次 Run", async () => {
  let runCalls = 0;
  const server = createServer((request, response) => {
    response.setHeader("content-type", "application/json");
    if (request.method === "POST") {
      runCalls++;
      response.end(JSON.stringify({ id: request.headers["x-comfyui-bridge-run-id"], status: "queued", outputs: [] }));
    } else response.end(JSON.stringify(request.url?.endsWith("/health") ? { status: "ready" } : workflow));
  });
  const port = await listen(server);
  await close(server);
  const client = new ComfyUIBridgeClient(`http://127.0.0.1:${port}/comfyui-bridge/v2`, { readinessTimeoutMs: 0 });
  await assert.rejects(() => client.getWorkflow(workflow.id), (error: unknown) =>
    error instanceof BridgeUnavailableError && error.code === "BRIDGE_UNAVAILABLE" && error.message.includes("ECONNREFUSED"));
  assert.equal(runCalls, 0, "服务不可达时没有生成副作用");
  await listen(server, port);
  try {
    const result = await client.createRunWithWorkflow(workflow.id, async () => ({ fieldValues: {} }));
    assert.match(result.run.id, /^[0-9a-f-]{36}$/u);
    assert.equal(runCalls, 1);
  } finally { await close(server); }
});

test("Bridge 接收后断连时保存原 UUID，并只查询原任务", async () => {
  let runCalls = 0, remoteId = "", savedId = "";
  const server = createServer((request, response) => {
    if (request.method === "POST") {
      runCalls++;
      remoteId = String(request.headers["x-comfyui-bridge-run-id"]);
      assert.equal(remoteId, savedId, "必须在发送前持久化 Run ID");
      request.socket.destroy();
    } else {
      response.setHeader("content-type", "application/json");
      if (request.url === `/runs/${remoteId}`) response.end(JSON.stringify({ id: remoteId, status: "succeeded", outputs: [{ kind: "text", text: "完成" }] }));
      else response.end(JSON.stringify(workflow));
    }
  });
  const port = await listen(server);
  try {
    const client = new ComfyUIBridgeClient(`http://127.0.0.1:${port}`);
    await assert.rejects(() => client.createRunWithWorkflow(workflow.id, async () => ({ fieldValues: {} }), {
      beforeSubmit: (pending) => { savedId = pending.run.id; }
    }), BridgeUnavailableError);
    const recovered = await client.getRun(savedId);
    assert.equal(recovered.status, "succeeded");
    assert.equal(runCalls, 1, "未知结果只能查询原 ID，不能自动重发");
  } finally { await close(server); }
});

test("Bridge 传输诊断只提取错误码，不泄露 cause 中的凭据", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new TypeError("fetch failed", { cause: Object.assign(new Error("http://user:secret@bridge.test"), { code: "ECONNREFUSED" }) }); };
  try {
    const client = new ComfyUIBridgeClient("http://bridge.test/comfyui-bridge/v2");
    await assert.rejects(() => client.health(), (error: unknown) => error instanceof BridgeUnavailableError
      && error.message.includes("ECONNREFUSED") && !error.message.includes("secret"));
  } finally { globalThis.fetch = originalFetch; }
});
