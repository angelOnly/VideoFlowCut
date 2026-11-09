import { createHash } from 'node:crypto';
const PREFIX = 'share-payload-v1:';
/** Hash exactly the complete staged payload, not source mtimes or alias identity.
 * Sorting removes traversal-order differences; length framing includes names and bytes.
 */
export function fingerprintSharePayload(files) {
    if (!files?.length)
        return null;
    const names = new Set();
    const hash = createHash('sha256').update(PREFIX);
    for (const item of [...files].sort((a, b) => a.file < b.file ? -1 : a.file > b.file ? 1 : 0)) {
        if (!item.file || item.file.startsWith('/') || item.file.includes('\\')
            || item.file.split('/').some(part => !part || part === '.' || part === '..') || names.has(item.file)
            || !(typeof item.data === 'string' || item.data instanceof Uint8Array))
            return null;
        names.add(item.file);
        const bytes = Buffer.from(item.data);
        hash.update(JSON.stringify([item.file, bytes.byteLength])).update('\0').update(bytes);
    }
    return PREFIX + hash.digest('hex');
}
export function createShareContentFingerprints(db, publications) {
    db.exec(`CREATE TABLE IF NOT EXISTS share_content_fingerprints (
    resource_team_id TEXT NOT NULL, owner_member_id TEXT NOT NULL, project_id TEXT NOT NULL, file_path TEXT NOT NULL,
    slug TEXT NOT NULL, revision TEXT NOT NULL, fingerprint TEXT NOT NULL,
    PRIMARY KEY(resource_team_id,owner_member_id,project_id,file_path)
  )`);
    const values = (scope) => [scope.resourceTeamId, scope.ownerMemberId, scope.projectId, scope.filePath];
    const get = db.prepare(`SELECT slug, revision, fingerprint FROM share_content_fingerprints
    WHERE resource_team_id=? AND owner_member_id=? AND project_id=? AND file_path=?`);
    const rebindRevision = db.prepare(`UPDATE share_content_fingerprints SET revision=?
    WHERE resource_team_id=? AND owner_member_id=? AND project_id=? AND file_path=? AND slug=?`);
    const put = db.prepare(`INSERT INTO share_content_fingerprints VALUES(?,?,?,?,?,?,?)
    ON CONFLICT(resource_team_id,owner_member_id,project_id,file_path) DO UPDATE SET
    slug=excluded.slug,revision=excluded.revision,fingerprint=excluded.fingerprint`);
    return {
        remember: db.transaction((scope, expected, files) => {
            const fingerprint = fingerprintSharePayload(files);
            const witness = publications.getRevision(scope);
            if (!fingerprint || !expected.token.trim() || witness?.slug !== expected.slug || witness.token !== expected.token)
                return false;
            const old = get.get(...values(scope));
            // An operation's acknowledged bytes cannot be relabelled after the fact.
            if (old?.revision === expected.token && old.fingerprint !== fingerprint)
                return false;
            put.run(...values(scope), expected.slug, expected.token, fingerprint);
            return true;
        }),
        rebind: db.transaction((scope, expected) => {
            const witness = publications.getRevision(scope);
            if (!expected.token.trim() || witness?.slug !== expected.slug || witness.token !== expected.token)
                return false;
            return rebindRevision.run(expected.token, ...values(scope), expected.slug).changes === 1;
        }),
        compare(scope, files) {
            try {
                const fingerprint = fingerprintSharePayload(files);
                const witness = publications.getRevision(scope);
                const stored = get.get(...values(scope));
                if (!fingerprint || !witness?.token || !stored || stored.slug !== witness.slug || stored.revision !== witness.token
                    || !/^share-payload-v1:[a-f0-9]{64}$/.test(stored.fingerprint))
                    return 'unknown';
                return fingerprint === stored.fingerprint ? 'current' : 'outdated';
            }
            catch {
                // Unavailable comparison is not proof of change or proof of absence.
                return 'unknown';
            }
        },
    };
}
//# sourceMappingURL=share-content-fingerprint.js.map