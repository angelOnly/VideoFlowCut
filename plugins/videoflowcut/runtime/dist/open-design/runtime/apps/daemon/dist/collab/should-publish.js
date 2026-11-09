// The `shouldPublish` predicate `collab-publish-watcher.ts` consults before
// attaching a file watcher to a project (see that file's read-only-gate
// invariant: watched only when team-shared AND this daemon's member is its
// owner). Extracted to its own module so the exact project-scope invariant is
// independently unit-testable without spinning up the whole server.
/**
 * Whether THIS daemon should attach a file watcher to `projectId` and publish
 * its local edits: the project is team-shared, the exact principal bound to
 * this project is its OWNER (the single writer), AND that Workspace lifecycle
 * is currently ACTIVE.
 *
 * This only gates whether a NEW watch is attached — `collab-publish-
 * watcher.ts`'s `reconcile` never re-checks `shouldPublish` for a project it
 * is already watching (see that file's doc comment). The already-attached
 * case is instead closed at the transport layer with the same captured
 * project principal. No daemon-global active Workspace participates in this
 * decision, so switching Workspace cannot retarget an existing watcher.
 */
export function createShouldPublish(options) {
    return async (projectId) => {
        // Fresh-install wipe guard (recvqzaDvUU6B3): a local record that is still
        // an unmaterialized shared-project placeholder is not content authority —
        // it must never be watched or publish, no matter what the owner check
        // says. Checked before the hub round-trips so a placeholder never even
        // reaches the catalog.
        if (options.hasUnmaterializedPlaceholder(projectId))
            return false;
        const owner = await options.resolveSharedProjectOwner(projectId);
        if (!owner)
            return false;
        const principal = await options.resolveProjectPrincipal(projectId);
        if (principal?.lifecycleState !== 'active')
            return false;
        if (owner !== principal.memberId)
            return false;
        options.rememberTeamShare(projectId, principal);
        return principal;
    };
}
//# sourceMappingURL=should-publish.js.map