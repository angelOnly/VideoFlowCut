import { workspaceContextHasTeamIdentity, } from '@open-design/contracts';
/** Derive resource scope from the one login-backed workspace context. */
export function contextToResourceHubPrincipal(context) {
    if (!context || !workspaceContextHasTeamIdentity(context))
        return null;
    return {
        memberId: context.workspaceMemberId,
        teamId: context.teamId ?? context.workspaceId,
        role: context.role,
        lifecycleState: context.lifecycleState,
        workspaceType: context.workspaceType,
    };
}
//# sourceMappingURL=resource-principal.js.map