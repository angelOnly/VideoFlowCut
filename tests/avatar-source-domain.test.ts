import assert from "node:assert/strict";
import test from "node:test";
import type { ActorCapabilityProfile, AvatarSourceReceipt, PresenterUse } from "@videocut/contracts";
import { assertProjectGraphValid, avatarBindingMatches, createActorPerformance, createEffectCue, createMediaAsset, createProjectSnapshot, createScene, createTimelineItem, createVisualTreatment, projectFrameRateChange, resolvePresenterUseAudio } from "@videocut/domain";
import { evaluateQuality } from "@videocut/quality";
import { productionReconciliation } from "../packages/quality-system/src/editorial-review.js";

function fixture() {
  const snapshot = createProjectSnapshot({ projectId: "avatar-domain", name: "人物源映射", rootPath: "isolated", fps: 30 });
  const speech = createMediaAsset({ name: "speech.wav", kind: "audio", managedPath: "speech.wav", sourceHash: "speech-hash" });
  Object.assign(speech, { status: "ready", metadata: { durationMs: 10000, hasAudio: true, sampleRate: 48000, audioCodec: "pcm_s16le" } });
  const image = createMediaAsset({ name: "person.png", kind: "image", managedPath: "person.png", sourceHash: "image-hash" });
  image.status = "ready";
  const actor = createMediaAsset({ name: "actor.mp4", kind: "actor_video", managedPath: "actor.mp4", sourceHash: "actor-hash" });
  Object.assign(actor, { status: "ready", provenance: { source: "generated", acquiredAt: "2026-10-20" }, metadata: { durationMs: 4000, hasAudio: false, videoCodec: "h264", width: 320, height: 320 } });
  snapshot.assets.push(speech, image, actor);
  const scene = createScene({ type: "PresenterScene", title: "当前场面", purpose: "观察当前使用", startFrame: 300, endFrame: 480 });
  snapshot.scenes.push(scene);
  snapshot.timeline.durationInFrames = 480;
  const dialogueTrack = snapshot.timeline.tracks.find(track => track.name === "Dialogue")!.id;
  const dialogue = createTimelineItem({ trackId: dialogueTrack, assetId: speech.id, startFrame: 300, endFrame: 480, sourceStartFrame: 60, sourceEndFrame: 240 });
  snapshot.timeline.items.push(dialogue);
  const use: PresenterUse = { id: "use", speechAssetId: "original-speech", referenceImageAssetId: image.id, startFrame: 330, endFrame: 390, performanceNote: "自然解释", timingEvidence: { kind: "audio_review", note: "真实听审的段内范围" } };
  const treatment = createVisualTreatment({ sceneId: scene.id, mode: "keep_presenter", primaryAttention: "人物解释", narrativePurpose: "解释变化", intensity: "quiet", quietReason: "人物直接回应", presenterUses: [use] });
  snapshot.visualTreatments.push(treatment);
  const profile: ActorCapabilityProfile = {
    id: "capability", provider: "ltx23_audio_to_video", label: "测试能力", workflowId: "workflow",
    inputModes: ["audio"], maskModes: ["none"], supportsReferenceImage: true, supportsReferenceVideo: false,
    supportsAudioDrivenLipSync: true, supportsGazeControl: false, supportsGestureControl: false,
    supportsPartialRegeneration: false, maxDurationSeconds: 30, privacyNote: "隔离测试", createdAt: "2026-10-20", updatedAt: "2026-10-20"
  };
  snapshot.actorCapabilityProfiles.push(profile);
  const receipt: AvatarSourceReceipt = {
    contractVersion: 2, jobId: "original-job", assetId: actor.id, generationFps: 24,
    generationRange: { startFrame: 720, endFrame: 816, speechSegmentIds: ["removed-segment"] },
    input: { audio: { assetId: speech.id, sourceHash: speech.sourceHash!, sampleRate: 48000, startSample: 96000, endSample: 288000 }, referenceImageAssetId: image.id, referenceImageHash: image.sourceHash!, performanceNote: use.performanceNote, profile },
    outputOffsetSeconds: 0, outputHash: actor.sourceHash!
  };
  actor.avatarSourceReceipt = receipt;
  const item = createTimelineItem({ sceneId: scene.id, trackId: snapshot.timeline.tracks.find(track => track.name === "Actor / A-roll")!.id, assetId: actor.id, startFrame: 330, endFrame: 390, sourceStartFrame: 30, sourceEndFrame: 90 });
  snapshot.timeline.items.push(item);
  const performance = createActorPerformance({
    timelineItemId: item.id, source: "generated", maskMode: "none", audioMode: "use_dialogue_track",
    capabilityProfileId: profile.id, generationJobId: receipt.jobId, generationRange: receipt.generationRange,
    speechAssetId: "historical-speech", scriptRevision: 1,
    sourceBinding: { presenterUseId: use.id, receipt, audio: resolvePresenterUseAudio(snapshot, use) }
  });
  snapshot.actorPerformances.push(performance);
  return { snapshot, dialogue, item, performance, receipt, use: treatment.presenterUses![0], speech, image, treatment, scene };
}

test("段内出镜按偏移 Dialogue 映射整数采样，连续切片保留同一声音", () => {
  const { snapshot, dialogue, use, speech } = fixture();
  assert.deepEqual(resolvePresenterUseAudio(snapshot, use), { assetId: speech.id, sourceHash: "speech-hash", sampleRate: 48000, startSample: 144000, endSample: 240000 });
  const second = { ...dialogue, id: "dialogue-2", startFrame: 360, sourceStartFrame: 120 };
  Object.assign(dialogue, { endFrame: 360, sourceEndFrame: 120 });
  snapshot.timeline.items.push(second);
  assert.equal(resolvePresenterUseAudio(snapshot, use).endSample, 240000);
  second.sourceStartFrame += 1;
  second.sourceEndFrame += 1;
  assert.throws(() => resolvePresenterUseAudio(snapshot, use), /连续采样/u);
  second.sourceStartFrame -= 1; second.sourceEndFrame -= 1;
  second.startFrame += 1; second.sourceStartFrame += 1;
  assert.throws(() => resolvePresenterUseAudio(snapshot, use), /断口或重叠/u);
});

test("同声音整体移位、跨 Scene 和旧台词删除仍可采用子源；换声音或错误裁点失败", () => {
  const { snapshot, dialogue, item, performance, use, speech } = fixture();
  assert.equal(avatarBindingMatches(snapshot, performance, item), true);
  assert.doesNotThrow(() => assertProjectGraphValid(snapshot));
  snapshot.script.revision = 99;
  for (const range of [dialogue, item, use]) { range.startFrame += 300; range.endFrame += 300; }
  assert.equal(avatarBindingMatches(snapshot, performance, item), true);
  const before = speech.sourceHash;
  speech.sourceHash = "same-words-new-waveform";
  assert.equal(avatarBindingMatches(snapshot, performance, item), false);
  speech.sourceHash = before;
  item.sourceStartFrame += 1; item.sourceEndFrame += 1;
  assert.equal(avatarBindingMatches(snapshot, performance, item), false);
});

test("同一出镜可分别采用短源，不能用短输出或循环补满", () => {
  const { snapshot, item, performance, receipt } = fixture();
  receipt.input.audio.endSample = 192000;
  Object.assign(snapshot.assets.find(asset => asset.id === item.assetId)!.metadata!, { durationMs: 2000 });
  item.endFrame = 360; item.sourceEndFrame = 60;
  assert.equal(avatarBindingMatches(snapshot, performance, item), true);
  item.endFrame = 390; item.sourceEndFrame = 90;
  assert.equal(avatarBindingMatches(snapshot, performance, item), false);
});

test("换项目帧率只更新当前使用，不改历史生成回执", () => {
  const { snapshot, receipt } = fixture();
  const historical = structuredClone(receipt);
  const converted = projectFrameRateChange(snapshot, 60).snapshot;
  const performance = converted.actorPerformances[0];
  const item = converted.timeline.items.find(entry => entry.id === performance.timelineItemId)!;
  assert.equal(converted.visualTreatments[0].presenterUses![0].startFrame, 660);
  assert.deepEqual(performance.sourceBinding!.receipt, historical);
  assert.deepEqual(performance.generationRange, historical.generationRange);
  assert.equal(avatarBindingMatches(converted, performance, item), true);
});

test("非整数倍帧率重算当前采样和源裁点，历史输入仍不可改", () => {
  const { snapshot, item, performance, use, receipt } = fixture();
  use.startFrame = item.startFrame = 331;
  use.endFrame = item.endFrame = 389;
  item.sourceStartFrame = 31; item.sourceEndFrame = 89;
  performance.sourceBinding!.audio = resolvePresenterUseAudio(snapshot, use);
  const originalInput = structuredClone(receipt.input.audio);
  const result = projectFrameRateChange(snapshot, 24);
  assert.equal(result.report.canApply, true, JSON.stringify(result.report.blockers));
  assert.deepEqual(result.snapshot.actorPerformances[0].sourceBinding!.receipt.input.audio, originalInput);
  assert.equal(avatarBindingMatches(result.snapshot, result.snapshot.actorPerformances[0], result.snapshot.timeline.items.find(entry => entry.id === item.id)!), true);
});

test("质量接受 v2 历史生成范围，出镜撤回后的闲置源不产生人物缺项", () => {
  const { snapshot, item, performance, treatment, scene } = fixture();
  assert.equal(evaluateQuality(snapshot, 1).issues.some(issue => ["ACTOR_SPEECH_VERSION_MISMATCH", "ACTOR_GENERATION_RANGE_INVALID"].includes(issue.code)), false);
  const beat = snapshot.story.beats[0];
  if (beat) throw new Error("隔离快照不应含默认 Beat");
  snapshot.story.beats.push({ id: "beat", title: "人物回应", purpose: "核对实际采用", order: 0, semanticUnitIds: [], sceneIds: [scene.id] });
  scene.narrativeBeatIds.push("beat");
  assert.equal(productionReconciliation(snapshot)[0].structuralGaps.some(gap => gap.objectIds.includes("use")), false);
  item.disabled = true;
  assert.equal(productionReconciliation(snapshot)[0].structuralGaps.some(gap => gap.objectIds.includes("use")), true);
  treatment.presenterUses = [];
  performance.status = "stale";
  assert.equal(productionReconciliation(snapshot)[0].structuralGaps.some(gap => gap.objectIds.includes("use")), false);
  assert.doesNotThrow(() => assertProjectGraphValid(snapshot));
  assert.equal(evaluateQuality(snapshot, 2).issues.some(issue => issue.code.startsWith("ACTOR_") && issue.level === "blocking"), false);
});

test("烘焙人物按作品实际位置核对，隐藏外层人物也不能掩盖错误嘴型", () => {
  const { snapshot, item, scene } = fixture();
  const motion = createMediaAsset({ name: "motion", kind: "derived", managedPath: "motion.mov", sourceHash: "motion-hash" });
  motion.status = "ready";
  motion.motion = {
    jobId: "motion-job", version: "version", engineVersion: "test", sourcePath: "test.tsx", framesDirectory: "frames",
    frameCount: 60, fps: 30, width: snapshot.timeline.width, height: snapshot.timeline.height,
    videoSources: [{ slot: "person", assetId: item.assetId, sourceHash: "actor-hash", sourceStartMs: 1000, sourceEndMs: 3000, startFrame: 0, endFrame: 60 }]
  };
  snapshot.assets.push(motion);
  const cue = createEffectCue({ sceneId: scene.id, type: "ManagedMotion", layer: "fullscreen", startFrame: 330, endFrame: 390, assetBindings: [{ slot: "motion", assetId: motion.id }], visualComposition: { role: "primary", replacesActorItemIds: [item.id] } });
  Object.assign(cue.motion, { enterPreset: "none", exitPreset: "none", enterFrames: 0, exitFrames: 0, holdFrames: 60 });
  snapshot.effectCues.push(cue);
  assert.equal(evaluateQuality(snapshot, 1).issues.some(issue => issue.code === "MOTION_ACTOR_SOURCE_STALE"), false);
  cue.startFrame += 30; cue.endFrame += 30;
  assert.equal(evaluateQuality(snapshot, 2).issues.some(issue => issue.code === "MOTION_ACTOR_SOURCE_STALE"), true);
});
