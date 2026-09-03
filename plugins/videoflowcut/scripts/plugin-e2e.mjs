import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { pluginRootFromModule, resolveReleaseRuntime, resolveRepoRoot } from "./repo-root.mjs";
import { ensureRuntime, findAvailablePort, getRuntimeStatus, stopRuntime } from "./runtime-launcher.mjs";

const pluginRoot = pluginRootFromModule(import.meta.url);
const repoRoot = resolveRepoRoot({ pluginRoot });
const release = resolveReleaseRuntime(pluginRoot);
const workspaceRoot = await mkdtemp(join(tmpdir(), "videoflowcut-plugin-e2e-"));
const runtimePort = await findAvailablePort();
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
let untrustedProcess;

function processIsAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

try {
  // 陈旧状态即使恰好命中已复用的 PID，也绝不能成为强杀未知进程的授权。
  untrustedProcess = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"], {
    windowsHide: true,
    stdio: "ignore"
  });
  assert.ok(untrustedProcess.pid, "安全性验证需要启动独立的未知进程");
  const runtimeStateDirectory = join(workspaceRoot, ".videoflowcut-runtime");
  const runtimeStateName = runtimePort === 3100 ? "runtime.json" : `runtime-${runtimePort}.json`;
  await mkdir(runtimeStateDirectory, { recursive: true });
  await writeFile(join(runtimeStateDirectory, runtimeStateName), `${JSON.stringify({
    schemaVersion: 3,
    runtimeId: "stale-runtime",
    controlToken: "not-a-real-runtime-token",
    repoRoot,
    workspaceRoot,
    port: runtimePort,
    apiUrl: `http://127.0.0.1:${runtimePort}`,
    runtimeEntry: join(pluginRoot, "runtime", "dist", "runtime.cjs"),
    distributionRoot: join(pluginRoot, "runtime", "dist"),
    releaseId: release.releaseId,
    pid: untrustedProcess.pid
  }, null, 2)}\n`, "utf8");
  const rejectedStop = await stopRuntime({ pluginRoot, repoRoot, workspaceRoot, port: runtimePort }, { force: true });
  assert.equal(rejectedStop.stopped, false, "未认证状态不得被当作本插件 Runtime");
  assert.equal(processIsAlive(untrustedProcess.pid), true, "停止器不能终止状态文件指向的未知 PID");
  untrustedProcess.kill();
  await rm(join(runtimeStateDirectory, runtimeStateName), { force: true });

  const runtime = await ensureRuntime({ pluginRoot, repoRoot, workspaceRoot, port: runtimePort });
  assert.equal(runtime.ready, true, "运行器必须报告 ready");
  assert.equal(runtime.releaseId, release.releaseId, "Runtime 状态必须包含当前构建 Release ID");
  assert.equal(runtime.port, runtimePort, "E2E 必须使用独立 Runtime 端口");
  const projects = await fetchWithTimeout(`${runtime.apiUrl}/api/projects`);
  assert.equal(projects.status, 200, "API 必须可读项目列表");
  assert.ok(Array.isArray(await projects.json()), "项目列表必须是数组");
  const runtimeReleaseResponse = await fetchWithTimeout(`${runtime.apiUrl}/api/runtime/status`);
  assert.equal(runtimeReleaseResponse.status, 200, "Runtime 必须提供不含控制令牌的发行状态接口");
  const runtimeRelease = await runtimeReleaseResponse.json();
  assert.equal(runtimeRelease.releaseId, release.releaseId, "Runtime 公开发行状态必须匹配 manifest");

  // 模拟新构建落地后磁盘仍记录旧 Release 的常见切换现场：只有控制令牌认证成功，
  // 启动器才可停止旧 Runtime 并拉起新实例；未知 PID 仍由前面的安全性用例保护。
  const currentRuntimeStatePath = join(runtimeStateDirectory, runtimeStateName);
  const recordedRuntime = JSON.parse(await readFile(currentRuntimeStatePath, "utf8"));
  await writeFile(currentRuntimeStatePath, `${JSON.stringify({
    ...recordedRuntime,
    releaseId: `release-${"0".repeat(64)}`
  }, null, 2)}\n`, "utf8");
  const cutoverRuntime = await ensureRuntime({ pluginRoot, repoRoot, workspaceRoot, port: runtimePort });
  assert.equal(cutoverRuntime.ready, true, "旧发行状态必须通过受控切换重新部署 Runtime");
  assert.equal(cutoverRuntime.releaseId, release.releaseId, "受控切换后 Runtime 必须恢复 manifest Release ID");
  const web = await fetchWithTimeout(runtime.webUrl);
  assert.equal(web.status, 200, "Web 工作台必须可访问");
  assert.match(await web.text(), /id="root"/u, "Web 必须返回 React 根节点");

  transport = new StdioClientTransport({
    command: process.execPath,
    args: [join(pluginRoot, "scripts", "mcp-launcher.mjs")],
    cwd: pluginRoot,
    env: {
      ...process.env,
      VIDEOFLOWCUT_REPO_ROOT: repoRoot,
      VIDEOCUT_WORKSPACE: workspaceRoot,
      VIDEOFLOWCUT_PORT: String(runtimePort)
    },
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
  assert.ok(tools.tools.some((tool) => tool.name === "read_runtime_release"), "插件 MCP 必须提供发行版本核验");
  assert.ok(tools.tools.some((tool) => tool.name === "report_editing_blocker"), "插件 MCP 必须提供剪辑阻断报告");
  const workbench = await call("open_web_workbench", {});
  assert.equal(workbench.url, runtime.webUrl, "MCP 工作台入口必须指向同一个隔离 Runtime");

  // 使用仓库内真实视频证明 Runtime 中的媒体 Worker 不只是“进程存在”，而是会消费新任务。
  const sourceVideo = join(repoRoot, "videos", "数字人口播", "segment-01.mp4");
  assert.equal(existsSync(sourceVideo), true, "插件 E2E 需要 videos/数字人口播/segment-01.mp4 测试素材");
  const project = await call("create_project", { name: "插件 Runtime 媒体任务验收", profile: "presenter_motion" });
  const releaseRead = await call("read_runtime_release", {});
  assert.equal(releaseRead.aligned, true, "MCP 与 Runtime 必须报告同一 Release ID");
  assert.equal(releaseRead.mcpReleaseId, release.releaseId);
  const ticket = await call("report_editing_blocker", {
    project_id: project.snapshot.project.id,
    reported_revision: project.revision.number,
    category: "tool_error",
    summary: "E2E 验证平台修复交接，不执行临时绕过。",
    reporter_id: "plugin-e2e-editor",
    idempotency_key: "plugin-e2e-repair-ticket"
  });
  assert.equal(ticket.status, "open", "阻断报告必须写入独立 Repair Ticket");
  const claimedTicket = await call("claim_repair_ticket", { ticket_id: ticket.id, repairer_id: "plugin-e2e-repairer" });
  const readyTicket = await call("mark_repair_candidate_ready", {
    ticket_id: ticket.id,
    repairer_id: "plugin-e2e-repairer",
    candidate_release_id: release.releaseId,
    validation_summary: "E2E 在隔离工作区验证发行 Runtime、MCP 与健康检查。"
  });
  assert.equal(claimedTicket.status, "claimed");
  assert.equal(readyTicket.status, "ready_for_cutover");
  const deployedTicket = await call("mark_repair_deployed", {
    ticket_id: ticket.id,
    repairer_id: "plugin-e2e-repairer",
    deployment_evidence: "同一 Release ID 的 MCP、Runtime、媒体 Worker 和渲染 Worker 均健康。"
  });
  assert.equal(deployedTicket.status, "deployed");
  const acknowledgedTicket = await call("acknowledge_repair_deployment", {
    ticket_id: ticket.id,
    editor_id: "plugin-e2e-editor",
    observed_revision: project.revision.number
  });
  assert.equal(acknowledgedTicket.status, "acknowledged", "剪辑任务必须在新版 MCP 实测后确认恢复");
  const imported = await call("import_media", {
    project_id: project.snapshot.project.id,
    base_revision_id: project.revision.number,
    file_path: sourceVideo,
    role: "a_roll",
    provenance: { source: "local_import", rights_status: "cleared" }
  });
  const analyzed = await waitForJob(imported.job.id);
  assert.equal(analyzed.status, "succeeded", "媒体 Worker 必须完成真实素材分析");

  // 用发行版 render-entry.cjs 做一秒真实合成，防止 E2E 只验证媒体 Worker 而遗漏 Remotion 发行入口。
  let projectState = await call("read_project", { project_id: project.snapshot.project.id });
  const importedAsset = projectState.snapshot.assets.find((asset) => asset.status === "ready" && asset.kind === "video");
  assert.ok(importedAsset?.id, "媒体分析完成后必须存在可播放视频 Asset");
  const assembled = await call("assemble_presenter_track", {
    project_id: project.snapshot.project.id,
    base_revision_id: projectState.revision.number,
    asset_ids: [importedAsset.id]
  });
  projectState = await call("read_project", { project_id: project.snapshot.project.id });
  const actorTrack = projectState.snapshot.timeline.tracks.find((track) => track.name === "Actor / A-roll");
  const actorItem = projectState.snapshot.timeline.items.find((item) => item.trackId === actorTrack?.id && !item.disabled);
  assert.ok(actorItem, "组装 Presenter A-roll 后必须存在主画面 Timeline Item");
  await call("compile_presenter_scenes", {
    project_id: project.snapshot.project.id,
    base_revision_id: assembled.revision.number,
    scenes: [{
      title: "发行 Runtime 预览场景",
      purpose: "验证插件发行版能从受管素材合成实际 Preview。",
      start_frame: actorItem.startFrame,
      end_frame: actorItem.endFrame,
      style_pack_id: "default-clean"
    }]
  });
  projectState = await call("read_project", { project_id: project.snapshot.project.id });
  const previewToFrame = Math.min(projectState.snapshot.timeline.durationInFrames, 24);
  const preview = await call("render_preview_range", {
    project_id: project.snapshot.project.id,
    revision: projectState.revision.number,
    from_frame: 0,
    to_frame: previewToFrame,
    idempotency_key: "plugin-release-render-preview"
  });
  const rendered = await waitForJob(preview.id);
  assert.equal(rendered.status, "succeeded", "发行版 Render Worker 必须完成 Preview 合成");
  const composedFrames = await call("inspect_composed_frames", {
    project_id: project.snapshot.project.id,
    preview_job_id: preview.id,
    frames: [0, previewToFrame - 1]
  });
  assert.equal(composedFrames.frames.length, 2, "发行版 Preview 必须可提取实际合成帧");
  await transport.close();
  transport = undefined;

  const beforeStop = await getRuntimeStatus({ pluginRoot, repoRoot, workspaceRoot, port: runtimePort });
  assert.equal(beforeStop.ready, true, "MCP 关闭后 Runtime 必须仍可复用");
  const stopped = await stopRuntime({ pluginRoot, repoRoot, workspaceRoot, port: runtimePort }, { force: true });
  assert.equal(stopped.stopped, true, "运行器必须可停止");
  const afterStop = await getRuntimeStatus({ pluginRoot, repoRoot, workspaceRoot, port: runtimePort });
  assert.equal(afterStop.ready, false, "停止后 Runtime 不应继续可用");
  console.log("VideoFlowCut 插件 Runtime、Web 与 MCP E2E 验证通过。");
} finally {
  if (transport) await transport.close().catch(() => undefined);
  await stopRuntime({ pluginRoot, repoRoot, workspaceRoot, port: runtimePort }, { force: true }).catch(() => undefined);
  if (untrustedProcess?.pid && processIsAlive(untrustedProcess.pid)) untrustedProcess.kill();
  await rm(workspaceRoot, { recursive: true, force: true });
}
