import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import test from "node:test";

const repositoryRoot = process.cwd();
const sourceSkillsRoot = join(repositoryRoot, ".agents", "skills");
const pluginRoot = join(repositoryRoot, "plugins", "videoflowcut");
const pluginSkillsRoot = join(pluginRoot, "skills");
const generatedSharedFiles = new Set([
  "_shared/SKILL.md",
  "_shared/agents/openai.yaml"
]);

test("发行文本固定 LF，检出后 Release ID 不受 Windows 换行转换影响", async () => {
  const root = join(pluginRoot, "runtime", "dist");
  for (const file of await listFiles(root)) {
    if (!/\.(?:cjs|js|css|html|json|py)$/iu.test(file)) continue;
    const bytes = await readFile(join(root, file));
    assert.equal(bytes.includes(13), false, `${file} 含 CR，检出后发行哈希可能变化`);
  }
});

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
  const pluginFiles = rawPluginFiles.filter((file) => !generatedSharedFiles.has(file));
  assert.deepEqual(pluginFiles.sort(), sourceFiles.sort(), "插件 Skills 不能手工漂移；请执行 npm run plugin:sync-skills");
  for (const file of sourceFiles) {
    assert.deepEqual(
      await readFile(join(pluginSkillsRoot, file)),
      await readFile(join(sourceSkillsRoot, file)),
      `插件 Skills 内容已漂移：${file}`
    );
  }
  assert.match(await readFile(join(pluginSkillsRoot, "_shared", "SKILL.md"), "utf8"), /内部共享参考资料/u);
  const sharedMetadata = (await readFile(join(pluginSkillsRoot, "_shared", "agents", "openai.yaml"), "utf8"))
    .replace(/\r\n/g, "\n");
  assert.equal(sharedMetadata, [
    "interface:",
    "  display_name: \"VideoFlowCut 共享参考资料\"",
    "  short_description: \"仅供 VideoFlowCut Skills 按需引用\"",
    "policy:",
    "  allow_implicit_invocation: false",
    ""
  ].join("\n"), "内部共享参考 Skill 必须有合法的界面元数据并禁止隐式调用，避免成为独立自动工作流");

  const manifest = JSON.parse(await readFile(join(pluginRoot, ".codex-plugin", "plugin.json"), "utf8"));
  const mcp = JSON.parse(await readFile(join(pluginRoot, ".mcp.json"), "utf8"));
  const marketplace = JSON.parse(await readFile(join(repositoryRoot, ".agents", "plugins", "marketplace.json"), "utf8"));
  assert.equal(manifest.name, "videoflowcut");
  assert.match(manifest.version, /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/u, "插件 manifest 必须声明可安装的 SemVer 版本");
  assert.equal(manifest.skills, "./skills/");
  assert.equal(manifest.mcpServers, "./.mcp.json");
  assert.equal(mcp.mcpServers?.videoflowcut?.command, "node");
  assert.equal(mcp.mcpServers?.videoflowcut?.args?.[0], "./scripts/mcp-launcher.mjs");
  assert.ok(marketplace.plugins.some((entry: { name?: string; source?: { path?: string } }) => (
    entry.name === "videoflowcut" && entry.source?.path === "./plugins/videoflowcut"
  )));
});

test("插件安装时只启动已构建的 CommonJS Runtime", async () => {
  const runtimeRoot = join(pluginRoot, "runtime", "dist");
  const requiredReleaseFiles = [
    join(runtimeRoot, "runtime.cjs"),
    join(runtimeRoot, "render-thread.cjs"),
    join(runtimeRoot, "mcp.cjs"),
    join(runtimeRoot, "remotion", "render-entry.cjs"),
    join(runtimeRoot, "web", "index.html"),
    join(runtimeRoot, "manifest.json")
  ];
  for (const file of requiredReleaseFiles) {
    assert.equal(existsSync(file), true, `插件发行物缺失：${file}`);
    assert.ok((await stat(file)).size > 0, `插件发行物为空：${file}`);
  }

  const [repoRoot, runtimeLauncher, mcpLauncher, candidateLauncher, manifest, pluginManifest] = await Promise.all([
    readFile(join(pluginRoot, "scripts", "repo-root.mjs"), "utf8"),
    readFile(join(pluginRoot, "scripts", "runtime-launcher.mjs"), "utf8"),
    readFile(join(pluginRoot, "scripts", "mcp-launcher.mjs"), "utf8"),
    readFile(join(pluginRoot, "scripts", "candidate-runtime.mjs"), "utf8"),
    readFile(join(runtimeRoot, "manifest.json"), "utf8"),
    readFile(join(pluginRoot, ".codex-plugin", "plugin.json"), "utf8")
  ]);
  assert.match(runtimeLauncher, /release\.runtimeEntry/u);
  assert.match(mcpLauncher, /release\.mcpEntry/u);
  assert.match(mcpLauncher, /process\.chdir\(repoRoot\)/u, "外层 MCP 必须释放 Windows 安装目录的 CWD 句柄");
  assert.doesNotMatch(mcpLauncher, /cwd:\s*(?:release\.)?pluginRoot/u);
  assert.doesNotMatch(runtimeLauncher, /cwd:\s*options\.pluginRoot/u);
  assert.doesNotMatch(repoRoot, /apps[\\/]server[\\/]src[\\/]mcp/iu);
  assert.doesNotMatch(runtimeLauncher, /tsxCliPath|apps[\\/]runtime[\\/]src/iu);
  assert.doesNotMatch(mcpLauncher, /tsxCliPath|apps[\\/]server[\\/]src[\\/]mcp/iu);
  assert.match(candidateLauncher, /COMFYUI_BRIDGE_URL|comfyui-bridge-url/u);
  assert.doesNotMatch(candidateLauncher, /tsxCliPath|apps[\\/]runtime[\\/]src/iu);
  const releaseManifest = JSON.parse(manifest) as { releaseId?: unknown; [key: string]: unknown };
  const sourcePluginManifest = JSON.parse(pluginManifest) as { version?: unknown };
  assert.match(String(releaseManifest.releaseId ?? ""), /^release-[a-f0-9]{64}$/u, "发行物必须包含内容哈希 Release ID");
  assert.equal(releaseManifest.pluginVersion, sourcePluginManifest.version, "发行 Runtime 必须绑定当前插件安装版本");
  assert.deepEqual({ ...releaseManifest, releaseId: "<dynamic-release-id>" }, {
    schemaVersion: 2,
    format: "commonjs",
    releaseId: "<dynamic-release-id>",
    pluginVersion: sourcePluginManifest.version,
    runtimeEntry: "runtime.cjs",
    mcpEntry: "mcp.cjs",
    remotionEntry: "remotion/render-entry.cjs",
    webRoot: "web",
    nodeRuntime: ">=22.5.0",
    dependencies: "由启动器通过宿主仓库 node_modules 的 NODE_PATH 提供；发行入口不使用 tsx 或 apps 源码。"
  });
});
