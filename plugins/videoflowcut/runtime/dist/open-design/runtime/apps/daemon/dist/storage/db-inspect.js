// Phase 5 / spec §15.6 / plan §3.GG1 — daemon-DB inspection helper.
//
// Pure helper that walks a SQLite db file + schema and returns a
// structured inventory: file size, table list, per-table row count,
// schema version (the user_version PRAGMA we already use for
// migrations).
//
// Used by:
//   - `od daemon db status` (CLI ops sanity check),
//   - the `od doctor` aggregator (a future patch can fold the
//     summary in without re-implementing the SQLite read).
//
// Pure relative to its inputs: callers pass the SQLite handle +
// the on-disk file path. The function never opens a new
// connection or mutates state.
import { promises as fsp, statSync } from 'node:fs';
const SYSTEM_TABLE_PREFIXES = ['sqlite_', 'better_sqlite3_'];
function isSystemTable(name) {
    return SYSTEM_TABLE_PREFIXES.some((p) => name.startsWith(p));
}
export async function inspectSqliteDatabase(input) {
    const { db, file } = input;
    // 1. Schema version (user_version pragma).
    let schemaVersion = null;
    try {
        const v = db.pragma('user_version', { simple: true });
        schemaVersion = typeof v === 'number' ? v : Number(v);
        if (!Number.isFinite(schemaVersion))
            schemaVersion = null;
    }
    catch {
        schemaVersion = null;
    }
    // 2. Table list with row counts.
    const tables = [];
    try {
        const names = db
            .prepare(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`)
            .all();
        for (const { name } of names) {
            if (isSystemTable(name))
                continue;
            try {
                const safe = sanitizeTableName(name);
                if (!safe)
                    continue;
                const row = db.prepare(`SELECT count(*) AS c FROM "${safe}"`).get();
                tables.push({ name: safe, rowCount: row?.c ?? 0 });
            }
            catch {
                // A malformed view / corrupted table shouldn't fail the
                // whole report; record 0 rows.
                tables.push({ name, rowCount: 0 });
            }
        }
    }
    catch {
        // ignore — empty tables[] surfaces 'cannot read schema' to the
        // caller (CLI shows 0 tables, which is itself a useful signal).
    }
    // 3. File size = primary + -wal + -shm so the number matches du.
    const sizeBytes = await sumFileSizes([file, `${file}-wal`, `${file}-shm`]);
    return {
        kind: 'sqlite',
        location: file,
        sizeBytes,
        schemaVersion,
        tables,
        generatedAt: Date.now(),
    };
}
/**
 * Constant-cost storage snapshot for observability: three header-level
 * pragmas plus two stats. Never scans a table (no count(*), no dbstat), so it
 * is safe to call on startup and under memory pressure. Every field that
 * cannot be read is null, never 0.
 */
export function readSqlitePageStats(input) {
    const { db, file } = input;
    return {
        pageSize: readIntegerPragma(db, 'page_size'),
        pageCount: readIntegerPragma(db, 'page_count'),
        freelistCount: readIntegerPragma(db, 'freelist_count'),
        mainBytes: statFileSizeSync(file),
        walBytes: statFileSizeSync(`${file}-wal`),
    };
}
function readIntegerPragma(db, name) {
    try {
        const value = Number(db.pragma(name, { simple: true }));
        return Number.isSafeInteger(value) && value >= 0 ? value : null;
    }
    catch {
        return null;
    }
}
function statFileSizeSync(path) {
    try {
        return statSync(path).size;
    }
    catch {
        return null;
    }
}
async function sumFileSizes(paths) {
    let total = 0;
    for (const p of paths) {
        try {
            const stat = await fsp.stat(p);
            total += stat.size;
        }
        catch {
            // missing -wal / -shm is normal when the DB hasn't been written
            // since open.
        }
    }
    return total;
}
function sanitizeTableName(name) {
    // Allow ASCII alphanumerics + underscore; SQLite identifier sanity
    // check. Prevents accidental SQL injection if a malicious migration
    // ever invents a hostile table name.
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name))
        return null;
    return name;
}
export function verifySqliteIntegrity(opts) {
    const { db, quick = false } = opts;
    const startedAt = Date.now();
    const issues = [];
    // 1. integrity_check / quick_check.
    const pragma = quick ? 'quick_check' : 'integrity_check';
    try {
        const rows = db.pragma(pragma);
        for (const row of rows) {
            // SQLite returns the string under either `integrity_check`,
            // `quick_check`, or just the first column. Normalise to the
            // first string-valued field.
            const message = (row[pragma] ?? Object.values(row)[0]);
            if (typeof message !== 'string')
                continue;
            if (message.toLowerCase() === 'ok')
                continue;
            issues.push({ kind: 'integrity', message });
        }
    }
    catch (err) {
        issues.push({ kind: 'integrity', message: `pragma ${pragma} threw: ${err.message}` });
    }
    // 2. foreign_key_check.
    try {
        const rows = db.pragma('foreign_key_check');
        for (const row of rows) {
            const tbl = row.table ?? '?';
            const parent = row.parent ?? '?';
            const fkid = row.fkid ?? '?';
            const rowid = row.rowid ?? '?';
            issues.push({
                kind: 'foreign_key',
                message: `FK violation in ${tbl} (rowid=${rowid}) referencing ${parent} (fkid=${fkid})`,
            });
        }
    }
    catch (err) {
        issues.push({ kind: 'foreign_key', message: `pragma foreign_key_check threw: ${err.message}` });
    }
    return {
        ok: issues.length === 0,
        mode: quick ? 'quick_check' : 'integrity_check',
        issues,
        elapsedMs: Date.now() - startedAt,
        generatedAt: Date.now(),
    };
}
//# sourceMappingURL=db-inspect.js.map