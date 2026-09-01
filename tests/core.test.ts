import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { ComfyUIBridgeClient } from "@videocut/bridge";
import { createApplication, RevisionConflictError, type EditingApplication } from "@videocut/application";
import { DomainError } from "@videocut/domain";
import { runOneJob } from "../apps/job-worker/src/index.js";
import { runOneRenderJob } from "../apps/render-worker/src/index.js";
import { runExportJob } from "../apps/render-worker/src/exporter.js";

async function createTestApplication(): Promise<{ root: string; app: EditingApplication; dispose: () => Promise<void> }> {
  const root = await mkdtemp(join(tmpdir(), "videocut-test-"));
  const app = createApplication(root);
  return {
    root,
    app,
    dispose: async () => {
      app.close();
      await rm(root, { recursive: true, force: true });
    }
  };
}

function addReadyAsset(app: EditingApplication, projectId: string, name: string, kind: "video" | "audio" = "video") {
  const initial = app.readProject(projectId);
  const imported = app.registerImportedAsset({
    projectId,
    baseRevision: initial.revision.number,
    name,
    kind,
    managedPath: `assets/source/${name}`,
    sourceHash: `${name}-hash`
  });
  app.applyMediaAnalysis({
    projectId,
    assetId: imported.asset.id,
    metadata: {
      durationMs: 1_000,
      hasAudio: true,
      videoCodec: kind === "video" ? "h264" : undefined,
      audioCodec: "aac",
      width: kind === "video" ? 720 : undefined,
      height: kind === "video" ? 1280 : undefined
    }
  });
  return imported.asset.id;
}

test("过期 Revision 和失败写入不会污染项目快照", async () => {
  const context = await createTestApplication();
  try {
    const created = context.app.createProject({ name: "Revision 测试" });
    const assetId = addReadyAsset(context.app, created.snapshot.project.id, "clip-a.mp4");
    const current = context.app.readProject(created.snapshot.project.id);

    assert.throws(
      () => context.app.createScene({
        projectId: created.snapshot.project.id,
        baseRevision: created.revision.number,
        type: "PresenterScene",
        title: "过期场景",
        purpose: "验证冲突",
        startFrame: 0,
        endFrame: 24,
        assetIds: [assetId]
      }),
      RevisionConflictError
    );
    assert.equal(context.app.readProject(created.snapshot.project.id).revision.number, current.revision.number);

    assert.throws(
      () => context.app.createEffectCue({
        projectId: created.snapshot.project.id,
        baseRevision: current.revision.number,
        sceneId: "missing-scene",
        type: "MetricBackdrop",
        layer: "rear",
        startFrame: 0,
        endFrame: 24
      }),
      (error: unknown) => error instanceof DomainError && error.code === "SCENE_NOT_FOUND"
    );
    const afterFailure = context.app.readProject(created.snapshot.project.id);
    assert.equal(afterFailure.revision.number, current.revision.number);
    assert.equal(afterFailure.snapshot.effectCues.length, 0);
  } finally {
    await context.dispose();
  }
});

test("同轨重叠会原子回滚，保留原有 Presenter 主线", async () => {
  const context = await createTestApplication();
  try {
    const created = context.app.createProject({ name: "时间线测试" });
    const first = addReadyAsset(context.app, created.snapshot.project.id, "first.mp4");
    const second = addReadyAsset(context.app, created.snapshot.project.id, "second.mp4");
    const beforeBuild = context.app.readProject(created.snapshot.project.id);
    context.app.buildPresenterTimeline({ projectId: created.snapshot.project.id, baseRevision: beforeBuild.revision.number, assetIds: [first, second], sceneSize: 1 });
    const beforeMove = context.app.readProject(created.snapshot.project.id);
    const actorTrack = beforeMove.snapshot.timeline.tracks.find((track) => track.name === "Actor / A-roll")!;
    const actorItems = beforeMove.snapshot.timeline.items.filter((item) => item.trackId === actorTrack.id).sort((left, right) => left.startFrame - right.startFrame);

    assert.throws(
      () => context.app.moveItem({
        projectId: created.snapshot.project.id,
        baseRevision: beforeMove.revision.number,
        itemId: actorItems[1]!.id,
        startFrame: actorItems[0]!.startFrame,
        ripple: false
      }),
      (error: unknown) => error instanceof DomainError && error.code === "TRACK_OVERLAP"
    );
    const afterMove = context.app.readProject(created.snapshot.project.id);
    assert.equal(afterMove.revision.number, beforeMove.revision.number);
    assert.deepEqual(afterMove.snapshot.timeline.items, beforeMove.snapshot.timeline.items);
  } finally {
    await context.dispose();
  }
});

test("局部 Script 修改只保留未受影响的 SpeechSegment", async () => {
  const context = await createTestApplication();
  try {
    const created = context.app.createProject({ name: "Script 测试" });
    const audioAsset = addReadyAsset(context.app, created.snapshot.project.id, "voice.wav", "audio");
    context.app.applyTranscript({ projectId: created.snapshot.project.id, assetId: audioAsset, text: "第一句完整表达。第二句会删除。第三句需要保留。", source: "manual" });
    const before = context.app.readProject(created.snapshot.project.id);
    const units = [...before.snapshot.semanticUnits].sort((left, right) => left.order - right.order);
    const segments = [...before.snapshot.speechSegments].sort((left, right) => left.order - right.order);

    context.app.applyScript({
      projectId: created.snapshot.project.id,
      baseRevision: before.revision.number,
      semanticUnitIds: [units[0]!.id, units[2]!.id]
    });
    const after = context.app.readProject(created.snapshot.project.id);
    assert.deepEqual(after.snapshot.script.semanticUnitIds, [units[0]!.id, units[2]!.id]);
    assert.deepEqual(after.snapshot.speechSegments.map((segment) => segment.id), [segments[0]!.id, segments[2]!.id]);
    assert.ok(after.revision.impact.stale.includes(segments[1]!.id));
  } finally {
    await context.dispose();
  }
});

test("Bridge 在 schemaVersion 409 后读取最新工作流并重试", async () => {
  const originalFetch = globalThis.fetch;
  let detailCalls = 0;
  let runCalls = 0;
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url.endsWith("/workflows/test-workflow")) {
      detailCalls += 1;
      return new Response(JSON.stringify({
        id: "test-workflow",
        name: "测试工作流",
        available: true,
        schemaVersion: detailCalls === 1 ? "v1" : "v2",
        fields: [{ id: "prompt", label: "文本", kind: "text", required: true }],
        itemSlots: [],
        outputs: []
      }), { headers: { "content-type": "application/json" } });
    }
    if (url.endsWith("/workflows/test-workflow/runs")) {
      runCalls += 1;
      const request = JSON.parse(String(init?.body));
      if (runCalls === 1) return new Response(JSON.stringify({ error: "schemaVersion 过期" }), { status: 409, headers: { "content-type": "application/json" } });
      assert.equal(request.schemaVersion, "v2");
      return new Response(JSON.stringify({ id: "run-2", status: "queued", outputs: [] }), { headers: { "content-type": "application/json" } });
    }
    throw new Error(`未预期的请求：${url}`);
  };
  try {
    const client = new ComfyUIBridgeClient("http://bridge.test/comfyui-bridge/v1");
    const result = await client.createRunWithSchemaRetry("test-workflow", async (workflow) => ({ fieldValues: { prompt: workflow.schemaVersion } }));
    assert.equal(result.workflow.schemaVersion, "v2");
    assert.equal(result.run.id, "run-2");
    assert.equal(detailCalls, 2);
    assert.equal(runCalls, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("媒体 Worker 与 Render Worker 只领取各自的任务", async () => {
  const context = await createTestApplication();
  try {
    const created = context.app.createProject({ name: "Worker 隔离测试" });
    const exportJob = context.app.submitExport({ projectId: created.snapshot.project.id });
    assert.equal(await runOneJob(context.app, async () => ({ unexpected: true })), false);
    assert.equal(context.app.trackJob(exportJob.id).status, "queued");
    assert.equal(await runOneRenderJob(context.app, async (job) => ({ processedKind: job.kind })), true);
    assert.deepEqual(context.app.trackJob(exportJob.id).result, { processedKind: "export" });
  } finally {
    await context.dispose();
  }
});

test("质量门禁会在渲染前拒绝空时间线导出", async () => {
  const context = await createTestApplication();
  try {
    const created = context.app.createProject({ name: "导出门禁测试" });
    const exportJob = context.app.submitExport({ projectId: created.snapshot.project.id });
    await assert.rejects(
      () => runExportJob(context.app, exportJob, { render: async () => assert.fail("质量门禁不应进入渲染") } as never),
      (error: unknown) => error instanceof DomainError && error.code === "QUALITY_GATE_BLOCKED"
    );
  } finally {
    await context.dispose();
  }
});
