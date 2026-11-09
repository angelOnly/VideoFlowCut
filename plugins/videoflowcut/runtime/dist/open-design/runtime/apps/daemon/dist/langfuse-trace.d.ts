import type { EvalContextV2 } from './observability/eval-context.js';
import { type SafeDeliverableSyntaxTelemetryV1, type SafeRunQualityV1 } from '@open-design/contracts';
import type { TelemetryPrefs } from './app-config.js';
import { type RunObservationExporter } from './observability/run-exporter.js';
import { type PromptStackTelemetry } from './prompt-telemetry.js';
import { type RunDiagnosticsAnalytics, type StreamTailSummary } from './run-diagnostics.js';
import { type RunTelemetryTimestamps, type RunTimingAnalytics } from './run-analytics-observability.js';
import type { RunFailureClassification } from './run-failure-classification.js';
export declare const INPUT_MAX_BYTES: number;
export declare const HARD_BATCH_MAX_BYTES: number;
export interface LangfuseConfig {
    authHeader: string;
    baseUrl: string;
    timeoutMs: number;
    retries: number;
}
export type LangfuseDeliveryStatus = 'not_expected' | 'queued' | 'accepted' | 'failed';
export type LangfuseDropReason = 'metrics_consent_off' | 'content_consent_off' | 'missing_sink_config' | 'payload_too_large' | 'payload_build_error' | 'export_mapping_mismatch' | 'task_hierarchy_rollout' | 'relay_429' | 'relay_413' | 'relay_5xx' | 'langfuse_4xx' | 'langfuse_5xx' | 'vela_400' | 'vela_401' | 'vela_403' | 'vela_413' | 'vela_429' | 'vela_5xx' | 'network_error';
export interface LangfuseDeliveryState {
    langfuse_expected: boolean;
    langfuse_delivery_status: LangfuseDeliveryStatus;
    langfuse_drop_reason?: LangfuseDropReason;
    /** Actual transport requests made by this exporter invocation. */
    langfuse_attempt_count?: number;
    /** Stable, non-secret identity supplied by the daemon delivery owner. */
    langfuse_idempotency_key?: string;
    /** Identity actually accepted by the selected transport, never guessed from config. */
    traceReceipt?: {
        traceId: string;
        transport: 'vela' | 'relay' | 'langfuse';
    };
}
export type TelemetrySinkConfig = {
    kind: 'relay';
    relayUrl: string;
    timeoutMs: number;
    retries: number;
} | ({
    kind: 'langfuse';
} & LangfuseConfig);
export interface VelaTelemetrySinkConfig {
    kind: 'vela';
    apiUrl: string;
    controlKey: string;
    timeoutMs: number;
    retries: number;
}
export type RunTelemetrySinkConfig = TelemetrySinkConfig | VelaTelemetrySinkConfig;
export interface RunSummary {
    runId: string;
    status: 'succeeded' | 'failed' | 'canceled';
    startedAt: number;
    endedAt: number;
    error?: string;
    errorCode?: string;
    failure?: RunFailureClassification;
    timings?: RunTimingAnalytics;
    timingMarks?: RunTelemetryTimestamps;
    stderr?: {
        tail: string;
        lineCount: number;
        truncated: boolean;
    };
    stdout?: {
        tail: string;
        lineCount: number;
        truncated: boolean;
    };
    diagnostics?: unknown;
    retryAttemptCount?: number;
    retryFinalResult?: string;
    retrySuppressedReason?: string;
    retryOriginalFailure?: RunFailureClassification;
}
export interface MessageSummary {
    messageId: string;
    prompt: string;
    output: string;
    usage?: {
        inputTokens?: number;
        inputTokensProvider?: number;
        inputTokensEffective?: number;
        outputTokens?: number;
        totalTokens?: number;
        thoughtTokens?: number;
        cacheReadInputTokens?: number;
        cacheCreationInputTokens?: number;
        uncachedInputTokens?: number;
        estimatedContextTokens?: number;
        cacheHitRatio?: number;
        cacheTokenSource?: 'anthropic' | 'openai' | 'unavailable';
    };
}
export interface ArtifactSummary {
    slug: string;
    type: string;
    sizeBytes: number;
    sha256?: string;
    createdAt?: string;
}
export type ObjectManifestCompleteness = 'complete' | 'partial' | 'unavailable';
export type ObjectManifestStatus = 'ok' | 'partial' | 'unavailable';
export type ObjectManifestSensitivity = 'public' | 'internal' | 'private' | 'sensitive';
export type ObjectManifestAccessScope = 'owner' | 'project' | 'workspace' | 'evaluator';
export type ObjectManifestRetentionPolicy = 'ephemeral' | 'observability_90d' | 'project_lifetime' | 'eval_fixture' | 'legal_hold';
export interface TraceSafeObjectManifestBase {
    object_class: 'attachment' | 'artifact' | 'input_text_snapshot';
    storage_ref: string;
    status: ObjectManifestStatus;
    reason?: string;
    project_id: string | null;
    run_id: string;
    workspace_id: string | null;
    size_bytes?: number;
    sha256?: string;
    mime_type?: string;
    extension?: string;
    redacted: boolean;
    truncated: boolean;
    stored_in_open_design: boolean;
    retention_policy: ObjectManifestRetentionPolicy;
    access_scope: ObjectManifestAccessScope;
    sensitivity: ObjectManifestSensitivity;
    source: 'user_upload' | 'agent_generated' | 'user_prompt';
    expires_at: string | null;
    approved_by: string | null;
    open_in_open_design_url?: null;
    preview_status?: string;
    access_policy?: 'open_design_auth_required';
}
export interface AttachmentManifestEntry extends TraceSafeObjectManifestBase {
    source_path_hash?: string;
    object_class: 'attachment';
    attachment_id: string;
}
export interface ArtifactManifestEntry extends TraceSafeObjectManifestBase {
    object_class: 'artifact';
    artifact_id: string;
    type: string;
    artifact_kind?: string;
    build_status?: string;
    preview_status?: string;
    export_status?: string;
}
export interface InputTextSnapshotManifestEntry extends TraceSafeObjectManifestBase {
    object_class: 'input_text_snapshot';
    input_text_snapshot_id: string;
    type: 'text';
}
export interface TraceObjectSummary {
    new_file_count: number;
    modified_file_count: number;
    recovered_file_count: number;
    candidate_file_count: number;
    uploaded_file_count: number;
    skipped_file_count: number;
    skip_reasons: Record<string, number>;
}
export interface ToolCallSummary {
    id: string;
    name: string;
    startedAt: number;
    endedAt: number;
    input?: string;
    output?: string;
    isError?: boolean;
}
export interface AgentEventSummary {
    id: string;
    name: string;
    timestamp: number;
    input?: Record<string, unknown>;
    output?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    level?: 'DEFAULT' | 'WARNING' | 'ERROR';
    statusMessage?: string;
}
export interface EventsSummary {
    toolCalls: number;
    errors: number;
    durationMs: number;
}
export type DeliverableSyntaxTelemetry = SafeDeliverableSyntaxTelemetryV1;
export interface RuntimeInfo {
    /** Node.js runtime version (`process.version`, e.g. 'v22.22.0'). */
    nodeVersion?: string;
    /** OS family (`os.platform()`, e.g. 'darwin' | 'win32' | 'linux'). */
    os?: string;
    /** OS kernel/release version (`os.release()`). */
    osRelease?: string;
    /** CPU architecture (`os.arch()`, e.g. 'arm64' | 'x64'). */
    arch?: string;
    /** OpenDesign app version reported by the daemon. */
    appVersion?: string;
    /** Build channel (development / prerelease / beta / stable). */
    appChannel?: string;
    /** Whether the daemon is running inside a packaged build. */
    packaged?: boolean;
    /** Front-end carrier — `desktop` (Electron), `web` (browser), or unknown. */
    clientType?: 'desktop' | 'web' | 'unknown';
    /** Exact CLI version observed by the daemon's bounded detection probe. */
    agentCliVersion?: string;
    /** Optional companion runtime used behind the selected CLI (AMR → OpenCode). */
    runtimeCompanionName?: string;
    runtimeCompanionVersion?: string;
}
export interface TurnInfo {
    /** Model id at the time of this turn (e.g. 'claude-sonnet-4-5'). */
    model?: string;
    /** Reasoning level / effort knob if the agent supports it. */
    reasoning?: string;
    /** Skill id selected for this turn (if any). */
    skillId?: string;
    /** Design system id selected for this turn (if any). */
    designSystemId?: string;
    /** sha256 digest of the injected design-system prompt context. */
    designSystemDigest?: string;
    /** Source that supplied the effective design-system selection. */
    designSystemSelectionSource?: string;
    /** Resume-session stable prompt cache diagnostics. */
    promptCache?: {
        stablePromptHash: string;
        hit: boolean;
        missReason: string | null;
        changedSections?: string[] | null;
    };
}
export interface ReportContext {
    evalContextV2?: EvalContextV2;
    installationId: string | null;
    projectId: string;
    conversationId: string;
    agentId?: string;
    run: RunSummary;
    message: MessageSummary;
    artifacts: ArtifactSummary[];
    attachmentManifest?: AttachmentManifestEntry[];
    artifactManifest?: ArtifactManifestEntry[];
    inputTextSnapshotManifest?: InputTextSnapshotManifestEntry[];
    manifestCompleteness?: ObjectManifestCompleteness;
    traceObjectSummary?: TraceObjectSummary;
    tools?: ToolCallSummary[];
    agentEvents?: AgentEventSummary[];
    eventsSummary: EventsSummary;
    /** Content-free syntax gate facts safe for shallow Langfuse filtering. */
    deliverableSyntax?: DeliverableSyntaxTelemetry;
    prefs: TelemetryPrefs;
    langfuse?: LangfuseDeliveryState;
    /** Per-turn config (model + skill + DS). May vary turn-to-turn within a session. */
    turn?: TurnInfo;
    /** Process- / build-level info collected once per daemon process. */
    runtime?: RuntimeInfo;
    /** Redacted section-level prompt diagnostics captured before agent spawn. */
    promptTelemetry?: PromptStackTelemetry;
    /** Bounded, content-free discovery evidence from actual runtime events. */
    skillDiscovery?: Record<string, unknown>;
    strategyRolloutDecision?: {
        requestedMode: string;
        effectiveMode: string;
        primaryReasonCode: string;
        syntheticCanary?: boolean;
        reasonCodes?: readonly string[];
    };
    extraTags?: string[];
}
export interface ReportRunOpts {
    config?: RunTelemetrySinkConfig | LangfuseConfig | null;
    fetchImpl?: typeof fetch;
    /** App-config AMR env used only when resolving the completed-run Vela sink. */
    configuredEnv?: Record<string, string>;
    /** Emit only the content-free object-authority trace projection. */
    deliveryPurpose?: 'final' | 'object-registration';
    /** Stable identity persisted before crossing the final delivery boundary. */
    deliveryIdempotencyKey?: string;
    /** Persists each concrete transport request before fetch is invoked. */
    onDeliveryAttempt?: () => void;
}
export interface ReportFeedbackOpts {
    config?: RunTelemetrySinkConfig | LangfuseConfig | null;
    fetchImpl?: typeof fetch;
    configuredEnv?: Record<string, string>;
}
/**
 * Payload sent to Langfuse when a user thumbs-up/down's an assistant turn.
 *
 * The `runId` doubles as the Langfuse trace id (same convention used by
 * buildTracePayload), so the score lands on the existing trace if the run
 * was previously reported. If the run wasn't reported (e.g. content
 * consent was off at run completion, then turned on before the user
 * scored), Langfuse will accept the score anyway and the trace will
 * materialize when/if the daemon backfills it.
 */
export interface FeedbackReportContext {
    runId: string;
    /** Server-resolved Task identity; score IDs remain owned by the physical Run. */
    traceId?: string;
    installationId: string | null;
    prefs: TelemetryPrefs;
    rating: 'positive' | 'negative';
    reasonCodes: string[];
    /** Raw "other" free text the user typed. Trimmed; empty string when absent. */
    customReason: string;
    hasCustomReason: boolean;
    /** Optional context bag that ends up in Langfuse score metadata. */
    metadata?: Record<string, unknown>;
}
export declare function readLangfuseConfig(env?: NodeJS.ProcessEnv): LangfuseConfig | null;
/**
 * Resolve telemetry delivery in release-safe order: hosted relay first,
 * direct Langfuse credentials second for local smoke tests, disabled last.
 */
export declare function readTelemetrySinkConfig(env?: NodeJS.ProcessEnv): TelemetrySinkConfig | null;
/**
 * Task hierarchies use the same authenticated identity as completed runs.
 * Older Vela servers may reject the versioned schema; delivery handles that
 * explicit compatibility rejection without changing the execution strategy.
 */
export declare function readTaskTelemetrySinkConfig(env?: NodeJS.ProcessEnv, configuredEnv?: Record<string, string>): RunTelemetrySinkConfig | null;
/**
 * Completed-run and feedback telemetry share the same sink selection: Vela when
 * a Control Key is present, otherwise the anonymous relay / direct Langfuse.
 * Feedback score-only batches keep the client run id as `data.traceId`; Vela
 * re-scopes it with the same account hash as the original run batch.
 */
export declare function readRunTelemetrySinkConfig(env?: NodeJS.ProcessEnv, configuredEnv?: Record<string, string>): RunTelemetrySinkConfig | null;
/**
 * Feedback uses the same sink as completed-run telemetry. Vela accepts
 * score-only batches on the same endpoint and binds them via client run id.
 */
export declare function readFeedbackTelemetrySinkConfig(env?: NodeJS.ProcessEnv, configuredEnv?: Record<string, string>): RunTelemetrySinkConfig | null;
export interface EffectiveRunTelemetrySinkDiagnostic {
    kind: RunTelemetrySinkConfig['kind'] | 'none';
    host: string | null;
    protocol: 'http' | 'https' | null;
}
/**
 * Allowlisted effective-sink identity for daemon logs and support bundles.
 * URL credentials, ports, paths, queries, fragments, headers, and keys never
 * enter the returned object.
 */
export declare function describeRunTelemetrySink(sink: RunTelemetrySinkConfig | null): EffectiveRunTelemetrySinkDiagnostic;
export declare function deriveLangfuseDeliveryState(prefs: TelemetryPrefs, sink: RunTelemetrySinkConfig | null): LangfuseDeliveryState;
/**
 * Tool names known to be content-bearing (read/write/search/think tools,
 * including ACP aliases). Used for redaction reason labels and docs.
 *
 * Full redaction policy is fail-closed via `shouldFullyRedactToolPayload`:
 * only bash-like execute tools keep secret+path lexical masking; known
 * content tools AND any unknown/custom ACP tool name (e.g. kind:other MCP
 * filesystem readers) fully redact so private file bodies cannot leak to
 * Langfuse under best-effort masking alone.
 *
 * Matching is case-insensitive. Canonical Claude-shaped names are listed
 * here; lowercase ACP kind tokens (read/write/edit/…) are covered via the
 * lowercased lookup set built below.
 */
export declare const CONTENT_TOOL_NAMES: ReadonlySet<string>;
/** True when the tool is a known content-bearing family name. */
export declare function isContentToolName(toolName: string): boolean;
/**
 * True when tool I/O may keep lexical (secret+path) redaction for telemetry.
 * Only bash-like execute tools qualify; empty/unknown/custom names do not.
 */
export declare function isPartialRedactToolName(toolName: string): boolean;
/**
 * Fail-closed telemetry gate: fully redact tool input/output unless the tool
 * is an allowlisted bash-like execute family. Unknown/custom ACP names
 * (kind:other, MCP tools, etc.) must not ship raw payloads to Langfuse.
 */
export declare function shouldFullyRedactToolPayload(toolName: string): boolean;
/**
 * Map an arbitrary tool name to a Langfuse-safe label (bounded family allowlist).
 * Custom ACP/MCP names, paths, and free text never leave the host as span names
 * or toolName metadata — even when content telemetry is off.
 */
export declare function telemetrySafeToolName(toolName: string): string;
/**
 * Builds the fixed placeholder used when tool I/O is fully redacted for
 * content telemetry. Known content families keep `content_tool` plus a
 * allowlisted family label; everything else uses `unknown_tool` without
 * embedding the untrusted custom name (paths/tokens/MCP ids must not leak).
 */
export declare function toolPayloadRedactionPlaceholder(toolName: string, direction: 'input' | 'output'): string;
/**
 * Versioned, transport-neutral projection shared by single-Run and Task
 * hierarchy producers. It accepts only facts the existing single-Run bridge
 * already collected, applies the same content/tool byte caps plus stricter
 * local-path masking, and never admits raw provider attributes.
 */
export declare function buildSafeRunQualityProjectionV1(input: {
    /** Object snapshots keep complete policy-redacted content; transport still enforces its object size cap. */
    contentStorage?: 'object';
    prefs: TelemetryPrefs;
    messageOutput?: string;
    errorMessage?: string;
    errorCode?: string;
    failure?: RunFailureClassification;
    tools?: readonly ToolCallSummary[];
    attachmentManifest?: readonly AttachmentManifestEntry[];
    artifactManifest?: readonly ArtifactManifestEntry[];
    inputTextSnapshotManifest?: readonly InputTextSnapshotManifestEntry[];
    manifestCompleteness?: ObjectManifestCompleteness;
    exitCode?: number | null;
    signal?: string | null;
    stderr?: StreamTailSummary;
    stdout?: StreamTailSummary;
    diagnostics?: RunDiagnosticsAnalytics;
    deliverableSyntax?: DeliverableSyntaxTelemetry;
}): SafeRunQualityV1 | undefined;
export declare function buildTracePayload(ctx: ReportContext, deliveryPurpose?: 'final' | 'object-registration'): unknown[];
type TransportAttemptObserver = () => void;
export declare function postLangfuseBatch(config: LangfuseConfig, batch: unknown[], fetchImpl: typeof fetch, onAttempt?: TransportAttemptObserver): Promise<LangfuseDeliveryState>;
export interface PostLegacyTelemetryBatchOptions {
    /** Updates must stay on the root trace's transport, even when auth expires. */
    allowAnonymousAuthFallback?: boolean;
    allowTaskSchemaFallback?: boolean;
    installationId?: string | null;
    fetchImpl?: typeof fetch;
    deliveryIdempotencyKey?: string;
    fallbackConfig?: TelemetrySinkConfig | null;
    maxTotalAttempts?: number;
    onAttempt?: () => void;
}
/**
 * Deliver an already-sanitized legacy ingestion batch through the same
 * effective sink priority as the single-Run compatibility exporter.
 *
 * Task-level observability owns payload assembly and durable delivery state;
 * this helper owns only the existing Vela/Relay/direct wire behavior. Keeping
 * the sink routing here prevents the rollout service from learning credentials
 * or reimplementing fallback semantics.
 */
export declare function postLegacyTelemetryBatch(config: RunTelemetrySinkConfig, batch: unknown[], options?: PostLegacyTelemetryBatchOptions): Promise<LangfuseDeliveryState>;
/**
 * Compatibility exporter for the current single-Run legacy ingestion shape.
 * All provider event assembly and transport remain owned by this adapter;
 * callers enter through the protocol-neutral exporter seam above.
 */
export declare const legacyLangfuseRunExporter: RunObservationExporter<ReportContext, ReportRunOpts, LangfuseDeliveryState>;
export declare function reportRunCompleted(ctx: ReportContext, opts?: ReportRunOpts): Promise<LangfuseDeliveryState>;
export declare function buildFeedbackPayload(ctx: FeedbackReportContext): unknown[];
export declare function reportRunFeedback(ctx: FeedbackReportContext, opts?: ReportFeedbackOpts): Promise<void>;
export {};
