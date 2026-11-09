import type Database from 'better-sqlite3';
import type { ChatArtifactBlobStore } from './blob-store.js';
import type { ChatArtifactQuota } from './quota.js';
export interface ChatArtifactReconcileDeps {
    db: Database.Database;
    blobs: ChatArtifactBlobStore;
    quota?: ChatArtifactQuota;
    /**
     * Turn a (projectId, project-relative path) back into an absolute path.
     * Injected because only the server knows PROJECTS_DIR and the imported-folder
     * `metadata.baseDir` exception. Absent means "cannot re-read sources", and
     * path intents then fail rather than guess.
     */
    resolveSourcePath?: (projectId: string, projectRelativePath: string) => string | null;
    /** How long an unclaimed temp file is left alone. Default 1 hour. */
    tempGraceMs?: number;
    now?: () => number;
}
export interface ChatArtifactReconcileReport {
    scanned: number;
    completed: number;
    failed: number;
    blobMissing: number;
    tempsSwept: number;
}
export declare function reconcileChatArtifactSnapshots(deps: ChatArtifactReconcileDeps): Promise<ChatArtifactReconcileReport>;
