export const ownedContentScopeKey = (scope) => JSON.stringify([
    scope.workspaceId, scope.resourceTeamId, scope.viewerMemberId, scope.ownerMemberId, scope.projectId,
]);
export const emptyOwnedContentRecord = () => ({
    localVersion: null, latestVersion: null, ignoredVersion: null, promptSuppressedUntil: null, fingerprint: null,
});
export function migrateOwnedContentSync(db) {
    db.exec(`CREATE TABLE IF NOT EXISTS owned_content_sync (
    scope_key TEXT PRIMARY KEY,
    local_version INTEGER,
    latest_version INTEGER,
    ignored_version INTEGER,
    prompt_suppressed_until INTEGER,
    fingerprint TEXT
  )`);
    const columns = db.pragma('table_info(owned_content_sync)');
    if (!columns.some(column => column.name === 'prompt_suppressed_until')) {
        db.exec('ALTER TABLE owned_content_sync ADD COLUMN prompt_suppressed_until INTEGER');
    }
    // The earlier unshipped implementation stored automatic overwrite permission.
    // Do not inherit that permission as either synchronization or reminder consent.
    if (columns.some(column => column.name === 'auto_apply_until')) {
        db.exec('UPDATE owned_content_sync SET auto_apply_until = NULL WHERE auto_apply_until IS NOT NULL');
    }
}
export function createSqliteOwnedContentStore(db) {
    const read = db.prepare(`SELECT local_version AS localVersion, latest_version AS latestVersion,
    ignored_version AS ignoredVersion, prompt_suppressed_until AS promptSuppressedUntil, fingerprint
    FROM owned_content_sync WHERE scope_key = ?`);
    const write = db.prepare(`INSERT INTO owned_content_sync
    (scope_key, local_version, latest_version, ignored_version, prompt_suppressed_until, fingerprint)
    VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(scope_key) DO UPDATE SET
    local_version=excluded.local_version, latest_version=excluded.latest_version,
    ignored_version=excluded.ignored_version, prompt_suppressed_until=excluded.prompt_suppressed_until,
    fingerprint=excluded.fingerprint`);
    return {
        read(scope) { return read.get(ownedContentScopeKey(scope)) ?? emptyOwnedContentRecord(); },
        write(scope, record) {
            write.run(ownedContentScopeKey(scope), record.localVersion, record.latestVersion, record.ignoredVersion, record.promptSuppressedUntil, record.fingerprint);
        },
    };
}
//# sourceMappingURL=owned-content-store.js.map