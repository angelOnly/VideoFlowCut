import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { lstat, mkdir, mkdtemp, readFile, realpath, rename, rmdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { parseArgs, promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { verifyInstalledRelease } from "../plugins/videoflowcut/scripts/verify-installed-release.mjs";
import { resolveWorkspaceRoot } from "../plugins/videoflowcut/scripts/repo-root.mjs";
import { withRuntimeOperationLock } from "../plugins/videoflowcut/scripts/runtime-launcher.mjs";
import { assertRuntimeReady, callDeploymentTool, connectDeploymentServer,
  verifyDeploymentPreview, verifyDeploymentTools } from "./verify-plugin-deployment.mjs";
import { runDeploymentSmoke } from "./plugin-deployment-smoke.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const plugin = join(root, "plugins", "videoflowcut");
const component = join(root, "components", "open-design");
const runtime = join(plugin, "runtime");
const exec = promisify(execFile);
const manifestPath = join(plugin, ".codex-plugin", "plugin.json");
const configPath = join(process.env.CODEX_HOME || join(homedir(), ".codex"), "config.toml");
const archivedRuntimeDirs = ["candidates", ".candidate", "archive-dist-before-0.1.107",
  "dist-interrupted-20261013", "dist-interrupted-20261019-ltx", "dist-interrupted-20261019-object-performance"];

async function writeAtomic(path, body) {
  const temporary = `${path}.${randomUUID()}.tmp`;
  await writeFile(temporary, body, { flag: "wx", mode: 0o600 });
  await rename(temporary, path);
}

const readJson = async path => JSON.parse(await readFile(path, "utf8"));
const json = data => JSON.stringify(data, null, 2) + "\n";

async function runJson(command, args, options = {}) {
  try {
    const result = await exec(command, args, { cwd: root, windowsHide: true, timeout: 60_000,
      maxBuffer: 4 * 1024 * 1024, ...options });
    return JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(`${args[0]}：${error.stderr?.trim() || error.message}`);
  }
}

async function build() {
  assert.ok(process.env.npm_execpath, "请通过 npm run plugin:deploy 启动");
  await new Promise((pass, fail) => {
    const child = spawn(process.execPath, [process.env.npm_execpath, "run", "plugin:build"],
      { cwd: root, windowsHide: true, stdio: "inherit" });
    child.once("error", fail);
    child.once("exit", (code, signal) => code === 0 ? pass() : fail(new Error(`构建失败（${signal ?? code}）`)));
  });
}

/** 同卷更名归档目录，官方安装源只送本轮发行内容。 */
async function install(cli, version) {
  const holding = await mkdtemp(join(runtime, "..", "..", ".vfc-deploy-hold-"));
  const moved = [];
  try {
    for (const name of archivedRuntimeDirs) {
      const source = join(runtime, name);
      const info = await lstat(source).catch(error => {
        if (error.code !== "ENOENT") throw error;
      });
      if (!info) continue;
      assert.ok(info.isDirectory() && !info.isSymbolicLink(), `归档路径与预期不符：${source}`);
      await rename(source, join(holding, name));
      moved.push(name);
    }
    const installed = await runJson(cli, ["plugin", "add", "videoflowcut@videoflowcut", "--json"], { timeout: 300_000 });
    assert.ok(installed.version === version && isAbsolute(installed.installedPath), "官方安装返回的版本或路径有误");
    return installed.installedPath;
  } finally {
    for (const name of moved) await rename(join(holding, name), join(runtime, name));
    await rmdir(holding);
  }
}

async function readRegistration(cli, name) {
  return runJson(cli, ["mcp", "get", name, "--json"]);
}

/** 现有直接注册只替换其安装槽路径，保留下载器、代理、工作区及超时。 */
async function updateDirectRegistrations(registrations, installedRoot) {
  const before = await readFile(configPath, "utf8");
  let after = before;
  for (const [name, registration] of Object.entries(registrations)) {
    const oldPath = registration.transport.args[0];
    const newPath = join(installedRoot, "scripts", name === "videoflowcut" ? "mcp-launcher.mjs" : "open-design-mcp-launcher.mjs");
    if (resolve(oldPath) === resolve(newPath)) continue;
    const block = `[mcp_servers.${name}]`;
    const start = after.indexOf(block);
    assert.ok(start >= 0, `找不到原直接登记 ${name}`);
    const next = after.indexOf("\n[", start + block.length);
    const end = next < 0 ? after.length : next;
    const section = after.slice(start, end);
    const forms = [oldPath.replaceAll("\\", "/"), JSON.stringify(oldPath).slice(1, -1), oldPath];
    const original = forms.find(path => section.includes(path));
    assert.ok(original && section.split(original).length === 2, `无法唯一定位 ${name} 的原启动路径`);
    after = after.slice(0, start) + section.replace(original, newPath.replaceAll("\\", "/")) + after.slice(end);
  }
  if (before !== after) await writeAtomic(configPath, after);
}

async function verifiedServers(cli, installedRoot, original) {
  const specs = (await readJson(join(installedRoot, ".mcp.json"))).mcpServers;
  const servers = {};
  for (const [name, spec] of Object.entries(specs)) {
    const server = await readRegistration(cli, name);
    await verifyRegistration(server, name, installedRoot, spec);
    servers[name] = server;
  }
  for (const [name, before] of Object.entries(original)) {
    const after = servers[name] ?? await readRegistration(cli, name);
    const spec = name === "videoflowcut" ? specs.videoflowcut : specs.open_design;
    await verifyRegistration(after, name, installedRoot, spec);
    const settings = ({ transport: { args, ...transport }, startup_timeout_sec, tool_timeout_sec }) =>
      ({ transport, startup_timeout_sec, tool_timeout_sec });
    assert.deepEqual(settings(after), settings(before), `${name} 的宿主配置发生了启动路径以外的变化`);
  }
  return servers;
}

async function verifyRegistration(server, name, rootPath, spec) {
  assert.ok(server.enabled && server.name === name && !server.disabled_reason && server.enabled_tools == null
    && server.disabled_tools == null, `${name} 未完整启用`);
  const transport = server.transport;
  assert.ok(transport.type === "stdio" && transport.command === spec.command
    && transport.args?.length === spec.args.length, `${name} 启动参数与安装声明不一致`);
  assert.deepEqual(transport.args.slice(1), spec.args.slice(1));
  const actual = resolve(transport.cwd || root, transport.args[0]);
  assert.equal(await realpath(actual), await realpath(resolve(rootPath, spec.args[0])), `${name} 未指向本次安装版`);
}

async function get(base, path) {
  const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(15_000) });
  assert.ok(response.ok, `服务检查 ${path} 返回 ${response.status}`);
  return response.json();
}

async function assertIdle(base, listPath, itemPath, unwrap, busy) {
  const projects = unwrap(await get(base, listPath));
  for (let index = 0; index < projects.length; index += 8) {
    const batches = await Promise.all(projects.slice(index, index + 8).map(project => get(base, itemPath(encodeURIComponent(project.id)))));
    assert.ok(!batches.flatMap(batch => Array.isArray(batch) ? batch : batch.runs).some(busy), "服务仍有在途任务，请在任务结束后续接部署");
  }
}

async function switchRuntime(installedRoot, releaseId, env, checkpoint, resuming) {
  const workspace = resolveWorkspaceRoot(root, env.VIDEOCUT_WORKSPACE);
  const namespace = env.VIDEOFLOWCUT_OD_NAMESPACE || "videoflowcut";
  const sidecars = join(workspace, ".videoflowcut-runtime", "open-design-sidecars");
  const launcher = join(installedRoot, "scripts", "runtime-launcher.mjs");
  const tools = (...args) => runJson(process.execPath,
    [join(component, "tools", "dev", "dist", "index.mjs"), ...args, "--namespace", namespace,
      "--tools-dev-root", sidecars, "--no-env-file", "--json"], { cwd: component, env });
  const outOfDateIdleService = async () => {
    const state = await tools("status", "daemon");
    if (!state.url || (await get(state.url, "/api/health")).videoflowcutReleaseId === releaseId) return false;
    await assertIdle(state.url, "/api/projects", id => `/api/runs?projectId=${id}`,
      value => Array.isArray(value) ? value : value.projects,
      run => !["succeeded", "failed", "canceled", "cancelled"].includes(run.status));
    return true;
  };
  const restartOD = await outOfDateIdleService();
  if (resuming) {
    const active = await runJson(process.execPath, [launcher, "status", "--repo-root", root, "--workspace", workspace], { env });
    assert.ok(!active.processAlive || active.releaseId === releaseId, "当前运行时已切换到另一发行，不能续接旧回执");
  }
  const state = await runJson(process.execPath, [launcher, "ensure", "--repo-root", root, "--workspace", workspace],
    { env, timeout: 240_000 });
  assert.ok(state.ready && state.releaseId === releaseId, "新版 Runtime 未就绪");
  await checkpoint(state);
  if (restartOD) {
    // 与 MCP 提交使用同一把运行锁，停止前再次检查在途任务。
    await withRuntimeOperationLock({ pluginRoot: installedRoot, repoRoot: root, workspaceRoot: workspace, port: env.VIDEOFLOWCUT_PORT }, async () => {
      if (await outOfDateIdleService()) await tools("stop");
    });
  }
}

async function main() {
  const { values } = parseArgs({ options: Object.fromEntries(
    ["codex-cli", "version", "receipt", "resume"].map(name => [name, { type: "string" }])) });
  const cli = values["codex-cli"];
  assert.ok(cli && isAbsolute(cli), "需要 --codex-cli <Codex 可执行文件绝对路径>");
  assert.ok(Boolean(values.receipt) !== Boolean(values.resume), "指定 --receipt <新回执路径> 或 --resume <已有回执路径>");
  const path = values.resume ?? values.receipt;
  assert.ok(isAbsolute(path), "回执需要绝对路径");
  assert.ok(!values.version || /^\d+\.\d+\.\d+$/u.test(values.version), "插件版本必须为 x.y.z");
  assert.ok(!values.resume || !values.version, "续接沿用原回执版本");
  const lock = join(root, ".vfc-plugin-deploy-lock");
  await mkdir(lock);
  const clients = new Map();
  try {
    const receipt = values.resume ? await readJson(path) : { id: randomUUID(), success: false, checks: {} };
    assert.ok(!receipt.success, "该回执已通过，无需续接");
    if (!values.resume) await writeFile(path, json(receipt), { flag: "wx" });
    let step = "准备部署";
    const save = () => writeAtomic(path, json(receipt));
    try {
      delete receipt.failure;
      if (!receipt.installedRoot) {
        step = "构建发行";
        const manifest = await readJson(manifestPath);
        receipt.version ??= values.version ?? manifest.version;
        if (manifest.version !== receipt.version) {
          await writeAtomic(manifestPath, json({ ...manifest, version: receipt.version }));
        }
        await save();
        console.log(`构建 VideoFlowCut ${receipt.version}`);
        await build();
        const built = await readJson(join(runtime, "dist", "manifest.json"));
        assert.equal(built.pluginVersion, receipt.version);
        step = "安装并检查原运行环境";
        const current = await readRegistration(cli, "videoflowcut");
        const env = { ...process.env, ...current.transport.env };
        const installed = dirname(dirname(resolve(current.transport.cwd || root, current.transport.args[0])));
        const previous = await readJson(join(installed, "runtime", "dist", "manifest.json"));
        if (previous.pluginVersion === built.pluginVersion) {
          assert.equal(previous.releaseId, built.releaseId, "发行内容已变化，请用 --version 指定新的安装版本");
          receipt.installedRoot = installed;
        } else {
          const oldRuntime = await runJson(process.execPath, [join(plugin, "scripts", "runtime-launcher.mjs"),
            "status", "--repo-root", root], { env });
          if (oldRuntime.configured) {
            assert.ok(oldRuntime.apiUrl, "无法确认现有 Runtime 归属");
            if (oldRuntime.processAlive) {
              await assertIdle(oldRuntime.apiUrl, "/api/projects", id => `/api/projects/${id}/jobs`, value => value,
                job => ["queued", "running", "unknown"].includes(job.status));
            }
          }
          receipt.installedRoot = await install(cli, receipt.version);
        }
        receipt.releaseId = built.releaseId;
        await save();
      }
      step = "校验安装版和宿主登记";
      const release = verifyInstalledRelease(["--installed-plugin-root", receipt.installedRoot]);
      assert.equal(release.installed.releaseId, receipt.releaseId, "发行已变化，无法沿旧回执续接");
      const original = {};
      if (!receipt.switchedAt) {
        original.videoflowcut = await readRegistration(cli, "videoflowcut");
        // 连字符入口是先前部署建立的直接登记；插件入口 open_design 由官方安装刷新。
        const auxiliary = await exec(cli, ["mcp", "get", "open-design", "--json"], { cwd: root, windowsHide: true, timeout: 15000 })
          .then(result => JSON.parse(result.stdout), error => {
            if (!/No MCP server named/u.test(error.stderr ?? "")) throw error;
          });
        if (auxiliary) original["open-design"] = auxiliary;
        await updateDirectRegistrations(original, receipt.installedRoot);
      }
      const servers = await verifiedServers(cli, receipt.installedRoot, original);
      step = "切换 VideoFlowCut 与 OD 服务";
      // 续接时也补齐可能停在 OD 切换前的同版服务。
      await switchRuntime(receipt.installedRoot, receipt.releaseId,
        { ...process.env, ...servers.videoflowcut.transport.env }, async () => {
          if (!receipt.switchedAt) {
            receipt.switchedAt = new Date().toISOString();
            await save();
          }
        }, Boolean(receipt.switchedAt));
      step = "启动并校验两端 MCP";
      for (const name of ["open_design", "videoflowcut"]) {
        const server = servers[name];
        assert.ok(server, `缺少 ${name} 安装登记`);
        const client = await connectDeploymentServer(server);
        clients.set(name, client);
        receipt.checks[name] = await verifyDeploymentTools(client, name, receipt.installedRoot);
      }
      assert.deepEqual(Object.keys(servers).sort(), [...clients.keys()].sort(), "安装声明有尚未纳入功能验收的 MCP");
      const vfc = clients.get("videoflowcut");
      receipt.checks.runtime = await callDeploymentTool(vfc, "read_runtime_release");
      assertRuntimeReady(receipt.checks.runtime, receipt.releaseId);
      await save();
      step = "验收项目制作及预览";
      console.log("运行本次独立验收项目的制作及渲染。");
      const { authoring, preview, projectId } = await runDeploymentSmoke(vfc, clients.get("open_design"), receipt, save);
      step = "回件与文件摘要校验";
      receipt.checks.production = await verifyDeploymentPreview(authoring, preview, projectId, Date.parse(receipt.switchedAt), receipt.releaseId);
      assertRuntimeReady(await callDeploymentTool(vfc, "read_runtime_release"), receipt.releaseId);
      receipt.success = true;
      await save();
      console.log(`部署验收通过：${receipt.version}；回执：${path}`);
    } catch (error) {
      receipt.success = false;
      receipt.failure = { step, message: error.message };
      await save();
      throw error;
    }
  } finally {
    await Promise.allSettled([...clients.values()].map(client => client.close()));
    await rmdir(lock);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
