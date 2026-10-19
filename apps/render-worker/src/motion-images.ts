import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { decodeRasterImages, rasterMime } from "../../../packages/media-intelligence/src/raster-decode.js";
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
    const mime = rasterMime(bytes);
    if (!mime) throw new Error("MOTION_IMAGE_FORMAT: 支持已验证 PNG、JPEG、WebP 图片");
    imageData[slot] = `data:${mime};base64,${bytes.toString("base64")}`;
    if (mime === "image/jpeg") jpegSlots.push(slot);
  }
  if (!jpegSlots.length) return { imageData, imageDecodes };

  const decoded = await decodeRasterImages(Object.fromEntries(jpegSlots.map(slot => [slot, images[slot]!])), signal, undefined, browser => closeMotionBrowser(browser, diagnostics));
  await mkdir(join(resourcesDirectory, "decoded"), { recursive: true });
  for (const slot of jpegSlots) {
    const item = decoded[slot]!;
    const path = `decoded/${slot}.png`;
    await writeFile(join(resourcesDirectory, path), item.bytes);
    imageData[slot] = `data:image/png;base64,${item.bytes.toString("base64")}`;
    imageDecodes.push({ slot, sourceHash: createHash("sha256").update(images[slot]!).digest("hex"),
      decodedHash: createHash("sha256").update(item.bytes).digest("hex"), path,
      width: item.width, height: item.height, colorSpace: "srgb", decoder: item.decoder });
  }
  return { imageData, imageDecodes };
}
