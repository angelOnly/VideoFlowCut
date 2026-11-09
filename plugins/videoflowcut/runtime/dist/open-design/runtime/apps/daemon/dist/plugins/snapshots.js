// Snapshot writer. Spec §8.2.1 demands this be the only module that issues
// INSERT/UPDATE against `applied_plugin_snapshots`. Plan §2 names a CI guard
// for the rule; the apply pipeline must never touch the table directly.
//
// Phase 1 ships:
//   - createSnapshot()  — INSERT a fresh row, stamping expires_at via the
//     PB2 unreferenced TTL knob.
//   - getSnapshot()     — read by id.
//   - linkSnapshotToRun() — once a run starts off the snapshot, pin
//     expires_at = NULL and update run_id (the snapshot is now referenced).
//   - markSnapshotStale() — `od plugin doctor` flips status='stale' after a
//     plugin upgrade. We never rewrite the resolved_context_json, so historic
//     reproducibility wins over freshness.
import { randomUUID } from 'node:crypto';
import { readPluginEnvKnobs } from '../app-config.js';
import { OPEN_DESIGN_PLUGIN_SPEC_VERSION, AppliedStrategyBindingV2Schema, } from '@open-design/contracts';
import { strategyPackageHashFromDigests } from '@open-design/plugin-runtime';
export function createSnapshot(db, input) {
    // Validate before issuing INSERT so a malformed internal caller can never
    // persist a row that only fails later at read time.
    const strategy = input.strategy == null
        ? undefined
        : validateStrategyBinding(input.strategy, input.pluginId, input.pluginVersion);
    const id = randomUUID();
    const now = Date.now();
    const knobs = readPluginEnvKnobs();
    // Per PB2: when a snapshot is created without an associated run, stamp an
    // expiry; when a run is already linked, the snapshot is referenced and the
    // GC worker never touches it.
    const expiresAt = input.runId
        ? null
        : knobs.snapshotUnreferencedTtlDays > 0
            ? now + knobs.snapshotUnreferencedTtlDays * 24 * 60 * 60 * 1000
            : null;
    db.prepare(`
    INSERT INTO applied_plugin_snapshots (
      id, project_id, conversation_id, run_id, plugin_id, plugin_spec_version, plugin_version,
      manifest_source_digest, strategy_json, source_marketplace_id, source_marketplace_entry_name,
      source_marketplace_entry_version, marketplace_trust, resolved_source,
      resolved_ref, archive_integrity, pinned_ref, task_kind,
      inputs_json, resolved_context_json, craft_requires_json, pipeline_json, genui_surfaces_json,
      capabilities_granted, capabilities_required, assets_staged_json,
      connectors_required_json, connectors_resolved_json, mcp_servers_json,
      plugin_title, plugin_description, query_text,
      status, applied_at, expires_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'fresh', ?, ?)
  `).run(id, input.projectId, input.conversationId ?? null, input.runId ?? null, input.pluginId, input.pluginSpecVersion ?? OPEN_DESIGN_PLUGIN_SPEC_VERSION, input.pluginVersion, input.manifestSourceDigest, strategy ? JSON.stringify(strategy) : null, input.sourceMarketplaceId ?? null, input.sourceMarketplaceEntryName ?? null, input.sourceMarketplaceEntryVersion ?? null, input.marketplaceTrust ?? null, input.resolvedSource ?? null, input.resolvedRef ?? null, input.archiveIntegrity ?? null, input.pinnedRef ?? null, input.taskKind, JSON.stringify(input.inputs), JSON.stringify(input.resolvedContext), JSON.stringify(input.craftRequires ?? []), input.pipeline ? JSON.stringify(input.pipeline) : null, JSON.stringify(input.genuiSurfaces ?? []), JSON.stringify(input.capabilitiesGranted), JSON.stringify(input.capabilitiesRequired), JSON.stringify(input.assetsStaged), JSON.stringify(input.connectorsRequired), JSON.stringify(input.connectorsResolved), JSON.stringify(input.mcpServers), input.pluginTitle ?? null, input.pluginDescription ?? null, input.query ?? null, now, expiresAt);
    const snapshot = buildSnapshot({
        id,
        appliedAt: now,
        input: { ...input, strategy },
        status: 'fresh',
    });
    return snapshot;
}
export function getSnapshot(db, snapshotId) {
    const row = db.prepare(`SELECT * FROM applied_plugin_snapshots WHERE id = ?`).get(snapshotId);
    if (!row)
        return null;
    return rowToSnapshot(row);
}
export function listSnapshotsForProject(db, projectId) {
    const rows = db
        .prepare(`SELECT * FROM applied_plugin_snapshots WHERE project_id = ? ORDER BY applied_at DESC`)
        .all(projectId);
    return rows.map(rowToSnapshot);
}
export function linkSnapshotToRun(db, snapshotId, runId) {
    db.prepare(`
    UPDATE applied_plugin_snapshots
       SET run_id = ?, expires_at = NULL
     WHERE id = ?
  `).run(runId, snapshotId);
}
// Pin a snapshot to a project row. Mirrors `linkSnapshotToRun` but
// updates `projects.applied_plugin_snapshot_id` (added by `migratePlugins`)
// and also clears `expires_at` because a project-pinned snapshot is now
// referenced (PB2 reproducibility-first). Idempotent — re-linking the
// same id is a no-op.
export function linkSnapshotToProject(db, snapshotId, projectId) {
    db.prepare(`UPDATE applied_plugin_snapshots
        SET project_id = ?, expires_at = NULL
      WHERE id = ?`).run(projectId, snapshotId);
    db.prepare(`UPDATE projects
        SET applied_plugin_snapshot_id = ?
      WHERE id = ?`).run(snapshotId, projectId);
}
export function restoreProjectSnapshotLink(db, projectId, snapshotIdToDiscard, previousSnapshotId, discardedRunId) {
    const previous = typeof previousSnapshotId === 'string' && previousSnapshotId.length > 0
        ? previousSnapshotId
        : null;
    db.prepare(`UPDATE projects
        SET applied_plugin_snapshot_id = ?
      WHERE id = ?
        AND applied_plugin_snapshot_id = ?`).run(previous, projectId, snapshotIdToDiscard);
    const expiry = unreferencedSnapshotExpiry();
    if (typeof discardedRunId === 'string' && discardedRunId.length > 0) {
        const result = db.prepare(`UPDATE applied_plugin_snapshots
          SET run_id = NULL,
              expires_at = ?
        WHERE id = ?
          AND project_id = ?
          AND run_id = ?`).run(expiry, snapshotIdToDiscard, projectId, discardedRunId);
        if (result.changes > 0)
            return;
    }
    db.prepare(`UPDATE applied_plugin_snapshots
        SET expires_at = ?
      WHERE id = ?
        AND run_id IS NULL
        AND project_id = ?`).run(expiry, snapshotIdToDiscard, projectId);
}
function unreferencedSnapshotExpiry() {
    const days = readPluginEnvKnobs().snapshotUnreferencedTtlDays;
    return days > 0 ? Date.now() + days * 24 * 60 * 60 * 1000 : null;
}
// Pin a snapshot to a conversation row. Same shape as
// `linkSnapshotToProject` but mutates `conversations.applied_plugin_snapshot_id`.
// Used when a plugin is applied inside an existing chat composer (§8.4).
export function linkSnapshotToConversation(db, snapshotId, conversationId) {
    db.prepare(`UPDATE applied_plugin_snapshots
        SET conversation_id = ?, expires_at = NULL
      WHERE id = ?`).run(conversationId, snapshotId);
    db.prepare(`UPDATE conversations
        SET applied_plugin_snapshot_id = ?
      WHERE id = ?`).run(snapshotId, conversationId);
}
export function markSnapshotStale(db, snapshotId) {
    db.prepare(`UPDATE applied_plugin_snapshots SET status = 'stale' WHERE id = ?`).run(snapshotId);
}
export function pruneExpiredSnapshots(db, options = {}) {
    const now = options.now ?? Date.now();
    const cutoff = typeof options.before === 'number' ? options.before : now;
    // Older databases can contain a durable StrategyTaskExecution created
    // before task-owned snapshots were pinned. The explicit `before` escape
    // hatch also treats expires_at=NULL/run_id=NULL rows as candidates. Exclude
    // durable task references when the additive task table is present so one
    // protected row cannot make a mixed GC batch fail its foreign-key delete.
    const hasStrategyTaskStore = Boolean(db.prepare(`
    SELECT 1 FROM sqlite_master
     WHERE type = 'table' AND name = 'strategy_task_executions'
  `).get());
    const excludeStrategyTaskSnapshot = hasStrategyTaskStore
        ? `AND NOT EXISTS (
         SELECT 1 FROM strategy_task_executions AS task
          WHERE task.snapshot_id = snapshot.id
       )`
        : '';
    const expiredIds = db
        .prepare(`SELECT snapshot.id FROM applied_plugin_snapshots AS snapshot
        WHERE snapshot.expires_at IS NOT NULL AND snapshot.expires_at <= ?
          ${excludeStrategyTaskSnapshot}`)
        .all(cutoff);
    const beforeIds = typeof options.before === 'number'
        ? db
            .prepare(`SELECT snapshot.id FROM applied_plugin_snapshots AS snapshot
            WHERE snapshot.expires_at IS NULL
              AND snapshot.run_id IS NULL
              AND snapshot.applied_at <= ?
              ${excludeStrategyTaskSnapshot}`)
            .all(options.before)
        : [];
    // Plan §3.M1 — referenced-row TTL.
    //
    // Pull every snapshot whose `applied_at` is older than
    // `now - retentionDays * 86_400_000` and whose `project_id` no
    // longer exists in `projects`. The LEFT JOIN approach lets us run
    // a single query per sweep instead of N project lookups.
    const retentionIds = [];
    if (typeof options.retentionDays === 'number' && options.retentionDays > 0) {
        const retentionCutoff = now - options.retentionDays * 24 * 60 * 60 * 1000;
        const rows = db
            .prepare(`SELECT snapshot.id AS id
           FROM applied_plugin_snapshots AS snapshot
           LEFT JOIN projects p ON p.id = snapshot.project_id
          WHERE snapshot.applied_at <= ?
            AND p.id IS NULL
            ${excludeStrategyTaskSnapshot}`)
            .all(retentionCutoff);
        retentionIds.push(...rows);
    }
    const ids = [...expiredIds, ...beforeIds, ...retentionIds].map((r) => r.id);
    // Dedupe — a row might match both expires_at and retentionDays.
    const unique = Array.from(new Set(ids));
    if (unique.length === 0)
        return { removed: 0, ids: [] };
    const placeholders = unique.map(() => '?').join(', ');
    db.prepare(`DELETE FROM applied_plugin_snapshots WHERE id IN (${placeholders})`).run(...unique);
    return { removed: unique.length, ids: unique };
}
export function countSnapshotsForProject(db, projectId) {
    const row = db.prepare(`SELECT COUNT(*) AS n FROM applied_plugin_snapshots WHERE project_id = ?`).get(projectId);
    return Number(row['n'] ?? 0);
}
function buildSnapshot(args) {
    const { id, appliedAt, input, status } = args;
    const snapshot = {
        snapshotId: id,
        pluginId: input.pluginId,
        pluginSpecVersion: input.pluginSpecVersion ?? OPEN_DESIGN_PLUGIN_SPEC_VERSION,
        pluginVersion: input.pluginVersion,
        manifestSourceDigest: input.manifestSourceDigest,
        ...(input.strategy ? { strategy: input.strategy } : {}),
        sourceMarketplaceId: input.sourceMarketplaceId ?? undefined,
        sourceMarketplaceEntryName: input.sourceMarketplaceEntryName ?? undefined,
        sourceMarketplaceEntryVersion: input.sourceMarketplaceEntryVersion ?? undefined,
        marketplaceTrust: input.marketplaceTrust ?? undefined,
        resolvedSource: input.resolvedSource ?? undefined,
        resolvedRef: input.resolvedRef ?? undefined,
        archiveIntegrity: input.archiveIntegrity ?? undefined,
        pinnedRef: input.pinnedRef ?? undefined,
        inputs: input.inputs,
        resolvedContext: input.resolvedContext,
        craftRequires: input.craftRequires ?? [],
        capabilitiesGranted: input.capabilitiesGranted,
        capabilitiesRequired: input.capabilitiesRequired,
        assetsStaged: input.assetsStaged,
        taskKind: input.taskKind,
        appliedAt,
        connectorsRequired: input.connectorsRequired,
        connectorsResolved: input.connectorsResolved,
        mcpServers: input.mcpServers,
        pipeline: input.pipeline,
        genuiSurfaces: input.genuiSurfaces,
        pluginTitle: input.pluginTitle,
        pluginDescription: input.pluginDescription,
        query: input.query,
        status,
    };
    return snapshot;
}
export function rowToSnapshot(row) {
    const pipeline = parseJsonOrUndefined(row['pipeline_json']);
    const pluginId = String(row['plugin_id']);
    const pluginVersion = String(row['plugin_version']);
    const strategy = parseStrategyBinding(row['strategy_json'], pluginId, pluginVersion);
    const snapshot = {
        snapshotId: String(row['id']),
        pluginId,
        pluginSpecVersion: row['plugin_spec_version'] != null ? String(row['plugin_spec_version']) : undefined,
        pluginVersion,
        manifestSourceDigest: String(row['manifest_source_digest']),
        ...(strategy ? { strategy } : {}),
        sourceMarketplaceId: row['source_marketplace_id'] != null ? String(row['source_marketplace_id']) : undefined,
        sourceMarketplaceEntryName: row['source_marketplace_entry_name'] != null ? String(row['source_marketplace_entry_name']) : undefined,
        sourceMarketplaceEntryVersion: row['source_marketplace_entry_version'] != null ? String(row['source_marketplace_entry_version']) : undefined,
        marketplaceTrust: row['marketplace_trust'] != null ? row['marketplace_trust'] : undefined,
        resolvedSource: row['resolved_source'] != null ? String(row['resolved_source']) : undefined,
        resolvedRef: row['resolved_ref'] != null ? String(row['resolved_ref']) : undefined,
        archiveIntegrity: row['archive_integrity'] != null ? String(row['archive_integrity']) : undefined,
        pinnedRef: row['pinned_ref'] != null ? String(row['pinned_ref']) : undefined,
        inputs: parseJsonOr(row['inputs_json'], {}),
        resolvedContext: parseJsonOr(row['resolved_context_json'], { items: [] }),
        craftRequires: parseJsonOr(row['craft_requires_json'], []),
        capabilitiesGranted: parseJsonOr(row['capabilities_granted'], []),
        capabilitiesRequired: parseJsonOr(row['capabilities_required'], []),
        assetsStaged: parseJsonOr(row['assets_staged_json'], []),
        taskKind: row['task_kind'],
        appliedAt: Number(row['applied_at']),
        connectorsRequired: parseJsonOr(row['connectors_required_json'], []),
        connectorsResolved: parseJsonOr(row['connectors_resolved_json'], []),
        mcpServers: parseJsonOr(row['mcp_servers_json'], []),
        pipeline,
        genuiSurfaces: parseJsonOr(row['genui_surfaces_json'], []),
        pluginTitle: row['plugin_title'] != null ? String(row['plugin_title']) : undefined,
        pluginDescription: row['plugin_description'] != null ? String(row['plugin_description']) : undefined,
        query: row['query_text'] != null ? String(row['query_text']) : undefined,
        status: row['status'] === 'stale' ? 'stale' : 'fresh',
    };
    return snapshot;
}
export class InvalidAppliedStrategySnapshotError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InvalidAppliedStrategySnapshotError';
    }
}
function parseStrategyBinding(value, pluginId, pluginVersion) {
    if (value === undefined || value === null)
        return undefined;
    if (typeof value !== 'string') {
        throw new InvalidAppliedStrategySnapshotError('Applied strategy binding must be JSON text.');
    }
    let parsed;
    try {
        parsed = JSON.parse(value);
    }
    catch {
        throw new InvalidAppliedStrategySnapshotError('Applied strategy binding contains invalid JSON.');
    }
    return validateStrategyBinding(parsed, pluginId, pluginVersion);
}
function validateStrategyBinding(value, pluginId, pluginVersion) {
    const binding = AppliedStrategyBindingV2Schema.safeParse(value);
    if (!binding.success) {
        throw new InvalidAppliedStrategySnapshotError('Applied strategy binding failed schema validation.');
    }
    let recomputed;
    try {
        recomputed = strategyPackageHashFromDigests(binding.data.assetDigests);
    }
    catch {
        throw new InvalidAppliedStrategySnapshotError('Applied strategy digest roster is invalid.');
    }
    if (recomputed !== binding.data.packageHash) {
        throw new InvalidAppliedStrategySnapshotError('Applied strategy package hash does not match its asset digests.');
    }
    if (binding.data.id !== pluginId || binding.data.version !== pluginVersion) {
        throw new InvalidAppliedStrategySnapshotError('Applied strategy binding does not match the snapshot plugin identity.');
    }
    return binding.data;
}
function parseJsonOr(value, fallback) {
    if (typeof value !== 'string' || value.length === 0)
        return fallback;
    try {
        return JSON.parse(value);
    }
    catch {
        return fallback;
    }
}
function parseJsonOrUndefined(value) {
    if (typeof value !== 'string' || value.length === 0)
        return undefined;
    try {
        return JSON.parse(value);
    }
    catch {
        return undefined;
    }
}
//# sourceMappingURL=snapshots.js.map