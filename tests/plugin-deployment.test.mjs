import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { runDeploymentSmoke } from "../scripts/plugin-deployment-smoke.mjs";
import { assertProductionSmoke, assertRuntimeReady, verifyDeploymentPreview } from "../scripts/verify-plugin-deployment.mjs";

const releaseId = "release-current";
const projectId = "isolated-project";
const switchedAt = Date.parse("2026-01-01T00:00:00Z");

test("VideoFlowCut 与 Worker 就绪时，OD 旧版仍阻断部署", () => {
  const report = {
    aligned: true, launcherReleaseId: releaseId, mcpReleaseId: releaseId,
    runtime: { releaseId, status: "ready", workers: { media: true, render: true } },
    openDesign: { status: "release_mismatch", releaseId: "release-old" }
  };
  assert.throws(() => assertRuntimeReady(report, releaseId), /OD 未就绪.*release_mismatch.*release-old/);
  report.openDesign = { status: "ready", releaseId };
  assert.doesNotThrow(() => assertRuntimeReady(report, releaseId));
});

test("验收校验冻结回件、同版预览和实际文件摘要", async () => {
  const authoring = {
    id: "authoring-job", kind: "motion_authoring", projectId, status: "succeeded",
    createdAt: "2026-01-01T00:01:00Z", updatedAt: "2026-01-01T00:02:00Z",
    result: { authoring: { status: "incomplete", receipts: [] } }
  };
  const preview = {
    id: "preview-job", kind: "preview", projectId, status: "succeeded", createdAt: "2026-01-01T00:03:00Z",
    result: { revision: 7, releaseId, fromFrame: 0, toFrame: 12, sourceHash: "preview-hash" }
  };
  assert.throws(() => assertProductionSmoke(authoring, preview, projectId, switchedAt, releaseId), /缺少已接回/);
  authoring.result.authoring = { status: "succeeded", receipts: [{
    runId: "run", frozenVersion: "frozen", workId: "work", revision: 7, ranges: [{ startFrame: 0, endFrame: 12 }]
  }] };
  assert.equal(assertProductionSmoke(authoring, preview, projectId, switchedAt, releaseId).frozenVersion, "frozen");
  const directory = await mkdtemp(join(tmpdir(), "vfc-deploy-preview-"));
  try {
    preview.result.path = join(directory, "preview.mp4");
    await writeFile(preview.result.path, "abc");
    preview.result.sourceHash = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";
    await verifyDeploymentPreview(authoring, preview, projectId, switchedAt, releaseId);
    await writeFile(preview.result.path, "changed");
    await assert.rejects(verifyDeploymentPreview(authoring, preview, projectId, switchedAt, releaseId), /摘要不一致/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
  preview.result.releaseId = "release-old";
  assert.throws(() => assertProductionSmoke(authoring, preview, projectId, switchedAt, releaseId), /渲染 Worker/);
});

test("自动验收通过真实 MCP 提交独立制作，续接保留原任务", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "vfc-deploy-smoke-"));
  const client = new Client({ name: "deploy-test", version: "1" });
  const transport = new StdioClientTransport({
    command: process.execPath, args: ["--import", "tsx", "apps/server/src/mcp.ts"], cwd: process.cwd(),
    env: { ...process.env, VIDEOCUT_WORKSPACE: workspace }, stderr: "pipe"
  });
  const text = data => ({ content: [{ type: "text", text: JSON.stringify(data) }] });
  const od = { callTool: async ({ name, arguments: args }) => {
    assert.equal(name, "create_project");
    return text({ id: args.id });
  } };
  const receipt = { id: "test" };
  const calls = [];
  const recording = { callTool: async (params, ...rest) => {
    calls.push(params.name);
    return client.callTool(params, ...rest);
  } };
  try {
    await client.connect(transport);
    const stop = () => { throw new Error("测试暂停等待"); };
    await assert.rejects(runDeploymentSmoke(recording, od, receipt, async () => {}, { pause: stop }), /测试暂停等待/);
    assert.ok(receipt.smoke.authoringJobId);
    assert.equal(receipt.smoke.authoringRequest.opendesign_request.project, "vfc-deploy-test");
    calls.length = 0;
    await assert.rejects(runDeploymentSmoke(recording, od, receipt, async () => {}, { pause: stop }), /测试暂停等待/);
    assert.deepEqual(calls, ["track_job"]);

    const frozen = { runId: "od-run", frozenVersion: "frozen", workId: "work",
      revision: 7, ranges: [{ startFrame: 4, endFrame: 24 }] };
    const simulated = { callTool: async ({ name, arguments: args }) => {
      if (name === "render_preview_range") {
        assert.equal(args.revision, 7);
        assert.deepEqual([args.from_frame, args.to_frame], [4, 16]);
        return text({ id: "preview" });
      }
      assert.equal(name, "track_job");
      return text(args.job_id === "preview" ? { id: "preview", status: "succeeded" }
        : { status: "succeeded", result: { authoring: { status: "succeeded", receipts: [frozen] } } });
    } };
    await runDeploymentSmoke(simulated, od, receipt, async () => {});
    assert.equal(receipt.smoke.previewJobId, "preview");
  } finally {
    await client.close().catch(() => {});
    await transport.close().catch(() => {});
    await rm(workspace, { recursive: true, force: true });
  }
});

test("统一部署命令失败时保存本次回执并返回非零", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "vfc-deploy-receipt-"));
  const receipt = join(workspace, "receipt.json");
  try {
    const env = { ...process.env };
    delete env.npm_execpath;
    const invoke = promisify(execFile);
    await assert.rejects(invoke(process.execPath, ["scripts/deploy-plugin.mjs", "--codex-cli", process.execPath, "--receipt", receipt],
      { env, windowsHide: true }), error => error.code === 1 && error.stderr.includes("请通过 npm"));
    const outcome = JSON.parse(await readFile(receipt, "utf8"));
    assert.equal(outcome.success, false);
    assert.equal(outcome.failure.step, "构建发行");
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});
