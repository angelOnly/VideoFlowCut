import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { isAbsolute, join, relative, resolve } from "node:path";
import { createRequire } from "node:module";
import { promisify } from "node:util";
import { pluginRootFromModule, resolveRepoRoot } from "./repo-root.mjs";
import { readOpenDesignStatus } from "./open-design-release.mjs";
import { findAvailablePort, stopRuntime } from "./runtime-launcher.mjs";

const sourcePlugin = pluginRootFromModule(import.meta.url);
const repoRoot = resolveRepoRoot({ pluginRoot: sourcePlugin });
const sourceRelease = resolve(process.env.VFC_TEST_RELEASE_DIR ?? join(sourcePlugin, "runtime", "dist"));
const root = await mkdtemp(join(tmpdir(), "videoflowcut-open-design-e2e-"));
const pluginRoot = join(root, "plugin"), workspace = join(root, "workspace"), dataRoot = join(root, "design-data");
const namespace = `vfc-test-${process.pid}`;
process.env.VIDEOFLOWCUT_OD_NAMESPACE = namespace;
const toolsRoot = join(workspace, ".videoflowcut-runtime", "open-design-sidecars");
const toolsDev = join(repoRoot, "components", "open-design", "tools", "dev", "dist", "index.mjs");
const exec = promisify(execFile);
const require = createRequire(join(repoRoot, "package.json"));
const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");
let client, transport, passed = false;
const env = { ...process.env, VIDEOFLOWCUT_REPO_ROOT: repoRoot, VIDEOCUT_WORKSPACE: workspace,
  OD_DATA_DIR: dataRoot, VIDEOFLOWCUT_OD_NAMESPACE: namespace };
delete env.OD_SIDECAR_CLIENT_ENDPOINT;
delete env.OD_DAEMON_URL;

try {
  await cp(join(sourcePlugin, "scripts"), join(pluginRoot, "scripts"), { recursive: true });
  await cp(join(sourcePlugin, ".codex-plugin"), join(pluginRoot, ".codex-plugin"), { recursive: true });
  await mkdir(join(pluginRoot, "runtime"), { recursive: true });
  await cp(sourceRelease, join(pluginRoot, "runtime", "dist"), { recursive: true });
  transport = new StdioClientTransport({ command: process.execPath, args: [join(pluginRoot, "scripts", "open-design-mcp-launcher.mjs")],
    cwd: pluginRoot, env, stderr: "pipe" });
  let diagnostic = "";
  transport.stderr?.on("data", chunk => { diagnostic += chunk.toString(); });
  client = new Client({ name: "videoflowcut-open-design-e2e", version: "1.0.0" });
  try { await client.connect(transport, { timeout: 180_000 }); }
  catch (error) { throw new Error(`画面工具未连接：${error.message}\n${diagnostic}`); }
  const tools = await client.listTools();
  for (const name of ["list_skills", "create_project", "start_run", "prepare_authored_work_submission", "freeze_project_work", "read_frozen_work"]) {
    assert.ok(tools.tools.some(tool => tool.name === name), `缺少画面工具：${name}`);
  }
  const skills = await client.callTool({ name: "list_skills", arguments: {} });
  assert.notEqual(skills.isError, true, JSON.stringify(skills.content));
  assert.match(JSON.stringify(skills.content), /motion-design/u);
  const project = await client.callTool({ name: "create_project", arguments: { name: "隔离发行验证" } });
  assert.notEqual(project.isError, true, JSON.stringify(project.content));
  const expected = JSON.parse(await readFile(join(sourceRelease, "manifest.json"), "utf8")).releaseId;
  const status = JSON.parse((await exec(process.execPath, [toolsDev, "status", "daemon", "--namespace", namespace, "--tools-dev-root", toolsRoot, "--json"], { cwd: repoRoot, env })).stdout);
  const health = await (await fetch(`${status.url}/api/health`)).json();
  assert.equal(health.videoflowcutReleaseId, expected);
  assert.equal((await readOpenDesignStatus(repoRoot, workspace, expected)).status, "ready");
  const runtimePort = await findAvailablePort(), bridgePort = await findAvailablePort();
  const vfcEnv = { ...env, VIDEOFLOWCUT_PORT: String(runtimePort), COMFYUI_BRIDGE_URL: `http://127.0.0.1:${bridgePort}` };
  const vfcTransport = new StdioClientTransport({ command: process.execPath, args: [join(pluginRoot, "scripts", "mcp-launcher.mjs")], cwd: pluginRoot, env: vfcEnv, stderr: "pipe" });
  const vfcClient = new Client({ name: "videoflowcut-unified-status-e2e", version: "1.0.0" });
  try {
    await vfcClient.connect(vfcTransport, { timeout: 180_000 });
    await vfcClient.listTools();
    const report = await vfcClient.callTool({ name: "read_runtime_release", arguments: {} });
    assert.notEqual(report.isError, true, JSON.stringify(report.content));
    assert.equal(JSON.parse(report.content.find(item => item.type === "text").text).openDesign.status, "ready");
  } finally {
    await vfcClient.close().catch(() => {}); await vfcTransport.close().catch(() => {});
    await stopRuntime({ pluginRoot, repoRoot, workspaceRoot: workspace, port: runtimePort, bridgeUrl: vfcEnv.COMFYUI_BRIDGE_URL }, { force: true });
  }
  const differences = [];
  const compare = async (source, target, prefix = "") => {
    const left = await readdir(source, { withFileTypes: true }), right = await readdir(target, { withFileTypes: true });
    for (const item of right) if (!left.some(value => value.name === item.name)) differences.push(`新增：${join(prefix, item.name)}`);
    for (const item of left) {
      const name = join(prefix, item.name), a = join(source, item.name), b = join(target, item.name);
      if (!right.some(value => value.name === item.name)) { differences.push(`缺失：${name}`); continue; }
      if (item.isDirectory()) await compare(a, b, name);
      else if ((await stat(a)).size !== (await stat(b)).size || createHash("sha256").update(await readFile(a)).digest("hex") !== createHash("sha256").update(await readFile(b)).digest("hex")) differences.push(`改变：${name}`);
    }
  };
  await compare(sourceRelease, join(pluginRoot, "runtime", "dist"));
  assert.deepEqual(differences, [], "运行不得修改发行目录");
  await client.close(); client = undefined;
  await transport.close(); transport = undefined;
  await exec(process.execPath, [toolsDev, "stop", "--namespace", namespace, "--tools-dev-root", toolsRoot, "--json"], { cwd: repoRoot, env, timeout: 30_000 });
  // 已运行服务属于另一发行物时，不得把它冒充当前版本或自动终止。
  const runtimeRoot = join(workspace, ".videoflowcut-runtime", "open-design", expected);
  const wrongEnv = { ...env, VIDEOFLOWCUT_RELEASE_ID: `release-${"0".repeat(64)}`,
    VIDEOFLOWCUT_OD_WEB_DIST_DIR: join(runtimeRoot, "web"),
    OD_RESOURCE_ROOT: join(runtimeRoot, "resources"), OD_INSTALLATION_DIR: runtimeRoot };
  await exec(process.execPath, [toolsDev, "start", "web", "--prod", "--namespace", namespace, "--tools-dev-root", toolsRoot, "--no-env-file", "--json"], { cwd: repoRoot, env: wrongEnv, timeout: 180_000 });
  await compare(sourceRelease, join(pluginRoot, "runtime", "dist"));
  assert.deepEqual(differences, [], "重启不得修改发行目录");
  transport = new StdioClientTransport({ command: process.execPath, args: [join(pluginRoot, "scripts", "open-design-mcp-launcher.mjs")], cwd: pluginRoot, env, stderr: "pipe" });
  client = new Client({ name: "videoflowcut-open-design-mismatch-e2e", version: "1.0.0" });
  let mismatch = "";
  const connection = client.connect(transport, { timeout: 60_000 });
  transport.stderr?.on("data", chunk => { mismatch += chunk.toString(); });
  await assert.rejects(connection);
  assert.match(mismatch, /并非此插件发行版本/u);
  const retained = JSON.parse((await exec(process.execPath, [toolsDev, "status", "daemon", "--namespace", namespace, "--tools-dev-root", toolsRoot, "--json"], { cwd: repoRoot, env })).stdout);
  assert.equal((await (await fetch(`${retained.url}/api/health`)).json()).videoflowcutReleaseId, wrongEnv.VIDEOFLOWCUT_RELEASE_ID);
  assert.equal((await readOpenDesignStatus(repoRoot, workspace, expected)).status, "release_mismatch");
  await client.close().catch(() => {}); await transport.close().catch(() => {});
  const oldInfo = await (await fetch(`${retained.url}/api/mcp/install-info`)).json();
  await writeFile(join(pluginRoot, "runtime", "repo-root.json"), JSON.stringify({ schemaVersion: 1, repoRoot,
    openDesignDataRoot: dataRoot, previousOpenDesignEndpoint: oldInfo.env.OD_SIDECAR_CLIENT_ENDPOINT }));
  transport = new StdioClientTransport({ command: process.execPath, args: [join(pluginRoot, "scripts", "open-design-mcp-launcher.mjs")], cwd: pluginRoot, env, stderr: "pipe" });
  client = new Client({ name: "videoflowcut-open-design-previous-e2e", version: "1.0.0" });
  let previousMessage = "";
  const previousConnection = client.connect(transport, { timeout: 60_000 });
  transport.stderr?.on("data", chunk => { previousMessage += chunk.toString(); });
  await assert.rejects(previousConnection);
  assert.match(previousMessage, /原画面服务仍在使用同一数据目录/u);
  assert.equal((await (await fetch(`${retained.url}/api/health`)).json()).videoflowcutReleaseId, wrongEnv.VIDEOFLOWCUT_RELEASE_ID);
  passed = true;
  console.log("隔离画面 MCP、技能、项目创建与运行版本核对通过。");
} finally {
  await client?.close().catch(() => {});
  await transport?.close().catch(() => {});
  let stopped = false;
  try {
    await exec(process.execPath, [toolsDev, "stop", "--namespace", namespace, "--tools-dev-root", toolsRoot, "--json"], { cwd: repoRoot, env, timeout: 30_000 });
    stopped = true;
  } catch (error) { console.error(`隔离服务停止失败，保留验证目录：${root}；${error.message}`); }
  const pathFromTemp = relative(tmpdir(), root);
  if (stopped && passed && pathFromTemp && !pathFromTemp.startsWith("..") && !isAbsolute(pathFromTemp)) {
    await rm(root, { recursive: true, force: true });
  } else if (!passed) console.error(`验证未通过，保留目录：${root}`);
}
