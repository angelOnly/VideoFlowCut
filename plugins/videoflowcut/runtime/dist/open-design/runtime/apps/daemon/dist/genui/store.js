// GenUI surface persisted state writer (spec §10.3.3 / §11.4).
//
// Sole module that mutates the `genui_surfaces` table. F8 cross-conversation
// cache is implemented here: callers ask `lookupResolved()` before issuing a
// `request()`; on a hit at the matching tier with a matching schema digest
// and unexpired row, the daemon short-circuits with `respondedBy: 'cache'`
// and never broadcasts. Callers must NOT issue `INSERT/UPDATE` against
// `genui_surfaces` from anywhere else — the F8 invariant relies on a single
// writer.
import { randomUUID } from 'node:crypto';
function rowFromDb(row) {
    return {
        id: row.id,
        projectId: row.project_id,
        conversationId: row.conversation_id,
        runId: row.run_id,
        pluginSnapshotId: row.plugin_snapshot_id,
        surfaceId: row.surface_id,
        kind: row.kind,
        persist: row.persist,
        schemaDigest: row.schema_digest,
        value: row.value_json ? JSON.parse(row.value_json) : null,
        status: row.status,
        respondedBy: row.responded_by ?? null,
        requestedAt: row.requested_at,
        respondedAt: row.responded_at,
        expiresAt: row.expires_at,
    };
}
// Insert a freshly-requested surface row in `pending` status. Returns the
// stored row. Callers should always check `lookupResolved()` first to honor
// the F8 cross-conversation cache.
export function requestSurface(db, input) {
    const id = randomUUID();
    const now = Date.now();
    const conversationId = input.conversationId ?? null;
    const runId = input.runId ?? null;
    db.prepare(`INSERT INTO genui_surfaces (
       id, project_id, conversation_id, run_id, plugin_snapshot_id,
       surface_id, kind, persist, schema_digest, value_json, status,
       responded_by, requested_at, responded_at, expires_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 'pending', NULL, ?, NULL, ?)`).run(id, input.projectId, conversationId, runId, input.pluginSnapshotId, input.surfaceId, input.kind, input.persist, input.schemaDigest ?? null, now, input.expiresAt ?? null);
    const row = db.prepare(`SELECT * FROM genui_surfaces WHERE id = ?`).get(id);
    return rowFromDb(row);
}
export function respondSurface(db, input) {
    const now = Date.now();
    db.prepare(`UPDATE genui_surfaces
        SET value_json   = ?,
            status       = 'resolved',
            responded_by = ?,
            responded_at = ?,
            expires_at   = COALESCE(?, expires_at)
      WHERE id = ?`).run(JSON.stringify(input.value ?? null), input.respondedBy, now, input.expiresAt ?? null, input.rowId);
    const row = db.prepare(`SELECT * FROM genui_surfaces WHERE id = ?`).get(input.rowId);
    if (!row)
        throw new Error(`genui_surfaces row ${input.rowId} disappeared after respond`);
    return rowFromDb(row);
}
// Pre-answer a surface (spec §10.3.4 `od ui prefill`). Writes a row in
// `resolved` state without a prior `pending` row; subsequent
// `lookupResolved()` will hit the cache and skip the broadcast.
export function prefillSurface(db, input) {
    const id = randomUUID();
    const now = Date.now();
    db.prepare(`INSERT INTO genui_surfaces (
       id, project_id, conversation_id, run_id, plugin_snapshot_id,
       surface_id, kind, persist, schema_digest, value_json, status,
       responded_by, requested_at, responded_at, expires_at
     ) VALUES (?, ?, NULL, NULL, ?, ?, ?, ?, ?, ?, 'resolved', 'auto', ?, ?, ?)`).run(id, input.projectId, input.pluginSnapshotId, input.surfaceId, input.kind, input.persist, input.schemaDigest ?? null, JSON.stringify(input.value ?? null), now, now, input.expiresAt ?? null);
    const row = db.prepare(`SELECT * FROM genui_surfaces WHERE id = ?`).get(id);
    return rowFromDb(row);
}
// F8: lookup an existing resolved surface answer at the right tier.
// Returns null when the cache misses; the caller should then `requestSurface()`.
export function lookupResolved(db, args) {
    const now = args.now ?? Date.now();
    let row;
    if (args.persist === 'project') {
        row = db.prepare(`SELECT * FROM genui_surfaces
        WHERE project_id = ? AND surface_id = ? AND status = 'resolved'
        ORDER BY responded_at DESC LIMIT 1`).get(args.projectId, args.surfaceId);
    }
    else if (args.persist === 'conversation') {
        if (!args.conversationId)
            return null;
        row = db.prepare(`SELECT * FROM genui_surfaces
        WHERE conversation_id = ? AND surface_id = ? AND status = 'resolved'
        ORDER BY responded_at DESC LIMIT 1`).get(args.conversationId, args.surfaceId);
    }
    else {
        // 'run' tier never crosses runs; cache lookup is meaningless.
        return null;
    }
    if (!row)
        return null;
    if (row.expires_at !== null && row.expires_at <= now) {
        invalidateRow(db, row.id);
        return null;
    }
    if (args.schemaDigest !== undefined && args.schemaDigest !== null) {
        if (row.schema_digest !== null && row.schema_digest !== args.schemaDigest) {
            invalidateRow(db, row.id);
            return null;
        }
    }
    return rowFromDb(row);
}
// Cross-conversation revoke (spec §10.3.3 user revoke). Flips the row to
// `invalidated`; subsequent lookups miss and the next run re-asks the user.
export function revokeSurface(db, args) {
    const info = db.prepare(`UPDATE genui_surfaces
        SET status = 'invalidated', responded_by = COALESCE(responded_by, 'user')
      WHERE project_id = ? AND surface_id = ? AND status != 'invalidated'`).run(args.projectId, args.surfaceId);
    return Number(info.changes ?? 0);
}
export function markTimeout(db, rowId) {
    db.prepare(`UPDATE genui_surfaces SET status = 'timeout' WHERE id = ? AND status = 'pending'`).run(rowId);
    const row = db.prepare(`SELECT * FROM genui_surfaces WHERE id = ?`).get(rowId);
    return row ? rowFromDb(row) : null;
}
export function listSurfacesForRun(db, runId) {
    const rows = db.prepare(`SELECT * FROM genui_surfaces WHERE run_id = ? ORDER BY requested_at ASC`).all(runId);
    return rows.map(rowFromDb);
}
export function listSurfacesForProject(db, projectId) {
    const rows = db.prepare(`SELECT * FROM genui_surfaces WHERE project_id = ? ORDER BY requested_at DESC`).all(projectId);
    return rows.map(rowFromDb);
}
export function getSurface(db, rowId) {
    const row = db.prepare(`SELECT * FROM genui_surfaces WHERE id = ?`).get(rowId);
    return row ? rowFromDb(row) : null;
}
export function findPendingByRunAndSurfaceId(db, args) {
    const row = db.prepare(`SELECT * FROM genui_surfaces
      WHERE run_id = ? AND surface_id = ? AND status = 'pending'
      ORDER BY requested_at DESC LIMIT 1`).get(args.runId, args.surfaceId);
    return row ? rowFromDb(row) : null;
}
function invalidateRow(db, rowId) {
    db.prepare(`UPDATE genui_surfaces SET status = 'invalidated' WHERE id = ?`).run(rowId);
}
//# sourceMappingURL=store.js.map