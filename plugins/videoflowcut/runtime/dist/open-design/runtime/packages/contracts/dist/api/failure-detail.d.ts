/** Where in the operation the failure happened. */
export type ApiFailureStage = 'push' | 'snapshot' | 'persist' | 'redact' | 'file_plan' | 'provider';
/** Why it failed, as far as the daemon can tell without guessing. */
export type ApiFailureReason = 'timeout' | 'aborted' | 'cli_missing' | 'not_signed_in' | 'upstream_http' | 'object_store' | 'network' | 'empty_response'
/** Local pinned-session preparation failed before the command started. */
 | 'session_setup'
/** Cleanup failed after a command settled; its remote outcome is not inferred. */
 | 'session_cleanup'
/** The CLI output did not confirm the exact requested publication. */
 | 'invalid_receipt' | 'coded' | 'provider_rejected' | 'provider_token_invalid' | 'provider_unreachable' | 'local_file' | 'internal' | 'unknown';
export interface ApiFailureDetail {
    stage: ApiFailureStage;
    reason: ApiFailureReason;
    /** HTTP status returned by the upstream service (Vela API or deploy provider). */
    upstreamStatus?: number;
    /** Error code returned by the upstream service, e.g. Vela `user_banned`. */
    upstreamCode?: string;
}
export declare const API_FAILURE_STAGES: readonly ApiFailureStage[];
export declare const API_FAILURE_REASONS: readonly ApiFailureReason[];
/** Accept only a token-shaped upstream code; anything else is dropped. */
export declare function normalizeUpstreamCode(value: unknown): string | undefined;
/** Accept only an HTTP status integer; anything else is dropped. */
export declare function normalizeUpstreamStatus(value: unknown): number | undefined;
/**
 * Read an untrusted `failure` value. Returns undefined unless stage and reason
 * are known tokens; optional fields that fail validation are dropped.
 */
export declare function parseApiFailureDetail(value: unknown): ApiFailureDetail | undefined;
/**
 * Header a client may send with a publish-public or deploy request so the
 * daemon's failure log line and the client's analytics event share one id.
 * Observational only: the daemon never branches on it.
 */
export declare const CLIENT_REQUEST_ID_HEADER = "x-od-request-id";
/** Accept only a token-shaped request id; anything else is dropped. */
export declare function normalizeClientRequestId(value: unknown): string | undefined;
//# sourceMappingURL=failure-detail.d.ts.map