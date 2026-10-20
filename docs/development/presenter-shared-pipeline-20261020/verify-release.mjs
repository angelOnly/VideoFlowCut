/** 在隔离工作区核读候选发行 MCP；不连接生产 Runtime 或提交生成任务。 */
import assert from "node:assert/strict";
import { readFile, writeFile, mkdtemp } from "node:fs/promises";
import { resolve, join, delimiter } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const evidence = fileURLToPath(new URL(".", import.meta.url));
const repo = resolve(evidence, "../../..");
const dist = join(repo, "plugins/videoflowcut/runtime/dist");
const workspace = await mkdtemp(join(evidence, "isolated-"));
const transport = new StdioClientTransport({
  command: process.execPath, args: [join(dist, "mcp.cjs")], cwd: repo, stderr: "pipe",
  env: { ...process.env, NODE_PATH: [join(repo, "node_modules"), process.env.NODE_PATH].filter(Boolean).join(delimiter),
    VIDEOCUT_WORKSPACE: workspace, VIDEOFLOWCUT_RUNTIME_DIST: dist, WEB_ORIGIN: "http://127.0.0.1:1/" }
});
const client = new Client({ name: "共同主干候选核验", version: "1" });
const call = async (name, args) => {
  const response = await client.callTool({ name, arguments: args });
  await writeFile(join(evidence, `${name}.json`), JSON.stringify(response, null, 2) + "\n");
  assert.notEqual(response.isError, true);
  return JSON.parse(response.content.find(block => block.type === "text").text);
};
try {
  await client.connect(transport);
  const schema = await client.listTools();
  assert.match(schema.tools.find(tool => tool.name === "search_motion_mechanisms").description, /case_context/);
  const result = await call("search_motion_mechanisms", { ids: ["001-m01", "002-m16"] });
  const catalogue = JSON.parse(await readFile(join(repo, "references/motion-cases/skillry/case-catalogue.json"), "utf8"));
  for (const card of result.cards) {
    const parent = catalogue.cases.find(item => item.case_number === card.case_number);
    assert.deepEqual(card.case_context, Object.fromEntries(
      ["video_types", "materials", "scenario", "material_requirements", "transfer_cost"].map(key => [key, parent[key]])
    ));
  }
  const read = await call("read_motion_mechanism", {
    id: result.cards[0].id, source_sha256: result.source_sha256, include_storyboard: false
  });
  assert.deepEqual(read.card.case_context, result.cards[0].case_context);
  const manifest = JSON.parse(await readFile(join(dist, "manifest.json"), "utf8"));
  const summary = { result: "候选发行 MCP 实际返回通过", releaseId: manifest.releaseId, pluginVersion: manifest.pluginVersion,
    tools: schema.tools.length, source_sha256: result.source_sha256, workspace,
    scope: "隔离 stdio MCP 搜索及核读；未安装、未部署、未运行创作任务或判断成片效果" };
  await writeFile(join(evidence, "release-verification.json"), JSON.stringify(summary, null, 2) + "\n");
  console.log(JSON.stringify(summary, null, 2));
} finally { await client.close(); await transport.close(); }
