import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createApplication, RevisionConflictError } from "@videocut/application";
import { createScene } from "@videocut/domain";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { createServer } from "../apps/server/src/app.js";
import { completeMotionFixture } from "./fixtures/motion-output.js";
import { motionFixture } from "./fixtures/managed-motion.js";

test("新建三种画幅准确；旧项目正式变更保留固定作品并使依赖失效", async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-canvas-"));
  const app = createApplication(root);
  try {
    for (const [aspectRatio, width, height] of [["9:16", 1080, 1920], ["16:9", 1920, 1080], ["1:1", 1080, 1080]] as const) {
      const state = app.createProject({ name: "画幅隔离验证", profile: "visual_explainer", brief: { aspectRatio } });
      assert.deepEqual([state.snapshot.timeline.width, state.snapshot.timeline.height], [width, height]);
    }
    const made = app.createProject({ name: "已有作品尺寸变更", profile: "visual_explainer", fps: 30 });
    const projectId = made.snapshot.project.id;
    const seed = app.repository.commit(projectId, 1, "隔离方形作品夹具", snapshot => {
      snapshot.timeline.width = 320; snapshot.timeline.height = 320;
      snapshot.scenes.push(createScene({ type: "PresenterScene", title: "尺寸依赖", purpose: "验证画布依赖", startFrame: 0, endFrame: 18 }));
    });
    const job = app.submitManagedMotion({ projectId, baseRevision: seed.revision.number, idempotencyKey: "canvas-motion", work: motionFixture });
    const asset = completeMotionFixture(app, { projectId, jobId: job.id, sourceHash: "canvas-fixture", engineVersion: "fixture", metadata: { width: 320, height: 320, fps: 30, durationMs: 600, hasAudio: false } });
    app.updateJob(job.id, { status: "succeeded" });
    const placed = app.createEffectCue({ projectId, baseRevision: app.readProject(projectId).revision.number, sceneId: seed.snapshot.scenes[0].id,
      type: "ManagedMotion", layer: "fullscreen", startFrame: 0, endFrame: 18, assetBindings: [{ slot: "motion", assetId: asset.id }] });
    const input = { projectId, baseRevision: placed.revision.number, width: 1080, height: 1920 };
    const after = app.setProjectCanvasSize(input);
    assert.deepEqual([after.snapshot.timeline.width, after.snapshot.timeline.height, after.snapshot.timeline.fps], [1080, 1920, 30]);
    assert.equal(after.snapshot.project.brief.aspectRatio, "9:16");
    assert.deepEqual(after.snapshot.assets, placed.snapshot.assets);
    assert.deepEqual(after.snapshot.scenes, placed.snapshot.scenes);
    assert.equal(after.snapshot.effectCues[0].status, "stale");
    assert.equal(app.setProjectCanvasSize({ ...input, baseRevision: after.revision.number }).revision.number, after.revision.number);
    assert.throws(() => app.setProjectCanvasSize(input), RevisionConflictError);
  } finally { app.close(); await rm(root, { recursive: true, force: true }); }
});

test("HTTP修正历史4:7画布，拒绝无效比例且不写版本", async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-http-canvas-"));
  const server = await createServer({ workspaceRoot: root });
  try {
    const state = server.application.createProject({ name: "历史画幅隔离验证", profile: "visual_explainer" });
    const id = state.snapshot.project.id;
    server.application.repository.commit(id, 1, "复现旧尺寸", snapshot => { snapshot.timeline.width = 768; snapshot.timeline.height = 1344; });
    const changed = await server.app.inject({ method: "POST", url: `/api/projects/${id}/canvas-size`, payload: { baseRevision: 2, width: 1080, height: 1920 } });
    assert.equal(changed.statusCode, 200);
    assert.equal(changed.json().snapshot.timeline.height, 1920);
    const conflict = await server.app.inject({ method: "POST", url: `/api/projects/${id}/canvas-size`, payload: { baseRevision: 2, width: 1920, height: 1080 } });
    assert.equal(conflict.statusCode, 409);
    for (const size of [{ width: 768, height: 1344 }, { width: 1081, height: 1920 }]) {
      const invalid = await server.app.inject({ method: "POST", url: `/api/projects/${id}/canvas-size`, payload: { baseRevision: 3, ...size } });
      assert.equal(invalid.statusCode, 400);
    }
    assert.equal(server.application.readProject(id).revision.number, 3);
  } finally { await server.app.close(); server.application.close(); await rm(root, { recursive: true, force: true }); }
});

test("真实MCP客户端发现并调用正式画布工具", async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-mcp-canvas-"));
  const client = new Client({ name: "canvas-size-regression", version: "1" });
  const transport = new StdioClientTransport({ command: process.execPath, args: ["node_modules/tsx/dist/cli.mjs", "apps/server/src/mcp.ts"],
    env: { ...Object.fromEntries(Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] !== undefined)), VIDEOCUT_WORKSPACE: root } });
  const text = (result: unknown) => JSON.parse((result as { content: Array<{ text?: string }> }).content.find(entry => entry.text)!.text!);
  try {
    await client.connect(transport);
    assert.ok((await client.listTools()).tools.find(tool => tool.name === "set_project_canvas_size"));
    const created = text(await client.callTool({ name: "create_project", arguments: { name: "MCP画幅隔离", profile: "visual_explainer" } }));
    const changed = text(await client.callTool({ name: "set_project_canvas_size", arguments: { project_id: created.snapshot.project.id, base_revision_id: 1, width: 1920, height: 1080 } }));
    assert.deepEqual([changed.snapshot.timeline.width, changed.snapshot.timeline.height], [1920, 1080]);
    assert.equal(changed.snapshot.project.brief.aspectRatio, "16:9");
  } finally { await client.close(); await transport.close(); await rm(root, { recursive: true, force: true }); }
});
