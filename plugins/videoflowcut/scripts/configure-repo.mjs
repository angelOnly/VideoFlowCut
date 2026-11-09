import { spawnSync } from "node:child_process";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pluginRootFromModule, readOption, resolveRepoRoot } from "./repo-root.mjs";

const pluginRoot = pluginRootFromModule(import.meta.url);
const explicitRoot = readOption(process.argv.slice(2), "--repo-root");
const repoRoot = explicitRoot
  ? resolveRepoRoot({ pluginRoot, explicitRoot })
  : resolveRepoRoot({ pluginRoot, explicitRoot: resolve(pluginRoot, "..", "..") });
const runtimeDirectory = join(pluginRoot, "runtime");
const pointerPath = join(runtimeDirectory, "repo-root.json");
const temporaryPath = `${pointerPath}.tmp-${process.pid}`;

// 沿用现有工具登记的数据目录；未登记时由画面模块沿用自身默认值。
let openDesignDataRoot = process.env.OD_DATA_DIR?.trim();
let previousOpenDesignEndpoint;
{
  const command = process.platform === "win32" ? process.env.ComSpec ?? "cmd.exe" : "codex";
  const args = process.platform === "win32" ? ["/d", "/s", "/c", "codex mcp get open-design --json"] : ["mcp", "get", "open-design", "--json"];
  const current = spawnSync(command, args, { encoding: "utf8", windowsHide: true });
  if (current.status === 0) {
    try {
      const env = JSON.parse(current.stdout).transport?.env;
      openDesignDataRoot ||= env?.OD_DATA_DIR;
      previousOpenDesignEndpoint = env?.OD_SIDECAR_CLIENT_ENDPOINT;
    } catch { /* 不猜测数据目录。 */ }
  }
}
try {
  const previous = JSON.parse(await readFile(pointerPath, "utf8"));
  openDesignDataRoot ||= previous.openDesignDataRoot;
  previousOpenDesignEndpoint ||= previous.previousOpenDesignEndpoint;
} catch { /* 首次安装没有旧指针。 */ }

await mkdir(runtimeDirectory, { recursive: true });
await writeFile(temporaryPath, `${JSON.stringify({ schemaVersion: 1, repoRoot, ...(openDesignDataRoot ? { openDesignDataRoot: resolve(openDesignDataRoot) } : {}), ...(previousOpenDesignEndpoint ? { previousOpenDesignEndpoint } : {}) }, null, 2)}\n`, "utf8");
await rename(temporaryPath, pointerPath);
console.log(`已写入 VideoFlowCut 仓库定位指针：${pointerPath}`);
