import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function pluginRootFromModule(metaUrl) {
  return resolve(dirname(fileURLToPath(metaUrl)), "..");
}

function isVideoFlowCutRepo(candidate) {
  const packagePath = join(candidate, "package.json");
  if (!existsSync(packagePath) || !existsSync(join(candidate, "apps", "server", "src", "mcp.ts"))) return false;
  try {
    return JSON.parse(readFileSync(packagePath, "utf8")).name === "video-cut";
  } catch {
    return false;
  }
}

function pointerRoot(pluginRoot) {
  const pointerPath = join(pluginRoot, "runtime", "repo-root.json");
  if (!existsSync(pointerPath)) return undefined;
  try {
    const value = JSON.parse(readFileSync(pointerPath, "utf8"));
    return typeof value?.repoRoot === "string" ? value.repoRoot : undefined;
  } catch {
    return undefined;
  }
}

/**
 * 插件安装后会被复制到 Codex 缓存，不能从缓存相对路径猜测源码仓库。
 * 本机构建写入的指针优先，环境变量可供多仓库或自动化场景显式覆盖。
 */
export function resolveRepoRoot({ pluginRoot, explicitRoot } = {}) {
  const root = pluginRoot ?? pluginRootFromModule(import.meta.url);
  const candidates = [explicitRoot, process.env.VIDEOFLOWCUT_REPO_ROOT, pointerRoot(root), resolve(root, "..", "..")]
    .filter((candidate) => typeof candidate === "string" && candidate.trim().length > 0);
  for (const candidate of candidates) {
    const resolved = resolve(candidate);
    if (isVideoFlowCutRepo(resolved)) return resolved;
  }
  throw new Error(
    "未找到 VideoFlowCut 仓库。请在仓库根目录执行 npm run plugin:build，或设置 VIDEOFLOWCUT_REPO_ROOT 为仓库绝对路径。"
  );
}

export function resolveWorkspaceRoot(repoRoot, explicitWorkspace) {
  return resolve(explicitWorkspace ?? process.env.VIDEOCUT_WORKSPACE ?? join(repoRoot, "workspace"));
}

export function tsxCliPath(repoRoot) {
  const path = join(repoRoot, "node_modules", "tsx", "dist", "cli.mjs");
  if (!existsSync(path)) {
    throw new Error("VideoFlowCut 依赖尚未安装。请先在仓库根目录执行 npm install。");
  }
  return path;
}

export function readOption(args, name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}
