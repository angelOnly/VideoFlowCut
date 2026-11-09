import type { AuthorizedTeamProjectPullInspection } from './authorized-team-project-pull.js';
export declare const DEFAULT_BACKGROUND_PULL_MAX_ENTRIES = 2000;
export declare const BACKGROUND_PULL_MAX_ENTRIES_ENV = "OD_COLLAB_BACKGROUND_PULL_MAX_ENTRIES";
export declare const BACKGROUND_PULL_MAX_CUMULATIVE_ENTRIES_ENV = "OD_COLLAB_BACKGROUND_PULL_MAX_CUMULATIVE_ENTRIES";
/**
 * Per-process cumulative ceiling for background materialization. Defaults to
 * `0` (disabled), so this ships inert until a deliberate value is chosen —
 * picking that number is a capacity decision that needs production data on
 * real team sizes, not a default inferred from a synthetic workspace.
 */
export declare function backgroundPullMaxCumulativeEntriesFromEnv(env?: Record<string, string | undefined>): number;
/**
 * Threshold resolution: a non-negative integer from
 * `OD_COLLAB_BACKGROUND_PULL_MAX_ENTRIES`; `0` disables the guard entirely
 * (every background pull proceeds, probe never runs); anything invalid falls
 * back to the default so a typo can never silently disable the guardrail.
 */
export declare function backgroundPullMaxEntriesFromEnv(env?: Record<string, string | undefined>): number;
export interface BackgroundPullSizeGuardScope {
    projectId: string;
    workspaceId: string;
    resourceTeamId: string;
    viewerMemberId: string;
    ownerMemberId: string;
}
export interface BackgroundPullSizeGuardDeps {
    /** Entries above this count defer; `0` disables the guard. */
    maxEntries: number;
    /**
     * Total entries this process may materialize through the BACKGROUND lanes
     * before deferring everything else to the foreground. Omitted or `0`
     * disables it, which is the pre-existing behaviour.
     *
     * `maxEntries` answers "is this ONE project too big to push onto every
     * member's disk" (incident #6512: a single 7442-file project). It cannot see
     * accumulation: measured on a live workspace, 12 projects of 12 files each
     * all cleared it individually while a member who only opened the client
     * pulled 23 MB across 8 projects in 50s, with `candidates=25 suppressed=0`.
     * Onboarding cost therefore grew linearly with team size with no ceiling.
     *
     * Deferring is not denying: the foreground open-project lane never consults
     * this guard, so anything skipped here still materializes the moment the
     * user actually opens it.
     */
    maxCumulativeEntries?: number;
    /** Authorize-only manifest probe — must never download blobs. */
    inspect: (scope: BackgroundPullSizeGuardScope, version: number) => Promise<AuthorizedTeamProjectPullInspection>;
    /** Secret-free observation of a deferral decision. */
    onDeferred?: (info: {
        projectId: string;
        workspaceId: string;
        version: number;
        entryCount: number;
        maxEntries: number;
        /**
         * Which ceiling deferred this. `oversized` is one project too large on its
         * own; `budget-exhausted` is a small project that simply arrived after the
         * cumulative budget was spent. They need different responses — raise the
         * per-project threshold vs. raise the session budget — so a log that
         * called both "oversized" sent readers after the wrong one.
         */
        reason: 'oversized' | 'budget-exhausted';
    }) => void;
    onError?: (error: unknown) => void;
}
/**
 * How much this process has let the BACKGROUND lanes materialize. Reported
 * unconditionally — including while the cumulative ceiling is disabled, which
 * is the shipping default — because choosing that ceiling is a capacity
 * decision that needs real per-launch volume, and a counter that only runs
 * once the ceiling is already set can never supply it.
 */
export interface BackgroundPullVolume {
    /** Entries cleared for background materialization, summed over every
     *  allowed decision that carried a count. */
    entries: number;
    /** Allowed decisions that carried a count — pairs with `entries` to give a
     *  per-project mean without a second reading. */
    countedProjects: number;
    /**
     * Allowed decisions whose version carried NO count (old server output, so
     * the guard fails open). Reported separately because a small `entries` is
     * otherwise ambiguous: a fleet that counts nothing looks identical to a
     * fleet that pulls nothing, and reading the first as the second would set
     * the ceiling far below what real teams need.
     */
    uncountedProjects: number;
}
export interface BackgroundPullSizeGuard {
    /**
     * Decide whether the background lane may materialize this exact
     * scope + version. 'defer' leaves content to the foreground lane; every
     * uncertainty resolves to 'pull' (the pre-guard status quo).
     */
    assess(scope: BackgroundPullSizeGuardScope, version: number): Promise<'pull' | 'defer'>;
    /** Snapshot of what this process has cleared so far. Read-only; callers
     *  must never mutate the returned object. */
    volume(): BackgroundPullVolume;
}
export declare function createBackgroundPullSizeGuard(deps: BackgroundPullSizeGuardDeps): BackgroundPullSizeGuard;
