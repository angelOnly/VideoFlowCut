/**
 * Daemon-internal seam for preparing and starting one physical chat Run.
 *
 * HTTP routes remain responsible for parsing, authorization, snapshot
 * resolution, response formatting, and lifecycle observers. Callers hand this
 * service the already-resolved run identity/prompt/session inputs so a future
 * coordinator can reuse the same create -> claim -> start transaction without
 * calling the daemon through HTTP.
 */
import type { RunAnalyticsFacts } from './run-analytics-lifecycle.js';
/**
 * `RunAnalyticsFacts` is a REQUIRED argument of `start` on purpose. Analytics
 * used to be installed by whichever caller remembered to do it, and four
 * daemon-internal Run creators silently reported nothing (OPEND-2365). Making
 * the facts part of the start contract means a new caller has to state its
 * analytics identity — including stating that it has none — instead of dropping
 * the Run. The type is owned by the lifecycle so the choke point and the
 * lifecycle cannot drift apart.
 */
export interface InternalRunCreateInput extends Record<string, unknown> {
    /** Daemon-owned nonce shared by this run's keyed host protocol markers. */
    doneKey?: string;
    projectId?: string;
    conversationId?: string;
    userMessageId?: string;
    assistantMessageId?: string;
    clientRequestId?: string;
    requestFingerprint?: string;
    agentId?: string;
    pluginId?: string;
    appliedPluginSnapshotId?: string;
    message?: string;
    currentPrompt?: string;
    sessionMode?: string;
    analyticsHints?: Record<string, unknown>;
    /** Daemon-owned immutable OD Next task input descriptor; never accepted from callers. */
    odNextTaskInputSnapshot?: {
        taskExecutionId: string;
        snapshotDir: string;
        manifestSha256: string;
    } | null;
}
export interface InternalPhysicalRun {
    id: string;
    status: string;
    cancelRequested?: boolean;
}
export interface InternalRunAnalyticsLifecycle<TRun> {
    install(input: RunAnalyticsFacts & {
        run: TRun;
    }): void;
}
export interface InternalRunRegistry<TMeta extends InternalRunCreateInput, TRun extends InternalPhysicalRun> {
    createOrReuse(meta: TMeta): {
        kind: 'created';
        run: TRun;
    } | {
        kind: 'reused';
        run: TRun;
    } | {
        kind: 'conflict';
        run: TRun;
    };
    prepareRestart(run: TRun): TRun | null;
    get(id: string): TRun | null;
    drop(run: TRun): void;
    start(run: TRun, starter: () => Promise<unknown>): TRun;
    isTerminal(status: TRun['status']): boolean;
}
export interface AssistantRunClaimOptions {
    status?: string;
    beforeClaimCommit?: () => void;
    isRunActive?: (runId: string) => boolean;
}
export type AssistantRunClaimResult = {
    ok: boolean;
    reason?: 'active' | 'scope';
};
export interface PrepareInternalRunInput<TMeta extends InternalRunCreateInput, TRun> {
    meta: TMeta;
    /**
     * Runs inside the assistant-message claim transaction. The newly allocated
     * physical Run is supplied so a logical coordinator can CAS-claim that exact
     * id before either record becomes visible.
     */
    beforeClaimCommit?: (run: TRun) => void;
    resume?: {
        requested: boolean;
        canResume: (run: TRun) => boolean;
    };
}
export type PreparedInternalRunResult<TRun> = {
    kind: 'ready';
    run: TRun;
    creationKind: 'created' | 'reused';
    resumed: boolean;
} | {
    kind: 'reused';
    run: TRun;
} | {
    kind: 'idempotency_conflict';
    run: TRun;
} | {
    kind: 'resume_not_allowed';
    run: TRun;
} | {
    kind: 'assistant_claim_conflict';
    run: TRun;
    reason?: 'active' | 'scope';
};
export interface InternalRunCreationService<TMeta extends InternalRunCreateInput, TRun extends InternalPhysicalRun> {
    prepare(input: PrepareInternalRunInput<TMeta, TRun>): PreparedInternalRunResult<TRun>;
    start(run: TRun, analytics: RunAnalyticsFacts, starter: (run: TRun) => Promise<unknown>): TRun;
}
export declare function createInternalRunCreationService<TMeta extends InternalRunCreateInput, TRun extends InternalPhysicalRun>(deps: {
    runs: InternalRunRegistry<TMeta, TRun>;
    claimAssistantMessage: (run: TRun, options?: AssistantRunClaimOptions) => AssistantRunClaimResult;
    /**
     * Armed for every physical Run this service starts, whoever asked for it.
     * Required: an optional dependency would let a future factory construct this
     * service, satisfy the `.runs.start` guard, and still emit nothing. A harness
     * that wants silence injects a no-op lifecycle and says so.
     */
    analyticsLifecycle: InternalRunAnalyticsLifecycle<TRun>;
    /** Bounded per-project admission, after Run acceptance and before cwd writes.
     * Keeps the synchronous start API and analytics lifecycle intact.
     */
    coordinateStart?: (run: TRun, starter: () => Promise<unknown>) => Promise<unknown>;
}): InternalRunCreationService<TMeta, TRun>;
