// Content-free storage summary for one run, attached to `run_finished`.
//
// Every measurement is an `octet_length` computed inside SQLite, so no stored
// text is copied into the JS heap — the very pressure this summary exists to
// explain. Each query is isolated: a missing table (lightweight test adapters,
// databases migrated before append-only batches) or any other failure omits
// only that group of fields. Nothing here can throw to the caller.
export function readRunStorageAnalytics(db, input) {
    const out = {};
    const messageId = input.assistantMessageId;
    if (typeof messageId === 'string' && messageId.length > 0) {
        const message = getRow(db, `SELECT octet_length(events_json) AS eventsBytes, octet_length(content) AS contentBytes
         FROM messages WHERE id = ?`, messageId);
        if (message) {
            assignCount(out, 'storage_events_json_bytes', message.eventsBytes);
            assignCount(out, 'storage_content_bytes', message.contentBytes);
        }
        const batches = getRow(db, `SELECT count(*) AS batchCount, COALESCE(sum(octet_length(events_json)), 0) AS batchBytes
         FROM message_event_batches WHERE message_id = ?`, messageId);
        if (batches) {
            assignCount(out, 'storage_pending_batch_count', batches.batchCount);
            assignCount(out, 'storage_pending_batch_bytes', batches.batchBytes);
        }
    }
    // Keyed by initial_run_id, so only a task's first run reports the shared
    // prompt bundle; resumed runs of the same task find no row.
    const prompt = getRow(db, `SELECT prompt_bundle_utf8_bytes AS promptBytes
       FROM strategy_task_executions WHERE initial_run_id = ? LIMIT 1`, input.runId);
    if (prompt)
        assignCount(out, 'storage_prompt_bundle_bytes', prompt.promptBytes);
    if (Object.keys(out).length > 0)
        out.storage_schema_version = 1;
    return out;
}
function getRow(db, sql, param) {
    try {
        const row = db.prepare(sql).get(param);
        return row && typeof row === 'object' ? row : null;
    }
    catch {
        return null;
    }
}
function assignCount(out, key, value) {
    if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) {
        out[key] = value;
    }
}
//# sourceMappingURL=run-storage-analytics.js.map