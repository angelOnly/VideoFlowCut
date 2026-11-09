import type { ApiFailureDetail } from './api/failure-detail.js';
import type { JsonValue } from './common.js';
export declare const API_ERROR_CODES: readonly ['BAD_REQUEST', 'UNAUTHORIZED', 'FORBIDDEN', 'NOT_FOUND', 'CONFLICT', 'PAYLOAD_TOO_LARGE', 'UNSUPPORTED_MEDIA_TYPE', 'VALIDATION_FAILED', 'AGENT_UNAVAILABLE', 'AGENT_AUTH_REQUIRED', 'AGENT_EXECUTION_FAILED', 'AGENT_CONNECTION_DROPPED', 'AGENT_PROMPT_TOO_LARGE', 'AGENT_CLI_SESSION_REFUSED', 'AMR_MODEL_UNAVAILABLE', 'AMR_AUTH_REQUIRED', 'AMR_INSUFFICIENT_BALANCE', 'AMR_TIER_UPGRADE_REQUIRED', 'ROLE_MARKER_HALLUCINATION', 'TOOL_LOOP_DETECTED', 'AGENT_RUNTIME_DEF_INVALID', 'PROJECT_NOT_FOUND', 'PROJECT_MATERIALIZATION_PENDING', 'CONVERSATION_NOT_FOUND', 'EMPTY_TRANSCRIPT', 'FILE_NOT_FOUND', 'ARTIFACT_NOT_FOUND', 'ARTIFACT_REGRESSION', 'ARTIFACT_PUBLICATION_BLOCKED', 'UPSTREAM_UNAVAILABLE', 'RATE_LIMITED', 'DESKTOP_AUTH_PENDING', 'TOOL_TOKEN_MISSING', 'TOOL_TOKEN_INVALID', 'TOOL_TOKEN_EXPIRED', 'TOOL_ENDPOINT_DENIED', 'TOOL_OPERATION_DENIED', 'MEDIA_EXECUTION_DISABLED', 'MEDIA_SURFACE_DENIED', 'MEDIA_MODEL_DENIED', 'LIVE_ARTIFACT_NOT_FOUND', 'LIVE_ARTIFACT_INVALID', 'LIVE_ARTIFACT_STORAGE_FAILED', 'LIVE_ARTIFACT_REFRESH_UNAVAILABLE', 'LIVE_ARTIFACT_REFRESH_TIMEOUT', 'REFRESH_LOCKED', 'REFRESH_TIMED_OUT', 'REFRESH_FAILED', 'OUTPUT_TOO_LARGE', 'TEMPLATE_BINDING_INVALID', 'REDACTION_REQUIRED', 'CONNECTOR_NOT_FOUND', 'CONNECTOR_AUTH_CONFIG_REQUIRED', 'CONNECTOR_NOT_CONNECTED', 'CONNECTOR_DISABLED', 'CONNECTOR_TOOL_NOT_FOUND', 'CONNECTOR_SAFETY_DENIED', 'CONNECTOR_INPUT_SCHEMA_MISMATCH', 'CONNECTOR_RATE_LIMITED', 'CONNECTOR_OUTPUT_TOO_LARGE', 'CONNECTOR_EXECUTION_FAILED', 'WORKSPACE_CONTEXT_INCOMPLETE', 'WORKSPACE_PROJECT_PERMISSION_DENIED', 'WORKSPACE_AUTHORITY_UNAVAILABLE', 'WORKSPACE_RESOURCE_FROZEN', 'WORKSPACE_RESOURCE_DELETED', 'TEAM_PROJECT_OWNER_CONFLICT', 'RUN_STEERING_UNSUPPORTED', 'RUN_STEERING_CLOSED', 'DESIGN_SYSTEM_ENRICHMENT_IN_PROGRESS', 'PROJECT_CREATE_PREPARATION_TIMEOUT', 'INTERNAL_ERROR'];
export type ApiErrorCode = (typeof API_ERROR_CODES)[number];
export interface ApiError {
    code: ApiErrorCode;
    message: string;
    details?: JsonValue;
    retryable?: boolean;
    requestId?: string;
    taskId?: string;
    /** Optional closed-token classification; see `api/failure-detail.ts`. */
    failure?: ApiFailureDetail;
}
export interface ApiErrorResponse {
    error: ApiError;
}
export type ApiValidationIssue = {
    /** Dot/bracket path, JSON pointer, or form field name that failed validation. */
    path: string;
    message: string;
    code?: string;
};
export type ApiValidationErrorDetails = {
    kind: 'validation';
    issues: ApiValidationIssue[];
};
/** Success payload or shared error envelope for agent-facing daemon tool endpoints. */
export type AgentToolApiResponse<TSuccess> = TSuccess | ApiErrorResponse;
export type LegacyErrorResponse = {
    error: string;
} | {
    code: string;
    error: string;
};
export type CompatibleErrorResponse = ApiErrorResponse | LegacyErrorResponse;
export interface SseErrorPayload {
    message: string;
    error?: ApiError;
    /**
     * Bounded, secret-redacted tail of what the agent process printed to stderr
     * during this run — the ORIGINAL cause behind a failure whose `message` is
     * necessarily generic (e.g. "…exited without a terminal result").
     *
     * Produced daemon-side by `failureCardStderrTail`, so the bound (a tail of
     * lines, capped in bytes) and the redaction both happen before the text
     * crosses the process boundary. Absent when the run wrote no stderr —
     * consumers must render nothing rather than an empty section.
     */
    stderrTail?: string;
}
export declare function createApiError(code: ApiErrorCode, message: string, init?: Omit<ApiError, 'code' | 'message'>): ApiError;
export declare function createApiErrorResponse(error: ApiError): ApiErrorResponse;
//# sourceMappingURL=errors.d.ts.map