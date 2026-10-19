import { OBJECT_RESOURCE_LIMITS, ObjectResourceError, type ObjectResourceSpec, type Rect } from "./schema.js";

export function packObjectParts(parts: Array<{ id: string; width: number; height: number }>, options: ObjectResourceSpec["atlas"]) {
  const padding = OBJECT_RESOURCE_LIMITS.padding;
  const sorted = [...parts].sort((a, b) => b.height - a.height || b.width - a.width || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const pages: Array<{ id: string; width: number; height: number; entries: Array<{ id: string; rect: Rect }> }> = [];
  let x = 0, y = 0, rowHeight = 0;
  for (const part of sorted) {
    const width = part.width + padding * 2, height = part.height + padding * 2;
    if (width > options.max_side || height > options.max_side) throw new ObjectResourceError("OBJECT_RESOURCE_PART_TOO_LARGE", `部件 ${part.id} 加边距后超过页面尺寸`, { partId: part.id, width, height, maxSide: options.max_side });
    if (!pages.length || !options.enabled) { pages.push({ id: `page_${pages.length + 1}`, width: 0, height: 0, entries: [] }); x = 0; y = 0; rowHeight = 0; }
    if (x + width > options.max_side) { x = 0; y += rowHeight; rowHeight = 0; }
    if (y + height > options.max_side) { pages.push({ id: `page_${pages.length + 1}`, width: 0, height: 0, entries: [] }); x = 0; y = 0; rowHeight = 0; }
    const page = pages[pages.length - 1]!;
    page.entries.push({ id: part.id, rect: { x: x + padding, y: y + padding, width: part.width, height: part.height } });
    page.width = Math.max(page.width, x + width); page.height = Math.max(page.height, y + height);
    x += width; rowHeight = Math.max(rowHeight, height);
  }
  if (pages.length > options.max_pages) throw new ObjectResourceError("OBJECT_RESOURCE_PAGE_LIMIT", `确定性排列需要 ${pages.length} 页，允许 ${options.max_pages} 页；未缩小或旋转部件`, {
    requiredPages: pages.length, maxPages: options.max_pages, largestParts: [...parts].sort((a, b) => b.width * b.height - a.width * a.height).slice(0, 8)
  });
  return pages;
}
