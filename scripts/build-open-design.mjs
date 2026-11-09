import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const componentRoot = fileURLToPath(new URL("../components/open-design/", import.meta.url));
const major = Number(process.versions.node.split(".")[0]);
if (major !== 24) throw new Error("画面模块需要 Node 24，请切换版本后重试。");

async function pnpm(args) {
  await new Promise((resolve, reject) => {
    const child = spawn(process.platform === "win32" ? "pnpm.cmd" : "pnpm", args, {
      cwd: componentRoot,
      shell: process.platform === "win32",
      stdio: "inherit",
      windowsHide: true
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => code === 0 ? resolve() : reject(new Error(`画面模块命令失败：${args.join(" ")} (${signal ?? code})`)));
  });
}

if (process.argv[2] === "install") {
  await pnpm(["install", "--frozen-lockfile"]);
} else {
  if (!existsSync(join(componentRoot, "node_modules"))) throw new Error("画面模块依赖未安装，请执行 npm run open-design:install。");
  await pnpm(["--filter", "@open-design/daemon...", "--if-present", "run", "build"]);
  await pnpm(["--filter", "@open-design/tools-dev", "run", "build"]);
  await pnpm(["--filter", "@open-design/web", "run", "build"]);
}
