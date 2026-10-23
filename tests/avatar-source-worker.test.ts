import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { copyFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createApplication, type EditingApplication } from "@videocut/application";
import type { ComfyUIBridgeClient, BridgeWorkflow } from "@videocut/bridge";
import type { ActorCapabilityProfile, Asset, AvatarSourceJobPayload, AvatarSourceReceipt, BridgeRunAudit, JobRecord, PresenterUse } from "@videocut/contracts";
import { createProjectSnapshot, DomainError } from "@videocut/domain";
import { probeMedia, runProcess } from "@videocut/speech";
import { runAvatarGeneration, type AvatarCompletionInput } from "../apps/job-worker/src/avatar-generation.js";

const digest = (data: Buffer) => createHash("sha256").update(data).digest("hex");

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "avatar-source-worker-"));
  const snapshot = createProjectSnapshot({ projectId: "project", name: "采样映射测试", rootPath: root, fps: 30 });
  const createdAt = new Date().toISOString();
  // 确定性 PCM ramp 让测试能直接核对实际上传的首尾采样，而非只比较生成命令。
  const pcm = Buffer.alloc(44100 * 2);
  for (let i = 0; i < 44100; i++) pcm.writeInt16LE(i % 20000, i * 2);
  const wav = Buffer.alloc(44);
  wav.write("RIFF"); wav.writeUInt32LE(36 + pcm.length, 4); wav.write("WAVEfmt ", 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(44100, 24); wav.writeUInt32LE(88200, 28);
  wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write("data", 36); wav.writeUInt32LE(pcm.length, 40);
  const speechBytes = Buffer.concat([wav, pcm]);
  const portraitBytes = Buffer.from("已固定的肖像文件");
  const speechFile: Asset = {
    id: "speech-file", name: "speech.wav", kind: "speech", status: "ready", managedPath: "speech.wav",
    sourceHash: digest(speechBytes), tags: [], createdAt,
    metadata: { hasAudio: true, durationMs: 1000, sampleRate: 44100 }
  };
  const referenceImage: Asset = {
    id: "photo", name: "photo.png", kind: "image", status: "ready", managedPath: "photo.png",
    sourceHash: digest(portraitBytes), tags: [], createdAt
  };
  await writeFile(join(root, speechFile.managedPath), speechBytes);
  await writeFile(join(root, referenceImage.managedPath), portraitBytes);
  snapshot.assets.push(speechFile, referenceImage);
  const profile: ActorCapabilityProfile = {
    id: "profile", provider: "ltx23_audio_to_video", label: "隔离工作流", workflowId: "avatar",
    inputModes: ["audio"], maskModes: ["none"], supportsReferenceImage: true, supportsReferenceVideo: false,
    supportsAudioDrivenLipSync: true, supportsGazeControl: false, supportsGestureControl: false,
    supportsPartialRegeneration: false, maxDurationSeconds: 10, privacyNote: "", createdAt, updatedAt: createdAt
  };
  snapshot.actorCapabilityProfiles.push(profile);
  const use: PresenterUse = {
    id: "needed", speechAssetId: "speech-version", referenceImageAssetId: "photo", startFrame: 901,
    endFrame: 904, performanceNote: "平静讲述", timingEvidence: { kind: "audio_review", note: "已试听范围" }
  };
  snapshot.visualTreatments.push({
    id: "visual", mode: "keep_presenter", primaryAttention: "人物", narrativePurpose: "解释",
    intensity: "quiet", status: "ready", createdAt, updatedAt: createdAt, presenterUses: [use]
  });
  const dialogue = snapshot.timeline.tracks.find(track => track.name === "Dialogue")!;
  snapshot.timeline.items.push({
    id: "dialogue", trackId: dialogue.id, assetId: speechFile.id, startFrame: 900, endFrame: 929,
    sourceStartFrame: 1, sourceEndFrame: 30, disabled: false
  });
  const payload: AvatarSourceJobPayload = {
    contractVersion: 2, requestedRevision: 1, presenterUseIds: ["cancelled", "needed"],
    sourceGroupKey: "group", planFingerprint: "plan",
    input: {
      audio: { assetId: speechFile.id, sourceHash: speechFile.sourceHash!, sampleRate: 44100, startSample: 2940, endSample: 7350 },
      referenceImageAssetId: "photo", referenceImageHash: referenceImage.sourceHash!, performanceNote: use.performanceNote, profile
    },
    speechFile, referenceImage, generationRange: { startFrame: 901, endFrame: 904, speechSegmentIds: ["segment"] },
    generationFps: 30, speechAssetId: "speech-version", capabilityProfileId: profile.id,
    workflowId: profile.workflowId, referenceImageAssetId: "photo"
  };
  const job: JobRecord = {
    id: "job", projectId: "project", kind: "avatar_generation", status: "running", payload, idempotencyKey: "once",
    attempt: 1, createdAt, updatedAt: createdAt
  };
  const app = {
    readProject: () => ({ snapshot, revision: { number: 9 } }),
    trackJob: () => job,
    recordJobCheckpoint: (_id: string, fields: Record<string, unknown>) => { job.result = { ...job.result, ...fields }; },
    recordBridgeRun: (_id: string, audit: BridgeRunAudit) => {
      job.result = { ...job.result, bridgeRuns: [...(job.result?.bridgeRuns as BridgeRunAudit[] ?? []), audit] };
    },
    completeAvatarSourceGeneration: (input: AvatarCompletionInput) => {
      const receipt: AvatarSourceReceipt = {
        contractVersion: 2, jobId: job.id, assetId: "actor", input: payload.input,
        generationRange: payload.generationRange, generationFps: payload.generationFps,
        outputOffsetSeconds: 0, outputHash: input.actorVideo.contentHash
      };
      snapshot.assets.push({
        id: "actor", name: "actor.mp4", kind: "actor_video", status: "ready",
        managedPath: input.actorVideo.relativePath, sourceHash: input.actorVideo.contentHash,
        avatarSourceReceipt: receipt, metadata: input.actorVideo.metadata, tags: [], createdAt
      });
      job.result = { ...job.result, avatarSourceReceipt: receipt, actorAssetId: "actor", revision: 10 };
    }
  } as unknown as EditingApplication;
  return { root, snapshot, job, payload, app, dispose: () => rm(root, { recursive: true, force: true }) };
}

test("v2 Worker 按真实源采样补缺口；无关 Revision 和部分用途取消不阻止提交", async () => {
  const context = await fixture();
  try {
    const use = context.snapshot.visualTreatments[0]!.presenterUses![0]!;
    // 已有源覆盖两端，本次只生成完整用途内部的声音缺口。
    // 旧请求者已撤回，新用途仍复用相同源，不能被历史请求者 ID 误取消。
    use.id = "replacement-use";
    context.snapshot.assets.push({ ...context.payload.referenceImage, id: "same-photo" });
    use.referenceImageAssetId = "same-photo";
    use.startFrame = 900;
    use.endFrame = 905;
    let submissions = 0;
    const workflow: BridgeWorkflow = {
      id: "avatar", name: "隔离", available: true, schemaVersion: "test", fields: [],
      itemSlots: [{ id: "photo", label: "照片", kind: "image", required: true }, { id: "speech", label: "声音", kind: "audio", required: true }],
      outputs: []
    };
    const bridge = {
      createRunWithSchemaRetry: async (_id: string, build: (workflow: BridgeWorkflow) => Promise<{ files: Array<{ path: string; mime: string }> }>) => {
        const request = await build(workflow);
        const path = request.files.find(file => file.mime === "audio/wav")!.path;
        const bytes = await readFile(path);
        let offset = 12;
        while (bytes.toString("ascii", offset, offset + 4) !== "data") offset += 8 + bytes.readUInt32LE(offset + 4) + (bytes.readUInt32LE(offset + 4) % 2);
        assert.equal(bytes.readUInt32LE(offset + 4), 4410 * 2);
        assert.equal(bytes.readInt16LE(offset + 8), 2940);
        assert.equal(bytes.readInt16LE(offset + 8 + (4410 - 1) * 2), 7349);
        assert.equal((context.job.result?.avatarSpeechSlice as Record<string, unknown>).contentHash, digest(bytes));
        submissions++;
        return { workflow, request, run: { id: "original", status: "queued", outputs: [] }, schemaRetryCount: 0 };
      },
      waitForRun: async () => { throw new Error("测试中断查询"); }
    } as unknown as ComfyUIBridgeClient;
    await assert.rejects(runAvatarGeneration(context.app, context.job, bridge), /测试中断查询/);
    assert.equal(submissions, 1);
    assert.equal(context.job.result?.avatarSubmission, "accepted");
    assert.equal((context.job.result?.avatarSpeechSlice as Record<string, unknown>).startSample, 2940);
  } finally { await context.dispose(); }
});

test("v2 Worker 创建前拒绝已取消需求和实际文件哈希变化", async () => {
  const context = await fixture();
  try {
    let calls = 0;
    const bridge = { createRunWithSchemaRetry: () => { calls++; throw new Error("不得提交"); } } as unknown as ComfyUIBridgeClient;
    const uses = context.snapshot.visualTreatments[0]!.presenterUses;
    context.snapshot.visualTreatments[0]!.presenterUses = [];
    await assert.rejects(runAvatarGeneration(context.app, context.job, bridge),
      (error: unknown) => error instanceof DomainError && error.code === "AVATAR_SOURCE_NO_LONGER_REQUIRED");
    context.snapshot.visualTreatments[0]!.presenterUses = uses;
    context.snapshot.visualTreatments[0]!.status = "stale";
    await assert.rejects(runAvatarGeneration(context.app, context.job, bridge),
      (error: unknown) => error instanceof DomainError && error.code === "AVATAR_SOURCE_NO_LONGER_REQUIRED");
    context.snapshot.visualTreatments[0]!.status = "ready";
    await writeFile(join(context.root, "speech.wav"), Buffer.from("被替换的音频"));
    await assert.rejects(runAvatarGeneration(context.app, context.job, bridge),
      (error: unknown) => error instanceof DomainError && error.code === "AVATAR_SOURCE_INPUT_HASH_MISMATCH");
    assert.equal(calls, 0);
  } finally { await context.dispose(); }
});

test("v2 已知 Run 在声音和需求撤销后仍回收为源；项目写入后中断由素材回执恢复", async () => {
  const context = await fixture();
  try {
    const video = join(context.root, "output.mp4");
    await runProcess("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "color=c=blue:s=64x64:r=30:d=1", "-c:v", "libx264", "-pix_fmt", "yuv420p", video]);
    context.job.result = {
      bridgeRuns: [{ workflowId: "avatar", runId: "original", schemaVersion: "test", schemaRetryCount: 0, submittedAt: new Date().toISOString(), request: { fieldValues: {}, fileSlots: [] } }]
    };
    context.snapshot.visualTreatments[0]!.presenterUses = [];
    context.snapshot.assets = [];
    context.snapshot.actorCapabilityProfiles = [];
    await rm(join(context.root, "speech.wav"));
    let polls = 0;
    const bridge = {
      waitForRun: async (id: string) => {
        assert.equal(id, "original"); polls++;
        return { id, status: "succeeded", outputs: [{ outputSlotId: "video", kind: "video", fileName: "result.mp4", mime: "video/mp4", downloadUrl: "/result.mp4" }] };
      },
      downloadOutput: async (_output: unknown, path: string) => { await copyFile(video, path); },
      createRunWithSchemaRetry: () => { assert.fail("不得重提 Provider"); }
    } as unknown as ComfyUIBridgeClient;
    const result = await runAvatarGeneration(context.app, context.job, bridge);
    assert.equal(result.recoveredExistingRun, true);
    assert.equal(context.snapshot.actorPerformances.length, 0);
    assert.equal(context.snapshot.assets[0]!.avatarSourceReceipt?.jobId, context.job.id);
    context.job.result = undefined;
    const recovered = await runAvatarGeneration(context.app, context.job, bridge);
    assert.equal(recovered.recoveredProjectWrite, true);
    assert.equal((recovered.avatarSourceReceipt as AvatarSourceReceipt).assetId, "actor");
    assert.equal(polls, 1);
  } finally { await context.dispose(); }
});

test("人物视频仅一秒而音轨三秒时拒绝三秒需求，下载和本地恢复均不得被容器时长撑长", async () => {
  const context = await fixture();
  const app = createApplication(join(context.root, "application"));
  try {
    const video = join(context.root, "short-video-long-audio.mp4");
    await runProcess("ffmpeg", [
      "-y", "-v", "error", "-f", "lavfi", "-i", "color=c=blue:s=64x64:r=30:d=1",
      "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono:d=3",
      "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", video
    ]);
    assert.equal((await probeMedia(video)).durationMs, 3000, "回归夹具必须具有被音轨撑长的容器时长");
    const state = app.createProject({ name: "视频流实际时长", profile: "presenter_motion" });
    const payload: AvatarSourceJobPayload = {
      ...context.payload, requestedRevision: state.revision.number,
      input: { ...context.payload.input, audio: { ...context.payload.input.audio, startSample: 0, endSample: 132300 } },
      generationRange: { startFrame: 0, endFrame: 90, speechSegmentIds: ["segment"] }
    };
    const job = app.repository.createJob({
      projectId: state.snapshot.project.id, kind: "avatar_generation", payload, idempotencyKey: "short-output"
    });
    await app.recordBridgeRun(job.id, {
      workflowId: "avatar", runId: "original", schemaVersion: "test", schemaRetryCount: 0,
      submittedAt: new Date().toISOString(), request: { fieldValues: {}, fileSlots: [] }
    });
    let downloads = 0;
    const bridge = {
      waitForRun: async () => ({
        id: "original", status: "succeeded",
        outputs: [{ outputSlotId: "video", kind: "video", fileName: "result.mp4", mime: "video/mp4", downloadUrl: "/result.mp4" }]
      }),
      downloadOutput: async (_output: unknown, path: string) => { downloads++; await copyFile(video, path); },
      createRunWithSchemaRetry: () => { assert.fail("恢复任务不得重提 Provider"); }
    } as unknown as ComfyUIBridgeClient;
    for (let attempt = 0; attempt < 2; attempt++) {
      await assert.rejects(runAvatarGeneration(app, job, bridge),
        (error: unknown) => error instanceof DomainError && error.code === "AVATAR_OUTPUT_TOO_SHORT");
    }
    assert.equal(downloads, 1, "第二次必须检查已下载的本地文件");
    assert.equal(app.readProject(job.projectId).snapshot.assets.length, 0, "短视频不能登记为完整人物源");
  } finally {
    app.close();
    await context.dispose();
  }
});
