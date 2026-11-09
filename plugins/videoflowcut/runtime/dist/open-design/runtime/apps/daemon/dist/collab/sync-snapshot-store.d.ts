import type Database from 'better-sqlite3';
import type { CollabCloudMemberDirectoryEntry, TeamProject } from '@open-design/contracts';
import type { SyncDigestFace } from './sync-digest.js';
type SqliteDb = Database.Database;
export declare function migrateCollabSyncSnapshots(db: SqliteDb): void;
/**
 * Cache identity. `accountId` is part of the primary key so a snapshot can
 * only ever be read back under the account that wrote it — switching accounts
 * is a miss, not a leak. Callers must never synthesize a placeholder for a
 * missing account id.
 */
export interface CollabSyncSnapshotKey {
    face: SyncDigestFace;
    accountId: string;
    workspaceId: string;
}
export interface CollabSyncSnapshotRecord {
    token: string;
    snapshotJson: string;
}
export interface CollabSyncSnapshotStore {
    read(key: CollabSyncSnapshotKey): CollabSyncSnapshotRecord | null;
    /** Write token + payload as one atomic unit. */
    write(key: CollabSyncSnapshotKey, record: CollabSyncSnapshotRecord): void;
    drop(key: CollabSyncSnapshotKey): void;
}
export declare function createCollabSyncSnapshotStore(db: SqliteDb): CollabSyncSnapshotStore;
/**
 * Shape guards for the two cached faces.
 *
 * A snapshot that survives a schema change (or lands corrupted) must degrade to
 * a real fetch rather than being handed to the UI, so parsing is a validation
 * step and not a cast.
 */
export declare function parseTeamProjectSnapshot(value: unknown): TeamProject[] | null;
export declare function parseMemberDirectorySnapshot(value: unknown): CollabCloudMemberDirectoryEntry[] | null;
export {};
