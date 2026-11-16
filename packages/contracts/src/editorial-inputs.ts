import { z } from "zod";

/** 逐条参考对照必须明确结论；待审身份由状态接口单独返回。 */
export const referenceReviewInputSchema = z.object({
  productionRunId: z.string().min(1), decisionId: z.string().min(1), sceneId: z.string().min(1),
  referenceKind: z.enum(["creative", "motion"]), referenceId: z.string().min(1), sourceSha256: z.string().min(1),
  targetRole: z.string().min(1), startMs: z.number().nonnegative(), endMs: z.number().positive(),
  originalRelation: z.string().trim().min(1), actualImplementation: z.string().trim().min(1), difference: z.string().trim().min(1),
  outcome: z.enum(["confirmed", "issue", "inconclusive"]), impact: z.string().trim().min(1).optional(), findingId: z.string().min(1).optional()
}).strict();

export const referenceReviewToolInputSchema = z.object({
  production_run_id: z.string().min(1), decision_id: z.string().min(1), scene_id: z.string().min(1),
  reference_kind: z.enum(["creative", "motion"]), reference_id: z.string().min(1), source_sha256: z.string().min(1),
  target_role: z.string().min(1), start_ms: z.number().nonnegative(), end_ms: z.number().positive(),
  original_relation: z.string().trim().min(1), actual_implementation: z.string().trim().min(1), difference: z.string().trim().min(1),
  outcome: z.enum(["confirmed", "issue", "inconclusive"]), impact: z.string().trim().min(1).optional(), finding_id: z.string().min(1).optional()
}).strict();

/** HTTP、MCP 共用的显示纠错依据；缺省 basis 仅兼容已有回听接口。 */
export const sourceCaptionTextReviewSchema = z.union([
  z.object({ basis: z.literal("listening").optional(), note: z.string().trim().min(1).max(1000) }).strict(),
  z.object({ basis: z.literal("confirmed_script"), note: z.string().trim().min(1).max(1000), scriptRevision: z.number().int().positive(), speechSegmentIds: z.array(z.string().min(1)).min(1).max(20) }).strict(),
  z.object({ basis: z.literal("user_instruction"), note: z.string().trim().min(1).max(1000), instruction: z.string().trim().min(1).max(2000), source: z.string().trim().min(1).max(1000) }).strict()
]);

/** 自动化不能把导出成功当作用户批准；调用方须持有用户对这一哈希的明确确认。 */
export const exportApprovalSchema = z.object({
  confirmedByUser: z.literal(true),
  fileHash: z.string().regex(/^[a-f0-9]{64}$/u),
  note: z.string().trim().max(1000).optional()
}).strict();
