import { z } from "zod";
const common = { cueId: z.string().min(1), audioPolicy: z.literal("rebind_unchanged_events") };
/** 已明确的业务委托；校样用途不能携带自动采用。 */
export const motionOnSuccessSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create_cue"), audioPolicy: z.literal("rebind_unchanged_events"),
    sceneId: z.string().min(1), layer: z.enum(["rear", "actor", "front", "fullscreen"]),
    startFrame: z.number().int().nonnegative(), endFrame: z.number().int().positive(),
    sourceStartFrame: z.number().int().nonnegative(), sourceEndFrame: z.number().int().positive(),
    visualComposition: z.object({ role: z.literal("primary"), replacesActorItemIds: z.array(z.string().min(1)) }).strict().optional(),
    coveredNarrativeBeatIds: z.array(z.string().min(1)).max(64).optional(),
    note: z.string().optional(), narrativePurpose: z.string().max(800).optional(), audienceTask: z.string().max(800).optional()
  }).strict(),
  z.object({ ...common, action: z.literal("replace_cue") }).strict(),
  z.object({ ...common, action: z.literal("replace_range"),
    targetRange: z.object({ startFrame: z.number().int().nonnegative(), endFrame: z.number().int().positive() }).strict() }).strict()
]);
