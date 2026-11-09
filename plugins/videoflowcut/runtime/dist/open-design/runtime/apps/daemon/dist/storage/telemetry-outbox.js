import { createHash } from 'node:crypto';
import Database from 'better-sqlite3';
/** Additive, bounded evidence storage. Product tables and live files are never mutated. */
export class TelemetryOutbox {
    budget;
    db;
    constructor(filename, budget = { bytes: 512 * 1024 * 1024, jobs: 10_000, attempts: 8, ttlMs: 7 * 24 * 3600_000 }) {
        this.budget = budget;
        this.db = new Database(filename);
        this.db.pragma('journal_mode = WAL');
        this.db.pragma('busy_timeout = 1000');
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS telemetry_task_object_reasons_v1 (task_trace_id TEXT PRIMARY KEY, reason_keys TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS telemetry_snapshots_v1 (sha256 TEXT PRIMARY KEY, body BLOB NOT NULL, size_bytes INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS telemetry_object_outbox_v1 (
        key TEXT PRIMARY KEY, kind TEXT NOT NULL, payload TEXT NOT NULL, bytes INTEGER NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, next_attempt_at INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'queued', last_reason TEXT, receipt TEXT);
      CREATE TABLE IF NOT EXISTS telemetry_feedback_outbox_v1 (
        key TEXT PRIMARY KEY, kind TEXT NOT NULL, payload TEXT NOT NULL, bytes INTEGER NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, next_attempt_at INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'queued', last_reason TEXT, receipt TEXT);
    `);
    }
    table(kind) { return kind === 'object' ? 'telemetry_object_outbox_v1' : 'telemetry_feedback_outbox_v1'; }
    enqueue(kind, key, payload, snapshots = [], now = Date.now()) {
        return this.db.transaction(() => {
            const table = this.table(kind);
            if (this.db.prepare(`SELECT key FROM ${table} WHERE key = ?`).get(key))
                return 'existing';
            const serialized = JSON.stringify(payload);
            const bodies = new Map(snapshots.map(body => [createHash('sha256').update(body).digest('hex'), body]));
            const missing = [...bodies].filter(([sha]) => !this.db.prepare('SELECT sha256 FROM telemetry_snapshots_v1 WHERE sha256 = ?').get(sha));
            const total = this.stats();
            const bytes = Buffer.byteLength(serialized);
            if (total.bytes + bytes + missing.reduce((sum, [, body]) => sum + body.length, 0) > this.budget.bytes || total.jobs >= this.budget.jobs)
                return 'capacity_exceeded';
            for (const [sha, body] of missing)
                this.db.prepare('INSERT INTO telemetry_snapshots_v1 VALUES (?, ?, ?)').run(sha, body, body.length);
            if (kind === 'feedback') {
                const runId = payload?.context?.runId;
                if (runId)
                    this.db.prepare(`UPDATE ${table} SET status = 'superseded', last_reason = 'newer_feedback' WHERE json_extract(payload, '$.context.runId') = ? AND status IN ('queued', 'accepted')`).run(runId);
            }
            this.db.prepare(`INSERT INTO ${table} (key, kind, payload, bytes, created_at, next_attempt_at) VALUES (?, ?, ?, ?, ?, ?)`).run(key, kind, serialized, bytes, now, now);
            return 'queued';
        })();
    }
    snapshot(sha256) {
        const row = this.db.prepare('SELECT body FROM telemetry_snapshots_v1 WHERE sha256 = ?').get(sha256);
        if (!row || createHash('sha256').update(row.body).digest('hex') !== sha256)
            throw new Error('snapshot_integrity_error');
        return row.body;
    }
    stats() {
        const tables = ['telemetry_object_outbox_v1', 'telemetry_feedback_outbox_v1'];
        const result = { jobs: 0, bytes: 0, pending: 0 };
        for (const table of tables) {
            const r = this.db.prepare(`SELECT count(*) AS jobs, coalesce(sum(bytes), 0) AS bytes, coalesce(sum(status IN ('queued', 'accepted')), 0) AS pending FROM ${table}`).get();
            result.jobs += r.jobs;
            result.bytes += r.bytes;
            result.pending += r.pending;
        }
        result.bytes += this.db.prepare('SELECT coalesce(sum(size_bytes), 0) AS bytes FROM telemetry_snapshots_v1').get().bytes;
        return result;
    }
    inspect(kind, key) {
        return this.db.prepare(`SELECT status, attempts, last_reason FROM ${this.table(kind)} WHERE key = ?`).get(key);
    }
    read(kind, key) {
        const row = this.db.prepare(`SELECT payload, receipt FROM ${this.table(kind)} WHERE key = ?`).get(key);
        return row ? { payload: JSON.parse(row.payload), receipt: row.receipt ? JSON.parse(row.receipt) : undefined } : undefined;
    }
    checkpointReceipt(kind, key, receipt) {
        this.db.prepare(`UPDATE ${this.table(kind)} SET receipt = ? WHERE key = ?`).run(JSON.stringify(receipt), key);
    }
    objectJobsForTask(taskTraceId) {
        return this.db.prepare(`SELECT key, payload, receipt FROM telemetry_object_outbox_v1 WHERE json_extract(payload, '$.taskTraceId') = ? ORDER BY created_at, key`).all(taskTraceId);
    }
    objectJobsForConversation(projectId, conversationId) {
        return this.db.prepare(`SELECT payload FROM telemetry_object_outbox_v1 WHERE json_extract(payload, '$.context.projectId') = ? AND json_extract(payload, '$.context.conversationId') = ? ORDER BY created_at, key`).all(projectId, conversationId);
    }
    /** Preserve published reason keys so a later empty map can explicitly clear remote deep merges. */
    rememberTaskObjectReasons(taskTraceId, currentKeys) {
        const previous = this.db.prepare('SELECT reason_keys FROM telemetry_task_object_reasons_v1 WHERE task_trace_id = ?').get(taskTraceId);
        const keys = [...new Set([...(previous ? JSON.parse(previous.reason_keys) : []), ...currentKeys])].sort();
        this.db.prepare('INSERT INTO telemetry_task_object_reasons_v1 VALUES (?, ?) ON CONFLICT(task_trace_id) DO UPDATE SET reason_keys = excluded.reason_keys').run(taskTraceId, JSON.stringify(keys));
        return keys;
    }
    draining;
    async drain(deliver, now = Date.now()) {
        // Callers need committed receipts, not an early return while another Run uploads.
        // After joining, take a fresh bounded pass for jobs enqueued during that upload.
        while (this.draining)
            await this.draining;
        const pass = this.drainPass(deliver, now);
        this.draining = pass;
        try {
            await pass;
        }
        finally {
            this.draining = undefined;
        }
    }
    async drainPass(deliver, now) {
        for (const kind of ['object', 'feedback']) {
            const table = this.table(kind);
            const retryable = kind === 'feedback' ? "('queued')" : "('queued', 'accepted')";
            const jobs = this.db.prepare(`SELECT key, kind, payload, attempts, created_at AS createdAt FROM ${table} WHERE status IN ${retryable} AND next_attempt_at <= ? ORDER BY created_at LIMIT 20`).all(now);
            for (const job of jobs) {
                if (!['queued', 'accepted'].includes(this.inspect(kind, job.key)?.status ?? ''))
                    continue;
                if (job.attempts >= this.budget.attempts || now - job.createdAt >= this.budget.ttlMs) {
                    this.db.prepare(`UPDATE ${table} SET status = 'terminal', last_reason = ? WHERE key = ?`).run('retry_budget_exhausted', job.key);
                    continue;
                }
                // Persist the attempt before crossing the network; a crash keeps the same key/snapshot.
                const next = now + Math.min(300_000, 1000 * 2 ** job.attempts);
                this.db.prepare(`UPDATE ${table} SET attempts = attempts + 1, next_attempt_at = ? WHERE key = ?`).run(next, job.key);
                let result;
                try {
                    result = await deliver(job);
                }
                catch {
                    result = { status: 'retry', reason: 'network_error' };
                }
                this.db.prepare(`UPDATE ${table} SET status = ?, last_reason = ?, receipt = coalesce(?, receipt) WHERE key = ? AND status IN ('queued', 'accepted')`).run(result.status === 'retry' ? 'queued' : result.status, result.reason ?? null, result.receipt ? JSON.stringify(result.receipt) : null, job.key);
            }
        }
    }
    close() { this.db.close(); }
}
//# sourceMappingURL=telemetry-outbox.js.map