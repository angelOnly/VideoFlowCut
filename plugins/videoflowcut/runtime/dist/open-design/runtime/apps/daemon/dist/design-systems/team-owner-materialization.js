export function ownedDesignSystemSourceIsReady(input) {
    if (input.ownerMemberId !== input.currentMemberId)
        return false;
    const { binding } = input;
    return input.localSourceExists
        && binding?.workspaceId === input.workspaceId
        && binding.visibility === 'personal'
        && binding.resourceState !== 'deleted'
        && binding.createdByWorkspaceMemberId === input.currentMemberId;
}
//# sourceMappingURL=team-owner-materialization.js.map