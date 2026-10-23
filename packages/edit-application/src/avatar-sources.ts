import { existsSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";
import type { ActorLayout, Asset, AvatarSourceJobPayload, AvatarSourceReceipt, BridgeRunAudit, MediaMetadata } from "@videocut/contracts";
import { createActorPerformance, createId, createMediaAsset, createTimelineItem, DomainError, now, trackByName } from "@videocut/domain";
import { resolvePresenterUseAudio } from "../../edit-domain/src/avatar-source.js";
import type { EditingApplication } from "./index.js";
import { avatarInputIdentity, compatibleAvatarSource, currentPresenterUses, prepareAvatarSources } from "./avatar-source-planning.js";
import { readAvatarSourceSnapshot } from "./avatar-legacy-source.js";

export interface SubmitAvatarSourceInput {
  contractVersion: 2;
  projectId: string;
  baseRevision: number;
  capabilityProfileId: string;
  presenterUseIds: string[];
  sourceGroupKey?: string;
  planFingerprint?: string;
  prompt?: string;
  attempt?: string;
  idempotencyKey?: string;
}

export function submitAvatarSource(app: EditingApplication, input: SubmitAvatarSourceInput) {
  const state = app.readProject(input.projectId);
  if (state.revision.number !== input.baseRevision) throw new DomainError("项目版本已变化，请重新读取当前人物需求", "REVISION_CONFLICT");
  const plan = prepareAvatarSources(readAvatarSourceSnapshot(app, state.snapshot), input);
  if (input.planFingerprint && input.planFingerprint !== plan.planFingerprint) throw new DomainError("人物源预检已变化，请使用当前范围", "AVATAR_PLAN_STALE");
  if (plan.gaps.length) throw new DomainError(plan.gaps.map(g => g.message).join("；"), plan.gaps[0]!.code);
  const group = input.sourceGroupKey ? plan.groups.find(g => g.sourceGroupKey === input.sourceGroupKey)
    : plan.groups.length === 1 ? plan.groups[0] : undefined;
  if (!group) throw new DomainError(plan.groups.length ? "存在多个独立范围，请使用 prepare_avatar_sources 返回的 source_group_key 分别提交" : "已有源已覆盖当前需求，无需生成", plan.groups.length ? "AVATAR_SOURCE_GROUP_REQUIRED" : "AVATAR_SOURCE_ALREADY_AVAILABLE");
  const profile = group.input.profile;
  if (profile.provider !== "ltx23_audio_to_video" || !profile.supportsReferenceImage || !profile.inputModes.includes("audio")
    || !profile.supportsAudioDrivenLipSync || !profile.maskModes.includes("none")) {
    throw new DomainError("工作流需要已确认的照片、音频驱动口型与无 Mask 输出能力", "AVATAR_CAPABILITY_UNSUPPORTED");
  }
  const snapshot = state.snapshot;
  const payload: AvatarSourceJobPayload = {
    contractVersion: 2, requestedRevision: state.revision.number,
    presenterUseIds: group.presenterUseIds, sourceGroupKey: group.sourceGroupKey, planFingerprint: plan.planFingerprint,
    input: structuredClone(group.input),
    speechFile: structuredClone(snapshot.assets.find(a => a.id === group.input.audio.assetId)!),
    referenceImage: structuredClone(snapshot.assets.find(a => a.id === group.input.referenceImageAssetId)!),
    generationRange: group.generationRange, generationFps: snapshot.timeline.fps,
    speechAssetId: snapshot.speechAsset!.id, capabilityProfileId: profile.id, workflowId: profile.workflowId,
    referenceImageAssetId: group.input.referenceImageAssetId, prompt: group.input.prompt, attempt: input.attempt
  };
  const job = app.repository.createJob({ projectId: input.projectId, kind: "avatar_generation", payload,
    idempotencyKey: input.idempotencyKey ?? `avatar:v2:${avatarInputIdentity(group.input)}:${input.attempt ?? "initial"}` });
  if (job.payload.contractVersion !== 2 || avatarInputIdentity((job.payload as AvatarSourceJobPayload).input) !== group.sourceGroupKey
    || job.payload.attempt !== input.attempt) {
    throw new DomainError("该幂等键已经对应另一组固定输入，请读回原任务", "AVATAR_IDEMPOTENCY_CONFLICT");
  }
  return job;
}

export interface CompleteAvatarSourceInput {
  projectId: string; jobId: string; bridgeAudit: BridgeRunAudit;
  actorVideo: { path: string; relativePath: string; name: string; contentHash: string; sourceHash: string; durationMs: number; metadata: MediaMetadata };
}

export function completeAvatarSource(app: EditingApplication, input: CompleteAvatarSourceInput) {
  const job = app.repository.getJob(input.jobId);
  if (job.projectId !== input.projectId || job.kind !== "avatar_generation" || job.payload.contractVersion !== 2) {
    throw new DomainError("任务不是当前项目的 v2 人物源", "AVATAR_JOB_NOT_FOUND");
  }
  const payload = job.payload as AvatarSourceJobPayload;
  const current = app.readProject(input.projectId);
  let asset = current.snapshot.assets.find(a => a.avatarSourceReceipt?.jobId === job.id);
  const duplicate = Boolean(asset);
  const output = input.actorVideo;
  const relativePath = relative(resolve(current.snapshot.project.rootPath), resolve(output.path));
  if (!duplicate && (!isAbsolute(output.path) || !relativePath || relativePath === ".." || relativePath.startsWith(`..${sep}`)
    || isAbsolute(relativePath) || !existsSync(output.path))) throw new DomainError("输出不在当前受管目录中", "AVATAR_OUTPUT_PATH_INVALID");
  if (!duplicate && (!output.contentHash || output.contentHash !== output.sourceHash || !Number.isFinite(output.durationMs)
    || output.metadata.videoCodec?.toLowerCase() !== "h264"
    || (output.metadata.audioCodec && output.metadata.audioCodec.toLowerCase() !== "aac"))) {
    throw new DomainError("输出缺少有效哈希或 H.264/AAC 媒体", "INVALID_AVATAR_OUTPUT");
  }
  const requiredMs = (payload.input.audio.endSample - payload.input.audio.startSample) / payload.input.audio.sampleRate * 1000;
  if (!duplicate && output.durationMs + 0.001 < requiredMs) throw new DomainError("人物源短于真实裁片，不能冻结、循环或变速补足", "AVATAR_OUTPUT_TOO_SHORT");
  // SQLite CAS 提交同步完成；读取最新版本后仅登记源，不触碰旧分镜。
  const state = duplicate ? current : app.repository.commit(input.projectId, current.revision.number, "登记人物生成源", (snapshot, impact) => {
    asset = createMediaAsset({ name: output.name, kind: "actor_video", managedPath: relativePath, sourceHash: output.sourceHash,
      role: "a_roll", provenance: { source: "generated", provider: payload.input.profile.provider,
        sourceUrl: `bridge-run:${input.bridgeAudit.runId}`, originalAssetId: payload.referenceImageAssetId, acquiredAt: now() }, tags: ["avatar", "generated"] });
    asset.status = "ready";
    asset.metadata = output.metadata;
    const checkpoint = job.result?.avatarSpeechSlice as { contentHash?: string } | undefined;
    asset.avatarSourceReceipt = {
      contractVersion: 2, jobId: job.id, assetId: asset.id, input: structuredClone(payload.input),
      generationRange: structuredClone(payload.generationRange), generationFps: payload.generationFps,
      outputOffsetSeconds: 0, outputHash: output.contentHash, audioSliceHash: checkpoint?.contentHash
    };
    snapshot.assets.push(asset);
    impact.changed.push(asset.id);
  });
  const receipt = asset!.avatarSourceReceipt!;
  app.repository.updateJob(job.id, { status: job.status, result: { ...job.result, actorAssetId: asset!.id,
    avatarSourceReceipt: receipt, revision: state.revision.number,
    actorVideo: { relativePath: asset!.managedPath, contentHash: asset!.sourceHash, durationMs: asset!.metadata?.durationMs } } });
  return { state, asset: asset!, avatarSourceReceipt: receipt, duplicate };
}

export interface AdoptAvatarSourceInput {
  projectId: string; baseRevision: number; presenterUseId: string; assetId: string;
  /** 可只采用当前需求的子范围；省略使用完整需求。 */
  startFrame?: number; endFrame?: number; layout?: ActorLayout;
}

export function adoptAvatarSource(app: EditingApplication, input: AdoptAvatarSourceInput) {
  const knownSources = readAvatarSourceSnapshot(app, app.readProject(input.projectId).snapshot);
  return app.repository.commit(input.projectId, input.baseRevision, "采用当前人物源", (snapshot, impact) => {
    const use = currentPresenterUses(snapshot).find(u => u.id === input.presenterUseId);
    if (!use) throw new DomainError("当前分镜不再需要该人物范围", "PRESENTER_USE_NOT_FOUND");
    const audio = resolvePresenterUseAudio(snapshot, use);
    const asset = snapshot.assets.find(a => a.id === input.assetId);
    const receipt = asset?.avatarSourceReceipt ?? knownSources.assets.find(a => a.id === input.assetId)?.avatarSourceReceipt;
    const image = snapshot.assets.find(a => a.id === use.referenceImageAssetId);
    if (!asset || asset.status !== "ready" || !receipt || asset.sourceHash !== receipt.outputHash
      || !compatibleAvatarSource(receipt, { ...receipt.input, audio, referenceImageHash: image?.sourceHash ?? "", performanceNote: use.performanceNote })) {
      throw new DomainError("人物源的实际声音、身份或表演不匹配当前需求", "AVATAR_SOURCE_MISMATCH");
    }
    const start = input.startFrame ?? use.startFrame, end = input.endFrame ?? use.endFrame;
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < use.startFrame || end > use.endFrame || end <= start) {
      throw new DomainError("采用范围必须位于当前人物需要内", "AVATAR_USE_RANGE_INVALID");
    }
    const rangeAudio = resolvePresenterUseAudio(snapshot, { ...use, startFrame: start, endFrame: end });
    if (rangeAudio.startSample < receipt.input.audio.startSample || rangeAudio.endSample > receipt.input.audio.endSample) {
      throw new DomainError("人物源不足以覆盖新增范围，请补源", "AVATAR_SOURCE_RANGE_MISSING");
    }
    const track = trackByName(snapshot, "Actor / A-roll");
    if (track.locked) throw new DomainError("Actor / A-roll 轨已锁定", "TRACK_LOCKED");
    const sourceStart = Math.round(((rangeAudio.startSample - receipt.input.audio.startSample) / audio.sampleRate
      + receipt.outputOffsetSeconds) * snapshot.timeline.fps);
    const duration = end - start;
    if (sourceStart < 0 || (sourceStart + duration) / snapshot.timeline.fps * 1000 > (asset.metadata?.durationMs ?? 0) + 0.001) {
      throw new DomainError("人物源实际长度不足", "AVATAR_OUTPUT_TOO_SHORT");
    }
    const existing = snapshot.actorPerformances.filter(p => p.sourceBinding?.presenterUseId === use.id);
    const exact = existing.find(p => {
      const item = snapshot.timeline.items.find(i => i.id === p.timelineItemId);
      return item?.startFrame === start && item.endFrame === end;
    });
    // 新源已就绪才切换重叠部分，前后仍合用的表演继续保留。
    for (const old of existing) {
      if (old === exact) continue;
      const oldItem = snapshot.timeline.items.find(i => i.id === old.timelineItemId);
      if (!oldItem || oldItem.disabled || oldItem.endFrame <= start || oldItem.startFrame >= end) continue;
      const original = { ...oldItem };
      if (original.startFrame < start && original.endFrame > end) {
        const tail = { ...original, id: createId("item"), startFrame: end,
          sourceStartFrame: original.sourceStartFrame + end - original.startFrame };
        snapshot.timeline.items.push(tail);
        snapshot.actorPerformances.push({ ...structuredClone(old), id: createId("actor_performance"), timelineItemId: tail.id });
      }
      if (original.startFrame < start) {
        oldItem.endFrame = start;
        oldItem.sourceEndFrame = original.sourceStartFrame + start - original.startFrame;
      } else if (original.endFrame > end) {
        oldItem.startFrame = end;
        oldItem.sourceStartFrame = original.sourceStartFrame + end - original.startFrame;
      } else {
        oldItem.disabled = true;
        old.status = "stale";
      }
      impact.changed.push(oldItem.id, old.id);
    }
    const item = exact ? snapshot.timeline.items.find(i => i.id === exact.timelineItemId)! : createTimelineItem({
      trackId: track.id, assetId: asset.id, startFrame: start, endFrame: end,
      sourceStartFrame: sourceStart, sourceEndFrame: sourceStart + duration, gainDb: -96
    });
    // 跨技术 Scene 的连续人物不伪造一个只覆盖局部的 sceneId。
    item.sceneId = snapshot.scenes.find(s => s.startFrame <= start && s.endFrame >= end)?.id;
    item.assetId = asset.id; item.sourceStartFrame = sourceStart; item.sourceEndFrame = sourceStart + duration;
    item.disabled = false; item.mediaAudioPolicy = "mute"; item.gainDb = -96;
    const performance = exact ?? createActorPerformance({ timelineItemId: item.id, source: "generated",
      maskMode: "none", audioMode: "use_dialogue_track", note: use.performanceNote });
    performance.sourceBinding = { presenterUseId: use.id, receipt: structuredClone(receipt), audio };
    // 旧长源经历史输入核对后，仅在实际采用时保存当前关联。
    asset.avatarSourceReceipt ??= structuredClone(receipt);
    performance.speechAssetId = snapshot.speechAsset?.id;
    performance.scriptRevision = snapshot.speechAsset?.scriptRevision;
    performance.generationJobId = receipt.jobId; performance.generationRange = structuredClone(receipt.generationRange);
    performance.capabilityProfileId = receipt.input.profile.id; performance.status = "ready";
    performance.layout = input.layout ?? performance.layout;
    if (!exact) { snapshot.timeline.items.push(item); snapshot.actorPerformances.push(performance); }
    impact.changed.push(item.id, performance.id);
    impact.dirtyRanges.push({ startFrame: start, endFrame: end, reason: "人物源采用后需检查真实口型与共同编排" });
  });
}
