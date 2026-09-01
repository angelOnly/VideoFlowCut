import { mkdir } from "node:fs/promises";
import { isAbsolute, join } from "node:path";
import { ComfyUIBridgeClient } from "@videocut/bridge";
import { createApplication, type EditingApplication } from "@videocut/application";
import { assetById, DomainError } from "@videocut/domain";
import { runOneQueuedJob, type JobProcessor } from "@videocut/job-runtime";
import { FunASRService, OmniVoiceSegmentService, probeMedia, runProcess } from "@videocut/speech";
import type { Asset, JobKind, JobRecord, ProjectSnapshot } from "@videocut/contracts";

const workspaceRoot = process.env.VIDEOCUT_WORKSPACE ?? join(process.cwd(), "workspace");
let defaultApplication: EditingApplication | undefined;
const getDefaultApplication = () => (defaultApplication ??= createApplication(workspaceRoot));

export const MEDIA_JOB_KINDS: JobKind[] = ["media_analysis", "transcription", "voice_synthesis"];

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

/**
 * 为注入的 Application 创建处理器。这样测试与独立 Worker 都不会误用进程级全局实例。
 */
export function createMediaJobProcessor(app: EditingApplication, bridge = new ComfyUIBridgeClient()): JobProcessor {
  const funAsr = new FunASRService(app, bridge);
  const omniVoice = new OmniVoiceSegmentService(app, bridge);
  return async (job) => {
    switch (job.kind) {
      case "media_analysis":
        return runMediaAnalysis(app, job);
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
