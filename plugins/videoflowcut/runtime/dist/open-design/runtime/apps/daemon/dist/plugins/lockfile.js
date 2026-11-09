import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
export function defaultPluginLockfile() {
    return { schemaVersion: 1, plugins: {} };
}
export function lockEntryFromInstalled(plugin, lockedAt = Date.now()) {
    const entry = {
        name: plugin.sourceMarketplaceEntryName ?? plugin.id,
        version: plugin.sourceMarketplaceEntryVersion ?? plugin.version,
        source: plugin.source,
        sourceKind: plugin.sourceKind,
        lockedAt,
    };
    if (plugin.sourceMarketplaceId)
        entry.sourceMarketplaceId = plugin.sourceMarketplaceId;
    if (plugin.sourceMarketplaceEntryName)
        entry.sourceMarketplaceEntryName = plugin.sourceMarketplaceEntryName;
    if (plugin.resolvedSource)
        entry.resolvedSource = plugin.resolvedSource;
    if (plugin.resolvedRef)
        entry.resolvedRef = plugin.resolvedRef;
    if (plugin.manifestDigest)
        entry.manifestDigest = plugin.manifestDigest;
    if (plugin.archiveIntegrity)
        entry.archiveIntegrity = plugin.archiveIntegrity;
    return entry;
}
export async function readPluginLockfile(filePath) {
    try {
        const raw = await readFile(filePath, 'utf8');
        const parsed = JSON.parse(raw);
        return {
            schemaVersion: 1,
            plugins: parsed && typeof parsed.plugins === 'object' && parsed.plugins
                ? parsed.plugins
                : {},
        };
    }
    catch {
        return defaultPluginLockfile();
    }
}
export async function writePluginLockfile(filePath, lockfile) {
    await mkdir(path.dirname(filePath), { recursive: true });
    const sorted = {
        schemaVersion: 1,
        plugins: Object.fromEntries(Object.entries(lockfile.plugins).sort(([left], [right]) => left.localeCompare(right))),
    };
    await writeFile(filePath, JSON.stringify(sorted, null, 2) + '\n', 'utf8');
}
// Two installs finishing close together both read-modify-write this same
// file; without serializing, whichever write lands last silently discards
// the other's entry (issue #109 — concurrent plugin installs drop one
// lockfile row even though both copies land on disk). The daemon is the
// sole writer of its own data root, so an in-memory per-path promise chain
// is enough — no OS-level file lock needed. Chains are intentionally never
// evicted: the number of distinct lockfile paths in one daemon's lifetime
// is bounded by the number of projects it manages, not installs.
const pendingWritesByPath = new Map();
async function withLockfileQueue(filePath, task) {
    const previous = pendingWritesByPath.get(filePath) ?? Promise.resolve();
    const settled = previous.catch(() => undefined).then(task);
    pendingWritesByPath.set(filePath, settled);
    try {
        return await settled;
    }
    finally {
        if (pendingWritesByPath.get(filePath) === settled) {
            pendingWritesByPath.delete(filePath);
        }
    }
}
export async function upsertPluginLockfileEntry(filePath, plugin, lockedAt = Date.now()) {
    return withLockfileQueue(filePath, async () => {
        const lockfile = await readPluginLockfile(filePath);
        const entry = lockEntryFromInstalled(plugin, lockedAt);
        lockfile.plugins[entry.name] = entry;
        await writePluginLockfile(filePath, lockfile);
        return lockfile;
    });
}
//# sourceMappingURL=lockfile.js.map