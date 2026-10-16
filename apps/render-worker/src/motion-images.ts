import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import puppeteer from "puppeteer-core";
import { resolveRenderBrowser } from "../../../packages/remotion-runtime/src/browser.js";
import { MotionDiagnostics } from "./motion-diagnostics.js";
import { closeMotionBrowser } from "./motion-renderer.js";

export interface MotionImageDecode {
  slot: string;
  sourceHash: string;
  decodedHash: string;
  path: string;
  width: number;
  height: number;
  colorSpace: "srgb";
  decoder: string;
}

/** JPEG 首次隐藏与缩小绘制可能采用不同解码精度；先固定全尺寸像素，作品只读取无损派生图。 */
export async function prepareMotionImages(images: Record<string, Buffer>, resourcesDirectory: string, signal?: AbortSignal, diagnostics = new MotionDiagnostics({})) {
  signal?.throwIfAborted();
  const imageData: Record<string, string> = {};
  const imageDecodes: MotionImageDecode[] = [];
  const jpegSlots: string[] = [];
  for (const [slot, bytes] of Object.entries(images)) {
    const mime = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ? "image/png"
      : bytes[0] === 255 && bytes[1] === 216 ? "image/jpeg"
      : bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP" ? "image/webp" : undefined;
    if (!mime) throw new Error("MOTION_IMAGE_FORMAT: 支持已验证 PNG、JPEG、WebP 图片");
    imageData[slot] = `data:${mime};base64,${bytes.toString("base64")}`;
    if (mime === "image/jpeg") jpegSlots.push(slot);
  }
  if (!jpegSlots.length) return { imageData, imageDecodes };

  const browser = await puppeteer.launch({
    executablePath: await resolveRenderBrowser(), headless: true, pipe: true,
    args: ["--disable-background-networking", "--disable-component-update", "--disable-sync", "--no-first-run"],
    timeout: 30_000
  });
  const abort = () => { browser.process()?.kill(); };
  signal?.addEventListener("abort", abort, { once: true });
  try {
    signal?.throwIfAborted();
    const decoder = await browser.version();
    const page = await browser.newPage();
    // 这里只执行固定解码程序，不加载作品源码或外部资源。
    await page.setContent('<meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;; img-src data:">');
    await mkdir(join(resourcesDirectory, "decoded"), { recursive: true });
    for (const slot of jpegSlots) {
      signal?.throwIfAborted();
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        const decoded = await Promise.race([
          page.evaluate(async (url) => {
            const image = new Image();
            image.src = url;
            await image.decode();
            // 不挂入布局、不先缩小；原生解码应用 EXIF 方向及 ICC，画布固定输出 sRGB。
            const canvas = document.createElement("canvas");
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            const context = canvas.getContext("2d", { colorSpace: "srgb" });
            if (!context) throw new Error("无法创建 sRGB 图片画布");
            context.drawImage(image, 0, 0);
            const dataUrl = canvas.toDataURL("image/png");
            if (!dataUrl.startsWith("data:image/png;base64,")) throw new Error("无法编码完整 PNG 图片");
            return { dataUrl, width: canvas.width, height: canvas.height };
          }, imageData[slot]!),
          new Promise<never>((_, reject) => { timer = setTimeout(() => {
            abort(); reject(new Error("MOTION_IMAGE_DECODE_TIMEOUT"));
          }, 30_000); })
        ]);
        signal?.throwIfAborted();
        const bytes = Buffer.from(decoded.dataUrl.split(",")[1]!, "base64");
        const path = `decoded/${slot}.png`;
        await writeFile(join(resourcesDirectory, path), bytes);
        imageData[slot] = decoded.dataUrl;
        imageDecodes.push({ slot, sourceHash: createHash("sha256").update(images[slot]!).digest("hex"),
          decodedHash: createHash("sha256").update(bytes).digest("hex"), path,
          width: decoded.width, height: decoded.height, colorSpace: "srgb", decoder });
      } catch (error) {
        signal?.throwIfAborted();
        throw new Error(`MOTION_IMAGE_DECODE_FAILED: ${slot}`, { cause: error });
      } finally { clearTimeout(timer); }
    }
    return { imageData, imageDecodes };
  } finally {
    signal?.removeEventListener("abort", abort);
    await closeMotionBrowser(browser, diagnostics);
  }
}
