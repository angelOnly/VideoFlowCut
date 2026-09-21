import { z } from "zod";
import { assetUsageRightsInputSchema } from "../../contracts/src/editorial-inputs.js";
import { motionSourceForUrl } from "./catalog.js";

const description = z.string().trim().min(8).max(1800);
/** 观察记录是创作判断，不等于平台已自动观看、许可通过或成片审片通过。 */
export const motionSubmissionSchema = z.object({
  name: z.string().trim().min(1).max(120),
  source: z.string().min(20).max(60_000),
  props: z.record(z.unknown()).default({}),
  imageBindings: z.record(z.string().regex(/^[a-z][a-z0-9_]{0,39}$/u), z.string().min(1).max(150)).default({}),
  width: z.number().int().min(64).max(1920).describe("画布宽度（像素），64–1920 的偶数；须同时满足 width×height×durationInFrames≤650000000。"),
  height: z.number().int().min(64).max(1920).describe("画布高度（像素），64–1920 的偶数；须同时满足 width×height×durationInFrames≤650000000。"),
  fps: z.number().int().min(15).max(60).describe("帧率，15–60 的整数；durationInFrames/fps≤30 秒。"),
  durationInFrames: z.number().int().min(2).max(900).describe("单作品完整帧数，2–900 的整数，且不超过30秒及650000000像素帧；最大帧数为min(900,30×fps,floor(650000000/(width×height)))。"),
  reference: z.object({
    url: z.string().url().refine((value) => { try { motionSourceForUrl(value); return true; } catch { return false; } }, "只能使用已选择的在线来源"),
    observation: z.object({
      layout: description,
      motion: description,
      rhythm: description,
      adaptation: description,
      evidence: description
    }).strict()
  }).strict().optional(),
  rights: z.object({
    basis: description,
    status: z.enum(["unknown", "cleared", "attribution_required", "restricted"]),
    attribution: z.string().max(1200).optional(),
    usageRights: assetUsageRightsInputSchema.optional()
  }).strict(),
  previousAssetId: z.string().max(150).optional(),
  // 追加字段不注入默认值，不改变历史输入的字段次序和作品哈希。
  creativeBrief: z.string().trim().min(1).max(6000).optional(),
  videoBindings: z.record(z.string().regex(/^[a-z][a-z0-9_]{0,39}$/u), z.object({
    assetId: z.string().min(1).max(150), sourceStartMs: z.number().int().nonnegative(), sourceEndMs: z.number().int().positive(), decodeScale: z.number().finite().gt(0).max(1).optional()
  }).strict()).optional().describe("受管动态视频，最多4路；源范围为毫秒半开区间，正常速度且静音。源码从 @videoflowcut/motion 导入 BoundVideo，以 slot 引用，offsetInFrames 与 Sequence 局部帧共同确定播放位置。")
}).strict().superRefine((value, ctx) => {
  if (value.durationInFrames / value.fps > 30) ctx.addIssue({ code: "custom", message: "单个受管动效最长 30 秒" });
  if (JSON.stringify(value.props).length > 24_000) ctx.addIssue({ code: "custom", message: "Props 超过大小上限" });
  if (Object.keys(value.imageBindings).length > 8) ctx.addIssue({ code: "custom", message: "单个作品最多绑定 8 个图片素材" });
  if ("assets" in value.props) ctx.addIssue({ code: "custom", message: "Props.assets 由平台按 imageBindings 注入，不能覆盖" });
  if (value.width % 2 || value.height % 2) ctx.addIssue({ code: "custom", message: "画布宽高必须是偶数" });
  if (Object.keys(value.videoBindings ?? {}).length > 4) ctx.addIssue({ code: "custom", message: "单个作品最多绑定4路视频" });
  for (const binding of Object.values(value.videoBindings ?? {})) if (binding.sourceEndMs <= binding.sourceStartMs || binding.sourceEndMs - binding.sourceStartMs > 30_000) ctx.addIssue({ code: "custom", message: "视频源范围必须为正且不超过30秒" });
  if (value.rights.status === "attribution_required" && !value.rights.attribution?.trim()) ctx.addIssue({ code: "custom", message: "需要署名时必须提供署名内容" });
});
export type MotionSubmission = z.infer<typeof motionSubmissionSchema>;

/** 事件必须由受管代码实际计算，平台只校验结果和绑定版本。 */
export function parseMotionEvents(value: unknown, frameCount: number) {
  const events = z.array(z.object({ id: z.string().trim().min(1).max(160), meaning: z.string().trim().min(1).max(500), startFrame: z.number().int().nonnegative(), endFrame: z.number().int().positive().optional() }).strict()).max(100).parse(value);
  if (new Set(events.map((event) => event.id)).size !== events.length || events.some((event) => event.startFrame >= frameCount || event.endFrame !== undefined && (event.endFrame <= event.startFrame || event.endFrame > frameCount))) throw new Error("MOTION_EVENT_RANGE_INVALID: 事件 ID 重复或范围不在当前作品内");
  return events;
}

export const motionReviewEvidenceSchema = z.object({
  kind: z.enum(["work_proxy", "project_preview"]).describe("work_proxy用作品局部帧；project_preview用项目全局帧"), previewJobId: z.string().min(1).optional(),
  startFrame: z.number().int().nonnegative().describe("实际观察半开区间的起点；坐标系取决于kind"), endFrame: z.number().int().positive().describe("实际观察半开区间的终点；failed/inconclusive允许局部范围，passed须完整覆盖作品"),
  method: z.enum(["frames", "continuous_video", "audio", "audiovisual"])
}).strict();
export const motionReviewFields = {
  outcome: z.enum(["passed", "failed", "inconclusive"]).optional(),
  referenceMatch: z.enum(["passed", "failed", "inconclusive"]).optional(),
  note: z.string().min(16).max(2400), evidence: motionReviewEvidenceSchema.optional()
};

/** 提交时固定素材身份、字节哈希与权利，不让后台任务读取后来变更的绑定。 */
export const boundMotionImageSchema = z.object({
  slot: z.string().regex(/^[a-z][a-z0-9_]{0,39}$/u), assetId: z.string().min(1), managedPath: z.string().min(1),
  hash: z.string().regex(/^[a-f0-9]{64}$/u), rightsStatus: z.string(), attribution: z.string().optional(),
  usageRights: z.object({ purposes: z.array(z.enum(["draft", "delivery"])).min(1).max(2), basis: z.string().trim().min(1).max(2000), confirmedAt: z.string().datetime() }).strict().optional()
}).strict();
export type BoundMotionImage = z.infer<typeof boundMotionImageSchema>;
export const boundMotionVideoSchema = boundMotionImageSchema.extend({ sourceStartMs: z.number().int().nonnegative(), sourceEndMs: z.number().int().positive(), decodeScale: z.number().finite().gt(0).max(1).optional() });
export type BoundMotionVideo = z.infer<typeof boundMotionVideoSchema>;
export interface DecodedMotionVideo { framePaths: string[]; width: number; height: number; geometry?: { streamIndex: number; encodedWidth: number; encodedHeight: number; sar: number; rotation: number; displayWidth: number; displayHeight: number; durationMs: number }; decodeScale?: number; }
