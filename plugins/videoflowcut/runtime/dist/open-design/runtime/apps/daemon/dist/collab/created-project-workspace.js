import { workspaceResourceContextFromRequest, } from './workspace-resource-mutation.js';
import { sendApiError } from '../http/api-errors.js';
export function sendCreatedProjectWorkspaceError(res, error) {
    return sendApiError(res, error.status, error.code, error.message, error.retryable ? { retryable: true } : {});
}
/**
 * Capture optional local attribution for an ordinary local project create.
 *
 * PRODUCT INVARIANT: `POST /api/projects` creates local data first. Workspace
 * identity on that request is metadata for `personal` + `local_only` routing;
 * it is not permission to publish and must not trigger a directory/network
 * lookup or block creation. A complete request snapshot is retained as local
 * attribution even if its remote state may have changed; missing or partial
 * identity produces an unbound local project. Later share/sync/move-to-Team
 * operations perform fresh authority checks at their actual remote boundary.
 */
export function localProjectWorkspaceAttribution(req) {
    const context = workspaceResourceContextFromRequest(req);
    return context === null || context === 'missing' ? null : context;
}
/** Capture local attribution for project creation without a network gate. */
export async function authorizeCreatedProjectWorkspace(req, _fetchWorkspaceDirectory, _configuredEnv) {
    return { ok: true, context: localProjectWorkspaceAttribution(req) };
}
/**
 * Error thrown by resolver-style creation paths. It preserves the same typed
 * 400/403/503 result as direct HTTP creation gates so callers can reject before
 * touching the filesystem or database.
 */
export class CreatedProjectWorkspaceResolutionError extends Error {
    status;
    code;
    retryable;
    constructor(error) {
        super(error.message);
        this.name = 'CreatedProjectWorkspaceResolutionError';
        this.status = error.status;
        this.code = error.code;
        if (error.retryable)
            this.retryable = true;
    }
}
/** Resolve the optional local creation scope. */
export async function createdProjectWorkspaceHome(req, fetchWorkspaceDirectory, configuredEnv) {
    const authorized = await authorizeCreatedProjectWorkspace(req, fetchWorkspaceDirectory, configuredEnv);
    if (!authorized.ok)
        throw new CreatedProjectWorkspaceResolutionError(authorized);
    return authorized.context;
}
export function createCreatedProjectWorkspaceResolver(deps) {
    return (req) => createdProjectWorkspaceHome(req, deps.fetchWorkspaceDirectory, deps.configuredEnv?.());
}
/**
 * Write the `workspace_projects` row for a project this daemon just created.
 *
 * INVARIANT: a project created while this daemon knows a signed-in workspace
 * always gets a binding row. A project with no row is not a harmless default —
 * `GET /api/projects/:id/workspace-scope` answers `unbound` for it, which strips
 * the workspace off the run request (`ProjectView`'s `projectRunWorkspaceContext`
 * → an OpenDesign Cloud run nothing can bill) and blanks the balance/plan area
 * while that project is open (`AvatarMenu`). Headerless local AMR runs may use
 * the signed-in account wallet, but any later request that asserts a Workspace
 * still needs an exact persisted binding before workspace mutation gates allow it.
 *
 * `context` is the caller's complete local Workspace attribution when the
 * request named one. A headerless legacy request supplies null and remains
 * unbound; remote authority is checked only at a later cloud boundary.
 */
export function bindCreatedProjectToWorkspace(ensureWorkspaceProject, context, projectId, now) {
    if (!context)
        return;
    // This row is local attribution, not publication. It keeps billing and later
    // run routing associated with the browser's captured Workspace/member while
    // the project remains `personal` + `local_only`. Creating it must never be
    // interpreted as sharing the project or as authorization to use any local
    // plugin/Skill/Design System. The move/share/sync routes own those remote
    // authorization boundaries.
    ensureWorkspaceProject({
        projectId,
        workspaceId: context.workspaceId,
        visibility: 'personal',
        resourceState: 'active',
        createdByWorkspaceMemberId: context.workspaceMemberId,
        updatedByWorkspaceMemberId: context.workspaceMemberId,
        syncState: 'local_only',
        resourceHubResourceId: null,
        cloudTombstonedAt: null,
        createdAt: now,
        updatedAt: now,
    });
}
//# sourceMappingURL=created-project-workspace.js.map