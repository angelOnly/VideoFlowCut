import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile } from "node:fs/promises";
import { isAbsolute, join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const requiredTools = {
  videoflowcut: ["read_runtime_release", "track_job", "render_preview_range"],
  open_design: ["list_skills", "create_project", "start_run", "read_frozen_work"]
};

export function assertRuntimeReady(report, releaseId) {
  assert.ok(report.aligned && report.mcpReleaseId === releaseId
    && report.launcherReleaseId === releaseId && report.runtime?.releaseId === releaseId,
  "VideoFlowCut 启动器、MCP 和 Runtime 必须与本次发行一致");
  assert.ok(report.runtime.status === "ready" && report.runtime.workers?.media === true
    && report.runtime.workers?.render === true, "Runtime、媒体和渲染 Worker 必须就绪");
  assert.ok(report.openDesign?.status === "ready" && report.openDesign.releaseId === releaseId,
    `OD 未就绪（${report.openDesign?.status ?? "无状态"}），实际 ${report.openDesign?.releaseId ?? "未知"}，期望 ${releaseId}`);
}

export function assertProductionSmoke(authoring, bake, preview, renderRevision, projectId, switchedAt, releaseId) {
  for (const [job, kind] of [[authoring, "motion_authoring"], [bake, "motion_generation"], [preview, "preview"]]) {
    assert.ok(job.kind === kind && job.projectId === projectId && job.status === "succeeded"
      && Date.parse(job.createdAt) >= switchedAt, `${kind} 缺少切换后验收项目的成功任务`);
  }
  const stage = authoring.result?.authoring;
  const receipt = stage?.receipts?.at(-1);
  assert.ok(stage?.status === "succeeded" && receipt?.runId && receipt.frozenVersion && receipt.workId
    && receipt.ranges?.length && !["rejected", "needs_reconfirmation"].includes(receipt.status),
  "OD 制作缺少已接回的冻结阶段作品");
  assert.ok(bake.payload?.fixedWorkId === receipt.workId && bake.payload?.fixedDefinitionHash === receipt.definitionHash
    && bake.result?.workId === receipt.workId && bake.result?.assetId, "派生媒体须来自接回的冻结作品");
  assert.ok(Number.isInteger(renderRevision) && renderRevision >= receipt.revision && preview.result?.revision === renderRevision,
    "预览须使用已登记该作品媒体的 Revision");
  assert.equal(preview.result.releaseId, releaseId, "预览须由本次发行的渲染 Worker 生成");
  assert.ok(Date.parse(bake.createdAt) >= Date.parse(authoring.updatedAt) && Date.parse(preview.createdAt) >= Date.parse(bake.updatedAt)
    && preview.result?.sourceHash && receipt.ranges.some(range =>
      preview.result.fromFrame >= range.startFrame && preview.result.toFrame <= range.endFrame
      && preview.result.toFrame > preview.result.fromFrame), "预览须覆盖已接回作品中的实际帧");
  return { runId: receipt.runId, frozenVersion: receipt.frozenVersion, workId: receipt.workId,
    revision: renderRevision, authoringJobId: authoring.id, bakeJobId: bake.id, previewJobId: preview.id };
}

export async function callDeploymentTool(client, name, args = {}) {
  const result = await client.callTool({ name, arguments: args }, undefined, { timeout: 60_000 });
  const text = result.content.find(item => item.type === "text")?.text;
  assert.ok(!result.isError && text, `${name} 返回错误：${text ?? "无工具回执"}`);
  return JSON.parse(text);
}

export async function connectDeploymentServer(server) {
  const { command, args, cwd, env } = server.transport;
  const client = new Client({ name: "videoflowcut-deployment", version: "1.0.0" });
  const transport = new StdioClientTransport({ command, args, cwd, env: { ...process.env, ...env } });
  try {
    await client.connect(transport, { timeout: server.startup_timeout_sec * 1000 });
    return client;
  } catch (error) {
    await transport.close().catch(() => {});
    throw error;
  }
}

export async function verifyDeploymentTools(client, name, installedRoot) {
  assert.ok(Object.hasOwn(requiredTools, name), `${name} 缺少功能验收`);
  const available = new Set();
  let cursor;
  do {
    const page = await client.listTools(cursor ? { cursor } : {});
    for (const tool of page.tools) available.add(tool.name);
    cursor = page.nextCursor;
  } while (cursor);
  const catalog = name === "videoflowcut"
    ? JSON.parse(await readFile(join(installedRoot, "runtime", "dist", "mcp-tools.json"), "utf8")) : null;
  for (const tool of [...requiredTools[name], ...(catalog?.tools ?? []).map(item => item.name)]) {
    assert.ok(available.has(tool), `${name} 缺少 ${tool}`);
  }
  if (name === "open_design") {
    const skills = await callDeploymentTool(client, "list_skills");
    assert.ok(JSON.stringify(skills).includes("motion-design"), "OD 缺少动效制作技能");
  }
  return { tools: available.size };
}

export async function verifyDeploymentPreview(authoring, bake, preview, renderRevision, projectId, switchedAt, releaseId) {
  const production = assertProductionSmoke(authoring, bake, preview, renderRevision, projectId, switchedAt, releaseId);
  assert.ok(typeof preview.result.path === "string" && isAbsolute(preview.result.path), "预览缺少本机交付路径");
  const hash = createHash("sha256");
  for await (const bytes of createReadStream(preview.result.path)) hash.update(bytes);
  assert.equal(hash.digest("hex"), preview.result.sourceHash, "预览文件与渲染回件摘要不一致");
  return production;
}
