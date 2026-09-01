import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { BridgeRunLostError, ComfyUIBridgeClient } from "@videocut/bridge";
import { createApplication, RevisionConflictError, type EditingApplication } from "@videocut/application";
import { DomainError } from "@videocut/domain";
import { runOneJob } from "../apps/job-worker/src/index.js";
import { runOneRenderJob } from "../apps/render-worker/src/index.js";
import { runExportJob } from "../apps/render-worker/src/exporter.js";
import { createServer } from "../apps/server/src/app.js";
import { evaluateQuality } from "@videocut/quality";

function textFromToolResult(result: unknown): string {
  if (!result || typeof result !== "object" || !("content" in result) || !Array.isArray(result.content)) {
    assert.fail("MCP 应返回标准 content 结果");
  }
  const first = result.content[0];
  if (!first || typeof first !== "object" || !("type" in first) || first.type !== "text" || !("text" in first) || typeof first.text !== "string") {
    assert.fail("MCP 应返回文本内容");
  }
  return first.text;
}

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

function addReadyAsset(app: EditingApplication, projectId: string, name: string, kind: "video" | "audio" | "speech" = "video", durationMs = 1_000) {
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
      durationMs,
      hasAudio: true,
      videoCodec: kind === "video" ? "h264" : undefined,
      audioCodec: "aac",
      sampleRate: kind === "video" ? undefined : 24_000,
      channels: kind === "video" ? undefined : 1,
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

test("SpeechAsset 写入 Dialogue 轨并在 Script 改动后移除旧旁白和字幕", async () => {
  const context = await createTestApplication();
  try {
    const created = context.app.createProject({ name: "旁白时间线测试" });
    const referenceAssetId = addReadyAsset(context.app, created.snapshot.project.id, "reference.wav", "audio");
    const registeredReference = context.app.registerVoiceReference({
      projectId: created.snapshot.project.id,
      baseRevision: context.app.readProject(created.snapshot.project.id).revision.number,
      assetId: referenceAssetId,
      authorizationNote: "测试授权说明"
    });
    const voiceReferenceId = registeredReference.snapshot.voiceReferences[0]!.id;
    context.app.applyTranscript({ projectId: created.snapshot.project.id, assetId: referenceAssetId, text: "第一句。第二句。", source: "manual" });
    const beforeAssembly = context.app.readProject(created.snapshot.project.id);
    const speechFileAssetId = addReadyAsset(context.app, created.snapshot.project.id, "speech.wav", "speech");
    const segments = [...beforeAssembly.snapshot.speechSegments].sort((left, right) => left.order - right.order);
    const segmentAssets = segments.map((segment, index) => ({
      id: `speech_segment_asset_test_${index}`,
      speechSegmentId: segment.id,
      voiceReferenceAssetId: referenceAssetId,
      assetId: speechFileAssetId,
      durationMs: 500,
      bridgeRunId: `run-${index}`,
      schemaVersion: "v1",
      quality: "passed" as const
    }));
    context.app.applySpeechAssembly({
      projectId: created.snapshot.project.id,
      generatedAssets: [],
      segmentAssets,
      speechAsset: {
        id: "speech_asset_test",
        assetId: speechFileAssetId,
        scriptRevision: beforeAssembly.snapshot.script.revision,
        segmentAssetIds: segmentAssets.map((segmentAsset) => segmentAsset.id),
        timing: {
          precision: "segment_exact",
          source: "测试用真实段级边界",
          segments: [
            { speechSegmentId: segments[0]!.id, startMs: 0, endMs: 500, startFrame: 0, endFrame: 12 },
            { speechSegmentId: segments[1]!.id, startMs: 500, endMs: 1_000, startFrame: 12, endFrame: 24 }
          ]
        },
        status: "ready"
      }
    });
    const assembled = context.app.readProject(created.snapshot.project.id);
    const dialogueTrack = assembled.snapshot.timeline.tracks.find((track) => track.name === "Dialogue")!;
    assert.equal(assembled.snapshot.timeline.items.filter((item) => item.trackId === dialogueTrack.id && item.assetId === speechFileAssetId).length, 1);
    assert.equal(assembled.snapshot.timeline.captions.length, 2);
    assert.ok(assembled.snapshot.timeline.captions.every((caption) => caption.style === "stable" && caption.precision === "segment_exact"));

    // 模拟旧版本只保存 SpeechAsset、没有实际 Dialogue Item 的历史快照。
    const legacy = context.app.repository.commit(created.snapshot.project.id, assembled.revision.number, "模拟旧旁白快照", (snapshot) => {
      snapshot.timeline.items = snapshot.timeline.items.filter((item) => item.trackId !== dialogueTrack.id);
      snapshot.timeline.captions = [];
    });
    const repaired = context.app.rebuildSpeechAssetTimeline({ projectId: created.snapshot.project.id, baseRevision: legacy.revision.number });
    assert.equal(repaired.snapshot.timeline.items.filter((item) => item.trackId === dialogueTrack.id && item.assetId === speechFileAssetId).length, 1);
    assert.equal(repaired.snapshot.timeline.captions.length, 2);

    context.app.applyScript({
      projectId: created.snapshot.project.id,
      baseRevision: repaired.revision.number,
      semanticUnitIds: [repaired.snapshot.semanticUnits[0]!.id]
    });
    const afterScript = context.app.readProject(created.snapshot.project.id);
    assert.equal(afterScript.snapshot.speechAsset, undefined);
    assert.equal(afterScript.snapshot.timeline.captions.length, 0);
    assert.equal(afterScript.snapshot.timeline.items.some((item) => item.trackId === dialogueTrack.id && item.assetId === speechFileAssetId), false);
    assert.equal(afterScript.snapshot.speechSegments.length, 1);
    assert.equal(afterScript.snapshot.speechSegments[0]!.status, "ready");
    assert.equal(afterScript.snapshot.speechSegmentAssets.length, 1);
    const reassemblyJob = context.app.submitVoiceSynthesis({ projectId: created.snapshot.project.id, voiceReferenceId });
    assert.deepEqual(reassemblyJob.payload.speechSegmentIds, []);
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

test("Bridge run_id 丢失会保留明确的可诊断错误", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ error: "run not found" }), { status: 404, headers: { "content-type": "application/json" } });
  try {
    const client = new ComfyUIBridgeClient("http://bridge.test/comfyui-bridge/v1");
    await assert.rejects(
      () => client.waitForRun("lost-run", { timeoutMs: 1, intervalMs: 1 }),
      (error: unknown) => error instanceof BridgeRunLostError && error.code === "BRIDGE_RUN_LOST" && error.runId === "lost-run"
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("失败 Job 保留 Bridge run、请求摘要与输出缺失诊断", async () => {
  const context = await createTestApplication();
  try {
    const created = context.app.createProject({ name: "Bridge 失败诊断测试" });
    const job = context.app.repository.createJob({
      projectId: created.snapshot.project.id,
      kind: "transcription",
      payload: { workflowId: "funasr" },
      idempotencyKey: "bridge-diagnostic-test"
    });
    await runOneJob(context.app, async (claimed) => {
      context.app.recordBridgeRun(claimed.id, {
        workflowId: "funasr",
        runId: "run-missing-output",
        schemaVersion: "v3",
        schemaRetryCount: 1,
        submittedAt: new Date().toISOString(),
        request: { fieldValues: {}, fileSlots: [{ id: "audio", kind: "audio", fileName: "source.wav" }] }
      });
      throw new DomainError("FunASR 已完成，但没有返回文本输出", "MISSING_TRANSCRIPT_OUTPUT");
    });
    const failed = context.app.trackJob(job.id);
    assert.equal(failed.status, "failed");
    const bridgeRuns = failed.result?.bridgeRuns as Array<{ runId: string }> | undefined;
    const diagnostic = failed.result?.diagnostic as { code?: string; message?: string } | undefined;
    assert.equal(bridgeRuns?.[0]?.runId, "run-missing-output");
    assert.equal(diagnostic?.code, "MISSING_TRANSCRIPT_OUTPUT");
    assert.match(diagnostic?.message ?? "", /没有返回文本输出/u);
  } finally {
    await context.dispose();
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

test("质量门禁会阻止旁白只覆盖首段、主画面却继续播放", async () => {
  const context = await createTestApplication();
  try {
    const created = context.app.createProject({ name: "口播长度一致性测试" });
    const videoAssetId = addReadyAsset(context.app, created.snapshot.project.id, "presenter.mp4", "video", 10_000);
    const referenceAssetId = addReadyAsset(context.app, created.snapshot.project.id, "reference.wav", "audio", 1_000);
    const built = context.app.buildPresenterTimeline({
      projectId: created.snapshot.project.id,
      baseRevision: context.app.readProject(created.snapshot.project.id).revision.number,
      assetIds: [videoAssetId],
      sceneSize: 1
    });
    context.app.applyTranscript({ projectId: created.snapshot.project.id, assetId: referenceAssetId, text: "只有这一句旁白。", source: "manual" });
    const segments = context.app.readProject(created.snapshot.project.id).snapshot.speechSegments;
    const speechFileAssetId = addReadyAsset(context.app, created.snapshot.project.id, "short-speech.wav", "speech", 1_000);
    context.app.applySpeechAssembly({
      projectId: created.snapshot.project.id,
      generatedAssets: [],
      segmentAssets: [{
        id: "short_segment_asset",
        speechSegmentId: segments[0]!.id,
        voiceReferenceAssetId: referenceAssetId,
        assetId: speechFileAssetId,
        durationMs: 1_000,
        bridgeRunId: "run-short",
        schemaVersion: "v1",
        quality: "passed"
      }],
      speechAsset: {
        id: "short_speech_asset",
        assetId: speechFileAssetId,
        scriptRevision: context.app.readProject(created.snapshot.project.id).snapshot.script.revision,
        segmentAssetIds: ["short_segment_asset"],
        timing: {
          precision: "segment_exact",
          source: "测试段级时序",
          segments: [{ speechSegmentId: segments[0]!.id, startMs: 0, endMs: 1_000, startFrame: 0, endFrame: 24 }]
        },
        status: "ready"
      }
    });
    const state = context.app.readProject(created.snapshot.project.id);
    const report = evaluateQuality(state.snapshot, state.revision.number);
    assert.ok(report.issues.some((entry) => entry.level === "blocking" && entry.code === "PRESENTER_SPEECH_VISUAL_DURATION_MISMATCH"));
    assert.ok(built.snapshot.timeline.durationInFrames > 0);

    const aligned = context.app.alignPresenterToSpeech({ projectId: created.snapshot.project.id, baseRevision: state.revision.number });
    const actorTrack = aligned.snapshot.timeline.tracks.find((track) => track.name === "Actor / A-roll")!;
    const dialogueTrack = aligned.snapshot.timeline.tracks.find((track) => track.name === "Dialogue")!;
    const actorEnd = aligned.snapshot.timeline.items.filter((item) => item.trackId === actorTrack.id).reduce((latest, item) => Math.max(latest, item.endFrame), 0);
    const dialogueEnd = aligned.snapshot.timeline.items.find((item) => item.trackId === dialogueTrack.id && item.assetId === speechFileAssetId)?.endFrame;
    assert.equal(actorEnd, dialogueEnd);
    const alignedReport = evaluateQuality(aligned.snapshot, aligned.revision.number);
    assert.equal(alignedReport.issues.some((entry) => entry.code === "PRESENTER_SPEECH_VISUAL_DURATION_MISMATCH"), false);
  } finally {
    await context.dispose();
  }
});

test("阶段0 HTTP 导入、Scene、Revision 回退与定位链接保持同一状态", async () => {
  const workspaceRoot = await mkdtemp(join(tmpdir(), "videocut-stage0-test-"));
  const { app: server, application } = await createServer({ workspaceRoot, webOrigin: "http://127.0.0.1:5173" });
  try {
    const createdResponse = await server.inject({ method: "POST", url: "/api/projects", payload: { name: "阶段0合同测试" } });
    assert.equal(createdResponse.statusCode, 201);
    const created = createdResponse.json() as { revision: { number: number }; snapshot: { project: { id: string } } };
    const projectId = created.snapshot.project.id;
    const sourcePath = join(process.cwd(), "videos", "数字人口播", "segment-01.mp4");
    const importedResponse = await server.inject({
      method: "POST",
      url: `/api/projects/${projectId}/assets/import-path`,
      payload: { baseRevision: created.revision.number, filePath: sourcePath }
    });
    assert.equal(importedResponse.statusCode, 200);
    assert.equal(await runOneJob(application), true);
    const imported = application.readProject(projectId);
    const readyAsset = imported.snapshot.assets[0];
    assert.equal(readyAsset?.status, "ready");

    const built = application.buildPresenterTimeline({ projectId, baseRevision: imported.revision.number, assetIds: [readyAsset!.id] });
    const scene = built.snapshot.scenes[0];
    const item = built.snapshot.timeline.items[0];
    assert.ok(scene);
    assert.ok(item);
    const editorResponse = await server.inject({
      method: "GET",
      url: `/api/projects/${projectId}/editor-url?sceneId=${scene.id}&itemId=${item.id}&frame=${scene.startFrame}`
    });
    assert.equal(editorResponse.statusCode, 200);
    const editor = editorResponse.json() as { editorUrl: string; focus: { revision: number } };
    assert.match(editor.editorUrl, new RegExp(`sceneId=${scene.id}`, "u"));
    assert.match(editor.editorUrl, new RegExp(`itemId=${item.id}`, "u"));
    assert.equal(editor.focus.revision, built.revision.number);

    const rolledBack = application.rollbackToRevision({ projectId, baseRevision: built.revision.number, targetRevision: imported.revision.number });
    assert.equal(rolledBack.snapshot.scenes.length, 0);
    assert.equal(rolledBack.snapshot.timeline.items.length, 0);
  } finally {
    await server.close();
    application.close();
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

test("阶段0 Web 服务与独立 MCP 进程读写同一 Project Revision", async () => {
  const workspaceRoot = await mkdtemp(join(tmpdir(), "videocut-web-mcp-test-"));
  const { app: server, application } = await createServer({ workspaceRoot, webOrigin: "http://127.0.0.1:5173" });
  const environment = Object.fromEntries(
    Object.entries(process.env).filter((entry): entry is [string, string] => typeof entry[1] === "string")
  );
  const transport = new StdioClientTransport({
    command: process.platform === "win32" ? "npm.cmd" : "npm",
    args: ["run", "mcp"],
    cwd: process.cwd(),
    env: { ...environment, VIDEOCUT_WORKSPACE: workspaceRoot },
    stderr: "pipe"
  });
  const client = new Client({ name: "videocut-web-mcp-contract-test", version: "1.0.0" });
  try {
    await client.connect(transport);
    const createdResponse = await server.inject({ method: "POST", url: "/api/projects", payload: { name: "Web 与 MCP 同状态测试" } });
    assert.equal(createdResponse.statusCode, 201);
    const created = createdResponse.json() as { revision: { number: number }; snapshot: { project: { id: string } } };
    const projectId = created.snapshot.project.id;

    const targeted = JSON.parse(textFromToolResult(await client.callTool({ name: "target_project", arguments: { project_id: projectId } }))) as { revision: number };
    assert.equal(targeted.revision, created.revision.number);
    const mcpSceneState = JSON.parse(textFromToolResult(await client.callTool({ name: "create_scene", arguments: {
      base_revision_id: created.revision.number,
      type: "PresenterScene",
      title: "MCP 创建场景",
      purpose: "验证服务和 MCP 共用 Revision",
      start_frame: 0,
      end_frame: 24
    } }))) as { revision: { number: number }; snapshot: { scenes: Array<{ id: string }> } };
    const sceneId = mcpSceneState.snapshot.scenes[0]?.id;
    assert.ok(sceneId);

    const visibleToWeb = await server.inject({ method: "GET", url: `/api/projects/${projectId}` });
    const webState = visibleToWeb.json() as { revision: { number: number }; snapshot: { scenes: Array<{ id: string }> } };
    assert.equal(webState.revision.number, mcpSceneState.revision.number);
    assert.equal(webState.snapshot.scenes[0]?.id, sceneId);

    const rollbackResponse = await server.inject({ method: "POST", url: `/api/projects/${projectId}/revisions/${created.revision.number}/rollback`, payload: { baseRevision: webState.revision.number } });
    assert.equal(rollbackResponse.statusCode, 200);
    const afterWebRollback = JSON.parse(textFromToolResult(await client.callTool({ name: "read_project", arguments: {} }))) as { revision: { number: number }; snapshot: { scenes: unknown[] } };
    assert.equal(afterWebRollback.snapshot.scenes.length, 0);
    assert.equal(afterWebRollback.revision.number, webState.revision.number + 1);
  } finally {
    await transport.close().catch(() => undefined);
    await server.close();
    application.close();
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

test("项目级 Codex 配置显式登记 MCP 与阶段 0–1 所需 Skills", async () => {
  const configPath = join(process.cwd(), ".codex", "config.toml");
  const config = await readFile(configPath, "utf8");
  assert.match(config, /\[mcp_servers\."video-editor-mcp"\]/u);
  assert.match(config, /args = \["run", "mcp"\]/u);
  for (const skillName of [
    "project-basics",
    "web-editor-operator",
    "production-director",
    "asset-import",
    "transcription",
    "voice-production",
    "presenter-motion-director",
    "captions",
    "quality-verification",
    "export",
    "known-errors"
  ]) {
    const skill = await readFile(join(process.cwd(), ".agents", "skills", skillName, "SKILL.md"), "utf8");
    assert.match(config, new RegExp(`\.agents/skills/${skillName}`, "u"));
    assert.match(skill, /## 触发条件/u);
    assert.match(skill, /## 验证与退出/u);
  }
});

test("video-editor-mcp 可通过 stdio 连接并定位新项目", async () => {
  const workspaceRoot = await mkdtemp(join(tmpdir(), "videocut-mcp-test-"));
  const environment = Object.fromEntries(
    Object.entries(process.env).filter((entry): entry is [string, string] => typeof entry[1] === "string")
  );
  const transport = new StdioClientTransport({
    command: process.platform === "win32" ? "npm.cmd" : "npm",
    args: ["run", "mcp"],
    cwd: process.cwd(),
    env: { ...environment, VIDEOCUT_WORKSPACE: workspaceRoot },
    stderr: "pipe"
  });
  const client = new Client({ name: "videocut-contract-test", version: "1.0.0" });
  try {
    await client.connect(transport);
    const tools = await client.listTools();
    const toolNames = new Set(tools.tools.map((tool) => tool.name));
    for (const name of [
      "create_project",
      "target_project",
      "read_project",
      "get_editor_url",
      "focus_editor_object",
      "submit_transcription",
      "apply_script",
      "manage_voice_references",
      "submit_voice_synthesis",
      "create_presenter_timeline",
      "manage_actor_performance",
      "manage_effect_cues",
      "align_presenter_to_speech",
      "render_preview_range",
      "submit_export"
    ]) {
      assert.ok(toolNames.has(name), `MCP 缺少 ${name}`);
    }

    const created = JSON.parse(textFromToolResult(await client.callTool({ name: "create_project", arguments: { name: "MCP 合同测试" } }))) as { snapshot: { project: { id: string } } };
    const projectId = created.snapshot.project.id;
    const targeted = JSON.parse(textFromToolResult(await client.callTool({ name: "target_project", arguments: { project_id: projectId } }))) as { projectId: string };
    assert.equal(targeted.projectId, projectId);
    const editor = JSON.parse(textFromToolResult(await client.callTool({ name: "get_editor_url", arguments: { project_id: projectId, frame: 0 } }))) as { editorUrl: string };
    assert.match(editor.editorUrl, new RegExp(`projectId=${projectId}`, "u"));
    assert.match(editor.editorUrl, /frame=0/u);
  } finally {
    await transport.close().catch(() => undefined);
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});
