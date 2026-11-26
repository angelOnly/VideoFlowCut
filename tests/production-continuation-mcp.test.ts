import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { createApplication } from "@videocut/application";

test("正式 MCP 能启用当前回合续办并按 Run 登记等待任务", async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-continuation-mcp-"));
  const app = createApplication(root);
  const candidate = process.env.VFC_CONTINUATION_CANDIDATE;
  const releaseId = candidate ? (JSON.parse(await readFile(join(candidate, "manifest.json"), "utf8")) as { releaseId: string }).releaseId : undefined;
  const transport = new StdioClientTransport({ command: process.execPath,
    args: candidate ? [join(candidate, "mcp.cjs")] : ["--import", "tsx", resolve("apps/server/src/mcp.ts")], cwd: resolve("."), stderr: "pipe",
    env: { ...process.env, VIDEOCUT_WORKSPACE: root, VIDEOFLOWCUT_RUNTIME_ORIGIN: "http://127.0.0.1:19186",
      WEB_ORIGIN: "http://127.0.0.1:19186", COMFYUI_BRIDGE_URL: "http://127.0.0.1:19187",
      ...(candidate ? { VIDEOFLOWCUT_REPO_ROOT: resolve("."), VIDEOFLOWCUT_RUNTIME_DIST: candidate,
        VIDEOFLOWCUT_RELEASE_ID: releaseId!, NODE_PATH: resolve("node_modules") } : {}) } });
  const client = new Client({ name: "isolated-test", version: "1" });
  try {
    const project = app.createProject({ name: "隔离 MCP", profile: "visual_explainer" });
    const projectId = project.snapshot.project.id;
    const run = await app.startProductionRun({ projectId, baseRevision: project.revision.number, intent: "full_creation",
      completionScope: { kind: "project" }, operationId: "mcp-test", loadedSkills: ["production-coordinator"] });
    const job = app.repository.createJob({ projectId, kind: "motion_reference_analysis", payload: {}, idempotencyKey: "reference" });
    await client.connect(transport);
    const call = async (name: string, args: Record<string, unknown>) => {
      const result = await client.callTool({ name, arguments: args });
      assert.notEqual(result.isError, true, JSON.stringify(result.content));
      return JSON.parse((result.content as Array<{ type: string; text: string }>).find(item => item.type === "text")!.text);
    };
    const tools = (await client.listTools()).tools.map(item => item.name);
    assert.ok(tools.includes("enable_production_continuation"));
    assert.ok(tools.includes("reconcile_media_job"));
    const enabled = await call("enable_production_continuation", { project_id: projectId, run_id: run.id });
    assert.equal(enabled.runtimeOrigin, "http://127.0.0.1:19186");
    await call("update_production_run", { project_id: projectId, run_id: run.id, expected_audit_version: run.auditVersion,
      operation_id: "watch", action: "watch_job", job_id: job.id, job_scope: { kind: "project" }, required: true, next_action: "接回结果" });
    const status = await call("read_production_status", { project_id: projectId, run_id: run.id });
    assert.ok(status.progress.waiting.some((entry: { jobId: string }) => entry.jobId === job.id));
  } finally {
    await client.close();
    app.repository.close();
    await rm(root, { recursive: true, force: true });
  }
});
