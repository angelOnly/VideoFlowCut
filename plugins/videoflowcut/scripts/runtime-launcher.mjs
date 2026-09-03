import { spawn, spawnSync } from "node:child_process";
import { closeSync, existsSync, openSync } from "node:fs";
import { mkdir, open, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { createServer as createTcpServer } from "node:net";
import { join, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import {
  pluginRootFromModule,
  readOption,
  releaseNodePath,
  resolveReleaseRuntime,
  resolveRepoRoot,
  resolveWorkspaceRoot
} from "./repo-root.mjs";

const HOST = "127.0.0.1";
const DEFAULT_PORT = 3100;
const STARTUP_TIMEOUT_MS = 30_000;
const STOP_TIMEOUT_MS = 8_000;
// 仅记录本次启动器进程亲自创建的 ChildProcess；不能把磁盘状态里的 PID 当作终止授权。
const locallyStartedRuntimes = new Map();

function sleep(milliseconds) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, milliseconds));
}

function runtimePaths(workspaceRoot, port = DEFAULT_PORT) {
  const directory = join(workspaceRoot, ".videoflowcut-runtime");
  const suffix = port === DEFAULT_PORT ? "runtime" : `runtime-${port}`;
  return {
    directory,
    state: join(directory, `${suffix}.json`),
    lock: join(directory, "launch.lock"),
    log: join(directory, `${suffix}.log`)
  };
}

function apiUrl(port) {
  return `http://${HOST}:${port}`;
}

function normalizePort(rawPort) {
  const port = Number(rawPort);
  if (!Number.isInteger(port) || port < 1024 || port > 65_535) {
    throw new Error("VIDEOFLOWCUT_PORT 必须是 1024 到 65535 之间的整数。");
  }
  return port;
}

function normalizeOptions(options = {}) {
  const pluginRoot = options.pluginRoot ?? pluginRootFromModule(import.meta.url);
  const repoRoot = resolve(options.repoRoot ?? resolveRepoRoot({ pluginRoot }));
  const workspaceRoot = resolveWorkspaceRoot(repoRoot, options.workspaceRoot);
  const port = normalizePort(options.port ?? process.env.VIDEOFLOWCUT_PORT ?? DEFAULT_PORT);
  return { pluginRoot, repoRoot, workspaceRoot, port, apiUrl: apiUrl(port) };
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

/**
 * 发行版本不同也可能是同一启动器此前创建的 Runtime。只有环境、实例标识和控制令牌
 * 都可供后续 HTTP 认证时，才允许把它当作“可安全切换”的旧版，而非未知监听进程。
 */
function isManagedStateForOptions(state, options) {
  return state
    && state.schemaVersion === 3
    && state.repoRoot === options.repoRoot
    && state.workspaceRoot === options.workspaceRoot
    && state.apiUrl === options.apiUrl
    && typeof state.controlToken === "string"
    && typeof state.runtimeId === "string"
    && typeof state.runtimeEntry === "string"
    && typeof state.distributionRoot === "string"
    && typeof state.releaseId === "string";
}

function isMatchingState(state, options, release) {
  return isManagedStateForOptions(state, options)
    // schema 3 明确绑定构建内容；路径相同但发行物已更新时绝不能复用旧 Runtime。
    && (!release || (
      state.runtimeEntry === release.runtimeEntry
      && state.distributionRoot === release.root
      && state.releaseId === release.releaseId
    ));
}

async function readState(options) {
  return readJson(runtimePaths(options.workspaceRoot, options.port).state);
}

/**
 * 只探测本机回环地址是否还能绑定，不终止、也不接管任何未知监听进程。
 */
async function isPortInUse(port) {
  return new Promise((resolveProbe, rejectProbe) => {
    const probe = createTcpServer();
    probe.once("error", (error) => {
      // 无法绑定也一律视为不可安全使用，避免在权限或网络异常时覆盖未知服务。
      if (error?.code === "EADDRINUSE" || error?.code === "EACCES") return resolveProbe(true);
      return resolveProbe(true);
    });
    probe.listen({ host: HOST, port, exclusive: true }, () => {
      probe.close((error) => {
        if (error) rejectProbe(error);
        else resolveProbe(false);
      });
    });
  });
}

/**
 * E2E 使用临时工作区和临时端口，避免因用户正常运行的 3100 工作台而相互影响。
 * 端口在释放到 Runtime 真正监听之间仍可能发生竞争，调用方应保留启动失败处理。
 */
export async function findAvailablePort() {
  return new Promise((resolvePort, rejectPort) => {
    const reservation = createTcpServer();
    reservation.once("error", rejectPort);
    reservation.listen({ host: HOST, port: 0, exclusive: true }, () => {
      const address = reservation.address();
      if (!address || typeof address === "string" || !Number.isInteger(address.port)) {
        reservation.close(() => rejectPort(new Error("无法分配 VideoFlowCut E2E 端口。")));
        return;
      }
      reservation.close((error) => {
        if (error) rejectPort(error);
        else resolvePort(address.port);
      });
    });
  });
}

async function withLaunchLock(options, operation) {
  const paths = runtimePaths(options.workspaceRoot, options.port);
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

function spawnRuntime(options, state, release) {
  const paths = runtimePaths(options.workspaceRoot, options.port);
  const descriptor = openSync(paths.log, "a");
  try {
    const child = spawn(process.execPath, [release.runtimeEntry], {
      // CWD 不再指向源码仓库；发行入口通过 __dirname 定位自身的 Web 和 Remotion 文件。
      cwd: options.pluginRoot,
      detached: true,
      windowsHide: true,
      stdio: ["ignore", descriptor, descriptor],
      env: {
        ...process.env,
        NODE_PATH: releaseNodePath(options.repoRoot),
        VIDEOFLOWCUT_NODE_MODULES: join(options.repoRoot, "node_modules"),
        HOST,
        PORT: String(options.port),
        WEB_ORIGIN: options.apiUrl,
        VIDEOCUT_WORKSPACE: options.workspaceRoot,
        VIDEOFLOWCUT_RUNTIME_DIST: release.root,
        VIDEOFLOWCUT_RUNTIME_ID: state.runtimeId,
        VIDEOFLOWCUT_RUNTIME_TOKEN: state.controlToken,
        VIDEOFLOWCUT_RELEASE_ID: release.releaseId
      }
    });
    child.unref();
    return child;
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
        && internal.releaseId === state.releaseId
        && internal.workers?.media === true && internal.workers?.render === true) {
        return;
      }
    }
    await sleep(250);
  }
  throw new Error(`Runtime 未能在 ${STARTUP_TIMEOUT_MS / 1_000} 秒内就绪。\n${await tailLog(runtimePaths(options.workspaceRoot, options.port).log)}`);
}

export async function getRuntimeStatus(rawOptions = {}) {
  const options = normalizeOptions(rawOptions);
  const release = resolveReleaseRuntime(options.pluginRoot);
  const state = await readState(options);
  if (!isManagedStateForOptions(state, options)) {
    return {
      configured: Boolean(state),
      ready: false,
      reason: state ? "状态文件不属于当前发行 Runtime、仓库或工作区" : "未启动"
    };
  }
  if (!isMatchingState(state, options, release)) {
    return {
      configured: true,
      ready: false,
      processAlive: isProcessAlive(state.pid),
      apiUrl: options.apiUrl,
      webUrl: `${options.apiUrl}/`,
      port: options.port,
      pid: state.pid,
      startedAt: state.startedAt,
      releaseId: state.releaseId,
      reason: "检测到可认证的旧发行 Runtime；运行 ensure 将执行受控切换。"
    };
  }
  const [apiReady, internal] = await Promise.all([
    isApiAndWebReady(options.apiUrl),
    readInternalStatus(options.apiUrl, state.controlToken)
  ]);
  const processAlive = isProcessAlive(state.pid);
  const ready = apiReady && processAlive && internal?.status === "ready" && internal.runtimeId === state.runtimeId
    && internal.releaseId === state.releaseId
    && internal.workers?.media === true && internal.workers?.render === true;
  return {
    configured: true,
    ready,
    processAlive,
    apiUrl: options.apiUrl,
    webUrl: `${options.apiUrl}/`,
    port: options.port,
    pid: state.pid,
    startedAt: state.startedAt,
    releaseId: state.releaseId,
    bridge: "可选服务；不可用不会阻断基础剪辑"
  };
}

export async function ensureRuntime(rawOptions = {}) {
  const options = normalizeOptions(rawOptions);
  // 先验证发行物，绝不在缺少 dist 时退回到 tsx 或仓库源码入口。
  const release = resolveReleaseRuntime(options.pluginRoot);
  return withLaunchLock(options, async () => {
    const paths = runtimePaths(options.workspaceRoot, options.port);
    const state = await readState(options);
    if (isMatchingState(state, options, release)) {
      const current = await getRuntimeStatus(options);
      if (current.ready) return { ...current, reused: true };
      if (await isPortInUse(options.port)) {
        throw new Error(`端口 ${options.port} 上的服务与当前 Runtime 状态不一致。为避免误杀其它进程，未自动覆盖；请先执行 runtime-launcher.mjs status 或 stop。`);
      }
      if (isProcessAlive(state.pid)) {
        throw new Error("已有 VideoFlowCut Runtime 进程仍在启动或异常退出，请先执行 runtime-launcher.mjs stop 后重试。");
      }
      await rm(paths.state, { force: true });
    } else if (state && isManagedStateForOptions(state, options)) {
      // 旧 Release 不能被复用，但可先用控制令牌认证后停止，完成从 A 到 B 的受控切换。
      const stopped = await stopRuntime(options, { force: true });
      if (!stopped.stopped) {
        throw new Error(`发现旧发行 Runtime，但无法安全停止：${stopped.reason ?? "控制令牌认证失败"}`);
      }
      if (await isPortInUse(options.port)) {
        throw new Error(`旧发行 Runtime 停止后端口 ${options.port} 仍被占用；未覆盖未知进程。`);
      }
    } else if (await isPortInUse(options.port)) {
      throw new Error(`端口 ${options.port} 已被未知服务占用。VideoFlowCut 不会自动终止未知进程。`);
    } else if (state) {
      await rm(paths.state, { force: true });
    }

    const nextState = {
      schemaVersion: 3,
      runtimeId: randomUUID(),
      controlToken: randomUUID(),
      repoRoot: options.repoRoot,
      workspaceRoot: options.workspaceRoot,
      port: options.port,
      apiUrl: options.apiUrl,
      runtimeEntry: release.runtimeEntry,
      distributionRoot: release.root,
      releaseId: release.releaseId,
      startedAt: new Date().toISOString(),
      pid: 0
    };
    const runtimeChild = spawnRuntime(options, nextState, release);
    nextState.pid = runtimeChild.pid;
    if (!nextState.pid) throw new Error("无法启动 VideoFlowCut Runtime 进程。");
    locallyStartedRuntimes.set(nextState.pid, runtimeChild);
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
  const paths = runtimePaths(options.workspaceRoot, options.port);
  const state = await readState(options);
  if (!isManagedStateForOptions(state, options)) return { stopped: false, reason: "未找到当前 Runtime 的受管状态" };

  let graceful = false;
  const internal = await readInternalStatus(options.apiUrl, state.controlToken);
  const ownsRuntime = internal?.runtimeId === state.runtimeId;
  const locallyStartedRuntime = locallyStartedRuntimes.get(state.pid);
  const startedByThisLauncher = locallyStartedRuntime?.pid === state.pid
    && locallyStartedRuntime.exitCode === null
    && locallyStartedRuntime.signalCode === null;
  if (!ownsRuntime && !startedByThisLauncher) {
    if (!isProcessAlive(state.pid)) {
      await rm(paths.state, { force: true });
      return { stopped: true, graceful: false, reason: "已清理没有存活进程的陈旧 Runtime 状态。" };
    }
    return {
      stopped: false,
      graceful: false,
      reason: "Runtime 未能通过控制令牌确认归属，未终止任何进程，也保留状态文件供人工诊断。"
    };
  }
  if (ownsRuntime) {
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
  if (!stopped && ownsRuntime) {
    // 已通过控制令牌认证，才允许按 PID 终止整个 Runtime 进程树。
    terminateProcessTree(state.pid);
  } else if (!stopped && startedByThisLauncher) {
    // 启动尚未完成时没有可认证的 HTTP 状态；只通过仍存活的 ChildProcess 句柄停止它，
    // 不对磁盘状态中的 PID 直接执行 taskkill，避免 PID 复用误杀。
    locallyStartedRuntime.kill();
  }
  await waitForExit(state.pid, 2_000);
  const isStopped = !isProcessAlive(state.pid);
  if (isStopped) {
    locallyStartedRuntimes.delete(state.pid);
    await rm(paths.state, { force: true });
    return { stopped: true, graceful };
  }
  return {
    stopped: false,
    graceful,
    reason: force
      ? "已确认 Runtime 归属但强制停止失败；已保留状态文件供人工诊断。"
      : "已确认 Runtime 归属但未能停止；已保留状态文件供人工诊断。"
  };
}

async function main() {
  const [command = "ensure", ...args] = process.argv.slice(2);
  const pluginRoot = pluginRootFromModule(import.meta.url);
  const repoRoot = readOption(args, "--repo-root") ?? process.env.VIDEOFLOWCUT_REPO_ROOT;
  const workspaceRoot = readOption(args, "--workspace") ?? process.env.VIDEOCUT_WORKSPACE;
  const port = readOption(args, "--port") ?? process.env.VIDEOFLOWCUT_PORT;
  const options = { pluginRoot, repoRoot, workspaceRoot, port };
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
  throw new Error("用法：runtime-launcher.mjs <ensure|start|open|status|stop> [--repo-root 路径] [--workspace 路径] [--port 端口]");
}

if (import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, "/")}`) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
