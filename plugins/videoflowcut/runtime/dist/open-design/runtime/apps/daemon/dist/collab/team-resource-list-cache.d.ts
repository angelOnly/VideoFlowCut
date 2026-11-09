import { ConcurrencyGate } from './concurrency-gate.js';
import type { TeamResourceRequestScope, TeamResourceShareRecord, TeamResourceShareService } from './team-resource-share.js';
export declare const TEAM_RESOURCE_LIST_KINDS: readonly ['design_system', 'plugin', 'skill'];
export type TeamResourceListKind = (typeof TEAM_RESOURCE_LIST_KINDS)[number];
export interface TeamResourceListInvalidator {
    invalidate(scope: TeamResourceRequestScope): void;
}
export declare function invalidateTeamResourceListingCaches(input: {
    resourceKind?: string;
    scope: TeamResourceRequestScope;
    providers: Record<TeamResourceListKind, TeamResourceListInvalidator>;
    invalidateSharedCommand: (workspaceId: string) => void;
}): void;
/**
 * Cache identity for a listing. Team resource visibility is a function of the
 * whole principal — a role or lifecycle change can add or remove entries — so
 * every field that the authority consults is part of the key.
 */
export declare const teamResourceScopeKey: (scope: TeamResourceRequestScope) => string;
export interface TeamResourceListing {
    ids: string[];
    resources: TeamResourceShareRecord[];
}
export interface TeamResourceListCache {
    (scope: TeamResourceRequestScope): Promise<TeamResourceListing>;
    /** Bypass the cache and re-read from the authority (post-mutation reads). */
    authoritative(scope: TeamResourceRequestScope): Promise<TeamResourceListing>;
    invalidate(scope: TeamResourceRequestScope): void;
}
export interface TeamResourceListCacheOptions {
    share: TeamResourceShareService;
    /**
     * Materialize one shared resource into the member's local copy. Optional:
     * kinds with nothing to fetch pass nothing.
     */
    sync?: (resource: TeamResourceShareRecord, scope: TeamResourceRequestScope) => Promise<void>;
    /** Drops the `vela resource shared` command cache the listing was read through. */
    invalidateSharedCommand: (workspaceId: string) => void;
    /**
     * The materialization gate, owned by the composition root and SHARED by every
     * resource kind.
     *
     * It has to be injected rather than built here. The three listing surfaces —
     * design systems, plugins, skills — are separate caches that a single client
     * poll refreshes together, so a gate built per cache bounds each kind
     * independently and the daemon's real peak becomes the cap times the number
     * of kinds. The bound only means anything if all three draw from one budget.
     */
    gate: ConcurrencyGate;
}
/**
 * SWR-cached "what has this workspace shared with me" listing, per principal,
 * optionally materializing each entry as it lands.
 */
export declare function createTeamResourceListCache(options: TeamResourceListCacheOptions): TeamResourceListCache;
