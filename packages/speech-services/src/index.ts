import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { mkdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { basename, extname, isAbsolute, join } from "node:path";
import type { Asset, BridgeRunAudit, JobRecord, MediaMetadata, ProjectSnapshot, SourceAudioAlignment, SpeechAsset, SpeechSegmentAsset, SpeechTiming } from "@videocut/contracts";
import { BridgeError, BridgeRunLostError, FUNASR_SOURCE_CAPTION_WORKFLOW_ID, FUNASR_WORKFLOW_ID, OMNIVOICE_WORKFLOW_ID, ComfyUIBridgeClient, type BridgeRun, type BridgeRunSubmission, type BridgeWorkflow } from "@videocut/bridge";
import { assetById, createId, createMediaAsset, DomainError, millisecondsToFrames, now, sourceAudioAlignmentOwnerMatches } from "@videocut/domain";
import { EditingApplication, sourceCaptionAlignmentTargetFingerprint } from "@videocut/application";

export class MediaProcessError extends Error {
  constructor(message: string, public readonly output: string,
    public readonly details?: { exitCode?: number | null; systemCode?: string; timedOut?: boolean }) {
    super(message);
  }
}

export async function runProcess(command: string, args: string[], timeoutMs = 120_000): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true });
    let output = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new MediaProcessError(`${command} 执行超时`, output, { timedOut: true }));
    }, timeoutMs);
    child.stdout.on("data", (chunk: Buffer) => { output += chunk.toString(); });
    child.stderr.on("data", (chunk: Buffer) => { output += chunk.toString(); });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(new MediaProcessError(`无法启动 ${command}：${error.message}`, output, { systemCode: (error as NodeJS.ErrnoException).code }));
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(output);
      else reject(new MediaProcessError(`${command} 失败，退出码 ${code}`, output, { exitCode: code }));
    });
  });
}

const safeOutputName = (value: string) => value.replace(/[^a-zA-Z0-9._-]/g, "_");
const assetPath = (snapshot: ProjectSnapshot, asset: Asset) => isAbsolute(asset.managedPath) ? asset.managedPath : join(snapshot.project.rootPath, asset.managedPath);

async function sourceCaptionFileDigest(path: string): Promise<string> {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk as Buffer);
  return hash.digest("hex");
}

export type BridgeRunReporter = (audit: BridgeRunAudit) => void | Promise<void>;

/**
 * 只记录请求字段、文件槽位和 Bridge 响应子集；媒体二进制仍保存在受管 Asset 中。
 * 这份审计会先写入本地 Job，随后在成功时一并落入 Transcript / SpeechSegmentAsset。
 */
function createBridgeRunAudit(
  submission: BridgeRunSubmission,
  completed?: BridgeRun,
  submittedAt = now(),
  metadata?: Record<string, string | number | boolean>
): BridgeRunAudit {
  return {
    workflowId: submission.workflow.id,
    runId: submission.run.id,
    schemaVersion: submission.workflow.schemaVersion,
    schemaRetryCount: submission.schemaRetryCount,
    submittedAt,
    completedAt: completed ? now() : undefined,
    request: {
      fieldValues: submission.request.fieldValues,
      fileSlots: submission.request.files?.map((file) => ({
        id: file.slot.id,
        kind: file.slot.mediaKind,
        fileName: basename(file.path)
      })) ?? [],
      metadata
    },
    response: completed ? {
      status: completed.status,
      error: completed.error,
      outputs: completed.outputs.map((output) => ({
            kind: output.kind,
        fileName: output.fileName,
        mime: output.mime,
        outputId: output.outputId,
          text: output.text,
      value: output.value
      }))
    } : undefined
  };
}

function completeBridgeRunAudit(previous: BridgeRunAudit, completed: BridgeRun): BridgeRunAudit {
  return {
    ...previous,
    completedAt: now(),
    response: {
      status: completed.status,
      error: completed.error,
      outputs: completed.outputs.map((output) => ({
            kind: output.kind,
        fileName: output.fileName,
        mime: output.mime,
        outputId: output.outputId,
          text: output.text,
      value: output.value
      }))
    }
  };
}

/**
 * 只接受 ffmpeg 明确标为带 Alpha 的常见像素格式；不把普通 PNG、pal8 或文件扩展名
 * 误判为透明人物 Mask。遇到未知格式时保守返回 false，由后续人工/Provider 能力链路降级。
 */
function hasVerifiedAlphaPixelFormat(pixelFormat: string | undefined): boolean {
  const normalized = pixelFormat?.trim().toLowerCase();
  return Boolean(normalized && /^(?:rgba|argb|bgra|abgr|yuva|gbrap|ya\d|ayuv)/u.test(normalized));
}

export async function probeMedia(filePath: string): Promise<MediaMetadata> {
  const output = await runProcess("ffprobe", [
    "-v", "error",
    "-show_entries", "format=duration:format=format_name:stream=codec_type,codec_name,pix_fmt,width,height,r_frame_rate,sample_rate,channels",
    "-of", "json",
    filePath
  ], 60_000);
  const data = JSON.parse(output) as {
    format?: { duration?: string; format_name?: string };
    streams?: Array<{ codec_type?: string; codec_name?: string; pix_fmt?: string; width?: number; height?: number; r_frame_rate?: string; sample_rate?: string; channels?: number }>;
  };
  const video = data.streams?.find((stream) => stream.codec_type === "video");
  const audio = data.streams?.find((stream) => stream.codec_type === "audio");
  const [numerator, denominator] = video?.r_frame_rate?.split("/").map(Number) ?? [];
  const fps = numerator && denominator ? numerator / denominator : undefined;
  return {
    durationMs: Math.round(Number(data.format?.duration ?? 0) * 1000),
    width: video?.width,
    height: video?.height,
    fps,
    hasAudio: Boolean(audio),
    audioCodec: audio?.codec_name,
    sampleRate: audio?.sample_rate ? Number(audio.sample_rate) : undefined,
    channels: audio?.channels,
    videoCodec: video?.codec_name,
    pixelFormat: video?.pix_fmt,
    hasAlpha: hasVerifiedAlphaPixelFormat(video?.pix_fmt),
    mime: data.format?.format_name
  };
}

export async function extractAudioForTranscription(snapshot: ProjectSnapshot, asset: Asset): Promise<string> {
  const sourcePath = assetPath(snapshot, asset);
  const targetPath = join(snapshot.project.rootPath, "cache", `transcription-${asset.id}.wav`);
  await mkdir(join(snapshot.project.rootPath, "cache"), { recursive: true });
  await runProcess("ffmpeg", ["-y", "-i", sourcePath, "-vn", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", targetPath], 5 * 60_000);
  return targetPath;
}

/** FunASR 输出只落为完整文本，绝不在这里估算词级时间。 */
export class FunASRService {
  constructor(private readonly application: EditingApplication, private readonly bridge: ComfyUIBridgeClient) {}

  private existingTranscript(projectId: string, assetId: string, runId: string) {
    return this.application.readProject(projectId).snapshot.transcripts.find((transcript) => (
      transcript.assetId === assetId && transcript.source === "funasr" && transcript.bridgeRunId === runId
    ));
  }

  private async applyCompletedRun(
    projectId: string,
    assetId: string,
    completed: BridgeRun,
    audit: BridgeRunAudit,
    onBridgeRun?: BridgeRunReporter
  ): Promise<{ runId: string; textLength: number }> {
    const existing = this.existingTranscript(projectId, assetId, completed.id);
    if (existing) {
      await onBridgeRun?.(existing.bridgeAudit ?? audit);
      return { runId: completed.id, textLength: existing.text.length };
    }
    const output = completed.outputs.find((candidate) => candidate.kind === "text" && typeof candidate.text === "string");
    if (!output?.text?.trim()) throw new DomainError("FunASR 已完成，但没有返回文本输出", "MISSING_TRANSCRIPT_OUTPUT");
    const completedAudit = completeBridgeRunAudit(audit, completed);
    this.application.applyTranscript({
      projectId,
      assetId,
      text: output.text,
      bridgeRunId: completed.id,
      schemaVersion: audit.schemaVersion,
      bridgeAudit: completedAudit
    });
    // 先写入幂等的 Transcript 回执，再补 Job 审计；两步之间崩溃时可按 bridgeRunId 安全恢复。
    await onBridgeRun?.(completedAudit);
    return { runId: completed.id, textLength: output.text.length };
  }

  async transcribe(projectId: string, assetId: string, onBridgeRun?: BridgeRunReporter): Promise<{ runId: string; textLength: number }> {
    const state = this.application.readProject(projectId);
    const asset = assetById(state.snapshot, assetId);
    if (!asset.metadata?.hasAudio) throw new DomainError("素材没有音频，不能提交转写", "NO_AUDIO");
    const audioPath = await extractAudioForTranscription(state.snapshot, asset);
    const submission = await this.bridge.createRunWithWorkflow(FUNASR_WORKFLOW_ID, async (detail) => ({
      fieldValues: {},
      files: [{ slot: this.bridge.findRequiredSlot(detail, "audio"), path: audioPath, mime: "audio/wav" }]
    }), { beforeSubmit: async (pending) => { await onBridgeRun?.(createBridgeRunAudit(pending)); } });
    const submittedAt = now();
    const audit = createBridgeRunAudit(submission, undefined, submittedAt);
    await onBridgeRun?.(audit);
    const completed = await this.bridge.waitForRun(submission.run.id);
    return this.applyCompletedRun(projectId, assetId, completed, audit, onBridgeRun);
  }

  /**
   * 超时或 Worker 重启后只等待已持久化的 run_id。Run 丢失必须显式失败，
   * 绝不能把“查询不到”解释成“从未提交”并自动创建第二次转写。
   */
  async resumeTranscription(
    projectId: string,
    assetId: string,
    audit: BridgeRunAudit,
    onBridgeRun?: BridgeRunReporter
  ): Promise<{ runId: string; textLength: number }> {
    if (audit.workflowId !== FUNASR_WORKFLOW_ID || !audit.runId) {
      throw new DomainError("转写任务的 Bridge 审计与当前 FunASR 工作流不匹配", "TRANSCRIPTION_BRIDGE_AUDIT_INVALID");
    }
    // 将来源 Job 的恢复依据复制到当前 Job，保证再次中断后仍从同一个 run_id 继续。
    await onBridgeRun?.(audit);
    const existing = this.existingTranscript(projectId, assetId, audit.runId);
    if (existing) {
      await onBridgeRun?.(existing.bridgeAudit ?? audit);
      return { runId: audit.runId, textLength: existing.text.length };
    }
    let completed: BridgeRun;
    try {
      completed = await this.bridge.waitForRun(audit.runId);
    } catch (error) {
      if (!(error instanceof BridgeRunLostError)) throw error;
      throw new DomainError(
        `FunASR Run ${audit.runId} 已不可查询，无法确认原转写结果；系统未自动创建新 Run，请确认后重新提交转写。`,
        "TRANSCRIPTION_RUN_LOST_REQUIRES_RESUBMISSION"
      );
    }
    return this.applyCompletedRun(projectId, assetId, completed, audit, onBridgeRun);
  }
}

/**
 * 原声字幕只能按检测到的静音边界分块：不根据字符数或均分时长伪造字幕时间。
 * 这个阈值是字幕可读性的上限，不是对讲话内容的切分判断；连续讲话超限会明确报障。
 */
type SourceCaptionJobPayload = {
  speechSource?: SourceAudioAlignment["speechSource"];
  requestedRevision: number;
  assetId: string;
  timelineItemId: string;
  sourceStartFrame: number;
  sourceEndFrame: number;
  timelineStartFrame: number;
  timelineEndFrame: number;
  targetFingerprint?: string;
  sourceFileHash?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === "object" && !Array.isArray(value));

function integer(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value);
}

function sourceCaptionPayloadFromJob(job: JobRecord): SourceCaptionJobPayload {
  const payload = job.payload;
  const fields = [
    "requestedRevision", "sourceStartFrame", "sourceEndFrame", "timelineStartFrame", "timelineEndFrame"
  ] as const;
  if (job.kind !== "source_caption_alignment" || typeof payload.assetId !== "string" || !payload.assetId.trim()
    || typeof payload.timelineItemId !== "string" || !payload.timelineItemId.trim()
    || fields.some((field) => !integer(payload[field]))) {
    throw new DomainError("原声字幕 Job 缺少完整且可恢复的来源定位", "SOURCE_CAPTION_JOB_PAYLOAD_INVALID");
  }
  const parsed: SourceCaptionJobPayload = {
    requestedRevision: payload.requestedRevision as number,
    assetId: payload.assetId,
    timelineItemId: payload.timelineItemId,
    sourceStartFrame: payload.sourceStartFrame as number,
    sourceEndFrame: payload.sourceEndFrame as number,
    timelineStartFrame: payload.timelineStartFrame as number,
    timelineEndFrame: payload.timelineEndFrame as number
  };
  if (typeof payload.targetFingerprint !== "string" || !/^[a-f0-9]{64}$/.test(payload.targetFingerprint)
    || typeof payload.sourceFileHash !== "string" || !/^[a-f0-9]{64}$/.test(payload.sourceFileHash)) {
    throw new DomainError("字幕任务缺少固定目标或声音字节身份，不能猜测旧输入", "SOURCE_CAPTION_JOB_PAYLOAD_INVALID");
  }
  parsed.targetFingerprint = payload.targetFingerprint;
  parsed.sourceFileHash = payload.sourceFileHash;
  if (payload.speechSource !== undefined) {
    const source = payload.speechSource;
    if (!isRecord(source) || typeof source.speechAssetId !== "string" || !source.speechAssetId.trim()
      || !integer(source.scriptRevision) || source.scriptRevision < 1 || typeof source.scriptText !== "string" || !source.scriptText.trim()) {
      throw new DomainError("旁白字幕 Job 缺少已固定的 SpeechAsset 与 Script 来源", "SOURCE_CAPTION_JOB_PAYLOAD_INVALID");
    }
    parsed.speechSource = { speechAssetId: source.speechAssetId, scriptRevision: source.scriptRevision, scriptText: source.scriptText };
  }
  if (parsed.requestedRevision < 1 || parsed.sourceStartFrame < 0 || parsed.timelineStartFrame < 0
    || parsed.sourceEndFrame <= parsed.sourceStartFrame || parsed.timelineEndFrame <= parsed.timelineStartFrame
    || parsed.sourceEndFrame - parsed.sourceStartFrame !== parsed.timelineEndFrame - parsed.timelineStartFrame) {
    throw new DomainError("原声字幕 Job 的源范围或一比一时间映射无效", "SOURCE_CAPTION_JOB_PAYLOAD_INVALID");
  }
  return parsed;
}

function isBridgeRunAudit(value: unknown): value is BridgeRunAudit {
  if (!isRecord(value)) return false;
  return typeof value.workflowId === "string" && typeof value.runId === "string" && typeof value.schemaVersion === "string"
    && typeof value.schemaRetryCount === "number" && typeof value.submittedAt === "string" && isRecord(value.request);
}

type SourceCaptionAlignmentIntent = {
  kind: "source_caption_alignment";
  createdAt: string;
};

type SourceCaptionAlignmentToken = {
  text: string;
  startMs: number;
  endMs: number;
};

/** 一个 Provider segment 对应一屏字幕；只有完整可核验 token 才保存范围。 */
type SourceCaptionProviderSegment = {
  displayText: string;
  startMs: number;
  endMs: number;
  tokenStart?: number;
  tokenEnd?: number;
};

type SourceCaptionAlignmentResult = {
  text: string;
  tokenPrecision: "provider_token_timed" | "unavailable";
  tokens?: SourceCaptionAlignmentToken[];
  segments: SourceCaptionProviderSegment[];
};

function sourceCaptionAlignmentMetadata(payload: SourceCaptionJobPayload): Record<string, string | number | boolean> {
  return {
    sourceCaptionKind: "caption_alignment",
    sourceCaptionAssetId: payload.assetId,
    sourceCaptionTimelineItemId: payload.timelineItemId,
    sourceCaptionRequestedRevision: payload.requestedRevision,
    sourceCaptionStartFrame: payload.sourceStartFrame,
    sourceCaptionEndFrame: payload.sourceEndFrame,
    ...(payload.speechSource ? { sourceCaptionSpeechAssetId: payload.speechSource.speechAssetId, sourceCaptionScriptRevision: payload.speechSource.scriptRevision } : {}),
    bridgeQueueMode: "normal"
  };
}

function sourceCaptionAlignmentAuditMatches(audit: BridgeRunAudit, payload: SourceCaptionJobPayload): boolean {
  if (audit.workflowId !== FUNASR_SOURCE_CAPTION_WORKFLOW_ID) return false;
  const metadata = audit.request.metadata;
  return Boolean(metadata
    && metadata.sourceCaptionKind === "caption_alignment"
    && metadata.sourceCaptionAssetId === payload.assetId
    && metadata.sourceCaptionTimelineItemId === payload.timelineItemId
    && metadata.sourceCaptionRequestedRevision === payload.requestedRevision
    && metadata.sourceCaptionStartFrame === payload.sourceStartFrame
    && metadata.sourceCaptionEndFrame === payload.sourceEndFrame
    && metadata.sourceCaptionSpeechAssetId === payload.speechSource?.speechAssetId
    && metadata.sourceCaptionScriptRevision === payload.speechSource?.scriptRevision
    && metadata.bridgeQueueMode === "normal");
}

function sourceCaptionAlignmentIntentFromUnknown(value: unknown): SourceCaptionAlignmentIntent | undefined {
  if (!isRecord(value) || value.kind !== "source_caption_alignment" || typeof value.createdAt !== "string") return undefined;
  return { kind: "source_caption_alignment", createdAt: value.createdAt };
}

function selectCaptionOutputs(run: BridgeRun): { transcriptText: string; alignmentJson: string } {
  const texts = run.outputs.flatMap((output) => output.kind === "text" && typeof output.text === "string" ? [output.text.trim()]
    : output.kind === "json" && output.value !== undefined ? [JSON.stringify(output.value)] : []).filter(Boolean);
  const aligned = texts.flatMap((text) => {
    try {
      const parsed: unknown = JSON.parse(text);
      return isRecord(parsed) && parsed.version === 4 && parsed.precision === "provider_segment_timed" && typeof parsed.text === "string" ? [{ text, parsed }] : [];
    } catch { return []; }
  });
  if (aligned.length !== 1) throw new DomainError("字幕结果缺少唯一可识别的段级对齐 JSON", "MISSING_SOURCE_CAPTION_ALIGNMENT_OUTPUT");
  const candidates = texts.filter((text) => text !== aligned[0]!.text && normalizeSourceCaptionComparableText(text) === normalizeSourceCaptionComparableText(aligned[0]!.parsed.text as string));
  if (candidates.length !== 1) throw new DomainError("字幕结果缺少唯一匹配的全文", "MISSING_SOURCE_CAPTION_ALIGNMENT_OUTPUT");
  return { transcriptText: candidates[0]!, alignmentJson: aligned[0]!.text };
}

function normalizeSourceCaptionComparableText(value: string): string {
  return value.normalize("NFKC").replace(/[\p{White_Space}\p{P}]/gu, "").toLocaleLowerCase("en-US");
}

/**
 * 严格接收 v4 段级合同。Provider 的 segment 时间本身就是正式字幕的时间事实；
 * token 只有能逐项核验时才开放给编辑重分段，绝不用字符或标点补算。
 */
export function parseSourceCaptionAlignmentOutput(value: string): SourceCaptionAlignmentResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new DomainError("FunASR 原声字幕对齐输出不是合法 JSON", "SOURCE_CAPTION_SEGMENT_OUTPUT_INVALID");
  }
  if (!isRecord(parsed) || parsed.version !== 4 || parsed.precision !== "provider_segment_timed"
    || typeof parsed.text !== "string" || !parsed.text.trim() || !Array.isArray(parsed.segments)
    || !isRecord(parsed.alignment)
    || (parsed.alignment.tokenPrecision !== "provider_token_timed" && parsed.alignment.tokenPrecision !== "unavailable")
    || (parsed.alignment.tokenEvidence !== undefined
      && !((parsed.alignment.tokenEvidence === "verified" && parsed.alignment.tokenPrecision === "provider_token_timed")
        || (parsed.alignment.tokenEvidence === "unavailable" && parsed.alignment.tokenPrecision === "unavailable")))) {
    throw new DomainError("FunASR 原声字幕对齐必须是 version=4、provider_segment_timed，并明确 tokenPrecision", "SOURCE_CAPTION_SEGMENT_OUTPUT_INVALID");
  }
  const tokenPrecision = parsed.alignment.tokenPrecision;
  if (parsed.alignment.tokens !== undefined && !Array.isArray(parsed.alignment.tokens)) {
    throw new DomainError("FunASR 原声字幕 alignment.tokens 必须是数组或省略", "SOURCE_CAPTION_SEGMENT_OUTPUT_INVALID");
  }
  const rawTokens = parsed.alignment.tokens ?? [];
  if (tokenPrecision === "provider_token_timed" && rawTokens.length === 0) {
    throw new DomainError("FunASR 声称提供逐 token 时间，但没有完整 token 结果", "SOURCE_CAPTION_SEGMENT_OUTPUT_INVALID");
  }
  if (tokenPrecision === "unavailable" && rawTokens.length > 0) {
    throw new DomainError("FunASR 未提供完整 token 时间时不能混入部分 token", "SOURCE_CAPTION_SEGMENT_OUTPUT_INVALID");
  }
  const tokens = rawTokens.map((candidate, index) => {
    if (!isRecord(candidate) || typeof candidate.text !== "string" || !candidate.text.trim()
      || !integer(candidate.startMs) || !integer(candidate.endMs) || candidate.startMs < 0 || candidate.endMs <= candidate.startMs) {
      throw new DomainError(`FunASR 第 ${index + 1} 个 token 结果结构无效`, "SOURCE_CAPTION_SEGMENT_OUTPUT_INVALID");
    }
    return {
      text: candidate.text,
      startMs: candidate.startMs,
      endMs: candidate.endMs
    };
  });
  const segments = parsed.segments.map((candidate, index) => {
    if (!isRecord(candidate) || typeof candidate.displayText !== "string" || !candidate.displayText.trim()
      || !normalizeSourceCaptionComparableText(candidate.displayText)
      || !integer(candidate.startMs) || !integer(candidate.endMs)
      || (tokenPrecision === "provider_token_timed" && (!integer(candidate.tokenStart) || !integer(candidate.tokenEnd)))
      || (tokenPrecision === "unavailable" && (candidate.tokenStart !== undefined || candidate.tokenEnd !== undefined))) {
      throw new DomainError(`FunASR 第 ${index + 1} 个字幕段结果结构无效`, "SOURCE_CAPTION_SEGMENT_OUTPUT_INVALID");
    }
    const tokenRange = tokenPrecision === "provider_token_timed" ? {
      tokenStart: candidate.tokenStart as number,
      tokenEnd: candidate.tokenEnd as number
    } : {};
    return {
      displayText: candidate.displayText,
      startMs: candidate.startMs,
      endMs: candidate.endMs,
      ...tokenRange
    };
  });
  if (segments.length === 0 || normalizeSourceCaptionComparableText(parsed.text) === "") {
    throw new DomainError("FunASR 原声字幕对齐没有可显示的字幕段", "SOURCE_CAPTION_SEGMENT_OUTPUT_INVALID");
  }
  return { text: parsed.text.trim(), tokenPrecision, ...(tokenPrecision === "provider_token_timed" ? { tokens } : {}), segments };
}

/**
 * 对完整 A-roll 音频执行 FunASR 段级对齐。Provider 的一个 segment 会在 Application 同一
 * 提交中自动成为一屏字幕；token 仅用于验证其文字与时间，绝不逐字显示。
 */
export class SourceCaptionAlignmentService {
  constructor(private readonly application: EditingApplication, private readonly bridge: ComfyUIBridgeClient) {}

  private jobLineage(job: JobRecord, payload: SourceCaptionJobPayload): JobRecord[] {
    const lineage = [job];
    const visited = new Set<string>([job.id]);
    let parentId: unknown = job.payload.retryOfJobId;
    while (parentId !== undefined) {
      if (typeof parentId !== "string" || !parentId.trim() || visited.has(parentId)) {
        throw new DomainError("原声段级字幕重试来源无效或形成循环，不能安全恢复外部 Run", "SOURCE_CAPTION_ALIGNMENT_RETRY_SOURCE_INVALID");
      }
      visited.add(parentId);
      const parent = this.application.trackJob(parentId);
      if (parent.projectId !== job.projectId || parent.kind !== "source_caption_alignment") {
        throw new DomainError("原声段级字幕重试来源必须是同一项目的段级对齐 Job", "SOURCE_CAPTION_ALIGNMENT_RETRY_SOURCE_MISMATCH");
      }
      const parentPayload = sourceCaptionPayloadFromJob(parent);
      if (JSON.stringify(parentPayload) !== JSON.stringify(payload)) {
        throw new DomainError("原声段级字幕重试来源的 A-roll 使用或源范围已变化，不能复用旧 Run", "SOURCE_CAPTION_ALIGNMENT_RETRY_SOURCE_MISMATCH");
      }
      lineage.push(parent);
      parentId = parent.payload.retryOfJobId;
    }
    return lineage;
  }

  private intents(job: JobRecord): SourceCaptionAlignmentIntent[] {
    const stored = job.result?.sourceCaptionAlignmentIntents;
    if (stored === undefined) return [];
    if (!Array.isArray(stored)) {
      throw new DomainError("原声段级字幕 Job 的外部提交检查点已损坏，不能安全重试", "SOURCE_CAPTION_ALIGNMENT_SUBMISSION_INTENT_INVALID");
    }
    return stored.map((value) => {
      const intent = sourceCaptionAlignmentIntentFromUnknown(value);
      if (!intent) throw new DomainError("原声段级字幕 Job 的外部提交检查点已损坏，不能安全重试", "SOURCE_CAPTION_ALIGNMENT_SUBMISSION_INTENT_INVALID");
      return intent;
    });
  }

  private saveIntent(jobId: string): void {
    const job = this.application.trackJob(jobId);
    if (this.intents(job).length > 0) return;
    this.application.recordJobCheckpoint(jobId, {
      sourceCaptionAlignmentIntents: [{ kind: "source_caption_alignment", createdAt: now() }]
    });
  }

  private clearIntent(jobId: string): void {
    this.application.recordJobCheckpoint(jobId, { sourceCaptionAlignmentIntents: [] });
  }

  private knownAudit(job: JobRecord, payload: SourceCaptionJobPayload, lineage: JobRecord[]): BridgeRunAudit | undefined {
    let found: BridgeRunAudit | undefined;
    for (const candidate of lineage) {
      const stored = candidate.result?.bridgeRuns;
      if (stored === undefined) continue;
      if (!Array.isArray(stored)) {
        throw new DomainError("原声段级字幕 Job 的 Bridge 审计格式损坏，不能安全恢复", "SOURCE_CAPTION_ALIGNMENT_BRIDGE_AUDIT_INVALID");
      }
      for (const entry of stored) {
        if (!isBridgeRunAudit(entry) || !sourceCaptionAlignmentAuditMatches(entry, payload)) {
          throw new DomainError("原声段级字幕 Job 的 Bridge 审计不属于当前 A-roll 对齐请求，不能安全恢复", "SOURCE_CAPTION_ALIGNMENT_BRIDGE_AUDIT_INVALID");
        }
        if (found && found.runId !== entry.runId) {
          throw new DomainError("同一原声段级字幕请求存在多个 Bridge Run；系统不会猜测采用哪一次结果", "SOURCE_CAPTION_ALIGNMENT_DUPLICATE_BRIDGE_RUN");
        }
        found = entry;
        if (candidate.id !== job.id) this.application.recordBridgeRun(job.id, entry);
      }
    }
    return found;
  }

  private assertNoUnresolvedIntent(lineage: JobRecord[], audit: BridgeRunAudit | undefined): void {
    if (!audit && lineage.some((candidate) => this.intents(candidate).length > 0)) {
      throw new DomainError(
        "原声段级字幕对齐曾开始提交 Bridge，但本地没有收到 run_id；结果未知，系统不会自动重复提交。请先对账外部 Bridge 后重新发起一个明确的新任务。",
        "EXTERNAL_RUN_OUTCOME_UNKNOWN"
      );
    }
  }

  private async extractArollAudio(job: JobRecord, payload: SourceCaptionJobPayload): Promise<string> {
    const state = this.application.readProject(job.projectId);
    const item = state.snapshot.timeline.items.find((candidate) => candidate.id === payload.timelineItemId);
    const asset = state.snapshot.assets.find((candidate) => candidate.id === payload.assetId);
    if (!item || !asset || item.disabled || item.assetId !== asset.id || !asset.metadata?.hasAudio
      || item.sourceStartFrame !== payload.sourceStartFrame || item.sourceEndFrame !== payload.sourceEndFrame
      || item.startFrame !== payload.timelineStartFrame || item.endFrame !== payload.timelineEndFrame) {
      throw new DomainError("原声段级字幕 Job 所绑定的 A-roll 已改变或不再带有可用音频", "SOURCE_CAPTION_ALIGNMENT_REVISION_STALE");
    }
    if (sourceCaptionAlignmentTargetFingerprint(state.snapshot, payload.timelineItemId, payload.speechSource) !== payload.targetFingerprint) {
      throw new DomainError("字幕目标已经改变，不能使用旧目标启动识别", "SOURCE_CAPTION_ALIGNMENT_REVISION_STALE");
    }
    if (await sourceCaptionFileDigest(assetPath(state.snapshot, asset)) !== payload.sourceFileHash) {
      throw new DomainError("字幕声音源文件已改变，不能冒用原输入", "SOURCE_CAPTION_ALIGNMENT_SOURCE_CHANGED");
    }
    const directory = join(state.snapshot.project.rootPath, "cache", "source-caption-alignment", safeOutputName(job.id));
    const path = join(directory, `aroll-${payload.sourceStartFrame}-${payload.sourceEndFrame}.wav`);
    const durationSeconds = (payload.sourceEndFrame - payload.sourceStartFrame) / state.snapshot.timeline.fps;
    await mkdir(directory, { recursive: true });
    await runProcess("ffmpeg", [
      "-hide_banner", "-nostdin", "-y",
      "-ss", (payload.sourceStartFrame / state.snapshot.timeline.fps).toFixed(6),
      "-t", durationSeconds.toFixed(6),
      "-i", assetPath(state.snapshot, asset),
      "-vn", "-map", "0:a:0", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", path
    ], Math.max(120_000, Math.ceil(durationSeconds * 8_000)));
    if (await sourceCaptionFileDigest(assetPath(state.snapshot, asset)) !== payload.sourceFileHash) {
      throw new DomainError("截取字幕声音时源文件已改变", "SOURCE_CAPTION_ALIGNMENT_SOURCE_CHANGED");
    }
    return path;
  }

  private async submitRun(audioPath: string, beforeSubmit: (pending: BridgeRunSubmission) => void): Promise<BridgeRunSubmission> {
    return this.bridge.createRunWithWorkflow(FUNASR_SOURCE_CAPTION_WORKFLOW_ID, async (workflow) => ({
      fieldValues: {}, files: [{ slot: this.bridge.findRequiredSlot(workflow, "audio"), path: audioPath, mime: "audio/wav" }]
    }), { beforeSubmit });
  }

  async align(job: JobRecord): Promise<Record<string, unknown>> {
    const payload = sourceCaptionPayloadFromJob(job);
    const lineage = this.jobLineage(job, payload);
    let audit = this.knownAudit(job, payload, lineage);
    this.assertNoUnresolvedIntent(lineage, audit);
    const cacheDirectory = join(this.application.readProject(job.projectId).snapshot.project.rootPath, "cache", "source-caption-alignment", safeOutputName(job.id));
    try {
      const root = this.application.readProject(job.projectId).snapshot.project.rootPath;
      let savedResult: { runId: string; transcriptText: string; alignmentJson: string; audit: BridgeRunAudit; sourceFileHash: string; inputRange: { sourceStartFrame: number; sourceEndFrame: number; timelineStartFrame: number; timelineEndFrame: number }; alignment?: SourceCaptionAlignmentResult } | undefined;
      for (const candidate of lineage) {
        const saved = candidate.result?.sourceCaptionAlignmentResult;
        if (saved === undefined) continue;
        if (!isRecord(saved) || typeof saved.sha256 !== "string" || typeof saved.runId !== "string"
          || !audit || saved.runId !== audit.runId) throw new DomainError("字幕结果检查点身份无效", "SOURCE_CAPTION_ALIGNMENT_CHECKPOINT_INVALID");
        const path = join(root, "cache", "source-caption-alignment", safeOutputName(candidate.id), "result.json");
        const bytes = await readFile(path);
        if (createHash("sha256").update(bytes).digest("hex") !== saved.sha256) throw new DomainError("字幕结果文件已改变", "SOURCE_CAPTION_ALIGNMENT_CHECKPOINT_INVALID");
        const value: unknown = JSON.parse(bytes.toString("utf8"));
        if (!isRecord(value) || value.runId !== saved.runId || value.sourceFileHash !== payload.sourceFileHash || typeof value.transcriptText !== "string"
          || typeof value.alignmentJson !== "string" || !isBridgeRunAudit(value.audit) || !isRecord(value.inputRange)
          || value.inputRange.sourceStartFrame !== payload.sourceStartFrame || value.inputRange.sourceEndFrame !== payload.sourceEndFrame
          || value.inputRange.timelineStartFrame !== payload.timelineStartFrame || value.inputRange.timelineEndFrame !== payload.timelineEndFrame) throw new DomainError("字幕结果文件格式或输入范围无效", "SOURCE_CAPTION_ALIGNMENT_CHECKPOINT_INVALID");
        savedResult = { runId: value.runId as string, transcriptText: value.transcriptText, alignmentJson: value.alignmentJson, audit: value.audit, sourceFileHash: value.sourceFileHash as string,
          inputRange: { sourceStartFrame: payload.sourceStartFrame, sourceEndFrame: payload.sourceEndFrame, timelineStartFrame: payload.timelineStartFrame, timelineEndFrame: payload.timelineEndFrame } };
        break;
      }
      if (!audit) {
        const audioPath = await this.extractArollAudio(job, payload);
        this.application.recordJobCheckpoint(job.id, { sourceCaptionAlignmentInput: {
          relativePath: `cache/source-caption-alignment/${safeOutputName(job.id)}/${basename(audioPath)}`,
          hash: await sourceCaptionFileDigest(audioPath), sourceFileHash: payload.sourceFileHash
        } });
        let externalSubmissionPending = false;
        try {
          const submission = await this.submitRun(audioPath, (pending) => {
            this.saveIntent(job.id);
            audit = createBridgeRunAudit(pending, undefined, now(), sourceCaptionAlignmentMetadata(payload));
            this.application.recordBridgeRun(job.id, audit);
            externalSubmissionPending = true;
          });
          audit = createBridgeRunAudit(submission, undefined, now(), sourceCaptionAlignmentMetadata(payload));
          this.application.recordBridgeRun(job.id, audit);
          this.clearIntent(job.id);
        } catch (error) {
          if (!externalSubmissionPending) throw error;
          if (error instanceof BridgeError && error.status !== undefined) {
            this.clearIntent(job.id);
            throw error;
          }
          if (error instanceof DomainError && error.code === "SOURCE_CAPTION_ALIGNMENT_SUBMISSION_FAILED") throw error;
          throw new DomainError(
            "提交原声段级字幕对齐 Bridge Run 时连接中断，外部结果未知；系统已保留检查点且不会自动重提。请先对账。",
            "EXTERNAL_RUN_OUTCOME_UNKNOWN"
          );
        }
      }
      if (!savedResult) {
        let completed: BridgeRun;
        try {
          completed = await this.bridge.waitForRun(audit.runId);
        } catch (error) {
          if (error instanceof BridgeRunLostError) {
            throw new DomainError(`原声段级字幕对齐 FunASR Run ${audit.runId} 已不可查询；系统未自动创建新 Run，请在 Bridge 对账后明确重新提交。`, "SOURCE_CAPTION_ALIGNMENT_RUN_LOST_REQUIRES_RESUBMISSION");
          }
          throw error;
        }
        const completedAudit = completeBridgeRunAudit(audit, completed);
        this.application.recordBridgeRun(job.id, completedAudit);
        const { transcriptText, alignmentJson } = selectCaptionOutputs(completed);
        let parsed: SourceCaptionAlignmentResult | undefined;
        try { parsed = parseSourceCaptionAlignmentOutput(alignmentJson); } catch { /* 先保存原始返回，再由正式解析报告错误。 */ }
        savedResult = { runId: completed.id, transcriptText, alignmentJson, audit: completedAudit, sourceFileHash: payload.sourceFileHash!,
          inputRange: { sourceStartFrame: payload.sourceStartFrame, sourceEndFrame: payload.sourceEndFrame, timelineStartFrame: payload.timelineStartFrame, timelineEndFrame: payload.timelineEndFrame }, ...(parsed ? { alignment: parsed } : {}) };
        // 文件先原子落地，再保存检查点；工程冲突不会丢失 Provider 原始结果。
        await mkdir(cacheDirectory, { recursive: true });
        const bytes = Buffer.from(JSON.stringify(savedResult), "utf8"), temporary = join(cacheDirectory, "result.pending.json");
        await writeFile(temporary, bytes);
        await rename(temporary, join(cacheDirectory, "result.json"));
        this.application.recordJobCheckpoint(job.id, { sourceCaptionAlignmentResult: { runId: savedResult.runId, sha256: createHash("sha256").update(bytes).digest("hex"), relativePath: `cache/source-caption-alignment/${safeOutputName(job.id)}/result.json`, tokenPrecision: parsed?.tokenPrecision } });
      }
      const { transcriptText, audit: completedAudit } = savedResult;
      const alignment = parseSourceCaptionAlignmentOutput(savedResult.alignmentJson);
      if (normalizeSourceCaptionComparableText(transcriptText) !== normalizeSourceCaptionComparableText(alignment.text)) {
        throw new DomainError("FunASR 独立全文输出与段级对齐全文不一致，不能写入字幕", "SOURCE_CAPTION_ALIGNMENT_TRANSCRIPT_MISMATCH");
      }
      const inputOwner = lineage.find(candidate => isRecord(this.application.trackJob(candidate.id).result?.sourceCaptionAlignmentInput));
      const input = inputOwner && this.application.trackJob(inputOwner.id).result?.sourceCaptionAlignmentInput;
      if (!inputOwner || !isRecord(input) || typeof input.hash !== "string" || input.sourceFileHash !== payload.sourceFileHash) throw new DomainError("字幕截音检查点缺失", "SOURCE_CAPTION_ALIGNMENT_CHECKPOINT_INVALID");
      const audioPath = join(root, "cache", "source-caption-alignment", safeOutputName(inputOwner.id), `aroll-${payload.sourceStartFrame}-${payload.sourceEndFrame}.wav`);
      if (await sourceCaptionFileDigest(audioPath) !== input.hash) throw new DomainError("字幕识别输入音频已改变", "SOURCE_CAPTION_ALIGNMENT_SOURCE_CHANGED");
      const current = this.application.readProject(job.projectId).snapshot;
      const source = current.assets.find(asset => asset.id === payload.assetId);
      if (!source || await sourceCaptionFileDigest(assetPath(current, source)) !== payload.sourceFileHash) throw new DomainError("字幕声音源文件已改变", "SOURCE_CAPTION_ALIGNMENT_SOURCE_CHANGED");
      const state = this.application.completeSourceAudioCaptionAlignment({
        projectId: job.projectId,
        ...payload,
        transcriptText,
        bridgeAudit: completedAudit,
        tokenPrecision: alignment.tokenPrecision,
        tokens: alignment.tokens,
        segments: alignment.segments.map((segment) => ({
          displayText: segment.displayText,
          startMs: segment.startMs,
          endMs: segment.endMs,
          ...(alignment.tokenPrecision === "provider_token_timed" ? {
            tokenStartIndex: segment.tokenStart,
            tokenEndIndex: segment.tokenEnd
          } : {})
        }))
      });
      const completedAlignment = state.snapshot.sourceAudioAlignments.find((candidate) => candidate.sourceTimelineItemId === payload.timelineItemId
        && candidate.bridgeAudit.runId === savedResult.runId && candidate.status === "ready");
      const program = completedAlignment
        ? state.snapshot.sourceCaptionPrograms.find((candidate) => candidate.alignmentId === completedAlignment.id && candidate.source === "provider_segments")
        : undefined;
      if (!completedAlignment || !program || program.captionIds.length !== alignment.segments.length) {
        throw new DomainError("原声段级字幕已写入 Revision，但找不到完整的默认 Program 或 CaptionCard", "SOURCE_CAPTION_ALIGNMENT_COMPLETION_MISSING");
      }
      this.application.recordJobCheckpoint(job.id, { sourceCaptionAlignmentCommit: { status: "adopted", committedRevision: state.revision.number, alignmentId: completedAlignment.id, programId: program.id } });
      return {
        requestedRevision: payload.requestedRevision,
        revision: state.revision.number,
        committedRevision: state.revision.number,
        alignmentId: completedAlignment.id,
        tokenCount: alignment.tokens?.length ?? 0,
        segmentCount: alignment.segments.length,
        captionCount: program.captionIds.length,
        programId: program.id,
        bridgeRunId: savedResult.runId,
        timingPrecision: alignment.tokenPrecision === "provider_token_timed" ? "source_token_anchored" : "sentence_exact"
      };
    } catch (error) {
      try {
        const snapshot = this.application.readProject(job.projectId).snapshot;
        const applied = audit && snapshot.sourceAudioAlignments.some(entry => entry.bridgeAudit.runId === audit!.runId
          && snapshot.sourceCaptionPrograms.some(program => program.alignmentId === entry.id));
        if (!applied) this.application.recordJobCheckpoint(job.id, { sourceCaptionAlignmentCommit: { status: "not_adopted", reason: error instanceof Error ? error.message : String(error) } });
      } catch { /* 原错误优先保留；已提交结果不能误记为未采用。 */ }
      throw error;
    }
  }
}

type SegmentMaterial = { speechSegmentId: string; segmentAsset: SpeechSegmentAsset; path: string; durationMs: number; prePauseMs: number; postPauseMs: number };

async function assembleAudio(materials: SegmentMaterial[], targetPath: string): Promise<void> {
  if (materials.length === 0) throw new DomainError("没有可拼接的语音片段", "NO_SPEECH_SEGMENTS");
  await mkdir(join(targetPath, ".."), { recursive: true });
  const args = ["-y"];
  const labels: string[] = [];
  let inputIndex = 0;
  for (const material of materials) {
    if (material.prePauseMs > 0) {
      args.push("-f", "lavfi", "-t", (material.prePauseMs / 1000).toFixed(3), "-i", "anullsrc=r=24000:cl=mono");
      labels.push(`[${inputIndex}:a]aresample=24000, aformat=sample_rates=24000:channel_layouts=mono[p${inputIndex}]`);
      inputIndex += 1;
    }
    args.push("-i", material.path);
    labels.push(`[${inputIndex}:a]aresample=24000, aformat=sample_rates=24000:channel_layouts=mono[p${inputIndex}]`);
    inputIndex += 1;
    if (material.postPauseMs > 0) {
      args.push("-f", "lavfi", "-t", (material.postPauseMs / 1000).toFixed(3), "-i", "anullsrc=r=24000:cl=mono");
      labels.push(`[${inputIndex}:a]aresample=24000, aformat=sample_rates=24000:channel_layouts=mono[p${inputIndex}]`);
      inputIndex += 1;
    }
  }
  const inputLabels = labels.map((entry, index) => `[p${index}]`).join("");
  const filter = `${labels.join(";")};${inputLabels}concat=n=${labels.length}:v=0:a=1[outa]`;
  args.push("-filter_complex", filter, "-map", "[outa]", "-c:a", "pcm_s16le", targetPath);
  await runProcess("ffmpeg", args, 10 * 60_000);
}

/** 复用真实段音频，在明确的帧起点之间插入静音；不再次调用语音模型。 */
export async function assemblePlacedSpeech(application: EditingApplication, job: JobRecord): Promise<{ speechAssetId: string; revision: number }> {
  const requestedRevision = Number(job.payload.requestedRevision);
  const previousSpeechAssetId = String(job.payload.speechAssetId);
  const placements = job.payload.placements as Array<{ speechSegmentId: string; startFrame: number }>;
  const state = application.readProject(job.projectId);
  if (state.revision.number !== requestedRevision || state.snapshot.speechAsset?.id !== previousSpeechAssetId) throw new DomainError("旁白编排期间项目已变化", "STALE_SPEECH_PLACEMENT");
  const previous = state.snapshot.speechAsset;
  const fps = state.snapshot.timeline.fps;
  const materials: SegmentMaterial[] = [];
  const timing: SpeechTiming["segments"] = [];
  let cursorMs = 0;
  for (const placement of placements) {
    const segmentAsset = state.snapshot.speechSegmentAssets.find((asset) => asset.speechSegmentId === placement.speechSegmentId && previous.segmentAssetIds.includes(asset.id));
    if (!segmentAsset) throw new DomainError("段音频已变化", "STALE_SPEECH_PLACEMENT");
    const asset = assetById(state.snapshot, segmentAsset.assetId);
    const startMs = placement.startFrame * 1000 / fps;
    if (startMs < cursorMs - 0.5) throw new DomainError("段音频起点重叠", "INVALID_SPEECH_PLACEMENT");
    const gapMs = Math.max(0, startMs - cursorMs);
    materials.push({ speechSegmentId: placement.speechSegmentId, segmentAsset, path: assetPath(state.snapshot, asset), durationMs: segmentAsset.durationMs, prePauseMs: gapMs, postPauseMs: 0 });
    const endMs = startMs + segmentAsset.durationMs;
    timing.push({ speechSegmentId: placement.speechSegmentId, startMs, endMs, startFrame: placement.startFrame, endFrame: millisecondsToFrames(endMs, fps) });
    cursorMs = endMs;
  }
  const durationFrames = job.payload.durationFrames === undefined ? undefined : Number(job.payload.durationFrames);
  if (durationFrames !== undefined) {
    const durationMs = durationFrames * 1000 / fps;
    if (!Number.isInteger(durationFrames) || durationMs < cursorMs - 0.5) throw new DomainError("旁白总轨时长无效", "INVALID_SPEECH_PLACEMENT_DURATION");
    materials[materials.length - 1]!.postPauseMs = Math.max(0, durationMs - cursorMs);
    cursorMs = durationMs;
  }
  const relativePath = join("assets", "speech", `speech-placement-${job.id}.wav`);
  const targetPath = join(state.snapshot.project.rootPath, relativePath);
  await assembleAudio(materials, targetPath);
  const metadata = await probeMedia(targetPath);
  if (!metadata.hasAudio || metadata.durationMs < cursorMs - 20) throw new DomainError("重排旁白文件不完整", "INVALID_SPEECH_OUTPUT");
  const speechFile = createMediaAsset({ name: `编排旁白 ${job.id}`, kind: "speech", managedPath: relativePath });
  speechFile.status = "ready";
  speechFile.metadata = metadata;
  const speechAsset: SpeechAsset = { id: createId("speech_asset"), assetId: speechFile.id, scriptRevision: previous.scriptRevision, segmentAssetIds: previous.segmentAssetIds, timing: { precision: "segment_exact", source: "已就绪段音频真实时长 + 指定帧起点", segments: timing }, status: "ready" };
  const committed = application.completeSpeechPlacement({ projectId: job.projectId, requestedRevision, previousSpeechAssetId, speechFile, speechAsset });
  return { speechAssetId: speechAsset.id, revision: committed.revision.number };
}

function makeSpeechTiming(snapshot: ProjectSnapshot, materials: SegmentMaterial[]): SpeechTiming {
  let cursorMs = 0;
  const segments = materials.map((material) => {
    cursorMs += material.prePauseMs;
    const startMs = cursorMs;
    cursorMs += material.durationMs;
    const endMs = cursorMs;
    cursorMs += material.postPauseMs;
    return {
      speechSegmentId: material.speechSegmentId,
      startMs,
      endMs,
      startFrame: millisecondsToFrames(startMs, snapshot.timeline.fps),
      endFrame: millisecondsToFrames(endMs, snapshot.timeline.fps)
    };
  });
  return { precision: "segment_exact", source: "OmniVoice 输出真实时长 + 明确段间停顿", segments };
}

/**
 * OmniVoice 的每个任务都携带同一份本地 VoiceReference 和一个完整 SpeechSegment，
 * 不建立不存在的远端 Voice ID，也不把克隆与 TTS 拆成两套外部任务。
 */
export class OmniVoiceSegmentService {
  constructor(private readonly application: EditingApplication, private readonly bridge: ComfyUIBridgeClient) {}

  async synthesize(job: JobRecord, onBridgeRun?: BridgeRunReporter): Promise<{ segmentCount: number; speechAssetId?: string }> {
    const projectId = job.projectId;
    const voiceReferenceAssetId = job.payload.voiceReferenceAssetId as string | undefined;
    const voiceReferenceId = job.payload.voiceReferenceId as string | undefined;
    const segmentIds = job.payload.speechSegmentIds as string[];
    const expectedScriptRevision = Number(job.payload.scriptRevision);
    const expectedSpeechInputVersion = Number(job.payload.speechInputVersion ?? 0);
    type Checkpoint = { status: "submitting" | "running" | "failed" | "ready"; attemptJobId: string; audit?: BridgeRunAudit; asset?: Asset; segmentAsset?: SpeechSegmentAsset };
    const checkpoints = () => (this.application.trackJob(job.id).result?.speechSegments ?? {}) as Record<string, Checkpoint>;
    const save = (id: string, value: Checkpoint) => this.application.recordJobCheckpoint(job.id, { speechSegments: { ...checkpoints(), [id]: value } });
    const cancelled = () => { if (this.application.trackJob(job.id).status === "cancelled") throw new DomainError("配音已取消，停止后续提交", "JOB_CANCELLED"); };
    if (!this.application.trackJob(job.id).result?.speechSegments && job.payload.retryOfJobId) {
      const parent = this.application.trackJob(String(job.payload.retryOfJobId));
      const identity = (value: JobRecord) => { const { retryOfJobId, ...payload } = value.payload; return JSON.stringify(payload); };
      if (parent.projectId !== projectId || parent.kind !== job.kind || identity(parent) !== identity(job)) throw new DomainError("配音恢复输入不一致", "SPEECH_RETRY_MISMATCH");
      this.application.recordJobCheckpoint(job.id, { speechSegments: parent.result?.speechSegments ?? {}, ...(parent.result?.speechAssembly ? { speechAssembly: parent.result.speechAssembly } : {}) });
    }
    const initial = this.application.readProject(projectId);
    if ((initial.snapshot.speechInputVersion ?? 0) !== expectedSpeechInputVersion) throw new DomainError("音色已改变，旧配音任务不能继续", "STALE_SPEECH_INPUT");
    if (initial.snapshot.script.revision !== expectedScriptRevision) {
      throw new DomainError("Script 已变化，拒绝将旧语音写入当前项目", "STALE_SCRIPT");
    }
    const voiceReference = voiceReferenceAssetId ? assetById(initial.snapshot, voiceReferenceAssetId) : undefined;
    const referencePath = voiceReference ? assetPath(initial.snapshot, voiceReference) : undefined;
    const requested = segmentIds.map((segmentId) => {
      const segment = initial.snapshot.speechSegments.find((candidate) => candidate.id === segmentId);
      if (!segment) throw new DomainError(`SpeechSegment 不存在：${segmentId}`, "SPEECH_SEGMENT_NOT_FOUND");
      return segment;
    });
    const generatedAssets: Asset[] = [];
    const generatedSegmentAssets: SpeechSegmentAsset[] = [];
    const replacement = new Map<string, SpeechSegmentAsset>();

    for (const segment of requested) {
      cancelled();
      let checkpoint: Checkpoint | undefined = checkpoints()[segment.id];
      if (checkpoint?.status === "ready" && checkpoint.asset && checkpoint.segmentAsset) {
        const bytes = await readFile(assetPath(initial.snapshot, checkpoint.asset));
        if (createHash("sha256").update(bytes).digest("hex") !== checkpoint.asset.sourceHash) throw new DomainError("已完成段音频已改变，不能冒用原检查点", "SPEECH_CHECKPOINT_CHANGED");
        generatedAssets.push(checkpoint.asset); generatedSegmentAssets.push(checkpoint.segmentAsset); replacement.set(segment.id, checkpoint.segmentAsset);
        continue;
      }
      if (checkpoint?.status === "submitting" && !checkpoint.audit) throw new DomainError("配音提交结果未知，先核对原请求，不重复生成", "EXTERNAL_RUN_OUTCOME_UNKNOWN");
      if (checkpoint?.status === "failed") {
        if (!job.payload.retryOfJobId || checkpoint.attemptJobId === job.id) throw new DomainError("该段已明确失败，需显式恢复", "SPEECH_SEGMENT_FAILED");
        checkpoint = undefined;
      }
      if (!checkpoint?.audit) {
        try {
          const submission = await this.bridge.createRunWithWorkflow(referencePath ? OMNIVOICE_WORKFLOW_ID : "omnivoice-default-reference-v1", async (detail) => {
            cancelled();
            const textField = this.bridge.findTextField(detail);
            if (!referencePath && detail.itemSlots.some((slot) => slot.min > 0)) throw new DomainError("服务端默认音色工作流仍要求上传文件，请修复默认音色配置", "VOICE_DEFAULT_NOT_CONFIGURED");
            const request = { fieldValues: { [textField.id]: segment.text }, files: referencePath ? [{ slot: this.bridge.findRequiredSlot(detail, "audio"), path: referencePath, mime: "audio/wav" }] : [] };
            return request;
          }, { beforeSubmit: (pending) => {
            checkpoint = { status: "submitting", attemptJobId: job.id, audit: createBridgeRunAudit(pending) };
            save(segment.id, checkpoint);
          } });
          checkpoint = { status: "running", attemptJobId: job.id, audit: createBridgeRunAudit(submission) };
          save(segment.id, checkpoint);
        } catch (error) {
          if (checkpoint?.status === "submitting") {
            if (error instanceof BridgeError && (error.code === "BRIDGE_INPUT_UNREADABLE" || error.status && error.status >= 400 && error.status < 500)) save(segment.id, { ...checkpoint, status: "failed" });
            else throw new DomainError("配音提交结果未知；已保留意图，不重复创建 Run", "EXTERNAL_RUN_OUTCOME_UNKNOWN");
          }
          throw error;
        }
      }
      const audit = checkpoint.audit!;
      await onBridgeRun?.(audit);
      let completed: BridgeRun;
      try { completed = await this.bridge.waitForRun(audit.runId, { onUpdate: cancelled }); }
      catch (error) {
        if (error instanceof BridgeError && ["BRIDGE_RUN_FAILED", "BRIDGE_RUN_CANCELLED"].includes(error.code ?? "")) save(segment.id, { ...checkpoint, status: "failed" });
        throw error;
      }
      const audioOutputs = completed.outputs.filter((candidate) => candidate.kind === "audio" && candidate.outputId);
      if (audioOutputs.length !== 1) throw new DomainError("OmniVoice 已完成，但没有唯一可下载的音频输出", "MISSING_SPEECH_OUTPUT");
      const output = audioOutputs[0]!;
      const extension = extname(output.fileName ?? "") || ".flac";
      const relativePath = join("assets", "speech", job.id, `${segment.id}-${safeOutputName(basename(output.fileName ?? "voice")) || "voice"}${extension === ".flac" && (output.fileName ?? "").endsWith(".flac") ? "" : ""}`);
      const targetPath = join(initial.snapshot.project.rootPath, relativePath);
      await mkdir(join(initial.snapshot.project.rootPath, "assets", "speech", job.id), { recursive: true });
      await this.bridge.downloadOutput(completed.id, output, targetPath);
      await assertFileReadable(targetPath);
      const metadata = await probeMedia(targetPath);
      if (metadata.durationMs <= 0 || !metadata.hasAudio) throw new DomainError("下载的 OmniVoice 输出不可读或为空", "INVALID_SPEECH_OUTPUT");
      const generatedAsset = createMediaAsset({ name: `旁白：${segment.text.slice(0, 18)}`, kind: "speech", managedPath: relativePath });
      generatedAsset.status = "ready";
      generatedAsset.metadata = metadata;
      generatedAsset.sourceHash = createHash("sha256").update(await readFile(targetPath)).digest("hex");
      generatedAssets.push(generatedAsset);
      const segmentAsset: SpeechSegmentAsset = {
        id: createId("speech_segment_asset"),
        speechSegmentId: segment.id,
        voiceReferenceAssetId,
        voiceReferenceId,
        assetId: generatedAsset.id,
        durationMs: metadata.durationMs,
        bridgeRunId: completed.id,
        schemaVersion: audit.schemaVersion,
        bridgeAudit: completeBridgeRunAudit(audit, completed),
        quality: "passed"
      };
      save(segment.id, { ...checkpoint, status: "ready", asset: generatedAsset, segmentAsset });
      generatedSegmentAssets.push(segmentAsset);
      replacement.set(segment.id, segmentAsset);
    }

    const latest = this.application.readProject(projectId);
    if ((latest.snapshot.speechInputVersion ?? 0) !== expectedSpeechInputVersion) throw new DomainError("语音生成期间音色已改变，保留任务产物但不写入项目", "STALE_SPEECH_INPUT");
    if (latest.snapshot.script.revision !== expectedScriptRevision) {
      throw new DomainError("语音生成期间 Script 已变化，结果保留为任务产物但不写入项目", "STALE_SCRIPT");
    }
    const existing = new Map(latest.snapshot.speechSegmentAssets.map((segmentAsset) => [segmentAsset.speechSegmentId, segmentAsset]));
    for (const [segmentId, segmentAsset] of replacement) existing.set(segmentId, segmentAsset);
    const materials: SegmentMaterial[] = [];
    for (const segment of latest.snapshot.speechSegments.sort((left, right) => left.order - right.order)) {
      const segmentAsset = existing.get(segment.id);
      if (!segmentAsset) continue;
      const asset = generatedAssets.find((candidate) => candidate.id === segmentAsset.assetId) ?? latest.snapshot.assets.find((candidate) => candidate.id === segmentAsset.assetId);
      if (!asset) continue;
      materials.push({
        speechSegmentId: segment.id,
        segmentAsset,
        path: assetPath(latest.snapshot, asset),
        durationMs: segmentAsset.durationMs,
        // 兼容旧快照的毫秒字段；新 Segment 的停顿来自 semantic-continuity 的明确原因。
        prePauseMs: segment.pauseBefore?.durationMs ?? segment.prePauseMs ?? 0,
        postPauseMs: segment.pauseAfter?.durationMs ?? segment.postPauseMs ?? 0
      });
    }
    if (materials.length !== latest.snapshot.speechSegments.length) {
      this.application.applySpeechAssembly({ projectId, expectedScriptRevision, expectedSpeechInputVersion, generatedAssets, segmentAssets: generatedSegmentAssets });
      return { segmentCount: generatedSegmentAssets.length };
    }
    cancelled();
    const savedAssembly = this.application.trackJob(job.id).result?.speechAssembly as { file: Asset; speech: SpeechAsset } | undefined;
    if (savedAssembly) {
      const bytes = await readFile(assetPath(latest.snapshot, savedAssembly.file));
      if (createHash("sha256").update(bytes).digest("hex") !== savedAssembly.file.sourceHash) throw new DomainError("已组装配音文件已改变", "SPEECH_CHECKPOINT_CHANGED");
      if (latest.snapshot.speechAsset?.id !== savedAssembly.speech.id) this.application.applySpeechAssembly({ projectId, expectedScriptRevision, expectedSpeechInputVersion, generatedAssets: [...generatedAssets, savedAssembly.file], segmentAssets: generatedSegmentAssets, speechAsset: savedAssembly.speech });
      return { segmentCount: generatedSegmentAssets.length, speechAssetId: savedAssembly.speech.id };
    }
    const speechRelativePath = join("assets", "speech", `speech-${job.id}.wav`);
    const speechPath = join(latest.snapshot.project.rootPath, speechRelativePath);
    await assembleAudio(materials, speechPath);
    const finalMetadata = await probeMedia(speechPath);
    const speechFileAsset = createMediaAsset({ name: `旁白总轨 Revision ${expectedScriptRevision}`, kind: "speech", managedPath: speechRelativePath });
    speechFileAsset.status = "ready";
    speechFileAsset.metadata = finalMetadata;
    speechFileAsset.sourceHash = createHash("sha256").update(await readFile(speechPath)).digest("hex");
    generatedAssets.push(speechFileAsset);
    const speechAsset: SpeechAsset = {
      id: createId("speech_asset"),
      assetId: speechFileAsset.id,
      scriptRevision: expectedScriptRevision,
      segmentAssetIds: materials.map((material) => material.segmentAsset.id),
      timing: makeSpeechTiming(latest.snapshot, materials),
      status: "ready"
    };
    this.application.recordJobCheckpoint(job.id, { speechAssembly: { file: speechFileAsset, speech: speechAsset } });
    this.application.applySpeechAssembly({ projectId, expectedScriptRevision, expectedSpeechInputVersion, generatedAssets, segmentAssets: generatedSegmentAssets, speechAsset });
    return { segmentCount: generatedSegmentAssets.length, speechAssetId: speechAsset.id };
  }
}

export async function assertFileReadable(filePath: string): Promise<void> {
  const data = await stat(filePath);
  if (data.size <= 0) throw new DomainError("生成文件为空", "EMPTY_OUTPUT_FILE");
}
