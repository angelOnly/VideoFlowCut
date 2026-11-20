import { z } from "zod";
import { motionOnSuccessSchema } from "./motion-continuation.js";
import type { MotionAuthoringTreatmentInput } from "./index.js";

export const motionAuthoringTargetSchema = z.union([
  motionOnSuccessSchema,
  z.object({ action: z.literal("whole_film") }).strict()
]);

/** 一次委托绑定 OD 项目、完整制作请求及已授权采用目标。 */
export const motionAuthoringRequestSchema = z.object({
  project: z.string().min(1), prompt: z.string().trim().min(1).optional(),
  skill: z.string().min(1).optional(), skills: z.array(z.string().min(1)).optional(),
  plugin: z.string().min(1).optional(), inputs: z.record(z.unknown()).optional(),
  agent: z.string().min(1).optional(), model: z.string().min(1).optional(), serviceTier: z.string().min(1).optional(),
  continue_from_run_id: z.string().min(1).optional()
}).strict();
export const motionAuthoringInputSchema = z.object({
  projectId: z.string().min(1), baseRevision: z.number().int().positive(), productionRunId: z.string().min(1),
  visualTreatmentIds: z.array(z.string().min(1)).min(1).optional(),
  target: motionAuthoringTargetSchema, openDesignRequest: motionAuthoringRequestSchema,
  idempotencyKey: z.string().min(1).max(120)
}).strict();
export type MotionAuthoringInput = z.infer<typeof motionAuthoringInputSchema>;

export interface MotionAuthoringSceneTarget {
  target: Extract<z.infer<typeof motionOnSuccessSchema>, { action: "create_cue" }>;
  authoringInputs: MotionAuthoringTreatmentInput[];
  initialTargetHash: string;
}
