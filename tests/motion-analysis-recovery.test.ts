import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createApplication } from "@videocut/application";
import { ComfyUIBridgeClient, type BridgeWorkflow } from "@videocut/bridge";
import { readRuntimeConfig } from "@videocut/project-overview";
import { runMotionReferenceAnalysis } from "../apps/job-worker/src/motion-library.js";
import { loadLibraryIndex, libraryVideo } from "../references/motion-cases/skillry/tools/library-store.mjs";
import { hashMediaFile } from "../packages/edit-application/src/media-intelligence.js";
import { digest } from "../packages/media-intelligence/src/index.js";
import { LEGACY_MOTION_VIDEO_PROMPT, MOTION_VIDEO_PROMPT } from "../packages/media-intelligence/src/motion-library.js";
import { PREPROCESSING_VERSION } from "../packages/media-intelligence/src/derive.js";

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
      const workflow: BridgeWorkflow = { id: config.semantic.videoWorkflowId, schemaVersion: "recovery-v1", name: "隔离理解", available: true,
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
      bridge.findRequiredSlot = () => ({ id: "video", label: "隔离视频输入", kind: "video", required: true });
      bridge.createRunWithSchemaRetry = async (_id, build) => {
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
