import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, open, rename, rm, stat } from "node:fs/promises";
import { extname, isAbsolute, join } from "node:path";
import { AssetProviderRegistry, createDefaultAssetProviderRegistry } from "@videocut/acquisition";
import { ComfyUIBridgeClient } from "@videocut/bridge";
import { createApplication, type EditingApplication } from "@videocut/application";
import { assetById, DomainError } from "@videocut/domain";
import { runOneQueuedJob, type JobProcessor } from "@videocut/job-runtime";
import { FunASRService, OmniVoiceSegmentService, probeMedia, runProcess } from "@videocut/speech";
import type { Asset, JobKind, JobRecord, ProjectSnapshot } from "@videocut/contracts";

const workspaceRoot = process.env.VIDEOCUT_WORKSPACE ?? join(process.cwd(), "workspace");
let defaultApplication: EditingApplication | undefined;
const getDefaultApplication = () => (defaultApplication ??= createApplication(workspaceRoot));

export const MEDIA_JOB_KINDS: JobKind[] = ["media_analysis", "asset_acquisition", "transcription", "voice_synthesis"];

const resolveAssetPath = (snapshot: ProjectSnapshot, asset: Asset) => isAbsolute(asset.managedPath) ? asset.managedPath : join(snapshot.project.rootPath, asset.managedPath);

async function createThumbnail(snapshot: ProjectSnapshot, asset: Asset): Promise<string | undefined> {
  if (!asset.metadata?.videoCodec) return undefined;
  const relativePath = join("assets", "proxy", `${asset.id}.jpg`);
  const targetPath = join(snapshot.project.rootPath, relativePath);
  await mkdir(join(snapshot.project.rootPath, "assets", "proxy"), { recursive: true });
  const seekSeconds = Math.max(0, Math.min(1, asset.metadata.durationMs / 2000));
  await runProcess("ffmpeg", ["-y", "-ss", seekSeconds.toFixed(2), "-i", resolveAssetPath(snapshot, asset), "-frames:v", "1", "-vf", "scale=320:-2", targetPath], 120_000);
  return relativePath;
}

async function runMediaAnalysis(application: EditingApplication, job: JobRecord): Promise<Record<string, unknown>> {
  const assetId = String(job.payload.assetId ?? "");
  application.markAssetAnalyzing({ projectId: job.projectId, assetId });
  const current = application.readProject(job.projectId);
  const asset = assetById(current.snapshot, assetId);
  try {
    const metadata = await probeMedia(resolveAssetPath(current.snapshot, asset));
    metadata.thumbnailPath = await createThumbnail(current.snapshot, { ...asset, metadata });
    application.applyMediaAnalysis({ projectId: job.projectId, assetId, metadata });
    return { assetId, durationMs: metadata.durationMs, hasAudio: metadata.hasAudio, thumbnailPath: metadata.thumbnailPath };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    application.failAssetAnalysis({ projectId: job.projectId, assetId, reason: message });
    throw error;
  }
}

async function hashFile(path: string): Promise<string> {
  return new Promise((resolveHash, rejectHash) => {
    const hash = createHash("sha256");
    const stream = createReadStream(path);
    stream.on("data", (chunk: string | Buffer) => { hash.update(chunk); });
    stream.on("error", rejectHash);
    stream.on("end", () => resolveHash(hash.digest("hex")));
  });
}

/** 先识别常见 HTML 错误页，再交给 ffprobe 做最终媒体校验，不能只相信扩展名。 */
async function assertDownloadedVideo(path: string, contentType?: string): Promise<void> {
  if (contentType && !contentType.startsWith("video/")) {
    throw new DomainError(`下载内容 MIME 不符合视频要求：${contentType}`, "ASSET_DOWNLOAD_MIME_INVALID");
  }
  const fileInfo = await stat(path);
  if (!fileInfo.isFile() || fileInfo.size <= 0) throw new DomainError("下载素材为空或不是文件", "ASSET_DOWNLOAD_EMPTY");
  const handle = await open(path, "r");
  try {
    const header = Buffer.alloc(Math.min(512, fileInfo.size));
    await handle.read(header, 0, header.length, 0);
    const text = header.toString("utf8").trimStart().toLocaleLowerCase();
    if (text.startsWith("<!doctype html") || text.startsWith("<html") || text.startsWith("<?xml")) {
      throw new DomainError("下载内容是网页错误页，不是视频素材", "ASSET_DOWNLOAD_HTML");
    }
  } finally {
    await handle.close();
  }
}

/**
 * 下载只发生在 Worker：候选中的公开来源和授权信息先由 Application 校验，
 * 二进制通过 MIME、文件头、哈希和 ffprobe 后才进入项目受管 assets/source 目录。
 */
async function runAssetAcquisition(
  application: EditingApplication,
  job: JobRecord,
  providers: AssetProviderRegistry
): Promise<Record<string, unknown>> {
  const assetCandidateId = String(job.payload.assetCandidateId ?? "");
  if (!assetCandidateId) throw new DomainError("素材本地化任务缺少 assetCandidateId", "ASSET_CANDIDATE_ID_MISSING");
  let storedPath: string | undefined;
  let temporaryDirectory: string | undefined;
  try {
    application.markAssetCandidateAcquiring({ projectId: job.projectId, assetCandidateId });
    const inspected = application.readAssetCandidate({ projectId: job.projectId, assetCandidateId });
    const provider = providers.get(inspected.candidate.provider);
    temporaryDirectory = join(application.readProject(job.projectId).snapshot.project.rootPath, "cache", "asset-acquisition", job.id);
    const downloaded = await provider.download({ candidate: inspected.candidate, temporaryDirectory });
    await assertDownloadedVideo(downloaded.filePath, downloaded.contentType);
    const metadata = await probeMedia(downloaded.filePath);
    if (!metadata.videoCodec) throw new DomainError("下载媒体没有可用的视频轨，不能作为 B-roll 候选", "ASSET_DOWNLOAD_VIDEO_TRACK_MISSING");
    const sourceHash = await hashFile(downloaded.filePath);
    const current = application.readProject(job.projectId);
    const duplicate = current.snapshot.assets.find((asset) => asset.sourceHash === sourceHash);
    const extension = extname(downloaded.fileName).toLocaleLowerCase() || ".mp4";
    const relativePath = join("assets", "source", `${sourceHash.slice(0, 20)}${extension}`);
    storedPath = join(current.snapshot.project.rootPath, relativePath);
    if (duplicate) {
      await rm(downloaded.filePath, { force: true });
      storedPath = undefined;
    } else {
      await mkdir(join(current.snapshot.project.rootPath, "assets", "source"), { recursive: true });
      await rename(downloaded.filePath, storedPath);
    }
    const completed = application.completeAssetAcquisition({
      projectId: job.projectId,
      assetCandidateId,
      name: downloaded.fileName,
      managedPath: relativePath,
      sourceHash
    });
    // 并发下载同一内容时，Application 会保留先入库的 Asset；清理这次多余移动的临时副本。
    if (completed.duplicate && storedPath) await rm(storedPath, { force: true });
    return {
      assetCandidateId,
      assetId: completed.asset.id,
      duplicate: completed.duplicate,
      sourceHash,
      mediaAnalysisJobId: completed.mediaAnalysisJob?.id,
      durationMs: metadata.durationMs
    };
  } catch (error) {
    if (storedPath) await rm(storedPath, { force: true }).catch(() => undefined);
    const reason = error instanceof Error ? error.message : String(error);
    try {
      application.failAssetCandidateAcquisition({ projectId: job.projectId, assetCandidateId, reason });
    } catch {
      // Job 可能在失败前被取消或候选已被其它 Worker 完成；原始错误仍由 Job Runtime 记录。
    }
    throw error;
  } finally {
    if (temporaryDirectory) await rm(temporaryDirectory, { recursive: true, force: true }).catch(() => undefined);
  }
}

/**
 * 为注入的 Application 创建处理器。这样测试与独立 Worker 都不会误用进程级全局实例。
 */
export function createMediaJobProcessor(
  app: EditingApplication,
  bridge = new ComfyUIBridgeClient(),
  providers: AssetProviderRegistry = createDefaultAssetProviderRegistry()
): JobProcessor {
  const funAsr = new FunASRService(app, bridge);
  const omniVoice = new OmniVoiceSegmentService(app, bridge);
  return async (job) => {
    switch (job.kind) {
      case "media_analysis":
        return runMediaAnalysis(app, job);
      case "asset_acquisition":
        return runAssetAcquisition(app, job, providers);
      case "transcription":
        return funAsr.transcribe(job.projectId, String(job.payload.assetId), (audit) => { app.recordBridgeRun(job.id, audit); });
      case "voice_synthesis":
        return omniVoice.synthesize(
          job.projectId,
          String(job.payload.voiceReferenceAssetId),
          Array.isArray(job.payload.speechSegmentIds) ? job.payload.speechSegmentIds.map(String) : [],
          Number(job.payload.scriptRevision),
          typeof job.payload.voiceReferenceId === "string" ? job.payload.voiceReferenceId : undefined,
          (audit) => { app.recordBridgeRun(job.id, audit); }
        );
      default:
        throw new DomainError(`任务类型 ${job.kind} 不属于媒体 Worker`, "JOB_NOT_IMPLEMENTED");
    }
  };
}

export async function runOneJob(
  app: EditingApplication = getDefaultApplication(),
  processor: JobProcessor = createMediaJobProcessor(app)
): Promise<boolean> {
  return runOneQueuedJob(app, MEDIA_JOB_KINDS, processor);
}

export async function runWorkerForever(app: EditingApplication = getDefaultApplication()): Promise<void> {
  let stopping = false;
  const stop = () => { stopping = true; };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  const processor = createMediaJobProcessor(app);
  while (!stopping) {
    const worked = await runOneJob(app, processor);
    if (!worked) await new Promise((resolve) => setTimeout(resolve, 750));
  }
}

if (import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, "/")}`) {
  runWorkerForever().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
