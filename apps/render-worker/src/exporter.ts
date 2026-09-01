import { createReadStream, existsSync } from "node:fs";
import { mkdir, stat } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, extname, isAbsolute, join, relative, resolve } from "node:path";
import { bundle } from "@remotion/bundler";
import { ensureBrowser, renderMedia, selectComposition } from "@remotion/renderer";
import type { EditingApplication } from "@videocut/application";
import type { Asset, JobRecord, ProjectSnapshot, TimelineItem } from "@videocut/contracts";
import { assetById, DomainError } from "@videocut/domain";
import { canExport, evaluateQuality } from "@videocut/quality";
import { probeMedia, runProcess } from "@videocut/speech";

const contentTypeByExtension: Record<string, string> = {
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".mkv": "video/x-matroska",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".flac": "audio/flac",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp"
};

const resolveAssetPath = (snapshot: ProjectSnapshot, asset: Asset) => isAbsolute(asset.managedPath) ? asset.managedPath : join(snapshot.project.rootPath, asset.managedPath);

function assertPathWithin(root: string, candidate: string): void {
  const relativePath = relative(root, candidate);
  if (relativePath.startsWith("..") || isAbsolute(relativePath)) {
    throw new DomainError("渲染媒体路径超出项目目录", "UNSAFE_MEDIA_PATH");
  }
}

function parseRange(range: string | undefined, size: number): { start: number; end: number } | undefined {
  if (!range) return undefined;
  const match = /^bytes=(\d*)-(\d*)$/u.exec(range);
  if (!match) return undefined;
  const [, startText, endText] = match;
  if (!startText && !endText) return undefined;
  if (!startText) {
    const suffixLength = Math.min(size, Number(endText));
    return { start: size - suffixLength, end: size - 1 };
  }
  const start = Number(startText);
  const end = Math.min(size - 1, endText ? Number(endText) : size - 1);
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || end < start || start >= size) return undefined;
  return { start, end };
}

/** 仅在本次 Render 生命周期暴露当前项目媒体，避免 Worker 依赖常驻 HTTP Server。 */
export async function startProjectMediaServer(snapshot: ProjectSnapshot): Promise<{ mediaBaseUrl: string; close: () => Promise<void> }> {
  const projectRoot = resolve(snapshot.project.rootPath);
  const expectedPrefix = `/media/${encodeURIComponent(snapshot.project.id)}/`;
  const server = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
      if (!requestUrl.pathname.startsWith(expectedPrefix)) {
        response.writeHead(404).end();
        return;
      }
      const encodedRelativePath = requestUrl.pathname.slice(expectedPrefix.length);
      const relativePath = encodedRelativePath.split("/").map((segment) => decodeURIComponent(segment)).join("/");
      const targetPath = resolve(projectRoot, relativePath);
      assertPathWithin(projectRoot, targetPath);
      if (!existsSync(targetPath)) {
        response.writeHead(404).end();
        return;
      }
      const info = await stat(targetPath);
      if (!info.isFile()) {
        response.writeHead(404).end();
        return;
      }
      const range = parseRange(request.headers.range, info.size);
      const headers = {
        "Content-Type": contentTypeByExtension[extname(targetPath).toLowerCase()] ?? "application/octet-stream",
        "Accept-Ranges": "bytes"
      };
      if (range) {
        response.writeHead(206, { ...headers, "Content-Range": `bytes ${range.start}-${range.end}/${info.size}`, "Content-Length": range.end - range.start + 1 });
        createReadStream(targetPath, range).pipe(response);
        return;
      }
      response.writeHead(200, { ...headers, "Content-Length": info.size });
      createReadStream(targetPath).pipe(response);
    } catch {
      response.writeHead(500).end();
    }
  });
  await new Promise<void>((resolvePromise, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolvePromise();
    });
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    await new Promise<void>((resolvePromise) => server.close(() => resolvePromise()));
    throw new DomainError("无法启动本地渲染媒体服务", "MEDIA_SERVER_FAILED");
  }
  return {
    mediaBaseUrl: `http://127.0.0.1:${address.port}`,
    close: () => closeServer(server)
  };
}

function closeServer(server: Server): Promise<void> {
  return new Promise((resolvePromise, reject) => server.close((error) => error ? reject(error) : resolvePromise()));
}

export interface RenderedExport {
  renderer: "remotion" | "ffmpeg-fallback";
  warnings: string[];
}

/**
 * Remotion bundle 在一个 Worker 进程内复用，但每个 Job 都新开隔离媒体服务，
 * 因此导出始终读取任务绑定的不可变 Revision 快照。
 */
export class RevisionRenderer {
  private bundleLocation?: Promise<string>;
  private readonly entryPoint: string;

  constructor(entryPoint = fileURLToPath(new URL("./render-entry.tsx", import.meta.url))) {
    this.entryPoint = entryPoint;
  }

  private getBundle(): Promise<string> {
    this.bundleLocation ??= bundle(this.entryPoint);
    return this.bundleLocation;
  }

  async render(snapshot: ProjectSnapshot, targetPath: string): Promise<void> {
    const mediaServer = await startProjectMediaServer(snapshot);
    try {
      await ensureBrowser({ logLevel: "error" });
      const serveUrl = await this.getBundle();
      const inputProps = { snapshot, mediaBaseUrl: mediaServer.mediaBaseUrl };
      const composition = await selectComposition({ serveUrl, id: "videocut-project", inputProps, logLevel: "error" });
      await renderMedia({
        composition,
        serveUrl,
        codec: "h264",
        inputProps,
        outputLocation: targetPath,
        overwrite: true,
        crf: 20,
        x264Preset: "veryfast",
        audioCodec: "aac",
        enforceAudioTrack: true,
        concurrency: "50%",
        timeoutInMilliseconds: 30 * 60_000,
        logLevel: "error"
      });
    } finally {
      await mediaServer.close();
    }
  }

  /** 局部预览仍从完整 Composition 的全局帧坐标渲染，避免把 Cue 和字幕错误地从第 0 帧重算。 */
  async renderRange(snapshot: ProjectSnapshot, fromFrame: number, toFrame: number, targetPath: string): Promise<void> {
    if (fromFrame < 0 || toFrame <= fromFrame || toFrame > snapshot.timeline.durationInFrames) {
      throw new DomainError("局部预览范围无效", "INVALID_PREVIEW_RANGE");
    }
    const mediaServer = await startProjectMediaServer(snapshot);
    try {
      await ensureBrowser({ logLevel: "error" });
      const serveUrl = await this.getBundle();
      const inputProps = { snapshot, mediaBaseUrl: mediaServer.mediaBaseUrl };
      const composition = await selectComposition({ serveUrl, id: "videocut-project", inputProps, logLevel: "error" });
      await renderMedia({
        composition,
        serveUrl,
        codec: "h264",
        inputProps,
        outputLocation: targetPath,
        overwrite: true,
        frameRange: [fromFrame, toFrame - 1],
        crf: 20,
        x264Preset: "veryfast",
        audioCodec: "aac",
        enforceAudioTrack: true,
        concurrency: "50%",
        timeoutInMilliseconds: 30 * 60_000,
        logLevel: "error"
      });
    } finally {
      await mediaServer.close();
    }
  }
}

function ffmpegConcatFilters(snapshot: ProjectSnapshot, items: TimelineItem[]): { args: string[]; filter: string } {
  const args: string[] = ["-y"];
  const filters: string[] = [];
  const labels: string[] = [];
  items.forEach((item, index) => {
    const asset = assetById(snapshot, item.assetId);
    if (!asset.metadata?.hasAudio) {
      throw new DomainError(`FFmpeg 降级导出不支持无音频的主画面素材：${asset.name}`, "MISSING_AUDIO");
    }
    const sourceStart = (item.sourceStartFrame / snapshot.timeline.fps).toFixed(5);
    const sourceEnd = (item.sourceEndFrame / snapshot.timeline.fps).toFixed(5);
    args.push("-i", resolveAssetPath(snapshot, asset));
    filters.push(`[${index}:v]trim=start=${sourceStart}:end=${sourceEnd},setpts=PTS-STARTPTS,scale=${snapshot.timeline.width}:${snapshot.timeline.height}:force_original_aspect_ratio=decrease,pad=${snapshot.timeline.width}:${snapshot.timeline.height}:(ow-iw)/2:(oh-ih)/2,setsar=1[v${index}]`);
    filters.push(`[${index}:a]atrim=start=${sourceStart}:end=${sourceEnd},asetpts=PTS-STARTPTS[a${index}]`);
    labels.push(`[v${index}][a${index}]`);
  });
  filters.push(`${labels.join("")}concat=n=${items.length}:v=1:a=1[outv][outa]`);
  return { args, filter: filters.join(";") };
}

async function renderWithFfmpegFallback(snapshot: ProjectSnapshot, targetPath: string): Promise<void> {
  const actorTrack = snapshot.timeline.tracks.find((track) => track.name === "Actor / A-roll");
  const items = snapshot.timeline.items
    .filter((item) => item.trackId === actorTrack?.id && !item.disabled)
    .sort((left, right) => left.startFrame - right.startFrame);
  if (items.length === 0) throw new DomainError("没有可导出的主画面片段", "EMPTY_TIMELINE");
  const { args, filter } = ffmpegConcatFilters(snapshot, items);
  await runProcess("ffmpeg", [
    ...args,
    "-filter_complex", filter,
    "-map", "[outv]",
    "-map", "[outa]",
    "-r", String(snapshot.timeline.fps),
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-crf", "20",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-movflags", "+faststart",
    targetPath
  ], 30 * 60_000);
}

export interface ExportValidation {
  durationMs: number;
  hasAudio: boolean;
  blackSegments: Array<{ startSeconds: number; endSeconds: number; durationSeconds: number }>;
}

/** 导出后解码、探测音轨并扫描持续黑帧；任何技术异常会阻止任务被标记成功。 */
export async function validateExport(targetPath: string, expectedDurationMs: number): Promise<ExportValidation> {
  const metadata = await probeMedia(targetPath);
  if (metadata.durationMs <= 0 || !metadata.videoCodec || !metadata.hasAudio) {
    throw new DomainError("导出文件校验失败：缺少有效视频或音频", "INVALID_EXPORT");
  }
  if (Math.abs(metadata.durationMs - expectedDurationMs) > 1_000) {
    throw new DomainError(`导出时长异常：期望约 ${expectedDurationMs}ms，实际 ${metadata.durationMs}ms`, "EXPORT_DURATION_MISMATCH");
  }
  await runProcess("ffmpeg", ["-v", "error", "-i", targetPath, "-map", "0:v:0", "-f", "null", "-"], 30 * 60_000);
  const blackDetectOutput = await runProcess("ffmpeg", ["-hide_banner", "-i", targetPath, "-vf", "blackdetect=d=0.25:pix_th=0.10", "-an", "-f", "null", "-"], 30 * 60_000);
  const blackSegments = [...blackDetectOutput.matchAll(/black_start:([^\s]+)\s+black_end:([^\s]+)\s+black_duration:([^\s]+)/gu)].map((match) => ({
    startSeconds: Number(match[1]),
    endSeconds: Number(match[2]),
    durationSeconds: Number(match[3])
  }));
  if (blackSegments.length > 0) {
    throw new DomainError(`导出包含持续黑帧：${blackSegments.map((segment) => `${segment.startSeconds.toFixed(2)}–${segment.endSeconds.toFixed(2)}s`).join("，")}`, "BLACK_FRAME_DETECTED");
  }
  return { durationMs: metadata.durationMs, hasAudio: metadata.hasAudio, blackSegments };
}

export async function runExportJob(
  application: EditingApplication,
  job: JobRecord,
  renderer = new RevisionRenderer()
): Promise<Record<string, unknown>> {
  const revisionNumber = Number(job.payload.revision);
  if (!Number.isInteger(revisionNumber) || revisionNumber <= 0) throw new DomainError("导出任务缺少有效 Revision", "INVALID_EXPORT_REVISION");
  const revision = application.repository.getRevision(job.projectId, revisionNumber);
  const report = evaluateQuality(revision.snapshot, revisionNumber);
  if (!canExport(report)) {
    throw new DomainError(`质量门禁阻止导出：${report.issues.filter((entry) => entry.level === "blocking").map((entry) => entry.message).join("；")}`, "QUALITY_GATE_BLOCKED");
  }
  const targetPath = join(revision.snapshot.project.rootPath, "exports", `revision-${revisionNumber}.mp4`);
  await mkdir(dirname(targetPath), { recursive: true });
  const warnings: string[] = [];
  let rendererName: RenderedExport["renderer"] = "remotion";
  try {
    await renderer.render(revision.snapshot, targetPath);
  } catch (renderError) {
    const reason = renderError instanceof Error ? renderError.message : String(renderError);
    await renderWithFfmpegFallback(revision.snapshot, targetPath);
    rendererName = "ffmpeg-fallback";
    warnings.push(`Remotion 渲染不可用，已显式降级为 FFmpeg 主轨导出：${reason}`);
    if (revision.snapshot.effectCues.length > 0 || revision.snapshot.timeline.captions.length > 0) {
      warnings.push("降级文件不包含 Remotion 效果层与字幕，请在渲染环境恢复后重新导出该 Revision。");
    }
  }
  const expectedDurationMs = Math.round((revision.snapshot.timeline.durationInFrames / revision.snapshot.timeline.fps) * 1000);
  const validation = await validateExport(targetPath, expectedDurationMs);
  return {
    revision: revisionNumber,
    path: targetPath,
    relativePath: join("exports", `revision-${revisionNumber}.mp4`),
    renderer: rendererName,
    durationMs: validation.durationMs,
    hasAudio: validation.hasAudio,
    blackSegments: validation.blackSegments,
    warnings
  };
}

/** 预览任务只生成指定帧窗，供 Web/MCP 在结构修改后快速检查真实合成结果。 */
export async function runPreviewJob(
  application: EditingApplication,
  job: JobRecord,
  renderer = new RevisionRenderer()
): Promise<Record<string, unknown>> {
  const revisionNumber = Number(job.payload.revision);
  const fromFrame = Number(job.payload.fromFrame);
  const toFrame = Number(job.payload.toFrame);
  if (!Number.isInteger(revisionNumber) || !Number.isInteger(fromFrame) || !Number.isInteger(toFrame)) {
    throw new DomainError("局部预览任务缺少有效 Revision 或帧范围", "INVALID_PREVIEW_RANGE");
  }
  const revision = application.repository.getRevision(job.projectId, revisionNumber);
  if (fromFrame < 0 || toFrame <= fromFrame || toFrame > revision.snapshot.timeline.durationInFrames) {
    throw new DomainError("局部预览范围超出指定 Revision", "INVALID_PREVIEW_RANGE");
  }
  const relativePath = join("previews", `revision-${revisionNumber}-${fromFrame}-${toFrame}.mp4`);
  const targetPath = join(revision.snapshot.project.rootPath, relativePath);
  await mkdir(dirname(targetPath), { recursive: true });
  await renderer.renderRange(revision.snapshot, fromFrame, toFrame, targetPath);
  const metadata = await probeMedia(targetPath);
  const expectedDurationMs = Math.round(((toFrame - fromFrame) / revision.snapshot.timeline.fps) * 1000);
  if (metadata.durationMs <= 0 || !metadata.videoCodec || Math.abs(metadata.durationMs - expectedDurationMs) > 1_000) {
    throw new DomainError("局部预览文件不可读或时长异常", "INVALID_PREVIEW_OUTPUT");
  }
  return {
    revision: revisionNumber,
    fromFrame,
    toFrame,
    path: targetPath,
    relativePath,
    durationMs: metadata.durationMs,
    hasAudio: metadata.hasAudio
  };
}
