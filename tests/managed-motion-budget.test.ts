import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createApplication } from "@videocut/application";
import { registerMotionTools } from "../apps/server/src/motion-tools.js";
import { motionFixture } from "./fixtures/managed-motion.js";

test("真实MCP公开动效联合预算，边界接受、超限原子拒绝且支持分别提交完整分件", async () => {
  const root = await mkdtemp(join(tmpdir(), "videocut-motion-budget-"));
  const application = createApplication(root);
  const server = new McpServer({ name: "动效预算合同测试", version: "1.0.0" });
  const client = new Client({ name: "动效预算客户端", version: "1.0.0" });
  try {
    const created = application.createProject({ name: "独立预算验证" });
    const projectId = created.snapshot.project.id;
    const before = application.readProject(projectId);
    registerMotionTools(server, application, () => projectId);
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    const tool = (await client.listTools()).tools.find(entry => entry.name === "submit_motion_work")!;
    assert.match(tool.description!, /width×height×durationInFrames≤650000000/u);
    assert.match(tool.description!, /min\(900,30×fps,floor\(650000000\/\(width×height\)\)\)/u);
    assert.match(tool.description!, /自然内容节点.*独立幂等键.*局部帧.*不要求拆Scene/u);
    const workSchema = tool.inputSchema.properties!.work as { properties: Record<string, { description?: string; minimum?: number; maximum?: number }> };
    for (const key of ["width", "height", "durationInFrames"]) assert.match(workSchema.properties[key].description!, /650000000/u);
    assert.deepEqual([workSchema.properties.width.minimum, workSchema.properties.width.maximum], [64, 1920]);
    assert.deepEqual([workSchema.properties.fps.minimum, workSchema.properties.fps.maximum], [15, 60]);

    const submit = (key: string, width: number, height: number, frames: number, fps = 30) => client.callTool({
      name: "submit_motion_work", arguments: {
        project_id: projectId, base_revision_id: before.revision.number, idempotency_key: key,
        work: { ...motionFixture, width, height, durationInFrames: frames, fps }
      }
    });
    const expectRejected = async (result: Awaited<ReturnType<typeof submit>>, message: RegExp) => {
      assert.equal(result.isError, true);
      assert.match(JSON.stringify(result.content), message);
      assert.deepEqual(application.readProject(projectId), before, "拒绝不得改变任何视频对象或Revision");
      assert.equal(application.repository.listJobs(projectId).length, 0, "拒绝不得占用Job或幂等键");
    };
    await expectRejected(await submit("超过总量", 1000, 1000, 651), /预算/u);
    await expectRejected(await submit("竖屏超限", 768, 1344, 630, 24), /预算/u);
    await expectRejected(await submit("超过秒数", 320, 320, 451, 15), /30 秒/u);
    await expectRejected(await submit("奇数画布", 321, 320, 18), /偶数/u);

    // 只排队人工测试输入，不启动Worker，不使用正式项目或专项源码。
    for (const [key, width, height, frames, fps] of [
      ["正好总量上限", 1000, 1000, 650, 30],
      ["竖屏最大帧数", 768, 1344, 629, 24],
      ["连续内容前件", 768, 1344, 319, 24],
      ["连续内容后件", 768, 1344, 317, 24]
    ] as const) {
      const result = await submit(key, width, height, frames, fps);
      assert.notEqual(result.isError, true, JSON.stringify(result.content));
    }
    const jobs = application.repository.listJobs(projectId);
    assert.equal(jobs.length, 4);
    assert.equal(new Set(jobs.map(job => job.id)).size, 4);
    assert.deepEqual(application.readProject(projectId), before, "排队分件不得自动创建素材、拆分Scene或放置Cue");
  } finally {
    await client.close();
    await server.close();
    application.close();
    await rm(root, { recursive: true, force: true });
  }
});
