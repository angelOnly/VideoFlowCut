export function getPluginContextCraft(plugin) {
    return getManifestContextCraft(plugin.manifest);
}
export function getManifestContextCraft(manifest) {
    return normalizeCraftRequires(manifest.od?.context?.craft);
}
export function getSnapshotContextCraft(snapshot) {
    return normalizeCraftRequires(snapshot.craftRequires);
}
function normalizeCraftRequires(declared) {
    if (!Array.isArray(declared) || declared.length === 0)
        return [];
    const seen = new Set();
    const craft = [];
    for (const entry of declared) {
        if (typeof entry !== 'string')
            continue;
        const slug = entry.trim();
        if (!slug || seen.has(slug))
            continue;
        seen.add(slug);
        craft.push(slug);
    }
    return craft;
}
//# sourceMappingURL=context-craft.js.map