import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, relative } from "node:path";
import { pluginRootFromModule, resolveRepoRoot } from "./repo-root.mjs";

const pluginRoot = pluginRootFromModule(import.meta.url);
const repoRoot = resolveRepoRoot({ pluginRoot });
const sourceRoot = join(repoRoot, ".agents", "skills");
const targetRoot = join(pluginRoot, "skills");
const generatedSharedSkill = "_shared/SKILL.md";

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

const manifest = JSON.parse(await readFile(join(pluginRoot, ".codex-plugin", "plugin.json"), "utf8"));
if (manifest.name !== "videoflowcut" || manifest.mcpServers !== "./.mcp.json" || manifest.skills !== "./skills/") {
  throw new Error("插件 manifest 未声明预期的 Skills 或 MCP 入口。");
}
const mcp = JSON.parse(await readFile(join(pluginRoot, ".mcp.json"), "utf8"));
if (mcp.mcpServers?.videoflowcut?.args?.[0] !== "./scripts/mcp-launcher.mjs") {
  throw new Error("插件 MCP 未指向运行时启动器。");
}
console.log(`插件 Skills、manifest 与 MCP 入口验证通过：${pluginRoot}`);
