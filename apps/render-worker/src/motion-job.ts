import { hashMediaFile } from "../../../packages/edit-application/src/media-intelligence.js";
import { cp } from "node:fs/promises";
import type { Asset } from "@videocut/contracts";
import { frozenSourceDisplaySchema } from "../../../packages/contracts/src/source-display-policy.js";
import { checkMotionSourceDisplay } from "../../../packages/edit-application/src/source-display-checks.js";
import { MotionDiagnostics } from "./motion-diagnostics.js";
import { readRuntimeConfig } from "@videocut/project-overview";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, realpath, rename, rm, stat, writeFile } from "node:fs/promises";
import { basename, isAbsolute, join, relative, resolve } from "node:path";
import type { EditingApplication } from "@videocut/application";
import type { FrozenMotionContinuation, JobRecord } from "@videocut/contracts";
import { checkMotionRangeCompatibility, motionRangeExpectation } from "../../../packages/edit-application/src/motion-range-replacement.js";
import { probeMedia } from "@videocut/speech";
import { boundMotionFontSchema, boundMotionImageSchema, boundMotionVideoSchema, motionSubmissionSchema, motionFrameRangeSchema, parseMotionEvents } from "../../../packages/motion-work/src/schema.js";
import { prepareMotionFonts } from "../../../packages/motion-work/src/fonts.js";
import { motionPixelKey, motionHash, motionHashEngine, MOTION_ENGINE_VERSION } from "../../../packages/motion-work/src/compiler.js";
import { initializeManagedMotion, motionFrameName, renderManagedMotion, verifyMotionPreviewFrames, type MotionRenderResult } from "./motion-renderer.js";
import { MotionDeterminismError } from "./motion-determinism.js";
import { prepareMotionVideos } from "./motion-video.js";
import { prepareMotionImages, type MotionImageDecode } from "./motion-images.js";
import { DomainError } from "@videocut/domain";

export async function runMotionJob(application: EditingApplication, job: JobRecord, render = renderManagedMotion, signal?: AbortSignal): Promise<Record<string, unknown>> {
  const diagnostics = new MotionDiagnostics({ jobId: job.id, version: job.payload.version, releaseId: readRuntimeConfig().runtime.releaseId }, state => application.recordJobCheckpoint(job.id, { motionProgress: state }));
  try { return await executeMotionJob(application, job, render, signal, diagnostics); }
  catch (error) {
    const current = application.trackJob(job.id);
    try {
      const report = await diagnostics.save(readRuntimeConfig().workspace.root, job.id, error);
      application.updateJob(job.id, { status: current.status, result: { ...current.result, motionFailure: report } });
    } catch (persistError) {
      diagnostics.additional(persistError, "diagnostic_persistence");
      try { application.recordJobCheckpoint(job.id, { motionFailure: { ...diagnostics.summary(), persistenceError: String(persistError) } }); }
      catch (checkpointError) { console.error("动画诊断保存失败", String(persistError), String(checkpointError)); }
    }
    throw error;
  }
}

async function executeMotionJob(application: EditingApplication, job: JobRecord, render: typeof renderManagedMotion, signal: AbortSignal | undefined, diagnostics: MotionDiagnostics): Promise<Record<string, unknown>> {
  const startedAt = Date.now();
  signal?.throwIfAborted();
  const saved = application.trackJob(job.id).result?.continuation;
  if (saved) return { assetId: (saved as { assetId: string }).assetId, continuation: saved };
  if (job.payload.engineVersion !== MOTION_ENGINE_VERSION) throw new DomainError("历史作品产物保持可读；重新生成须按当前合同提交新版本", "MOTION_ENGINE_UPGRADE_REQUIRED");
  const work = motionSubmissionSchema.parse(job.payload.work);
  const frameRange = job.payload.frameRange ? motionFrameRangeSchema.parse(job.payload.frameRange) : undefined;
  const proof = job.payload.outputIntent === "proof" || Boolean(frameRange && job.payload.outputIntent !== "asset");
  const startFrame = frameRange?.startFrame ?? 0, endFrame = frameRange?.endFrame ?? work.durationInFrames;
  if (endFrame > work.durationInFrames) throw new DomainError("校样窗口超出作品", "MOTION_PROOF_RANGE_INVALID");
  const frameCount = endFrame - startFrame;
  const continuation = job.payload.continuation as FrozenMotionContinuation | undefined;
  const rangeExpectation = continuation?.request.action === "replace_range"
    ? motionRangeExpectation(application.repository.getRevision(job.projectId, Number(job.payload.requestedRevision)).snapshot, { cueId: continuation.request.cueId, ...continuation.request.targetRange })
    : undefined;
  if (rangeExpectation && !frameRange && job.payload.outputIntent !== "prepare") throw new DomainError("局部自动采用需要明确作品根范围", "MOTION_RANGE_INVALID");
  const rangeCandidate = rangeExpectation && frameRange ? { width: work.width, height: work.height, fps: work.fps, frameCount,
    rootRange: { ...frameRange, fullDurationInFrames: work.durationInFrames } } : undefined;
  if (rangeExpectation && rangeCandidate) checkMotionRangeCompatibility(rangeExpectation, rangeCandidate);
  const boundImages = boundMotionImageSchema.array().parse(job.payload.boundImages ?? []);
  const boundVideos = boundMotionVideoSchema.array().parse(job.payload.boundVideos ?? []);
  const boundFonts = boundMotionFontSchema.array().parse(job.payload.boundFonts ?? []);
  const sourceDisplay = job.payload.sourceDisplay === undefined ? undefined : frozenSourceDisplaySchema.parse(job.payload.sourceDisplay);
  if (sourceDisplay) checkMotionSourceDisplay(work.source, work.props, sourceDisplay);
  const hashEngineVersion = motionHashEngine(work, boundImages, job.payload.version, job.payload.engineVersion, boundVideos, boundFonts, sourceDisplay);
  const version = motionHash(work, boundImages, hashEngineVersion, boundVideos, boundFonts, sourceDisplay);
  if (job.kind !== "motion_generation" || version !== job.payload.version) throw new Error("MOTION_VERSION_MISMATCH");
  if (Object.keys(work.imageBindings).length !== boundImages.length || new Set(boundImages.map((image) => image.slot)).size !== boundImages.length || boundImages.some((image) => work.imageBindings[image.slot] !== image.assetId)) throw new Error("MOTION_IMAGE_BINDING_MISMATCH");
  if (Object.keys(work.videoBindings ?? {}).length !== boundVideos.length || new Set(boundVideos.map(v => v.slot)).size !== boundVideos.length || boundVideos.some(v => { const b = work.videoBindings?.[v.slot]; return !b || b.assetId !== v.assetId || b.sourceStartMs !== v.sourceStartMs || b.sourceEndMs !== v.sourceEndMs || b.startFrame !== v.startFrame || b.endFrame !== v.endFrame || b.decodeScale !== v.decodeScale; })) throw new Error("MOTION_VIDEO_BINDING_MISMATCH");
  if (Object.keys(work.fontBindings ?? {}).length !== boundFonts.length || new Set(boundFonts.map(f => f.slot)).size !== boundFonts.length
    || boundFonts.some(f => work.fontBindings?.[f.slot] !== f.fontId || f.family !== `VFC_${f.hash}`)) throw new Error("MOTION_FONT_BINDING_MISMATCH");
  diagnostics.stage("font_preparation");
  const fonts = prepareMotionFonts(work, boundFonts);
  const snapshot = application.readProject(job.projectId).snapshot;
  if (job.payload.outputIntent === "prepare") {
    const prepareRoot = join(snapshot.project.rootPath, "cache", "motion-prepare");
    await mkdir(prepareRoot, { recursive: true });
    const temporary = await mkdtemp(join(prepareRoot, ".prepare-"));
    let provider: Awaited<ReturnType<typeof prepareMotionVideos>> | undefined;
    try {
      const bytes = Object.fromEntries(await Promise.all(boundImages.map(async image => {
        const path = await realpath(resolve(snapshot.project.rootPath, image.managedPath));
        const content = await readFile(path);
        if (createHash("sha256").update(content).digest("hex") !== image.hash) throw new Error("MOTION_IMAGE_CHANGED");
        return [image.slot, content];
      })));
      const { imageData } = await prepareMotionImages(bytes, join(temporary, "resources"), signal, diagnostics);
      provider = await prepareMotionVideos(snapshot.project.rootPath, temporary, work, boundVideos, hashEngineVersion, signal);
      const initialized = await initializeManagedMotion(work, temporary, imageData, provider, signal ?? new AbortController().signal, fonts, diagnostics, sourceDisplay);
      await provider.verifySources();
      const eventMap = initialized.events === undefined ? undefined : { version, fps: work.fps, frameCount: work.durationInFrames, events: initialized.events };
      const registered = application.completeSourceMotionWork(job.projectId, job.id, eventMap);
      return { kind: "motion_work", workId: registered.id, version, revision: application.readProject(job.projectId).revision.number, capturedFrames: 0 };
    } finally { await provider?.close(); await rm(temporary, { recursive: true, force: true }); }
  }
  const parent = proof ? join(snapshot.project.rootPath, "previews", "motion", job.id) : join(snapshot.project.rootPath, "assets", "derived", "motion", job.id);
  const directory = join(parent, version);
  await mkdir(parent, { recursive: true });
  const pixelKey = motionPixelKey(work, boundImages, boundVideos, boundFonts, frameRange);
  const reusable = job.payload.reusableAsset as Asset | undefined;
  const reusableProof = job.payload.reusableProof as { jobId: string; version: string } | undefined;
  if (reusableProof && !await stat(directory).catch(() => undefined)) {
    const proofDirectory = join(snapshot.project.rootPath, "previews", "motion", reusableProof.jobId, reusableProof.version);
    const original = JSON.parse(await readFile(join(proofDirectory, "manifest.json"), "utf8"));
    if (proof || original.version !== version || original.pixelKey !== pixelKey || JSON.stringify(original.frameRange) !== JSON.stringify(frameRange)) throw new Error("MOTION_PROOF_REUSE_MISMATCH");
    const temporary = await mkdtemp(join(parent, ".adopt-"));
    try {
      // 正式登记保留独立产物，校样 Job 与原证据保持不变；随后走同一完整性检查。
      await cp(proofDirectory, temporary, { recursive: true });
      signal?.throwIfAborted(); await rename(temporary, directory);
    } finally { await rm(temporary, { recursive: true, force: true }); }
  }
  if (!proof && reusable?.motion?.output && !await stat(directory).catch(() => undefined)) {
    const previous = reusable.motion;
    if (previous.pixelKey !== pixelKey || await hashMediaFile(resolve(snapshot.project.rootPath, previous.output!.path)) !== previous.output!.hash) throw new Error("MOTION_REUSE_CHANGED");
    const temporary = await mkdtemp(join(parent, ".reuse-"));
    try {
      // 只复制固定产物和少量诊断；不重新启动捕获，也不依赖可回收的解码缓存。
      await cp(resolve(snapshot.project.rootPath, previous.output!.path, ".."), temporary, { recursive: true });
      const manifest = JSON.parse(await readFile(join(temporary, "manifest.json"), "utf8"));
      await writeFile(join(temporary, "source.json"), JSON.stringify(work, null, 2));
      await writeFile(join(temporary, "manifest.json"), JSON.stringify({ ...manifest, version, pixelKey, frameRange, boundImages, boundVideos, boundFonts, reusedFrom: reusable.id }, null, 2));
      signal?.throwIfAborted();
      await rename(temporary, directory);
    } finally { await rm(temporary, { recursive: true, force: true }); }
  }
  if (!await stat(directory).catch(() => undefined)) {
    const temporary = await mkdtemp(join(parent, ".render-"));
    let preserveTemporary = false;
    try {
      diagnostics.stage("image_preparation");
      const imageBytes: Record<string, Buffer> = {};
      if (fonts.length) {
        await mkdir(join(temporary, "resources", "font-files"), { recursive: true });
        for (const { binding, dataUrl, format } of new Map(fonts.map(font => [font.binding.hash, font])).values()) {
          // 按原件格式保存；TTF不伪装成OTF，缓存仍以内容哈希固定身份。
          await writeFile(join(temporary, "resources", "font-files", `${binding.hash}.${format}`), Buffer.from(dataUrl.split(",")[1], "base64"));
        }
      }
      if (boundImages.length) await mkdir(join(temporary, "resources"), { recursive: true });
      for (const image of boundImages) {
        const path = await realpath(resolve(snapshot.project.rootPath, image.managedPath));
        const relativePath = relative(await realpath(snapshot.project.rootPath), path);
        if (isAbsolute(relativePath) || relativePath.startsWith("..")) throw new Error("MOTION_IMAGE_PATH_REJECTED");
        const info = await stat(path);
        if (!info.isFile() || info.size > 8 * 1024 * 1024) throw new Error("MOTION_IMAGE_BUDGET");
        const bytes = await readFile(path);
        if (createHash("sha256").update(bytes).digest("hex") !== image.hash) throw new Error("MOTION_IMAGE_CHANGED");
        imageBytes[image.slot] = bytes;
        await writeFile(join(temporary, "resources", image.slot), bytes);
      }
      const { imageData, imageDecodes } = await prepareMotionImages(imageBytes, join(temporary, "resources"), signal, diagnostics);
      diagnostics.stage("video_preparation");
      const provider = await prepareMotionVideos(snapshot.project.rootPath, temporary, work, boundVideos, hashEngineVersion, signal);
      let rendered: MotionRenderResult;
      try {
        // 统一范围执行器预检整个 Job（含并发临时媒体），分路不再分别领取磁盘预算。
        rendered = await render(work, temporary, imageData, provider, signal, fonts, diagnostics, frameRange, sourceDisplay, { rangeExpectation });
        await provider.verifySources();
      } catch (error) {
        // 渲染失败也核查源身份，避免途中改变的原片留下可被下一版本命中的缓存。
        if (!signal?.aborted) { try { await provider.verifySources(); } catch (sourceError) { diagnostics.additional(sourceError, "verify_sources"); } }
        throw error;
      } finally { try { await provider.close(); } catch (closeError) { diagnostics.additional(closeError, "provider_close"); } }
      await writeFile(join(temporary, "source.html"), work.source);
      await writeFile(join(temporary, "source.json"), JSON.stringify(work, null, 2));
      const previewHash = await hashMediaFile(rendered.previewPath);
      await writeFile(join(temporary, "manifest.json"), JSON.stringify({ version, pixelKey, frameRange, hashEngineVersion, output: { ...rendered.output, path: basename(rendered.output.path) }, preview: { path: basename(rendered.previewPath), hash: previewHash }, previewHash, frameHashKind: "rgba-sha256", frameHashes: rendered.frameHashes, engineVersion: rendered.engineVersion, runtimeDependencies: rendered.runtimeDependencies, sandbox: rendered.sandbox, metrics: rendered.metrics, boundImages, imageDecodes, boundVideos, ...(boundFonts.length ? { boundFonts } : {}), videoDecodes: provider.videos, videoResources: provider.stats, events: rendered.events, determinism: rendered.determinism }, null, 2));
      signal?.throwIfAborted();
      if (application.trackJob(job.id).status === "cancelled") throw new DomainError("作品任务已取消", "MOTION_CANCELLED");
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
        throw error;
      }
      throw error;
    } finally {
      // temporary 由 mkdtemp 在此任务的受管目录中创建，绝不删除项目根或旧作品版本。
      if (!preserveTemporary) { try { await rm(temporary, { recursive: true, force: true }); } catch (cleanupError) { diagnostics.additional(cleanupError, "temporary_cleanup"); } }
    }
  }
  diagnostics.stage("output_validation");
  const manifest = JSON.parse(await readFile(join(directory, "manifest.json"), "utf8")) as MotionRenderResult & { version: string; hashEngineVersion?: string; previewHash: string; imageDecodes: MotionImageDecode[]; videoDecodes?: Record<string, unknown> };
  if (rangeExpectation && rangeCandidate) checkMotionRangeCompatibility(rangeExpectation, rangeCandidate);
  const storedSource = motionSubmissionSchema.parse(JSON.parse(await readFile(join(directory, "source.json"), "utf8")));
  if (manifest.version !== version || (manifest as any).pixelKey !== pixelKey || !Array.isArray(manifest.frameHashes) || manifest.frameHashes.length !== frameCount || JSON.stringify((manifest as any).frameRange) !== JSON.stringify(frameRange) || motionHash(storedSource, boundImages, manifest.hashEngineVersion ?? manifest.engineVersion, boundVideos, boundFonts, sourceDisplay) !== version) throw new Error("MOTION_CACHE_CORRUPT");
  if (JSON.stringify((manifest as any).boundFonts ?? []) !== JSON.stringify(boundFonts)) throw new Error("MOTION_FONT_CACHE_CORRUPT");
  for (const font of boundFonts) {
    try {
      const format = fonts.find(prepared => prepared.binding.slot === font.slot)!.format;
      if (createHash("sha256").update(await readFile(join(directory, "resources", "font-files", `${font.hash}.${format}`))).digest("hex") !== font.hash) throw new Error("文件校验值不符");
    } catch (error) { throw new Error(`MOTION_FONT_CACHE_CORRUPT: ${font.fontId}；${String(error)}`); }
  }
  for (const image of boundImages) {
    if (createHash("sha256").update(await readFile(join(directory, "resources", image.slot))).digest("hex") !== image.hash) throw new Error("MOTION_RESOURCE_CACHE_CORRUPT");
  }
  for (const image of manifest.imageDecodes) {
    if (boundImages.find(source => source.slot === image.slot)?.hash !== image.sourceHash
      || createHash("sha256").update(await readFile(join(directory, "resources", image.path))).digest("hex") !== image.decodedHash) throw new Error("MOTION_RESOURCE_CACHE_CORRUPT");
  }
  // 完整作品缓存独立于可回收的解码缓存；重生成时才需要重新检查原片。
  if (JSON.stringify((manifest as any).boundVideos ?? []) !== JSON.stringify(boundVideos)) throw new Error("MOTION_RESOURCE_CACHE_CORRUPT");
  const outputPath = join(directory, manifest.output.path);
  const sourceHash = await hashMediaFile(outputPath);
  if (sourceHash !== manifest.output.hash) throw new Error("MOTION_OUTPUT_CHANGED");
  const metadata = await probeMedia(outputPath);
  await verifyMotionPreviewFrames(outputPath, frameCount, work.fps);
  if (metadata.hasAudio || metadata.pixelFormat !== (work.compositing === "opaque" ? "yuv420p" : "bgra")
    || manifest.output.kind !== (work.compositing === "opaque" ? "opaque_video" : "alpha_video")
    || manifest.output.codec !== metadata.videoCodec || manifest.output.pixelFormat !== metadata.pixelFormat
    || metadata.width !== work.width || metadata.height !== work.height || metadata.videoCodec !== (work.compositing === "opaque" ? "h264" : "ffv1")
    || Math.abs(metadata.durationMs - frameCount / work.fps * 1000) > 1000 / work.fps + 2) throw new Error("MOTION_OUTPUT_MISMATCH");
  const previewPath = join(directory, (manifest as any).preview.path);
  if (await hashMediaFile(previewPath) !== manifest.previewHash) throw new Error("MOTION_PREVIEW_CACHE_CORRUPT");
  await verifyMotionPreviewFrames(previewPath, frameCount, work.fps);
  const eventMap = manifest.events === undefined ? undefined : { version, fps: work.fps, frameCount: work.durationInFrames, events: parseMotionEvents(manifest.events, work.durationInFrames) };
  signal?.throwIfAborted();
  diagnostics.stage("completed");
  if (proof) return { kind: "motion_proof", version, frameRange, frameCount, sourceHash,
    sourcePath: relative(snapshot.project.rootPath, join(directory, "source.json")), previewPath: relative(snapshot.project.rootPath, previewPath),
    fullWorkDurationInFrames: work.durationInFrames, scope: "局部同源校样；未登记完整作品素材", determinism: manifest.determinism };
  const asset = application.completeManagedMotion({ projectId: job.projectId, jobId: job.id, engineVersion: manifest.engineVersion, sourceHash, metadata: { ...metadata, hasAlpha: work.compositing !== "opaque" }, eventMap,
    output: { ...manifest.output, path: relative(snapshot.project.rootPath, outputPath).replaceAll("\\", "/") },
    ...(previewPath !== outputPath ? { preview: { path: relative(snapshot.project.rootPath, previewPath).replaceAll("\\", "/"), hash: manifest.previewHash } } : {}) });
  const motionDiagnostics = manifest.determinism ? { ...manifest.determinism, reportPath: relative(snapshot.project.rootPath, join(directory, "diagnostics", "report.json")).replaceAll("\\", "/") } : undefined;
  const reused = Boolean(reusable || reusableProof);
  // 采用旧媒体时，新 Job 的工作量不能沿用原捕获次数；历史渲染指标单独保留来源。
  const metrics = reused ? { capturedFrames: 0, captureMs: 0, seekMs: 0, screenshotMs: 0, pixelDecodeMs: 0, pipeWriteMs: 0, encoderFinishMs: 0, previewEncodeMs: 0,
    outputBytes: (await stat(outputPath)).size, peakWorkerRssBytes: process.memoryUsage().rss, wallMs: Date.now() - startedAt } : manifest.metrics;
  return { assetId: asset.id, continuation: application.trackJob(job.id).result?.continuation, version, frameRange, fullWorkDurationInFrames: work.durationInFrames, videoDecodes: manifest.videoDecodes, sandbox: manifest.sandbox, workReviewRequired: true, workId: asset.motion!.workId, previewPath: asset.motion!.preview?.path ?? asset.managedPath, output: asset.motion!.output, reused, metrics,
    ...(reused ? { reusedSourceMetrics: manifest.metrics } : {}), ...(motionDiagnostics ? { motionDiagnostics } : {}) };
}
