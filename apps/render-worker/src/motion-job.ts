import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, realpath, rename, rm, stat, writeFile } from "node:fs/promises";
import { basename, isAbsolute, join, relative, resolve } from "node:path";
import type { EditingApplication } from "@videocut/application";
import type { JobRecord, MotionVisibility } from "@videocut/contracts";
import { probeMedia } from "@videocut/speech";
import { boundMotionImageSchema, boundMotionVideoSchema, motionSubmissionSchema, parseMotionEvents } from "../../../packages/motion-work/src/schema.js";
import { motionHash, motionHashEngine } from "../../../packages/motion-work/src/compiler.js";
import { motionFrameName, renderManagedMotion, verifyMotionPreviewFrames, type MotionRenderResult } from "./motion-renderer.js";
import { measureMotionVisibility } from "./motion-visibility.js";
import { MotionDeterminismError } from "./motion-determinism.js";
import { prepareMotionVideos, hashMotionFile } from "./motion-video.js";
import { DomainError } from "@videocut/domain";

export async function runMotionJob(application: EditingApplication, job: JobRecord, render = renderManagedMotion): Promise<Record<string, unknown>> {
  const work = motionSubmissionSchema.parse(job.payload.work);
  const boundImages = boundMotionImageSchema.array().parse(job.payload.boundImages ?? []);
  const boundVideos = boundMotionVideoSchema.array().parse(job.payload.boundVideos ?? []);
  const hashEngineVersion = motionHashEngine(work, boundImages, job.payload.version, job.payload.engineVersion, boundVideos);
  const version = motionHash(work, boundImages, hashEngineVersion, boundVideos);
  if (job.kind !== "motion_generation" || version !== job.payload.version) throw new Error("MOTION_VERSION_MISMATCH");
  if (Object.keys(work.imageBindings).length !== boundImages.length || new Set(boundImages.map((image) => image.slot)).size !== boundImages.length || boundImages.some((image) => work.imageBindings[image.slot] !== image.assetId)) throw new Error("MOTION_IMAGE_BINDING_MISMATCH");
  if (Object.keys(work.videoBindings ?? {}).length !== boundVideos.length || new Set(boundVideos.map(v => v.slot)).size !== boundVideos.length || boundVideos.some(v => { const b = work.videoBindings?.[v.slot]; return !b || b.assetId !== v.assetId || b.sourceStartMs !== v.sourceStartMs || b.sourceEndMs !== v.sourceEndMs; })) throw new Error("MOTION_VIDEO_BINDING_MISMATCH");
  const snapshot = application.readProject(job.projectId).snapshot;
  const directory = join(snapshot.project.rootPath, "assets", "derived", "motion", job.id, version);
  const parent = join(snapshot.project.rootPath, "assets", "derived", "motion", job.id);
  let visibility: MotionVisibility | undefined;
  await mkdir(parent, { recursive: true });
  if (!await stat(directory).catch(() => undefined)) {
    const temporary = await mkdtemp(join(parent, ".render-"));
    let preserveTemporary = false;
    try {
      const imageData: Record<string, string> = {};
      if (boundImages.length) await mkdir(join(temporary, "resources"));
      for (const image of boundImages) {
        const path = await realpath(resolve(snapshot.project.rootPath, image.managedPath));
        const relativePath = relative(await realpath(snapshot.project.rootPath), path);
        if (isAbsolute(relativePath) || relativePath.startsWith("..")) throw new Error("MOTION_IMAGE_PATH_REJECTED");
        const info = await stat(path);
        if (!info.isFile() || info.size > 8 * 1024 * 1024) throw new Error("MOTION_IMAGE_BUDGET");
        const bytes = await readFile(path);
        if (createHash("sha256").update(bytes).digest("hex") !== image.hash) throw new Error("MOTION_IMAGE_CHANGED");
        const mime = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? "image/png" : bytes[0] === 255 && bytes[1] === 216 ? "image/jpeg" : bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP" ? "image/webp" : undefined;
        if (!mime) throw new Error("MOTION_IMAGE_FORMAT: 支持已验证 PNG、JPEG、WebP 图片");
        imageData[image.slot] = `data:${mime};base64,${bytes.toString("base64")}`;
        await writeFile(join(temporary, "resources", image.slot), bytes);
      }
      const videos = await prepareMotionVideos(snapshot.project.rootPath, temporary, work, boundVideos);
      const rendered = await render(work, temporary, imageData, videos);
      await rm(join(temporary, "decoded-video"), { recursive: true, force: true });
      visibility = await measureMotionVisibility(temporary, work.durationInFrames, work.width, work.height);
      await writeFile(join(temporary, "source.json"), JSON.stringify(work, null, 2));
      const previewHash = createHash("sha256").update(await readFile(rendered.previewPath)).digest("hex");
      await writeFile(join(temporary, "manifest.json"), JSON.stringify({ version, hashEngineVersion, previewHash, frameHashes: rendered.frameHashes, engineVersion: rendered.engineVersion, sandbox: rendered.sandbox, boundImages, boundVideos, visibility, events: rendered.events, determinism: rendered.determinism }, null, 2));
      await rename(temporary, directory);
    } catch (error) {
      if (error instanceof MotionDeterminismError) {
        // 只保留小量对比证据，失败帧缓存仍清理；诊断归属 Job，不创建 Asset 或视频 Revision。
        const diagnostics = join(parent, `diagnostics-${basename(temporary).slice(".render-".length)}`);
        try {
          await rename(join(temporary, "diagnostics"), diagnostics);
        } catch (persistError) {
          preserveTemporary = true;
          throw new DomainError(`${error.message}；诊断迁移失败，证据保留于 ${join(temporary, "diagnostics")}：${String(persistError)}`, "MOTION_DIAGNOSTIC_PERSIST_FAILED");
        }
        const reportPath = relative(snapshot.project.rootPath, join(diagnostics, "report.json")).replaceAll("\\", "/");
        const current = application.trackJob(job.id);
        application.updateJob(job.id, { status: current.status, result: { ...current.result, motionDiagnostics: { ...error.report, reportPath } } });
        throw new DomainError(`${error.message}；差异报告：${reportPath}`, error.code);
      }
      throw error;
    } finally {
      // temporary 由 mkdtemp 在此任务的受管目录中创建，绝不删除项目根或旧作品版本。
      if (!preserveTemporary) await rm(temporary, { recursive: true, force: true });
    }
  }
  const manifest = JSON.parse(await readFile(join(directory, "manifest.json"), "utf8")) as MotionRenderResult & { version: string; hashEngineVersion?: string; previewHash: string; visibility?: MotionVisibility };
  const storedSource = motionSubmissionSchema.parse(JSON.parse(await readFile(join(directory, "source.json"), "utf8")));
  if (manifest.version !== version || !Array.isArray(manifest.frameHashes) || manifest.frameHashes.length !== work.durationInFrames || motionHash(storedSource, boundImages, manifest.hashEngineVersion ?? manifest.engineVersion, boundVideos) !== version) throw new Error("MOTION_CACHE_CORRUPT");
  for (const image of boundImages) {
    if (createHash("sha256").update(await readFile(join(directory, "resources", image.slot))).digest("hex") !== image.hash) throw new Error("MOTION_RESOURCE_CACHE_CORRUPT");
  }
  for (const video of boundVideos) if (await hashMotionFile(join(directory, "resources", `video-${video.slot}`)) !== video.hash) throw new Error("MOTION_RESOURCE_CACHE_CORRUPT");
  for (let frame = 0; frame < work.durationInFrames; frame++) {
    const bytes = await readFile(join(directory, "frames", motionFrameName(frame)));
    if (createHash("sha256").update(bytes).digest("hex") !== manifest.frameHashes[frame]) throw new Error("MOTION_CACHE_CORRUPT");
  }
  const previewPath = join(directory, "preview.mp4");
  const metadata = await probeMedia(previewPath);
  await verifyMotionPreviewFrames(previewPath, work.durationInFrames, work.fps);
  if (metadata.width !== work.width || metadata.height !== work.height || Math.abs(metadata.durationMs - work.durationInFrames / work.fps * 1000) > 1000 / work.fps + 2) throw new Error("MOTION_OUTPUT_MISMATCH");
  const sourceHash = createHash("sha256").update(await readFile(previewPath)).digest("hex");
  if (sourceHash !== manifest.previewHash) throw new Error("MOTION_PREVIEW_CACHE_CORRUPT");
  // 缓存命中也从已校验 PNG 重测，不能让损坏的元数据伪装成安全证据；兼容没有测量的旧缓存。
  visibility ??= await measureMotionVisibility(directory, work.durationInFrames, work.width, work.height);
  if (manifest.visibility && JSON.stringify(manifest.visibility) !== JSON.stringify(visibility)) throw new Error("MOTION_VISIBILITY_CACHE_CORRUPT");
  const eventMap = manifest.events === undefined ? undefined : { version, fps: work.fps, frameCount: work.durationInFrames, events: parseMotionEvents(manifest.events, work.durationInFrames) };
  const asset = application.completeManagedMotion({ projectId: job.projectId, jobId: job.id, engineVersion: manifest.engineVersion, sourceHash, metadata, visibility, eventMap });
  const motionDiagnostics = manifest.determinism ? { ...manifest.determinism, reportPath: relative(snapshot.project.rootPath, join(directory, "diagnostics", "report.json")).replaceAll("\\", "/") } : undefined;
  return { assetId: asset.id, version, sandbox: manifest.sandbox, workReviewRequired: true, sourcePath: asset.motion!.sourcePath, previewPath: asset.managedPath, ...(motionDiagnostics ? { motionDiagnostics } : {}) };
}
