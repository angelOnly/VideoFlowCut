import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import test from "node:test";

const { createReloadingMcpSession } = await import(pathToFileURL(resolve("plugins/videoflowcut/scripts/mcp-session.mjs")).href);
const catalog = ["target_project", "read_project", "write"].map((name) => ({ name, inputSchema: { type: "object" } }));
function fixture() {
  let releaseId = "A";
  let tools = catalog;
  let healthy = true;
  let changed = 0;
  let write: undefined | (() => Promise<unknown>);
  const calls: Array<{ release: string; name: string; target?: string }> = [];
  const closed: string[] = [];
  const session = createReloadingMcpSession({
    resolveDeployment: async () => {
      if (!healthy) throw new Error("not ready");
      return { releaseId };
    },
    connect: async (deployment: { releaseId: string }) => {
      let target: string | undefined;
      return {
        releaseId: deployment.releaseId, tools, isAlive: () => true,
        close: async () => { closed.push(deployment.releaseId); },
        callTool: async (params: { name: string; arguments?: { project_id?: string } }) => {
          if (params.name === "target_project") target = params.arguments?.project_id;
          calls.push({ release: deployment.releaseId, name: params.name, target });
          if (params.name === "write" && write) return write();
          return { content: [{ type: "text", text: JSON.stringify({ release: deployment.releaseId, target }) }] };
        }
      };
    },
    onToolsChanged: async () => { changed++; }
  });
  return { session, calls, closed, changed: () => changed,
    publish: (value: string, newTools = catalog) => { releaseId = value; tools = newTools; },
    health: (value: boolean) => { healthy = value; },
    setWrite: (value: () => Promise<unknown>) => { write = value; }
  };
}

test("MCP 保持同一连接切换版本，并在新版恢复原项目定位", async () => {
  const f = fixture();
  await f.session.listTools();
  await f.session.callTool({ name: "target_project", arguments: { project_id: "project-test" } });
  f.publish("B");
  const result = await f.session.callTool({ name: "read_project" });
  assert.deepEqual(JSON.parse(result.content[0].text), { release: "B", target: "project-test" });
  assert.deepEqual(f.closed, ["A"]);
  assert.equal(f.changed(), 0);
  await f.session.close();
});

test("发布必须等待在途调用完成，未知写入结果不自动重放", async () => {
  const f = fixture();
  await f.session.listTools();
  let started!: () => void;
  let finish!: () => void;
  const began = new Promise<void>((done) => { started = done; });
  f.setWrite(() => new Promise((_done, reject) => { started(); finish = () => reject(new Error("lost response")); }));
  const pending = f.session.callTool({ name: "write" });
  await began;
  f.publish("B");
  const next = f.session.callTool({ name: "read_project" });
  assert.deepEqual(f.closed, []);
  finish();
  assert.match((await pending).content[0].text, /MCP_CALL_OUTCOME_UNKNOWN/);
  assert.equal(JSON.parse((await next).content[0].text).release, "B");
  assert.equal(f.calls.filter((call) => call.name === "write").length, 1);
  await f.session.close();
});

test("Schema 变化会通知刷新，旧参数不执行，刷新工具表后才能使用", async () => {
  const f = fixture();
  await f.session.listTools();
  f.publish("B", catalog.map((tool) => ({ ...tool, description: "新定义" })));
  const rejected = await f.session.callTool({ name: "write" });
  assert.equal(rejected.isError, true);
  assert.match(rejected.content[0].text, /MCP_TOOL_SCHEMA_CHANGED/);
  assert.equal(f.changed(), 1);
  assert.equal(f.calls.length, 0);
  await f.session.listTools();
  assert.notEqual((await f.session.callTool({ name: "write" })).isError, true);
  await f.session.close();
});

test("新 Runtime 不健康时不回退到旧 MCP 执行写入", async () => {
  const f = fixture();
  await f.session.listTools();
  f.publish("B");
  f.health(false);
  assert.match((await f.session.callTool({ name: "write" })).content[0].text, /MCP_RUNTIME_UNAVAILABLE/);
  assert.equal(f.calls.length, 0);
  f.health(true);
  assert.equal(JSON.parse((await f.session.callTool({ name: "read_project" })).content[0].text).release, "B");
  await f.session.close();
});

test("首次 Runtime 故障仍能列出空工具，恢复后通知发现且不重放请求", async () => {
  const f = fixture();
  f.health(false);
  assert.deepEqual(await f.session.listTools(), { tools: [] });
  assert.match((await f.session.callTool({ name: "write" })).content[0].text, /MCP_RUNTIME_UNAVAILABLE/);
  assert.equal(f.calls.length, 0);
  f.health(true);
  await f.session.refresh();
  assert.equal(f.changed(), 1);
  await f.session.listTools();
  assert.notEqual((await f.session.callTool({ name: "read_project" })).isError, true);
  await f.session.close();
});

test("排队期间已取消的调用不能在发布后继续写入", async () => {
  const f = fixture();
  await f.session.listTools();
  const controller = new AbortController();
  controller.abort();
  const result = await f.session.callTool({ name: "write" }, { signal: controller.signal });
  assert.match(result.content[0].text, /MCP_CALL_CANCELLED/);
  assert.equal(f.calls.length, 0);
  await f.session.close();
});
