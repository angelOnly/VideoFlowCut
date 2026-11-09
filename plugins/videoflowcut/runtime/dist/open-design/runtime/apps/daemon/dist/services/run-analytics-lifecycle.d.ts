import type { AnalyticsCaptureResult, AnalyticsContext } from '../analytics.js';
import { getProject } from '../db.js';
import type { AppliedPluginSnapshot } from '@open-design/contracts';
import type { OdNextRolloutDecision } from '../strategies/od-next/rollout.js';
import { type ChatRun, type JsonRecord, type RunArtifactBaselines, type RunCreatedFallbackInput, type RunProjectKindInput, type RunRetryAnalyticsEvent, type TerminalRunStatus } from '../runtimes/chat-run-records.js';
/**
 * The lineage hints a daemon-created Run inherits from the Run that caused it.
 *
 * A logical task can span several physical Runs (request -> contract_repair ->
 * production). Without this, every Run falls back to its own id and lands in
 * the warehouse as an unrelated one-Run task: the chain cannot be reassembled
 * and per-stage rates cannot be compared.
 *
 * Resolved from the source Run's request facts, NOT from the recovery record
 * its own `run_created` wrote. The lifecycle re-reads host facts before it
 * captures, so a short Run can hand off to its continuation before that record
 * exists; inheriting from it would silently start a second task. The fallback
 * chain below is the same one `install` applies to the source Run, so both
 * resolve to the same id whether or not the record has landed yet.
 */
export declare function inheritedRunLineageHints(sourceRun: {
    id: string;
    clientRequestId?: string | null;
}, sourceBody: {
    analyticsHints?: unknown;
} | null | undefined, taskRunIndex: number): {
    taskExecutionId: string;
    initialRunId: string;
    taskRunIndex: number;
    sourceRunId: string;
};
/**
 * What the lifecycle reads from the daemon. `telemetry` is the same group the
 * run routes already own — it exists only to serve these two events.
 */
export interface RunAnalyticsLifecycleDeps {
    db: Parameters<typeof getProject>[0];
    design: {
        runs: {
            wait(run: ChatRun): Promise<TerminalRunStatus>;
            setAnalyticsRecovery?(run: ChatRun, recovery: {
                context: AnalyticsContext;
                properties: Record<string, unknown>;
                insertId: string;
            }): void;
            markAnalyticsCompleted?(run: ChatRun): void;
            beginAnalyticsDelivery?(run: ChatRun): void;
            finalizeAnalyticsDelivery?(run: ChatRun, result: AnalyticsCaptureResult): void;
            setDeliverableValidation?(run: ChatRun, result: unknown): void;
        };
        analytics: {
            capture(args: {
                eventName: string;
                context: AnalyticsContext;
                appVersion: string;
                properties: Record<string, unknown>;
                insertId: string;
            }): unknown | Promise<unknown>;
        };
        getAppVersion(): string;
    };
    paths: {
        PROJECTS_DIR: string;
        RUNTIME_DATA_DIR: string;
    };
    agents: {
        detectAgents: (agentCliEnv?: Record<string, unknown>) => Promise<Array<{
            id: string;
            available: boolean;
        }>>;
    };
    telemetry: RunAnalyticsTelemetryDeps;
}
export interface RunAnalyticsTelemetryDeps {
    reportRunCompletionTelemetryFallback: (input: RunCreatedFallbackInput) => void;
    resolveRunProjectKindForAnalytics: (input: RunProjectKindInput) => string | null;
    runArtifactBaselines: RunArtifactBaselines;
    runRetryEventsForAnalytics: (events: ChatRun['events']) => RunRetryAnalyticsEvent[];
}
/**
 * Everything about one physical Run that is not readable off the Run itself.
 *
 * A daemon-started Run supplies the same facts its HTTP sibling would: the
 * request body it was composed from, and the analytics identity it inherits
 * from the Run that caused it. `analyticsContext` resolution stays first-write
 * immutable — a continuation cannot relabel the identity of the task it
 * continues.
 */
export interface RunAnalyticsFacts {
    body: JsonRecord;
    /**
     * Identity of the caller that asked for this Run. Required, and `null` is a
     * real answer: a Run nothing asked for (a scheduled Automation, a background
     * refresh) has no caller to attribute to, and the lifecycle then stays silent
     * rather than inventing one. Making it optional would let a caller drop its
     * identity by forgetting a key, which is the shape of the bug this whole
     * seam exists to prevent.
     */
    requestAnalyticsContext: AnalyticsContext | null;
    /**
     * The resolved plugin snapshot, when the caller had one. Declared as the
     * narrow shape this module actually reads rather than the resolver's full
     * union, so a caller that only holds the successful resolution can hand it
     * over without a cast.
     */
    snapshot?: {
        ok: boolean;
        snapshot: AppliedPluginSnapshot;
    } | null;
    /**
     * The rollout decision the caller evaluated for this Run. Defaults to the
     * one stamped on the Run, which is what `run_finished` and the crash-recovery
     * replay both read.
     */
    rolloutDecision?: OdNextRolloutDecision | null;
    creationKind?: 'created' | 'reused';
    resumed?: boolean;
    attributionMismatch?: boolean;
}
/** The facts plus the Run they describe. */
export type RunAnalyticsInstallInput = RunAnalyticsFacts & {
    run: ChatRun;
};
export interface RunAnalyticsLifecycle {
    /**
     * Arm both events for one physical Run. Safe to call before the Run starts;
     * the terminal half attaches to `runs.wait` and settles on its own.
     */
    install(input: RunAnalyticsInstallInput): void;
}
export declare function createRunAnalyticsLifecycle(deps: RunAnalyticsLifecycleDeps): RunAnalyticsLifecycle;
