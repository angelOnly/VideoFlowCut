import type { WorkspaceCollabContext, WorkspaceDirectoryItem } from '@open-design/contracts';
import { type ResourceHubPrincipal } from './resource-principal.js';
/** Thrown when a team member without share rights attempts to share a resource. */
export declare class TeamResourceShareForbiddenError extends Error {
    constructor();
}
/**
 * Thrown when an operation requires a live Team hub read but the authority
 * cannot be reached. Callers must distinguish this from an authoritative
 * empty list: retrying is safe, while proceeding from a cached fallback is
 * not.
 */
export declare class TeamResourceAuthorityUnavailableError extends Error {
    readonly status = 503;
    readonly code = "WORKSPACE_RESOURCE_AUTHORITY_UNAVAILABLE";
    readonly retryable = true;
    constructor(cause?: unknown);
}
export interface TeamResourceShareRecord {
    id: string;
    hubResourceId?: string;
    title?: string;
    description?: string;
    ownerMemberId?: string;
    canUnshare?: boolean;
    versionId?: string;
    version?: number;
}
/**
 * Request-verified authority for one Team resource operation.
 *
 * The route resolves this from the request's explicit Workspace headers and
 * the authoritative membership directory. Services must never reconstruct it
 * from the daemon's mutable active Workspace.
 */
export interface TeamResourceRequestScope {
    principal: ResourceHubPrincipal;
    canShare: boolean;
}
export declare function teamResourceRequestScopeFromContext(context: WorkspaceCollabContext): TeamResourceRequestScope | null;
export declare function teamResourceRequestScopeForWorkspaceId(items: WorkspaceDirectoryItem[], workspaceId: string): TeamResourceRequestScope | null;
export interface TeamResourceShareService {
    /** Share a resource to the team. Returns the published version, or null off-team. */
    share(resourceId: string, scope: TeamResourceRequestScope): Promise<{
        version: number;
    } | null>;
    /** Remove a resource from the team index. Returns false off-team/unconfigured. */
    unshare(resourceId: string, scope: TeamResourceRequestScope): Promise<boolean>;
    /** Ids of resources shared to the team. */
    sharedIds(scope: TeamResourceRequestScope): Promise<string[]>;
    /** Resources shared to the team, including best-effort display metadata. */
    sharedResources(scope: TeamResourceRequestScope, options?: TeamResourceSharedReadOptions): Promise<TeamResourceShareRecord[]>;
    /** True once a resource has been shared to the team. */
    isShared(resourceId: string, scope: TeamResourceRequestScope): boolean;
    /** Whether the login-backed Vela transport is wired. */
    readonly configured: boolean;
}
export interface TeamResourceSharedReadOptions {
    /**
     * Require a live hub response. Reconciliation must use this mode so a
     * transport failure can never be confused with an authoritative empty list.
     */
    authoritative?: boolean;
}
export interface CreateTeamResourceShareOptions {
    /** Resource hub kind, e.g. `design_system` | `plugin` | `skill`. */
    kind: string;
    /** Colon-free id-namespace prefix distinguishing this kind on the shared hub. */
    idPrefix: string;
    /** Resolve a resource's source directory (what gets packed and pushed). May be
     *  async: the skill resolver awaits the skill index, and the publish adapter
     *  awaits this before packing. */
    resolveDir: (resourceId: string) => string | Promise<string>;
    /** Optional resource-index metadata shown in teammate team lists. */
    describeResource?: (resourceId: string) => Record<string, unknown> | null | Promise<Record<string, unknown> | null>;
    /** Injectable Vela resource runner for tests. */
    run?: (args: string[], workspaceId?: string, readOptions?: TeamResourceSharedReadOptions) => Promise<string>;
    env?: NodeJS.ProcessEnv;
}
export declare function createTeamResourceShareService(options: CreateTeamResourceShareOptions): TeamResourceShareService;
/**
 * spec 04 §11: unshare `resourceId` from `service`'s team hub, but ONLY when
 * it is CURRENTLY on the LIVE `sharedResources()` list — never inferred from
 * a caller-side "was this ever synced locally" flag. A resource's own
 * sharer never carries a local "teamSynced" marker (that flag is only ever
 * stamped onto a TEAMMATE's pulled copy — see `isTeamSyncedUserDesignSystem`
 * in design-systems/index.ts), so gating an unshare on it would let the
 * sharer delete their own shared resource without ever touching the hub's
 * index, leaving a dangling entry that keeps re-syncing onto every teammate.
 * This is the exact bug a resource-delete route must close for every
 * resource kind that can be team-shared (design system today; the analogous
 * project fix lives in `routes/project/index.ts`'s DELETE handler, reusing
 * `requestTeamVisibility`/`collabSync.requestTeamUnshare` instead of this
 * helper because projects don't go through `TeamResourceShareService`).
 *
 * Returns whether an unshare actually ran, so a caller — and its tests — can
 * assert on the real state transition instead of a "was unshare called" mock.
 * Deliberately does NOT swallow a thrown `TeamResourceShareForbiddenError`:
 * the caller's delete must abort rather than proceed past a failed unshare.
 */
export declare function unshareIfCurrentlyShared(service: Pick<TeamResourceShareService, 'sharedResources' | 'unshare'>, resourceId: string, scope: TeamResourceRequestScope): Promise<boolean>;
export declare function parseSharedResourceIds(stdout: string, kind: string, idPrefix: string): string[];
export declare function parseSharedResourceRecords(stdout: string, kind: string, idPrefix: string): TeamResourceShareRecord[];
