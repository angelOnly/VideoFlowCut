import type Database from 'better-sqlite3';
import type { ChatArtifactBlobStore } from './blob-store.js';
export interface ChatArtifactGcDeps {
    db: Database.Database;
    blobs: ChatArtifactBlobStore;
    /** How long an unreferenced snapshot row is kept. Default 24h. */
    snapshotGraceMs?: number;
    /** How long an unreferenced blob is kept. Default 24h. */
    blobGraceMs?: number;
    /** Cap on rows touched per pass so a huge store stays resumable. */
    batchLimit?: number;
    /** Report only. Used to observe the sweep before enabling it for real. */
    dryRun?: boolean;
    now?: () => number;
}
export interface ChatArtifactGcReport {
    markedDigests: number;
    snapshotsSwept: number;
    blobsSwept: number;
    bytesReclaimed: number;
    orphanFilesSwept: number;
    failures: number;
    dryRun: boolean;
}
export declare function sweepChatArtifactStorage(deps: ChatArtifactGcDeps): Promise<ChatArtifactGcReport>;
