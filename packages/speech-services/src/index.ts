import { spawn } from "node:child_process";
import { mkdir, stat } from "node:fs/promises";
import { basename, extname, isAbsolute, join } from "node:path";
import type { Asset, BridgeRunAudit, MediaMetadata, ProjectSnapshot, SpeechAsset, SpeechSegmentAsset, SpeechTiming } from "@videocut/contracts";
import { FUNASR_WORKFLOW_ID, OMNIVOICE_WORKFLOW_ID, ComfyUIBridgeClient, type BridgeRun, type BridgeRunSubmission } from "@videocut/bridge";
import { assetById, createId, createMediaAsset, DomainError, millisecondsToFrames, now } from "@videocut/domain";
import { EditingApplication } from "@videocut/application";

export class MediaProcessError extends Error {
  constructor(message: string, public readonly output: string) {
    super(message);
  }
}

export async function runProcess(command: string, args: string[], timeoutMs = 120_000): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true });
    let output = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new MediaProcessError(`${command} 执行超时`, output));
    }, timeoutMs);
    child.stdout.on("data", (chunk: Buffer) => { output += chunk.toString(); });
    child.stderr.on("data", (chunk: Buffer) => { output += chunk.toString(); });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(new MediaProcessError(`无法启动 ${command}：${error.message}`, output));
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(output);
      else reject(new MediaProcessError(`${command} 失败，退出码 ${code}`, output));
    });
  });
}

const safeOutputName = (value: string) => value.replace(/[^a-zA-Z0-9._-]/g, "_");
const assetPath = (snapshot: ProjectSnapshot, asset: Asset) => isAbsolute(asset.managedPath) ? asset.managedPath : join(snapshot.project.rootPath, asset.managedPath);

export type BridgeRunReporter = (audit: BridgeRunAudit) => void | Promise<void>;

/**
 * 只记录请求字段、文件槽位和 Bridge 响应子集；媒体二进制仍保存在受管 Asset 中。
 * 这份审计会先写入本地 Job，随后在成功时一并落入 Transcript / SpeechSegmentAsset。
 */
function createBridgeRunAudit(submission: BridgeRunSubmission, completed?: BridgeRun, submittedAt = now()): BridgeRunAudit {
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
        kind: file.slot.kind,
        fileName: basename(file.path)
      })) ?? []
    },
    response: completed ? {
      status: completed.status,
      error: completed.error,
      outputs: completed.outputs.map((output) => ({
        outputSlotId: output.outputSlotId,
        displayName: output.displayName,
        kind: output.kind,
        fileName: output.fileName,
        mime: output.mime,
        outputId: output.outputId,
        downloadUrl: output.downloadUrl,
        text: output.text
      }))
    } : undefined
  };
}

export async function probeMedia(filePath: string): Promise<MediaMetadata> {
  const output = await runProcess("ffprobe", [
    "-v", "error",
    "-show_entries", "format=duration:format=format_name:stream=codec_type,codec_name,width,height,r_frame_rate,sample_rate,channels",
    "-of", "json",
    filePath
  ], 60_000);
  const data = JSON.parse(output) as {
    format?: { duration?: string; format_name?: string };
    streams?: Array<{ codec_type?: string; codec_name?: string; width?: number; height?: number; r_frame_rate?: string; sample_rate?: string; channels?: number }>;
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

  async transcribe(projectId: string, assetId: string, onBridgeRun?: BridgeRunReporter): Promise<{ runId: string; textLength: number }> {
    const state = this.application.readProject(projectId);
    const asset = assetById(state.snapshot, assetId);
    if (!asset.metadata?.hasAudio) throw new DomainError("素材没有音频，不能提交转写", "NO_AUDIO");
    const audioPath = await extractAudioForTranscription(state.snapshot, asset);
    const submission = await this.bridge.createRunWithSchemaRetry(FUNASR_WORKFLOW_ID, async (detail) => ({
      fieldValues: {},
      files: [{ slot: this.bridge.findRequiredSlot(detail, "audio"), path: audioPath, mime: "audio/wav" }]
    }));
    const submittedAt = now();
    await onBridgeRun?.(createBridgeRunAudit(submission, undefined, submittedAt));
    const completed = await this.bridge.waitForRun(submission.run.id);
    const output = completed.outputs.find((candidate) => candidate.kind === "text" && typeof candidate.text === "string");
    if (!output?.text?.trim()) throw new DomainError("FunASR 已完成，但没有返回文本输出", "MISSING_TRANSCRIPT_OUTPUT");
    this.application.applyTranscript({
      projectId,
      assetId,
      text: output.text,
      bridgeRunId: completed.id,
      schemaVersion: submission.workflow.schemaVersion,
      bridgeAudit: createBridgeRunAudit(submission, completed, submittedAt)
    });
    return { runId: completed.id, textLength: output.text.length };
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

  async synthesize(
    projectId: string,
    voiceReferenceAssetId: string,
    segmentIds: string[],
    expectedScriptRevision: number,
    voiceReferenceId?: string,
    onBridgeRun?: BridgeRunReporter
  ): Promise<{ segmentCount: number; speechAssetId?: string }> {
    const initial = this.application.readProject(projectId);
    if (initial.snapshot.script.revision !== expectedScriptRevision) {
      throw new DomainError("Script 已变化，拒绝将旧语音写入当前项目", "STALE_SCRIPT");
    }
    const voiceReference = assetById(initial.snapshot, voiceReferenceAssetId);
    const referencePath = assetPath(initial.snapshot, voiceReference);
    const requested = segmentIds.map((segmentId) => {
      const segment = initial.snapshot.speechSegments.find((candidate) => candidate.id === segmentId);
      if (!segment) throw new DomainError(`SpeechSegment 不存在：${segmentId}`, "SPEECH_SEGMENT_NOT_FOUND");
      return segment;
    });
    const generatedAssets: Asset[] = [];
    const generatedSegmentAssets: SpeechSegmentAsset[] = [];
    const replacement = new Map<string, SpeechSegmentAsset>();

    for (const segment of requested) {
      const submission = await this.bridge.createRunWithSchemaRetry(OMNIVOICE_WORKFLOW_ID, async (detail) => {
        const referenceSlot = this.bridge.findRequiredSlot(detail, "audio");
        const textField = this.bridge.findTextField(detail);
        return {
          fieldValues: { [textField.id]: segment.text },
          files: [{ slot: referenceSlot, path: referencePath, mime: "audio/wav" }]
        };
      });
      const submittedAt = now();
      await onBridgeRun?.(createBridgeRunAudit(submission, undefined, submittedAt));
      const completed = await this.bridge.waitForRun(submission.run.id);
      const output = completed.outputs.find((candidate) => candidate.kind === "audio" && candidate.downloadUrl);
      if (!output?.downloadUrl) throw new DomainError("OmniVoice 已完成，但没有音频输出", "MISSING_SPEECH_OUTPUT");
      const extension = extname(output.fileName ?? "") || ".flac";
      const relativePath = join("assets", "speech", `${segment.id}-${safeOutputName(basename(output.fileName ?? "voice")) || "voice"}${extension === ".flac" && (output.fileName ?? "").endsWith(".flac") ? "" : ""}`);
      const targetPath = join(initial.snapshot.project.rootPath, relativePath);
      await mkdir(join(initial.snapshot.project.rootPath, "assets", "speech"), { recursive: true });
      await this.bridge.downloadOutput(output, targetPath);
      await assertFileReadable(targetPath);
      const metadata = await probeMedia(targetPath);
      if (metadata.durationMs <= 0 || !metadata.hasAudio) throw new DomainError("下载的 OmniVoice 输出不可读或为空", "INVALID_SPEECH_OUTPUT");
      const generatedAsset = createMediaAsset({ name: `旁白：${segment.text.slice(0, 18)}`, kind: "speech", managedPath: relativePath });
      generatedAsset.status = "ready";
      generatedAsset.metadata = metadata;
      generatedAssets.push(generatedAsset);
      const segmentAsset: SpeechSegmentAsset = {
        id: createId("speech_segment_asset"),
        speechSegmentId: segment.id,
        voiceReferenceAssetId,
        voiceReferenceId,
        assetId: generatedAsset.id,
        durationMs: metadata.durationMs,
        bridgeRunId: completed.id,
        schemaVersion: submission.workflow.schemaVersion,
        bridgeAudit: createBridgeRunAudit(submission, completed, submittedAt),
        quality: "passed"
      };
      generatedSegmentAssets.push(segmentAsset);
      replacement.set(segment.id, segmentAsset);
    }

    const latest = this.application.readProject(projectId);
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
      this.application.applySpeechAssembly({ projectId, generatedAssets, segmentAssets: generatedSegmentAssets });
      return { segmentCount: generatedSegmentAssets.length };
    }
    const speechRelativePath = join("assets", "speech", `speech-${expectedScriptRevision}.wav`);
    const speechPath = join(latest.snapshot.project.rootPath, speechRelativePath);
    await assembleAudio(materials, speechPath);
    const finalMetadata = await probeMedia(speechPath);
    const speechFileAsset = createMediaAsset({ name: `旁白总轨 Revision ${expectedScriptRevision}`, kind: "speech", managedPath: speechRelativePath });
    speechFileAsset.status = "ready";
    speechFileAsset.metadata = finalMetadata;
    generatedAssets.push(speechFileAsset);
    const speechAsset: SpeechAsset = {
      id: createId("speech_asset"),
      assetId: speechFileAsset.id,
      scriptRevision: expectedScriptRevision,
      segmentAssetIds: materials.map((material) => material.segmentAsset.id),
      timing: makeSpeechTiming(latest.snapshot, materials),
      status: "ready"
    };
    this.application.applySpeechAssembly({ projectId, generatedAssets, segmentAssets: generatedSegmentAssets, speechAsset });
    return { segmentCount: generatedSegmentAssets.length, speechAssetId: speechAsset.id };
  }
}

export async function assertFileReadable(filePath: string): Promise<void> {
  const data = await stat(filePath);
  if (data.size <= 0) throw new DomainError("生成文件为空", "EMPTY_OUTPUT_FILE");
}
