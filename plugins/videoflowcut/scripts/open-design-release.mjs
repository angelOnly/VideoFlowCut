import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { promisify } from "node:util";

// 画面服务沿用仓库依赖；发布时记录实际运行代码，启动时只核对一次。
const roots = [
  "package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml",
  "apps/daemon", "apps/web", "packages", "tools/dev", "patches",
  "skills", "design-templates", "design-systems", "craft",
  "plugins/_official", "plugins/registry", "assets/frames", "assets/community-pets",
  "prompt-templates", "data/plugin-previews"
];
const ignored = new Set(["node_modules", ".git", ".tmp", "test-results", "playwright-report"]);

export function openDesignDigest(componentRoot) {
  const files = [];
  function collect(path) {
    if (!existsSync(path)) throw new Error(`画面模块缺少运行输入：${path}`);
    const entries = readdirSync(path, { withFileTypes: true });
    for (const entry of entries) {
      const child = join(path, entry.name);
      if (entry.isDirectory()) {
        const nextTransient = path.endsWith(`${process.platform === "win32" ? "\\" : "/"}.next`) && ["cache", "standalone", "diagnostics"].includes(entry.name);
        if (!ignored.has(entry.name) && !nextTransient) collect(child);
      } else if (entry.isFile() && !entry.name.endsWith(".tsbuildinfo") && !["trace", "trace-build"].includes(entry.name)) {
        files.push(child);
      }
    }
  }
  for (const root of roots) {
    const path = join(componentRoot, root);
    if (!existsSync(path)) throw new Error(`画面模块缺少运行输入：${path}`);
    if (root.endsWith(".json") || root.endsWith(".yaml")) files.push(path);
    else collect(path);
  }
  files.sort((a, b) => relative(componentRoot, a).localeCompare(relative(componentRoot, b)));
  const hash = createHash("sha256");
  for (const path of files) {
    hash.update(relative(componentRoot, path).replace(/\\/gu, "/"));
    hash.update("\0");
    hash.update(readFileSync(path));
    hash.update("\0");
  }
  return { digest: hash.digest("hex"), fileCount: files.length };
}

/** 只读已运行服务；状态查询不启动或切换画面模块。 */
export async function readOpenDesignStatus(repoRoot, workspaceRoot, releaseId) {
  const componentRoot = join(repoRoot, "components", "open-design");
  const tool = join(componentRoot, "tools", "dev", "dist", "index.mjs");
  if (!existsSync(tool)) return { status: "unavailable", expectedReleaseId: releaseId };
  try {
    const namespace = process.env.VIDEOFLOWCUT_OD_NAMESPACE || "videoflowcut";
    const root = join(workspaceRoot, ".videoflowcut-runtime", "open-design-sidecars");
    const output = await promisify(execFile)(process.execPath, [tool, "status", "daemon", "--namespace", namespace, "--tools-dev-root", root, "--json"], {
      cwd: componentRoot, timeout: 5_000, windowsHide: true
    });
    const state = JSON.parse(output.stdout);
    if (!state.url) return { status: "not_running", expectedReleaseId: releaseId };
    const response = await fetch(`${state.url}/api/health`, { signal: AbortSignal.timeout(3_000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const health = await response.json();
    return { status: health.videoflowcutReleaseId === releaseId ? "ready" : "release_mismatch",
      releaseId: health.videoflowcutReleaseId ?? null, expectedReleaseId: releaseId };
  } catch (error) {
    return { status: "unavailable", expectedReleaseId: releaseId, detail: error instanceof Error ? error.message : String(error) };
  }
}
