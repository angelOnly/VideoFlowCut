import { requestWithWorkspaceNavigationScope, workspaceResourceContextFromRequest, } from './workspace-resource-mutation.js';
export async function enforceLocalProjectDataPlaneRequest(input) {
    const { req, projectId, options, db, getWorkspaceProject, getWorkspaceProjectByProjectId, onDenied, } = input;
    const deny = (status, code, message, details) => {
        onDenied?.(status, code, message, details);
        return false;
    };
    const persisted = getWorkspaceProjectByProjectId(db, projectId);
    if (!persisted?.workspaceId)
        return true;
    const scopedRequest = options.mode === 'read' && options.allowNavigationQuery
        ? requestWithWorkspaceNavigationScope(req)
        : req;
    if (scopedRequest === 'conflict') {
        return deny(400, 'WORKSPACE_CONTEXT_CONFLICT', 'workspace header and navigation scope must match');
    }
    const claimed = workspaceResourceContextFromRequest(scopedRequest);
    if (claimed === 'missing') {
        return deny(400, 'WORKSPACE_CONTEXT_INCOMPLETE', 'both workspace and member identity are required');
    }
    if (claimed && claimed.workspaceId !== persisted.workspaceId) {
        return deny(403, 'WORKSPACE_PROJECT_PERMISSION_DENIED', `workspace project ${options.mode} is not allowed`);
    }
    const row = getWorkspaceProject(db, persisted.workspaceId, projectId);
    if (!row || row.resourceState === 'deleted') {
        return deny(403, 'WORKSPACE_PROJECT_PERMISSION_DENIED', `workspace project ${options.mode} is not allowed`);
    }
    if (options.mode === 'read') {
        if (claimed
            && row.visibility === 'personal'
            && row.createdByWorkspaceMemberId
            && row.createdByWorkspaceMemberId !== claimed.workspaceMemberId) {
            return deny(403, 'WORKSPACE_PROJECT_PERMISSION_DENIED', 'workspace project read is not allowed');
        }
        return true;
    }
    if (row.resourceState === 'frozen') {
        return deny(403, 'WORKSPACE_LOCKED', 'workspace project mutation is not allowed');
    }
    if (options.capability === 'comment' && row.visibility === 'team')
        return true;
    if (!claimed && row.visibility === 'team') {
        return deny(400, 'WORKSPACE_CONTEXT_REQUIRED', 'workspace context is required');
    }
    // A Team project is single-writer. Pulled member mirrors deliberately persist
    // a null creator, so null means "no local writer", not "unattributed local
    // project". Keep those mirrors read-only from the durable row even when Vela
    // is unavailable; only an exact persisted creator/member match may write.
    if (row.visibility === 'team'
        && row.createdByWorkspaceMemberId !== claimed?.workspaceMemberId) {
        return deny(403, 'WORKSPACE_PROJECT_PERMISSION_DENIED', 'workspace project mutation is not allowed');
    }
    // An explicit browser/tool identity must still match the persisted creator
    // for attributed Personal projects. Headerless Personal projects retain CLI
    // compatibility.
    if (claimed
        && row.createdByWorkspaceMemberId
        && row.createdByWorkspaceMemberId !== claimed.workspaceMemberId) {
        return deny(403, 'WORKSPACE_PROJECT_PERMISSION_DENIED', 'workspace project mutation is not allowed');
    }
    return true;
}
/**
 * Build the one project data-plane authority gate used by route modules.
 *
 * Persisted project binding is the local namespace and creator witness. Local
 * project data-plane requests never synchronously depend on Vela membership
 * availability; cloud share/sync/billing boundaries perform their own fresh
 * authorization. Unbound pre-Workspace local projects retain legacy behavior.
 */
export function createAuthorizeProjectRequest(deps) {
    const { db, getWorkspaceProject, getWorkspaceProjectByProjectId, isProjectRevoked, isProjectUnmaterializedPlaceholder, sendApiError, } = deps;
    return async (req, res, projectId, options) => {
        if (isProjectRevoked?.(db, projectId)) {
            sendApiError(res, options.mode === 'read' ? 404 : 403, options.mode === 'read'
                ? 'PROJECT_NOT_FOUND'
                : 'WORKSPACE_PROJECT_PERMISSION_DENIED', options.mode === 'read'
                ? 'project not found'
                : 'workspace project mutation is not allowed');
            return false;
        }
        const allowed = await enforceLocalProjectDataPlaneRequest({
            req,
            projectId,
            options,
            db,
            getWorkspaceProject,
            getWorkspaceProjectByProjectId,
            onDenied: (status, code, message, details) => details === undefined
                ? sendApiError(res, status, code, message)
                : sendApiError(res, status, code, message, details),
        });
        if (!allowed)
            return false;
        if (options.mode === 'write' && options.capability !== 'comment' && deps.isProjectReceivingContent?.(projectId)) {
            sendApiError(res, 409, 'PROJECT_BUSY', 'project is receiving cloud content');
            return false;
        }
        if (options.mode !== 'read'
            && options.capability !== 'comment'
            && isProjectUnmaterializedPlaceholder?.(db, projectId)) {
            sendApiError(res, 409, 'PROJECT_MATERIALIZATION_PENDING', 'project content is still materializing');
            return false;
        }
        return true;
    };
}
//# sourceMappingURL=project-request-authority.js.map