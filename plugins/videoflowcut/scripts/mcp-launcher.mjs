import { spawn } from "node:child_process";
import { join } from "node:path";
import { pluginRootFromModule, releaseNodePath, resolveReleaseRuntime, resolveRepoRoot, resolveWorkspaceRoot } from "./repo-root.mjs";
import { ensureRuntime } from "./runtime-launcher.mjs";

const pluginRoot = pluginRootFromModule(import.meta.url);
const repoRoot = resolveRepoRoot({ pluginRoot });
const workspaceRoot = resolveWorkspaceRoot(repoRoot);

try {
  // 将发行物校验放入统一错误处理，缺少 dist 时给出可操作的中文诊断。
  const release = resolveReleaseRuntime(pluginRoot);
  const runtime = await ensureRuntime({ pluginRoot, repoRoot, workspaceRoot });
  // MCP stdout 属于 JSON-RPC 协议，所有运行提示只能写 stderr。
  console.error(`VideoFlowCut Runtime 已${runtime.reused ? "复用" : "启动"}：${runtime.webUrl}`);
  const child = spawn(process.execPath, [release.mcpEntry], {
    cwd: pluginRoot,
    windowsHide: true,
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_PATH: releaseNodePath(repoRoot),
      VIDEOFLOWCUT_NODE_MODULES: join(repoRoot, "node_modules"),
      VIDEOCUT_WORKSPACE: workspaceRoot,
      WEB_ORIGIN: runtime.webUrl,
      VIDEOFLOWCUT_RUNTIME_DIST: release.root
    }
  });
  const stop = () => child.kill();
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  child.on("error", (error) => {
    console.error(`VideoFlowCut MCP 启动失败：${error.message}`);
    process.exitCode = 1;
  });
  child.on("exit", (code) => {
    process.exitCode = code ?? 1;
  });
} catch (error) {
  console.error(error instanceof Error ? `VideoFlowCut MCP 未启动：${error.message}` : error);
  process.exitCode = 1;
}
