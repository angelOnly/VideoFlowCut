import { buildEvalContext } from './observability/eval-context.js';
import { type TrackingRunCancelOrigin, type TrackingRunTerminalTrigger } from '@open-design/contracts/analytics';
import { type DeliverableSyntaxRepairState, type DeliverableSyntaxValidationEvidence, type OdNextRolloutDecision, type SafeRunQualityV1 } from '@open-design/contracts';
import { type TelemetryPrefs } from './app-config.js';
import type { AppVersionInfo } from './app-version.js';
import { type DeliverableSyntaxTelemetry, type LangfuseDeliveryState, type ReportContext } from './langfuse-trace.js';
import { type PromptStackTelemetry } from './prompt-telemetry.js';
import { type RunTelemetryTimestamps } from './run-analytics-observability.js';
import { type RunDiagnosticsAnalytics } from './run-diagnostics.js';
import { type RunFailureClassification } from './run-failure-classification.js';
import type { PerRequestUsageLedger } from './run-analytics-observability.js';
export interface DaemonRunRecord {
    id: string;
    projectId: string | null;
    conversationId: string | null;
    assistantMessageId: string | null;
    agentId: string | null;
    status: string;
    exitCode?: number | null;
    signal?: string | null;
    error?: string | null;
    errorCode?: string | null;
    cancelOrigin?: TrackingRunCancelOrigin | null;
    terminalTrigger?: TrackingRunTerminalTrigger | null;
    analyticsTelemetry?: RunTelemetryTimestamps | null;
    createdAt: number;
    updatedAt: number;
    events: Array<{
        id: number;
        event: string;
        data: unknown;
        timestamp?: number;
    }>;
    userPrompt?: string;
    model?: string;
    resolvedModelId?: string | null;
    preflightAgentCliVersion?: string | null;
    reasoning?: string;
    skillId?: string;
    designSystemId?: string;
    designSystemDigest?: string;
    designSystemSelectionSource?: string;
    promptCache?: {
        stablePromptHash: string;
        hit: boolean;
        missReason: string | null;
        changedSections?: string[] | null;
    };
    clientType?: 'desktop' | 'web' | 'unknown';
    promptTelemetry?: PromptStackTelemetry;
    projectAttachmentPaths?: string[];
    projectMetadata?: Record<string, unknown> | null;
    retryAttemptCount?: number;
    retryFinalResult?: string;
    retrySuppressedReason?: string;
    retryOriginalFailure?: RunFailureClassification;
    promptBudgetDiagnostics?: Partial<RunDiagnosticsAnalytics> | null;
    perRequestUsageLedger?: PerRequestUsageLedger | null;
    strategyRolloutDecision?: OdNextRolloutDecision | null;
    deliverableSyntaxRepair?: DeliverableSyntaxRepairState;
    deliverableSyntaxValidation?: DeliverableSyntaxValidationEvidence;
}
export interface BuildSafeRunQualityProjectionFromDaemonOpts {
    exactPrompt?: {
        text: string;
        stage: string;
        sha256: string;
        utf8Bytes: number;
    };
    captureObjects?: boolean;
    onTraceProjection?: (projection: {
        input?: unknown;
        output?: unknown;
        metadata: Record<string, unknown>;
    }) => void;
    db: unknown;
    dataDir: string;
    run: SafeRunQualityDaemonRunRecord;
    prefs: TelemetryPrefs;
    installationId?: string | null;
    env?: NodeJS.ProcessEnv;
    fetchImpl?: typeof fetch;
    taskTraceId?: string;
    onEvaluationContext?: (context: ReturnType<typeof buildEvalContext>) => void;
}
/** Minimal durable Run surface required to rebuild the Task-safe projection. */
export interface SafeRunQualityDaemonRunRecord extends Pick<DaemonRunRecord, 'model' | 'resolvedModelId' | 'reasoning' | 'skillId' | 'designSystemId' | 'designSystemDigest' | 'designSystemSelectionSource' | 'promptCache' | 'clientType' | 'preflightAgentCliVersion' | 'strategyRolloutDecision' | 'retryAttemptCount' | 'retryFinalResult' | 'retrySuppressedReason' | 'retryOriginalFailure'> {
    id: string;
    projectId: string | null;
    conversationId: string | null;
    assistantMessageId: string | null;
    agentId: string | null;
    status: string;
    createdAt: number;
    updatedAt: number;
    events: DaemonRunRecord['events'];
    exitCode?: number | null | undefined;
    signal?: string | null | undefined;
    error?: string | null | undefined;
    errorCode?: string | null | undefined;
    cancelOrigin?: TrackingRunCancelOrigin | null | undefined;
    terminalTrigger?: TrackingRunTerminalTrigger | null | undefined;
    analyticsTelemetry?: RunTelemetryTimestamps | null | undefined;
    promptBudgetDiagnostics?: Partial<RunDiagnosticsAnalytics> | null | undefined;
    perRequestUsageLedger?: PerRequestUsageLedger | null | undefined;
    userPrompt?: string | undefined;
    promptTelemetry?: ReportContext['promptTelemetry'];
    projectAttachmentPaths?: string[] | undefined;
    artifactPaths?: string[];
    odNextTaskInputSnapshot?: import('./strategies/od-next/task-input-snapshot.js').OdNextTaskInputSnapshotDescriptor;
    projectMetadata?: Record<string, unknown> | null | undefined;
    deliverableSyntaxRepair?: DeliverableSyntaxRepairState;
    deliverableSyntaxValidation?: DeliverableSyntaxValidationEvidence;
}
export interface ReportRunCompletedFromDaemonOpts {
    db: unknown;
    dataDir: string;
    run: DaemonRunRecord;
    persistedRunStatus?: string;
    persistedEndedAt?: number;
    /** App version info — collected once at daemon startup and reused. */
    appVersion?: AppVersionInfo | null;
    /** Exact identity persisted by the caller before crossing the network. */
    deliveryIdempotencyKey?: string;
    /** Persists each concrete transport attempt before fetch. */
    onDeliveryAttempt?: () => void;
    fetchImpl?: typeof fetch;
}
/** Build the one safe syntax fact-sheet shared by evaluation and production telemetry. */
export declare function projectDeliverableSyntaxTelemetry(run: Pick<DaemonRunRecord, 'deliverableSyntaxRepair' | 'deliverableSyntaxValidation'> & Partial<Pick<DaemonRunRecord, 'status'>>): DeliverableSyntaxTelemetry | undefined;
/**
 * Rebuild the quality facts used by Task hierarchy from the same durable
 * message/Run/manifest sources as ordinary single-Run reporting. The object
 * manifest pass is registration-only: it may inspect local metadata but never
 * uploads an object or emits a second trace.
 */
export declare function buildSafeRunQualityProjectionFromDaemon(opts: BuildSafeRunQualityProjectionFromDaemonOpts): Promise<SafeRunQualityV1 | undefined>;
export declare function reportRunCompletedFromDaemon(opts: ReportRunCompletedFromDaemonOpts): Promise<LangfuseDeliveryState>;
export interface ReportRunFeedbackFromDaemonOpts {
    dataDir: string;
    runId: string;
    traceId?: string;
    rating: 'positive' | 'negative';
    reasonCodes: string[];
    hasCustomReason: boolean;
    /** Raw "other" free text. Empty when no custom reason. */
    customReason: string;
    /** Extra context for Langfuse score metadata (projectId / conversationId / assistantMessageId). */
    scoreMetadata?: Record<string, unknown>;
    fetchImpl?: typeof fetch;
}
/**
 * Result for the POST /api/runs/:id/feedback handler. Telemetry is
 * best-effort and the network call runs after the response is sent, but
 * the handler still tells the caller whether the report was at least
 * enqueued — useful for QA and e2e.
 */
export type FeedbackReportOutcome = {
    status: 'accepted';
    deliveryStatus?: 'queued' | 'unavailable';
    reason?: string;
} | {
    status: 'skipped_consent';
} | {
    status: 'skipped_no_sink';
};
export declare function reportRunFeedbackFromDaemon(opts: ReportRunFeedbackFromDaemonOpts): Promise<FeedbackReportOutcome>;
