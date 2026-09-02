import assert from "node:assert/strict";
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { BridgeRunLostError, ComfyUIBridgeClient } from "@videocut/bridge";
import { AssetProviderRegistry, MockAssetProvider } from "@videocut/acquisition";
import { createApplication, RevisionConflictError, type EditingApplication } from "@videocut/application";
import { DomainError } from "@videocut/domain";
import { createMediaJobProcessor, runOneJob } from "../apps/job-worker/src/index.js";
import { runOneRenderJob } from "../apps/render-worker/src/index.js";
import { runExportJob } from "../apps/render-worker/src/exporter.js";
import { createServer } from "../apps/server/src/app.js";
import { evaluateQuality } from "@videocut/quality";
import { runProcess } from "@videocut/speech";
import { compileCameraPunchLayout, compileCutawayLayout, compileMotionLayout, cutawaySourceVolume } from "@videocut/remotion";
import type { EditorialReviewPass } from "@videocut/contracts";

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

/**
 * 核心 HTTP 合同只需要可分析的最小媒体，不应依赖完整的数字人口播素材库。
 * Fixture 在临时目录生成，CI 与本地都使用同一条 1 秒、64px、含静音音轨的确定性媒体。
 */
async function createDeterministicVideoFixture(directory: string): Promise<string> {
  const path = join(directory, "tiny-fixture.mp4");
  await runProcess("ffmpeg", [
    "-y",
    "-f", "lavfi", "-i", "color=c=0x264653:s=64x64:r=24:d=1",
    "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono",
    "-shortest",
    "-c:v", "mpeg4", "-q:v", "5",
    "-c:a", "aac",
    "-movflags", "+faststart",
    path
  ]);
  return path;
}

function addReadyAsset(app: EditingApplication, projectId: string, name: string, kind: "video" | "audio" | "speech" = "video", durationMs = 1_000) {
  const initial = app.readProject(projectId);
  const imported = app.registerImportedAsset({
    projectId,
    baseRevision: initial.revision.number,
    name,
    kind,
    managedPath: `assets/source/${name}`,
    sourceHash: `${name}-hash`,
    provenance: {
      source: "local_import",
      rightsStatus: "cleared",
      acquiredAt: new Date().toISOString()
    }
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

/** 测试显式模拟 semantic-continuity：标点候选本身不会自动变成 SemanticUnit。 */
function applySemanticUnitsFromCandidates(app: EditingApplication, projectId: string) {
  const before = app.readProject(projectId);
  return app.applySemanticUnits({
    projectId,
    baseRevision: before.revision.number,
    units: [...before.snapshot.transcriptSentenceCandidates]
      .sort((left, right) => left.order - right.order)
      .map((candidate) => ({
        candidateIds: [candidate.id],
        text: candidate.text,
        kind: "statement" as const,
        confidence: 0.9,
        pauseBefore: { durationMs: 0, reason: "sentence" as const }
      }))
  });
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
    const pending = context.app.readProject(created.snapshot.project.id);
    assert.equal(pending.snapshot.semanticUnits.length, 0, "标点候选不能自动冒充语义单元");
    applySemanticUnitsFromCandidates(context.app, created.snapshot.project.id);
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

test("人工校正转写遵守明确 baseRevision，不会覆盖并发编辑", async () => {
  const context = await createTestApplication();
  try {
    const created = context.app.createProject({ name: "人工转写 Revision 测试" });
    const audioAsset = addReadyAsset(context.app, created.snapshot.project.id, "manual.wav", "audio");
    const current = context.app.readProject(created.snapshot.project.id);
    assert.throws(
      () => context.app.applyTranscript({ projectId: created.snapshot.project.id, baseRevision: created.revision.number, assetId: audioAsset, text: "这是一句人工校正转写。", source: "manual" }),
      RevisionConflictError
    );
    const applied = context.app.applyTranscript({ projectId: created.snapshot.project.id, baseRevision: current.revision.number, assetId: audioAsset, text: "这是一句人工校正转写。", source: "manual" });
    assert.equal(applied.snapshot.transcripts[0]?.source, "manual");
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
    applySemanticUnitsFromCandidates(context.app, created.snapshot.project.id);
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

test("Presenter 有语义段但没有语音与稳定字幕时不能交付", async () => {
  const context = await createTestApplication();
  try {
    const created = context.app.createProject({ name: "Presenter 字幕门禁", profile: "presenter_motion" });
    const videoAssetId = addReadyAsset(context.app, created.snapshot.project.id, "presenter.mp4", "video");
    const transcriptAssetId = addReadyAsset(context.app, created.snapshot.project.id, "source.wav", "audio");
    context.app.buildPresenterTimeline({ projectId: created.snapshot.project.id, baseRevision: context.app.readProject(created.snapshot.project.id).revision.number, assetIds: [videoAssetId] });
    context.app.applyTranscript({ projectId: created.snapshot.project.id, assetId: transcriptAssetId, text: "这是可理解的完整表达。", source: "manual" });
    const semantic = applySemanticUnitsFromCandidates(context.app, created.snapshot.project.id);
    const quality = evaluateQuality(semantic.snapshot, semantic.revision.number);
    assert.ok(quality.issues.some((entry) => entry.code === "PRESENTER_CAPTION_SOURCE_REQUIRED" && entry.level === "blocking"));
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
    applySemanticUnitsFromCandidates(context.app, created.snapshot.project.id);
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

test("人物音频所有权阻止原声与 Dialogue 重复播放", async () => {
  const context = await createTestApplication();
  try {
    const created = context.app.createProject({ name: "音频所有权测试" });
    const videoAssetId = addReadyAsset(context.app, created.snapshot.project.id, "presenter.mp4", "video", 1_000);
    const referenceAssetId = addReadyAsset(context.app, created.snapshot.project.id, "reference.wav", "audio", 1_000);
    const built = context.app.buildPresenterTimeline({ projectId: created.snapshot.project.id, baseRevision: context.app.readProject(created.snapshot.project.id).revision.number, assetIds: [videoAssetId], sceneSize: 1 });
    context.app.applyTranscript({ projectId: created.snapshot.project.id, assetId: referenceAssetId, text: "完整旁白。", source: "manual" });
    applySemanticUnitsFromCandidates(context.app, created.snapshot.project.id);
    const segment = context.app.readProject(created.snapshot.project.id).snapshot.speechSegments[0]!;
    const speechFileAssetId = addReadyAsset(context.app, created.snapshot.project.id, "dialogue.wav", "speech", 1_000);
    context.app.applySpeechAssembly({
      projectId: created.snapshot.project.id,
      generatedAssets: [],
      segmentAssets: [{ id: "dialogue_segment", speechSegmentId: segment.id, voiceReferenceAssetId: referenceAssetId, assetId: speechFileAssetId, durationMs: 1_000, bridgeRunId: "run-dialogue", schemaVersion: "v1", quality: "passed" }],
      speechAsset: {
        id: "dialogue_asset",
        assetId: speechFileAssetId,
        scriptRevision: context.app.readProject(created.snapshot.project.id).snapshot.script.revision,
        segmentAssetIds: ["dialogue_segment"],
        timing: { precision: "segment_exact", source: "测试", segments: [{ speechSegmentId: segment.id, startMs: 0, endMs: 1_000, startFrame: 0, endFrame: 24 }] },
        status: "ready"
      }
    });
    const actorItemId = built.snapshot.timeline.items.find((item) => item.assetId === videoAssetId)!.id;
    const withSourceAudio = context.app.registerActorPerformance({
      projectId: created.snapshot.project.id,
      baseRevision: context.app.readProject(created.snapshot.project.id).revision.number,
      timelineItemId: actorItemId,
      source: "imported",
      maskMode: "none",
      audioMode: "use_source_audio"
    });
    assert.ok(evaluateQuality(withSourceAudio.snapshot, withSourceAudio.revision.number).issues.some((issue) => issue.code === "DUPLICATE_DIALOGUE_AUDIO" && issue.level === "blocking"));

    const withDialogueAudio = context.app.registerActorPerformance({
      projectId: created.snapshot.project.id,
      baseRevision: withSourceAudio.revision.number,
      timelineItemId: actorItemId,
      source: "imported",
      maskMode: "none",
      audioMode: "use_dialogue_track"
    });
    assert.equal(evaluateQuality(withDialogueAudio.snapshot, withDialogueAudio.revision.number).issues.some((issue) => issue.code === "DUPLICATE_DIALOGUE_AUDIO"), false);
  } finally {
    await context.dispose();
  }
});

test("Remotion 正式导出失败不会降级为仅 A-roll 成片", async () => {
  const context = await createTestApplication();
  try {
    const created = context.app.createProject({ name: "导出降级保护测试" });
    const videoAssetId = addReadyAsset(context.app, created.snapshot.project.id, "presenter.mp4", "video", 1_000);
    const built = context.app.buildPresenterTimeline({ projectId: created.snapshot.project.id, baseRevision: context.app.readProject(created.snapshot.project.id).revision.number, assetIds: [videoAssetId], sceneSize: 1 });
    const exportJob = context.app.submitExport({ projectId: created.snapshot.project.id, revision: built.revision.number, purpose: "draft", idempotencyKey: "remotion-must-fail" });
    await assert.rejects(
      () => runExportJob(context.app, exportJob, { render: async () => { throw new Error("渲染器不可用"); } } as never),
      (error: unknown) => error instanceof DomainError && error.code === "REMOTION_EXPORT_FAILED"
    );
  } finally {
    await context.dispose();
  }
});

test("ProductionRun 缺少真实创作证据时保持 incomplete，且不复制 Project Snapshot", async () => {
  const context = await createTestApplication();
  try {
    const created = context.app.createProject({ name: "ProductionRun 测试" });
    const run = await context.app.startProductionRun({
      projectId: created.snapshot.project.id,
      loadedSkills: ["production-director", "semantic-continuity"],
      loadedReferences: [".agents/skills/_shared/EDITORIAL_FOUNDATIONS.md"]
    });
    const recorded = await context.app.recordCreativeDecision({
      projectId: created.snapshot.project.id,
      runId: run.id,
      category: "visual",
      decision: "前半段保留人物主画面",
      rationale: "先建立人物与观点的稳定关系",
      quietRange: { startFrame: 0, endFrame: 24, reason: "开场不堆动效" },
      mcpCommand: "record_creative_decision"
    });
    assert.equal(recorded.creativeDecisions.length, 1);
    const completed = await context.app.completeProductionRun({ projectId: created.snapshot.project.id, runId: run.id });
    assert.equal(completed.status, "incomplete");
    assert.equal(completed.finalRevision, context.app.readProject(created.snapshot.project.id).revision.number);
    assert.ok(completed.completionBlockers.some((blocker) => blocker.includes("语义决策")));
    assert.ok(completed.completionBlockers.some((blocker) => blocker.includes("合成帧证据")));
    const readBack = await context.app.readSkillExecutionReport({ projectId: created.snapshot.project.id, runId: run.id });
    assert.equal(readBack.quietRanges[0]?.reason, "开场不堆动效");
    assert.equal("skillExecutionReport" in context.app.readProject(created.snapshot.project.id).snapshot, false, "报告不写入项目快照");
  } finally {
    await context.dispose();
  }
});

test("Presenter ProductionRun 仅在当前 Revision 的决策、Preview、合成帧与审片齐全后完成", async () => {
  const context = await createTestApplication();
  try {
    const created = context.app.createProject({ name: "ProductionRun 收口测试" });
    const videoAssetId = addReadyAsset(context.app, created.snapshot.project.id, "presenter.mp4", "video", 1_000);
    const assembled = context.app.buildPresenterTimeline({
      projectId: created.snapshot.project.id,
      baseRevision: context.app.readProject(created.snapshot.project.id).revision.number,
      assetIds: [videoAssetId],
      sceneSize: 1
    });
    const revision = assembled.revision.number;
    const run = await context.app.startProductionRun({ projectId: created.snapshot.project.id, baseRevision: revision, loadedSkills: ["production-director", "quality-verification"] });
    for (const [category, decision] of [["semantic", "保留完整表达"], ["story", "先建立观点再给例子"], ["visual", "开场保持安静人物"]] as const) {
      await context.app.recordCreativeDecision({
        projectId: created.snapshot.project.id,
        runId: run.id,
        category,
        decision,
        rationale: "测试当前 Revision 的收口条件"
      });
    }
    const preview = context.app.submitPreview({ projectId: created.snapshot.project.id, revision, fromFrame: 0, toFrame: assembled.snapshot.timeline.durationInFrames });
    const previewPath = join(created.snapshot.project.rootPath, "previews", "revision-test.mp4");
    await mkdir(join(created.snapshot.project.rootPath, "previews", "frames"), { recursive: true });
    await writeFile(previewPath, "mock preview");
    const inspectionFrames = [0, Math.floor(assembled.snapshot.timeline.durationInFrames / 2), assembled.snapshot.timeline.durationInFrames - 1];
    const inspectionEvidencePaths = inspectionFrames.map((frame) => join("previews", "frames", `revision-${revision}-frame-${frame}.jpg`));
    for (const frame of inspectionFrames) {
      await writeFile(join(created.snapshot.project.rootPath, "previews", "frames", `revision-${revision}-frame-${frame}.jpg`), `mock frame ${frame}`);
    }
    context.app.updateJob(preview.id, { status: "succeeded", result: { revision, path: previewPath, fromFrame: 0, toFrame: assembled.snapshot.timeline.durationInFrames } });
    await context.app.recordEditorialQualityReview({
      projectId: created.snapshot.project.id,
      runId: run.id,
      revision,
      passes: ["audio_only", "mute_visual", "audiovisual", "first_viewer", "mode_specific"],
      previewEvidence: [inspectionEvidencePaths[1]!],
      findings: []
    });
    const withoutInspection = await context.app.completeProductionRun({ projectId: created.snapshot.project.id, runId: run.id, finalRevision: revision });
    assert.equal(withoutInspection.status, "incomplete");
    assert.ok(withoutInspection.completionBlockers.some((blocker) => blocker.includes("inspect_composed_frames")));
    await context.app.recordPreviewInspection({
      projectId: created.snapshot.project.id,
      previewJobId: preview.id,
      revision,
      frames: inspectionFrames.map((frame, index) => ({ frame, relativePath: inspectionEvidencePaths[index]! }))
    });
    const completed = await context.app.completeProductionRun({ projectId: created.snapshot.project.id, runId: run.id, finalRevision: revision });
    assert.equal(completed.status, "completed");
    assert.deepEqual(completed.completionBlockers, []);
    assert.equal(completed.composedFrameEvidence.length, 3);
  } finally {
    await context.dispose();
  }
});

test("ProductionRun 会要求每个已启用 EffectCue 至少有一张对应合成帧", async () => {
  const context = await createTestApplication();
  try {
    const created = context.app.createProject({ name: "EffectCue 审片覆盖" });
    const videoAssetId = addReadyAsset(context.app, created.snapshot.project.id, "presenter.mp4", "video", 1_000);
    const built = context.app.buildPresenterTimeline({ projectId: created.snapshot.project.id, baseRevision: context.app.readProject(created.snapshot.project.id).revision.number, assetIds: [videoAssetId] });
    const scene = built.snapshot.scenes[0]!;
    const withCue = context.app.createEffectCue({
      projectId: created.snapshot.project.id,
      baseRevision: built.revision.number,
      sceneId: scene.id,
      type: "CameraPunch",
      layer: "actor",
      startFrame: 5,
      endFrame: 10,
      note: "只在这个短区间强调人物"
    });
    const revision = withCue.revision.number;
    const run = await context.app.startProductionRun({ projectId: created.snapshot.project.id, loadedSkills: ["production-director", "quality-verification"] });
    for (const category of ["semantic", "story", "visual"] as const) {
      await context.app.recordCreativeDecision({ projectId: created.snapshot.project.id, runId: run.id, category, decision: `${category} 决策`, rationale: "验证每个视觉事件都必须被实际检查" });
    }
    const preview = context.app.submitPreview({ projectId: created.snapshot.project.id, revision, fromFrame: 0, toFrame: withCue.snapshot.timeline.durationInFrames });
    const previewPath = join(created.snapshot.project.rootPath, "previews", "effect-coverage.mp4");
    const frameDirectory = join(created.snapshot.project.rootPath, "previews", "frames");
    await mkdir(frameDirectory, { recursive: true });
    await writeFile(previewPath, "mock preview");
    const outsideFrames = [0, 15, withCue.snapshot.timeline.durationInFrames - 1];
    for (const frame of [...outsideFrames, 7]) await writeFile(join(frameDirectory, `revision-${revision}-frame-${frame}.jpg`), `frame ${frame}`);
    context.app.updateJob(preview.id, { status: "succeeded", result: { revision, path: previewPath, fromFrame: 0, toFrame: withCue.snapshot.timeline.durationInFrames } });
    const toArtifact = (frame: number) => ({ frame, relativePath: join("previews", "frames", `revision-${revision}-frame-${frame}.jpg`) });
    await context.app.recordPreviewInspection({ projectId: created.snapshot.project.id, previewJobId: preview.id, revision, frames: outsideFrames.map(toArtifact) });
    await context.app.recordEditorialQualityReview({
      projectId: created.snapshot.project.id,
      runId: run.id,
      revision,
      passes: ["audio_only", "mute_visual", "audiovisual", "first_viewer", "mode_specific"],
      previewEvidence: [toArtifact(outsideFrames[0]!).relativePath],
      findings: []
    });
    const missingCueFrame = await context.app.completeProductionRun({ projectId: created.snapshot.project.id, runId: run.id, finalRevision: revision });
    assert.equal(missingCueFrame.status, "incomplete");
    assert.ok(missingCueFrame.completionBlockers.some((blocker) => blocker.includes("EffectCue") || blocker.includes("效果")));

    await context.app.recordPreviewInspection({ projectId: created.snapshot.project.id, previewJobId: preview.id, revision, frames: [...outsideFrames, 7].map(toArtifact) });
    const completed = await context.app.completeProductionRun({ projectId: created.snapshot.project.id, runId: run.id, finalRevision: revision });
    assert.equal(completed.status, "completed");
  } finally {
    await context.dispose();
  }
});

test("delivery 导出要求目标 Revision 已完成真实审片，draft 可进入渲染链路", async () => {
  const context = await createTestApplication();
  try {
    const created = context.app.createProject({ name: "导出用途门禁测试" });
    const videoAssetId = addReadyAsset(context.app, created.snapshot.project.id, "presenter.mp4", "video", 1_000);
    const assembled = context.app.buildPresenterTimeline({ projectId: created.snapshot.project.id, baseRevision: context.app.readProject(created.snapshot.project.id).revision.number, assetIds: [videoAssetId], sceneSize: 1 });
    const delivery = context.app.submitExport({ projectId: created.snapshot.project.id, revision: assembled.revision.number, purpose: "delivery" });
    assert.equal(delivery.payload.purpose, "delivery");
    await assert.rejects(
      () => runExportJob(context.app, delivery, { render: async () => assert.fail("没有审片的 delivery 不应进入渲染") } as never),
      (error: unknown) => error instanceof DomainError && error.code === "EDITORIAL_REVIEW_REQUIRED"
    );
    const draft = context.app.submitExport({ projectId: created.snapshot.project.id, revision: assembled.revision.number, purpose: "draft" });
    assert.equal(draft.payload.purpose, "draft");
    await assert.rejects(
      () => runExportJob(context.app, draft, { render: async () => { throw new Error("已进入草稿渲染链路"); } } as never),
      (error: unknown) => error instanceof DomainError && error.code === "REMOTION_EXPORT_FAILED"
    );
  } finally {
    await context.dispose();
  }
});

test("真实审片记录会按 Revision 合并到 QualityReport，过期记录不会冒充当前结论", async () => {
  const context = await createTestApplication();
  try {
    const created = context.app.createProject({ name: "编辑审片记录测试" });
    const run = await context.app.startProductionRun({
      projectId: created.snapshot.project.id,
      loadedSkills: ["quality-verification"]
    });
    const recorded = await context.app.recordEditorialQualityReview({
      projectId: created.snapshot.project.id,
      runId: run.id,
      revision: created.revision.number,
      passes: ["audio_only", "mute_visual", "audiovisual", "first_viewer", "mode_specific"],
      previewEvidence: ["测试环境已检查 R1 的真实预览范围 F0–F24"],
      findings: [{
        pass: "mute_visual",
        severity: "warning",
        category: "typography",
        summary: "字幕需要在安全区内复核",
        evidence: "稳定帧中字幕接近底部边缘",
        impact: "小屏设备上可能影响阅读",
        suggestedFix: "上移字幕安全区",
        verificationMethod: "重新渲染稳定帧"
      }]
    });
    assert.equal(recorded.editorialReview?.revision, created.revision.number);
    const review = await context.app.readLatestEditorialQualityReview({ projectId: created.snapshot.project.id });
    const quality = evaluateQuality(created.snapshot, created.revision.number, review);
    assert.equal(quality.editorial.status, "reviewed");
    assert.ok(quality.editorial.passes.includes("audiovisual"));
    assert.equal(quality.editorial.previewEvidence.length, 1);
    assert.equal(quality.editorial.typography[0]?.code, "EDITORIAL_TYPOGRAPHY");
    assert.equal(quality.technical.some((issue) => issue.code === "EDITORIAL_TYPOGRAPHY"), false, "编辑审片不能冒充技术检测结果");

    const updated = context.app.updateStory({ projectId: created.snapshot.project.id, baseRevision: created.revision.number, title: "R2" });
    const stale = evaluateQuality(updated.snapshot, updated.revision.number, await context.app.readLatestEditorialQualityReview({ projectId: created.snapshot.project.id }));
    assert.equal(stale.editorial.status, "stale");
    assert.equal(stale.editorial.typography.length, 0);
  } finally {
    await context.dispose();
  }
});

test("目标 Revision 导出只读取自身的审片记录，不被更新版本覆盖", async () => {
  const context = await createTestApplication();
  try {
    const created = context.app.createProject({ name: "目标 Revision 审片查询" });
    const reviewInput: { passes: EditorialReviewPass[]; previewEvidence: string[]; findings: [] } = {
      passes: ["audio_only", "mute_visual", "audiovisual", "first_viewer", "mode_specific"],
      previewEvidence: ["真实 Preview 已完成检查"],
      findings: []
    };
    const firstRun = await context.app.startProductionRun({ projectId: created.snapshot.project.id, loadedSkills: ["quality-verification"] });
    await context.app.recordEditorialQualityReview({ projectId: created.snapshot.project.id, runId: firstRun.id, revision: created.revision.number, ...reviewInput });
    const second = context.app.updateStory({ projectId: created.snapshot.project.id, baseRevision: created.revision.number, title: "R2" });
    const secondRun = await context.app.startProductionRun({ projectId: created.snapshot.project.id, loadedSkills: ["quality-verification"] });
    await context.app.recordEditorialQualityReview({ projectId: created.snapshot.project.id, runId: secondRun.id, revision: second.revision.number, ...reviewInput });

    const firstReview = await context.app.readEditorialQualityReview({ projectId: created.snapshot.project.id, revision: created.revision.number });
    const secondReview = await context.app.readEditorialQualityReview({ projectId: created.snapshot.project.id, revision: second.revision.number });
    assert.equal(firstReview?.revision, created.revision.number);
    assert.equal(secondReview?.revision, second.revision.number);
  } finally {
    await context.dispose();
  }
});

test("已使用的外部素材必须记录明确授权，素材角色和来源可独立更新", async () => {
  const context = await createTestApplication();
  try {
    const created = context.app.createProject({ name: "外部素材来源测试" });
    const assetId = addReadyAsset(context.app, created.snapshot.project.id, "provider-broll.mp4", "video", 1_000);
    const external = context.app.updateAssetEditorialMetadata({
      projectId: created.snapshot.project.id,
      baseRevision: context.app.readProject(created.snapshot.project.id).revision.number,
      assetId,
      role: "b_roll",
      tags: ["城市", "呼吸镜头"],
      provenance: {
        source: "provider",
        provider: "测试素材库",
        sourceUrl: "https://example.test/assets/provider-broll",
        originalAssetId: "provider-001",
        rightsStatus: "unknown",
        acquiredAt: new Date().toISOString()
      }
    });
    const asset = external.snapshot.assets.find((candidate) => candidate.id === assetId)!;
    assert.equal(asset.role, "b_roll");
    assert.deepEqual(asset.tags, ["城市", "呼吸镜头"]);

    const assembled = context.app.assemblePresenterTrack({ projectId: created.snapshot.project.id, baseRevision: external.revision.number, assetIds: [assetId] });
    const blocked = evaluateQuality(assembled.snapshot, assembled.revision.number);
    assert.ok(blocked.issues.some((entry) => entry.code === "EXTERNAL_ASSET_RIGHTS_UNKNOWN" && entry.level === "blocking"));

    const cleared = context.app.updateAssetEditorialMetadata({
      projectId: created.snapshot.project.id,
      baseRevision: assembled.revision.number,
      assetId,
      provenance: {
        source: "provider",
        provider: "测试素材库",
        sourceUrl: "https://example.test/assets/provider-broll",
        originalAssetId: "provider-001",
        rightsStatus: "cleared",
        acquiredAt: new Date().toISOString()
      }
    });
    assert.equal(evaluateQuality(cleared.snapshot, cleared.revision.number).issues.some((entry) => entry.code === "EXTERNAL_ASSET_RIGHTS_UNKNOWN"), false);
  } finally {
    await context.dispose();
  }
});

test("素材需求通过 Mock Provider 候选、本地化、哈希和来源登记后才成为可用 Asset", async () => {
  const context = await createTestApplication();
  try {
    const sourcePath = await createDeterministicVideoFixture(context.root);
    const created = context.app.createProject({ name: "素材获取闭环测试" });
    const requested = context.app.manageAssetRequirement({
      projectId: created.snapshot.project.id,
      baseRevision: created.revision.number,
      action: "create",
      title: "下班后城市呼吸镜头",
      purpose: "为人物反思留出真实生活的视觉呼吸。",
      visualBrief: "傍晚城市中景人物慢步行，画面上方保留天空，适合竖屏字幕。",
      queryHints: ["city", "walking", "dusk"],
      minDurationMs: 800,
      rightsRequirement: "cleared_only"
    });
    const request = requested.snapshot.assetRequests[0]!;
    const provider = new MockAssetProvider([
      {
        originalAssetId: "accepted-city-walk",
        name: "city-walk.mp4",
        filePath: sourcePath,
        sourceUrl: "https://example.test/stock/city-walk",
        width: 64,
        height: 64,
        durationMs: 1_000,
        creator: "测试作者",
        license: "测试许可",
        rightsStatus: "cleared",
        tags: ["城市", "步行"]
      },
      {
        originalAssetId: "blocked-rights",
        name: "unknown-rights.mp4",
        filePath: sourcePath,
        sourceUrl: "https://example.test/stock/unknown-rights",
        width: 64,
        height: 64,
        durationMs: 1_000,
        rightsStatus: "unknown"
      }
    ]);
    const providerCandidates = await provider.search({ request, query: "city walking dusk" });
    const searched = context.app.recordAssetSearch({
      projectId: created.snapshot.project.id,
      baseRevision: requested.revision.number,
      assetRequestId: request.id,
      provider: provider.name,
      query: "city walking dusk",
      candidates: providerCandidates
    });
    const accepted = searched.candidates.find((candidate) => candidate.originalAssetId === "accepted-city-walk")!;
    const rejected = searched.candidates.find((candidate) => candidate.originalAssetId === "blocked-rights")!;
    assert.equal(accepted.status, "available");
    assert.equal(rejected.status, "rejected");
    assert.match(rejected.rejectionReason ?? "", /授权/u);
    assert.equal(context.app.readAssetCandidate({ projectId: created.snapshot.project.id, assetCandidateId: accepted.id }).request.id, request.id);

    // Candidate 不是 Asset，不能绕过 Acquire 直接塞进 Scene。
    assert.throws(
      () => context.app.createScene({
        projectId: created.snapshot.project.id,
        baseRevision: searched.state.revision.number,
        type: "CutawayScene",
        title: "错误候选引用",
        purpose: "验证候选不会直接成为 Timeline 素材",
        startFrame: 0,
        endFrame: 24,
        assetIds: [accepted.id]
      }),
      (error: unknown) => error instanceof DomainError && error.code === "ASSET_NOT_FOUND"
    );
    assert.throws(
      () => context.app.acquireAssetCandidate({
        projectId: created.snapshot.project.id,
        baseRevision: searched.state.revision.number,
        assetCandidateId: rejected.id
      }),
      (error: unknown) => error instanceof DomainError && error.code === "ASSET_CANDIDATE_NOT_AVAILABLE"
    );

    const acquisition = context.app.acquireAssetCandidate({
      projectId: created.snapshot.project.id,
      baseRevision: searched.state.revision.number,
      assetCandidateId: accepted.id
    });
    const registry = new AssetProviderRegistry([provider]);
    assert.equal(await runOneJob(context.app, createMediaJobProcessor(context.app, undefined, registry)), true);
    const acquiredJob = context.app.trackJob(acquisition.job.id);
    assert.equal(acquiredJob.status, "succeeded", acquiredJob.error);
    const acquiredState = context.app.readProject(created.snapshot.project.id);
    const acquiredAsset = acquiredState.snapshot.assets.find((asset) => asset.id === acquiredJob.result?.assetId);
    assert.ok(acquiredAsset);
    assert.equal(acquiredAsset.role, "b_roll");
    assert.equal(acquiredAsset.provenance?.provider, "mock");
    assert.equal(acquiredAsset.provenance?.rightsStatus, "cleared");
    assert.match(acquiredAsset.sourceHash ?? "", /^[a-f0-9]{64}$/u);
    assert.equal(acquiredState.snapshot.assetCandidates.find((candidate) => candidate.id === accepted.id)?.acquiredAssetId, acquiredAsset.id);

    // Acquire 只登记媒体分析任务；ready 必须由第二个 Worker Job 的 ffprobe 结果决定。
    assert.equal(acquiredAsset.status, "queued");
    assert.equal(await runOneJob(context.app, createMediaJobProcessor(context.app, undefined, registry)), true);
    const readyAsset = context.app.readProject(created.snapshot.project.id).snapshot.assets.find((asset) => asset.id === acquiredAsset.id)!;
    assert.equal(readyAsset.status, "ready", readyAsset.failureReason);
    assert.ok(readyAsset.metadata?.videoCodec);
    const provenance = context.app.readAssetProvenance({ projectId: created.snapshot.project.id, assetId: readyAsset.id });
    assert.equal(provenance.candidate?.id, accepted.id);
    assert.equal(provenance.provenance?.sourceUrl, "https://example.test/stock/city-walk");
  } finally {
    await context.dispose();
  }
});

test("素材下载到伪装成视频的 HTML 错误页时保留失败诊断且不创建 Asset", async () => {
  const context = await createTestApplication();
  try {
    const errorPagePath = join(context.root, "expired-download.mp4");
    await writeFile(errorPagePath, "<!doctype html><html><body>expired download link</body></html>");
    const created = context.app.createProject({ name: "素材下载失败测试" });
    const requested = context.app.manageAssetRequirement({
      projectId: created.snapshot.project.id,
      baseRevision: created.revision.number,
      action: "create",
      title: "失败候选",
      purpose: "验证下载错误不会污染素材库。",
      visualBrief: "测试用候选。",
      rightsRequirement: "cleared_only"
    });
    const request = requested.snapshot.assetRequests[0]!;
    const provider = new MockAssetProvider([{
      originalAssetId: "expired-link",
      name: "expired-link.mp4",
      filePath: errorPagePath,
      sourceUrl: "https://example.test/expired-link",
      durationMs: 1_000,
      rightsStatus: "cleared"
    }]);
    const searched = context.app.recordAssetSearch({
      projectId: created.snapshot.project.id,
      baseRevision: requested.revision.number,
      assetRequestId: request.id,
      provider: provider.name,
      query: "expired link",
      candidates: await provider.search({ request, query: "expired link" })
    });
    const candidate = searched.candidates[0]!;
    const acquisition = context.app.acquireAssetCandidate({
      projectId: created.snapshot.project.id,
      baseRevision: searched.state.revision.number,
      assetCandidateId: candidate.id
    });
    assert.equal(await runOneJob(context.app, createMediaJobProcessor(context.app, undefined, new AssetProviderRegistry([provider]))), true);
    const job = context.app.trackJob(acquisition.job.id);
    assert.equal(job.status, "failed");
    assert.equal((job.result?.diagnostic as { code?: string } | undefined)?.code, "ASSET_DOWNLOAD_HTML");
    const state = context.app.readProject(created.snapshot.project.id);
    assert.equal(state.snapshot.assets.length, 0);
    assert.equal(state.snapshot.assetCandidates[0]?.status, "failed");
    assert.match(state.snapshot.assetCandidates[0]?.acquisitionError ?? "", /网页错误页/u);
  } finally {
    await context.dispose();
  }
});

test("Cutaway 只接受已就绪本地视频，并把 VisualTreatment、CutawayScene 与顶层 Item 原子写入", async () => {
  const context = await createTestApplication();
  try {
    const created = context.app.createProject({ name: "Cutaway 最小闭环" });
    const presenterAssetId = addReadyAsset(context.app, created.snapshot.project.id, "presenter.mp4", "video", 1_000);
    const brollAssetId = addReadyAsset(context.app, created.snapshot.project.id, "city-walk.mp4", "video", 1_000);
    const built = context.app.buildPresenterTimeline({
      projectId: created.snapshot.project.id,
      baseRevision: context.app.readProject(created.snapshot.project.id).revision.number,
      assetIds: [presenterAssetId],
      sceneSize: 1
    });
    const hostScene = built.snapshot.scenes[0]!;
    const pending = context.app.registerImportedAsset({
      projectId: created.snapshot.project.id,
      baseRevision: built.revision.number,
      name: "not-ready.mp4",
      kind: "video",
      managedPath: "assets/source/not-ready.mp4",
      sourceHash: "not-ready-hash"
    });
    assert.throws(
      () => context.app.manageCutaway({
        projectId: created.snapshot.project.id,
        baseRevision: pending.state.revision.number,
        action: "create",
        hostSceneId: hostScene.id,
        assetId: pending.asset.id,
        mode: "fullscreen",
        fit: "cover",
        audioMode: "continue_dialogue",
        purpose: "错误示例",
        audienceTask: "验证未就绪素材被拒绝",
        sourceStartFrame: 0,
        sourceEndFrame: 12,
        startFrame: 4,
        endFrame: 16
      }),
      (error: unknown) => error instanceof DomainError && error.code === "CUTAWAY_ASSET_NOT_READY"
    );

    const treatment = context.app.manageVisualTreatment({
      projectId: created.snapshot.project.id,
      baseRevision: pending.state.revision.number,
      action: "upsert",
      sceneId: hostScene.id,
      mode: "b_roll",
      primaryAttention: "下班后的真实步行状态",
      narrativePurpose: "让个人反思落到具体生活，而不是用抽象关键词素材替代。",
      intensity: "low",
      fallbackPlan: "没有相关素材时保持人物"
    });
    const visualTreatment = treatment.snapshot.visualTreatments[0]!;
    const withCutaway = context.app.manageCutaway({
      projectId: created.snapshot.project.id,
      baseRevision: treatment.revision.number,
      action: "create",
      hostSceneId: hostScene.id,
      assetId: brollAssetId,
      visualTreatmentId: visualTreatment.id,
      title: "城市步行",
      mode: "pip",
      fit: "contain",
      pipAnchor: "top_right",
      pipScale: 0.32,
      audioMode: "continue_dialogue",
      purpose: "以现实步行镜头具体化下班后的停顿",
      audienceTask: "在不丢失人物关系的前提下看见真实生活场景",
      sourceStartFrame: 0,
      sourceEndFrame: 12,
      startFrame: 4,
      endFrame: 16
    });
    const cutaway = withCutaway.snapshot.cutaways[0]!;
    const cutawayScene = withCutaway.snapshot.scenes.find((scene) => scene.id === cutaway.cutawaySceneId)!;
    const cutawayItem = withCutaway.snapshot.timeline.items.find((item) => item.id === cutaway.timelineItemId)!;
    const topTrack = withCutaway.snapshot.timeline.tracks.find((track) => track.name === "Cutaway / Fullscreen")!;
    assert.equal(cutaway.status, "ready");
    assert.equal(cutaway.visualTreatmentId, visualTreatment.id);
    assert.equal(cutawayScene.type, "CutawayScene");
    assert.equal(cutawayItem.trackId, topTrack.id);
    assert.equal(cutawayItem.assetId, brollAssetId);
    assert.equal(cutawayItem.sceneId, cutawayScene.id);

    // 主线重编译不会留下指向旧 PresenterScene 的 VisualTreatment 或 Cutaway。
    const recompiled = context.app.compilePresenterScenes({
      projectId: created.snapshot.project.id,
      baseRevision: withCutaway.revision.number,
      scenes: [{ title: "重编后的主场景", purpose: "验证主线变化会清理旧 Cutaway", startFrame: 0, endFrame: 24 }]
    });
    assert.equal(recompiled.snapshot.cutaways.length, 0);
    assert.equal(recompiled.snapshot.visualTreatments.length, 0);
    assert.ok(recompiled.revision.impact.stale.includes(cutaway.id));
  } finally {
    await context.dispose();
  }
});

test("替换 Cutaway 素材保留主场景与 Cue，主线移动后会停用并标记 stale", async () => {
  const context = await createTestApplication();
  try {
    const created = context.app.createProject({ name: "Cutaway 替换与失效传播" });
    const presenterAssetId = addReadyAsset(context.app, created.snapshot.project.id, "presenter.mp4", "video", 1_000);
    const firstBrollId = addReadyAsset(context.app, created.snapshot.project.id, "first-broll.mp4", "video", 1_000);
    const replacementBrollId = addReadyAsset(context.app, created.snapshot.project.id, "replacement-broll.mp4", "video", 1_000);
    const built = context.app.buildPresenterTimeline({
      projectId: created.snapshot.project.id,
      baseRevision: context.app.readProject(created.snapshot.project.id).revision.number,
      assetIds: [presenterAssetId],
      sceneSize: 1
    });
    const hostScene = built.snapshot.scenes[0]!;
    const withCue = context.app.createEffectCue({
      projectId: created.snapshot.project.id,
      baseRevision: built.revision.number,
      sceneId: hostScene.id,
      type: "MetricBackdrop",
      layer: "front",
      startFrame: 0,
      endFrame: 12,
      narrativePurpose: "保持人物说出关键结论时的轻量强调",
      audienceTask: "记住当前结论"
    });
    const cueId = withCue.snapshot.effectCues[0]!.id;
    const withCutaway = context.app.manageCutaway({
      projectId: created.snapshot.project.id,
      baseRevision: withCue.revision.number,
      action: "create",
      hostSceneId: hostScene.id,
      assetId: firstBrollId,
      mode: "fullscreen",
      fit: "cover",
      audioMode: "continue_dialogue",
      purpose: "用真实环境给结论留出呼吸",
      audienceTask: "短暂进入现实环境后回到人物",
      sourceStartFrame: 0,
      sourceEndFrame: 12,
      startFrame: 4,
      endFrame: 16
    });
    const cutaway = withCutaway.snapshot.cutaways[0]!;
    const replaced = context.app.replaceSceneAsset({
      projectId: created.snapshot.project.id,
      baseRevision: withCutaway.revision.number,
      cutawayId: cutaway.id,
      assetId: replacementBrollId,
      sourceStartFrame: 4,
      sourceEndFrame: 16
    });
    const replacement = replaced.snapshot.cutaways[0]!;
    assert.equal(replacement.assetId, replacementBrollId);
    assert.equal(replacement.sourceStartFrame, 4);
    assert.equal(replaced.snapshot.scenes.find((scene) => scene.id === hostScene.id)?.id, hostScene.id);
    assert.equal(replaced.snapshot.effectCues.find((cue) => cue.id === cueId)?.id, cueId);
    assert.equal(replaced.snapshot.timeline.items.find((item) => item.id === replacement.timelineItemId)?.assetId, replacementBrollId);

    const actorItem = replaced.snapshot.timeline.items.find((item) => item.sceneId === hostScene.id)!;
    const moved = context.app.moveItem({
      projectId: created.snapshot.project.id,
      baseRevision: replaced.revision.number,
      itemId: actorItem.id,
      startFrame: 24
    });
    const staleCutaway = moved.snapshot.cutaways.find((candidate) => candidate.id === replacement.id)!;
    assert.equal(staleCutaway.status, "stale");
    assert.equal(moved.snapshot.timeline.items.find((item) => item.id === staleCutaway.timelineItemId)?.disabled, true);
    assert.ok(moved.revision.impact.stale.includes(staleCutaway.id));
    assert.ok(evaluateQuality(moved.snapshot, moved.revision.number).issues.some((issue) => issue.code === "STALE_CUTAWAY"));
  } finally {
    await context.dispose();
  }
});

test("Cutaway Runtime 对 Fullscreen/PiP 和声音策略使用同一项目事实", async () => {
  const context = await createTestApplication();
  try {
    const created = context.app.createProject({ name: "Cutaway Runtime 布局" });
    const presenterAssetId = addReadyAsset(context.app, created.snapshot.project.id, "presenter.mp4", "video", 1_000);
    const brollAssetId = addReadyAsset(context.app, created.snapshot.project.id, "broll.mp4", "video", 1_000);
    const built = context.app.buildPresenterTimeline({ projectId: created.snapshot.project.id, baseRevision: context.app.readProject(created.snapshot.project.id).revision.number, assetIds: [presenterAssetId], sceneSize: 1 });
    const hostScene = built.snapshot.scenes[0]!;
    const state = context.app.manageCutaway({
      projectId: created.snapshot.project.id,
      baseRevision: built.revision.number,
      action: "create",
      hostSceneId: hostScene.id,
      assetId: brollAssetId,
      mode: "pip",
      fit: "contain",
      pipAnchor: "top_right",
      pipScale: 0.32,
      audioMode: "continue_dialogue",
      purpose: "辅助例子",
      audienceTask: "保留人物说话时看见例子",
      sourceStartFrame: 0,
      sourceEndFrame: 12,
      startFrame: 4,
      endFrame: 16
    });
    const cutaway = state.snapshot.cutaways[0]!;
    const item = state.snapshot.timeline.items.find((candidate) => candidate.id === cutaway.timelineItemId)!;
    const track = state.snapshot.timeline.tracks.find((candidate) => candidate.id === item.trackId)!;
    const pip = compileCutawayLayout(cutaway, 16 / 9);
    assert.equal(pip.container.position, "absolute");
    assert.equal(pip.container.right, "5%");
    assert.equal(pip.container.top, "8%");
    assert.equal(pip.container.width, "32%");
    assert.equal(pip.media.objectFit, "contain");
    assert.equal(cutawaySourceVolume(cutaway, item, track), 0);

    const fullscreen = compileCutawayLayout({ ...cutaway, mode: "fullscreen", fit: "cover", audioMode: "include_source_audio" }, 16 / 9);
    assert.equal(fullscreen.container.inset, 0);
    assert.equal(fullscreen.media.objectFit, "cover");
    assert.equal(cutawaySourceVolume({ ...cutaway, audioMode: "include_source_audio" }, item, track), 1);
  } finally {
    await context.dispose();
  }
});

test("StoryBeat 保持稳定 ID，移动 Item 会重算关联 Scene 与 Cue", async () => {
  const context = await createTestApplication();
  try {
    const created = context.app.createProject({ name: "项目图一致性测试" });
    const videoAssetId = addReadyAsset(context.app, created.snapshot.project.id, "presenter.mp4", "video", 1_000);
    const audioAssetId = addReadyAsset(context.app, created.snapshot.project.id, "script.wav", "audio", 1_000);
    context.app.applyTranscript({ projectId: created.snapshot.project.id, assetId: audioAssetId, text: "先说明原因。", source: "manual" });
    const semantic = applySemanticUnitsFromCandidates(context.app, created.snapshot.project.id);
    const semanticUnitId = semantic.snapshot.semanticUnits[0]!.id;
    const story = context.app.updateStory({
      projectId: created.snapshot.project.id,
      baseRevision: semantic.revision.number,
      beats: [{ title: "提出原因", purpose: "建立前提", semanticUnitIds: [semanticUnitId] }]
    });
    const beatId = story.snapshot.story.beats[0]!.id;
    const updatedStory = context.app.updateStory({
      projectId: created.snapshot.project.id,
      baseRevision: story.revision.number,
      beats: [{ id: beatId, title: "解释原因", purpose: "建立前提", semanticUnitIds: [semanticUnitId] }]
    });
    assert.equal(updatedStory.snapshot.story.beats[0]!.id, beatId);
    const assembled = context.app.assemblePresenterTrack({ projectId: created.snapshot.project.id, baseRevision: updatedStory.revision.number, assetIds: [videoAssetId] });
    const compiled = context.app.compilePresenterScenes({
      projectId: created.snapshot.project.id,
      baseRevision: assembled.revision.number,
      scenes: [{ title: "原因", purpose: "让观众理解前提", startFrame: 0, endFrame: 24, narrativeBeatIds: [beatId] }]
    });
    const scene = compiled.snapshot.scenes[0]!;
    const cue = context.app.createEffectCue({ projectId: created.snapshot.project.id, baseRevision: compiled.revision.number, sceneId: scene.id, type: "MetricBackdrop", layer: "rear", startFrame: 0, endFrame: 12 });
    const itemId = cue.snapshot.timeline.items.find((item) => item.sceneId === scene.id)!.id;
    const moved = context.app.moveItem({ projectId: created.snapshot.project.id, baseRevision: cue.revision.number, itemId, startFrame: 24 });
    const movedScene = moved.snapshot.scenes.find((candidate) => candidate.id === scene.id)!;
    const movedCue = moved.snapshot.effectCues[0]!;
    assert.equal(movedScene.startFrame, 24);
    assert.equal(movedCue.startFrame, 24);
    assert.equal(movedCue.status, "ready");
  } finally {
    await context.dispose();
  }
});

test("MotionLayoutCompiler 将空间锚点、运动预设、风格包和强度落为可渲染参数", async () => {
  const context = await createTestApplication();
  try {
    const created = context.app.createProject({ name: "动效布局编译测试" });
    const videoAssetId = addReadyAsset(context.app, created.snapshot.project.id, "presenter.mp4", "video", 2_000);
    const assembled = context.app.buildPresenterTimeline({ projectId: created.snapshot.project.id, baseRevision: context.app.readProject(created.snapshot.project.id).revision.number, assetIds: [videoAssetId], sceneSize: 1 });
    const scene = assembled.snapshot.scenes[0]!;
    const withCue = context.app.createEffectCue({
      projectId: created.snapshot.project.id,
      baseRevision: assembled.revision.number,
      sceneId: scene.id,
      type: "EvidenceCard",
      layer: "front",
      startFrame: 8,
      endFrame: 36,
      spatialAnchor: "top_left",
      stylePackId: "warm-editorial",
      motion: { enterPreset: "slide_left", settlePreset: "pulse", exitPreset: "scale", enterFrames: 10, exitFrames: 8 }
    });
    const cue = withCue.snapshot.effectCues[0]!;
    const initial = compileMotionLayout(cue, cue.startFrame);
    const settled = compileMotionLayout(cue, cue.startFrame + 12);
    const intense = compileMotionLayout({ ...cue, intensity: 1, spatialAnchor: "bottom_right", stylePackId: "evidence-paper" }, cue.startFrame + 3);
    assert.equal(initial.container.left, "5%");
    assert.equal(initial.container.top, "8%");
    assert.notEqual(initial.motion.transform, settled.motion.transform, "进入预设必须实际改变运动路径");
    assert.equal(intense.container.right, "5%");
    assert.equal(intense.container.bottom, "20%");
    assert.notEqual(intense.motion.transform, compileMotionLayout({ ...cue, intensity: 0 }, cue.startFrame + 3).motion.transform, "强度必须改变运动距离、速度或缩放");
    assert.equal(initial.stylePack.id, "warm-editorial");
    assert.equal(intense.stylePack.id, "evidence-paper");
    assert.notEqual(initial.stylePack.fontFamily, intense.stylePack.fontFamily, "stylePackId 必须改变实际视觉参数");
  } finally {
    await context.dispose();
  }
});

test("CameraPunch 由 MotionLayoutCompiler 消费进入、退出预设和安全取景重心", async () => {
  const context = await createTestApplication();
  try {
    const created = context.app.createProject({ name: "人物推近编译测试" });
    const videoAssetId = addReadyAsset(context.app, created.snapshot.project.id, "presenter.mp4", "video", 2_000);
    const assembled = context.app.buildPresenterTimeline({ projectId: created.snapshot.project.id, baseRevision: context.app.readProject(created.snapshot.project.id).revision.number, assetIds: [videoAssetId], sceneSize: 1 });
    const scene = assembled.snapshot.scenes[0]!;
    const withCue = context.app.createEffectCue({
      projectId: created.snapshot.project.id,
      baseRevision: assembled.revision.number,
      sceneId: scene.id,
      type: "CameraPunch",
      layer: "actor",
      startFrame: 4,
      endFrame: 28,
      spatialAnchor: "top_left",
      motion: { enterPreset: "scale", settlePreset: "hold", exitPreset: "scale", enterFrames: 10, exitFrames: 8 }
    });
    const cue = withCue.snapshot.effectCues[0]!;
    const entering = compileCameraPunchLayout(cue, cue.startFrame + 3);
    const settled = compileCameraPunchLayout(cue, cue.startFrame + cue.motion.enterFrames + 2);
    const exiting = compileCameraPunchLayout(cue, cue.endFrame - 2);
    const popped = compileCameraPunchLayout({ ...cue, motion: { ...cue.motion, enterPreset: "pop" } }, cue.startFrame + 8);
    assert.equal(entering.transformOrigin, "28% 26%");
    assert.ok(entering.scale > 1 && entering.scale < settled.scale, "scale 预设必须逐步推近");
    assert.ok(exiting.scale < settled.scale && exiting.scale > 1, "退出预设必须自然回位");
    assert.ok(popped.scale > compileCameraPunchLayout(cue, cue.startFrame + 8).scale, "pop 预设必须改变实际推近曲线");
  } finally {
    await context.dispose();
  }
});

test("EffectCue qualityRules 会进入质量门禁，旧自由文本不会被静默当作已执行", async () => {
  const context = await createTestApplication();
  try {
    const created = context.app.createProject({ name: "Cue 质量规则执行测试" });
    const videoAssetId = addReadyAsset(context.app, created.snapshot.project.id, "presenter.mp4", "video", 3_000);
    const assembled = context.app.buildPresenterTimeline({
      projectId: created.snapshot.project.id,
      baseRevision: context.app.readProject(created.snapshot.project.id).revision.number,
      assetIds: [videoAssetId],
      sceneSize: 1
    });
    const scene = assembled.snapshot.scenes[0]!;
    const first = context.app.createEffectCue({
      projectId: created.snapshot.project.id,
      baseRevision: assembled.revision.number,
      sceneId: scene.id,
      type: "MetricBackdrop",
      layer: "front",
      startFrame: 0,
      endFrame: 12,
      spatialAnchor: "full_frame",
      semanticAnchor: { type: "absolute", relation: "land_on" },
      motion: { enterFrames: 6, exitFrames: 6 },
      qualityRules: ["semantic_anchor_required", "settled_frame_required", "caption_safe_area", "no_competing_visual", "旧项目的自由文本规则"]
    });
    const second = context.app.createEffectCue({
      projectId: created.snapshot.project.id,
      baseRevision: first.revision.number,
      sceneId: scene.id,
      type: "GlowCTA",
      layer: "front",
      startFrame: 2,
      endFrame: 10,
      qualityRules: ["no_competing_visual"]
    });
    const third = context.app.createEffectCue({
      projectId: created.snapshot.project.id,
      baseRevision: second.revision.number,
      sceneId: scene.id,
      type: "ProductFan",
      layer: "front",
      startFrame: 14,
      endFrame: 36,
      qualityRules: ["asset_binding_required"]
    });
    const fourth = context.app.createEffectCue({
      projectId: created.snapshot.project.id,
      baseRevision: third.revision.number,
      sceneId: scene.id,
      type: "MetricBackdrop",
      layer: "rear",
      startFrame: 38,
      endFrame: 60,
      qualityRules: ["actor_mask_required"]
    });
    const quality = evaluateQuality(fourth.snapshot, fourth.revision.number);
    const codes = new Set(quality.issues.map((entry) => entry.code));
    assert.ok(codes.has("EFFECT_SEMANTIC_ANCHOR_REQUIRED"));
    assert.ok(codes.has("EFFECT_RULE_SETTLED_FRAME_REQUIRED"));
    assert.ok(codes.has("EFFECT_RULE_CAPTION_SAFE_AREA"));
    assert.ok(codes.has("EFFECT_RULE_COMPETING_VISUAL"));
    assert.ok(codes.has("EFFECT_RULE_ASSET_BINDING_REQUIRED"));
    assert.ok(codes.has("EFFECT_RULE_ACTOR_MASK_REQUIRED"));
    assert.ok(codes.has("EFFECT_QUALITY_RULE_UNSUPPORTED"));
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
    const sourcePath = await createDeterministicVideoFixture(workspaceRoot);
    const importedResponse = await server.inject({
      method: "POST",
      url: `/api/projects/${projectId}/assets/import-path`,
      payload: { baseRevision: created.revision.number, filePath: sourcePath }
    });
    assert.equal(importedResponse.statusCode, 200);
    assert.equal(await runOneJob(application), true);
    const imported = application.readProject(projectId);
    const readyAsset = imported.snapshot.assets[0];
    assert.equal(readyAsset?.status, "ready", readyAsset?.failureReason ?? "媒体分析未返回失败原因");

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

test("项目级 Codex 配置校验真实 Skill 合同，而不是旧 Markdown 标题", async () => {
  const configPath = join(process.cwd(), ".codex", "config.toml");
  const config = await readFile(configPath, "utf8");
  assert.match(config, /\[mcp_servers\."video-editor-mcp"\]/u);
  assert.match(config, /args = \["run", "mcp"\]/u);
  assert.doesNotMatch(config, /^cwd\s*=/mu, "项目配置不能绑定个人电脑绝对工作目录");
  const enabledSkillNames = [...config.matchAll(/path = "\.\.\/\.agents\/skills\/([^"\r\n]+)"/gu)].map((match) => match[1]!);
  for (const skillName of [
    "project-basics",
    "web-editor-operator",
    "production-director",
    "asset-import",
    "visual-asset-sourcing",
    "transcription",
    "voice-production",
    "presenter-motion-director",
    "avatar-performance",
    "visual-explainer-director",
    "evidence-visualization",
    "vlog-director",
    "captions",
    "quality-verification",
    "export",
    "known-errors",
    "audio-finishing"
  ]) {
    assert.ok(enabledSkillNames.includes(skillName), `缺少启用 Skill：${skillName}`);
  }
  for (const skillName of enabledSkillNames) {
    const skillPath = join(process.cwd(), ".agents", "skills", skillName, "SKILL.md");
    const skill = await readFile(skillPath, "utf8");
    const frontMatter = /^---\r?\n([\s\S]*?)\r?\n---/u.exec(skill);
    assert.ok(frontMatter, `${skillName} 缺少 YAML Front Matter`);
    assert.match(frontMatter![1], new RegExp(`^name:\\s*${skillName.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}\\s*$`, "mu"), `${skillName} 的 name 必须与目录一致`);
    assert.match(frontMatter![1], /^description:\s*\S+/mu, `${skillName} 缺少 description`);
    assert.match(skill, /##\s+(退出条件|验证与退出|停止条件|最终检查|完成标准|交接合同|交接)/u, `${skillName} 缺少退出或交接条件`);
    assert.ok(skill.length >= 1_000, `${skillName} 应保留足够的专业方法与案例，而不是退回短标题索引`);
    const references = [...skill.matchAll(/\]\(([^)]+\.md)\)/gu)].map((match) => match[1]!);
    for (const reference of references) {
      if (/^[a-z]+:\/\//iu.test(reference)) continue;
      await access(resolve(dirname(skillPath), reference));
    }
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
      "apply_manual_transcript",
      "apply_script",
      "manage_voice_references",
      "submit_voice_synthesis",
      "apply_semantic_units",
      "update_asset_metadata",
      "manage_asset_requirements",
      "search_media_candidates",
      "inspect_media_candidate",
      "acquire_media_asset",
      "read_asset_provenance",
      "assemble_presenter_track",
      "compile_presenter_scenes",
      "create_presenter_timeline",
      "manage_actor_performance",
      "manage_visual_treatment",
      "manage_cutaways",
      "replace_scene_asset",
      "manage_effect_cues",
      "start_production_run",
      "record_creative_decision",
      "record_editorial_quality_review",
      "complete_production_run",
      "read_skill_execution_report",
      "validate_project_graph",
      "inspect_composed_frames",
      "align_presenter_to_speech",
      "render_preview_range",
      "submit_export"
    ]) {
      assert.ok(toolNames.has(name), `MCP 缺少 ${name}`);
    }

    const created = JSON.parse(textFromToolResult(await client.callTool({ name: "create_project", arguments: { name: "MCP 合同测试" } }))) as { revision: { number: number }; snapshot: { project: { id: string } } };
    const projectId = created.snapshot.project.id;
    const targeted = JSON.parse(textFromToolResult(await client.callTool({ name: "target_project", arguments: { project_id: projectId } }))) as { projectId: string };
    assert.equal(targeted.projectId, projectId);
    const requested = JSON.parse(textFromToolResult(await client.callTool({ name: "manage_asset_requirements", arguments: {
      base_revision_id: created.revision.number,
      action: "create",
      title: "城市步行 B-roll",
      purpose: "为当前人物口播留下现实生活呼吸。",
      visual_brief: "傍晚城市中景人物慢步行，竖屏上方有字幕留白。",
      query_hints: ["city", "walking", "dusk"]
    } }))) as { revision: { number: number }; snapshot: { assetRequests: Array<{ title: string; status: string }> } };
    assert.equal(requested.revision.number, created.revision.number + 1);
    assert.equal(requested.snapshot.assetRequests[0]?.title, "城市步行 B-roll");
    assert.equal(requested.snapshot.assetRequests[0]?.status, "open");
    const editor = JSON.parse(textFromToolResult(await client.callTool({ name: "get_editor_url", arguments: { project_id: projectId, frame: 0 } }))) as { editorUrl: string };
    assert.match(editor.editorUrl, new RegExp(`projectId=${projectId}`, "u"));
    assert.match(editor.editorUrl, /frame=0/u);
  } finally {
    await transport.close().catch(() => undefined);
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});
