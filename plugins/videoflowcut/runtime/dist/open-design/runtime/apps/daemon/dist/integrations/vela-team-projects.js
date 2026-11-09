export function projectResourceIdFor(projectId, principal) {
    if (!principal)
        return `project-${projectId}`;
    const scoped = Buffer.from(JSON.stringify([principal.teamId, principal.memberId, projectId]), 'utf8').toString('base64url');
    return `project-${scoped}`;
}
export function projectSyncStateToVela(state) {
    if (state === 'synced')
        return 'synced';
    if (state === 'sync_failed')
        return 'failed';
    return 'pending_upload';
}
export function velaProjectSyncStateToProject(state) {
    if (state === 'synced')
        return 'synced';
    if (state === 'failed')
        return 'sync_failed';
    return 'pending_upload';
}
//# sourceMappingURL=vela-team-projects.js.map