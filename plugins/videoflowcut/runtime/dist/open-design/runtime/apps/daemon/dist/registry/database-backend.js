import { StaticRegistryBackend, toRegistryEntry } from './static-backend.js';
export class DatabaseRegistryBackend extends StaticRegistryBackend {
    db;
    constructor(options) {
        ensureRegistryTables(options.db);
        super({
            id: options.id,
            kind: 'db',
            trust: options.trust ?? 'restricted',
            manifest: manifestFromDb(options.db, options.id),
        });
        this.db = options.db;
    }
    async publish(request) {
        upsertRegistryEntry(this.db, this.id, request.entry);
        const [vendor, name] = request.entry.name.split('/');
        return {
            ok: true,
            dryRun: false,
            changedFiles: [
                `db://${this.id}/plugins/${vendor}/${name}`,
                `db://${this.id}/plugins/${vendor}/${name}/versions/${request.entry.version}`,
            ],
            warnings: [],
        };
    }
    async yank(name, version, reason) {
        const row = this.db.prepare(`
      SELECT entry_json FROM registry_entries WHERE backend_id = ? AND name = ?
    `).get(this.id, name);
        if (!row) {
            return { ok: false, name, version, reason, warnings: [`${name} not found`] };
        }
        const entry = JSON.parse(row.entry_json);
        const versions = entry.versions ?? [{ version: entry.version, source: entry.source }];
        const nextVersions = versions.map((item) => item.version === version
            ? { ...item, yanked: true, yankedAt: new Date().toISOString(), yankReason: reason }
            : item);
        upsertRegistryEntry(this.db, this.id, {
            ...entry,
            versions: nextVersions,
            ...(entry.version === version
                ? { yanked: true, yankedAt: new Date().toISOString(), yankReason: reason }
                : {}),
        });
        return { ok: true, name, version, reason, warnings: [] };
    }
    getManifest() {
        return manifestFromDb(this.db, this.id);
    }
}
export function ensureRegistryTables(db) {
    db.exec(`
    CREATE TABLE IF NOT EXISTS registry_entries (
      backend_id TEXT NOT NULL,
      name TEXT NOT NULL,
      version TEXT NOT NULL,
      entry_json TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (backend_id, name)
    )
  `);
}
export function upsertRegistryEntry(db, backendId, entry, now = Date.now()) {
    db.prepare(`
    INSERT INTO registry_entries (backend_id, name, version, entry_json, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(backend_id, name) DO UPDATE SET
      version = excluded.version,
      entry_json = excluded.entry_json,
      updated_at = excluded.updated_at
  `).run(backendId, entry.name, entry.version, JSON.stringify(entry), now);
}
function manifestFromDb(db, backendId) {
    const rows = db.prepare(`
    SELECT entry_json FROM registry_entries WHERE backend_id = ? ORDER BY name ASC
  `).all(backendId);
    const plugins = [];
    for (const row of rows) {
        const entry = JSON.parse(row.entry_json);
        const marketplaceEntry = {
            ...entry,
            name: entry.name,
            source: entry.source,
            version: entry.version,
        };
        if (toRegistryEntry(marketplaceEntry)) {
            plugins.push(marketplaceEntry);
        }
    }
    return {
        specVersion: '1.0.0',
        name: backendId,
        version: '0.0.0',
        plugins,
    };
}
//# sourceMappingURL=database-backend.js.map