import { z } from "zod";

const identifier = z.string().trim().min(1);
const sourceMs = z.number().finite().nonnegative();
const frame = z.number().int().nonnegative();
const author = { assignmentId: identifier, inputRevision: z.number().int().positive() };
const slotName = identifier.regex(/^[^【】\s]+$/u);

export const productionUnitHandoffSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("submit_draft"), ...author,
    sceneId: identifier, unitId: identifier.regex(/^[^\r\n]+$/u), startFrame: frame, endFrame: frame,
    creativeDecisionId: identifier,
    reference: z.object({ researchDecisionId: identifier, kind: z.enum(["creative", "motion"]), id: identifier,
      sourceSha256: z.string().regex(/^[a-f0-9]{64}$/u), startMs: sourceMs, endMs: sourceMs }).strict(),
    replacements: z.array(z.discriminatedUnion("kind", [
      z.object({ name: slotName, kind: z.literal("text"),
        text: identifier.regex(/^[^\r\n【】]+$/u) }).strict(),
      z.object({ name: slotName, kind: z.literal("asset"), assetId: identifier,
        sourceRange: z.object({ startMs: sourceMs, endMs: sourceMs }).strict().optional() }).strict()
    ])).describe("只填已登记原句里的【名称】。文字与数值用 text，素材用 asset，重复出现的名称填一次。")
  }).strict(),
  z.object({
    action: z.literal("accept_draft"), ...author, draftId: identifier, sourceMs,
    projectFrame: frame, comparisonPath: identifier, observation: identifier
  }).strict(),
  z.object({
    action: z.literal("return_draft"), ...author, draftId: identifier, sourceMs, gap: identifier, impact: identifier
  }).strict()
]);

export type ProductionUnitHandoffInput = z.infer<typeof productionUnitHandoffSchema>;
