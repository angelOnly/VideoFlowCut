// Phase 4 / spec §11.5 / plan §3.BB2 — snapshot diff helper.
//
// Pure helper that compares two AppliedPluginSnapshot values and
// returns a structured report. Useful for:
//
//   - debugging replay invariance ('e2e-2: applying the same plugin
//     twice produces byte-equal digests'),
//   - inspecting why a re-apply produced a different snapshot
//     ('did the resolved skills change between turns?'),
//   - comparing the snapshot a run launched against vs. the live
//     plugin's current apply.
//
// Sister of plugins/diff.ts (which compares InstalledPluginRecord
// values). The shape is intentionally identical so renderers reuse
// the same +/-/~ glyph format.
export function diffSnapshots(input) {
    const { a, b } = input;
    const entries = [];
    // Identity + lineage.
    diffScalar(entries, 'snapshotId', a.snapshotId, b.snapshotId);
    diffScalar(entries, 'pluginId', a.pluginId, b.pluginId);
    diffScalar(entries, 'pluginSpecVersion', a.pluginSpecVersion, b.pluginSpecVersion);
    diffScalar(entries, 'pluginVersion', a.pluginVersion, b.pluginVersion);
    diffScalar(entries, 'manifestSourceDigest', a.manifestSourceDigest, b.manifestSourceDigest);
    diffScalar(entries, 'sourceMarketplaceId', a.sourceMarketplaceId, b.sourceMarketplaceId);
    diffScalar(entries, 'pinnedRef', a.pinnedRef, b.pinnedRef);
    diffScalar(entries, 'taskKind', a.taskKind, b.taskKind);
    diffScalar(entries, 'status', a.status, b.status);
    diffScalar(entries, 'pluginTitle', a.pluginTitle, b.pluginTitle);
    diffScalar(entries, 'pluginDescription', a.pluginDescription, b.pluginDescription);
    diffScalar(entries, 'query', a.query, b.query);
    // Strategy diagnostics intentionally expose identity/digests only. Asset
    // bodies never live on the snapshot and therefore cannot leak through diff.
    diffScalar(entries, 'strategy.id', a.strategy?.id, b.strategy?.id);
    diffScalar(entries, 'strategy.version', a.strategy?.version, b.strategy?.version);
    diffScalar(entries, 'strategy.packageHash', a.strategy?.packageHash, b.strategy?.packageHash);
    diffScalar(entries, 'strategy.selectedTaskProfile.sha256', a.strategy?.selectedTaskProfile.sha256, b.strategy?.selectedTaskProfile.sha256);
    // Inputs (typed scalar map).
    diffMap(entries, 'inputs', recordToStringMap(a.inputs), recordToStringMap(b.inputs));
    // Capabilities.
    diffArray(entries, 'capabilitiesRequired', a.capabilitiesRequired, b.capabilitiesRequired);
    diffArray(entries, 'capabilitiesGranted', a.capabilitiesGranted, b.capabilitiesGranted);
    // Resolved context items (compare by ref, the digest input).
    diffArray(entries, 'resolvedContext.items', contextRefs(a.resolvedContext?.items), contextRefs(b.resolvedContext?.items));
    // Connectors / MCP.
    diffArray(entries, 'connectorsRequired', nonEmptyStrings((a.connectorsRequired ?? []).map((c) => safeString(c?.id))), nonEmptyStrings((b.connectorsRequired ?? []).map((c) => safeString(c?.id))));
    diffArray(entries, 'connectorsResolved', nonEmptyStrings((a.connectorsResolved ?? []).map((c) => `${safeString(c?.id)}:${safeString(c?.status)}`)), nonEmptyStrings((b.connectorsResolved ?? []).map((c) => `${safeString(c?.id)}:${safeString(c?.status)}`)));
    diffArray(entries, 'mcpServers', nonEmptyStrings((a.mcpServers ?? []).map((m) => safeString(m?.id))), nonEmptyStrings((b.mcpServers ?? []).map((m) => safeString(m?.id))));
    // GenUI surfaces (by id).
    diffArray(entries, 'genuiSurfaces', nonEmptyStrings((a.genuiSurfaces ?? []).map((s) => safeString(s?.id))), nonEmptyStrings((b.genuiSurfaces ?? []).map((s) => safeString(s?.id))));
    // Pipeline (by stage id roster + per-stage atoms).
    diffPipeline(entries, a.pipeline, b.pipeline);
    // Assets (by path).
    diffArray(entries, 'assetsStaged', nonEmptyStrings((a.assetsStaged ?? []).map((x) => safeString(x?.path))), nonEmptyStrings((b.assetsStaged ?? []).map((x) => safeString(x?.path))));
    entries.sort((x, y) => x.field.localeCompare(y.field));
    let added = 0;
    let removed = 0;
    let changed = 0;
    for (const e of entries) {
        if (e.kind === 'added')
            added++;
        if (e.kind === 'removed')
            removed++;
        if (e.kind === 'changed')
            changed++;
    }
    const report = {
        digestEqual: a.manifestSourceDigest === b.manifestSourceDigest,
        entries,
        added, removed, changed,
    };
    if (a.pluginId === b.pluginId)
        report.pluginId = a.pluginId;
    return report;
}
function nonEmptyStrings(values) {
    return values.filter((s) => typeof s === 'string' && s.length > 0);
}
function safeString(value) {
    return typeof value === 'string' ? value : '';
}
function recordToStringMap(input) {
    const out = {};
    if (!input)
        return out;
    for (const [k, v] of Object.entries(input))
        out[k] = String(v);
    return out;
}
function contextRefs(items) {
    if (!Array.isArray(items))
        return [];
    return items.map((i) => {
        if (!i)
            return '';
        const anyItem = i;
        const ref = anyItem.id ?? anyItem.path ?? anyItem.label ?? '';
        return `${anyItem.kind ?? ''}:${ref}`;
    }).filter((s) => s.length > 1);
}
function diffPipeline(out, a, b) {
    if (!a && !b)
        return;
    if (!a && b) {
        out.push({ field: 'pipeline', kind: 'added', after: b.stages?.map((s) => s.id).join(' \u2192 ') ?? '' });
        return;
    }
    if (a && !b) {
        out.push({ field: 'pipeline', kind: 'removed', before: a.stages?.map((s) => s.id).join(' \u2192 ') ?? '' });
        return;
    }
    diffArray(out, 'pipeline.stages', (a.stages ?? []).map((s) => s.id), (b.stages ?? []).map((s) => s.id));
    const aBy = new Map((a.stages ?? []).map((s) => [s.id, s]));
    const bBy = new Map((b.stages ?? []).map((s) => [s.id, s]));
    for (const id of new Set([...aBy.keys(), ...bBy.keys()])) {
        const sa = aBy.get(id);
        const sb = bBy.get(id);
        if (!sa || !sb)
            continue;
        diffArray(out, `pipeline.stages[${id}].atoms`, sa.atoms ?? [], sb.atoms ?? []);
        diffScalar(out, `pipeline.stages[${id}].until`, sa.until, sb.until);
    }
}
function diffScalar(out, field, a, b) {
    const aPresent = a !== undefined && a !== null;
    const bPresent = b !== undefined && b !== null;
    if (!aPresent && !bPresent)
        return;
    if (!aPresent) {
        out.push({ field, kind: 'added', after: String(b) });
        return;
    }
    if (!bPresent) {
        out.push({ field, kind: 'removed', before: String(a) });
        return;
    }
    if (toComparable(a) === toComparable(b))
        return;
    out.push({ field, kind: 'changed', before: String(a), after: String(b) });
}
function diffArray(out, field, a, b) {
    const setA = new Set(a);
    const setB = new Set(b);
    const added = [...setB].filter((x) => !setA.has(x));
    const removed = [...setA].filter((x) => !setB.has(x));
    if (added.length === 0 && removed.length === 0) {
        if (a.length === b.length && a.every((v, i) => v === b[i]))
            return;
        out.push({ field, kind: 'changed', before: a.join(','), after: b.join(','), summary: `reordered (${a.length} entries)` });
        return;
    }
    out.push({ field, kind: 'changed', summary: `${added.length} added, ${removed.length} removed`, before: removed.join(','), after: added.join(',') });
}
function diffMap(out, field, a, b) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    const added = [];
    const removed = [];
    const changed = [];
    for (const k of keys) {
        const av = a[k];
        const bv = b[k];
        if (av === undefined && bv !== undefined) {
            added.push(`${k}=${bv}`);
            continue;
        }
        if (av !== undefined && bv === undefined) {
            removed.push(`${k}=${av}`);
            continue;
        }
        if (av !== bv)
            changed.push(`${k}: ${av} \u2192 ${bv}`);
    }
    if (added.length === 0 && removed.length === 0 && changed.length === 0)
        return;
    out.push({
        field,
        kind: 'changed',
        summary: `${added.length} added, ${removed.length} removed, ${changed.length} changed`,
        before: removed.join(', '),
        after: [...added, ...changed].join(', '),
    });
}
function toComparable(value) {
    if (value === undefined || value === null)
        return '';
    if (typeof value === 'string')
        return value;
    if (typeof value === 'number')
        return String(value);
    if (typeof value === 'boolean')
        return value ? '1' : '0';
    try {
        return JSON.stringify(value);
    }
    catch {
        return String(value);
    }
}
//# sourceMappingURL=snapshot-diff.js.map