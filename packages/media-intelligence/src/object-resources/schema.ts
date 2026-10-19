import { z } from "zod";

export const OBJECT_RESOURCE_VERSION = "object-resources-1";
export const OBJECT_RESOURCE_LIMITS = {
  maxSources: 32, maxParts: 128, maxSide: 4096, maxPages: 8,
  maxSourceBytes: 64 * 1024 * 1024, maxInputBytes: 128 * 1024 * 1024,
  maxSourcePixels: 16_777_216, maxTotalSourcePixels: 33_554_432,
  maxWorkingPixelBytes: 512 * 1024 * 1024, padding: 2
} as const;
export const objectResourceCapabilities = {
  available: true, processorVersion: OBJECT_RESOURCE_VERSION, formats: ["png", "jpeg", "webp"],
  normalization: "browser-exif-srgb-full-resolution-v1", limits: OBJECT_RESOURCE_LIMITS,
  limitsScope: "每任务输入、规范化像素、部件和图集的工作预算；不包含浏览器进程自身开销，不是全片素材配额。",
  imageBindings: { maxSlots: 8 }, staticImagesOnly: true, rotation: false, automaticScaling: false
};
const id = z.string().regex(/^[A-Za-z0-9_-]{1,80}$/);
export const rectSchema = z.object({ x: z.number().finite(), y: z.number().finite(), width: z.number().finite().positive(), height: z.number().finite().positive() }).strict();
const pixelRectSchema = rectSchema.extend({ x: z.number().int().nonnegative(), y: z.number().int().nonnegative(), width: z.number().int().positive(), height: z.number().int().positive() });
export const objectResourceSpecSchema = z.object({
  sources: z.array(z.object({ id, asset_id: z.string().min(1) }).strict()).min(1).max(OBJECT_RESOURCE_LIMITS.maxSources),
  parts: z.array(z.object({ id, source_id: id, source_rect: pixelRectSchema.optional(), alpha_mask_source_id: id.optional(),
    mask_mode: z.enum(["alpha", "luminance"]).optional(), trim_transparent: z.boolean().default(false), local_rect: rectSchema }).strict())
    .min(1).max(OBJECT_RESOURCE_LIMITS.maxParts),
  atlas: z.object({ enabled: z.boolean(), max_side: z.number().int().min(8).max(OBJECT_RESOURCE_LIMITS.maxSide), max_pages: z.number().int().min(1).max(OBJECT_RESOURCE_LIMITS.maxPages) }).strict()
}).strict();
export const prepareObjectResourcesSchema = objectResourceSpecSchema.extend({
  project_id: z.string().min(1), base_revision_id: z.number().int().positive(), idempotency_key: z.string().min(1).max(160)
}).strict();
export type ObjectResourceSpec = z.infer<typeof objectResourceSpecSchema>;
export type PrepareObjectResourcesInput = z.infer<typeof prepareObjectResourcesSchema>;
export type Rect = z.infer<typeof rectSchema>;
export const objectResourceLayoutSchema = z.object({
  schemaVersion: z.literal(1), processorVersion: z.string(), inputHash: z.string(),
  pages: z.array(z.object({ id: z.string(), assetId: z.string(), width: z.number().int().positive(), height: z.number().int().positive(), contentHash: z.string() })),
  parts: z.array(z.object({ id: z.string(), pageId: z.string(), atlasRect: pixelRectSchema,
    sourceSize: z.object({ width: z.number().int().positive(), height: z.number().int().positive() }),
    trimOffset: z.object({ x: z.number().int().nonnegative(), y: z.number().int().nonnegative() }), localRect: rectSchema }))
});
export type ObjectResourceLayout = z.infer<typeof objectResourceLayoutSchema>;
export class ObjectResourceError extends Error {
  constructor(public code: string, message: string, public details: Record<string, unknown> = {}) { super(message); this.name = "ObjectResourceError"; }
}
export function validateObjectResourceSpec(value: unknown): ObjectResourceSpec {
  const spec = objectResourceSpecSchema.parse(value);
  const sources = new Set(spec.sources.map(s => s.id));
  if (sources.size !== spec.sources.length || new Set(spec.parts.map(p => p.id)).size !== spec.parts.length) throw new ObjectResourceError("OBJECT_RESOURCE_DUPLICATE_ID", "源与部件 ID 分别必须唯一");
  for (const part of spec.parts) {
    if (!sources.has(part.source_id) || (part.alpha_mask_source_id && !sources.has(part.alpha_mask_source_id))) throw new ObjectResourceError("OBJECT_RESOURCE_SOURCE_MISSING", `部件 ${part.id} 引用了未声明的源`);
    if (Boolean(part.alpha_mask_source_id) !== Boolean(part.mask_mode)) throw new ObjectResourceError("OBJECT_RESOURCE_MASK_MODE", `部件 ${part.id} 的遮罩源和模式必须同时明确给出`);
  }
  return spec;
}
