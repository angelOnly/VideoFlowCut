import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, relative } from "node:path";
import { pluginRootFromModule, resolveRepoRoot } from "./repo-root.mjs";

const pluginRoot = pluginRootFromModule(import.meta.url);
const repoRoot = resolveRepoRoot({ pluginRoot });
const sourceRoot = join(repoRoot, ".agents", "skills");
const targetRoot = join(pluginRoot, "skills");
const generatedSharedSkill = "_shared/SKILL.md";
const runtimeRoot = join(pluginRoot, "runtime", "dist");
const releaseFiles = [
  ["Runtime 入口", join(runtimeRoot, "runtime.cjs")],
  ["MCP 入口", join(runtimeRoot, "mcp.cjs")],
  ["Remotion 入口", join(runtimeRoot, "remotion", "render-entry.cjs")],
  ["Web 入口", join(runtimeRoot, "web", "index.html")],
  ["发行 manifest", join(runtimeRoot, "manifest.json")]
];

async function listFiles(root, base = root) {
  const entries = await readdir(root, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const absolute = join(root, entry.name);
    if (entry.isDirectory()) return listFiles(absolute, base);
    return [relative(base, absolute).replace(/\\/g, "/")];
  }));
  return files.flat();
}

function digest(contents) {
  return createHash("sha256").update(contents).digest("hex");
}

async function requireNonEmptyFile(label, path) {
  const information = await stat(path).catch(() => undefined);
  if (!information?.isFile() || information.size <= 0) {
    throw new Error(`插件发行物缺少或为空：${label}（${path}）`);
  }
}

async function assertNoSourceRuntimeLaunch(path) {
  const contents = await readFile(path, "utf8");
  const forbidden = [
    /tsxCliPath/u,
    /apps[\\/]runtime[\\/]src/iu,
    /apps[\\/]server[\\/]src[\\/]mcp/iu,
    /apps[\\/]render-worker[\\/]src[\\/]render-entry/iu,
    /[\\/]tsx(?:[\\/]|['"])/iu
  ];
  const hit = forbidden.find((pattern) => pattern.test(contents));
  if (hit) throw new Error(`插件运行入口仍含源码或 tsx 启动引用 ${hit}：${path}`);
}

if (!existsSync(targetRoot)) throw new Error("插件 Skills 尚未生成。请先执行 npm run plugin:sync-skills。");
const sourceFiles = await listFiles(sourceRoot);
const targetFiles = (await listFiles(targetRoot)).filter((file) => file !== generatedSharedSkill);
if (sourceFiles.sort().join("\n") !== targetFiles.sort().join("\n")) {
  throw new Error("插件 Skills 与根目录 .agents/skills 不一致。请执行 npm run plugin:sync-skills。");
}
for (const file of sourceFiles) {
  const [source, target] = await Promise.all([readFile(join(sourceRoot, file)), readFile(join(targetRoot, file))]);
  if (digest(source) !== digest(target)) throw new Error(`插件 Skills 文件已漂移：${file}`);
}
if (!existsSync(join(targetRoot, generatedSharedSkill))) throw new Error("插件缺少 _shared 校验适配文件。");

await Promise.all(releaseFiles.map(([label, path]) => requireNonEmptyFile(label, path)));
const releaseManifest = JSON.parse(await readFile(join(runtimeRoot, "manifest.json"), "utf8"));
if (releaseManifest.schemaVersion !== 1 || releaseManifest.format !== "commonjs"
  || releaseManifest.runtimeEntry !== "runtime.cjs" || releaseManifest.mcpEntry !== "mcp.cjs"
  || releaseManifest.remotionEntry !== "remotion/render-entry.cjs" || releaseManifest.webRoot !== "web"
  || releaseManifest.nodeRuntime !== ">=22.5.0") {
  throw new Error("插件发行 Runtime manifest 与启动约定不一致。请重新执行 npm run plugin:build。");
}
await Promise.all([
  "repo-root.mjs",
  "runtime-launcher.mjs",
  "mcp-launcher.mjs"
].map((file) => assertNoSourceRuntimeLaunch(join(pluginRoot, "scripts", file))));
await Promise.all(releaseFiles.slice(0, 3).map(([, path]) => assertNoSourceRuntimeLaunch(path)));

const manifest = JSON.parse(await readFile(join(pluginRoot, ".codex-plugin", "plugin.json"), "utf8"));
if (manifest.name !== "videoflowcut" || manifest.mcpServers !== "./.mcp.json" || manifest.skills !== "./skills/") {
  throw new Error("插件 manifest 未声明预期的 Skills 或 MCP 入口。");
}
const mcp = JSON.parse(await readFile(join(pluginRoot, ".mcp.json"), "utf8"));
if (mcp.mcpServers?.videoflowcut?.command !== "node" || mcp.mcpServers?.videoflowcut?.args?.[0] !== "./scripts/mcp-launcher.mjs") {
  throw new Error("插件 MCP 必须以 Node 启动发行 Runtime 启动器。");
}
console.log(`插件 Skills、发行 Runtime、manifest 与 MCP 入口验证通过：${pluginRoot}`);
