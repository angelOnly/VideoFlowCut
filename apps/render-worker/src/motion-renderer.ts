import { createHash } from "node:crypto";
import { mkdir, readFile, statfs, writeFile } from "node:fs/promises";
import { join } from "node:path";
import puppeteer from "puppeteer-core";
import { PNG } from "pngjs";
import { compileMotion, MOTION_ENGINE_VERSION } from "../../../packages/motion-work/src/compiler.js";
import type { DecodedMotionVideo, MotionSubmission } from "../../../packages/motion-work/src/schema.js";
import { resolveRenderBrowser } from "./exporter.js";
import { runProcess } from "@videocut/speech";
import { parseMotionEvents } from "../../../packages/motion-work/src/schema.js";
import type { MotionEvent } from "@videocut/contracts";
import { verifyMotionDeterminism, type MotionDeterminismReport } from "./motion-determinism.js";
import { checkMotionDiskSpace, checkMotionOutputBudget, motionOutputBudget } from "./motion-output-budget.js";

export interface MotionRenderResult { frameHashes: string[]; previewPath: string; engineVersion: string; sandbox: string; events?: MotionEvent[]; determinism?: MotionDeterminismReport; }
export const motionFrameName = (frame: number) => `frame-${String(frame).padStart(5, "0")}.png`;

/** Chromium 会省略全不透明帧的 Alpha；入库前固定 RGBA，避免后续像素步长与滤镜状态跳变。 */
export function normalizeMotionPng(png: Buffer, width: number, height: number): Buffer {
  const decoded = PNG.sync.read(png);
  if (decoded.width !== width || decoded.height !== height) throw new Error("MOTION_OUTPUT_MISMATCH: PNG 画幅不匹配");
  // RLE 和最小残差滤波未必适合渐变；比较两种无损编码，保留 RGBA 与原缓存限额。
  const options = { colorType: 6, inputColorType: 6, bitDepth: 8, deflateLevel: 6, deflateStrategy: 0 } as const;
  const filtered = PNG.sync.write(decoded, options);
  const unfiltered = PNG.sync.write(decoded, { ...options, filterType: 0 });
  return unfiltered.length < filtered.length ? unfiltered : filtered;
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
export async function renderManagedMotion(input: MotionSubmission, directory: string, imageData: Record<string, string> = {}, videos: Record<string, DecodedMotionVideo> = {}): Promise<MotionRenderResult> {
  const outputBudget = motionOutputBudget(input.width, input.height, input.durationInFrames);
  await mkdir(join(directory, "frames"), { recursive: true });
  const disk = await statfs(directory);
  checkMotionDiskSpace(disk.bavail * disk.bsize, outputBudget);
  const javascript = `window.addEventListener('securitypolicyviolation',e=>console.error('MOTION_CSP_VIOLATION:'+e.violatedDirective));\n${await compileMotion(input, imageData, videos)}`.replace(/<\/script/giu, "<\\/script");
  const scriptHash = createHash("sha256").update(javascript).digest("base64");
  // Player 内部有 data: 静音音频探测；允许内嵌数据并不开放外部媒体或网络。
  const csp = `default-src 'none'; script-src 'sha256-${scriptHash}'; style-src 'unsafe-inline'; img-src data: https://motion.invalid/video/; font-src data:; media-src data:; connect-src 'none'; frame-src 'none'; worker-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; sandbox allow-scripts`;
  const videoFrames = new Map<string, string>(Object.entries(videos).flatMap(([slot, video]) => video.framePaths.map((path, frame) => [`https://motion.invalid/video/${slot}/${frame}.png`, path] as const)));
  // SVG 的 auto 字体模式会按缩放历史复用字形栅格；几何精度模式使文字按当前帧的变换绘制。
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>html,body,#root{margin:0;width:100%;height:100%;overflow:hidden;background:transparent;font-family:'Microsoft YaHei','Noto Sans SC',sans-serif}svg{text-rendering:geometricPrecision}</style></head><body><div id="root"></div><script>${javascript}</script></body></html>`;
  const browser = await puppeteer.launch({
    executablePath: await resolveRenderBrowser(), headless: true, pipe: true,
    defaultViewport: { width: input.width, height: input.height, deviceScaleFactor: 1 },
    // 局部栅格重绘会让 SVG 曲线/虚线边缘受上一帧脏区影响；每帧完整重绘，保留原抗锯齿与沙箱。
    args: ["--disable-partial-raster", "--disable-background-networking", "--disable-component-update", "--disable-sync", "--no-first-run", "--js-flags=--max-old-space-size=128"],
    timeout: 30_000
  });
  const forbiddenFlags = browser.process()?.spawnargs.filter((arg) => /--(?:no-sandbox|disable-setuid-sandbox|disable-web-security|single-process)/u.test(arg)) ?? [];
  if (forbiddenFlags.length) { await browser.close(); throw new Error("MOTION_SANDBOX_DISABLED: 拒绝在降级的浏览器安全模式下执行代码"); }
  let timedOut = false;
  const deadline = setTimeout(() => { timedOut = true; browser.process()?.kill(); }, 5 * 60_000);
  const errors: string[] = [];
  try {
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    let served = false;
    page.on("request", (request) => {
      if (!served && request.isNavigationRequest() && request.frame() === page.mainFrame() && request.url() === "https://motion.invalid/") {
        served = true;
        void request.respond({ status: 200, headers: { "content-security-policy": csp, "content-type": "text/html; charset=utf-8", "cache-control": "no-store" }, body: html });
      } else if (request.resourceType() === "image" && videoFrames.has(request.url())) {
        // 只提供本次 Worker 已解码的精确白名单帧，不访问 URL 或把宿主路径交给源码。
        void readFile(videoFrames.get(request.url())!).then(body => request.respond({ status: 200, contentType: "image/png", headers: { "access-control-allow-origin": "*" }, body })).catch(error => { errors.push(String(error)); void request.abort(); });
      } else if (request.url().startsWith("data:") && ["image", "font", "media"].includes(request.resourceType())) void request.continue();
      else { errors.push(`MOTION_NETWORK_BLOCKED: ${request.resourceType()}`); void request.abort("blockedbyclient"); }
    });
    page.on("pageerror", (error) => errors.push(String(error)));
    page.on("console", (message) => { if (message.text().startsWith("MOTION_CSP_VIOLATION:")) errors.push(message.text()); });
    page.on("popup", (popup) => { errors.push("MOTION_POPUP_BLOCKED"); void popup?.close(); });
    await page.goto("https://motion.invalid/", { waitUntil: "load", timeout: 15_000 });
    await page.waitForFunction("window.__motionReady === true", { timeout: 15_000 });
    const readEvents = () => page.evaluate(() => (window as unknown as { __readMotionEvents: () => unknown }).__readMotionEvents());
    const rawEvents = await readEvents();
    const events = rawEvents === null ? undefined : parseMotionEvents(rawEvents, input.durationInFrames);
    const frameHashes: string[] = [];
    let totalBytes = 0;
    const capture = async (frame: number) => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        return await Promise.race([
          (async () => {
            await page.evaluate(async (value) => {
              await (window as unknown as { __motionSeek: (frame: number) => Promise<void> }).__motionSeek(value);
              // 半透明变换图层的增删会复用不同的文字阴影绘制状态；每帧重建布局，保留 React 状态以继续检出真实副作用。
              document.body.style.display = "none";
              void document.body.offsetHeight;
              document.body.style.removeProperty("display");
              void document.body.offsetHeight;
              await Promise.all(Array.from(document.images).map((image) => image.decode()));
            }, frame);
            if (errors.length) throw new Error(errors.slice(0, 3).join("; "));
            const png = Buffer.from(await page.screenshot({ type: "png", omitBackground: true, captureBeyondViewport: false }));
            return normalizeMotionPng(png, input.width, input.height);
          })(),
          new Promise<never>((_, reject) => { timer = setTimeout(() => { browser.process()?.kill(); reject(new Error("MOTION_FRAME_TIMEOUT")); }, 12_000); })
        ]);
      } finally { if (timer) clearTimeout(timer); }
    };
    for (let frame = 0; frame < input.durationInFrames; frame++) {
      const png = await capture(frame);
      totalBytes += png.length;
      checkMotionOutputBudget(totalBytes, outputBudget);
      frameHashes.push(createHash("sha256").update(png).digest("hex"));
      await writeFile(join(directory, "frames", motionFrameName(frame)), png, { flag: "wx" });
    }
    const determinism = await verifyMotionDeterminism(directory, frameHashes, capture);
    if (JSON.stringify(await readEvents()) !== JSON.stringify(rawEvents)) throw new Error("MOTION_EVENT_NONDETERMINISTIC: 事件计算依赖渲染副作用");
    await browser.close();
    const previewPath = join(directory, "preview.mp4");
    // 只有审阅代理使用背景；正式合成始终读取带 Alpha 的 PNG 帧，不烧入棋盘格或安全区。
    // 输入已是同格式 RGBA；不能禁用滤镜重建后假设 format 滤镜会修正 RGB/RGBA 的步长。
    await runProcess("ffmpeg", ["-y", "-v", "error", "-framerate", String(input.fps), "-i", join(directory, "frames", "frame-%05d.png"), "-f", "lavfi", "-i", `color=c=0x172033:s=${input.width}x${input.height}:r=${input.fps}`, "-filter_complex", "[0:v]format=rgba[fg];[1:v][fg]overlay=shortest=1:format=auto,format=yuv420p", "-frames:v", String(input.durationInFrames), "-an", "-c:v", "libx264", "-crf", "18", previewPath], 120_000);
    await readFile(previewPath); // ffmpeg 返回成功还必须有真实输出。
    await verifyMotionPreviewFrames(previewPath, input.durationInFrames, input.fps);
    return { frameHashes, previewPath, engineVersion: MOTION_ENGINE_VERSION, sandbox: "chromium-os-sandbox+csp-opaque-origin+deny-network", events, determinism };
  } catch (error) {
    if (!timedOut && !errors.length && error instanceof Error) throw error;
    throw new Error(timedOut ? "MOTION_RENDER_TIMEOUT" : [...errors.slice(0, 3), error instanceof Error ? error.message : String(error)].join("; "));
  } finally { clearTimeout(deadline); await browser.close().catch(() => undefined); }
}
