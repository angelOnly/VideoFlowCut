export interface AutoExtractionCleanupResult {
    /** False when the marker already existed and nothing was touched. */
    ran: boolean;
    /** Ids of entries removed by the heuristic fingerprint match. */
    deletedIds: string[];
    /** True when user_profile was rewritten (or removed) to canonical rows. */
    profilePruned: boolean;
}
/**
 * Run the one-time auto-extraction cleanup for a data dir. Idempotent via a
 * marker file; safe to call on every daemon boot. Never throws for a single
 * bad entry — a migration must not take the daemon down.
 */
export declare function runAutoExtractionCleanup(dataDir: string): Promise<AutoExtractionCleanupResult>;
