import type Database from 'better-sqlite3';
type SqliteDb = Database.Database;
export interface DaemonDbTableInfo {
    name: string;
    rowCount: number;
}
export interface DaemonDbStatusReport {
    kind: 'sqlite' | 'postgres';
    location: string;
    sizeBytes: number;
    schemaVersion: number | null;
    tables: DaemonDbTableInfo[];
    generatedAt: number;
}
export declare function inspectSqliteDatabase(input: {
    db: SqliteDb;
    file: string;
}): Promise<DaemonDbStatusReport>;
export interface SqlitePageStats {
    pageSize: number | null;
    pageCount: number | null;
    freelistCount: number | null;
    mainBytes: number | null;
    walBytes: number | null;
}
/**
 * Constant-cost storage snapshot for observability: three header-level
 * pragmas plus two stats. Never scans a table (no count(*), no dbstat), so it
 * is safe to call on startup and under memory pressure. Every field that
 * cannot be read is null, never 0.
 */
export declare function readSqlitePageStats(input: {
    db: SqliteDb;
    file: string;
}): SqlitePageStats;
export type DbIntegrityIssueKind = 'integrity' | 'foreign_key';
export interface DbIntegrityIssue {
    kind: DbIntegrityIssueKind;
    message: string;
}
export interface DbIntegrityReport {
    ok: boolean;
    mode: 'integrity_check' | 'quick_check';
    issues: DbIntegrityIssue[];
    elapsedMs: number;
    generatedAt: number;
}
export interface VerifyDbOptions {
    db: SqliteDb;
    quick?: boolean;
}
export declare function verifySqliteIntegrity(opts: VerifyDbOptions): DbIntegrityReport;
export {};
