import { createMotionStreamEncoder } from "./motion-stream-encoder.js";
import type { Asset } from "@videocut/contracts";
import { stat } from "node:fs/promises";
import { checkMotionDisplayTexts } from "../../../packages/edit-application/src/source-display-checks.js";
import type { FrozenSourceDisplay } from "../../../packages/contracts/src/source-display-policy.js";
import { MotionDiagnostics } from "./motion-diagnostics.js";
import { createHash } from "node:crypto";
import { copyFile, mkdir, mkdtemp, readFile, readdir, rename, rm, statfs, writeFile } from "node:fs/promises";
import { isAbsolute, join, relative, resolve } from "node:path";
import puppeteer, { type Browser, type Page } from "puppeteer-core";
import { PNG } from "pngjs";
import { compileMotion, motionContentSecurityPolicy, MOTION_ENGINE_VERSION } from "../../../packages/motion-work/src/compiler.js";
import type { MotionVideoProvider, MotionSubmission, MotionFrameRange } from "../../../packages/motion-work/src/schema.js";
import { readRuntimeConfig } from "@videocut/project-overview";
import { resolveRenderBrowser } from "./exporter.js";
import { runProcess } from "@videocut/speech";
import { parseMotionEvents } from "../../../packages/motion-work/src/schema.js";
import type { MotionEvent } from "@videocut/contracts";
import { MotionDeterminismError, saveMotionFrameDifference, verifyMotionDeterminism, type MotionDeterminismReport } from "./motion-determinism.js";
import { checkMotionDiskSpace, checkMotionOutputBudget, motionOutputBudget } from "./motion-output-budget.js";
import { runMotionProcess } from "./motion-process.js";
import { HYPERFRAMES_DEPENDENCIES } from "../../../packages/motion-work/src/hyperframes-contract.js";
import type { PreparedMotionFont } from "../../../packages/motion-work/src/fonts.js";
import { checkMotionRangeCompatibility, type MotionRangeCandidate, type MotionRangeExpectation } from "../../../packages/edit-application/src/motion-range-replacement.js";

export interface MotionRenderResult { metrics?: { captureMs: number; seekMs: number; screenshotMs: number; pixelDecodeMs: number; pipeWriteMs: number; encoderFinishMs: number; previewEncodeMs: number; peakWorkerRssBytes: number; outputBytes: number; capturedFrames: number; wallMs?: number; concurrency?: number; lanes?: { startFrame: number; endFrame: number; startedAt: string; finishedAt: string; wallMs: number }[] }; frameHashes: string[]; runtimeDependencies?: typeof HYPERFRAMES_DEPENDENCIES; output: NonNullable<NonNullable<Asset["motion"]>["output"]>; previewPath: string; engineVersion: string; sandbox: string; events?: MotionEvent[]; determinism?: MotionDeterminismReport; }

export interface MotionExecutionOptions { concurrency?: 1 | 2 | 4; rangeExpectation?: MotionRangeExpectation; }
type MotionLaneResult = Pick<MotionRenderResult, "frameHashes" | "events" | "determinism"> & {
  outputPath: string; metrics: NonNullable<MotionRenderResult["metrics"]>;
  nextFrame?: { hash: string; png: Buffer };
};
interface MotionLaneOptions {
  samples: Set<number>;
  verifyNextFrame: boolean;
  progress(frame: number): void;
  rangeCheck?: { expected: MotionRangeExpectation; candidate: MotionRangeCandidate };
}

/** 失败关闭也有限时；否则导航已超时却被finally的关闭等待拖住。 */
export async function closeMotionBrowser(browser: Pick<Browser, "close" | "process">, diagnostics: MotionDiagnostics, timeoutMs = 3000) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([browser.close(), new Promise<void>(resolve => {
      timer = setTimeout(() => {
        diagnostics.event("browser_close_timeout");
        diagnostics.terminate("close_timeout"); browser.process()?.kill(); resolve();
      }, timeoutMs);
    })]);
  } catch (error) { diagnostics.additional(error, "browser_close"); browser.process()?.kill(); }
  finally { if (timer) clearTimeout(timer); }
}

export const motionFrameName = (frame: number) => `frame-${String(frame).padStart(5, "0")}.png`;

/** 仅允许本件已校验字体的准确hash与格式，不开放路径或外部资源。 */
export function resolveMotionFontRequest(url: string, fonts: PreparedMotionFont[]) {
  const match = /^https:\/\/motion\.invalid\/fonts\/([a-f0-9]{64})\.(otf|ttf)$/u.exec(url);
  return match ? fonts.find(font => font.binding.hash === match[1] && font.format === match[2]) : undefined;
}

/** 初始化超时与字体解码错误分别报告；浏览器异常不能被当作就绪。 */
export async function waitMotionStartup(page: Pick<Page, "waitForFunction" | "evaluate">, hasFonts: boolean): Promise<void> {
  try { await page.waitForFunction("window.__motionReady === true || !!window.__motionError", { timeout: 15_000 }); }
  catch (error) { if (hasFonts && error instanceof Error && error.name === "TimeoutError") throw new Error("MOTION_FONT_LOAD_TIMEOUT: 字体或动画初始化超时", { cause: error }); throw error; }
  const error = await page.evaluate(() => (window as unknown as { __motionError?: string }).__motionError);
  if (error) throw new Error(error);
}

/** 时长近似不能证明逐帧完整；审阅代理也必须与透明作品一帧不差。 */
export async function verifyMotionPreviewFrames(path: string, frameCount: number, fps: number): Promise<void> {
  const result = JSON.parse(await runProcess("ffprobe", ["-v", "error", "-select_streams", "v:0", "-count_frames", "-show_entries", "stream=nb_read_frames,avg_frame_rate", "-of", "json", path]));
  const stream = result.streams?.[0];
  const rate = String(stream?.avg_frame_rate).split("/").map(Number);
  if (Number(stream?.nb_read_frames) !== frameCount || rate[0] / rate[1] !== fps) {
    throw new Error(`MOTION_OUTPUT_MISMATCH: 预期 ${frameCount} 帧 / ${fps} fps，实际 ${stream?.nb_read_frames ?? "未知"} 帧 / ${stream?.avg_frame_rate ?? "未知"}`);
  }
}

/**
 * 生成代码只在无凭据的独立 Chromium 中运行，不使用 Remotion 默认的 --no-sandbox。
 * 响应级 CSP sandbox 建立 opaque origin；所有网络请求由拦截器拒绝，只有唯一内存文档可加载。
 */
export async function renderManagedMotion(input: MotionSubmission, directory: string, imageData: Record<string, string> = {}, provider?: MotionVideoProvider, signal?: AbortSignal, fonts: PreparedMotionFont[] = [], diagnostics = new MotionDiagnostics({}), frameRange?: MotionFrameRange, sourceDisplay?: FrozenSourceDisplay, options: MotionExecutionOptions = {}): Promise<MotionRenderResult> {
  signal?.throwIfAborted();
  const startedAt = Date.now();
  const startFrame = frameRange?.startFrame ?? 0, endFrame = frameRange?.endFrame ?? input.durationInFrames;
  if (!Number.isInteger(startFrame) || !Number.isInteger(endFrame) || startFrame < 0 || endFrame <= startFrame || endFrame > input.durationInFrames) throw new Error("MOTION_PROOF_RANGE_INVALID");
  const requested = options.concurrency ?? readRuntimeConfig().motion.renderConcurrency;
  if (![1, 2, 4].includes(requested)) throw new Error("MOTION_CONCURRENCY_INVALID");
  const frameCount = endFrame - startFrame, concurrency = Math.min(requested, frameCount);
  const ranges = Array.from({ length: concurrency }, (_, index) => ({
    startFrame: startFrame + Math.floor(frameCount * index / concurrency),
    endFrame: startFrame + Math.floor(frameCount * (index + 1) / concurrency)
  }));
  const rangeCheck = options.rangeExpectation && frameRange ? { expected: options.rangeExpectation, candidate: {
    width: input.width, height: input.height, fps: input.fps, frameCount: endFrame - startFrame,
    rootRange: { ...frameRange, fullDurationInFrames: input.durationInFrames }
  } } : undefined;
  const outputBudget = motionOutputBudget(input.width, input.height, frameCount, input.compositing, input.fps);
  // 拼接时分路媒体与最终媒体同时存在；只有包装层向共享 Provider 预留一次全任务空间。
  const temporaryBudget = concurrency === 1 ? 0 : ranges.reduce((sum, range) => sum + motionOutputBudget(input.width, input.height, range.endFrame - range.startFrame, input.compositing, input.fps), 0);
  await mkdir(join(directory, "frames"), { recursive: true });
  await provider?.reserveDiskSpace(outputBudget + temporaryBudget + (provider?.workingSetBytes ?? 0));
  const disk = await statfs(directory);
  checkMotionDiskSpace(disk.bavail * disk.bsize, outputBudget + temporaryBudget, provider?.workingSetBytes ?? 0);
  const laneRoot = await mkdtemp(join(directory, ".motion-lanes-"));
  const controller = new AbortController();
  const abort = () => controller.abort(signal?.reason);
  signal?.addEventListener("abort", abort, { once: true });
  if (signal?.aborted) abort();
  const outputPath = join(directory, input.compositing === "opaque" ? "output.mp4" : "output.mkv");
  const previewPath = input.compositing === "opaque" ? outputPath : join(directory, "preview.mp4");
  const counts = ranges.map(() => 0);
  const laneStates: Record<string, unknown>[] = ranges.map((range, lane) => ({ lane, ...range }));
  const laneMetrics: NonNullable<NonNullable<MotionRenderResult["metrics"]>["lanes"]> = [];
  const samples = new Set([startFrame, startFrame + Math.floor(frameCount / 2), endFrame - 1]);
  let firstFailure: unknown, failed = false, complete = false;
  await mkdir(join(directory, "diagnostics"), { recursive: true });
  diagnostics.stage("parallel_frame_rendering", { concurrency, startFrame, endFrame });
  try {
    const jobs = ranges.map(async (range, lane) => {
      const laneDirectory = join(laneRoot, `lane-${lane}`), laneStartedAt = Date.now();
      const laneDiagnostics = new MotionDiagnostics({ lane, ...range }, state => {
        laneStates[lane] = state;
        diagnostics.lanes(laneStates, counts.reduce((sum, count) => sum + count, 0), frameCount);
      });
      try {
        const result = await renderMotionRange(input, laneDirectory, imageData, provider, controller.signal, fonts, laneDiagnostics, range, sourceDisplay, {
          samples,
          verifyNextFrame: lane < ranges.length - 1,
          rangeCheck,
          progress(frame) {
            counts[lane] = frame - range.startFrame + 1;
            laneStates[lane] = laneDiagnostics.summary();
            diagnostics.lanes(laneStates, counts.reduce((sum, count) => sum + count, 0), frameCount);
          }
        });
        if ("prepared" in result) throw new Error("MOTION_EXECUTION_MODE_INVALID");
        return result;
      } catch (error) {
        if (!failed) {
          failed = true; firstFailure = error;
          diagnostics.stage(String(laneDiagnostics.summary().stage), { failedLane: lane });
          controller.abort(error);
        }
        diagnostics.additional(error, `lane_${lane}`);
        throw error;
      } finally {
        diagnostics.includeLane(lane, laneDiagnostics);
        laneStates[lane] = laneDiagnostics.summary();
        laneMetrics[lane] = { ...range, startedAt: new Date(laneStartedAt).toISOString(), finishedAt: new Date().toISOString(), wallMs: Date.now() - laneStartedAt };
        diagnostics.lanes(laneStates, counts.reduce((sum, count) => sum + count, 0), frameCount);
        // 失败的确定性差异也必须保留；只删除临时媒体，不能丢掉第一条错误的证据。
        for (const folder of ["frames", "diagnostics"]) {
          const names = await readdir(join(laneDirectory, folder)).catch(() => []);
          for (const name of names) if (name !== "report.json") {
            await copyFile(join(laneDirectory, folder, name), join(directory, folder, name)).catch(error => diagnostics.additional(error, `lane_${lane}_evidence`));
          }
        }
      }
    });
    // 失败也接回所有分路，确保浏览器与编码进程已退出后再清理目录。
    const settled = await Promise.allSettled(jobs);
    if (failed) {
      if (firstFailure instanceof MotionDeterminismError) await writeFile(join(directory, "diagnostics", "report.json"), JSON.stringify(firstFailure.report, null, 2));
      throw firstFailure;
    }
    controller.signal.throwIfAborted();
    const lanes = settled.map(result => (result as PromiseFulfilledResult<MotionLaneResult>).value);
    const events = lanes[0]!.events;
    if (lanes.some(lane => JSON.stringify(lane.events) !== JSON.stringify(events))) throw new Error("MOTION_EVENT_NONDETERMINISTIC: 分路计算的完整事件表不同");
    const frameHashes = lanes.flatMap(lane => lane.frameHashes);
    if (frameHashes.length !== frameCount) throw new Error("MOTION_OUTPUT_MISMATCH: 分路帧范围未完整覆盖目标");
    const determinism: MotionDeterminismReport = {
      status: lanes.some(lane => lane.determinism?.status === "tolerated") ? "tolerated" : "exact",
      maxAllowedChannelDelta: lanes[0]!.determinism!.maxAllowedChannelDelta,
      sampledFrames: lanes.flatMap(lane => lane.determinism!.sampledFrames),
      differences: lanes.flatMap(lane => lane.determinism!.differences)
    };
    // 接点再由前一路继续求值一次，检出“首次跳到哪里就把哪里当起点”的跨帧副作用。
    for (let lane = 0; lane < lanes.length - 1; lane++) {
      const repeated = lanes[lane]!.nextFrame!, frame = ranges[lane + 1]!.startFrame;
      if (repeated.hash === lanes[lane + 1]!.frameHashes[0]) continue;
      const first = await readFile(join(directory, "frames", motionFrameName(frame)));
      const difference = await saveMotionFrameDifference(join(directory, "diagnostics", "boundaries"), frame, first, repeated.png);
      difference.paths = { first: `boundaries/${difference.paths.first}`, repeated: `boundaries/${difference.paths.repeated}`, diff: `boundaries/${difference.paths.diff}` };
      determinism.differences.push(difference);
      if (difference.maxChannelDelta > determinism.maxAllowedChannelDelta) determinism.status = "failed";
      else if (determinism.status === "exact") determinism.status = "tolerated";
    }
    await writeFile(join(directory, "diagnostics", "report.json"), JSON.stringify(determinism, null, 2));
    if (determinism.status === "failed") throw new MotionDeterminismError(determinism);
    diagnostics.stage("range_assembly", { concurrency, documentBytes: laneStates[0]?.documentBytes });
    if (lanes.length === 1) await rename(lanes[0]!.outputPath, outputPath);
    else {
      const list = join(laneRoot, "ranges.ffconcat");
      // 明确每段精确帧时长，避免容器毫秒舍入累计；压缩帧原样拼接，不再次损失画质。
      await writeFile(list, "ffconcat version 1.0\n" + lanes.map((lane, index) => `file 'lane-${index}/${input.compositing === "opaque" ? "output.mp4" : "output.mkv"}'\nduration ${(ranges[index]!.endFrame - ranges[index]!.startFrame) / input.fps}\n`).join(""));
      await runMotionProcess("ffmpeg", ["-y", "-v", "error", "-progress", "pipe:1", "-f", "concat", "-safe", "1", "-i", list, "-map", "0:v:0", "-an", "-c:v", "copy", ...(input.compositing === "opaque" ? ["-movflags", "+faststart"] : []), outputPath], controller.signal, 30 * 60_000, diagnostics);
    }
    const previewAt = Date.now();
    if (input.compositing !== "opaque") {
      diagnostics.stage("preview_encoding");
      await runMotionProcess("ffmpeg", ["-y", "-v", "error", "-progress", "pipe:1", "-i", outputPath, "-f", "lavfi", "-i", `color=c=0x172033:s=${input.width}x${input.height}:r=${input.fps}`, "-filter_complex", `[0:v]fps=${input.fps}:round=near[fg];[1:v][fg]overlay=shortest=1:format=auto,format=yuv420p`, "-frames:v", String(frameCount), "-an", "-c:v", "libx264", "-crf", "18", previewPath], controller.signal, 30 * 60_000, diagnostics);
    }
    const metrics = {
      captureMs: lanes.reduce((sum, lane) => sum + lane.metrics.captureMs, 0),
      seekMs: lanes.reduce((sum, lane) => sum + lane.metrics.seekMs, 0),
      screenshotMs: lanes.reduce((sum, lane) => sum + lane.metrics.screenshotMs, 0),
      pixelDecodeMs: lanes.reduce((sum, lane) => sum + lane.metrics.pixelDecodeMs, 0),
      pipeWriteMs: lanes.reduce((sum, lane) => sum + lane.metrics.pipeWriteMs, 0),
      encoderFinishMs: lanes.reduce((sum, lane) => sum + lane.metrics.encoderFinishMs, 0),
      previewEncodeMs: Date.now() - previewAt,
      peakWorkerRssBytes: Math.max(...lanes.map(lane => lane.metrics.peakWorkerRssBytes)),
      outputBytes: (await stat(outputPath)).size, capturedFrames: frameCount,
      wallMs: Date.now() - startedAt, concurrency, lanes: laneMetrics
    };
    checkMotionOutputBudget(metrics.outputBytes + (previewPath === outputPath ? 0 : (await stat(previewPath)).size), outputBudget);
    diagnostics.stage("output_validation");
    await verifyMotionPreviewFrames(outputPath, frameCount, input.fps);
    if (previewPath !== outputPath) await verifyMotionPreviewFrames(previewPath, frameCount, input.fps);
    const output = { kind: input.compositing === "opaque" ? "opaque_video" as const : "alpha_video" as const, path: outputPath,
      hash: await import("../../../packages/edit-application/src/media-intelligence.js").then(m => m.hashMediaFile(outputPath)), codec: input.compositing === "opaque" ? "h264" : "ffv1", pixelFormat: input.compositing === "opaque" ? "yuv420p" : "bgra" };
    metrics.wallMs = Date.now() - startedAt;
    complete = true;
    return { metrics, frameHashes, output, previewPath, runtimeDependencies: HYPERFRAMES_DEPENDENCIES, engineVersion: MOTION_ENGINE_VERSION, sandbox: "chromium-os-sandbox+csp-opaque-origin+deny-network", events, determinism };
  } finally {
    signal?.removeEventListener("abort", abort);
    try {
      if (!complete) { await rm(outputPath, { force: true }); if (previewPath !== outputPath) await rm(previewPath, { force: true }); }
      // 只清理由本次创建且已确认仍在目标目录内的分路临时文件。
      const local = relative(resolve(directory), resolve(laneRoot));
      if (local && !local.startsWith("..") && !isAbsolute(local)) await rm(laneRoot, { recursive: true, force: true });
    } catch (error) {
      diagnostics.additional(error, "lane_cleanup");
      if (complete) throw error;
    }
  }
}

/** 每路只负责固定根时钟范围；共享 Provider 的校验、关闭与正式登记由外层 Job 负责。 */
export async function initializeManagedMotion(input: MotionSubmission, directory: string, imageData: Record<string, string>, provider: MotionVideoProvider | undefined, signal: AbortSignal, fonts: PreparedMotionFont[], diagnostics: MotionDiagnostics, sourceDisplay?: FrozenSourceDisplay) {
  const result = await renderMotionRange(input, directory, imageData, provider, signal, fonts, diagnostics, { startFrame: 0, endFrame: input.durationInFrames }, sourceDisplay, { samples: new Set(), verifyNextFrame: false, progress() {} }, true);
  if (!("prepared" in result)) throw new Error("MOTION_EXECUTION_MODE_INVALID");
  return result;
}

async function renderMotionRange(input: MotionSubmission, directory: string, imageData: Record<string, string>, provider: MotionVideoProvider | undefined, signal: AbortSignal, fonts: PreparedMotionFont[], diagnostics: MotionDiagnostics, frameRange: MotionFrameRange, sourceDisplay: FrozenSourceDisplay | undefined, laneOptions: MotionLaneOptions, prepareOnly = false): Promise<MotionLaneResult | { prepared: true; events?: MotionEvent[]; engineVersion: string }> {
  signal.throwIfAborted();
  const metrics = { captureMs: 0, seekMs: 0, screenshotMs: 0, pixelDecodeMs: 0, pipeWriteMs: 0, encoderFinishMs: 0, previewEncodeMs: 0, peakWorkerRssBytes: process.memoryUsage().rss, outputBytes: 0, capturedFrames: 0 };
  const limits = readRuntimeConfig().motion;
  const startFrame = frameRange?.startFrame ?? 0, endFrame = frameRange?.endFrame ?? input.durationInFrames;
  if (!Number.isInteger(startFrame) || !Number.isInteger(endFrame) || startFrame < 0 || endFrame <= startFrame || endFrame > input.durationInFrames) throw new Error("MOTION_PROOF_RANGE_INVALID");
  const frameCount = endFrame - startFrame;
  const outputBudget = motionOutputBudget(input.width, input.height, frameCount, input.compositing, input.fps);
  await mkdir(join(directory, "frames"), { recursive: true });
  const declarations = Object.entries(input.fontBindings ?? {});
  if (declarations.length !== fonts.length || fonts.some(font => input.fontBindings?.[font.binding.slot] !== font.binding.fontId)
    || new Set(fonts.map(font => font.binding.slot)).size !== fonts.length) throw new Error("MOTION_FONT_BINDING_MISMATCH");
  // 字体数据由Worker从发行目录校验后提供，CSS不接受源码给出的路径或URL。
  const fontCss = [...new Map(fonts.map(font => [font.binding.family, font])).values()].map(({ binding, dataUrl, format }) => {
    if (!["otf", "ttf"].includes(format) || !/^data:font\/(?:otf|ttf);base64,[A-Za-z0-9+/=]+$/u.test(dataUrl)
      || !dataUrl.startsWith(`data:font/${format};base64,`)) throw new Error("MOTION_FONT_FORMAT");
    return `@font-face{font-family:'${binding.family}';src:url('https://motion.invalid/fonts/${binding.hash}.${format}');font-weight:${binding.weight};font-style:${binding.style};font-display:block}`;
  }).join("");
  diagnostics.stage("source_compilation");
  const html = await compileMotion(input, imageData, provider?.videos, fonts.map(font => font.binding), fontCss);
  const csp = motionContentSecurityPolicy(html, input.source);
  let allowedFrame = 0;
  diagnostics.stage("browser_startup");
  const browser = await puppeteer.launch({
    executablePath: await resolveRenderBrowser(), headless: true, pipe: true,
    defaultViewport: { width: input.width, height: input.height, deviceScaleFactor: 1 },
    // 局部栅格重绘会让 SVG 曲线/虚线边缘受上一帧脏区影响；每帧完整重绘，保留原抗锯齿与沙箱。
    args: ["--disable-partial-raster", "--disable-background-networking", "--disable-component-update", "--disable-sync", "--no-first-run", "--js-flags=--max-old-space-size=128"],
    timeout: 30_000
  });
  diagnostics.browser({ browserPid: browser.process()?.pid });
  browser.on("disconnected", () => { diagnostics.browser({ browserDisconnected: true }); diagnostics.event("browser_disconnected"); });
  const browserProcess = browser.process();
  browserProcess?.stderr?.on("data", chunk => diagnostics.browserStderr(String(chunk)));
  browserProcess?.on("error", error => diagnostics.additional(error, "browser_process"));
  browserProcess?.on("exit", (code, signal) => { diagnostics.browser({ browserExitCode: code, browserExitSignal: signal }); diagnostics.event("browser_exit", { code, signal }); });
  const forbiddenFlags = browser.process()?.spawnargs.filter((arg) => /--(?:no-sandbox|disable-setuid-sandbox|disable-web-security|single-process)/u.test(arg)) ?? [];

  const abort = () => { diagnostics.terminate("cancelled"); browser.process()?.kill(); };
  signal?.addEventListener("abort", abort, { once: true });
  if (signal?.aborted) abort();
  const errors: string[] = [];
  const outputPath = join(directory, input.compositing === "opaque" ? "output.mp4" : "output.mkv");
  let encoder: ReturnType<typeof createMotionStreamEncoder> | undefined;
  let complete = false;
  try {
    diagnostics.browser({ browserVersion: await browser.version() });
    if (forbiddenFlags.length) throw new Error("MOTION_SANDBOX_DISABLED: 拒绝在降级的浏览器安全模式下执行代码");
    const page = await browser.newPage();
    page.on("error", error => diagnostics.additional(error, "page_crash"));
    page.on("close", () => diagnostics.event("page_close"));
    page.on("framedetached", frame => diagnostics.event("frame_detached", { main: frame === page.mainFrame() }));
    page.on("framenavigated", frame => diagnostics.event("frame_navigated", { main: frame === page.mainFrame() }));
    page.on("requestfailed", request => diagnostics.event("request_failed", { resourceType: request.resourceType(), reason: request.failure()?.errorText }));
    const requestError = (error: unknown) => { diagnostics.additional(error, "request_response"); errors.push(String(error)); };

    await page.setRequestInterception(true);
    let served = false;
    page.on("request", (request) => {
      if (!served && request.isNavigationRequest() && request.frame() === page.mainFrame() && request.url() === "https://motion.invalid/") {
        served = true;
        void request.respond({ status: 200, headers: { "content-security-policy": csp, "content-type": "text/html; charset=utf-8", "cache-control": "no-store" }, body: html }).catch(requestError);
      } else if (request.resourceType() === "font" && /^https:\/\/motion\.invalid\/fonts\/[a-f0-9]{64}\.(?:otf|ttf)$/u.test(request.url())) {
        // 字体按已验证hash单独响应，避免HTML再经CDP base64编码超过100MiB管道上限。
        const font = resolveMotionFontRequest(request.url(), fonts);
        if (!font) { errors.push("MOTION_FONT_BINDING_MISMATCH"); void request.abort().catch(requestError); return; }
        void request.respond({ status: 200, contentType: `font/${font.format}`, headers: { "access-control-allow-origin": "*", "cache-control": "no-store" }, body: Buffer.from(font.dataUrl.split(",")[1], "base64") }).catch(requestError);
      } else if (request.resourceType() === "image" && provider && /^https:\/\/motion\.invalid\/video\/[a-z][A-Za-z0-9_]{0,39}\/\d+\.png$/u.test(request.url())) {
        // 只提供当前渲染帧的已绑定槽位；源码看不到原片路径或任意媒体请求能力。
        const match = /\/video\/([^/]+)\/(\d+)\.png$/u.exec(request.url())!;
        const frame = Number(match[2]);
        if (frame !== allowedFrame || !Object.hasOwn(provider.videos, match[1])) { errors.push("MOTION_VIDEO_RANGE"); void request.abort().catch(requestError); return; }
        void provider.getFrame(match[1], frame).then(body => request.respond({ status: 200, contentType: "image/png", headers: { "access-control-allow-origin": "*", "cache-control": "no-store" }, body })).catch(error => { requestError(error); void request.abort().catch(requestError); });
      } else if (request.url().startsWith("data:") && ["image", "font", "media"].includes(request.resourceType())) void request.continue().catch(requestError);
      else { errors.push(`MOTION_NETWORK_BLOCKED: ${request.resourceType()}`); void request.abort("blockedbyclient").catch(requestError); }
    });
    page.on("pageerror", (error) => { diagnostics.additional(error, "page_error"); errors.push(String(error)); });
    page.on("console", (message) => { if (message.type() === "error") diagnostics.event("console_error", { message: message.text().slice(0, 2000) }); if (message.text().startsWith("MOTION_CSP_VIOLATION:")) errors.push(message.text()); });
    page.on("popup", (popup) => { errors.push("MOTION_POPUP_BLOCKED"); void popup?.close().catch(requestError); });
    diagnostics.stage("page_navigation", { documentBytes: Buffer.byteLength(html) });
    await page.goto("https://motion.invalid/", { waitUntil: "load", timeout: 15_000 });
    diagnostics.stage("animation_initialization");
    await waitMotionStartup(page, fonts.length > 0);
    const readEvents = () => page.evaluate(() => (window as unknown as { __readMotionEvents: () => unknown }).__readMotionEvents());
    const rawEvents = await readEvents();
    const events = rawEvents === null ? undefined : parseMotionEvents(rawEvents, input.durationInFrames);
    if (laneOptions.rangeCheck) checkMotionRangeCompatibility(laneOptions.rangeCheck.expected, { ...laneOptions.rangeCheck.candidate, events });
    if (prepareOnly) {
      // 登记只初始化并核对真实事件，不截图、不创建编码器或媒体产物。
      allowedFrame = 0;
      await page.evaluate(async () => { await (window as unknown as { __motionSeek(frame: number): Promise<void> }).__motionSeek(0); });
      if (JSON.stringify(await readEvents()) !== JSON.stringify(rawEvents)) throw new Error("MOTION_EVENT_NONDETERMINISTIC: 初始化定位改变了作品事件");
      if (sourceDisplay) checkMotionDisplayTexts(await page.evaluate(() => document.body.innerText.split("\n")), input.props, sourceDisplay);
      if (errors.length) throw new Error(errors.slice(0, 3).join("; "));
      return { prepared: true, events, engineVersion: MOTION_ENGINE_VERSION };
    }
    const frameHashes: string[] = [];
    const samples = new Set([startFrame, startFrame + Math.floor(frameCount / 2), endFrame - 1, ...laneOptions.samples]);
    const capture = async (frame: number) => {
      signal?.throwIfAborted();
      const captureAt = Date.now();
      allowedFrame = frame;
      diagnostics.frame(frame, "seek_and_image_decode");
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        return await Promise.race([
          (async () => {
            const seekAt = Date.now();
            await page.evaluate(async (value) => {
              await (window as unknown as { __motionSeek: (frame: number) => Promise<void> }).__motionSeek(value);
              // 半透明变换图层的增删会复用不同的文字阴影绘制状态；每帧重建布局，保留作品状态以继续检出真实副作用。
              document.body.style.display = "none";
              void document.body.offsetHeight;
              document.body.style.removeProperty("display");
              void document.body.offsetHeight;
              await Promise.all(Array.from(document.images).map((image) => image.decode()));
            }, frame);
            if (sourceDisplay) {
              const texts = await page.evaluate(() => [...document.body.querySelectorAll("*")]
                .filter(el => !el.closest("script,style,template") && !el.querySelector("div,p,section,article,text")
                  && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden")
                .map(el => el.textContent ?? ""));
              checkMotionDisplayTexts(texts, input.props, sourceDisplay);
            }
            if (errors.length) throw new Error(errors.slice(0, 3).join("; "));
            metrics.seekMs += Date.now() - seekAt;
            diagnostics.frame(frame, "screenshot");
            const screenshotAt = Date.now();
            const png = Buffer.from(await page.screenshot({ type: "png", omitBackground: true, captureBeyondViewport: false }));
            metrics.screenshotMs += Date.now() - screenshotAt;
            diagnostics.frame(frame, "pixel_decode");
            const decodeAt = Date.now();
            const pixels = PNG.sync.read(png);
            metrics.pixelDecodeMs += Date.now() - decodeAt;
            if (pixels.width !== input.width || pixels.height !== input.height) throw new Error("MOTION_OUTPUT_MISMATCH: 截图画幅不匹配");
            return pixels;
          })(),
          new Promise<never>((_, reject) => { timer = setTimeout(() => { diagnostics.terminate("frame_timeout"); browser.process()?.kill(); reject(new Error("MOTION_FRAME_TIMEOUT")); }, limits.frameTimeoutMs); })
        ]);
      } finally { if (timer) clearTimeout(timer); metrics.captureMs += Date.now() - captureAt; metrics.peakWorkerRssBytes = Math.max(metrics.peakWorkerRssBytes, process.memoryUsage().rss); }
    };
    encoder = createMotionStreamEncoder(input, outputPath, signal);
    diagnostics.stage("frame_rendering");
    for (let frame = startFrame; frame < endFrame; frame++) {
      const pixels = await capture(frame);
      metrics.capturedFrames++;
      metrics.peakWorkerRssBytes = Math.max(metrics.peakWorkerRssBytes, process.memoryUsage().rss);
      if (input.compositing === "opaque") {
        for (let i = 3; i < pixels.data.length; i += 4) if (pixels.data[i] !== 255) throw new Error(`MOTION_OPACITY_MISMATCH: 第 ${frame} 帧含透明像素，请按实际用途提交 alpha`);
      }
      const pipeAt = Date.now();
      await encoder.write(pixels.data);
      metrics.pipeWriteMs += Date.now() - pipeAt;
      frameHashes.push(createHash("sha256").update(pixels.data).digest("hex"));
      diagnostics.frame(frame, "frame_write");
      if (samples.has(frame)) await writeFile(join(directory, "frames", motionFrameName(frame)), PNG.sync.write(pixels, { colorType: 6 }), { flag: "wx" });
      diagnostics.progress(frame);
      laneOptions.progress(frame);
      await provider?.releaseBefore(frame + 1);
      if (frame % input.fps === 0) {
        checkMotionOutputBudget((await stat(outputPath).catch(() => ({ size: 0 }))).size, outputBudget);
        const available = await statfs(directory);
        if (available.bavail * available.bsize < limits.diskReserveBytes) throw new Error("MOTION_DISK_SPACE: 渲染中磁盘安全余量不足");
      }
    }
    const finishAt = Date.now();
    await encoder.finish();
    metrics.encoderFinishMs = Date.now() - finishAt;
    metrics.outputBytes = (await stat(outputPath)).size;
    const nextPixels = laneOptions.verifyNextFrame ? await capture(endFrame) : undefined;
    const nextFrame = nextPixels ? { hash: createHash("sha256").update(nextPixels.data).digest("hex"), png: PNG.sync.write(nextPixels, { colorType: 6 }) } : undefined;
    diagnostics.stage("determinism_verification");
    const determinism = await verifyMotionDeterminism(directory, frameHashes, async frame => PNG.sync.write(await capture(frame), { colorType: 6 }), startFrame);
    if (JSON.stringify(await readEvents()) !== JSON.stringify(rawEvents)) throw new Error("MOTION_EVENT_NONDETERMINISTIC: 事件计算依赖渲染副作用");
    diagnostics.terminate("normal_cleanup");
    await closeMotionBrowser(browser, diagnostics);
    complete = true;
    return { metrics, frameHashes, outputPath, events, determinism, nextFrame };
  } catch (error) {
    // 清理和页面附加错误不能抹掉第一条异常与原始堆栈。
    diagnostics.additional(error, "render_first_failure");
    for (const message of errors.slice(0, 3)) diagnostics.additional(message, "page_evidence");
    if (errors.length) throw new Error([...errors.slice(0, 3), error instanceof Error ? error.message : String(error)].join("; "), { cause: error });
    throw error;
  } finally {
    if (encoder && !complete) await encoder.cancel();
    signal?.removeEventListener("abort", abort);
    if (!diagnostics.summary().terminationRequestedBy) diagnostics.terminate("failure_cleanup");
    await closeMotionBrowser(browser, diagnostics);
  }
}
