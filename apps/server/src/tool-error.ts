import { ZodError } from "zod";
import { MotionSubmissionValidationError } from "../../../packages/edit-application/src/motion-submission-validation.js";

/** 未知异常不能宣称没有写入；只有明确的输入校验拒绝可纠正参数。 */
export function toolError(error: unknown, validationBeforeExecution = false) {
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

export const toolErrorResult = (error: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(toolError(error), null, 2) }], isError: true });
