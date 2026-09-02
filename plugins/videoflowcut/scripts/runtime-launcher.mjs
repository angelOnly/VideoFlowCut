import { spawn, spawnSync } from "node:child_process";
import { closeSync, existsSync, openSync } from "node:fs";
import { mkdir, open, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import {
  pluginRootFromModule,
  readOption,
  resolveRepoRoot,
  resolveWorkspaceRoot,
  tsxCliPath
} from "./repo-root.mjs";

const HOST = "127.0.0.1";
const PORT = 3100;
const STARTUP_TIMEOUT_MS = 30_000;
const STOP_TIMEOUT_MS = 8_000;

function sleep(milliseconds) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, milliseconds));
}

function runtimePaths(workspaceRoot) {
  const directory = join(workspaceRoot, ".videoflowcut-runtime");
  return {
    directory,
    state: join(directory, "runtime.json"),
    lock: join(directory, "launch.lock"),
    log: join(directory, "runtime.log")
  };
}

function apiUrl() {
  return `http://${HOST}:${PORT}`;
}

function normalizeOptions(options = {}) {
  const pluginRoot = options.pluginRoot ?? pluginRootFromModule(import.meta.url);
  const repoRoot = resolve(options.repoRoot ?? resolveRepoRoot({ pluginRoot }));
  const workspaceRoot = resolveWorkspaceRoot(repoRoot, options.workspaceRoot);
  const configuredPort = Number(options.port ?? process.env.VIDEOFLOWCUT_PORT ?? PORT);
  if (!Number.isInteger(configuredPort) || configuredPort !== PORT) {
    throw new Error("当前 Web 构建固定连接 http://127.0.0.1:3100；请勿为插件运行时设置其它 VIDEOFLOWCUT_PORT。");
  }
  return { pluginRoot, repoRoot, workspaceRoot, port: PORT, apiUrl: apiUrl() };
}

async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return undefined;
  }
}

async function writeJsonAtomically(path, value) {
  const temporaryPath = `${path}.tmp-${process.pid}-${randomUUID()}`;
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporaryPath, path);
}

function isProcessAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code === "EPERM";
  }
}

async function fetchWithTimeout(url, init = {}, timeoutMs = 1_500) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

/** 基础剪辑就绪只依赖 API 和静态 Web；可选 Bridge 不会成为启动门槛。 */
async function isApiAndWebReady(url) {
  try {
    const projects = await fetchWithTimeout(`${url}/api/projects`);
    if (!projects.ok || !Array.isArray(await projects.json())) return false;
    const web = await fetchWithTimeout(`${url}/`);
    return web.ok && (await web.text()).includes("id=\"root\"");
  } catch {
    return false;
  }
}

async function readInternalStatus(url, controlToken) {
  if (!controlToken) return undefined;
  try {
    const response = await fetchWithTimeout(`${url}/internal/runtime/status`, {
      headers: { "x-videoflowcut-runtime-token": controlToken }
    });
    return response.ok ? await response.json() : undefined;
  } catch {
    return undefined;
  }
}

function isMatchingState(state, options) {
  return state
    && state.schemaVersion === 1
    && state.repoRoot === options.repoRoot
    && state.workspaceRoot === options.workspaceRoot
    && state.apiUrl === options.apiUrl
    && typeof state.controlToken === "string"
    && typeof state.runtimeId === "string";
}

async function readState(options) {
  return readJson(runtimePaths(options.workspaceRoot).state);
}

async function ensureWebBuild(options) {
  const entry = join(options.repoRoot, "apps", "web", "dist", "index.html");
  if (existsSync(entry)) return;
  const viteCli = join(options.repoRoot, "node_modules", "vite", "bin", "vite.js");
  if (!existsSync(viteCli)) throw new Error("找不到 Vite。请先在 VideoFlowCut 仓库根目录执行 npm install。");
  const result = spawnSync(process.execPath, [viteCli, "build", "--config", "apps/web/vite.config.ts"], {
    cwd: options.repoRoot,
    encoding: "utf8",
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"]
  });
  if (result.status !== 0 || !existsSync(entry)) {
    const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.trim();
    throw new Error(`Web 构建失败。${output ? `\n${output.slice(-4_000)}` : ""}`);
  }
}

async function withLaunchLock(options, operation) {
  const paths = runtimePaths(options.workspaceRoot);
  await mkdir(paths.directory, { recursive: true });
  for (let attempt = 0; attempt < 100; attempt += 1) {
    let handle;
    try {
      handle = await open(paths.lock, "wx");
      await handle.writeFile(JSON.stringify({ pid: process.pid, createdAt: new Date().toISOString() }));
      try {
        return await operation();
      } finally {
        await handle.close().catch(() => undefined);
        await rm(paths.lock, { force: true }).catch(() => undefined);
      }
    } catch (error) {
      await handle?.close().catch(() => undefined);
      if (error?.code !== "EEXIST") throw error;
      const lockStat = await stat(paths.lock).catch(() => undefined);
      if (lockStat && Date.now() - lockStat.mtimeMs > STARTUP_TIMEOUT_MS * 2) {
        await rm(paths.lock, { force: true }).catch(() => undefined);
      } else {
        await sleep(250);
      }
    }
  }
  throw new Error("等待 VideoFlowCut Runtime 启动锁超时，请确认没有遗留的启动进程。");
}

async function tailLog(path) {
  try {
    return (await readFile(path, "utf8")).slice(-4_000);
  } catch {
    return "（尚未写入运行日志）";
  }
}

function spawnRuntime(options, state) {
  const paths = runtimePaths(options.workspaceRoot);
  const descriptor = openSync(paths.log, "a");
  try {
    const child = spawn(process.execPath, [tsxCliPath(options.repoRoot), join(options.repoRoot, "apps", "runtime", "src", "index.ts")], {
      cwd: options.repoRoot,
      detached: true,
      windowsHide: true,
      stdio: ["ignore", descriptor, descriptor],
      env: {
        ...process.env,
        HOST,
        PORT: String(PORT),
        SERVE_WEB: "true",
        WEB_ORIGIN: options.apiUrl,
        VIDEOCUT_WORKSPACE: options.workspaceRoot,
        VIDEOFLOWCUT_RUNTIME_ID: state.runtimeId,
        VIDEOFLOWCUT_RUNTIME_TOKEN: state.controlToken
      }
    });
    child.unref();
    return child.pid;
  } finally {
    closeSync(descriptor);
  }
}

async function waitUntilReady(options, state) {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (!isProcessAlive(state.pid)) break;
    if (await isApiAndWebReady(options.apiUrl)) {
      const internal = await readInternalStatus(options.apiUrl, state.controlToken);
      if (internal?.status === "ready" && internal.runtimeId === state.runtimeId
        && internal.workers?.media === true && internal.workers?.render === true) {
        return;
      }
    }
    await sleep(250);
  }
  throw new Error(`Runtime 未能在 ${STARTUP_TIMEOUT_MS / 1_000} 秒内就绪。\n${await tailLog(runtimePaths(options.workspaceRoot).log)}`);
}

export async function getRuntimeStatus(rawOptions = {}) {
  const options = normalizeOptions(rawOptions);
  const state = await readState(options);
  if (!isMatchingState(state, options)) return { configured: Boolean(state), ready: false, reason: state ? "状态文件不属于当前仓库或工作区" : "未启动" };
  const [apiReady, internal] = await Promise.all([
    isApiAndWebReady(options.apiUrl),
    readInternalStatus(options.apiUrl, state.controlToken)
  ]);
  const processAlive = isProcessAlive(state.pid);
  const ready = apiReady && processAlive && internal?.status === "ready" && internal.runtimeId === state.runtimeId
    && internal.workers?.media === true && internal.workers?.render === true;
  return {
    configured: true,
    ready,
    processAlive,
    apiUrl: options.apiUrl,
    webUrl: `${options.apiUrl}/`,
    pid: state.pid,
    startedAt: state.startedAt,
    bridge: "可选服务；不可用不会阻断基础剪辑"
  };
}

export async function ensureRuntime(rawOptions = {}) {
  const options = normalizeOptions(rawOptions);
  return withLaunchLock(options, async () => {
    const paths = runtimePaths(options.workspaceRoot);
    const state = await readState(options);
    if (isMatchingState(state, options)) {
      const current = await getRuntimeStatus(options);
      if (current.ready) return { ...current, reused: true };
      if (await isApiAndWebReady(options.apiUrl)) {
        throw new Error("端口 3100 上已有未确认的 VideoFlowCut 服务。为避免误杀其它进程，未自动覆盖；请先执行 runtime-launcher.mjs status 或 stop。 ");
      }
      if (isProcessAlive(state.pid)) {
        throw new Error("已有 VideoFlowCut Runtime 进程仍在启动或异常退出，请先执行 runtime-launcher.mjs stop 后重试。");
      }
      await rm(paths.state, { force: true });
    } else if (await isApiAndWebReady(options.apiUrl)) {
      throw new Error("端口 3100 已被未知服务占用。VideoFlowCut 不会自动终止未知进程。");
    } else if (state) {
      await rm(paths.state, { force: true });
    }

    await ensureWebBuild(options);
    const nextState = {
      schemaVersion: 1,
      runtimeId: randomUUID(),
      controlToken: randomUUID(),
      repoRoot: options.repoRoot,
      workspaceRoot: options.workspaceRoot,
      apiUrl: options.apiUrl,
      startedAt: new Date().toISOString(),
      pid: 0
    };
    nextState.pid = spawnRuntime(options, nextState);
    if (!nextState.pid) throw new Error("无法启动 VideoFlowCut Runtime 进程。");
    await writeJsonAtomically(paths.state, nextState);
    try {
      await waitUntilReady(options, nextState);
      return { ...(await getRuntimeStatus(options)), reused: false };
    } catch (error) {
      await stopRuntime(options, { force: true });
      throw error;
    }
  });
}

async function waitForExit(pid, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (isProcessAlive(pid) && Date.now() < deadline) await sleep(200);
  return !isProcessAlive(pid);
}

function terminateProcessTree(pid) {
  if (!isProcessAlive(pid)) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(pid), "/t", "/f"], { windowsHide: true, stdio: "ignore" });
    return;
  }
  process.kill(pid, "SIGTERM");
}

export async function stopRuntime(rawOptions = {}, { force = false } = {}) {
  const options = normalizeOptions(rawOptions);
  const paths = runtimePaths(options.workspaceRoot);
  const state = await readState(options);
  if (!isMatchingState(state, options)) return { stopped: false, reason: "未找到当前工作区的 Runtime 状态" };

  let graceful = false;
  if (await isApiAndWebReady(options.apiUrl)) {
    try {
      const response = await fetchWithTimeout(`${options.apiUrl}/internal/runtime/shutdown`, {
        method: "POST",
        headers: { "x-videoflowcut-runtime-token": state.controlToken }
      });
      graceful = response.ok;
    } catch {
      // 服务可能已在退出，随后按记录 PID 检查即可。
    }
  }
  const stopped = await waitForExit(state.pid, STOP_TIMEOUT_MS);
  if (!stopped && (force || isProcessAlive(state.pid))) terminateProcessTree(state.pid);
  await waitForExit(state.pid, 2_000);
  await rm(paths.state, { force: true });
  return { stopped: !isProcessAlive(state.pid), graceful };
}

async function main() {
  const [command = "ensure", ...args] = process.argv.slice(2);
  const pluginRoot = pluginRootFromModule(import.meta.url);
  const repoRoot = readOption(args, "--repo-root") ?? process.env.VIDEOFLOWCUT_REPO_ROOT;
  const workspaceRoot = readOption(args, "--workspace") ?? process.env.VIDEOCUT_WORKSPACE;
  const options = { pluginRoot, repoRoot, workspaceRoot };
  if (command === "ensure" || command === "start" || command === "open") {
    const runtime = await ensureRuntime(options);
    console.log(JSON.stringify(command === "open" ? { ...runtime, url: runtime.webUrl } : runtime, null, 2));
    return;
  }
  if (command === "status") {
    console.log(JSON.stringify(await getRuntimeStatus(options), null, 2));
    return;
  }
  if (command === "stop") {
    console.log(JSON.stringify(await stopRuntime(options, { force: true }), null, 2));
    return;
  }
  throw new Error("用法：runtime-launcher.mjs <ensure|start|open|status|stop> [--repo-root 路径] [--workspace 路径]");
}

if (import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, "/")}`) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
