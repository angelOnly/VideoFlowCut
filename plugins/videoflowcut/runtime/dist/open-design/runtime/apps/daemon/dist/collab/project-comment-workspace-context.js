/**
 * Resolves the persisted project binding against request authority without
 * consulting a member directory. The caller supplies the local authority and
 * fallback-context constructors, keeping this policy deterministic and
 * importable by production wiring and relay tests alike.
 */
export function resolveLocalProjectCommentWorkspaceContext(input) {
    const { binding, revoked, local } = input;
    if (revoked || binding?.resourceState === 'deleted') {
        return {
            ok: false,
            status: 403,
            code: 'WORKSPACE_PROJECT_PERMISSION_DENIED',
            message: 'workspace project read is not allowed',
        };
    }
    if (!binding?.workspaceId)
        return { ok: true, context: null };
    if (!local.ok)
        return local;
    if (local.context) {
        if (local.context.workspaceId !== binding.workspaceId
            || (binding.visibility !== 'team'
                && binding.createdByWorkspaceMemberId
                && local.context.workspaceMemberId !== binding.createdByWorkspaceMemberId)) {
            return {
                ok: false,
                status: 403,
                code: 'WORKSPACE_PROJECT_PERMISSION_DENIED',
                message: 'workspace project access is not allowed',
            };
        }
        return {
            ok: true,
            context: {
                ...local.context,
                workspaceType: binding.visibility === 'team' ? 'team' : 'personal',
                ...(binding.visibility === 'team' ? { teamId: binding.workspaceId } : {}),
            },
        };
    }
    return { ok: true, context: input.fallbackContext() };
}
//# sourceMappingURL=project-comment-workspace-context.js.map