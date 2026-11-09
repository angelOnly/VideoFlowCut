/**
 * Recover only creator-attributed share ownership after a daemon restart.
 *
 * `updatedByWorkspaceMemberId` records who last materialized or reconciled the
 * local row. On a read-only team mirror that is the current viewer, not the
 * remote project's single writer, so it is never evidence of ownership.
 * Mirrors without creator attribution deliberately return null here and
 * recover their owner through the workspace-scoped authoritative catalog used
 * by status and publish gating.
 */
export function recoverPersistedTeamShareOwnership(row) {
    const ownerMemberId = row.createdByWorkspaceMemberId;
    if (!row.projectId || !row.workspaceId || !ownerMemberId)
        return null;
    return {
        projectId: row.projectId,
        principal: {
            memberId: ownerMemberId,
            teamId: row.workspaceId,
            role: 'member',
            lifecycleState: 'active',
        },
    };
}
//# sourceMappingURL=persisted-team-share.js.map