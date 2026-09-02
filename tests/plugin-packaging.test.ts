import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import test from "node:test";

const repositoryRoot = process.cwd();
const sourceSkillsRoot = join(repositoryRoot, ".agents", "skills");
const pluginRoot = join(repositoryRoot, "plugins", "videoflowcut");
const pluginSkillsRoot = join(pluginRoot, "skills");
const generatedSharedSkill = "_shared/SKILL.md";

async function listFiles(root: string, base = root): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const children = await Promise.all(entries.map(async (entry) => {
    const absolute = join(root, entry.name);
    if (entry.isDirectory()) return listFiles(absolute, base);
    return [relative(base, absolute).replace(/\\/g, "/")];
  }));
  return children.flat();
}

test("插件发行副本只由根目录 Skills 源同步，并声明唯一 MCP 入口", async () => {
  const [sourceFiles, rawPluginFiles] = await Promise.all([listFiles(sourceSkillsRoot), listFiles(pluginSkillsRoot)]);
  const pluginFiles = rawPluginFiles.filter((file) => file !== generatedSharedSkill);
  assert.deepEqual(pluginFiles.sort(), sourceFiles.sort(), "插件 Skills 不能手工漂移；请执行 npm run plugin:sync-skills");
  for (const file of sourceFiles) {
    assert.deepEqual(
      await readFile(join(pluginSkillsRoot, file)),
      await readFile(join(sourceSkillsRoot, file)),
      `插件 Skills 内容已漂移：${file}`
    );
  }
  assert.match(await readFile(join(pluginSkillsRoot, generatedSharedSkill), "utf8"), /内部共享参考资料/u);

  const manifest = JSON.parse(await readFile(join(pluginRoot, ".codex-plugin", "plugin.json"), "utf8"));
  const mcp = JSON.parse(await readFile(join(pluginRoot, ".mcp.json"), "utf8"));
  const marketplace = JSON.parse(await readFile(join(repositoryRoot, ".agents", "plugins", "marketplace.json"), "utf8"));
  assert.equal(manifest.name, "videoflowcut");
  assert.equal(manifest.skills, "./skills/");
  assert.equal(manifest.mcpServers, "./.mcp.json");
  assert.equal(mcp.mcpServers?.videoflowcut?.args?.[0], "./scripts/mcp-launcher.mjs");
  assert.ok(marketplace.plugins.some((entry: { name?: string; source?: { path?: string } }) => (
    entry.name === "videoflowcut" && entry.source?.path === "./plugins/videoflowcut"
  )));
});
