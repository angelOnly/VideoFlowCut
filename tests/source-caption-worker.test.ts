import assert from "node:assert/strict";
import { copyFile, mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { ComfyUIBridgeClient, FUNASR_SOURCE_TOKEN_ALIGNMENT_WORKFLOW_ID, FUNASR_WORKFLOW_ID } from "@videocut/bridge";
import { createApplication } from "@videocut/application";
import { assertProjectGraphValid } from "@videocut/domain";
import { probeMedia, runProcess } from "@videocut/speech";
import { createMediaJobProcessor, runOneJob } from "../apps/job-worker/src/index.js";

async function createArollFixture(directory: string): Promise<string> {
  const path = join(directory, "source-audio-captions.mp4");
  await runProcess("ffmpeg", [
    "-y",
    "-f", "lavfi", "-i", "color=c=0x264653:s=64x64:r=24:d=1.35",
    "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=48000:duration=0.45",
    "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono:d=0.45",
    "-f", "lavfi", "-i", "sine=frequency=660:sample_rate=48000:duration=0.45",
    "-filter_complex", "[1:a][2:a][3:a]concat=n=3:v=0:a=1[a]",
    "-map", "0:v:0", "-map", "[a]", "-shortest",
    "-c:v", "mpeg4", "-q:v", "5", "-c:a", "aac", "-movflags", "+faststart", path
  ]);
  return path;
}

function workflowResponse() {
  return {
    id: FUNASR_WORKFLOW_ID,
    name: "FunASR",
    available: true,
    schemaVersion: "funasr-v1",
    fields: [],
    itemSlots: [{ id: "audio", label: "Audio", kind: "audio", required: true }],
    outputs: [{ id: "text", label: "Text", kind: "text" }]
  };
}

function sourceTokenAlignmentWorkflowResponse(outputs = [
  { id: "transcript-text", label: "全文", kind: "text" },
  { id: "token-alignment-json", label: "Token 时间", kind: "text" }
]) {
  return {
    id: FUNASR_SOURCE_TOKEN_ALIGNMENT_WORKFLOW_ID,
    name: "FunASR 原声 Token 对齐",
    available: true,
    schemaVersion: "funasr-source-token-alignment-v3",
    fields: [],
    itemSlots: [{ id: "source-audio", label: "原声音频", kind: "audio", required: true }],
    outputs
  };
}

const sourceCaptionTranscript = "今天我们一起看如何把视频剪得更精彩。";

function sourceTokenAlignmentOutput() {
  return {
    version: 3,
    precision: "provider_token_timed",
    // v3 只采集同源 token 时间；任何自动标点都不能进入字幕决策链路。
    sentenceCandidateMode: "none",
    tokens: [
      { text: "今天", startMs: 0, endMs: 120 },
      { text: "我们", startMs: 120, endMs: 220 },
      { text: "一起", startMs: 220, endMs: 340 },
      { text: "看", startMs: 340, endMs: 400 },
      { text: "如何", startMs: 430, endMs: 540 },
      { text: "把", startMs: 540, endMs: 600 },
      { text: "视频", startMs: 600, endMs: 720 },
      { text: "剪得", startMs: 720, endMs: 850 },
      { text: "更精彩。", startMs: 850, endMs: 1_000 }
    ],
    sentences: []
  };
}

async function prepareSourceTokenAlignmentFixture(root: string) {
  const app = createApplication(root);
  const sourceFile = await createArollFixture(root);
  const created = app.createProject({ name: "原声 Token 字幕 Worker 测试", profile: "presenter_motion" });
  const projectId = created.snapshot.project.id;
  const imported = app.registerImportedAsset({
    projectId,
    baseRevision: created.revision.number,
    name: "presenter.mp4",
    kind: "video",
    managedPath: "assets/source/presenter.mp4",
    sourceHash: "source-caption-sentence-fixture",
    provenance: { source: "local_import", rightsStatus: "cleared", acquiredAt: new Date().toISOString() }
  });
  const targetPath = join(app.readProject(projectId).snapshot.project.rootPath, imported.asset.managedPath);
  await mkdir(dirname(targetPath), { recursive: true });
  await copyFile(sourceFile, targetPath);
  app.applyMediaAnalysis({ projectId, assetId: imported.asset.id, metadata: await probeMedia(targetPath) });
  for (const seedJob of app.listJobs(projectId)) {
    if (seedJob.kind === "media_analysis" && seedJob.status === "queued") app.updateJob(seedJob.id, { status: "succeeded" });
  }
  const assembled = app.buildPresenterTimeline({ projectId, baseRevision: app.readProject(projectId).revision.number, assetIds: [imported.asset.id] });
  const actorItem = assembled.snapshot.timeline.items.find((item) => item.trackId === assembled.snapshot.timeline.tracks.find((track) => track.name === "Actor / A-roll")?.id);
  assert.ok(actorItem, "Presenter 时间线应包含 A-roll Item");
  const performed = app.registerActorPerformance({
    projectId,
    baseRevision: assembled.revision.number,
    timelineItemId: actorItem.id,
    source: "imported",
    maskMode: "none",
    audioMode: "use_source_audio"
  });
  return { app, projectId, actorItem, assetId: imported.asset.id, revision: performed.revision.number };
}

function completeSourceTokenAlignment(fixture: Awaited<ReturnType<typeof prepareSourceTokenAlignmentFixture>>, runId = "source-token-alignment-direct") {
  const state = fixture.app.readProject(fixture.projectId);
  const completedAt = new Date().toISOString();
  const evidence = sourceTokenAlignmentOutput();
  return fixture.app.completeSourceAudioTokenAlignment({
    projectId: fixture.projectId,
    requestedRevision: state.revision.number,
    assetId: fixture.assetId,
    timelineItemId: fixture.actorItem.id,
    sourceStartFrame: fixture.actorItem.sourceStartFrame,
    sourceEndFrame: fixture.actorItem.sourceEndFrame,
    timelineStartFrame: fixture.actorItem.startFrame,
    timelineEndFrame: fixture.actorItem.endFrame,
    transcriptText: sourceCaptionTranscript,
    bridgeAudit: {
      workflowId: FUNASR_SOURCE_TOKEN_ALIGNMENT_WORKFLOW_ID,
      runId,
      schemaVersion: "funasr-source-token-alignment-v3",
      schemaRetryCount: 0,
      submittedAt: completedAt,
      completedAt,
      request: { fieldValues: {}, fileSlots: [], metadata: { sourceCaptionKind: "token_alignment" } }
    },
    tokens: evidence.tokens,
    sentences: evidence.sentences,
    sentenceCandidateMode: "none"
  });
}

test("原声 A-roll 字幕以静音边界分块、可恢复既有 Run，且不重提外部任务", async () => {
  const root = await mkdtemp(join(tmpdir(), "videocut-source-caption-"));
  const app = createApplication(root);
  const originalFetch = globalThis.fetch;
  let creates = 0;
  let reads = 0;
  try {
    const sourceFile = await createArollFixture(root);
    const created = app.createProject({ name: "原声字幕 Worker 测试", profile: "presenter_motion" });
    const projectId = created.snapshot.project.id;
    const imported = app.registerImportedAsset({
      projectId,
      baseRevision: created.revision.number,
      name: "presenter.mp4",
      kind: "video",
      managedPath: "assets/source/presenter.mp4",
      sourceHash: "source-caption-fixture",
      provenance: { source: "local_import", rightsStatus: "cleared", acquiredAt: new Date().toISOString() }
    });
    const targetPath = join(app.readProject(projectId).snapshot.project.rootPath, imported.asset.managedPath);
    await mkdir(dirname(targetPath), { recursive: true });
    await copyFile(sourceFile, targetPath);
    app.applyMediaAnalysis({ projectId, assetId: imported.asset.id, metadata: await probeMedia(targetPath) });
    for (const seedJob of app.listJobs(projectId)) {
      if (seedJob.kind === "media_analysis" && seedJob.status === "queued") app.updateJob(seedJob.id, { status: "succeeded" });
    }
    const assembled = app.buildPresenterTimeline({
      projectId,
      baseRevision: app.readProject(projectId).revision.number,
      assetIds: [imported.asset.id]
    });
    const actorItem = assembled.snapshot.timeline.items.find((item) => item.trackId === assembled.snapshot.timeline.tracks.find((track) => track.name === "Actor / A-roll")?.id);
    assert.ok(actorItem, "Presenter 时间线应包含 A-roll Item");
    const performed = app.registerActorPerformance({
      projectId,
      baseRevision: assembled.revision.number,
      timelineItemId: actorItem.id,
      source: "imported",
      maskMode: "none",
      audioMode: "use_source_audio"
    });
    const sourceJob = app.submitSourceAudioCaptions({
      projectId,
      baseRevision: performed.revision.number,
      timelineItemId: actorItem.id
    });

    globalThis.fetch = async (input, init) => {
      const url = String(input);
      if (url.endsWith("/health")) {
        return new Response(JSON.stringify({ status: "ready", queueModes: ["normal", "foreground"] }), { headers: { "content-type": "application/json" } });
      }
      if (url.endsWith(`/workflows/${FUNASR_WORKFLOW_ID}`)) {
        return new Response(JSON.stringify(workflowResponse()), { headers: { "content-type": "application/json" } });
      }
      if (url.endsWith(`/workflows/${FUNASR_WORKFLOW_ID}/runs`)) {
        assert.equal(init?.method, "POST");
        assert.ok(init?.body instanceof FormData, "原声字幕必须通过 Bridge multipart 合同提交");
        const request = JSON.parse(String((init.body as FormData).get("request")));
        assert.equal(request.queueMode, "foreground", "原声字幕必须进入前置队列，不能被长视频生成饿死");
        creates += 1;
        return new Response(JSON.stringify({ id: `source-caption-run-${creates}`, status: "queued", outputs: [] }), { headers: { "content-type": "application/json" } });
      }
      const run = /\/runs\/(source-caption-run-\d+)$/u.exec(url)?.[1];
      if (run) {
        reads += 1;
        const text = run.endsWith("-1") ? "第一段原声。" : "第二段原声。";
        return new Response(JSON.stringify({
          id: run,
          status: "succeeded",
          outputs: [{ outputSlotId: "text", displayName: "转写文本", kind: "text", text }]
        }), { headers: { "content-type": "application/json" } });
      }
      throw new Error(`未预期的 Bridge 请求：${url}`);
    };

    const bridge = new ComfyUIBridgeClient("http://bridge.test/comfyui-bridge/v1");
    assert.equal(await runOneJob(app, createMediaJobProcessor(app, bridge)), true);
    const completed = app.trackJob(sourceJob.id);
    assert.equal(completed.status, "succeeded");
    assert.equal(creates, 2, "每个真实静音边界分块只提交一个 FunASR Run");
    const snapshot = app.readProject(projectId).snapshot;
    const captions = snapshot.timeline.captions.filter((caption) => caption.sourceKind === "source_audio");
    assert.equal(captions.length, 2);
    assert.ok(captions.every((caption) => caption.sourceTimelineItemId === actorItem.id && caption.precision === "chunk_coarse"));
    assert.equal(snapshot.transcripts.length, 0, "原声分块字幕不能伪装成完整转写或改写 Script");
    const audits = completed.result?.bridgeRuns as Array<{ runId?: string; request?: { metadata?: Record<string, unknown> } }>;
    assert.equal(audits.length, 2);
    assert.ok(audits.every((audit) => audit.request?.metadata?.sourceCaptionKind === "chunk"));

    // 原声字幕允许独立修正屏幕文案，并可一次性应用低调半透明底；两种操作都不改源音频或粗粒度时序。
    const editedSingle = app.editCaptions({
      projectId,
      baseRevision: app.readProject(projectId).revision.number,
      captionId: captions[0]!.id,
      action: "update",
      text: "第一段\n原声",
      format: { backgroundColor: "#101820", backgroundOpacity: 0.68 }
    });
    const batchStyled = app.editCaptions({
      projectId,
      baseRevision: editedSingle.revision.number,
      captionIds: captions.map((caption) => caption.id),
      action: "bulk_source_format",
      format: { fontSize: 34, backgroundColor: "#101820", backgroundOpacity: 0.68, bottomPercent: 9 }
    });
    const styledCaptions = batchStyled.snapshot.timeline.captions.filter((caption) => caption.sourceKind === "source_audio");
    assert.equal(styledCaptions.find((caption) => caption.id === captions[0]!.id)?.text, "第一段\n原声");
    assert.equal(styledCaptions.find((caption) => caption.id === captions[0]!.id)?.sourceText, "第一段原声。");
    assert.ok(styledCaptions.every((caption) => caption.format?.fontSize === 34 && caption.format.backgroundOpacity === 0.68));
    assert.ok(styledCaptions.every((caption) => caption.precision === "chunk_coarse"), "批量样式不能升级或伪造原声字幕精度");
    assert.throws(
      () => app.editCaptions({
        projectId,
        baseRevision: batchStyled.revision.number,
        captionIds: [captions[0]!.id, captions[0]!.id],
        action: "bulk_source_format",
        format: { backgroundColor: "#101820" }
      }),
      (error: unknown) => (error as { code?: string }).code === "DUPLICATE_SOURCE_CAPTION_ID"
    );

    // 模拟字幕 Revision 已写入、但 Job 成功回执丢失：重试只能 GET 已有 run_id，不能再次 POST。
    app.updateJob(sourceJob.id, { status: "failed", error: "模拟回执中断" });
    const retry = app.repository.createJob({
      projectId,
      kind: "source_caption_generation",
      payload: { ...sourceJob.payload, retryOfJobId: sourceJob.id },
      idempotencyKey: "source-caption-retry"
    });
    const createsBeforeRetry = creates;
    assert.equal(await runOneJob(app, createMediaJobProcessor(app, bridge)), true);
    assert.equal(app.trackJob(retry.id).status, "succeeded");
    assert.equal(creates, createsBeforeRetry, "已有分块 run_id 的恢复绝不能再次 POST FunASR Run");
    assert.ok(reads >= 4, "恢复过程应重新读取已有 Run，而不是猜测其结果");
    assert.equal(app.readProject(projectId).snapshot.timeline.captions.filter((caption) => caption.sourceKind === "source_audio").length, 2, "恢复不能重复写入字幕卡");
  } finally {
    globalThis.fetch = originalFetch;
    app.close();
    await rm(root, { recursive: true, force: true });
  }
});

test("连续讲话超过字幕可读上限时明确失败，不按字符或均分时长伪切", async () => {
  const root = await mkdtemp(join(tmpdir(), "videocut-source-caption-long-"));
  const app = createApplication(root);
  try {
    const sourceFile = join(root, "continuous.mp4");
    await runProcess("ffmpeg", [
      "-y",
      "-f", "lavfi", "-i", "color=c=0x264653:s=64x64:r=24:d=12.3",
      "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=48000:duration=12.3",
      "-map", "0:v:0", "-map", "1:a:0", "-shortest",
      "-c:v", "mpeg4", "-q:v", "5", "-c:a", "aac", sourceFile
    ]);
    const created = app.createProject({ name: "连续讲话字幕保护", profile: "presenter_motion" });
    const projectId = created.snapshot.project.id;
    const imported = app.registerImportedAsset({
      projectId,
      baseRevision: created.revision.number,
      name: "continuous.mp4",
      kind: "video",
      managedPath: "assets/source/continuous.mp4",
      sourceHash: "continuous-source-caption-fixture",
      provenance: { source: "local_import", rightsStatus: "cleared", acquiredAt: new Date().toISOString() }
    });
    const targetPath = join(app.readProject(projectId).snapshot.project.rootPath, imported.asset.managedPath);
    await mkdir(dirname(targetPath), { recursive: true });
    await copyFile(sourceFile, targetPath);
    app.applyMediaAnalysis({ projectId, assetId: imported.asset.id, metadata: await probeMedia(targetPath) });
    for (const seedJob of app.listJobs(projectId)) {
      if (seedJob.kind === "media_analysis" && seedJob.status === "queued") app.updateJob(seedJob.id, { status: "succeeded" });
    }
    const assembled = app.buildPresenterTimeline({ projectId, baseRevision: app.readProject(projectId).revision.number, assetIds: [imported.asset.id] });
    const actorItem = assembled.snapshot.timeline.items.find((item) => item.trackId === assembled.snapshot.timeline.tracks.find((track) => track.name === "Actor / A-roll")?.id);
    assert.ok(actorItem);
    const performed = app.registerActorPerformance({
      projectId,
      baseRevision: assembled.revision.number,
      timelineItemId: actorItem.id,
      source: "imported",
      maskMode: "none",
      audioMode: "use_source_audio"
    });
    const job = app.submitSourceAudioCaptions({ projectId, baseRevision: performed.revision.number, timelineItemId: actorItem.id });
    assert.equal(await runOneJob(app, createMediaJobProcessor(app)), true);
    const failed = app.trackJob(job.id);
    assert.equal(failed.status, "failed");
    assert.equal((failed.result?.diagnostic as { code?: string } | undefined)?.code, "SOURCE_CAPTION_CONTINUOUS_SPEECH_TOO_LONG");
    assert.equal(app.readProject(projectId).snapshot.timeline.captions.length, 0);
  } finally {
    app.close();
    await rm(root, { recursive: true, force: true });
  }
});

test("原声 token 对齐只接受 v3 原始 token 输出、只保存证据且可恢复既有 Run", async () => {
  const root = await mkdtemp(join(tmpdir(), "videocut-source-caption-token-"));
  const originalFetch = globalThis.fetch;
  const fixture = await prepareSourceTokenAlignmentFixture(root);
  let creates = 0;
  let reads = 0;
  try {
    const job = fixture.app.submitSourceAudioSentenceAlignment({
      projectId: fixture.projectId,
      baseRevision: fixture.revision,
      timelineItemId: fixture.actorItem.id
    });
    globalThis.fetch = async (input, init) => {
      const url = String(input);
      if (url.endsWith("/health")) {
        return new Response(JSON.stringify({ status: "ready", queueModes: ["normal", "foreground"] }), { headers: { "content-type": "application/json" } });
      }
      if (url.endsWith(`/workflows/${FUNASR_SOURCE_TOKEN_ALIGNMENT_WORKFLOW_ID}`)) {
        return new Response(JSON.stringify(sourceTokenAlignmentWorkflowResponse()), { headers: { "content-type": "application/json" } });
      }
      if (url.endsWith(`/workflows/${FUNASR_SOURCE_TOKEN_ALIGNMENT_WORKFLOW_ID}/runs`)) {
        assert.equal(init?.method, "POST");
        assert.ok(init?.body instanceof FormData);
        const request = JSON.parse(String((init.body as FormData).get("request")));
        assert.equal(request.queueMode, "foreground");
        creates += 1;
        return new Response(JSON.stringify({ id: `source-token-alignment-run-${creates}`, status: "queued", outputs: [] }), { headers: { "content-type": "application/json" } });
      }
      const run = /\/runs\/(source-token-alignment-run-\d+)$/u.exec(url)?.[1];
      if (run) {
        reads += 1;
        return new Response(JSON.stringify({
          id: run,
          status: "succeeded",
          outputs: [
            { outputSlotId: "transcript-text", displayName: "全文", kind: "text", text: sourceCaptionTranscript },
            { outputSlotId: "token-alignment-json", displayName: "Token 时间", kind: "text", text: JSON.stringify(sourceTokenAlignmentOutput()) }
          ]
        }), { headers: { "content-type": "application/json" } });
      }
      throw new Error(`未预期的 Bridge 请求：${url}`);
    };

    const bridge = new ComfyUIBridgeClient("http://bridge.test/comfyui-bridge/v1");
    assert.equal(await runOneJob(fixture.app, createMediaJobProcessor(fixture.app, bridge)), true);
    assert.equal(fixture.app.trackJob(job.id).status, "succeeded");
    assert.equal(creates, 1, "整段 A-roll 只能创建一个 token 对齐 Run");
    const snapshot = fixture.app.readProject(fixture.projectId).snapshot;
    const captions = snapshot.timeline.captions.filter((caption) => caption.sourceKind === "source_audio");
    const alignment = snapshot.sourceAudioAlignments.find((candidate) => candidate.sourceTimelineItemId === fixture.actorItem.id);
    assert.equal(captions.length, 0, "FunASR token 时间证据不能直接成为视觉 CaptionCard");
    assert.ok(alignment, "必须持久化同源 token 时间证据");
    assert.equal(alignment.tokens.length, sourceTokenAlignmentOutput().tokens.length);
    assert.equal(alignment.sentenceCandidateMode, "none", "v3 不允许 Provider 自动标点候选进入对齐证据");
    assert.equal(alignment.sentences.length, 0, "v3 只保存原始 token，字幕分卡必须由剪辑任务的语义 Program 决定");
    assert.equal(snapshot.sourceCaptionPrograms.length, 0, "没有语义 Program 时不得伪造已完成的字幕决策");
    assert.doesNotThrow(() => assertProjectGraphValid(snapshot));

    // 模拟 Project 已成功保存对齐证据、但 Worker 成功回执丢失：重试只能读取原 Run，不能二次 POST。
    fixture.app.updateJob(job.id, { status: "failed", error: "模拟成功回执丢失" });
    const retry = fixture.app.repository.createJob({
      projectId: fixture.projectId,
      kind: "source_caption_sentence_alignment",
      payload: { ...job.payload, retryOfJobId: job.id },
      idempotencyKey: "source-caption-token-retry"
    });
    const createsBeforeRetry = creates;
    assert.equal(await runOneJob(fixture.app, createMediaJobProcessor(fixture.app, bridge)), true);
    assert.equal(fixture.app.trackJob(retry.id).status, "succeeded");
    assert.equal(creates, createsBeforeRetry, "已有 token 对齐 Run 的恢复绝不能再次 POST");
    assert.ok(reads >= 2, "恢复必须重新读取已有 Run，而不是猜测已完成");
  } finally {
    globalThis.fetch = originalFetch;
    fixture.app.close();
    await rm(root, { recursive: true, force: true });
  }
});

test("原声 token 对齐严格拒绝旧 v2 及任何自动标点痕迹的 v3 输出，且不创建 Revision", async () => {
  const originalFetch = globalThis.fetch;
  const valid = sourceTokenAlignmentOutput();
  const invalidOutputs = [
    {
      name: "旧 v2 自动标点输出",
      output: {
        version: 2,
        precision: "provider_token_timed",
        sentenceCandidateMode: "provider_punctuation",
        tokens: valid.tokens,
        sentences: [{ text: sourceCaptionTranscript, startMs: 0, endMs: 1_000, tokenStartIndex: 0, tokenEndIndex: valid.tokens.length }]
      }
    },
    {
      name: "伪装成 v3 的自动标点输出",
      output: {
        ...valid,
        // 即使 version 伪装为 3，只要自动句子进入结果，仍必须整次拒绝。
        sentences: [{ text: sourceCaptionTranscript, startMs: 0, endMs: 1_000, tokenStartIndex: 0, tokenEndIndex: valid.tokens.length }]
      }
    },
    {
      name: "v3 声称 Provider 自动标点模式",
      output: {
        ...valid,
        // 即使当前恰好没有句子，也不能接受未来会把标点候选重新带回来的模式标记。
        sentenceCandidateMode: "provider_punctuation"
      }
    }
  ];
  try {
    for (const [index, invalid] of invalidOutputs.entries()) {
      const root = await mkdtemp(join(tmpdir(), "videocut-source-caption-token-invalid-"));
      const fixture = await prepareSourceTokenAlignmentFixture(root);
      const runId = `source-token-invalid-${index}`;
      try {
        const job = fixture.app.submitSourceAudioSentenceAlignment({
          projectId: fixture.projectId,
          baseRevision: fixture.revision,
          timelineItemId: fixture.actorItem.id
        });
        globalThis.fetch = async (input) => {
          const url = String(input);
          if (url.endsWith("/health")) {
            return new Response(JSON.stringify({ status: "ready", queueModes: ["normal", "foreground"] }), { headers: { "content-type": "application/json" } });
          }
          if (url.endsWith(`/workflows/${FUNASR_SOURCE_TOKEN_ALIGNMENT_WORKFLOW_ID}`)) {
            return new Response(JSON.stringify(sourceTokenAlignmentWorkflowResponse()), { headers: { "content-type": "application/json" } });
          }
          if (url.endsWith(`/workflows/${FUNASR_SOURCE_TOKEN_ALIGNMENT_WORKFLOW_ID}/runs`)) {
            return new Response(JSON.stringify({ id: runId, status: "queued", outputs: [] }), { headers: { "content-type": "application/json" } });
          }
          if (url.endsWith(`/runs/${runId}`)) {
            return new Response(JSON.stringify({
              id: runId,
              status: "succeeded",
              outputs: [
                { outputSlotId: "transcript-text", displayName: "全文", kind: "text", text: sourceCaptionTranscript },
                { outputSlotId: "token-alignment-json", displayName: "Token 时间", kind: "text", text: JSON.stringify(invalid.output) }
              ]
            }), { headers: { "content-type": "application/json" } });
          }
          throw new Error(`未预期的 Bridge 请求：${url}`);
        };
        assert.equal(await runOneJob(fixture.app, createMediaJobProcessor(fixture.app, new ComfyUIBridgeClient("http://bridge.test/comfyui-bridge/v1"))), true, invalid.name);
        const failed = fixture.app.trackJob(job.id);
        assert.equal(failed.status, "failed", invalid.name);
        assert.equal((failed.result?.diagnostic as { code?: string } | undefined)?.code, "SOURCE_CAPTION_SENTENCE_OUTPUT_INVALID", invalid.name);
        const current = fixture.app.readProject(fixture.projectId);
        assert.equal(current.revision.number, fixture.revision, invalid.name);
        assert.equal(current.snapshot.sourceAudioAlignments.length, 0, invalid.name);
        assert.equal(current.snapshot.timeline.captions.filter((caption) => caption.sourceKind === "source_audio").length, 0, invalid.name);
      } finally {
        globalThis.fetch = originalFetch;
        fixture.app.close();
        await rm(root, { recursive: true, force: true });
      }
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("SourceCaptionProgram 拒绝重叠、漏 token、改写原声与过期对齐", async () => {
  const root = await mkdtemp(join(tmpdir(), "videocut-source-caption-program-reject-"));
  const fixture = await prepareSourceTokenAlignmentFixture(root);
  try {
    const aligned = completeSourceTokenAlignment(fixture);
    const alignment = aligned.snapshot.sourceAudioAlignments[0];
    assert.ok(alignment);
    assert.equal(aligned.snapshot.timeline.captions.filter((caption) => caption.sourceKind === "source_audio").length, 0);
    const baseRevision = aligned.revision.number;
    const rejectProgram = (cards: Array<{ tokenStartIndex: number; tokenEndIndex: number; displayText?: string; rationale: string }>, code: string) => {
      assert.throws(
        () => fixture.app.applySourceCaptionProgram({ projectId: fixture.projectId, baseRevision, alignmentId: alignment.id, cards }),
        (error: unknown) => (error as { code?: string }).code === code
      );
      assert.equal(fixture.app.readProject(fixture.projectId).revision.number, baseRevision, "拒绝的 Program 不能留下半成品 Revision");
    };
    rejectProgram([
      { tokenStartIndex: 0, tokenEndIndex: 4, rationale: "建立观看主题" },
      { tokenStartIndex: 3, tokenEndIndex: 9, rationale: "错误地重叠上一张卡" }
    ], "SOURCE_CAPTION_PROGRAM_TOKEN_RANGE_INVALID");
    rejectProgram([
      { tokenStartIndex: 0, tokenEndIndex: 8, rationale: "错误地漏掉结尾 spoken token" }
    ], "SOURCE_CAPTION_PROGRAM_TOKEN_COVERAGE_INVALID");
    rejectProgram([
      { tokenStartIndex: 0, tokenEndIndex: 4, displayText: "今天我们一起听", rationale: "试图把原声看改成听" },
      { tokenStartIndex: 4, tokenEndIndex: 9, rationale: "保留剩余文字" }
    ], "SOURCE_CAPTION_PROGRAM_TEXT_MISMATCH");

    // 显式标为 stale 的历史证据仍可留在图中供审计，但绝不能再被编译成新字幕。
    const staleState = fixture.app.repository.commit(fixture.projectId, baseRevision, "测试：标记过期 token 对齐", (snapshot, impact) => {
      const stored = snapshot.sourceAudioAlignments.find((candidate) => candidate.id === alignment.id);
      assert.ok(stored);
      stored.status = "stale";
      impact.stale.push(stored.id);
    });
    assert.throws(
      () => fixture.app.applySourceCaptionProgram({
        projectId: fixture.projectId,
        baseRevision: staleState.revision.number,
        alignmentId: alignment.id,
        cards: [{ tokenStartIndex: 0, tokenEndIndex: 9, rationale: "尝试使用已过期映射" }]
      }),
      (error: unknown) => (error as { code?: string }).code === "SOURCE_CAPTION_ALIGNMENT_NOT_READY"
    );
  } finally {
    fixture.app.close();
    await rm(root, { recursive: true, force: true });
  }
});

test("SourceCaptionProgram 只按剪辑任务提交的完整语义卡编译 source_token_anchored 字幕", async () => {
  const root = await mkdtemp(join(tmpdir(), "videocut-source-caption-program-compile-"));
  const fixture = await prepareSourceTokenAlignmentFixture(root);
  try {
    const aligned = completeSourceTokenAlignment(fixture);
    const alignment = aligned.snapshot.sourceAudioAlignments[0];
    assert.ok(alignment);
    const compiled = fixture.app.applySourceCaptionProgram({
      projectId: fixture.projectId,
      baseRevision: aligned.revision.number,
      alignmentId: alignment.id,
      // v3 没有任何 Provider 句子候选。这里由剪辑判断保留完整短语，而不是把“剪得 / 更精彩”机械拆开。
      cards: [
        { tokenStartIndex: 0, tokenEndIndex: 4, rationale: "开场邀请，保留人物建立观看关系的短暂停留" },
        { tokenStartIndex: 4, tokenEndIndex: 9, rationale: "保留完整的方法与结果短语，在示范画面中稳定阅读" }
      ]
    });
    const captions = compiled.snapshot.timeline.captions.filter((caption) => caption.sourceKind === "source_audio");
    const program = compiled.snapshot.sourceCaptionPrograms.find((candidate) => candidate.alignmentId === alignment.id);
    assert.equal(captions.length, 2);
    assert.ok(program);
    assert.deepEqual(captions.map((caption) => [caption.sourceTokenStartIndex, caption.sourceTokenEndIndex]), [[0, 4], [4, 9]]);
    assert.deepEqual(captions.map((caption) => caption.text), ["今天我们一起看", "如何把视频剪得更精彩。"]);
    assert.deepEqual(captions.map((caption) => caption.sourceCaptionRationale), ["开场邀请，保留人物建立观看关系的短暂停留", "保留完整的方法与结果短语，在示范画面中稳定阅读"]);
    assert.ok(captions.every((caption) => caption.precision === "source_token_anchored"));
    assert.ok(captions.every((caption) => caption.sourceAlignmentId === alignment.id && caption.sourceCaptionProgramId === program.id));
    assert.ok(captions.every((caption) => caption.sourceText === caption.text && caption.textMode === "derived"));
    assert.doesNotThrow(() => assertProjectGraphValid(compiled.snapshot));
  } finally {
    fixture.app.close();
    await rm(root, { recursive: true, force: true });
  }
});

test("token 对齐不依赖另一轮 VAD ASR 全文，旧自动粗字幕仅在 Program 编译时原子替换", async () => {
  const root = await mkdtemp(join(tmpdir(), "videocut-source-caption-coarse-fallback-"));
  const fixture = await prepareSourceTokenAlignmentFixture(root);
  try {
    const beforeAlignment = fixture.app.completeSourceAudioCaptions({
      projectId: fixture.projectId,
      requestedRevision: fixture.revision,
      assetId: fixture.assetId,
      timelineItemId: fixture.actorItem.id,
      sourceStartFrame: fixture.actorItem.sourceStartFrame,
      sourceEndFrame: fixture.actorItem.sourceEndFrame,
      timelineStartFrame: fixture.actorItem.startFrame,
      timelineEndFrame: fixture.actorItem.endFrame,
      // VAD 切片上下文的识别文本故意与整段 token 输出不同，不能成为后者的脆弱前置校验。
      chunks: [{
        sourceStartFrame: fixture.actorItem.sourceStartFrame,
        sourceEndFrame: fixture.actorItem.sourceEndFrame,
        text: "旧批次的自动粗字幕。",
        bridgeRunId: "coarse-fallback-run"
      }]
    });
    const oldCoarse = beforeAlignment.snapshot.timeline.captions.find((caption) => caption.sourceKind === "source_audio");
    assert.ok(oldCoarse);

    const aligned = completeSourceTokenAlignment(fixture, "source-token-alignment-after-coarse");
    const alignment = aligned.snapshot.sourceAudioAlignments[0];
    assert.ok(alignment);
    const fallback = aligned.snapshot.timeline.captions.find((caption) => caption.id === oldCoarse.id);
    assert.equal(fallback?.precision, "chunk_coarse", "采集证据不能造成中间 Revision 突然失去已有字幕");

    const compiled = fixture.app.applySourceCaptionProgram({
      projectId: fixture.projectId,
      baseRevision: aligned.revision.number,
      alignmentId: alignment.id,
      cards: [
        { tokenStartIndex: 0, tokenEndIndex: 4, rationale: "完整主语和动作" },
        { tokenStartIndex: 4, tokenEndIndex: 9, rationale: "完整方法与结果" }
      ]
    });
    const captions = compiled.snapshot.timeline.captions.filter((caption) => caption.sourceKind === "source_audio");
    assert.equal(captions.length, 2);
    assert.ok(captions.every((caption) => caption.precision === "source_token_anchored"));
    assert.ok(!captions.some((caption) => caption.id === oldCoarse.id), "Program 必须原子替换旧粗字幕，而不是混合显示");
    assert.doesNotThrow(() => assertProjectGraphValid(compiled.snapshot));
  } finally {
    fixture.app.close();
    await rm(root, { recursive: true, force: true });
  }
});

test("A-roll 映射变化会自动使 token 对齐和 Program 失效，不能把旧卡留在新画面上", async () => {
  const root = await mkdtemp(join(tmpdir(), "videocut-source-caption-stale-propagation-"));
  const fixture = await prepareSourceTokenAlignmentFixture(root);
  try {
    const aligned = completeSourceTokenAlignment(fixture, "source-token-alignment-stale-propagation");
    const alignment = aligned.snapshot.sourceAudioAlignments[0];
    assert.ok(alignment);
    const compiled = fixture.app.applySourceCaptionProgram({
      projectId: fixture.projectId,
      baseRevision: aligned.revision.number,
      alignmentId: alignment.id,
      cards: [{ tokenStartIndex: 0, tokenEndIndex: 9, rationale: "完整句子作为稳定字幕" }]
    });
    const changed = fixture.app.repository.commit(fixture.projectId, compiled.revision.number, "测试：移动 A-roll 使用", (snapshot) => {
      const item = snapshot.timeline.items.find((candidate) => candidate.id === fixture.actorItem.id);
      assert.ok(item);
      item.startFrame += 1;
      item.endFrame += 1;
    });
    assert.equal(changed.snapshot.sourceAudioAlignments.find((candidate) => candidate.id === alignment.id)?.status, "stale");
    assert.equal(changed.snapshot.sourceCaptionPrograms.length, 0);
    assert.equal(changed.snapshot.timeline.captions.filter((caption) => caption.sourceKind === "source_audio").length, 0);
    assert.ok(changed.revision.impact.stale.includes(alignment.id));
    assert.doesNotThrow(() => assertProjectGraphValid(changed.snapshot));
  } finally {
    fixture.app.close();
    await rm(root, { recursive: true, force: true });
  }
});

test("token 对齐 Workflow 缺少指定输出槽位时明确失败且不提交外部 Run", async () => {
  const root = await mkdtemp(join(tmpdir(), "videocut-source-caption-token-slot-"));
  const originalFetch = globalThis.fetch;
  const fixture = await prepareSourceTokenAlignmentFixture(root);
  let creates = 0;
  try {
    const job = fixture.app.submitSourceAudioSentenceAlignment({
      projectId: fixture.projectId,
      baseRevision: fixture.revision,
      timelineItemId: fixture.actorItem.id
    });
    globalThis.fetch = async (input) => {
      const url = String(input);
      if (url.endsWith("/health")) {
        return new Response(JSON.stringify({ status: "ready", queueModes: ["normal", "foreground"] }), { headers: { "content-type": "application/json" } });
      }
      if (url.endsWith(`/workflows/${FUNASR_SOURCE_TOKEN_ALIGNMENT_WORKFLOW_ID}`)) {
        return new Response(JSON.stringify(sourceTokenAlignmentWorkflowResponse([{ id: "transcript-text", label: "全文", kind: "text" }])), { headers: { "content-type": "application/json" } });
      }
      if (url.endsWith(`/workflows/${FUNASR_SOURCE_TOKEN_ALIGNMENT_WORKFLOW_ID}/runs`)) {
        creates += 1;
        throw new Error("缺少输出槽位时不得提交 Run");
      }
      throw new Error(`未预期的 Bridge 请求：${url}`);
    };
    assert.equal(await runOneJob(fixture.app, createMediaJobProcessor(fixture.app, new ComfyUIBridgeClient("http://bridge.test/comfyui-bridge/v1"))), true);
    const failed = fixture.app.trackJob(job.id);
    assert.equal(failed.status, "failed");
    assert.equal((failed.result?.diagnostic as { code?: string } | undefined)?.code, "MISSING_SOURCE_CAPTION_ALIGNMENT_OUTPUT_SLOT");
    assert.equal(creates, 0);
    assert.equal(fixture.app.readProject(fixture.projectId).revision.number, fixture.revision);
  } finally {
    globalThis.fetch = originalFetch;
    fixture.app.close();
    await rm(root, { recursive: true, force: true });
  }
});
