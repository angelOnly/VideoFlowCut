import { z } from "zod";

const identifier = z.string().trim().min(1);
const sourceMs = z.number().finite().nonnegative();
const frame = z.number().int().nonnegative();
const author = { assignmentId: identifier, inputRevision: z.number().int().positive() };
export const productionUnitModeSchema = z.enum(["original", "full_reference", "local_mechanism"]);
export type ProductionUnitMode = z.infer<typeof productionUnitModeSchema>;

export const productionUnitHandoffSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("submit_draft"), ...author,
    sceneId: identifier, unitId: identifier.regex(/^[^\r\n]+$/u), startFrame: frame, endFrame: frame,
    creativeDecisionId: identifier,
    mode: productionUnitModeSchema.describe("自主创作、完整参考迁移或单独委托的局部机制"),
    body: z.string().min(1).describe("创意作者用本片素材写出的 Markdown 正文，按原文冻结"),
    assets: z.array(z.object({ assetId: identifier,
      sourceRange: z.object({ startMs: sourceMs, endMs: sourceMs }).strict().optional()
    }).strict()).describe("本片实际使用的受管素材；视频填写源区间"),
    reference: z.object({ researchDecisionId: identifier, kind: z.enum(["creative", "motion"]), id: identifier,
      sourceSha256: z.string().regex(/^[a-f0-9]{64}$/u), startMs: sourceMs, endMs: sourceMs }).strict().optional()
      .describe("完整迁移或局部机制所采用的连续原片范围；自主创作的参考在研究和视觉映射中关联"),
  }).strict(),
  z.object({
    action: z.literal("accept_draft"), ...author, draftId: identifier, sourceMs: sourceMs.optional(),
    projectFrame: frame, comparisonPath: identifier, observation: identifier
  }).strict(),
  z.object({
    action: z.literal("return_draft"), ...author, draftId: identifier, sourceMs: sourceMs.optional(),
    projectFrame: frame, gap: identifier, impact: identifier
  }).strict()
]);

export type ProductionUnitHandoffInput = z.infer<typeof productionUnitHandoffSchema>;
