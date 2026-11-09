import type { WorkspaceCollabContext } from '@open-design/contracts';
import type { Response } from 'express';
export type WorkspaceResourceContext = {
    workspaceId: string;
    workspaceType: 'personal' | 'team';
    /**
     * The caller's RAW `x-od-workspace-type` claim, before it is collapsed into
     * `workspaceType` above. `workspaceType` defaults an absent header to
     * 'personal', which is the right default for view filtering but must never
     * be read as the caller ASSERTING "personal" — only an explicit header is
     * evidence. Null means the caller made no claim.
     */
    workspaceTypeAsserted: 'personal' | 'team' | null;
    appUserId: string;
    workspaceMemberId: string;
    role: 'owner' | 'admin' | 'member';
    memberStatus: 'active' | 'removed';
    lifecycleState: 'active' | 'billing_past_due' | 'locked' | 'deleting' | 'deleted';
    canShareProjects: boolean;
    canWriteSyncedFiles: boolean;
};
export type WorkspaceResourceMutationCapability = 'rename' | 'delete' | 'duplicate' | 'writeFiles' | 'comment';
export type WorkspaceRequestAuthorityResult = {
    ok: true;
    context: WorkspaceCollabContext;
} | {
    ok: false;
    status: 400 | 401 | 403 | 503;
    code: string;
    message: string;
    retryable?: true;
};
export type VerifyWorkspaceRequestAuthority = (req: unknown) => Promise<WorkspaceRequestAuthorityResult>;
export type ResolveWorkspaceResourceReadAuthority = (resourceId: string) => Promise<WorkspaceRequestAuthorityResult>;
/**
 * Browser navigation transports such as EventSource and iframe/src URLs
 * cannot attach custom headers. For those read-only routes only, accept the
 * same exact Workspace/member pair from query parameters and present it to the
 * normal verifier as request headers. A mixed header/query request must agree
 * exactly; callers cannot use query scope to override an existing identity.
 */
export declare function requestWithWorkspaceNavigationScope(req: any): any | 'conflict';
export type OptionalWorkspaceRequestAuthorityResult = {
    ok: true;
    context: WorkspaceCollabContext | null;
} | Exclude<WorkspaceRequestAuthorityResult, {
    ok: true;
}>;
/**
 * Resolve Workspace identity for daemon-local data-plane work.
 *
 * The browser's Workspace headers are attribution and namespace selectors on
 * this boundary, not a remote authorization token. Local files, conversations,
 * terminals, Skills, Plugins, and Design Systems must remain usable while Vela
 * is offline. Consequently this resolver validates only that the identity pair
 * is complete; it never calls the membership directory and deliberately does
 * not inherit stale role/lifecycle/permission claims from the browser.
 *
 * Operations that publish, share, sync, bill, or otherwise mutate remote Team
 * state must continue to use `resolveOptionalWorkspaceRequestAuthority` (or a
 * narrower fresh verifier) at that actual cloud boundary.
 */
export declare function resolveOptionalLocalWorkspaceRequestAuthority(req: any): OptionalWorkspaceRequestAuthorityResult;
/**
 * Resolve the three request-scope states shared by resource reads and writes:
 *
 * - no Workspace/member headers: the legacy Personal/global lane;
 * - a partial identity: a structured 400;
 * - a complete identity: fresh directory-backed authority.
 *
 * The caller-provided verifier is intentionally invoked for every complete
 * request. Resource mutations must not reuse a previously settled membership
 * success after the member has been removed.
 */
export declare function resolveOptionalWorkspaceRequestAuthority(req: any, verifyWorkspaceRequestAuthority: VerifyWorkspaceRequestAuthority | undefined): Promise<OptionalWorkspaceRequestAuthorityResult>;
/**
 * Compatibility snapshot used only by the deprecated synchronous gate below.
 * No production route calls that gate; its remaining direct tests document
 * legacy behavior while current client data-plane routes use
 * `enforceVerifiedWorkspaceResourceMutation`, which performs a fresh exact
 * Workspace/member authority check and never consults this snapshot.
 */
export type WorkspaceMembershipSnapshot = {
    workspaceId: string;
    memberStatus: 'active' | 'removed';
};
export type GetLastKnownWorkspaceMembership = () => WorkspaceMembershipSnapshot | null;
/**
 * Ambient identity shape retained only by the deprecated synchronous gate.
 * It is absent from authoritative request gates and must never choose a
 * client's Workspace.
 */
export type AmbientWorkspaceSnapshot = {
    workspaceId: string;
    workspaceType: 'personal' | 'team';
    workspaceMemberId: string;
    role: WorkspaceResourceContext['role'];
    memberStatus: WorkspaceResourceContext['memberStatus'];
    lifecycleState: WorkspaceResourceContext['lifecycleState'];
    permissions: {
        canShareProjects: boolean;
        canWriteSyncedFiles: boolean;
    };
};
export type GetAmbientWorkspace = () => AmbientWorkspaceSnapshot | null | undefined;
/**
 * The daemon's ambient identity as a resource context, or null when it has none.
 *
 * `workspaceTypeAsserted` is null and `appUserId` empty on purpose: both record
 * what a CALLER claimed, and nobody claimed anything here.
 */
export declare function ambientWorkspaceResourceContext(getAmbientWorkspace: GetAmbientWorkspace | undefined): WorkspaceResourceContext | null;
/**
 * Deprecated compatibility cross-check for the synchronous gate below.
 *
 * Current routes instead perform a fresh exact directory check. This helper
 * remains for direct legacy tests and must not be wired into new routes.
 */
export declare function withLastKnownMembership(ctx: WorkspaceResourceContext, getLastKnownMembership: GetLastKnownWorkspaceMembership | undefined): WorkspaceResourceContext;
export type WorkspaceResourceAccessInput = {
    workspaceId?: string | null;
    visibility?: string | null;
    resourceState?: string | null;
    createdByWorkspaceMemberId?: string | null;
    resourceHubResourceId?: string | null;
    syncState?: string | null;
};
export type WorkspaceMutationAuthorityLease = {
    verify: VerifyWorkspaceRequestAuthority;
    allow: (row: WorkspaceResourceAccessInput, context: WorkspaceCollabContext) => boolean;
};
export declare function headerValue(req: any, name: string): string | null;
export declare function headerBool(req: any, name: string, fallback: boolean): boolean;
export declare function workspaceResourceContext(req: any, workspaceId: string): WorkspaceResourceContext | null;
export declare function workspaceResourceContextFromRequest(req: any): WorkspaceResourceContext | 'missing' | null;
export declare function workspaceResourceContextFromVerified(context: WorkspaceCollabContext): WorkspaceResourceContext;
export declare function isWorkspaceResourceLocked(ctx: WorkspaceResourceContext): boolean;
/**
 * The core frozen/privilege/mutate computation shared by every resource
 * type. Deliberately narrower than project's own `projectAccess` in
 * `routes/project/index.ts` — it does not compute
 * canMoveToTeam/canMoveToPersonal/canOpen/canExport/canSendTo, which are
 * project-specific UX affordances project's own wrapper still builds on top
 * of this. What it DOES compute is the part every resource type needs
 * identically, and the part a correctness fix tends to land in.
 */
export declare function workspaceResourceAccess(wp: WorkspaceResourceAccessInput, ctx: WorkspaceResourceContext): {
    frozen: boolean;
    selfCreated: boolean;
    privileged: boolean;
    canMutate: boolean;
    unattributed: boolean;
    canShareLocal: boolean;
    disabledReason?: 'workspace_deleted' | 'workspace_locked' | 'permission_denied';
};
/**
 * Deprecated synchronous mutation gate retained for direct legacy tests.
 *
 * `resourceType` ('project' | 'plugin' | 'skill' | 'design_system') feeds
 * both the lookup callbacks' semantics and the permission-denied error code
 * (`WORKSPACE_<RESOURCE_TYPE>_PERMISSION_DENIED`) — for `resourceType:
 * 'project'` that reproduces the exact `WORKSPACE_PROJECT_PERMISSION_DENIED`
 * code the project route already shipped and has tests pinned against.
 *
 * `getWorkspaceResource`/`getWorkspaceResourceByResourceId` are caller-bound
 * closures over the specific resource's storage (e.g. `workspace_projects` or
 * `workspace_resources` filtered to `resource_type = 'plugin'`) so this
 * module never has to know which table backs which resource type.
 *
 * No production route calls this function. New code must use
 * `enforceVerifiedWorkspaceResourceMutation`.
 */
/**
 * The shape `createEnforceWorkspaceProjectMutation` (routes/project/index.ts)
 * returns: `enforceWorkspaceResourceMutation` with `resourceType` (and, for
 * project, the last-known-membership cross-check) already bound. Exported so a
 * resource type with no workspace binding of its own — a project comment — can
 * borrow another resource type's ALREADY-BUILT gate instance instead of
 * re-deriving one, and so the two ends of that hand-off (the builder in
 * routes/project/index.ts, the consumer in routes/project/comments.ts) share
 * one type instead of drifting.
 */
export type BoundWorkspaceResourceMutationGate = (req: any, res: Response, sendApiError: (res: Response, status: number, code: string, message: string, details?: Record<string, unknown>) => unknown, getWorkspaceResource: (db: unknown, workspaceId: string, resourceId: string) => WorkspaceResourceAccessInput | null | undefined, getWorkspaceResourceByResourceId: (db: unknown, resourceId: string) => WorkspaceResourceAccessInput | null | undefined, db: unknown, resourceId: string, capability: WorkspaceResourceMutationCapability) => Promise<boolean>;
/**
 * Deprecated synchronous counterpart retained for legacy tests. Production
 * routes use `requestCanMutateVerifiedWorkspaceResource`.
 *
 * For a READ route that writes as a side effect. The version-history GET
 * bootstraps a baseline version whenever a file has no manifest yet
 * (`ensureCurrentProjectFileVersion`), and on a member's mirror of someone
 * else's shared project that write is doubly wrong: it writes into a project
 * whose own banner says the member cannot modify it, and the version it
 * creates then presents itself as the owner's history even though the owner's
 * real history can never be there — `.file-versions` is in
 * `MEMBER_MIRROR_EXCLUDED_ENTRIES`, so a mirror never receives it. Measured
 * live (2026-07-27): owner 4 versions, member's panel 1, timestamped at the
 * moment the member opened the panel.
 *
 * The read itself stays open. Browsing history is a read action and the entry
 * point is deliberately un-gated (飞书 recvq56vFjQKfT); this answers only
 * "may this read leave a write behind?", never "may this caller read?".
 *
 * Fail-open on absent or unrecognized identity, which is where it deliberately
 * DIVERGES from `enforceWorkspaceResourceMutation`: that gate 401s a headerless
 * caller on a bound resource, because a mutation must prove membership. Here
 * the same absence must NOT suppress the bootstrap, or every legacy client,
 * `od` CLI invocation, and signed-out read would silently lose version history
 * for no security gain — the suppressed write is local-only either way
 * (`.file-versions` never publishes). Only an authenticated "this member
 * cannot write here" suppresses it.
 */
export declare function requestCanMutateWorkspaceResource(req: any, getWorkspaceResource: (db: unknown, workspaceId: string, resourceId: string) => WorkspaceResourceAccessInput | null | undefined, db: unknown, resourceId: string, getLastKnownMembership?: GetLastKnownWorkspaceMembership): boolean;
/**
 * Authoritative counterpart used by Workspace-bound project data-plane
 * routes. A persisted binding makes explicit Workspace/member identity
 * mandatory; every authority-bearing field comes from the signed-in
 * membership directory, never from request headers or daemon-global
 * active/last-known state. Truly unbound legacy local resources keep their
 * existing local-only behavior.
 */
export declare function requestCanMutateVerifiedWorkspaceResource(req: any, getWorkspaceResource: (db: unknown, workspaceId: string, resourceId: string) => WorkspaceResourceAccessInput | null | undefined, getWorkspaceResourceByResourceId: (db: unknown, resourceId: string) => WorkspaceResourceAccessInput | null | undefined, db: unknown, resourceId: string, verifyWorkspaceRequestAuthority: VerifyWorkspaceRequestAuthority | undefined): Promise<boolean>;
export declare function enforceVerifiedWorkspaceResourceMutation(resourceType: string, req: any, res: Response, sendApiError: (res: Response, status: number, code: string, message: string, details?: Record<string, unknown>) => unknown, getWorkspaceResource: (db: unknown, workspaceId: string, resourceId: string) => WorkspaceResourceAccessInput | null | undefined, getWorkspaceResourceByResourceId: (db: unknown, resourceId: string) => WorkspaceResourceAccessInput | null | undefined, db: unknown, resourceId: string, capability: WorkspaceResourceMutationCapability, verifyWorkspaceRequestAuthority: VerifyWorkspaceRequestAuthority | undefined, options?: {
    authorityLease?: WorkspaceMutationAuthorityLease;
}): Promise<boolean>;
/**
 * Exact authority gate for the data plane of a Workspace-bound resource.
 *
 * Reads deliberately do not require creator/admin mutation standing: every
 * active member may read a resource bound to the exact Workspace resolved by
 * the server. Explicit request claims are checked rather than trusted, while a
 * headerless read derives its Workspace from persisted ownership. Locked or
 * frozen Team resources intentionally remain readable but read-only; removed
 * members, authority outages, cross-Workspace identities, and deleted
 * resources fail closed. Truly unbound legacy local resources remain
 * compatible.
 */
export declare function enforceVerifiedWorkspaceResourceRead(resourceType: string, req: any, res: Response, sendApiError: (res: Response, status: number, code: string, message: string, details?: Record<string, unknown>) => unknown, getWorkspaceResource: (db: unknown, workspaceId: string, resourceId: string) => WorkspaceResourceAccessInput | null | undefined, getWorkspaceResourceByResourceId: (db: unknown, resourceId: string) => WorkspaceResourceAccessInput | null | undefined, db: unknown, resourceId: string, verifyWorkspaceRequestAuthority: VerifyWorkspaceRequestAuthority | undefined, options?: {
    allowNavigationQuery?: boolean;
    resolveAuthority?: ResolveWorkspaceResourceReadAuthority;
}): Promise<boolean>;
export declare function enforceWorkspaceResourceMutation(resourceType: string, req: any, res: Response, sendApiError: (res: Response, status: number, code: string, message: string) => unknown, getWorkspaceResource: (db: unknown, workspaceId: string, resourceId: string) => WorkspaceResourceAccessInput | null | undefined, getWorkspaceResourceByResourceId: (db: unknown, resourceId: string) => WorkspaceResourceAccessInput | null | undefined, db: unknown, resourceId: string, capability: WorkspaceResourceMutationCapability, getLastKnownMembership?: GetLastKnownWorkspaceMembership, getAmbientWorkspace?: GetAmbientWorkspace): boolean;
