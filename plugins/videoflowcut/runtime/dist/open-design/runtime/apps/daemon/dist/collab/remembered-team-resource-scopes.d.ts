import type { TeamResourceRequestScope } from './team-resource-share.js';
export interface RememberedTeamResourceScopeLease {
    workspaceId: string;
    /** Opaque principal key used only to reject stale background work. */
    key: string;
    generation: number;
}
export interface RememberedTeamResourceScopes {
    remember(scope: TeamResourceRequestScope): TeamResourceRequestScope;
    activeWorkspaceLeases(): RememberedTeamResourceScopeLease[];
    isLeaseCurrent(lease: RememberedTeamResourceScopeLease): boolean;
    has(scope: TeamResourceRequestScope): boolean;
}
/**
 * Bounded, timer-free compatibility lease for Team resource prewarming.
 *
 * A foreground request renews its exact workspace/member principal. Reads only
 * prune expired entries; no per-scope timer can keep an offscreen workspace
 * alive. Map insertion order is the LRU order, and every renewal receives a
 * new generation so an async poll captured before eviction cannot become
 * current again if the same principal is later revisited.
 */
export declare function createRememberedTeamResourceScopes(options?: {
    leaseMs?: number;
    maxEntries?: number;
    now?: () => number;
}): RememberedTeamResourceScopes;
