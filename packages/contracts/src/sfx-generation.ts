import type { AssetRequest, MediaMetadata } from "./index.js";

export interface SfxGenerationInput {
  projectId: string;
  baseRevision: number;
  requestId: string;
  prompt: string;
  maxDurationSeconds: number;
  seed?: number;
  idempotencyKey: string;
}

/** 固定声音需求与实际种子；项目其他编辑不改变已经发出的生成请求。 */
export interface SfxGenerationPayload extends Record<string, unknown> {
  requestedRevision: number;
  requestId: string;
  requestVersion: string;
  requestSnapshot: AssetRequest;
  soundPlanId: string;
  soundIntentId: string;
  planVersion: number;
  workflowId: string;
  bridgeApiBaseUrl: string;
  prompt: string;
  maxDurationSeconds: number;
  seed: number;
  inputDigest: string;
}

/** Worker 已取得并核验的原文件；不包含听感或采用通过状态。 */
export interface GeneratedAudioFile {
  path: string;
  relativePath: string;
  name: string;
  contentHash: string;
  sourceHash: string;
  durationMs: number;
  metadata: MediaMetadata;
}

export interface SfxGenerationResult extends Record<string, unknown> {
  assetId: string;
  revision: number;
  runId: string;
  workflowId: string;
  schemaVersion: string;
  sourceHash: string;
  durationMs: number;
  requestedMaxDurationSeconds: number;
  seed: number;
  requestId: string;
  requestVersion: string;
}
