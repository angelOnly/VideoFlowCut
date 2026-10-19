import { createHash } from "node:crypto";
import { PNG } from "pngjs";
import { packObjectParts } from "./atlas.js";
import { OBJECT_RESOURCE_LIMITS as limits, OBJECT_RESOURCE_VERSION, ObjectResourceError, validateObjectResourceSpec, type ObjectResourceSpec, type ObjectResourceLayout } from "./schema.js";

export const objectResourceHash = (value: Buffer | string) => createHash("sha256").update(value).digest("hex");
export type NormalizedObjectSource = { width: number; height: number; data: Buffer; sourceHash: string; normalization: string };

/** 哈希只含实际制造输入，显示名与艺术说明不参与像素身份。 */
export function objectResourceInputHash(spec: ObjectResourceSpec, sources: Record<string, NormalizedObjectSource>) {
  const ordered = [...spec.parts].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  return objectResourceHash(JSON.stringify({ version: OBJECT_RESOURCE_VERSION, padding: limits.padding, atlas: spec.atlas,
    parts: ordered.map(p => ({ id: p.id, source: sources[p.source_id]?.sourceHash, normalization: sources[p.source_id]?.normalization,
      mask: p.alpha_mask_source_id ? sources[p.alpha_mask_source_id]?.sourceHash : null,
      maskNormalization: p.alpha_mask_source_id ? sources[p.alpha_mask_source_id]?.normalization : null,
      maskMode: p.mask_mode ?? null, rect: p.source_rect ?? { x: 0, y: 0, width: sources[p.source_id]?.width, height: sources[p.source_id]?.height },
      trim: p.trim_transparent, localRect: p.local_rect })) }));
}

export function prepareObjectResourcePixels(value: unknown, sources: Record<string, NormalizedObjectSource>) {
  const spec = validateObjectResourceSpec(value);
  let sourcePixels = 0;
  for (const source of spec.sources) {
    const image = sources[source.id];
    if (!image) throw new ObjectResourceError("OBJECT_RESOURCE_SOURCE_MISSING", `源 ${source.id} 没有像素`);
    if (!Number.isInteger(image.width) || !Number.isInteger(image.height) || image.width < 1 || image.height < 1 || image.data.length !== image.width * image.height * 4) throw new ObjectResourceError("OBJECT_RESOURCE_PIXELS_INVALID", `源 ${source.id} 的 RGBA 尺寸不正确`);
    sourcePixels += image.width * image.height;
    if (image.width * image.height > limits.maxSourcePixels || sourcePixels > limits.maxTotalSourcePixels) throw new ObjectResourceError("OBJECT_RESOURCE_PIXEL_LIMIT", "源图像素超过已公开预算");
  }
  let workingBytes = sourcePixels * 4;
  const allocate = (bytes: number) => { workingBytes += bytes; if (workingBytes > limits.maxWorkingPixelBytes) throw new ObjectResourceError("OBJECT_RESOURCE_MEMORY_LIMIT", "源、部件和图集像素超过工作预算", { workingBytes, limit: limits.maxWorkingPixelBytes }); };
  const pieces = spec.parts.map(part => {
    const source = sources[part.source_id]!;
    const mask = part.alpha_mask_source_id ? sources[part.alpha_mask_source_id]! : undefined;
    if (mask && (mask.width !== source.width || mask.height !== source.height)) throw new ObjectResourceError("OBJECT_RESOURCE_MASK_SIZE", `部件 ${part.id} 的遮罩与规范化源尺寸不同`);
    const rect = part.source_rect ?? { x: 0, y: 0, width: source.width, height: source.height };
    if (rect.x + rect.width > source.width || rect.y + rect.height > source.height) throw new ObjectResourceError("OBJECT_RESOURCE_CROP_BOUNDS", `部件 ${part.id} 的裁切区域越界`);
    allocate(rect.width * rect.height * 4);
    const crop = Buffer.alloc(rect.width * rect.height * 4);
    let left = rect.width, top = rect.height, right = -1, bottom = -1;
    for (let y = 0; y < rect.height; y++) for (let x = 0; x < rect.width; x++) {
      const from = ((y + rect.y) * source.width + x + rect.x) * 4, to = (y * rect.width + x) * 4;
      source.data.copy(crop, to, from, from + 4);
      if (mask) {
        const alpha = part.mask_mode === "alpha" ? mask.data[from + 3]! : Math.round((0.2126 * mask.data[from]! + 0.7152 * mask.data[from + 1]! + 0.0722 * mask.data[from + 2]!) * mask.data[from + 3]! / 255);
        crop[to + 3] = Math.round(crop[to + 3]! * alpha / 255);
      }
      if (crop[to + 3]) { left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y); }
    }
    if (right < 0) throw new ObjectResourceError("OBJECT_RESOURCE_EMPTY", `部件 ${part.id} 全透明`);
    if (!part.trim_transparent) { left = 0; top = 0; right = rect.width - 1; bottom = rect.height - 1; }
    return { id: part.id, width: right - left + 1, height: bottom - top + 1, crop, cropWidth: rect.width,
      trimOffset: { x: left, y: top }, sourceSize: { width: rect.width, height: rect.height }, localRect: part.local_rect };
  });
  const packed = packObjectParts(pieces, spec.atlas);
  const layout: ObjectResourceLayout = { schemaVersion: 1, processorVersion: OBJECT_RESOURCE_VERSION, inputHash: objectResourceInputHash(spec, sources), pages: [], parts: [] };
  const pages = packed.map(page => {
    allocate(page.width * page.height * 4);
    const png = new PNG({ width: page.width, height: page.height });
    for (const entry of page.entries) {
      const piece = pieces.find(p => p.id === entry.id)!;
      // 边缘扩展两像素，atlasRect 只指有效区域；各部件仍独立控制。
      for (let y = -limits.padding; y < piece.height + limits.padding; y++) for (let x = -limits.padding; x < piece.width + limits.padding; x++) {
        const sx = piece.trimOffset.x + Math.max(0, Math.min(piece.width - 1, x));
        const sy = piece.trimOffset.y + Math.max(0, Math.min(piece.height - 1, y));
        const from = (sy * piece.cropWidth + sx) * 4, to = ((entry.rect.y + y) * page.width + entry.rect.x + x) * 4;
        piece.crop.copy(png.data, to, from, from + 4);
      }
      layout.parts.push({ id: piece.id, pageId: page.id, atlasRect: entry.rect, sourceSize: piece.sourceSize, trimOffset: piece.trimOffset, localRect: piece.localRect });
    }
    const bytes = PNG.sync.write(png);
    layout.pages.push({ id: page.id, assetId: "", width: page.width, height: page.height, contentHash: objectResourceHash(bytes) });
    return { id: page.id, bytes };
  });
  return { layout, pages };
}
