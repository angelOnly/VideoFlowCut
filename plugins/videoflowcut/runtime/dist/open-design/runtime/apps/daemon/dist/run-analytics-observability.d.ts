import type { TrackingArtifactWriteSource, TrackingArtifactWriteStatus, TrackingByokProviderId, TrackingCliProviderId, TrackingFirstModelEventType, TrackingRunLifecyclePhase, TrackingRunPhaseTimingStatus, TrackingRuntimeType } from '@open-design/contracts/analytics';
import type { VelaLoginStatus } from './integrations/vela.js';
export declare function runtimeTypeForRunAnalytics(args: {
    derived: TrackingRuntimeType;
    hint?: unknown;
}): TrackingRuntimeType;
export declare function agentProviderIdForRunAnalytics(args: {
    agentId: unknown;
    byokProvider?: unknown;
}): TrackingCliProviderId | TrackingByokProviderId;
export declare function amrUserIdForRunAnalytics(status: VelaLoginStatus | null): Record<string, string>;
export interface RunEventForAnalyticsObservability {
    id?: number;
    event: string;
    data: unknown;
    timestamp?: number;
}
export interface RunTelemetryTimestamps {
    startRequestedAt?: number;
    startChatRunStartedAt?: number;
    promptBuildStartAt?: number;
    promptBuildEndAt?: number;
    launchPreflightStartAt?: number;
    launchPreflightEndAt?: number;
    processSpawnStartedAt?: number;
    processSpawnedAt?: number;
    cliReadyAt?: number;
    sessionInitDoneAt?: number;
    modelCallStartAt?: number;
    stdinWriteStartAt?: number;
    stdinWriteEndAt?: number;
    firstModelEventAt?: number;
    firstModelResponseAt?: number;
    firstModelEventType?: TrackingFirstModelEventType;
    firstTokenAt?: number;
    firstVisibleOutputAt?: number;
    firstArtifactWriteAt?: number;
    finalizeStartAt?: number;
    attemptIndex?: number;
    attemptStartedAt?: number;
}
export interface RunUsageAnalytics {
    input_tokens?: number;
    input_tokens_provider?: number;
    input_tokens_effective?: number;
    output_tokens?: number;
    total_tokens?: number;
    thought_tokens?: number;
    cache_read_input_tokens?: number;
    cache_creation_input_tokens?: number;
    uncached_input_tokens?: number;
    estimated_context_tokens?: number;
    cache_hit_ratio?: number;
    first_call_input_tokens?: number;
    first_call_input_tokens_effective?: number;
    first_call_cache_read_input_tokens?: number;
    first_call_cache_creation_input_tokens?: number;
    first_call_cache_hit_ratio?: number;
    cache_token_source: 'anthropic' | 'openai' | 'unavailable';
    input_accounting_mode: 'inclusive' | 'additive' | 'unknown';
    token_count_source: 'provider_usage' | 'estimated' | 'unknown';
    agent_reported_model: string | null;
}
/** Compact tool histogram for PostHog `run_finished` (no inputs/outputs). */
export interface RunToolAnalyticsSummary {
    /** Unique toolUseIds that reported isError (not duplicate result frames). */
    tool_error_count: number;
    /** Distinct canonical tool families seen (uncapped true count). */
    tool_name_count: number;
    /** Sorted unique canonical tool families (bounded allowlist). */
    tool_names: string[];
    /** Comma-separated unique canonical families for sinks that prefer a string prop. */
    tool_names_csv: string;
}
/** One model request's token usage inside a run, keyed by the provider
 *  request id (`message.id`). Surfaced from the `request_usage` events the
 *  claude-stream-json parser emits per assistant message (#4610). */
export interface PerRequestUsageRecord {
    request_id: string;
    input_tokens?: number;
    output_tokens?: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
}
/** Run-level rollup of the per-request usage records, plus the reconciliation
 *  invariant from #4610: the per-request token sum must match the aggregate
 *  `result.usage`. `reconciles_aggregate` is null when there is no aggregate
 *  usage to compare against (so callers can tell "unknown" from "mismatch"). */
export interface PerRequestUsageAnalytics {
    records: PerRequestUsageRecord[];
    request_count: number;
    input_tokens_sum?: number;
    output_tokens_sum?: number;
    cache_creation_input_tokens_sum?: number;
    cache_read_input_tokens_sum?: number;
    reconciles_aggregate: boolean | null;
}
declare const PER_REQUEST_TOKEN_KEYS: readonly ['input_tokens', 'output_tokens', 'cache_creation_input_tokens', 'cache_read_input_tokens'];
export interface PerRequestUsageLedger {
    records: PerRequestUsageRecord[];
    sums: Record<(typeof PER_REQUEST_TOKEN_KEYS)[number], number>;
    seen: Record<(typeof PER_REQUEST_TOKEN_KEYS)[number], boolean>;
    aggregateInput?: number | undefined;
    aggregateOutput?: number | undefined;
    aggregateCacheCreation?: number | undefined;
    aggregateCacheRead?: number | undefined;
    requestUsageEvents: Array<{
        requestId: string;
        usage?: Record<string, unknown> | null | undefined;
        timestamp: number;
    }>;
}
export declare function createRunPerRequestUsageLedger(): PerRequestUsageLedger;
export declare function foldEventIntoPerRequestUsageLedger(ledger: PerRequestUsageLedger, record: {
    event?: unknown;
    data?: unknown;
    timestamp?: number;
}): void;
export declare function perRequestUsageFromLedger(ledger: PerRequestUsageLedger): PerRequestUsageAnalytics;
/** Collect the per-request usage records emitted by the claude-stream-json
 *  parser and check the reconciliation invariant against the run-level
 *  aggregate (`result.usage`). Pure and order-preserving so the Langfuse
 *  per-request export and the PostHog `run_finished` coverage properties both
 *  read the same source. */
export declare function scanRunEventsForPerRequestUsageAnalytics(events: RunEventForAnalyticsObservability[]): PerRequestUsageAnalytics;
/** Read a run's per-request usage analytics, preferring the truncation-proof
 *  ledger populated as events arrive and falling back to scanning run.events
 *  for direct callers / tests. */
export declare function perRequestUsageForRun(run: {
    perRequestUsageLedger?: PerRequestUsageLedger | null;
    events?: RunEventForAnalyticsObservability[] | unknown;
}): PerRequestUsageAnalytics;
export interface RunTimingAnalytics {
    queue_duration_ms?: number;
    pre_spawn_duration_ms?: number;
    prompt_build_duration_ms?: number;
    launch_preflight_duration_ms?: number;
    process_spawn_duration_ms?: number;
    stdin_write_duration_ms?: number;
    time_to_first_model_event_ms?: number;
    first_model_event_type?: TrackingFirstModelEventType;
    time_to_first_token_ms?: number;
    time_to_first_visible_output_ms?: number;
    runtime_init_to_first_token_ms?: number;
    runtime_init_to_first_model_response_ms?: number;
    spawn_to_first_token_ms?: number;
    time_to_first_artifact_ms?: number;
    cli_ready_ms?: number;
    session_init_ms?: number;
    model_first_token_ms?: number;
    spawn_to_first_token_remainder_ms?: number;
    generation_duration_ms?: number;
    model_active_duration_ms?: number;
    tool_call_count: number;
    tool_duration_ms?: number;
    artifact_write_duration_ms?: number;
    artifact_write_status?: TrackingArtifactWriteStatus;
    artifact_write_source?: TrackingArtifactWriteSource;
    finalize_duration_ms?: number;
    total_duration_ms: number;
    bottleneck_phase?: TrackingRunLifecyclePhase;
    phase_schema_version?: number;
    last_observed_phase?: TrackingRunLifecyclePhase;
    phase_timing_status?: TrackingRunPhaseTimingStatus;
    attempt_index?: number;
    attempt_duration_ms?: number;
    attempt_time_to_first_token_ms?: number;
    attempt_terminal_phase?: TrackingRunLifecyclePhase;
}
export declare function hasExplicitRequestedModelForAnalytics(value: unknown): value is string;
export declare function inputAccountingModeForUsage(inputTokens: number | undefined, cacheReadInputTokens: number | undefined, cacheTokenSource: RunUsageAnalytics['cache_token_source']): RunUsageAnalytics['input_accounting_mode'];
export declare function scanRunEventsForUsageAnalytics(events: RunEventForAnalyticsObservability[], reqBodyModel: unknown, userQueryTokens: number): RunUsageAnalytics;
/**
 * Canonical tool families shipped to PostHog. Raw ACP/CLI tool names are
 * never forwarded — only this small allowlist (plus `other`).
 */
declare const TOOL_ANALYTICS_FAMILIES: readonly ['Write', 'Edit', 'Read', 'Bash', 'Grep', 'Search', 'Fetch', 'Think', 'Tool', 'other'];
type ToolAnalyticsFamily = (typeof TOOL_ANALYTICS_FAMILIES)[number];
/**
 * Map an arbitrary tool name to a PostHog-safe canonical family.
 * Never returns paths, URLs, or free-text titles.
 */
export declare function canonicalizeToolAnalyticsName(raw: string | undefined): ToolAnalyticsFamily;
/**
 * Cheap tool family histogram + error counts from tool_use/tool_result events.
 * Canonicalizes names to a small allowlist; never includes inputs/outputs
 * (PostHog payload safety). tool_error_count is unique failed toolUseIds.
 */
export declare function summarizeToolAnalytics(events: RunEventForAnalyticsObservability[]): RunToolAnalyticsSummary;
/**
 * When the model started responding, for phase-boundary purposes.
 *
 * Exported because two sinks report this window -- PostHog via
 * `model_active_duration_ms` and the Langfuse phase diagnostics -- and they are
 * only comparable if they anchor identically. Re-listing the marks at each call
 * site is what let them drift apart before.
 *
 * Earliest of the three rather than a preference order: `firstModelResponseAt`
 * carries a producer-supplied start (ACP emits its canonical `tool_use` when the
 * call is terminal, so arrival is the tool's END), `firstModelEventAt` is our
 * own arrival mark, and `firstTokenAt` covers producers that report neither. A
 * mark later than another is a producer artefact, never a later start.
 */
export declare function phaseAnchorFromMarks(marks: {
    firstModelResponseAt?: number;
    firstModelEventAt?: number;
    firstTokenAt?: number;
}): number | undefined;
export declare function summarizeRunTimingAnalytics(args: {
    runCreatedAt: number;
    runUpdatedAt: number;
    analyticsCapturedAt: number;
    telemetry?: RunTelemetryTimestamps | null;
    events: RunEventForAnalyticsObservability[];
}): RunTimingAnalytics;
export {};
