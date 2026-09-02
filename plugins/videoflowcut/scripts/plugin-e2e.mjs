import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { pluginRootFromModule, resolveRepoRoot } from "./repo-root.mjs";
import { ensureRuntime, getRuntimeStatus, stopRuntime } from "./runtime-launcher.mjs";

const pluginRoot = pluginRootFromModule(import.meta.url);
const repoRoot = resolveRepoRoot({ pluginRoot });
const workspaceRoot = await mkdtemp(join(tmpdir(), "videoflowcut-plugin-e2e-"));
const requireFromRepo = createRequire(join(repoRoot, "package.json"));
const { Client } = requireFromRepo("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = requireFromRepo("@modelcontextprotocol/sdk/client/stdio.js");

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3_000);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

let transport;
try {
  const runtime = await ensureRuntime({ pluginRoot, repoRoot, workspaceRoot });
  assert.equal(runtime.ready, true, "运行器必须报告 ready");
  const projects = await fetchWithTimeout(`${runtime.apiUrl}/api/projects`);
  assert.equal(projects.status, 200, "API 必须可读项目列表");
  assert.ok(Array.isArray(await projects.json()), "项目列表必须是数组");
  const web = await fetchWithTimeout(runtime.webUrl);
  assert.equal(web.status, 200, "Web 工作台必须可访问");
  assert.match(await web.text(), /id="root"/u, "Web 必须返回 React 根节点");

  transport = new StdioClientTransport({
    command: process.execPath,
    args: [join(pluginRoot, "scripts", "mcp-launcher.mjs")],
    cwd: pluginRoot,
    env: { ...process.env, VIDEOFLOWCUT_REPO_ROOT: repoRoot, VIDEOCUT_WORKSPACE: workspaceRoot },
    stderr: "pipe"
  });
  const client = new Client({ name: "videoflowcut-plugin-e2e", version: "1.0.0" });
  await client.connect(transport);
  const textFromResult = (result) => {
    const content = result?.content;
    const first = Array.isArray(content) ? content.find((entry) => entry?.type === "text") : undefined;
    if (result?.isError || typeof first?.text !== "string") throw new Error(first?.text ?? "MCP 未返回标准文本结果");
    return first.text;
  };
  const call = async (name, args) => JSON.parse(textFromResult(await client.callTool({ name, arguments: args })));
  const waitForJob = async (jobId) => {
    const deadline = Date.now() + 60_000;
    while (Date.now() < deadline) {
      const job = await call("track_job", { job_id: jobId });
      if (job.status === "succeeded") return job;
      if (job.status === "failed") throw new Error(`Worker 任务失败：${job.error ?? jobId}`);
      await new Promise((resolveWait) => setTimeout(resolveWait, 300));
    }
    throw new Error(`Worker 未在时限内消费任务：${jobId}`);
  };
  const tools = await client.listTools();
  assert.ok(tools.tools.some((tool) => tool.name === "inspect_asset"), "插件 MCP 必须发现 inspect_asset");
  assert.ok(tools.tools.some((tool) => tool.name === "list_projects"), "插件 MCP 必须发现基础只读工具");
  assert.ok(tools.tools.some((tool) => tool.name === "open_web_workbench"), "插件 MCP 必须提供工作台入口");

  // 使用仓库内真实视频证明 Runtime 中的媒体 Worker 不只是“进程存在”，而是会消费新任务。
  const sourceVideo = join(repoRoot, "videos", "数字人口播", "segment-01.mp4");
  assert.equal(existsSync(sourceVideo), true, "插件 E2E 需要 videos/数字人口播/segment-01.mp4 测试素材");
  const project = await call("create_project", { name: "插件 Runtime 媒体任务验收", profile: "presenter_motion" });
  const imported = await call("import_media", {
    project_id: project.snapshot.project.id,
    base_revision_id: project.revision.number,
    file_path: sourceVideo,
    role: "a_roll",
    provenance: { source: "local_import", rights_status: "cleared" }
  });
  const analyzed = await waitForJob(imported.job.id);
  assert.equal(analyzed.status, "succeeded", "媒体 Worker 必须完成真实素材分析");
  await transport.close();
  transport = undefined;

  const beforeStop = await getRuntimeStatus({ pluginRoot, repoRoot, workspaceRoot });
  assert.equal(beforeStop.ready, true, "MCP 关闭后 Runtime 必须仍可复用");
  const stopped = await stopRuntime({ pluginRoot, repoRoot, workspaceRoot }, { force: true });
  assert.equal(stopped.stopped, true, "运行器必须可停止");
  const afterStop = await getRuntimeStatus({ pluginRoot, repoRoot, workspaceRoot });
  assert.equal(afterStop.ready, false, "停止后 Runtime 不应继续可用");
  console.log("VideoFlowCut 插件 Runtime、Web 与 MCP E2E 验证通过。");
} finally {
  if (transport) await transport.close().catch(() => undefined);
  await stopRuntime({ pluginRoot, repoRoot, workspaceRoot }, { force: true }).catch(() => undefined);
  await rm(workspaceRoot, { recursive: true, force: true });
}
