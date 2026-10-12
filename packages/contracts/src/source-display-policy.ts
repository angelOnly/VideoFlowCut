import { z } from "zod";

/** 任务的展示约定；basis 保存依据，不代表平台验证了调用者授权。 */
export const sourceDisplayPolicySchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("internal_only") }).strict(),
  z.object({ mode: z.literal("specified"), exceptions: z.array(z.object({
    scopeId: z.string().trim().min(1).max(150),
    text: z.string().trim().min(1).max(1600),
    basis: z.string().trim().min(1).max(4000)
  }).strict()).min(1).max(100) }).strict()
]);
export type SourceDisplayPolicy = z.infer<typeof sourceDisplayPolicySchema>;
export const frozenSourceDisplaySchema = z.object({ policy: sourceDisplayPolicySchema, scopeId: z.string().min(1) }).strict();
export type FrozenSourceDisplay = z.infer<typeof frozenSourceDisplaySchema>;

// 只在新提交时解析缺省策略，不回填历史快照、Job 或源码。
export function resolveSourceDisplayPolicy(value?: SourceDisplayPolicy): SourceDisplayPolicy {
  return sourceDisplayPolicySchema.parse(value ?? { mode: "internal_only" });
}
export function sourceCaptionAllowed(policy: SourceDisplayPolicy, scopeId: string, text: string): boolean {
  return !text.trim() || policy.mode === "specified" && policy.exceptions.some(entry => entry.scopeId === scopeId && entry.text === text.trim());
}
