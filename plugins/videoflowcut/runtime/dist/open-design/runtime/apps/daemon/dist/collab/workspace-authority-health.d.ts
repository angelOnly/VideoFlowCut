export type WorkspaceAuthorityCacheMode = 'legacy' | 'observe' | 'adaptive';
export declare function resolveWorkspaceAuthorityCacheMode(value: string | undefined): WorkspaceAuthorityCacheMode;
export interface WorkspaceAuthorityHealthCoordinatorOptions {
    mode: WorkspaceAuthorityCacheMode;
    catchUp(workspaceId: string): Promise<void>;
    /** Bounded-cadence retry after a transient catch-up failure. */
    catchUpRetryMs?: number;
    setDirectoryPollingHealthy(workspaceId: string, healthy: boolean): void;
    setBillingPollingHealthy(workspaceId: string, healthy: boolean): void;
    setContextCachingHealthy?(workspaceId: string, healthy: boolean): void;
    onDecision?: (input: {
        source: 'sse';
        reason: 'mode_disabled' | 'unhealthy' | 'catch_up' | 'healthy';
        outcome: 'allow' | 'unavailable' | 'fallback';
    }) => void;
    onError?: (error: unknown) => void;
}
export interface WorkspaceAuthorityHealthCoordinator {
    update(input: {
        workspaceId?: string;
        healthy: boolean;
    }): Promise<void>;
}
/**
 * Converts strict upstream health into permission to suppress legacy polls.
 * A healthy frame is only a candidate: adaptive mode remains on legacy
 * cadence until one exact-workspace catch-up completes. Generation fencing
 * prevents a late catch-up from re-enabling suppression after a disconnect.
 */
export declare function createWorkspaceAuthorityHealthCoordinator(options: WorkspaceAuthorityHealthCoordinatorOptions): WorkspaceAuthorityHealthCoordinator;
