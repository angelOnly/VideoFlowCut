import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createApplication } from "@videocut/application";
import { ComfyUIBridgeClient, type BridgeWorkflow } from "@videocut/bridge";
import { readRuntimeConfig } from "@videocut/project-overview";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { runMotionReferenceAnalysis } from "../apps/job-worker/src/motion-library.js";
import { registerMotionLibraryTools } from "../apps/server/src/motion-library-tools.js";
import { loadLibraryIndex, libraryVideo } from "../references/motion-cases/skillry/tools/library-store.mjs";
import { loadCreativeIndex } from "../references/motion-cases/skillry/tools/creative-library.mjs";
import { hashMediaFile } from "../packages/edit-application/src/media-intelligence.js";
import { digest } from "../packages/media-intelligence/src/index.js";
import { LEGACY_MOTION_VIDEO_PROMPT, MOTION_VIDEO_PROMPT } from "../packages/media-intelligence/src/motion-library.js";
import { PREPROCESSING_VERSION } from "../packages/media-intelligence/src/derive.js";
import { runProcess } from "@videocut/speech";

for (const status of ["running", "submitting"] as const) {
  test(`旧原片分析 ${status} 检查点升级后保持原身份，不重复提交`, { timeout: 60_000 }, async () => {
    const directory = await mkdtemp(join(tmpdir(), "vfc-motion-analysis-recovery-"));
    const app = createApplication(directory);
    try {
      const initial = app.createProject({ name: "原片理解恢复隔离验证" });
      const projectId = initial.snapshot.project.id;
      const libraryRoot = resolve("references/motion-cases/skillry");
      const index = loadLibraryIndex(libraryRoot);
      const id = index.mechanisms[0]!.id;
      const fingerprint = index.source_sha256;
      const path = libraryVideo(libraryRoot, id, fingerprint);
      const hash = await hashMediaFile(path);
      const config = readRuntimeConfig();
      const modelConfig = { ...config.semantic, apiBaseUrl: config.bridge.apiBaseUrl };
      const range = { startMs: 0, endMs: 1000 };
      const workflow: BridgeWorkflow = { id: config.semantic.videoWorkflowId, schemaVersion: "recovery-v1", name: "隔离理解",
        fields: ["prompt", "start_seconds", "duration_seconds"].map(id => ({ id, label: id, kind: "text", required: false })), itemSlots: [], outputs: [] };
      const key = digest([id, fingerprint, hash, range, modelConfig, workflow.schemaVersion, LEGACY_MOTION_VIDEO_PROMPT, PREPROCESSING_VERSION]);
      const payload = { id, source_sha256: fingerprint, range, modelConfig };
      const oldJob = app.repository.createJob({ projectId, kind: "motion_reference_analysis", payload, idempotencyKey: "legacy-analysis" });
      app.recordJobCheckpoint(oldJob.id, { externalRuns: { [`motion-video:${key}`]: {
        status, workflowId: workflow.id, schemaVersion: workflow.schemaVersion, requestIdentity: key,
        ...(status === "running" ? { runId: "original-external-run" } : {})
      } } });
      app.updateJob(oldJob.id, { status: "failed", error: "隔离模拟等待中断" });
      const before = app.trackJob(oldJob.id);
      const retry = app.intelligence.retry(projectId, oldJob.id);
      const bridge = new ComfyUIBridgeClient(config.bridge.apiBaseUrl);
      const reads: string[] = [];
      const prompts: unknown[] = [];
      bridge.getWorkflow = async () => workflow;
      bridge.findRequiredSlot = () => ({ id: "video", label: "隔离视频输入", mediaKind: "video", min: 1, max: 1 });
      bridge.createRunWithWorkflow = async (_id, build) => {
        const request = await build(workflow);
        prompts.push(request.fieldValues.prompt);
        return { workflow, request, schemaRetryCount: 0, run: { id: "new-external-run", status: "running", outputs: [] } };
      };
      bridge.waitForRun = async id => {
        reads.push(id);
        return { id, status: "succeeded", outputs: [{ outputSlotId: "text", kind: "text", displayName: "描述", text: "隔离模拟结果，仅验证运行身份" }] };
      };
      if (status === "submitting") {
        await assert.rejects(runMotionReferenceAnalysis(app, retry, bridge), { code: "EXTERNAL_RUN_OUTCOME_UNKNOWN" });
        assert.deepEqual(reads, []);
      } else {
        const result = await runMotionReferenceAnalysis(app, retry, bridge);
        assert.equal(result.run_id, "original-external-run");
        assert.deepEqual(reads, ["original-external-run"]);
      }
      assert.deepEqual(prompts, [], "旧检查点恢复不调用外部提交");
      assert.deepEqual(app.trackJob(oldJob.id), before, "原 Job 记录保持不变");
      if (status === "running") {
        const newJob = app.repository.createJob({ projectId, kind: "motion_reference_analysis", payload: { ...payload, videoPrompt: MOTION_VIDEO_PROMPT }, idempotencyKey: "current-analysis" });
        const result = await runMotionReferenceAnalysis(app, newJob, bridge);
        assert.equal(result.cache_hit, false, "新版提示不能复用旧提示结果");
        assert.equal(result.run_id, "new-external-run");
        assert.deepEqual(prompts, [MOTION_VIDEO_PROMPT]);
      }
      assert.equal(app.readProject(projectId).revision.number, initial.revision.number);
    } finally {
      app.close();
      await rm(directory, { recursive: true, force: true });
    }
  });
}

test("同一参考原片按声画与静音模式分开缓存，并把真实音轨送入模型", { timeout: 60_000 }, async () => {
  const directory = await mkdtemp(join(tmpdir(), "vfc-motion-reference-audio-"));
  const app = createApplication(directory);
  let client: Client | undefined, server: McpServer | undefined;
  try {
    const projectId = app.createProject({ name: "参考声音隔离测试" }).snapshot.project.id;
    const index = loadLibraryIndex(resolve("references/motion-cases/skillry"));
    const config = readRuntimeConfig(), modelConfig = { ...config.semantic, apiBaseUrl: config.bridge.apiBaseUrl };
    const workflow: BridgeWorkflow = { id: config.semantic.videoWorkflowId, schemaVersion: "audio-v1", name: "隔离理解",
      fields: ["prompt", "start_seconds", "duration_seconds"].map(id => ({ id, label: id, kind: "text", required: false })), itemSlots: [], outputs: [] };
    const bridge = new ComfyUIBridgeClient(config.bridge.apiBaseUrl);
    const uploaded: boolean[] = [], prompts: unknown[] = [];
    bridge.getWorkflow = async () => workflow;
    bridge.findRequiredSlot = () => ({ id: "video", label: "视频", mediaKind: "video", min: 1, max: 1 });
    bridge.createRunWithWorkflow = async (_id, build) => {
      const request = await build(workflow);
      prompts.push(request.fieldValues.prompt);
      const probe = JSON.parse(await runProcess("ffprobe", ["-v", "error", "-show_entries", "stream=codec_type", "-of", "json", request.files![0].path]));
      uploaded.push(probe.streams.some((stream: { codec_type: string }) => stream.codec_type === "audio"));
      return { workflow, request, schemaRetryCount: 0, run: { id: `run-${uploaded.length}`, status: "running", outputs: [] } };
    };
    bridge.waitForRun = async id => ({ id, status: "succeeded", outputs: [{ outputSlotId: "text", kind: "text", displayName: "描述", text: "隔离模拟观察" }] });
    const payload = { id: "026-m07", source_sha256: index.source_sha256, range: { startMs: 10083, endMs: 12083 }, modelConfig, videoPrompt: MOTION_VIDEO_PROMPT };
    const audiovisual = app.repository.createJob({ projectId, kind: "motion_reference_analysis", payload: { ...payload, analysisMode: "audiovisual" }, idempotencyKey: "with-audio" });
    const visual = app.repository.createJob({ projectId, kind: "motion_reference_analysis", payload: { ...payload, analysisMode: "visual" }, idempotencyKey: "without-audio" });
    const first = await runMotionReferenceAnalysis(app, audiovisual, bridge);
    const second = await runMotionReferenceAnalysis(app, visual, bridge);
    assert.deepEqual(uploaded, [true, false]);
    assert.equal((first.input as { has_audio: boolean }).has_audio, true);
    assert.equal((second.input as { has_audio: boolean }).has_audio, false);
    assert.equal(second.cache_hit, false);

    const libraryRoot = resolve("references/motion-cases/skillry"), creative = loadCreativeIndex(libraryRoot);
    server = new McpServer({ name: "creative-reference-test", version: "1" });
    registerMotionLibraryTools(server, libraryRoot, app, () => projectId);
    client = new Client({ name: "creative-reference-client", version: "1" });
    const [local, remote] = InMemoryTransport.createLinkedPair();
    await server.connect(remote); await client.connect(local);
    const submitted = await client.callTool({ name: "analyze_motion_reference", arguments: { project_id: projectId,
      id: "002-c01", source_sha256: creative.source_sha256, range: { startMs: 100, endMs: 900 }, observation_questions: ["画面如何接管？"] } });
    assert.notEqual(submitted.isError, true, JSON.stringify(submitted.content));
    const receipt = JSON.parse((submitted.content as Array<{ text: string }>)[0]!.text);
    const observed = await runMotionReferenceAnalysis(app, app.trackJob(receipt.id), bridge);
    assert.equal(observed.id, "002-c01");
    assert.deepEqual(observed.range, { startMs: 100, endMs: 900 });
    assert.match(String(prompts[2]), /画面如何接管/);
    assert.equal((observed.input as { has_audio: boolean }).has_audio, (observed.input as { source_has_audio: boolean }).source_has_audio);
  } finally { await client?.close(); await server?.close(); app.close(); await rm(directory, { recursive: true, force: true }); }
});
