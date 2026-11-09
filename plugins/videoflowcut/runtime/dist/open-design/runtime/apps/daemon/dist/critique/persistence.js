import { CRITIQUE_RUN_STATUSES, } from '@open-design/contracts/critique';
/**
 * Re-export the public contract types and enumeration so existing
 * daemon-side imports (`./persistence.js`) keep working unchanged. The
 * canonical definitions live in `@open-design/contracts/critique` so the
 * web layer can consume the same shapes and the same display order
 * through the rerun / history endpoints (AGENTS.md requirement that
 * shared API DTOs live in packages/contracts).
 *
 * `CritiquePersistedStatus` extends `CritiqueRunStatus` with the in-flight
 * `'running'` value so DB-row types can be precisely typed without inline
 * `as X | 'running'` widens at every call site (lefarcen P2 on PR #1016).
 * Public DTOs continue to use the terminal-only `CritiqueRunStatus` so a
 * future endpoint cannot leak a 'running' row through the wire.
 */
export { CRITIQUE_RUN_STATUSES };
// All values accepted by the DB CHECK constraint, derived from the
// CritiquePersistedStatus union so this set never drifts from the type.
const ALL_VALID_STATUSES = new Set([
    ...CRITIQUE_RUN_STATUSES,
    'running',
]);
function serializeRoundsPayload(rounds, recoveryReason) {
    if (recoveryReason === undefined) {
        // Store a plain array when no envelope fields are needed, so reads
        // handle both formats gracefully.
        return JSON.stringify(rounds);
    }
    const payload = { rounds, recoveryReason };
    return JSON.stringify(payload);
}
function parseRoundsPayload(json) {
    try {
        const parsed = JSON.parse(json);
        if (Array.isArray(parsed)) {
            return { rounds: parsed };
        }
        if (parsed !== null && typeof parsed === 'object') {
            const obj = parsed;
            const rounds = Array.isArray(obj['rounds'])
                ? obj['rounds']
                : [];
            if (typeof obj['recoveryReason'] === 'string') {
                return { rounds, recoveryReason: obj['recoveryReason'] };
            }
            return { rounds };
        }
        return { rounds: [] };
    }
    catch {
        return { rounds: [] };
    }
}
function normalizeRow(raw) {
    const { rounds } = parseRoundsPayload(raw.roundsJson);
    return {
        id: raw.id,
        projectId: raw.projectId,
        conversationId: raw.conversationId,
        artifactPath: raw.artifactPath,
        status: raw.status,
        score: raw.score,
        rounds,
        transcriptPath: raw.transcriptPath,
        protocolVersion: Number(raw.protocolVersion),
        createdAt: Number(raw.createdAt),
        updatedAt: Number(raw.updatedAt),
    };
}
const COLS = `
  id,
  project_id     AS projectId,
  conversation_id AS conversationId,
  artifact_path  AS artifactPath,
  status,
  score,
  rounds_json    AS roundsJson,
  transcript_path AS transcriptPath,
  protocol_version AS protocolVersion,
  created_at     AS createdAt,
  updated_at     AS updatedAt
`;
/**
 * Idempotent. Creates the critique_runs table and the supporting indexes if
 * they don't exist. Safe to call from the existing migrate(db) flow on every
 * daemon boot.
 */
export function migrateCritique(db) {
    db.exec(`
    CREATE TABLE IF NOT EXISTS critique_runs (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      conversation_id TEXT,
      artifact_path TEXT,
      status TEXT NOT NULL CHECK (status IN
        ('shipped','below_threshold','timed_out','interrupted','degraded','failed','legacy','running')),
      score REAL,
      rounds_json TEXT NOT NULL DEFAULT '[]',
      transcript_path TEXT,
      protocol_version INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_critique_runs_project
      ON critique_runs(project_id, updated_at DESC);

    CREATE INDEX IF NOT EXISTS idx_critique_runs_status
      ON critique_runs(status);
  `);
}
export function insertCritiqueRun(db, input) {
    if (!ALL_VALID_STATUSES.has(input.status)) {
        throw new RangeError(`Invalid critique run status: "${input.status}". Must be one of: ${[...ALL_VALID_STATUSES].join(', ')}`);
    }
    const now = Date.now();
    const rounds = input.rounds ?? [];
    db.prepare(`INSERT INTO critique_runs
       (id, project_id, conversation_id, artifact_path, status, score,
        rounds_json, transcript_path, protocol_version, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(input.id, input.projectId, input.conversationId ?? null, input.artifactPath ?? null, input.status, input.score ?? null, serializeRoundsPayload(rounds), input.transcriptPath ?? null, input.protocolVersion, input.createdAt ?? now, input.updatedAt ?? now);
    const row = getCritiqueRun(db, input.id);
    if (row === null) {
        throw new Error(`Failed to fetch critique run after insert: ${input.id}`);
    }
    return row;
}
export function getCritiqueRun(db, id) {
    const raw = db
        .prepare(`SELECT ${COLS} FROM critique_runs WHERE id = ?`)
        .get(id);
    return raw !== undefined ? normalizeRow(raw) : null;
}
/**
 * Updates the patch fields on an existing run. Returns the new row, or null
 * when the id does not exist. Always updates updated_at.
 */
export function updateCritiqueRun(db, id, patch) {
    const existing = getCritiqueRun(db, id);
    if (existing === null)
        return null;
    const now = Date.now();
    const updatedAt = patch.updatedAt ?? now;
    const status = patch.status ?? existing.status;
    const score = 'score' in patch ? patch.score ?? null : existing.score;
    const rounds = patch.rounds ?? existing.rounds;
    const transcriptPath = 'transcriptPath' in patch
        ? patch.transcriptPath ?? null
        : existing.transcriptPath;
    const artifactPath = 'artifactPath' in patch
        ? patch.artifactPath ?? null
        : existing.artifactPath;
    db.prepare(`UPDATE critique_runs
        SET status = ?,
            score = ?,
            rounds_json = ?,
            transcript_path = ?,
            artifact_path = ?,
            updated_at = ?
      WHERE id = ?`).run(status, score, serializeRoundsPayload(rounds), transcriptPath, artifactPath, updatedAt, id);
    return getCritiqueRun(db, id);
}
export function listCritiqueRunsByProject(db, projectId) {
    const rows = db
        .prepare(`SELECT ${COLS}
         FROM critique_runs
        WHERE project_id = ?
        ORDER BY updated_at DESC`)
        .all(projectId);
    return rows.map(normalizeRow);
}
export function deleteCritiqueRun(db, id) {
    db.prepare(`DELETE FROM critique_runs WHERE id = ?`).run(id);
}
/**
 * Marks a single 'running' row as 'interrupted' with the supplied
 * recoveryReason embedded in rounds_json. Mirror of the per-row write in
 * reconcileStaleRuns(), kept as its own function so the interrupt endpoint
 * can use it when a request arrives for a row that has no live
 * AbortController in the registry (the post-daemon-restart window before
 * reconcileStaleRuns considers the row old enough). Atomic on the
 * status='running' guard so a row that just transitioned to a different
 * terminal state is not overwritten.
 *
 * Returns true when a row was mutated, false when the id was missing or
 * not in 'running' status.
 */
export function markRunInterruptedRecovery(db, id, recoveryReason, now = Date.now()) {
    const existing = db
        .prepare(`SELECT ${COLS} FROM critique_runs WHERE id = ? AND status = 'running'`)
        .get(id);
    if (existing === undefined)
        return false;
    const { rounds } = parseRoundsPayload(existing.roundsJson);
    const newPayload = serializeRoundsPayload(rounds, recoveryReason);
    const result = db
        .prepare(`UPDATE critique_runs
          SET status = 'interrupted',
              rounds_json = ?,
              updated_at = ?
        WHERE id = ? AND status = 'running'`)
        .run(newPayload, now, id);
    return result.changes > 0;
}
/**
 * Recovery scan called on daemon boot: any run still in a non-terminal status
 * older than staleAfterMs is marked 'interrupted' with rounds_json.recoveryReason
 * = 'daemon_restart'. Returns the count of rows mutated.
 */
export function reconcileStaleRuns(db, options) {
    const now = options.now ?? Date.now();
    const cutoff = now - options.staleAfterMs;
    const reconcile = db.transaction(() => {
        const staleRows = db
            .prepare(`SELECT ${COLS}
           FROM critique_runs
          WHERE status = 'running'
            AND updated_at < ?`)
            .all(cutoff);
        if (staleRows.length === 0)
            return 0;
        const update = db.prepare(`UPDATE critique_runs
          SET status = 'interrupted',
              rounds_json = ?,
              updated_at = ?
        WHERE id = ?`);
        for (const raw of staleRows) {
            const { rounds } = parseRoundsPayload(raw.roundsJson);
            const newPayload = serializeRoundsPayload(rounds, 'daemon_restart');
            update.run(newPayload, now, raw.id);
        }
        return staleRows.length;
    });
    return reconcile();
}
//# sourceMappingURL=persistence.js.map