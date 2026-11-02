import { z } from "zod";
const common = { cueId: z.string().min(1), audioPolicy: z.literal("rebind_unchanged_events") };
/** 已明确的业务委托；校样用途不能携带自动采用。 */
export const motionOnSuccessSchema = z.discriminatedUnion("action", [
  z.object({ ...common, action: z.literal("replace_cue") }).strict(),
  z.object({ ...common, action: z.literal("replace_range"),
    targetRange: z.object({ startFrame: z.number().int().nonnegative(), endFrame: z.number().int().positive() }).strict() }).strict()
]);
