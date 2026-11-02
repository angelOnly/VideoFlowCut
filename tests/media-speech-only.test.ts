import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createApplication } from "@videocut/application";
import { createMediaAsset } from "@videocut/domain";
import { AssetProviderRegistry } from "@videocut/acquisition";
import { ComfyUIBridgeClient, FUNASR_SOURCE_CAPTION_WORKFLOW_ID, type BridgeWorkflow } from "@videocut/bridge";
import { readRuntimeConfig } from "@videocut/project-overview";
import { probeMedia, runProcess } from "@videocut/speech";
import { hashMediaFile } from "../packages/edit-application/src/media-intelligence.js";
import { runMediaUnderstanding } from "../apps/job-worker/src/media-understanding.js";

test("纯 speech 只运行真实 ASR；比较资料不进入观察模型", async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-media-speech-")), app = createApplication(root);
  try {
    const project = app.createProject({ name: "媒体分析分流测试" }), id = project.snapshot.project.id;
    const directory = join(project.snapshot.project.rootPath, "assets");
    await mkdir(directory, { recursive: true });
    const file = join(directory, "tone.wav");
    await runProcess("ffmpeg", ["-v", "error", "-f", "lavfi", "-i", "sine=frequency=440:duration=1", "-y", file]);
    const asset = createMediaAsset({ name: "测试音频", kind: "audio", managedPath: "assets/tone.wav", sourceHash: await hashMediaFile(file) });
    Object.assign(asset, { status: "ready", metadata: await probeMedia(file) });
    app.repository.commit(id, project.revision.number, "隔离输入", snapshot => { snapshot.assets.push(asset); });
    const bridge = new ComfyUIBridgeClient(readRuntimeConfig().bridge.apiBaseUrl), submitted: string[] = [], prompts: string[] = [];
    const schema = (workflowId: string): BridgeWorkflow => ({ id: workflowId, name: "测试", available: true, schemaVersion: "v1", fields: ["prompt", "start_seconds", "duration_seconds"].map(id => ({ id, label: id, kind: "text", required: false })), itemSlots: [{ id: "audio", label: "音频", kind: "audio", required: true }], outputs: [] });
    bridge.getWorkflow = async workflowId => schema(workflowId);
    bridge.createRunWithSchemaRetry = async (workflowId, build) => {
      const workflow = schema(workflowId), request = await build(workflow);
      submitted.push(workflowId);
      if (request.fieldValues.prompt) prompts.push(String(request.fieldValues.prompt));
      return { workflow, request, schemaRetryCount: 0, run: { id: `run-${submitted.length}`, status: "queued", outputs: [] } };
    };
    bridge.waitForRun = async runId => {
      const index = Number(runId.split("-")[1]) - 1;
      const text = submitted[index] === FUNASR_SOURCE_CAPTION_WORKFLOW_ID
        ? JSON.stringify({ version: 4, precision: "provider_segment_timed", text: "测试", alignment: { tokenEvidence: "unavailable", tokenPrecision: "unavailable", tokens: [] }, segments: [{ displayText: "测试", startMs: 100, endMs: 800 }] })
        : JSON.stringify({ facts: [{ modality: "audio", text: "短促声音", startMs: 100, endMs: 800 }], unknowns: [] });
      return { id: runId, status: "succeeded", outputs: [{ outputSlotId: submitted[index] === FUNASR_SOURCE_CAPTION_WORKFLOW_ID ? "caption-alignment-json" : "result", displayName: "测试", kind: "text", text }] };
    };
    const asr = await app.intelligence.submitAnalysis(id, { assetId: asset.id, depth: "review", modalities: ["speech"] });
    await runMediaUnderstanding(app, asr, bridge, new AssetProviderRegistry());
    assert.deepEqual(submitted, [FUNASR_SOURCE_CAPTION_WORKFLOW_ID]);
    const speech = app.intelligence.store.observations(id).find(entry => entry.jobId === asr.id)!;
    assert.equal(speech.runId, "run-1");
    assert.equal(speech.version.workflowId, FUNASR_SOURCE_CAPTION_WORKFLOW_ID);
    assert.equal(speech.facts[0]!.basis, "transcript");
    assert.deepEqual(speech.facts[0]!.range, { startMs: 100, endMs: 800 });
    assert.equal(speech.speechEvidence!.runId, "run-1");

    const review = await app.intelligence.submitAnalysis(id, { assetId: asset.id, depth: "review", modalities: ["audio"], observationQuestions: "听到什么声音？", comparisonReference: "预期台词：秘密测试内容" });
    await runMediaUnderstanding(app, review, bridge, new AssetProviderRegistry());
    assert.ok(prompts[0]!.includes("听到什么声音"));
    assert.ok(!prompts[0]!.includes("秘密测试内容"));
    const observed = app.intelligence.store.observations(id).find(entry => entry.jobId === review.id)!;
    assert.equal(observed.comparisonReference, "预期台词：秘密测试内容");
    assert.ok(!observed.rawText.includes("秘密测试内容"));

    const failed = await app.intelligence.submitAnalysis(id, { assetId: asset.id, depth: "review", modalities: ["speech"], comparisonReference: "另一轮比对" });
    bridge.createRunWithSchemaRetry = async () => { throw new Error("模拟 ASR 不可用"); };
    await assert.rejects(runMediaUnderstanding(app, failed, bridge, new AssetProviderRegistry()), /ASR 不可用/);
    const failure = app.intelligence.store.analyses(id).find(entry => entry.id === failed.id)!;
    assert.equal(failure.windows[0]!.modalityStatus!.speech, "failed");
    const partial = app.intelligence.store.observations(id).find(entry => entry.jobId === failed.id)!;
    assert.equal(partial.runId, undefined, "失败时不能伪造 ASR 或多模态运行身份");
    assert.equal(partial.facts.length, 0);
    assert.ok(partial.unknowns.some(value => value.includes("ASR 不可用")));
  } finally { app.close(); await rm(root, { recursive: true, force: true }); }
});
