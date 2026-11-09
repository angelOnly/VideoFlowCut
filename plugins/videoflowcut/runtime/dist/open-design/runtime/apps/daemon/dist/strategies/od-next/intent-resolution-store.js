import { createHash } from 'node:crypto';
const WRITE_EVIDENCE_SOURCES = { filesystem: 1, tool_stream: 2, unknown: 4 };
const conflict = () => new Error('Strategy task revision changed while applying the transition.');
export const intentResolutionDigest = (text) => createHash('sha256').update(text, 'utf8').digest('hex');
export function migrateIntentResolutionStore(db) {
    db.exec(`
    CREATE TABLE IF NOT EXISTS strategy_task_intent_resolution (
      task_execution_id TEXT PRIMARY KEY REFERENCES strategy_task_executions(task_execution_id) ON DELETE CASCADE,
      version INTEGER NOT NULL CHECK(version = 1),
      state TEXT NOT NULL CHECK(state IN ('unresolved','claimed','started','resolved','failed')),
      attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts IN (0,1)),
      run_id TEXT UNIQUE,
      source_run_id TEXT,
      source_result_json TEXT,
      source_result_sha256 TEXT,
      reply_json TEXT,
      reply_sha256 TEXT
    );
    CREATE TABLE IF NOT EXISTS strategy_task_run_write_evidence (
      task_execution_id TEXT NOT NULL REFERENCES strategy_task_executions(task_execution_id) ON DELETE CASCADE,
      run_id TEXT NOT NULL,
      files_written INTEGER NOT NULL CHECK(files_written >= 0),
      unknown INTEGER NOT NULL CHECK(unknown IN (0,1)),
      source_mask INTEGER NOT NULL CHECK(source_mask BETWEEN 1 AND 7),
      PRIMARY KEY(task_execution_id, run_id),
      FOREIGN KEY(run_id) REFERENCES strategy_task_runs(run_id)
    );
  `);
}
export function readIntentResolution(db, taskExecutionId) {
    const row = db.prepare(`SELECT version, state, attempts, run_id AS runId, source_run_id AS sourceRunId,
    source_result_json AS sourceResultJson, source_result_sha256 AS sourceResultSha256,
    reply_json AS replyJson, reply_sha256 AS replySha256
    FROM strategy_task_intent_resolution WHERE task_execution_id = ?`).get(taskExecutionId);
    if (!row)
        return null;
    if (row.version !== 1 || !['unresolved', 'claimed', 'started', 'resolved', 'failed'].includes(row.state)
        || ![0, 1].includes(row.attempts)
        || (row.attempts === 0 && (row.runId !== null || row.sourceRunId !== null || !['unresolved', 'resolved'].includes(row.state)))
        || (row.attempts === 1 && (!row.runId || !row.sourceRunId || !row.sourceResultJson || !row.sourceResultSha256 || row.state === 'unresolved'))
        || (row.sourceResultJson !== null && intentResolutionDigest(row.sourceResultJson) !== row.sourceResultSha256)
        || (row.replyJson !== null && intentResolutionDigest(row.replyJson) !== row.replySha256)
        || (row.replyJson === null && row.replySha256 !== null)
        || (row.attempts === 0 && (row.sourceResultJson !== null || row.sourceResultSha256 !== null || row.replyJson !== null))
        || (row.state === 'claimed' && row.replyJson !== null)
        || (row.state === 'resolved' && row.attempts === 1 && row.replyJson === null))
        throw conflict();
    return row;
}
/** Every observation belongs to an existing physical mapping. Positive/unknown evidence is sticky. */
export function recordStrategyRunWriteEvidence(db, input) {
    if (!Number.isSafeInteger(input.filesWritten) || input.filesWritten < 0
        || !(input.source in WRITE_EVIDENCE_SOURCES) || (input.source === 'unknown' && !input.unknown))
        throw conflict();
    if (!db.prepare(`SELECT 1 FROM strategy_task_runs WHERE task_execution_id = ? AND run_id = ?`)
        .get(input.taskExecutionId, input.runId))
        throw conflict();
    db.prepare(`INSERT INTO strategy_task_run_write_evidence(task_execution_id, run_id, files_written, unknown, source_mask)
    VALUES (?, ?, ?, ?, ?) ON CONFLICT(task_execution_id, run_id) DO UPDATE SET
    files_written = MAX(files_written, excluded.files_written), unknown = MAX(unknown, excluded.unknown),
    source_mask = source_mask | excluded.source_mask`)
        .run(input.taskExecutionId, input.runId, input.filesWritten, input.unknown ? 1 : 0, WRITE_EVIDENCE_SOURCES[input.source]);
}
export function readStrategyTaskWriteEvidence(db, taskExecutionId) {
    const rows = db.prepare(`SELECT r.run_id AS runId, e.files_written AS filesWritten, e.unknown AS unknown, e.source_mask AS sourceMask
    FROM strategy_task_runs r LEFT JOIN strategy_task_run_write_evidence e
      ON e.task_execution_id = r.task_execution_id AND e.run_id = r.run_id
    WHERE r.task_execution_id = ? ORDER BY r.task_run_index`).all(taskExecutionId);
    return rows.map(row => ({
        runId: row.runId, filesWritten: row.filesWritten, unknown: row.unknown !== 0,
        sources: Object.keys(WRITE_EVIDENCE_SOURCES).filter(source => ((row.sourceMask ?? 4) & WRITE_EVIDENCE_SOURCES[source]) !== 0),
    }));
}
export function failIntentResolutionRecord(db, taskExecutionId) {
    db.prepare(`UPDATE strategy_task_intent_resolution SET state='failed'
    WHERE task_execution_id=? AND state IN ('claimed','started')`).run(taskExecutionId);
}
//# sourceMappingURL=intent-resolution-store.js.map