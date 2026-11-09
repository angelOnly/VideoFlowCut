// Phase 4 / spec §11.5 / plan §3.DD1 — installed-plugin inventory stats.
//
// Pure helper that aggregates an in-memory list of
// InstalledPluginRecord into a single health/inventory report.
// Used by:
//
//   - `od plugin stats` — operator at-a-glance inventory check,
//   - the desktop / web 'Plugins' settings panel (via the JSON
//     mode of the same CLI),
//   - the `od doctor` summary (a future patch can fold this in
//     without reimplementing the aggregation).
//
// The function is intentionally pure; the daemon route wires the
// snapshot-side aggregation in separately because that side
// requires a SQLite read.
const ELEVATED_CAPABILITIES = new Set(['fs:write', 'subprocess', 'bash', 'network']);
export function pluginInventoryStats(plugins) {
    const stats = {
        total: plugins.length,
        bySourceKind: {},
        byTrust: {},
        byTaskKind: {},
        withElevatedCapabilities: 0,
        bundled: 0,
        thirdParty: 0,
        lastInstalledAt: null,
        lastUpdatedAt: null,
    };
    for (const plugin of plugins) {
        const kind = plugin.sourceKind ?? 'unknown';
        stats.bySourceKind[kind] = (stats.bySourceKind[kind] ?? 0) + 1;
        const trust = plugin.trust ?? 'unknown';
        stats.byTrust[trust] = (stats.byTrust[trust] ?? 0) + 1;
        const taskKind = plugin.manifest.od?.taskKind ?? 'unknown';
        stats.byTaskKind[taskKind] = (stats.byTaskKind[taskKind] ?? 0) + 1;
        const declared = plugin.manifest.od?.capabilities ?? [];
        if (Array.isArray(declared) && declared.some((c) => ELEVATED_CAPABILITIES.has(c) || (typeof c === 'string' && c.startsWith('connector:')))) {
            stats.withElevatedCapabilities++;
        }
        if (plugin.sourceKind === 'bundled' || plugin.trust === 'bundled')
            stats.bundled++;
        else
            stats.thirdParty++;
        if (typeof plugin.installedAt === 'number') {
            stats.lastInstalledAt = stats.lastInstalledAt === null
                ? plugin.installedAt
                : Math.max(stats.lastInstalledAt, plugin.installedAt);
        }
        if (typeof plugin.updatedAt === 'number') {
            stats.lastUpdatedAt = stats.lastUpdatedAt === null
                ? plugin.updatedAt
                : Math.max(stats.lastUpdatedAt, plugin.updatedAt);
        }
    }
    return stats;
}
export function pluginSourceBuckets(plugins) {
    const map = new Map();
    for (const p of plugins) {
        const sourceKind = (p.sourceKind ?? 'unknown');
        const source = p.source ?? '(none)';
        const key = `${sourceKind}\t${source}`;
        let bucket = map.get(key);
        if (!bucket) {
            bucket = { sourceKind, source, count: 0, plugins: [] };
            map.set(key, bucket);
        }
        bucket.count += 1;
        bucket.plugins.push({ id: p.id, version: p.version });
    }
    // Sort plugins within bucket by id for deterministic output.
    for (const b of map.values())
        b.plugins.sort((a, b) => a.id.localeCompare(b.id));
    // Sort buckets by descending count, then ascending sourceKind / source.
    const buckets = [...map.values()].sort((a, b) => {
        if (a.count !== b.count)
            return b.count - a.count;
        if (a.sourceKind !== b.sourceKind)
            return a.sourceKind.localeCompare(b.sourceKind);
        return a.source.localeCompare(b.source);
    });
    return { total: plugins.length, buckets };
}
export function snapshotInventoryStats(rows) {
    const stats = {
        total: rows.length,
        byStatus: {},
        withProject: 0,
        withRun: 0,
        oldestAppliedAt: null,
        newestAppliedAt: null,
    };
    for (const row of rows) {
        const status = row.status ?? 'unknown';
        stats.byStatus[status] = (stats.byStatus[status] ?? 0) + 1;
        if (row.project_id)
            stats.withProject++;
        if (row.run_id)
            stats.withRun++;
        if (typeof row.applied_at === 'number') {
            stats.oldestAppliedAt = stats.oldestAppliedAt === null
                ? row.applied_at
                : Math.min(stats.oldestAppliedAt, row.applied_at);
            stats.newestAppliedAt = stats.newestAppliedAt === null
                ? row.applied_at
                : Math.max(stats.newestAppliedAt, row.applied_at);
        }
    }
    return stats;
}
//# sourceMappingURL=stats.js.map