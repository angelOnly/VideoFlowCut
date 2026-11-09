import type { WorkspaceBillingRevisionClock, WorkspaceBillingRuntimeState } from '@open-design/contracts';
import type { VelaWorkspaceBillingProjection } from '../integrations/vela-billing.js';
export interface WorkspaceBillingRuntimeKey {
    workspaceId: string;
    workspaceMemberId: string;
}
export interface WorkspaceBillingRuntimeReadOptions {
    reason?: string;
    clientId?: string;
    clientGeneration?: string;
    /** Execution/precharge reads must complete a new authoritative projection. */
    requireFresh?: boolean;
}
export interface WorkspaceBillingRuntimeInterestSet {
    clientId: string;
    clientGeneration: string;
    interests: WorkspaceBillingRuntimeKey[];
}
export interface WorkspaceBillingRuntimeInterestLease {
    clientId: string;
    acceptedGeneration: string;
    leaseExpiresAt: string;
}
export interface WorkspaceBillingRuntimeResult {
    projection: VelaWorkspaceBillingProjection;
    state: WorkspaceBillingRuntimeState;
}
export type WorkspaceBillingInvalidationDomain = 'legacy' | 'subscription' | 'wallet';
export interface WorkspaceBillingRuntimeInvalidation {
    domain: WorkspaceBillingInvalidationDomain;
    workspaceId?: string;
    workspaceMemberId?: string;
    revision?: string;
    revisionClock?: WorkspaceBillingRevisionClock;
    reason?: string;
}
export interface WorkspaceBillingRuntimeScheduler {
    now(): number;
    setTimeout(callback: () => void, delayMs: number): ReturnType<typeof setTimeout>;
    clearTimeout(timer: ReturnType<typeof setTimeout>): void;
    setInterval(callback: () => void, delayMs: number): ReturnType<typeof setInterval>;
    clearInterval(timer: ReturnType<typeof setInterval>): void;
}
export interface WorkspaceBillingRuntimeCoordinatorOptions {
    fetchProjection(key: WorkspaceBillingRuntimeKey): Promise<VelaWorkspaceBillingProjection>;
    scheduler?: WorkspaceBillingRuntimeScheduler;
    pollIntervalMs?: number;
    realtimePollFloorMs?: number;
    retryDelaysMs?: readonly number[];
    onStateChange?: (state: WorkspaceBillingRuntimeState) => void;
    onAccessRevoked?: (key: WorkspaceBillingRuntimeKey, error: unknown) => void;
    interestLeaseMs?: number;
    interestSweepIntervalMs?: number;
    entryRetentionMs?: number;
    maxClients?: number;
    maxInterestsPerClient?: number;
    maxEntries?: number;
    softTtlMs?: number;
    hardTtlMs?: number;
    maxConcurrentRefreshes?: number;
    maxRefreshStartsPerWindow?: number;
    refreshStartWindowMs?: number;
    onInterestSetChange?: (interests: WorkspaceBillingRuntimeKey[]) => void;
    /** Bounded observability hook; one callback equals one billing projection
     * refresh avoided by the strict realtime safety floor. */
    onPollSuppressed?: () => void;
}
export declare class WorkspaceBillingInterestError extends Error {
    readonly code: 'invalid_generation' | 'stale_generation' | 'generation_payload_mismatch' | 'interest_capacity_exceeded';
    readonly acceptedGeneration?: string | undefined;
    constructor(code: 'invalid_generation' | 'stale_generation' | 'generation_payload_mismatch' | 'interest_capacity_exceeded', acceptedGeneration?: string | undefined);
}
export declare class WorkspaceBillingAccessRevokedError extends Error {
    readonly code = "workspace_not_authorized";
    constructor();
}
/**
 * Sole writer for exact workspace/member billing projections.
 *
 * Network reads, SSE events, reconnect hooks, and poll timers only submit
 * invalidations here. Per-key single-flight plus one trailing refresh prevents
 * event bursts from serializing unrelated work or allowing a late read for one
 * workspace/member to overwrite another.
 */
export declare class WorkspaceBillingRuntimeCoordinator {
    private readonly options;
    private readonly entries;
    private readonly clients;
    private readonly scheduler;
    private readonly pollIntervalMs;
    private readonly retryDelaysMs;
    private readonly interestLeaseMs;
    private readonly entryRetentionMs;
    private readonly maxClients;
    private readonly maxInterestsPerClient;
    private readonly maxEntries;
    private readonly softTtlMs;
    private readonly hardTtlMs;
    private readonly realtimePollFloorMs;
    private readonly realtimeHealthyWorkspaces;
    private readonly maxConcurrentRefreshes;
    private readonly maxRefreshStartsPerWindow;
    private readonly refreshStartWindowMs;
    private readonly refreshQueue;
    private readonly refreshStarts;
    private activeRefreshes;
    private refreshQueueTimer;
    private readonly pollTimer;
    private readonly interestSweepTimer;
    private disposed;
    constructor(options: WorkspaceBillingRuntimeCoordinatorOptions);
    setClientInterests(input: WorkspaceBillingRuntimeInterestSet): WorkspaceBillingRuntimeInterestLease;
    releaseClientInterests(clientIdInput: string, generationText?: string): boolean;
    interestedKeys(): WorkspaceBillingRuntimeKey[];
    /**
     * Fence all projections and leases created under a previous AMR profile.
     * In-flight reads are allowed to settle, but their incremented attempt token
     * prevents them from publishing into the new environment.
     */
    resetIdentity(): void;
    read(keyInput: WorkspaceBillingRuntimeKey, options?: WorkspaceBillingRuntimeReadOptions): Promise<WorkspaceBillingRuntimeResult>;
    invalidate(invalidation: WorkspaceBillingRuntimeInvalidation): void;
    reconnect(workspaceId?: string): void;
    setRealtimeHealthy(workspaceId: string, healthy: boolean): void;
    refreshAll(reason?: string): void;
    markWorkspaceUnavailable(workspaceId: string, error?: string): void;
    revokeWorkspace(workspaceId: string, reason?: string): void;
    retainWorkspaceMember(workspaceId: string, workspaceMemberId: string): void;
    authorizeWorkspaceMember(keyInput: WorkspaceBillingRuntimeKey): void;
    peek(keyInput: WorkspaceBillingRuntimeKey): WorkspaceBillingRuntimeResult | null;
    peekForClient(clientId: string, workspaceId: string): WorkspaceBillingRuntimeResult | null;
    dispose(): void;
    private acceptClientInterest;
    private entryFor;
    private hasActiveInterest;
    private quietIfUninterested;
    private activeRuntimeKeysExcept;
    private handleInterestMutation;
    private sweepExpiredInterests;
    private evictUninterestedEntries;
    private publishInterestSet;
    private interestedKeysWithoutSweep;
    private interestLease;
    private requestRefresh;
    private drainRefreshQueue;
    private startRefresh;
    private scheduleRetry;
    private revokeEntry;
    private removeQueuedEntry;
    private markStatus;
    private waitForIdle;
    private resolveWaiters;
    private result;
    private state;
    private publish;
    private isHardExpired;
    private effectiveSoftTtlMs;
    private effectiveHardTtlMs;
    private assertUsable;
}
export declare function createWorkspaceBillingRuntimeCoordinator(options: WorkspaceBillingRuntimeCoordinatorOptions): WorkspaceBillingRuntimeCoordinator;
export declare function shouldEmitWorkspaceBillingRuntimeNudge(state: WorkspaceBillingRuntimeState): boolean;
