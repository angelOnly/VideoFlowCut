import test from "node:test";
import assert from "node:assert/strict";
import { copyFile, mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createApplication } from "@videocut/application";
import { OmniVoiceSegmentService, runProcess } from "@videocut/speech";
import { BridgeError, type ComfyUIBridgeClient, type BridgeWorkflow } from "@videocut/bridge";

test("配音第二段等待中断后续接原Run，已完成段不重生，重复完成不新增Revision", async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-voice-recovery-"));
  const app = createApplication(root);
  try {
    const created = app.createProject({ name: "配音恢复隔离测试" });
    const projectId = created.snapshot.project.id;
    app.applyAuthoredScript({ projectId, baseRevision: 1, sourceNote: "恢复夹具", units: ["第一句。", "第二句。", "第三句。"].map(text => ({ text, kind: "statement" as const })) });
    const file = join(root, "tone.wav");
    await runProcess("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "sine=frequency=440:duration=0.3:sample_rate=24000", file]);
    let submissions = 0, timedOut = false;
    const waits: string[] = [];
    const bridge = {
      findTextField: () => ({ id: "text" }),
      createRunWithSchemaRetry: async (id: string, build: (workflow: BridgeWorkflow) => Promise<unknown>) => {
        const workflow = { id, schemaVersion: "fixture", itemSlots: [] } as unknown as BridgeWorkflow;
        const request = await build(workflow);
        return { workflow, request, schemaRetryCount: 0, run: { id: `run-${++submissions}` } };
      },
      waitForRun: async (id: string) => {
        waits.push(id);
        if (id === "run-2" && !timedOut) { timedOut = true; throw new BridgeError("等待超时", undefined, undefined, "BRIDGE_RUN_TIMEOUT"); }
        return { id, status: "succeeded", outputs: [{ kind: "audio", downloadUrl: "http://fixture/voice.wav", fileName: "voice.wav" }] };
      },
      downloadOutput: async (_output: unknown, path: string) => copyFile(file, path)
    } as unknown as ComfyUIBridgeClient;
    const service = new OmniVoiceSegmentService(app, bridge);
    const original = app.submitVoiceSynthesis({ projectId });
    await assert.rejects(service.synthesize(original), /等待超时/u);
    assert.equal(submissions, 2);
    app.updateJob(original.id, { status: "failed", error: "等待超时" });
    const retry = app.resumeVoiceSynthesis(original.id);
    assert.equal(app.resumeVoiceSynthesis(original.id).id, retry.id);
    const result = await service.synthesize(retry);
    assert.ok(result.speechAssetId);
    assert.equal(submissions, 3, "只生成未开始的第三段");
    assert.deepEqual(waits, ["run-1", "run-2", "run-2", "run-3"]);
    const revision = app.readProject(projectId).revision.number;
    assert.equal((await service.synthesize(retry)).speechAssetId, result.speechAssetId);
    assert.equal(app.readProject(projectId).revision.number, revision);
    assert.equal(submissions, 3);
    const unknown = app.submitVoiceSynthesis({ projectId, speechSegmentIds: app.readProject(projectId).snapshot.speechSegments.map(segment => segment.id), idempotencyKey: "unknown" });
    app.recordJobCheckpoint(unknown.id, { speechSegments: { first: { status: "submitting", attemptJobId: unknown.id } } });
    app.updateJob(unknown.id, { status: "unknown" });
    assert.throws(() => app.resumeVoiceSynthesis(unknown.id), { code: "EXTERNAL_RUN_OUTCOME_UNKNOWN" });
  } finally { app.close(); await rm(root, { recursive: true, force: true }); }
});

test("Job计时记录实际领取和终态，续租不伪造进展；项目响应只携带一份快照", async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-job-timing-"));
  const app = createApplication(root);
  try {
    const state = app.createProject({ name: "计时隔离测试" });
    assert.equal(Object.hasOwn(state.revision, "snapshot"), false);
    const job = app.repository.createJob({ projectId: state.snapshot.project.id, kind: "media_analysis", payload: {}, idempotencyKey: "timing" });
    assert.equal(job.result?.execution, undefined, "没有开始时不倒推开始时间");
    app.claimNextJob(["media_analysis"]);
    const before = app.trackJob(job.id).result!.execution;
    app.renewJobLease(job.id);
    assert.deepEqual(app.trackJob(job.id).result!.execution, before);
    app.recordJobCheckpoint(job.id, { completedUnits: 1 });
    app.updateJob(job.id, { status: "succeeded", result: { completedUnits: 1 } });
    const timing = app.trackJob(job.id).result!.execution as { attempts: Array<{ startedAt: string; finishedAt: string }>; lastProgressAt: string };
    assert.ok(timing.attempts[0]!.startedAt <= timing.lastProgressAt);
    assert.ok(timing.lastProgressAt <= timing.attempts[0]!.finishedAt);
  } finally { app.close(); await rm(root, { recursive: true, force: true }); }
});
