import type { TrackingAmrOpenCodeErrorPhase, TrackingAmrOpenCodeLastEventType, TrackingAmrOpenCodeLastToolKind, TrackingAmrOpenCodeLastToolStatus } from '@open-design/contracts/analytics';
export interface RunEventForDiagnostics {
    event: string;
    data: unknown;
}
export type RunDiagnosticSource = 'error_event' | 'stderr' | 'exit_code' | 'signal' | 'unknown';
export type StderrLineCountBucket = 'none' | '1_5' | '6_20' | '21_100' | 'gt_100';
export type RunCloseReason = 'exit_0' | 'exit_nonzero' | 'signal' | 'cancel_requested' | 'stream_error' | 'fatal_rpc_error' | 'empty_output' | 'unknown';
export interface RunDiagnosticsAnalytics {
    diagnostic_source: RunDiagnosticSource;
    stderr_present: boolean;
    stderr_line_count_bucket: StderrLineCountBucket;
    stdout_present: boolean;
    stdout_line_count_bucket: StderrLineCountBucket;
    rpc_close_reason: RunCloseReason;
    first_token_seen: boolean;
    user_visible_output_seen: boolean;
    tool_call_seen: boolean;
    tool_result_sent: boolean;
    approval_requested: boolean;
    artifact_write_seen: boolean;
    live_artifact_seen: boolean;
    amr_opencode_error_phase?: TrackingAmrOpenCodeErrorPhase;
    amr_opencode_last_event_type?: TrackingAmrOpenCodeLastEventType;
    amr_opencode_last_tool_status?: TrackingAmrOpenCodeLastToolStatus;
    amr_opencode_last_tool_kind?: TrackingAmrOpenCodeLastToolKind;
    resume_auto_reseeded: boolean;
    prompt_budget_version?: 'prompt_budget_v1';
    prompt_frame_bytes?: number;
    prompt_bytes?: number;
    prompt_token_estimate?: number;
    prompt_token_estimate_method?: 'utf8_bytes_div_3_ceil_v1';
    prompt_session_mode?: 'new' | 'resume';
    prompt_model_id?: string;
    prompt_context_window_source?: 'model_metadata' | 'unknown';
    prompt_context_window_tokens?: number;
    prompt_prior_session_usage_source?: 'agent_session' | 'unknown';
    prompt_prior_session_input_tokens?: number;
    tool_execution_lifecycle_seen?: boolean;
    tool_execution_lifecycle_count_bucket?: '1' | '2_5' | '6_20' | 'gt_20';
    tool_execution_trigger?: 'exit' | 'abort' | 'deadline' | 'mixed' | 'unknown';
    tool_execution_terminal?: 'running' | 'returned' | 'failed' | 'interrupted' | 'mixed' | 'unknown';
    tool_terminal_source?: 'tool_result' | 'tool_error' | 'processor_cleanup' | 'mixed' | 'unknown';
    tool_kill_outcome?: 'none' | 'requested' | 'sent' | 'failed';
    tool_child_close_seen?: boolean;
    tool_stdout_close_seen?: boolean;
    tool_stderr_close_seen?: boolean;
    tool_execution_evidence_incomplete?: boolean;
}
export interface RunToolProgress {
    toolCallSeen: boolean;
    toolResultSent: boolean;
    hasOutstandingTool: boolean;
}
export interface StreamTailSummary {
    tail: string;
    lineCount: number;
    truncated: boolean;
}
export type StderrTailSummary = StreamTailSummary;
export type StdoutTailSummary = StreamTailSummary;
export declare const STDERR_TAIL_MAX_BYTES: number;
export declare function promptBudgetAnalyticsFromDiagnostic(data: Record<string, unknown>): Partial<RunDiagnosticsAnalytics> | null;
export declare function summarizeRunToolProgress(events?: RunEventForDiagnostics[]): RunToolProgress;
export declare function stderrLineCountBucket(count: number): StderrLineCountBucket;
/**
 * The one bound this repository puts on captured process output before it
 * leaves the daemon: the last {@link STDERR_TAIL_MAX_LINES} lines, capped at
 * {@link STDERR_TAIL_MAX_BYTES} UTF-8 bytes, with `redactSecrets` applied.
 *
 * Returns `undefined` for an empty stream so every caller renders nothing
 * rather than an empty section.
 */
export declare function summarizeStreamTailText(streamText: string): StreamTailSummary | undefined;
/** Prefixed onto a tail whose earlier lines were dropped, so a reader knows the
 *  card is showing an excerpt and that 「Export logs」 holds the whole thing. */
export declare const STDERR_TAIL_TRUNCATION_MARKER = "[earlier stderr omitted]";
/**
 * The stderr a run-failure card is allowed to show: the same bounded, redacted
 * tail the telemetry exporter uses, plus an explicit marker when earlier output
 * was dropped.
 *
 * The card's copy promises the reader "the original error"; a failure whose
 * `message` is the daemon's own generic sentence has that original only here.
 * Bounding and redaction happen daemon-side so the text is already safe by the
 * time it reaches the SSE stream, the persisted message, or any other consumer.
 */
export declare function failureCardStderrTail(streamText: string): string | undefined;
/**
 * Decorate a run's terminal `error` frame with the stderr that same run already
 * emitted, so the single payload reaching both the live client and the
 * persisted assistant message carries the original cause.
 *
 * Additive only: `message` / `error.code` are left exactly as the emitter wrote
 * them, because those are what the failure classifiers and the card mapping
 * read. Returns `data` untouched for any other event, for a run that wrote no
 * stderr, and for a payload that already carries a tail.
 */
export declare function withFailureStderrTail(event: string, data: unknown, stderrText: string): unknown;
export declare function collectStderrTailSummary(events?: RunEventForDiagnostics[]): StderrTailSummary | undefined;
export declare function collectStdoutTailSummary(events?: RunEventForDiagnostics[]): StdoutTailSummary | undefined;
export declare function summarizeRunDiagnosticsForAnalytics(args: {
    events?: RunEventForDiagnostics[];
    /** Validated projection folded before the in-memory event tail can evict it. */
    promptBudgetDiagnostics?: Partial<RunDiagnosticsAnalytics> | null | undefined;
    exitCode?: number | null;
    signal?: string | null;
    cancelRequested?: boolean;
    streamErrorSeen?: boolean;
    fatalRpcErrorSeen?: boolean;
    emptyOutputFailure?: boolean;
    firstTokenSeen?: boolean;
    artifactWriteSeen?: boolean;
    liveArtifactSeen?: boolean;
}): RunDiagnosticsAnalytics;
