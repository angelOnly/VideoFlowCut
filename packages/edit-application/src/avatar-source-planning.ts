import { createHash } from "node:crypto";
import type { AvatarAudioSlice, AvatarSourceInput, AvatarSourceReceipt, PresenterUse, ProjectSnapshot } from "@videocut/contracts";
import { DomainError } from "@videocut/domain";
import { resolvePresenterUseAudio } from "../../edit-domain/src/avatar-source.js";

export const avatarDigest = (value: unknown): string => createHash("sha256").update(JSON.stringify(value)).digest("hex");

export interface AvatarSourcePlanInput {
  presenterUseIds?: string[];
  capabilityProfileId: string;
  prompt?: string;
  attempt?: string;
}

export function currentPresenterUses(snapshot: ProjectSnapshot): PresenterUse[] {
  return snapshot.visualTreatments.filter(t => t.status === "ready").flatMap(t => t.presenterUses ?? []);
}

/** 摘要仅包含生成依赖，窗口位置、字幕和整片 Revision 不改变源身份。 */
export function avatarInputIdentity(input: AvatarSourceInput): string {
  const { assetId: _asset, ...audio } = input.audio;
  return avatarDigest({
    audio, imageHash: input.referenceImageHash, performanceNote: input.performanceNote,
    prompt: input.prompt, workflow: input.profile.workflowId, provider: input.profile.provider
  });
}

export function compatibleAvatarSource(receipt: AvatarSourceReceipt, input: AvatarSourceInput): boolean {
  return receipt.input.audio.sourceHash === input.audio.sourceHash
    && receipt.input.audio.sampleRate === input.audio.sampleRate
    && receipt.input.referenceImageHash === input.referenceImageHash
    && receipt.input.performanceNote === input.performanceNote
    && receipt.input.prompt === input.prompt
    && receipt.input.profile.workflowId === input.profile.workflowId;
}

/** 只计算明确需求；undefined 不推断全文，分离范围不取大包络。 */
export function prepareAvatarSources(snapshot: ProjectSnapshot, options: AvatarSourcePlanInput) {
  const profile = snapshot.actorCapabilityProfiles.find(p => p.id === options.capabilityProfileId);
  if (!profile) throw new DomainError("人物能力档案不存在", "ACTOR_CAPABILITY_NOT_FOUND");
  const all = currentPresenterUses(snapshot);
  const ids = options.presenterUseIds ?? all.map(u => u.id);
  if (new Set(ids).size !== ids.length) throw new DomainError("人物使用 ID 不能重复", "PRESENTER_USE_DUPLICATE");
  const uses = ids.map(id => {
    const matches = all.filter(u => u.id === id);
    if (matches.length !== 1) throw new DomainError("人物使用不存在、已失效或 ID 重复", "PRESENTER_USE_NOT_FOUND");
    return matches[0]!;
  });
  const reusable: Array<{ presenterUseId: string; assetId: string; audio: AvatarAudioSlice }> = [];
  const gaps: Array<{ presenterUseId: string; code: string; message: string }> = [];
  const pending: Array<{ presenterUseIds: string[]; input: AvatarSourceInput; startFrame: number; endFrame: number }> = [];
  for (const use of uses) {
    try {
      if (!use.timingEvidence?.note?.trim() || !["aligned", "audio_review"].includes(use.timingEvidence.kind)) {
        throw new DomainError("段内边界缺少真实对齐或局部试听依据", "AVATAR_TIMING_EVIDENCE_REQUIRED");
      }
      const audio = resolvePresenterUseAudio(snapshot, use);
      const speech = snapshot.speechAsset;
      if (!speech || speech.status !== "ready" || snapshot.assets.find(a => a.id === speech.assetId)?.sourceHash !== audio.sourceHash) {
        throw new DomainError("请校准当前正式声音与语音段来源后再生成", "AVATAR_SPEECH_TRACE_MISSING");
      }
      if (use.timingEvidence.kind === "aligned") {
        const alignment = snapshot.speechAlignment;
        const words = alignment?.status === "ready" && alignment.speechAssetId === speech.id
          && alignment.scriptRevision === speech.scriptRevision ? alignment.words : [];
        const boundaries = [...speech.timing.segments, ...words].flatMap(t => [t.startMs, t.endMs]);
        const atBoundary = (sample: number) => boundaries.some(ms =>
          Math.round(Math.round(ms * snapshot.timeline.fps / 1000) * audio.sampleRate / snapshot.timeline.fps) === sample);
        if (!atBoundary(audio.startSample) || !atBoundary(audio.endSample)) {
          throw new DomainError("段内裁点没有对应的真实对齐边界，请先取得局部音频核验", "AVATAR_TIMING_EVIDENCE_REQUIRED");
        }
      }
      const image = snapshot.assets.find(a => a.id === use.referenceImageAssetId);
      if (!image || image.status !== "ready" || !["image", "derived"].includes(image.kind) || !image.sourceHash) {
        throw new DomainError("人物照片尚未就绪", "AVATAR_REFERENCE_IMAGE_NOT_READY");
      }
      const input: AvatarSourceInput = { audio, referenceImageAssetId: image.id, referenceImageHash: image.sourceHash,
        performanceNote: use.performanceNote, prompt: options.prompt?.trim() || undefined, profile: structuredClone(profile) };
      let missing = [{ start: audio.startSample, end: audio.endSample }];
      for (const asset of snapshot.assets) {
        if (options.attempt) break;
        const receipt = asset.avatarSourceReceipt;
        if (asset.status !== "ready" || !receipt || asset.sourceHash !== receipt.outputHash || !compatibleAvatarSource(receipt, input)) continue;
        const source = receipt.input.audio;
        const availableEnd = Math.min(source.endSample, source.startSample + Math.floor(
          ((asset.metadata?.durationMs ?? 0) / 1000 - receipt.outputOffsetSeconds) * source.sampleRate));
        missing = missing.flatMap(range => {
          const start = Math.max(range.start, source.startSample);
          const end = Math.min(range.end, availableEnd);
          if (end <= start) return [range];
          reusable.push({ presenterUseId: use.id, assetId: asset.id, audio: { ...audio, startSample: start, endSample: end } });
          return [...(range.start < start ? [{ start: range.start, end: start }] : []),
            ...(end < range.end ? [{ start: end, end: range.end }] : [])];
        });
      }
      for (const range of missing) {
        pending.push({ presenterUseIds: [use.id], input: { ...input, audio: { ...audio, startSample: range.start, endSample: range.end } },
          startFrame: use.startFrame + Math.round((range.start - audio.startSample) / audio.sampleRate * snapshot.timeline.fps),
          endFrame: use.startFrame + Math.round((range.end - audio.startSample) / audio.sampleRate * snapshot.timeline.fps) });
      }
    } catch (error) {
      if (!(error instanceof DomainError)) throw error;
      gaps.push({ presenterUseId: use.id, code: error.code, message: error.message });
    }
  }
  pending.sort((a, b) => a.input.audio.startSample - b.input.audio.startSample);
  const merged: typeof pending = [];
  for (const part of pending) {
    const previous = merged.find(p => compatibleAvatarSource({ input: p.input } as AvatarSourceReceipt, part.input)
      && p.input.audio.assetId === part.input.audio.assetId
      && p.input.audio.endSample >= part.input.audio.startSample
      // 仅合并同一个连续项目时间映射；重复移位使用仍可共享同一源。
      && Math.abs((p.startFrame - part.startFrame) / snapshot.timeline.fps
        - (p.input.audio.startSample - part.input.audio.startSample) / part.input.audio.sampleRate) < 1 / snapshot.timeline.fps);
    if (previous && (Math.max(previous.input.audio.endSample, part.input.audio.endSample) - previous.input.audio.startSample)
      / part.input.audio.sampleRate <= profile.maxDurationSeconds) {
      previous.input.audio.endSample = Math.max(previous.input.audio.endSample, part.input.audio.endSample);
      previous.endFrame = Math.max(previous.endFrame, part.endFrame);
      previous.presenterUseIds = [...new Set([...previous.presenterUseIds, ...part.presenterUseIds])];
    } else merged.push(structuredClone(part));
  }
  const groups = merged.flatMap(part => {
    if ((part.input.audio.endSample - part.input.audio.startSample) / part.input.audio.sampleRate > profile.maxDurationSeconds) {
      gaps.push({ presenterUseId: part.presenterUseIds[0]!, code: "AVATAR_DURATION_EXCEEDED", message: "必要连续范围超过工作流时长，请按自然接点调整范围" });
      return [];
    }
    const speech = snapshot.speechAsset!;
    // SpeechTiming 的毫秒是母音频时间；不以项目位置猜台词来源。
    const segmentIds = speech.timing.segments.filter(s => s.endMs > part.input.audio.startSample / part.input.audio.sampleRate * 1000
      && s.startMs < part.input.audio.endSample / part.input.audio.sampleRate * 1000).map(s => s.speechSegmentId);
    if (!segmentIds.length) {
      gaps.push({ presenterUseId: part.presenterUseIds[0]!, code: "AVATAR_SPEECH_TRACE_MISSING", message: "裁片没有可追溯的真实语音段" });
      return [];
    }
    return [{ ...part, sourceGroupKey: avatarInputIdentity(part.input),
      generationRange: { startFrame: part.startFrame, endFrame: part.endFrame, speechSegmentIds: segmentIds } }];
  });
  return { contractVersion: 2 as const, planFingerprint: avatarDigest({ uses, reusable, groups, gaps }), reusable, groups, gaps };
}
