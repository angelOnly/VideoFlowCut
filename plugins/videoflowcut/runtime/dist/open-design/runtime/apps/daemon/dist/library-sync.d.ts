import type Database from 'better-sqlite3';
type SqliteDb = Database.Database;
export interface ReconcileLibraryPaths {
    LIBRARY_DIR: string;
    PROJECTS_DIR: string;
    USER_DESIGN_SYSTEMS_DIR: string;
}
export interface ReconcileLibraryResult {
    /** Design-system cards newly registered this pass. */
    designSystems: number;
    /** Project deliverable assets newly registered this pass. */
    projectAssets: number;
    /** Referenced rows skipped because their origin file was already indexed. */
    deduped: number;
    /** designSystems + projectAssets. */
    total: number;
}
/**
 * Reconcile design systems + agent project deliverables into the Library as
 * referenced assets. Idempotent and best-effort; never throws. Returns what was
 * newly indexed this pass (counts the UI / CLI surface back to the user).
 */
export declare function reconcileLibrary(db: SqliteDb, paths: ReconcileLibraryPaths): Promise<ReconcileLibraryResult>;
export {};
