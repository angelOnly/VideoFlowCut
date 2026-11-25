import { z } from "zod";

const identifier = z.string().trim().min(1);
const sourceMs = z.number().finite().nonnegative();
const frame = z.number().int().nonnegative();
const author = { assignmentId: identifier, inputRevision: z.number().int().positive() };
export const productionUnitModeSchema = z.enum(["full_reference", "local_mechanism"]);
export type ProductionUnitMode = z.infer<typeof productionUnitModeSchema>;

// 交接工具与作者使用同一组 Markdown 小节，正文仍按原文冻结。
export const fullReferenceDraftSections = [
  "整片视觉研究", "原片完整表现", "本片素材与源范围", "本片完整演出",
  "必须保留的视觉特征", "替换与补偿", "场间接续"
] as const;
export const fullReferenceObservationSections = [
  "同状态对照", "连续过程对照", "原片时间", "本片帧段", "实际差异", "删减判断"
] as const;

export const productionUnitHandoffSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("submit_draft"), ...author,
    sceneId: identifier, unitId: identifier.regex(/^[^\r\n]+$/u), startFrame: frame, endFrame: frame,
    creativeDecisionId: identifier,
    mode: productionUnitModeSchema.describe("完整参考迁移或独立委托的局部机制；完整解说新片使用完整参考迁移"),
    body: z.string().min(1).describe(`创意作者的固定 Markdown 正文。完整参考使用带正文的小节：${fullReferenceDraftSections.join("、")}`),
    assets: z.array(z.object({ assetId: identifier,
      sourceRange: z.object({ startMs: sourceMs, endMs: sourceMs }).strict().optional()
    }).strict()).describe("本片实际使用的受管素材；视频填写源区间"),
    reference: z.object({ researchDecisionId: identifier, kind: z.enum(["creative", "motion"]), id: identifier,
      sourceSha256: z.string().regex(/^[a-f0-9]{64}$/u), startMs: sourceMs, endMs: sourceMs }).strict()
      .describe("实际观看并采用的连续原片范围；独立局部机制使用 motion 来源"),
  }).strict(),
  z.object({
    action: z.literal("accept_draft"), ...author, draftId: identifier, sourceMs,
    projectFrame: frame, comparisonPath: identifier.describe("完整参考使用先呈现同状态、再呈现连续过程的视频对照"),
    observation: identifier.describe(`完整参考使用带正文的小节：${fullReferenceObservationSections.join("、")}；前两项标明对照视频内的时间位置`)
  }).strict(),
  z.object({
    action: z.literal("return_draft"), ...author, draftId: identifier, sourceMs,
    projectFrame: frame, gap: identifier, impact: identifier
  }).strict()
]);

export type ProductionUnitHandoffInput = z.infer<typeof productionUnitHandoffSchema>;
