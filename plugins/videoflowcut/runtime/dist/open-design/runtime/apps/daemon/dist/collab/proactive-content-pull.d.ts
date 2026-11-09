export interface ProactiveContentPullEvent {
    projectId?: string | undefined;
    workspaceId?: string | undefined;
    version?: number | undefined;
    /** Internal diagnostic origin; never serialized to the hub or web. */
    profileReceivedAtMs?: number | undefined;
}
export interface ProactiveContentPullProjectRef {
    projectId: string;
    ownerMemberId: string;
}
export declare function activeTeamWorkspaceIdentity(context: {
    workspaceId?: string | null;
    teamId?: string | null;
    workspaceMemberId?: string | null;
    workspaceType?: string | null;
    memberStatus?: string | null;
    lifecycleState?: string | null;
} | null): {
    workspaceId: string;
    resourceTeamId: string;
    workspaceMemberId: string;
} | null;
export interface ProactivePullAuthorizationScope {
    projectId: string;
    workspaceId: string;
    resourceTeamId: string;
    viewerMemberId: string;
    ownerMemberId: string;
}
export interface ProactivePullAuthorizationWitness extends ProactivePullAuthorizationScope {
    readonly kind: 'proactive-content-pull';
    readonly version: number;
    readonly verifiedAtMs: number;
}
export interface AuthorizedProactivePullInvocation extends ProactivePullAuthorizationScope {
    readonly kind: 'authorized-proactive-stage';
    readonly expectedVersion: number;
    /** Opt-in profiling origin only; never participates in authorization. */
    readonly profileReceivedAtMs?: number;
    readonly isStillExpected: () => boolean;
    readonly signal: AbortSignal;
}
export declare function isAuthorizedProactivePullInvocation(invocation: AuthorizedProactivePullInvocation | undefined, scope: ProactivePullAuthorizationScope, expectedVersion: number | undefined): boolean;
export declare function isBoundProactivePullInvocation(invocation: AuthorizedProactivePullInvocation | undefined, scope: ProactivePullAuthorizationScope, expectedVersion: number | undefined): boolean;
export declare function isFreshProactivePullAuthorizationWitness(witness: ProactivePullAuthorizationWitness | undefined, scope: ProactivePullAuthorizationScope, expectedVersion: number | undefined, nowMs?: number): boolean;
/** Outcome contract of the injected pull — structurally the same shape
 *  `CollabSyncRoutesHandle.pullSharedProject` (routes/collab-sync.ts)
 *  resolves with, redeclared here so this module stays free of the routes
 *  layer. */
export type ProactiveContentPullOutcome = {
    status: 'pulled';
    version: number | null;
} | {
    status: 'revoked';
} | {
    status: 'register_failed';
};
/** Exact team scope proved by the hub event + active identity + owner lookup. */
export interface ProactiveContentPullTarget {
    projectId: string;
    workspaceId: string;
    resourceTeamId: string;
    viewerMemberId: string;
    ownerMemberId: string;
    authorizationWitness?: ProactivePullAuthorizationWitness;
    authorizedStageInvocation?: AuthorizedProactivePullInvocation;
}
export interface ProactiveContentPullDeps {
    /** Owner content goes through explicit overwrite authority, not member receipts. */
    observeOwnedContent?: (scope: ProactiveContentPullTarget, version?: number) => Promise<void>;
    /** This daemon's own `workspace_projects` row for the project, or null when
     *  it was never bound locally. */
    getLocalBinding: (projectId: string) => {
        workspaceId: string;
        visibility: 'personal' | 'team';
    } | null;
    /** The authoritative TEAM identity for this exact Workspace (active
     * membership only), or null when signed out / personal-only / unavailable. */
    getWorkspaceIdentity: (workspaceId: string) => Promise<{
        workspaceId: string;
        resourceTeamId: string;
        workspaceMemberId: string;
    } | null>;
    /** Server-authoritative owner lookup in the same exact Workspace scope. */
    resolveSharedProjectOwner: (projectId: string, workspaceId: string) => Promise<string | null>;
    /** The shared pull flow (revocation gate → pull → register → signals) —
     *  `CollabSyncRoutesHandle.pullSharedProject` in production wiring. */
    pullSharedProject: (target: ProactiveContentPullTarget, expectedVersion?: number) => Promise<ProactiveContentPullOutcome>;
    /**
     * One workspace-scoped catalog read used only on a verified hub connection
     * (first connect and reconnect). Optional so event-driven consumers remain
     * usable without a catch-up transport.
     */
    listSharedProjects?: (workspaceId: string) => Promise<readonly ProactiveContentPullProjectRef[]>;
    /** Exact-scope local materialization probe. The broad low-frequency floor
     *  still selects only missing projects; a project-targeted catalog recovery
     *  may also compare an existing mirror's durable version with remote head. */
    hasMaterializedProject?: (projectId: string, target: ProactiveContentPullTarget) => boolean | Promise<boolean>;
    /** Read one authoritative published head after the single catalog sweep has
     *  selected a recently changed, non-owned project. Calls are sequential to
     *  avoid a reconnect request burst. */
    publishedHead?: (target: ProactiveContentPullTarget) => Promise<number | null>;
    /** Durable last materialized version, shared with other team-resource
     *  reconcilers. Seeds the in-memory event cursor after daemon restart. */
    materializedVersion?: (target: ProactiveContentPullTarget) => string | null;
    /**
     * Background content-size policy (issue #6518, incident #6512), consulted
     * immediately before this module executes a content pull. EVERY pull this
     * module drives is background work — the live hub push lane and the broad
     * or targeted catch-up sweeps all converge here — while the foreground
     * open-project lane (`POST /api/projects/:id/collab/pull` in
     * routes/collab-sync.ts) never flows through this module and therefore
     * never consults this policy. 'defer' skips the download and settles the
     * work item; the version stays unmaterialized until the user opens the
     * project and the foreground pull lands it (its durable cursor then
     * satisfies later background rounds before this policy is reached again).
     *
     * Fail-closed direction is deliberately INVERTED relative to this module's
     * other guards: for the size policy, "closed" means PULL AS BEFORE (the
     * pre-guard status quo). Skipping is the new behavior, so any uncertainty —
     * the policy throwing, an unknown entry count, an old CLI without the
     * probe, or a versionless event — must degrade to the existing pull and
     * may never leave a project permanently unmaterialized.
     */
    assessBackgroundContentPull?: (target: ProactiveContentPullTarget, version: number) => Promise<'pull' | 'defer'>;
    /** Called after a successful, versioned pull has materialized bytes. Used
     *  to invalidate list-level cover reads that do not subscribe to the
     *  project's own SSE stream. */
    onPulled?: (target: ProactiveContentPullTarget, version: number) => void | Promise<void>;
    /**
     * Called when handling the original hub event reaches a terminal decision
     * without leaving a retry/recovery lane behind. Successful pulls also call
     * this after `onPulled`; consumers should treat it as idempotent.
     */
    onEventSettled?: (event: ProactiveContentPullEvent) => void;
    /** Opt-in, secret-free timing observer. It must not affect pull behavior. */
    onTiming?: (event: {
        phase: 'queued' | 'guard-started' | 'guard-completed' | 'invoke' | 'completed';
        projectId: string;
        version?: number;
        receivedAtMs?: number;
        atMs: number;
        status?: string;
    }) => void;
    /** Secret-free lifecycle diagnostics for the bounded catch-up sweep. */
    onCatchUp?: (event: {
        phase: 'started' | 'completed' | 'skipped' | 'retry-scheduled' | 'retry-exhausted';
        mode: 'full' | 'missing-only';
        lane: 'broad' | 'targeted';
        workspaceId?: string;
        projectId?: string;
        scanned?: number;
        candidates?: number;
        /** Remote published-head requests issued by this sweep. */
        headChecks?: number;
        /** Remote heads that resolved to a published version. */
        heads?: number;
        suppressed?: number;
        complete?: boolean;
        failures?: number;
        attempt?: number;
        delayMs?: number;
        reason?: 'no-active-team' | 'scope-mismatch' | 'unavailable';
    }) => void;
    onError?: (error: unknown) => void;
    /** Injectable retry clock for deterministic tests. */
    scheduler?: {
        setTimeout: (callback: () => void | Promise<void>, delayMs: number) => unknown;
        clearTimeout: (handle: unknown) => void;
    };
    /** Injectable entropy for equal-jitter retry delays. */
    random?: () => number;
    /** Injectable wall clock for deterministic broad-head cooldown tests. */
    now?: () => number;
}
export interface ProactiveContentPull {
    /**
     * React to one hub 'project-content-changed' event. Never rejects: every
     * failure lands on `onError` and leaves freshness to the polling fallback.
     */
    handleContentChanged(event: ProactiveContentPullEvent): Promise<void>;
    /**
     * Sweep published heads after a verified hub first-connect/reconnect.
     * Calls are single-flight with at most one trailing pass.
     */
    catchUpPublishedHeads(expectedWorkspaceId?: string): Promise<void>;
    /**
     * Advance the bounded full-recovery cursor from the existing safety-floor
     * heartbeat, additionally healing projects whose local tree is absent.
     */
    advanceRecoveryFloor(expectedWorkspaceId?: string): Promise<void>;
    /**
     * Low-frequency catalog safety floor for the healthy-stream/missed-event
     * case. Only remote projects with no local materialization are considered.
     */
    materializeMissingProjects(expectedWorkspaceId?: string, expectedProjectId?: string): Promise<void>;
    /**
     * Adopt an exact-scope version that another pull lane durably committed.
     * The caller must invoke this only after bytes, mirror binding, and cursor
     * persistence all succeed.
     */
    observeMaterialized(target: ProactiveContentPullTarget, version: number): Promise<void>;
    /** Stop background recovery and release every pending retry timer. */
    dispose(): void;
}
export declare function createProactiveContentPull(deps: ProactiveContentPullDeps): ProactiveContentPull;
