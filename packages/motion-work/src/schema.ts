import { z } from "zod";
import { MOTION_SOURCE_MAX_LENGTH } from "./hyperframes-contract.js";
import { motionSourceForUrl } from "./catalog.js";

import { motionWorkFields, validateMotionWorkFields } from "../../contracts/src/authored-motion-manifest-v1.js";

const videoSlotSchema = z.string().regex(/^[a-z][A-Za-z0-9_]{0,39}$/u);
const fields = motionWorkFields.shape;
/** 与作者清单共用字段和绑定校验，正式提交补充源码与项目内复用身份。 */
export const motionSubmissionSchema = z.object({
  compositing: fields.compositing,
  renderedAssetId: z.string().min(1).max(150).optional().describe("采用已登记且像素身份一致的正式作品媒体"),
  name: fields.name,
  source: z.string().min(20).max(MOTION_SOURCE_MAX_LENGTH).describe("完整 HyperFrames 单页 HTML，CSS 和 JS 内联，固定运行库由平台提供"),
  props: fields.props,
  imageBindings: fields.imageBindings,
  width: fields.width,
  height: fields.height,
  fps: fields.fps,
  durationInFrames: fields.durationInFrames,
  reference: fields.reference,
  sourceDisplayScopeId: fields.sourceDisplayScopeId,
  previousAssetId: z.string().max(150).optional(),
  creativeBrief: fields.creativeBrief,
  videoBindings: fields.videoBindings,
  fontBindings: fields.fontBindings
}).strict().superRefine((value, ctx) => {
  validateMotionWorkFields(value, ctx);
  if (value.reference) {
    try { motionSourceForUrl(value.reference.url); }
    catch { ctx.addIssue({ code: "custom", path: ["reference", "url"], message: "只能使用已选择的在线来源" }); }
  }
});
/** 校样与正式局部媒体都使用完整作品源码、Props 与根时钟。 */
export const motionFrameRangeSchema = z.object({ startFrame: z.number().int().nonnegative(), endFrame: z.number().int().positive() }).strict()
  .refine(range => range.endFrame > range.startFrame, "输出窗口必须为非空半开区间");
export type MotionFrameRange = z.infer<typeof motionFrameRangeSchema>;
export type MotionSubmission = z.infer<typeof motionSubmissionSchema>;

/** 事件必须由受管代码实际计算，平台只校验结果和绑定版本。 */
export function parseMotionEvents(value: unknown, frameCount: number) {
  const events = z.array(z.object({ id: z.string().trim().min(1).max(160), meaning: z.string().trim().min(1).max(500), startFrame: z.number().int().nonnegative(), endFrame: z.number().int().positive().optional() }).strict()).max(100).parse(value);
  if (new Set(events.map((event) => event.id)).size !== events.length || events.some((event) => event.startFrame >= frameCount || event.endFrame !== undefined && (event.endFrame <= event.startFrame || event.endFrame > frameCount))) throw new Error("MOTION_EVENT_RANGE_INVALID: 事件 ID 重复或范围不在当前作品内");
  return events;
}

export const motionReviewEvidenceSchema = z.object({
  kind: z.enum(["work_proxy", "project_preview", "workbench"]).describe("work_proxy用派生媒体局部帧；project_preview和workbench用项目全局帧"), previewJobId: z.string().min(1).optional(), observer: z.string().trim().min(1).optional(),
  startFrame: z.number().int().nonnegative().describe("实际观察半开区间的起点；坐标系取决于kind"), endFrame: z.number().int().positive().describe("实际观察半开区间的终点；failed/inconclusive允许局部范围，passed须完整覆盖作品"),
  method: z.enum(["frames", "continuous_video", "audio", "audiovisual"])
}).strict();
export const motionReviewFields = {
  outcome: z.enum(["passed", "failed", "inconclusive"]),
  note: z.string().min(16).max(2400), evidence: motionReviewEvidenceSchema.optional()
};

/** 提交时固定素材身份与字节哈希，不让后台任务读取后来变更的绑定。 */
export const boundMotionImageSchema = z.object({
  slot: z.string().regex(/^[a-z][a-z0-9_]{0,39}$/u), assetId: z.string().min(1), managedPath: z.string().min(1),
  hash: z.string().regex(/^[a-f0-9]{64}$/u),
}).strict();
export type BoundMotionImage = z.infer<typeof boundMotionImageSchema>;
export const boundMotionFontSchema = z.object({
  slot: videoSlotSchema, fontId: z.string().regex(/^[a-z][a-z0-9-]{0,79}$/u),
  hash: z.string().regex(/^[a-f0-9]{64}$/u), family: z.string().regex(/^VFC_[a-f0-9]{64}$/u),
  weight: z.number().int().min(100).max(900), style: z.enum(["normal", "italic"])
}).strict();
export type BoundMotionFont = z.infer<typeof boundMotionFontSchema>;
export const boundMotionVideoSchema = boundMotionImageSchema.extend({ slot: videoSlotSchema, sourceStartMs: z.number().int().nonnegative(), sourceEndMs: z.number().int().positive(), startFrame: z.number().int().nonnegative(), endFrame: z.number().int().positive(), decodeScale: z.number().finite().gt(0).max(1).optional() });
export type BoundMotionVideo = z.infer<typeof boundMotionVideoSchema>;
export interface DecodedMotionVideo { width: number; height: number; frameCount: number; startFrame: number; endFrame: number; geometry?: { streamIndex: number; encodedWidth: number; encodedHeight: number; sar: number; rotation: number; displayWidth: number; displayHeight: number; durationMs: number }; decodeScale?: number; }
export interface MotionVideoProvider {
  videos: Record<string, DecodedMotionVideo>;
  workingSetBytes: number;
  reserveDiskSpace(bytes: number): Promise<void>;
  getFrame(slot: string, workFrame: number): Promise<Buffer>;
  releaseBefore(workFrame: number): Promise<void>;
  verifySources(): Promise<void>;
  close(): Promise<void>;
}
