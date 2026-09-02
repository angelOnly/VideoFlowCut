import { existsSync, readFileSync } from "node:fs";
import { delimiter, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function pluginRootFromModule(metaUrl) {
  return resolve(dirname(fileURLToPath(metaUrl)), "..");
}

function isVideoFlowCutRepo(candidate) {
  const packagePath = join(candidate, "package.json");
  // 发行插件只需定位宿主依赖与工作区；不能再把任一 TypeScript 源文件当作运行前提。
  if (!existsSync(packagePath)) return false;
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

function assertSupportedNodeRuntime() {
  const [major = 0, minor = 0] = process.versions.node.split(".").map((part) => Number(part));
  if (major < 22 || (major === 22 && minor < 5)) {
    throw new Error(`当前 Node ${process.versions.node} 不支持 VideoFlowCut 发行 Runtime 所需的 node:sqlite。请使用 Node >= 22.5.0。`);
  }
}

/**
 * 发行插件只能执行自身 runtime/dist 的 CommonJS 入口。这里集中校验生成物，
 * 避免安装缓存悄悄退回到仓库的 TypeScript 源码或 tsx。
 */
export function resolveReleaseRuntime(pluginRoot) {
  assertSupportedNodeRuntime();
  const root = join(pluginRoot, "runtime", "dist");
  const release = {
    root,
    manifest: join(root, "manifest.json"),
    runtimeEntry: join(root, "runtime.cjs"),
    mcpEntry: join(root, "mcp.cjs"),
    remotionEntry: join(root, "remotion", "render-entry.cjs"),
    webEntry: join(root, "web", "index.html")
  };
  for (const [label, path] of Object.entries(release)) {
    if (label !== "root" && !existsSync(path)) {
      throw new Error(`插件发行物缺少 ${label}：${path}。请在 VideoFlowCut 仓库根目录执行 npm run plugin:build 后重新安装插件。`);
    }
  }
  try {
    const manifest = JSON.parse(readFileSync(release.manifest, "utf8"));
    if (manifest?.schemaVersion !== 1 || manifest?.format !== "commonjs" || manifest?.nodeRuntime !== ">=22.5.0") {
      throw new Error("manifest 内容不兼容");
    }
  } catch (error) {
    throw new Error(`插件发行 Runtime manifest 无效：${error instanceof Error ? error.message : String(error)}。请重新执行 npm run plugin:build。`);
  }
  return release;
}

/**
 * 发行代码已打包为 CommonJS；第三方运行依赖仍复用当前仓库 npm install 的产物。
 * NODE_PATH 只补入本仓库 node_modules，不覆盖调用方原有的解析目录。
 */
export function releaseNodePath(repoRoot, inheritedNodePath = process.env.NODE_PATH) {
  const dependencies = join(repoRoot, "node_modules");
  if (!existsSync(dependencies)) {
    throw new Error("VideoFlowCut 运行依赖尚未安装。请先在仓库根目录执行 npm install。");
  }
  return [...new Set([dependencies, ...(inheritedNodePath ?? "").split(delimiter).filter(Boolean)])].join(delimiter);
}

export function readOption(args, name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}
