import { createHash } from "node:crypto";
import { createReadStream, existsSync } from "node:fs";
import { mkdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, extname, isAbsolute, join, relative, resolve } from "node:path";
import { bundle } from "@remotion/bundler";
import { ensureBrowser, renderMedia, selectComposition } from "@remotion/renderer";
import type { EditingApplication } from "@videocut/application";
import { EFFECT_TYPES, type AttributionManifest, type ExportArtifact, type ExportPurpose, type ExportTechnicalValidation, type JobRecord, type ProjectSnapshot, type RenderPreflight, type RenderPreflightCheck } from "@videocut/contracts";
import { createId, DomainError } from "@videocut/domain";
import { canExport, evaluateQuality, requiresEditorialReview } from "@videocut/quality";
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

function usedAssetIds(snapshot: ProjectSnapshot): Set<string> {
  return new Set([
    ...snapshot.timeline.items.filter((item) => !item.disabled).map((item) => item.assetId),
    ...snapshot.scenes.flatMap((scene) => scene.assetIds),
    ...snapshot.effectCues.flatMap((cue) => cue.assetBindings.map((binding) => binding.assetId)),
    ...snapshot.actorPerformances.flatMap((performance) => performance.maskAssetId ? [performance.maskAssetId] : []),
    ...(snapshot.speechAsset ? [snapshot.speechAsset.assetId] : [])
  ]);
}

function addPreflightCheck(checks: RenderPreflightCheck[], status: RenderPreflightCheck["status"], code: string, message: string, objectId?: string): void {
  checks.push({ status, code, message, objectId });
}

function resolveManagedAssetPath(snapshot: ProjectSnapshot, managedPath: string): string {
  if (/^[a-z][a-z0-9+.-]*:\/\//iu.test(managedPath)) {
    throw new DomainError("正式渲染不能直接引用远程临时 URL", "REMOTE_RENDER_ASSET");
  }
  const projectRoot = resolve(snapshot.project.rootPath);
  const targetPath = resolve(projectRoot, managedPath);
  assertPathWithin(projectRoot, targetPath);
  return targetPath;
}

/** 以流式方式计算最终文件哈希，避免大文件验证耗尽 Worker 内存。 */
async function sha256File(path: string): Promise<string> {
  const hash = createHash("sha256");
  await new Promise<void>((resolvePromise, reject) => {
    const stream = createReadStream(path);
    stream.on("data", (chunk: string | Buffer) => { hash.update(chunk); });
    stream.once("error", reject);
    stream.once("end", resolvePromise);
  });
  return hash.digest("hex");
}

/**
 * 预检只验证当前 Revision 的实际引用和当前 Renderer 可确定的依赖。
 * 它不会假装已做完整声画审片；真正的 Remotion 渲染和 Artifact 复核仍是后续独立证据。
 */
export async function runRenderPreflight(application: EditingApplication, projectId: string, revisionNumber: number): Promise<RenderPreflight> {
  const revision = application.repository.getRevision(projectId, revisionNumber);
  const snapshot = revision.snapshot;
  const checks: RenderPreflightCheck[] = [];
  const review = await application.readEditorialQualityReview({ projectId, revision: revisionNumber });
  const quality = evaluateQuality(snapshot, revisionNumber, review);
  for (const issue of quality.technical.filter((entry) => entry.level === "blocking")) {
    addPreflightCheck(checks, "failed", `QUALITY_${issue.code}`, issue.message, issue.objectId);
  }

  const assetIds = usedAssetIds(snapshot);
  const assetsById = new Map(snapshot.assets.map((asset) => [asset.id, asset]));
  for (const assetId of assetIds) {
    const asset = assetsById.get(assetId);
    if (!asset) {
      addPreflightCheck(checks, "failed", "PREFLIGHT_ASSET_MISSING", "当前 Revision 引用了不存在的素材。", assetId);
      continue;
    }
    if (asset.status !== "ready") {
      addPreflightCheck(checks, "failed", "PREFLIGHT_ASSET_NOT_READY", `素材“${asset.name}”尚未处于 render-ready 状态。`, asset.id);
      continue;
    }
    let assetPath: string;
    try {
      assetPath = resolveManagedAssetPath(snapshot, asset.managedPath);
      const file = await stat(assetPath);
      if (!file.isFile() || file.size <= 0) {
        addPreflightCheck(checks, "failed", "PREFLIGHT_ASSET_FILE_INVALID", `素材“${asset.name}”不是可读取的非空文件。`, asset.id);
        continue;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      addPreflightCheck(checks, "failed", "PREFLIGHT_ASSET_FILE_MISSING", `素材“${asset.name}”当前不可被 Render Worker 读取：${message}`, asset.id);
      continue;
    }
    const requiresMediaProbe = ["video", "audio", "actor_video", "speech"].includes(asset.kind)
      || Boolean(asset.metadata?.videoCodec || asset.metadata?.audioCodec);
    if (requiresMediaProbe) {
      try {
        const metadata = await probeMedia(assetPath);
        if (metadata.durationMs <= 0) throw new DomainError("媒体时长无效", "INVALID_MEDIA_DURATION");
        addPreflightCheck(checks, "passed", "PREFLIGHT_MEDIA_DECODABLE", `素材“${asset.name}”已通过当前 Worker 的媒体探测。`, asset.id);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        addPreflightCheck(checks, "failed", "PREFLIGHT_MEDIA_UNDECODABLE", `素材“${asset.name}”无法被当前 Worker 解码：${message}`, asset.id);
      }
    } else {
      addPreflightCheck(checks, "passed", "PREFLIGHT_ASSET_BYTES_AVAILABLE", `素材“${asset.name}”的本地文件可读取。`, asset.id);
    }

    const provenance = asset.provenance;
    if (provenance && provenance.source !== "local_import") {
      if (["unknown", "restricted", "rejected"].includes(provenance.rightsStatus)) {
        addPreflightCheck(checks, "failed", "PREFLIGHT_RIGHTS_BLOCKED", `素材“${asset.name}”的权利状态为 ${provenance.rightsStatus}，不能交付。`, asset.id);
      } else if (provenance.rightsStatus === "attribution_required" && !provenance.attributionText?.trim()) {
        addPreflightCheck(checks, "failed", "PREFLIGHT_ATTRIBUTION_MISSING", `素材“${asset.name}”需要署名，但缺少署名文本。`, asset.id);
      }
    }
  }

  for (const cue of snapshot.effectCues.filter((candidate) => candidate.status === "ready")) {
    if (!EFFECT_TYPES.includes(cue.type)) {
      addPreflightCheck(checks, "failed", "PREFLIGHT_EFFECT_COMPONENT_MISSING", `效果“${cue.type}”没有对应的 Remotion 组件。`, cue.id);
    }
  }
  if (!checks.some((check) => check.code === "PREFLIGHT_EFFECT_COMPONENT_MISSING")) {
    addPreflightCheck(checks, "passed", "PREFLIGHT_EFFECT_COMPONENTS_AVAILABLE", "当前 Revision 的已启用效果均可由现有 Remotion Registry 解析。");
  }
  // 第一版未开放项目级自定义字体；这里明确记录依赖边界，实际字体渲染仍由正式 Render 再验证。
  addPreflightCheck(checks, "passed", "PREFLIGHT_FONT_RUNTIME", "当前首版只使用 Remotion 运行时固定字体栈，不存在额外的项目级字体文件依赖。");

  return {
    id: createId("render_preflight"),
    projectId,
    revision: revisionNumber,
    status: checks.some((check) => check.status === "failed") ? "failed" : "passed",
    checks,
    checkedAt: new Date().toISOString()
  };
}

function buildAttributionManifest(snapshot: ProjectSnapshot, artifactId: string): AttributionManifest {
  const assetIds = usedAssetIds(snapshot);
  const entries = snapshot.assets
    .filter((asset) => assetIds.has(asset.id) && asset.provenance && asset.provenance.source !== "local_import")
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((asset) => ({
      assetId: asset.id,
      name: asset.name,
      sourceHash: asset.sourceHash,
      source: asset.provenance!.source,
      provider: asset.provenance!.provider,
      sourceUrl: asset.provenance!.sourceUrl,
      creator: asset.provenance!.creator,
      license: asset.provenance!.license,
      attributionText: asset.provenance!.attributionText,
      rightsStatus: asset.provenance!.rightsStatus
    }));
  return {
    relativePath: join("manifests", "attribution", `${artifactId}.json`),
    generatedAt: new Date().toISOString(),
    entries
  };
}

async function writeAttributionManifest(snapshot: ProjectSnapshot, manifest: AttributionManifest): Promise<void> {
  const targetPath = resolve(snapshot.project.rootPath, manifest.relativePath);
  assertPathWithin(resolve(snapshot.project.rootPath), targetPath);
  await mkdir(dirname(targetPath), { recursive: true });
  const temporaryPath = `${targetPath}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await rename(temporaryPath, targetPath);
}

/**
 * Remotion bundle 在一个 Worker 进程内复用，但每个 Job 都新开隔离媒体服务，
 * 因此导出始终读取任务绑定的不可变 Revision 快照。
 */
export class RevisionRenderer {
  private bundleLocation?: Promise<string>;
  private readonly entryPoint: string;
  private readonly concurrency: string | number | null;

  constructor(
    entryPoint = fileURLToPath(new URL("./render-entry.tsx", import.meta.url)),
    concurrency: string | number | null = "50%"
  ) {
    this.entryPoint = entryPoint;
    this.concurrency = concurrency;
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
        concurrency: this.concurrency,
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
        concurrency: this.concurrency,
        timeoutInMilliseconds: 30 * 60_000,
        logLevel: "error"
      });
    } finally {
      await mediaServer.close();
    }
  }
}

export interface ExportValidation extends ExportTechnicalValidation {}

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
  // 旧 Job 没有 purpose 时按 delivery 处理，避免历史队列绕过新交付门禁。
  const purpose: ExportPurpose = job.payload.purpose === "draft" ? "draft" : "delivery";
  if (!Number.isInteger(revisionNumber) || revisionNumber <= 0) throw new DomainError("导出任务缺少有效 Revision", "INVALID_EXPORT_REVISION");
  const revision = application.repository.getRevision(job.projectId, revisionNumber);
  // Worker 在写入 Artifact 后、回写 Job 前意外中断时，重领同一 Job 必须复用既有文件，不能重新覆盖它。
  const existingArtifact = application.repository.getExportArtifactForJob(job.projectId, job.id);
  if (existingArtifact) {
    const existingPath = join(revision.snapshot.project.rootPath, existingArtifact.relativePath);
    const existingFile = await stat(existingPath).catch(() => undefined);
    if (!existingFile?.isFile() || existingFile.size !== existingArtifact.fileSizeBytes) {
      throw new DomainError("已登记的 ExportArtifact 文件缺失或已变化，不能把未知结果标记为成功", "EXPORT_ARTIFACT_CHANGED");
    }
    if (await sha256File(existingPath) !== existingArtifact.fileHash) {
      throw new DomainError("已登记的 ExportArtifact 文件哈希已变化，不能把未知结果标记为成功", "EXPORT_ARTIFACT_CHANGED");
    }
    return {
      artifactId: existingArtifact.id,
      revision: existingArtifact.revision,
      purpose: existingArtifact.purpose,
      path: existingPath,
      relativePath: existingArtifact.relativePath,
      renderer: "remotion",
      preflight: existingArtifact.preflight,
      validation: existingArtifact.validation,
      attributionManifest: existingArtifact.attributionManifest,
      warnings: []
    };
  }
  const editorialReview = await application.readEditorialQualityReview({ projectId: job.projectId, revision: revisionNumber });
  const report = evaluateQuality(revision.snapshot, revisionNumber, editorialReview);
  if (!canExport(report, purpose)) {
    const blockingMessages = report.issues.filter((entry) => entry.level === "blocking").map((entry) => entry.message);
    if (blockingMessages.length > 0) throw new DomainError(`质量门禁阻止导出：${blockingMessages.join("；")}`, "QUALITY_GATE_BLOCKED");
    if (requiresEditorialReview(report, purpose)) {
      throw new DomainError(`交付导出要求 R${revisionNumber} 已完成当前 Revision 的真实 Preview、完整声画审片与首次观众复核；请先记录 Editorial Review。`, "EDITORIAL_REVIEW_REQUIRED");
    }
    throw new DomainError("导出门禁未通过。", "QUALITY_GATE_BLOCKED");
  }
  const preflight = await runRenderPreflight(application, job.projectId, revisionNumber);
  if (preflight.status !== "passed") {
    const failures = preflight.checks.filter((check) => check.status === "failed").map((check) => check.message);
    throw new DomainError(`Render Preflight 未通过：${failures.join("；")}`, "RENDER_PREFLIGHT_FAILED");
  }
  const artifactId = createId("export_artifact");
  const relativePath = join("exports", `revision-${revisionNumber}`, `${purpose}-${artifactId}.mp4`);
  const targetPath = join(revision.snapshot.project.rootPath, relativePath);
  const temporaryPath = `${targetPath}.${job.id}.rendering.mp4`;
  await mkdir(dirname(targetPath), { recursive: true });
  try {
    await renderer.render(revision.snapshot, temporaryPath);
  } catch (renderError) {
    const reason = renderError instanceof Error ? renderError.message : String(renderError);
    await rm(temporaryPath, { force: true }).catch(() => undefined);
    // 正式交付只能来自完整 Remotion Composition；不能把缺少字幕、动效与 Dialogue 的 A-roll 当成功。
    throw new DomainError(`Remotion 正式导出失败，未生成可交付文件：${reason}`, "REMOTION_EXPORT_FAILED");
  }
  try {
    const expectedDurationMs = Math.round((revision.snapshot.timeline.durationInFrames / revision.snapshot.timeline.fps) * 1000);
    const validation = await validateExport(temporaryPath, expectedDurationMs);
    await rename(temporaryPath, targetPath);
    const file = await stat(targetPath);
    const manifest = buildAttributionManifest(revision.snapshot, artifactId);
    try {
      await writeAttributionManifest(revision.snapshot, manifest);
      const artifact: ExportArtifact = {
        id: artifactId,
        projectId: job.projectId,
        revision: revisionNumber,
        jobId: job.id,
        purpose,
        relativePath,
        fileHash: await sha256File(targetPath),
        fileSizeBytes: file.size,
        preflight,
        validation,
        attributionManifest: manifest,
        createdAt: new Date().toISOString()
      };
      application.registerExportArtifact(artifact);
      return {
        artifactId: artifact.id,
        revision: revisionNumber,
        purpose,
        path: targetPath,
        relativePath,
        renderer: "remotion",
        preflight,
        validation,
        attributionManifest: manifest,
        warnings: []
      };
    } catch (error) {
      // 路径带有新的 Artifact ID，清理失败提交的候选不会影响任何历史交付文件。
      await rm(targetPath, { force: true }).catch(() => undefined);
      await rm(join(revision.snapshot.project.rootPath, manifest.relativePath), { force: true }).catch(() => undefined);
      throw error;
    }
  } catch (error) {
    await rm(temporaryPath, { force: true }).catch(() => undefined);
    throw error;
  }
}

/** 预检 Job 完成表示“检查已执行”；status=failed 说明不应进入 Export，而不是 Job 本身异常。 */
export async function runRenderPreflightJob(application: EditingApplication, job: JobRecord): Promise<Record<string, unknown>> {
  const revisionNumber = Number(job.payload.revision);
  if (!Number.isInteger(revisionNumber) || revisionNumber <= 0) throw new DomainError("Render Preflight 任务缺少有效 Revision", "INVALID_PREFLIGHT_REVISION");
  const preflight = await runRenderPreflight(application, job.projectId, revisionNumber);
  return { revision: revisionNumber, preflight };
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
