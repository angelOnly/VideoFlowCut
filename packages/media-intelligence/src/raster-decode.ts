import puppeteer, { type Browser } from "puppeteer-core";
import { resolveRenderBrowser } from "../../remotion-runtime/src/browser.js";

export function rasterMime(bytes: Buffer) {
  return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ? "image/png"
    : bytes[0] === 255 && bytes[1] === 216 ? "image/jpeg"
    : bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP" ? "image/webp" : undefined;
}

/** 与受管图片共用原生解码：应用 EXIF/ICC，按原始尺寸固定为 sRGB PNG。 */
export async function decodeRasterImages(images: Record<string, Buffer>, signal?: AbortSignal, maxPixels?: number, closeBrowser?: (browser: Browser) => Promise<void>) {
  signal?.throwIfAborted();
  for (const bytes of Object.values(images)) if (!rasterMime(bytes)) throw new Error("MOTION_IMAGE_FORMAT: 支持已验证 PNG、JPEG、WebP 图片");
  const browser = await puppeteer.launch({ executablePath: await resolveRenderBrowser(), headless: true, pipe: true,
    args: ["--disable-background-networking", "--disable-component-update", "--disable-sync", "--no-first-run"], timeout: 30_000 });
  const abort = () => { browser.process()?.kill(); };
  signal?.addEventListener("abort", abort, { once: true });
  try {
    signal?.throwIfAborted();
    const decoder = await browser.version(), page = await browser.newPage();
    await page.setContent('<meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;; img-src data:">');
    const decoded: Record<string, { bytes: Buffer; width: number; height: number; decoder: string }> = {};
    for (const [slot, bytes] of Object.entries(images)) {
      signal?.throwIfAborted();
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        const result = await Promise.race([
          page.evaluate(async ({ url, limit }) => {
            const image = new Image(); image.src = url; await image.decode();
            if (limit && image.naturalWidth * image.naturalHeight > limit) throw new Error("规范化图片超过像素预算");
            const canvas = document.createElement("canvas"); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
            const context = canvas.getContext("2d", { colorSpace: "srgb" });
            if (!context) throw new Error("无法创建 sRGB 图片画布");
            context.drawImage(image, 0, 0);
            const dataUrl = canvas.toDataURL("image/png");
            if (!dataUrl.startsWith("data:image/png;base64,")) throw new Error("无法编码完整 PNG 图片");
            return { dataUrl, width: canvas.width, height: canvas.height };
          }, { url: `data:${rasterMime(bytes)};base64,${bytes.toString("base64")}`, limit: maxPixels }),
          new Promise<never>((_, reject) => { timer = setTimeout(() => { abort(); reject(new Error("MOTION_IMAGE_DECODE_TIMEOUT")); }, 30_000); })
        ]);
        signal?.throwIfAborted();
        decoded[slot] = { bytes: Buffer.from(result.dataUrl.split(",")[1]!, "base64"), width: result.width, height: result.height, decoder };
      } catch (error) { signal?.throwIfAborted(); throw new Error(`MOTION_IMAGE_DECODE_FAILED: ${slot}`, { cause: error }); }
      finally { clearTimeout(timer); }
    }
    return decoded;
  } finally {
    signal?.removeEventListener("abort", abort);
    if (closeBrowser) await closeBrowser(browser);
    else {
      let timer: ReturnType<typeof setTimeout> | undefined;
      try { await Promise.race([browser.close(), new Promise<void>(resolve => { timer = setTimeout(() => { abort(); resolve(); }, 5000); })]); }
      catch { abort(); }
      finally { clearTimeout(timer); }
    }
  }
}
