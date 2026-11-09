import { workspaceResourceContextFromRequest } from './workspace-resource-mutation.js';
import { workspaceContextFromDirectoryItem, } from './vela-workspace-context.js';
/**
 * Resolve a request's explicit Workspace identity against the signed-in
 * account's authoritative membership directory.
 *
 * Data-plane routes must call this instead of reading the daemon's mutable
 * active Workspace. The headers choose which membership to verify; the
 * directory supplies every authority-bearing field.
 */
export async function verifyWorkspaceRequestContext(input) {
    const claimed = workspaceResourceContextFromRequest(input.req);
    if (claimed === null) {
        return {
            ok: false,
            status: 400,
            code: 'WORKSPACE_CONTEXT_REQUIRED',
            message: 'an explicit workspace context is required',
        };
    }
    if (claimed === 'missing') {
        return {
            ok: false,
            status: 400,
            code: 'WORKSPACE_CONTEXT_INCOMPLETE',
            message: 'both workspace and member identity are required',
        };
    }
    let directory;
    try {
        directory = await input.fetchWorkspaceDirectory();
    }
    catch {
        directory = { ok: false, items: [] };
    }
    if (!directory.ok) {
        if (directory.reason === 'unauthorized') {
            return {
                ok: false,
                status: 401,
                code: 'AMR_AUTH_REQUIRED',
                message: 'AMR authorization expired. Sign in again to continue.',
            };
        }
        return {
            ok: false,
            status: 503,
            code: 'WORKSPACE_AUTHORITY_UNAVAILABLE',
            message: 'workspace membership authority is temporarily unavailable',
            retryable: true,
        };
    }
    const membership = directory.items.find((item) => item.workspaceId === claimed.workspaceId
        && item.workspaceMemberId === claimed.workspaceMemberId
        && item.memberStatus === 'active'
        && item.lifecycleState !== 'deleted');
    if (!membership || (input.requireTeam && membership.workspaceType !== 'team')) {
        return {
            ok: false,
            status: 403,
            code: 'WORKSPACE_ACCESS_DENIED',
            message: 'the requested workspace is not available to this member',
        };
    }
    return {
        ok: true,
        context: workspaceContextFromDirectoryItem(membership, input.configuredEnv),
    };
}
//# sourceMappingURL=request-workspace-context.js.map