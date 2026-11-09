import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, rename } from "node:fs/promises";
import { isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const pluginRoot = join(repoRoot, "plugins", "videoflowcut");
const runtimeRoot = join(pluginRoot, "runtime");
const candidateRoot = join(runtimeRoot, "candidates");
const id = randomUUID();
const candidate = resolve(candidateRoot, `integrated-${id}`);
const previous = resolve(candidateRoot, `previous-${id}`);
const dist = join(runtimeRoot, "dist");
for (const target of [candidate, previous, dist]) {
  const part = relative(runtimeRoot, target);
  if (!part || part.startsWith("..") || isAbsolute(part)) throw new Error("发行路径不在插件 Runtime 内。");
}

async function run(command, args, extraEnv = {}) {
  await new Promise((resolveRun, reject) => {
    const child = spawn(command, args, { cwd: repoRoot, env: { ...process.env, ...extraEnv }, stdio: "inherit", windowsHide: true });
    child.once("error", reject);
    child.once("exit", (code, signal) => code === 0 ? resolveRun() : reject(new Error(`发行构建失败：${args.join(" ")} (${signal ?? code})`)));
  });
}
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error("请通过 npm run plugin:build 启动统一发行构建。");
for (const task of ["motion-contract:sync", "open-design:build", "typecheck", "build:web", "plugin:sync-skills"]) {
  await run(process.execPath, [npmCli, "run", task]);
}
await mkdir(candidateRoot, { recursive: true });
await run(process.execPath, [join(pluginRoot, "scripts", "build-runtime.mjs"), "--out-dir", candidate]);
await run(process.execPath, [join(pluginRoot, "scripts", "verify-plugin.mjs"), "--release-dir", candidate]);
for (const test of ["plugin-e2e.mjs", "open-design-e2e.mjs"]) {
  await run(process.execPath, [join(pluginRoot, "scripts", test)], { VFC_TEST_RELEASE_DIR: candidate });
}
await run(process.execPath, [join(pluginRoot, "scripts", "configure-repo.mjs")]);

// 候选构建和校验成功后才替换发行目录；失败时保留原发行物。
let movedPrevious = false;
try {
  if (existsSync(dist)) { await rename(dist, previous); movedPrevious = true; }
  await rename(candidate, dist);
} catch (error) {
  if (movedPrevious && !existsSync(dist)) await rename(previous, dist);
  throw error;
}
console.log(`统一发行构建完成：${dist}`);
