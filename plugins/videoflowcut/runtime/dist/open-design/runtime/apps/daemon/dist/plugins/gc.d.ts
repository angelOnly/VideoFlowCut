import type Database from 'better-sqlite3';
import { type PruneExpiredResult } from './snapshots.js';
type SqliteDb = Database.Database;
export interface SnapshotGcOptions {
    db: SqliteDb;
    intervalMs?: number;
    logger?: (msg: string, meta?: Record<string, unknown>) => void;
    onTick?: (result: PruneExpiredResult) => void;
}
export interface SnapshotGcHandle {
    stop(): void;
    sweep(now?: number): PruneExpiredResult;
}
export declare function startSnapshotGc(opts: SnapshotGcOptions): SnapshotGcHandle;
export {};
