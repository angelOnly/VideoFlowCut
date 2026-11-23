import { SourceDisplayValidationError } from "../../../packages/edit-application/src/source-display-checks.js";
import { ZodError } from "zod";
import { DomainError } from "@videocut/domain";
import { MotionSubmissionValidationError } from "../../../packages/edit-application/src/motion-submission-validation.js";
import { EffectCueRangeValidationError } from "../../../packages/edit-application/src/effect-cue-validation.js";
import { MotionFontUnknownError } from "../../../packages/motion-work/src/fonts.js";
import { MotionAuthoringCoordinationError, ProductionReferenceResearchError } from "../../../packages/edit-application/src/motion-coordination-error.js";
import { RevisionConflictError } from "@videocut/application";

/** 未知异常不能宣称没有写入；只有明确的输入校验拒绝可纠正参数。 */
export function toolError(error: unknown, validationBeforeExecution = false) {
  if (error instanceof RevisionConflictError && validationBeforeExecution) return { error: error.message, message: error.message, code: "REVISION_CONFLICT",
    stage: "validation", sideEffects: "none", safeToRetry: true, recovery: "correct_input",
    nextAction: "读取当前项目并协调采用后，使用当前版本提交", expectedRevision: error.expected, currentRevision: error.actual };
  if (error instanceof MotionAuthoringCoordinationError || error instanceof ProductionReferenceResearchError) return { error: error.message, message: error.message, code: error.code,
    stage: "validation", sideEffects: "none", safeToRetry: true, recovery: "continue_responsible_author", issues: error.issues };
  if (error instanceof DomainError && ["VISUAL_REVISION_DELIVERY_INVALID", "VISUAL_REVISION_SCOPE_INVALID"].includes(error.code)) {
    return { error: error.message, message: error.message, code: error.code, stage: "validation", sideEffects: "none", safeToRetry: true,
      recovery: "correct_input" };
  }
  if (error instanceof DomainError && ["MOTION_AUTHORING_REQUEST_MISSING", "MOTION_AUTHORING_REQUEST_MISMATCH", "MOTION_AUTHORING_DELIVERY_INVALID"].includes(error.code)) {
    return { error: error.message, message: error.message, code: error.code, stage: "validation", sideEffects: "none", safeToRetry: true,
      recovery: "correct_input", nextAction: "读取已采用交付的 authorRequest.text。缺少章节时由视觉作者补齐并重新确认交付。" };
  }
  if (error instanceof MotionFontUnknownError) return { error: error.message, message: error.message, code: "MOTION_FONT_UNKNOWN", stage: "validation", sideEffects: "none", safeToRetry: true, recovery: "correct_input", fontId: error.fontId,
    fields: [{ field: "work.fontBindings", message: "字体未登记", suggestion: "读取 read_motion_capabilities，由原视觉作者选择已登记字体；用户锁定且无法满足时再回询。" }] };
  if (error instanceof SourceDisplayValidationError) return { error: error.message, message: error.message, code: error.code, stage: "validation", sideEffects: "none", safeToRetry: true, recovery: "correct_input", fields: error.fields };
  // 这些拒绝发生于整批校验或事务回滚，尚未插入任何字幕与导入审计。
  if (error instanceof DomainError && ["CAPTION_SRT_INPUT_INVALID", "CAPTION_SRT_INVALID", "CAPTION_SRT_RANGE_INVALID", "CAPTION_SRT_CONFLICT", "CAPTION_SRT_IDEMPOTENCY_CONFLICT"].includes(error.code)) {
    return { error: error.message, message: error.message, code: error.code, stage: "validation", sideEffects: "none", safeToRetry: true, recovery: "correct_input" };
  }
  if (error instanceof EffectCueRangeValidationError) {
    const { sceneId, sceneRange, requestedRange } = error;
    const message = `效果范围 [${requestedRange.startFrame}, ${requestedRange.endFrame}) 必须完整位于所属场景 [${sceneRange.startFrame}, ${sceneRange.endFrame}) 内，且结束帧大于开始帧。`;
    const suggestion = "将实际范围和当前 Revision 回交原作者修订；covered_narrative_beat_ids 只声明内容覆盖，不扩大 Scene。ManagedMotion 必须保留完整作品时长，由原作者安排能完整承载的 Scene，不能自动截短、拆件或扩大原 Scene。";
    return { error: error.message, message: error.message, code: error.code, stage: "validation", sideEffects: "none",
      safeToRetry: true, recovery: "correct_input", sceneId, sceneRange, requestedRange,
      fields: ["start_frame", "end_frame", ...(error.action === "create" ? ["scene_id"] : [])].map(field => ({ field, message, suggestion })) };
  }
  if (error instanceof MotionSubmissionValidationError) {
    const diagnostic = error.diagnostic;
    return { error: error.message, message: error.message, code: error.code, stage: "validation", sideEffects: "none",
      safeToRetry: true, recovery: "correct_input", fields: [{ field: "work.source", ...diagnostic.location,
        nodeKind: diagnostic.nodeKind, token: diagnostic.token, message: diagnostic.message, suggestion: diagnostic.suggestion }] };
  }
  const message = error instanceof Error ? error.message : String(error);
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "TOOL_FAILED";
  return { error: message, message, code: error instanceof ZodError ? "INVALID_TOOL_INPUT" : code,
    ...(error instanceof ZodError && validationBeforeExecution ? { stage: "validation", sideEffects: "none", safeToRetry: true, recovery: "correct_input",
      fields: error.issues.map(issue => ({ field: issue.path.join("."), message: issue.message })) } : { sideEffects: "unknown", safeToRetry: false }) };
}

export const toolErrorResult = (error: unknown, validationBeforeExecution = false) => ({ content: [{ type: "text" as const, text: JSON.stringify(toolError(error, validationBeforeExecution), null, 2) }], isError: true });
