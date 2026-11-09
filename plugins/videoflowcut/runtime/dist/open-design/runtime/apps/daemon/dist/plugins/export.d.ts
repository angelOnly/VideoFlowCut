import type Database from 'better-sqlite3';
type SqliteDb = Database.Database;
export type ExportTarget = 'od' | 'claude-plugin' | 'agent-skill';
export interface ExportInput {
    db: SqliteDb;
    snapshotId?: string;
    projectId?: string;
    target: ExportTarget;
    outDir: string;
}
export interface ExportResult {
    folder: string;
    files: string[];
    snapshotId: string;
}
export declare class ExportError extends Error {
    constructor(message: string);
}
export declare function exportPlugin(input: ExportInput): Promise<ExportResult>;
export {};
