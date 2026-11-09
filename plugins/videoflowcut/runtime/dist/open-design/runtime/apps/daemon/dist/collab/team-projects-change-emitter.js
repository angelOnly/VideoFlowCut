/**
 * Convert a hub catalog/metadata mutation into an exact-Workspace cache
 * invalidation and a thin SSE signal. Warming is best-effort only.
 */
export function createTeamProjectsChangeEmitter(options) {
    const now = options.now ?? Date.now;
    return (workspaceIdInput, change = {}) => {
        const workspaceId = workspaceIdInput.trim();
        if (!workspaceId)
            return;
        const at = now();
        // The signal authorizes consumers to read again, so every exact-scope
        // cache must be invalid before the signal can escape this call stack.
        // Do not time-dedupe targeted mutations: without an upstream revision a
        // second rename/share transition is indistinguishable from a duplicate.
        options.invalidateWorkspace(workspaceId);
        options.emit(workspaceId, {
            type: 'team-projects-changed',
            ...(change.projectId ? { projectId: change.projectId } : {}),
            kind: change.kind ?? 'catalog',
            at,
        });
        // Warming only improves the next read. It must never delay the signal or
        // become the correctness boundary for cache visibility.
        void options.warmWorkspace(workspaceId).catch(() => undefined);
    };
}
//# sourceMappingURL=team-projects-change-emitter.js.map