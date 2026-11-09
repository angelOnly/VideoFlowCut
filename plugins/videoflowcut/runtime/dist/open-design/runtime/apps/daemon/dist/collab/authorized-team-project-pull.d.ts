import type { TeamMirrorPullScope } from '../routes/collab-sync.js';
export declare function isAuthorizedTeamProjectPullReceiptExpired(error: unknown): boolean;
export interface AuthorizedTeamProjectPullReceipt {
    schemaVersion: 1;
    workspaceId: string;
    resourceTeamId: string;
    viewerMemberId: string;
    ownerMemberId: string;
    projectId: string;
    resourceId: string;
    ref: 'published';
    version: number;
    versionId: string;
    manifestDigest: string;
    lifecycleState: 'active';
    authorizedAt: string;
    expiresAt: string;
}
export interface AuthorizedTeamProjectPullRunOptions {
    signal?: AbortSignal;
    timeoutMs: number;
}
export type RunAuthorizedTeamProjectPull = (args: string[], workspaceId: string, options: AuthorizedTeamProjectPullRunOptions) => Promise<string>;
export interface StageAuthorizedTeamProjectPullInput {
    projectId: string;
    liveDir: string;
    scope: TeamMirrorPullScope;
    expectedVersion: number;
    signal?: AbortSignal;
    run?: RunAuthorizedTeamProjectPull;
    now?: () => number;
    /** Test-only race seam. Production callers leave this unset. */
    cleanupHooks?: {
        beforeQuarantineRename?: (stageDir: string) => void | Promise<void>;
    };
}
export interface AuthorizedTeamProjectStageIdentity {
    dev: string;
    ino: string;
}
export interface StagedAuthorizedTeamProjectPull {
    stageDir: string;
    identity: AuthorizedTeamProjectStageIdentity;
    receipt: AuthorizedTeamProjectPullReceipt;
    cleanup(): Promise<void>;
}
interface ReceiptValidationInput {
    projectId: string;
    scope: TeamMirrorPullScope;
    expectedVersion: number;
    nowMs?: number;
}
export declare function validateAuthorizedTeamProjectPullReceipt(receipt: AuthorizedTeamProjectPullReceipt, input: ReceiptValidationInput): void;
export declare function isAuthorizedTeamProjectPullUnavailable(error: unknown): boolean;
/** The packaged CLI predates `team-projects pull --authorize-only` (or lacks
 *  `team-projects pull` entirely). Callers must fail OPEN — pull as before —
 *  never block materialization on a missing probe. */
export declare function isAuthorizedTeamProjectPullInspectUnavailable(error: unknown): boolean;
/** Outcome of the authorize-only size probe. 'uncounted' means the CLI ran
 *  but could not report a count (old server output shape, malformed or
 *  mismatched JSON); 'unavailable' means the CLI lacks the probe itself. Both
 *  must degrade to the ordinary pull. */
export type AuthorizedTeamProjectPullInspection = {
    kind: 'counted';
    entryCount: number;
} | {
    kind: 'uncounted';
} | {
    kind: 'unavailable';
};
export interface InspectAuthorizedTeamProjectPullInput {
    projectId: string;
    scope: TeamMirrorPullScope;
    expectedVersion: number;
    signal?: AbortSignal;
    run?: RunAuthorizedTeamProjectPull;
    /** Clock override for receipt freshness, as the real pull accepts. */
    nowMs?: number;
}
/**
 * Authorize-only manifest probe: `vela team-projects pull <projectId>
 * --authorize-only` authorizes the exact published version and reports its
 * `manifestEntryCount` WITHOUT downloading a single blob (authorization
 * happens before any content transfer on the Vela side). Used by the
 * background pull size guard; the real pull re-runs full authorization and
 * receipt validation, so this probe performs only sanity binding checks and
 * degrades every anomaly to 'uncounted' (fail open).
 *
 * Throws only on transport-level failures (timeout, abort, non-capability CLI
 * errors) so the caller can fail open without caching a transient answer.
 */
export declare function inspectAuthorizedTeamProjectPull(input: InspectAuthorizedTeamProjectPullInput): Promise<AuthorizedTeamProjectPullInspection>;
export declare function stageAuthorizedTeamProjectPull(input: StageAuthorizedTeamProjectPullInput): Promise<StagedAuthorizedTeamProjectPull>;
export {};
