import { z } from "zod";

const identifier = z.string().trim().min(1);
const sourceMs = z.number().finite().nonnegative();
const frame = z.number().int().nonnegative();
const author = { assignmentId: identifier, inputRevision: z.number().int().positive() };

export const productionUnitHandoffSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("submit_draft"), ...author,
    sceneId: identifier, unitId: identifier, startFrame: frame, endFrame: frame,
    creativeDecisionId: identifier,
    reference: z.object({ researchDecisionId: identifier, kind: z.enum(["creative", "motion"]), id: identifier,
      sourceSha256: z.string().regex(/^[a-f0-9]{64}$/u), startMs: sourceMs, endMs: sourceMs }).strict(),
    draftPath: identifier,
    assets: z.array(z.object({ assetId: identifier,
      sourceRange: z.object({ startMs: sourceMs, endMs: sourceMs }).strict().optional() }).strict())
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
