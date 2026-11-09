function stagedLocalCatalogScope(value) {
    const scope = value;
    const workspaceId = typeof scope?.workspaceId === 'string' ? scope.workspaceId.trim() : '';
    const workspaceMemberId = typeof scope?.workspaceMemberId === 'string'
        ? scope.workspaceMemberId.trim()
        : '';
    return workspaceId && workspaceMemberId ? { workspaceId, workspaceMemberId } : null;
}
/**
 * Resolve the Skill catalogue partition for one project's run.
 *
 * The invariant this exists to hold: **every surface that resolves a
 * user-selected Skill for a run resolves it from the same partition.** The
 * system-prompt composer and OD Next's frozen-package capture both answer
 * "which Skills can this run see", and a run that admits a Skill through one
 * and cannot find it through the other would silently drop the user's
 * selection.
 *
 * Resource provenance is intentionally independent from project attribution. A
 * Home selection can be staged while Workspace identity is still transitioning,
 * so a staged local catalogue partition wins over the project's Workspace
 * binding: the first run then reads the same local record without waiting for
 * identity discovery, and without treating the staged value as remote
 * membership authority.
 */
export function resolveSkillCatalogScope(input) {
    const staged = stagedLocalCatalogScope(input.metadata
        ?.localCatalogScopes?.skill);
    if (staged)
        return staged;
    const binding = input.workspaceBinding;
    if (!binding?.workspaceId)
        return null;
    return {
        workspaceId: String(binding.workspaceId),
        workspaceMemberId: typeof binding.createdByWorkspaceMemberId === 'string'
            ? binding.createdByWorkspaceMemberId
            : null,
    };
}
//# sourceMappingURL=skill-catalog-scope.js.map