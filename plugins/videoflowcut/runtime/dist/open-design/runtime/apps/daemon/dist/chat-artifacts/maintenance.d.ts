import type Database from 'better-sqlite3';
import type { ChatArtifactBlobStore } from './blob-store.js';
import { type ChatArtifactGcReport } from './gc.js';
import { type ChatArtifactReconcileReport } from './reconcile.js';
import type { ChatArtifactQuota } from './quota.js';
export interface ChatArtifactMaintenanceDeps {
    db: Database.Database;
    blobs: ChatArtifactBlobStore;
    quota?: ChatArtifactQuota;
    /** See `ChatArtifactReconcileDeps.resolveSourcePath`. */
    resolveSourcePath?: (projectId: string, projectRelativePath: string) => string | null;
    /** Report the sweep without deleting. Mirrors the boot behaviour. */
    gcDryRun?: boolean;
}
export interface ChatArtifactMaintenancePass {
    reconcile: ChatArtifactReconcileReport;
    gc: ChatArtifactGcReport;
}
/**
 * Reconcile first, then sweep — never the other way round.
 *
 * The sweep treats a `pending` row as live, because its bytes may be
 * mid-install. Running it before the reconciler has classified those rows means
 * every crashed capture is protected by exactly the state that should have
 * condemned it, so its temp and its blob survive one more full cycle. Running
 * it after means the reconciler has already turned each one into a `ready` the
 * sweep must keep or a `failed` the sweep may collect, and one pass finishes
 * the job.
 */
export declare function runChatArtifactMaintenancePass(deps: ChatArtifactMaintenanceDeps): Promise<ChatArtifactMaintenancePass>;
export interface ChatArtifactMaintenanceOptions extends ChatArtifactMaintenanceDeps {
    /**
     * Tick period. `0` or anything non-finite disables the loop entirely and the
     * daemon keeps today's boot-only behaviour.
     *
     * OPEN DECISION: `specs/current/chat-artifact-versioning-design.md` §5.3 and
     * §7.2 both ask for a periodic pass and neither names a period. Until that is
     * ruled on, the default is off and the only way to turn it on is explicit —
     * see `resolveChatArtifactMaintenanceIntervalMs`.
     */
    intervalMs: number;
    /** Run one pass immediately, as boot does today. Default true. */
    runImmediately?: boolean;
    logger?: (message: string) => void;
    /** Fired after every completed pass. Tests synchronize on this. */
    onPass?: (pass: ChatArtifactMaintenancePass) => void;
}
export interface ChatArtifactMaintenanceHandle {
    /** True while the loop is armed. */
    readonly enabled: boolean;
    /** Ticks dropped because the previous pass had not finished. */
    readonly overlappedTicks: number;
    /**
     * Disarm and drain. Resolves only once any in-flight pass has finished, so a
     * caller that closes the database next cannot pull it out from under a query.
     * The timer itself is cleared synchronously, before the returned promise.
     */
    stop(): Promise<void>;
}
/**
 * The env knob, and the reason there is no default period.
 *
 * A maintenance cadence is an operations decision with a real cost on both
 * sides — too slow leaves stuck cards and dead bytes around for hours, too fast
 * walks the whole blob directory on someone's laptop — and the design document
 * does not name one. Inventing a number here would look exactly like a decision
 * that had been made. `0` (the default) keeps the daemon on its current
 * boot-only behaviour.
 *
 * Nearest in-repo precedent, offered as a starting point and not as an answer:
 * `OD_SNAPSHOT_GC_INTERVAL_MS` in `app-config.ts` defaults to 6 hours for the
 * plugin snapshot GC, which is the same shape of job over the same shape of
 * store.
 */
export declare function resolveChatArtifactMaintenanceIntervalMs(env: NodeJS.ProcessEnv): number;
export declare function startChatArtifactMaintenance(options: ChatArtifactMaintenanceOptions): ChatArtifactMaintenanceHandle;
