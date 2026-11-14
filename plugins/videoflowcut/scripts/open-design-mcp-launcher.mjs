import { execFile, spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { cp, mkdir, mkdtemp, rename } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { openDesignDigest } from "./open-design-release.mjs";
import { pluginRootFromModule, resolveReleaseRuntime, resolveRepoRoot, resolveWorkspaceRoot } from "./repo-root.mjs";
import { withRuntimeOperationLock } from "./runtime-launcher.mjs";

const execFileAsync = promisify(execFile);
const pluginRoot = pluginRootFromModule(import.meta.url);
const repoRoot = resolveRepoRoot({ pluginRoot });
const workspaceRoot = resolveWorkspaceRoot(repoRoot);
const componentRoot = join(repoRoot, "components", "open-design");
const release = resolveReleaseRuntime(pluginRoot);
const componentRelease = join(release.root, "open-design");
const expected = JSON.parse(readFileSync(join(componentRelease, "component.json"), "utf8"));
const pointerPath = join(pluginRoot, "runtime", "repo-root.json");
const pointer = existsSync(pointerPath) ? JSON.parse(readFileSync(pointerPath, "utf8")) : {};
const dataRoot = process.env.OD_DATA_DIR || pointer.openDesignDataRoot;

async function assertPreviousServiceStopped() {
  const endpoint = pointer.previousOpenDesignEndpoint;
  if (!endpoint || !dataRoot || !pointer.openDesignDataRoot || resolve(dataRoot).toLowerCase() !== resolve(pointer.openDesignDataRoot).toLowerCase()) return;
  const sidecar = await import(pathToFileURL(join(componentRoot, "packages", "sidecar", "dist", "index.mjs")).href);
  const client = sidecar.SidecarFactory.connectInherited({ OD_SIDECAR_CLIENT_ENDPOINT: endpoint });
  let status;
  try { status = await client?.status("daemon", { timeoutMs: 800 }); } catch { return; }
  if (status?.url) throw new Error("原画面服务仍在使用同一数据目录；请先按现有服务流程完成安全切换，再启动新服务。");
}

// Windows 可能短暂占用刚复制的目录，等待后重试；持续失败仍原样报错。
async function placePreparedRuntime(source, target) {
  for (let attempt = 0; ; attempt += 1) {
    try { await rename(source, target); return; }
    catch (error) {
      if (process.platform !== "win32" || error?.code !== "EPERM" || attempt >= 5) throw error;
      await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
}

async function prepare() {
  const actual = openDesignDigest(componentRoot);
  if (actual.digest !== expected.digest) throw new Error("画面模块与插件发行内容不一致，请重新构建并安装配套插件。");
  await assertPreviousServiceStopped();

  // 服务会写入安装记录和 Next 缓存；统一放在工作区副本，发行目录保持不变。
  const runtimeParent = join(workspaceRoot, ".videoflowcut-runtime", "open-design");
  const runtimeRoot = join(runtimeParent, release.releaseId);
  const webRoot = join(runtimeRoot, "web");
  const resourceRoot = join(runtimeRoot, "resources");
  const webSource = join(componentRelease, "runtime", "apps", "web", ".next");
  if (!existsSync(join(webRoot, "BUILD_ID"))) {
    await mkdir(runtimeParent, { recursive: true });
    const temporary = await mkdtemp(join(runtimeParent, "preparing-"));
    await cp(webSource, join(temporary, "web"), { recursive: true });
    await cp(join(componentRelease, "resources"), join(temporary, "resources"), { recursive: true });
    await placePreparedRuntime(temporary, runtimeRoot);
  }

  const env = { ...process.env, VIDEOFLOWCUT_RELEASE_ID: release.releaseId,
    VIDEOFLOWCUT_OD_WEB_DIST_DIR: webRoot, OD_RESOURCE_ROOT: resourceRoot,
    OD_INSTALLATION_DIR: runtimeRoot, ...(dataRoot ? { OD_DATA_DIR: dataRoot } : {}) };
  delete env.OD_DAEMON_URL;
  delete env.OD_SIDECAR_CLIENT_ENDPOINT;
  delete env.OD_WEB_DIST_DIR;
  delete env.OD_WEB_TSCONFIG_PATH;
  const tool = join(componentRoot, "tools", "dev", "dist", "index.mjs");
  const namespace = process.env.VIDEOFLOWCUT_OD_NAMESPACE || "videoflowcut";
  const toolsRoot = join(workspaceRoot, ".videoflowcut-runtime", "open-design-sidecars");
  const started = await execFileAsync(process.execPath, [tool, "start", "web", "--prod", "--namespace", namespace, "--tools-dev-root", toolsRoot, "--no-env-file", "--json"], {
    cwd: componentRoot, env, timeout: 180_000, maxBuffer: 4 * 1024 * 1024, windowsHide: true
  });
  const result = JSON.parse(started.stdout);
  const daemonUrl = result.daemon?.status?.url;
  if (!daemonUrl) throw new Error("画面服务未返回可用地址。");
  const health = await (await fetch(`${daemonUrl}/api/health`, { signal: AbortSignal.timeout(5_000) })).json();
  if (health.videoflowcutReleaseId !== release.releaseId) throw new Error("当前画面服务并非此插件发行版本；请先完成服务切换。");
  const info = await (await fetch(`${daemonUrl}/api/mcp/install-info`, { signal: AbortSignal.timeout(5_000) })).json();
  const cli = join(componentRoot, "apps", "daemon", "dist", "cli.js");
  if (resolve(info.args?.[0] ?? "") !== resolve(cli)) throw new Error("画面工具入口未指向当前模块。");
  return { cli, env: { ...env, ...info.env } };
}

try {
  if (Number(process.versions.node.split(".")[0]) !== 24) throw new Error("画面模块需要 Node 24，请切换运行环境后重试。");
  const { cli, env } = await withRuntimeOperationLock({ pluginRoot, repoRoot, workspaceRoot }, prepare);
  const child = spawn(process.execPath, [cli, "mcp"], { cwd: componentRoot, env, stdio: "inherit", windowsHide: true });
  child.once("error", (error) => { console.error(error.message); process.exitCode = 1; });
  child.once("exit", (code, signal) => { process.exitCode = code ?? (signal ? 1 : 0); });
} catch (error) {
  console.error(`画面工具启动失败：${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
