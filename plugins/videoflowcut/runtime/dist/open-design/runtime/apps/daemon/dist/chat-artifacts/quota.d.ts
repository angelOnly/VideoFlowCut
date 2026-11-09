import type Database from 'better-sqlite3';
export interface ChatArtifactQuota {
    /** Largest single original blob. */
    perBlobMaxBytes: number;
    /** Largest single cover PNG. Covers are regenerable, so keep them small. */
    thumbnailMaxBytes: number;
    /** Total distinct blob bytes reachable from one project's ready snapshots. */
    projectMaxBytes: number;
    /** Total installed blob bytes across the whole daemon data root. */
    totalMaxBytes: number;
}
export declare const DEFAULT_CHAT_ARTIFACT_QUOTA: ChatArtifactQuota;
/**
 * Operator overrides. Env is read ONCE per call by the caller that owns the
 * process environment; nothing downstream re-reads it.
 */
export declare function resolveChatArtifactQuota(env?: Record<string, string | undefined>): ChatArtifactQuota;
/**
 * Distinct blob bytes reachable from one project's ready snapshots.
 *
 * Recomputed from the foreign keys every time rather than cached in a counter
 * column: a stale `ref_count` is exactly the kind of second truth source that
 * makes a GC delete something a message still points at.
 */
export declare function projectSnapshotBytes(db: Database.Database, projectId: string): number;
/** Total installed blob bytes recorded in the index. */
export declare function totalSnapshotBytes(db: Database.Database): number;
