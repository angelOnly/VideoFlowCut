import type { Express, Request } from 'express';
import { type TeamResourceRequestScope, type TeamResourceShareRecord, type TeamResourceShareService } from '../collab/team-resource-share.js';
export interface TeamResourceShareListing {
    ids: string[];
    resources: TeamResourceShareRecord[];
}
export type TeamResourceScopeResolution = {
    ok: true;
    scope: TeamResourceRequestScope;
} | {
    ok: false;
    status: 400 | 401 | 403 | 503;
    code: string;
    message: string;
    retryable?: true;
};
export interface RegisterTeamResourceShareRoutesDeps {
    /** URL segment for this resource kind: `design-systems` | `plugins` | `skills`. */
    basePath: string;
    share: TeamResourceShareService;
    /** Resolve the request's explicit Workspace against authoritative membership. */
    resolveScope: (req: Request) => Promise<TeamResourceScopeResolution>;
    /** Optional resource-owner gate applied after Workspace authority succeeds. */
    authorizeShare?: (resourceId: string, scope: TeamResourceRequestScope) => boolean | Promise<boolean>;
    /** Optional materialization hook for shared team resources. */
    syncSharedResource?: (resource: TeamResourceShareRecord, scope: TeamResourceRequestScope) => Promise<void>;
    /**
     * Optional stale-while-revalidate provider for the `/team` list. Each GET
     * otherwise hits the resource hub (and re-materializes every shared resource)
     * on the request path — slow when the workspace shell re-reads all three kinds
     * on navigation. When provided, the route serves this cached listing instead,
     * so warm reads return instantly and refresh in the background.
     *
     * When the provider also exposes `invalidate()` (see `createSwrCache` /
     * `cachedTeamResourceList` in server.ts), the share/unshare handlers below
     * call it on success so the client's immediate refetch reads the new state
     * instead of the pre-change list the cache would otherwise keep serving for
     * up to its freshMs (or the client's slower background poll once SSE lowers
     * its cadence). Best-effort and optional: a `listTeam` with no `invalidate`
     * just falls back to the old behavior of catching up on the next refresh.
     */
    listTeam?: ((scope: TeamResourceRequestScope) => Promise<TeamResourceShareListing>) & {
        invalidate?: (scope: TeamResourceRequestScope) => void;
    };
    /**
     * Local fan-out after the authoritative mutation and the list-cache
     * invalidation have both completed. Linked resources use this to invalidate
     * every projection before the success response escapes.
     */
    onMutationCommitted?: (resourceId: string, scope: TeamResourceRequestScope, visibility: 'personal' | 'team') => void;
}
/**
 * Team resource sharing routes for one resource kind. A member promotes a
 * personal resource into the team scope; the share service packs its directory
 * and pushes it to the resource hub so teammates can pull it. Every route first
 * verifies the request's explicit Workspace/member selector against the
 * authoritative directory. A verified request still returns `shared: false`
 * when the hub transport is not configured. Mounted once per kind (design
 * systems, plugins, skills).
 */
export declare function registerTeamResourceShareRoutes(app: Express, deps: RegisterTeamResourceShareRoutesDeps): void;
