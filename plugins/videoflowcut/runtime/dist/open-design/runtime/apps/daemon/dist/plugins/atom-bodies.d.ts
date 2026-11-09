import type Database from 'better-sqlite3';
type SqliteDb = Database.Database;
export interface AtomBodyEntry {
    atomId: string;
    pluginId: string;
    body: string;
}
export declare function loadAtomBodies(db: SqliteDb, atomIds: ReadonlyArray<string>): Promise<AtomBodyEntry[]>;
/**
 * Strict bundled-only variant for the OD Next recipe gate. Unlike the legacy
 * loader it never falls back to a community record with the same atom id and
 * surfaces unreadable bodies as an error instead of silently dropping them.
 */
export declare function loadBundledAtomBodiesStrict(db: SqliteDb, atomIds: ReadonlyArray<string>): Promise<AtomBodyEntry[]>;
export {};
