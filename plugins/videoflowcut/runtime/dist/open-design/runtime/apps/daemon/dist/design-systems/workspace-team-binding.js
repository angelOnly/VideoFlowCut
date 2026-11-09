import { getWorkspaceResourceByResourceId } from '../db.js';
const WORKSPACE_TEAM_DESIGN_SYSTEM_BINDING_PREFIX = 'team-mirror:';
/**
 * Persisted Team mirrors use a Workspace-qualified envelope id. The logical
 * Design System id remains `user:<slug>` in every UI/API surface; only the
 * generic `workspace_resources` key is namespaced so two Teams, or Personal
 * and Team in one Workspace, can safely carry the same logical id.
 */
export function workspaceTeamDesignSystemBindingResourceId(workspaceId, designSystemId) {
    return `${WORKSPACE_TEAM_DESIGN_SYSTEM_BINDING_PREFIX}${encodeURIComponent(workspaceId)}:${encodeURIComponent(designSystemId)}`;
}
export function designSystemIdFromWorkspaceTeamBinding(workspaceId, bindingResourceId) {
    const prefix = `${WORKSPACE_TEAM_DESIGN_SYSTEM_BINDING_PREFIX}${encodeURIComponent(workspaceId)}:`;
    if (!bindingResourceId.startsWith(prefix))
        return null;
    try {
        return decodeURIComponent(bindingResourceId.slice(prefix.length));
    }
    catch {
        return null;
    }
}
export function designSystemLogicalResourceId(bindingResourceId) {
    if (!bindingResourceId.startsWith(WORKSPACE_TEAM_DESIGN_SYSTEM_BINDING_PREFIX)) {
        return bindingResourceId;
    }
    const separator = bindingResourceId.indexOf(':', WORKSPACE_TEAM_DESIGN_SYSTEM_BINDING_PREFIX.length);
    if (separator < 0)
        return bindingResourceId;
    try {
        return decodeURIComponent(bindingResourceId.slice(separator + 1));
    }
    catch {
        return bindingResourceId;
    }
}
export function workspaceTeamDesignSystemBindingAllowsRead(db, workspaceId, designSystemId) {
    const binding = getWorkspaceResourceByResourceId(db, 'design_system', workspaceTeamDesignSystemBindingResourceId(workspaceId, designSystemId));
    return binding?.workspaceId === workspaceId
        && binding.visibility === 'team'
        && binding.resourceState !== 'deleted';
}
//# sourceMappingURL=workspace-team-binding.js.map