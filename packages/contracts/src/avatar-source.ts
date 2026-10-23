import type { ActorCapabilityProfile, ActorGenerationRange, Asset, Id } from "./index.js";

/** 所有可见区间使用项目帧；段内裁点必须来自真实对齐或局部试听。 */
export interface PresenterUse {
  id: Id;
  speechAssetId: Id;
  referenceImageAssetId: Id;
  startFrame: number;
  endFrame: number;
  performanceNote: string;
  timingEvidence: { kind: "aligned" | "audio_review"; note: string };
}

/** 文件采样位置独立于项目帧率；连续 Dialogue 项可共同映射到同一文件。 */
export interface AvatarAudioSlice {
  assetId: Id;
  sourceHash: string;
  sampleRate: number;
  startSample: number;
  endSample: number;
}

export interface AvatarSourceInput {
  audio: AvatarAudioSlice;
  referenceImageAssetId: Id;
  referenceImageHash: string;
  performanceNote: string;
  prompt?: string;
  profile: ActorCapabilityProfile;
}

export interface AvatarSourceReceipt {
  contractVersion: 2;
  jobId: Id;
  assetId: Id;
  input: AvatarSourceInput;
  generationRange: ActorGenerationRange;
  generationFps: number;
  /** 输出相对裁片的偏移，单位秒；未确认的偏移不得猜测。 */
  outputOffsetSeconds: number;
  outputHash: string;
  audioSliceHash?: string;
}

export interface AvatarSourceBinding {
  presenterUseId: Id;
  receipt: AvatarSourceReceipt;
  audio: AvatarAudioSlice;
}

export interface AvatarSourceJobPayload extends Record<string, unknown> {
  contractVersion: 2;
  requestedRevision: number;
  presenterUseIds: Id[];
  sourceGroupKey: string;
  planFingerprint: string;
  input: AvatarSourceInput;
  /** 固定源文件描述，恢复旧 Run 不依赖当前 SpeechAsset。 */
  speechFile: Asset;
  referenceImage: Asset;
  generationRange: ActorGenerationRange;
  generationFps: number;
  speechAssetId: Id;
  capabilityProfileId: Id;
  workflowId: string;
  referenceImageAssetId: Id;
  prompt?: string;
  attempt?: string;
}
