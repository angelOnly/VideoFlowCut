import type Database from 'better-sqlite3';
import type { CommentFileFact } from '@open-design/contracts';
/** Only managed comment-file retirement intents. These are not catalog facts:
 * prepared means uncertain local outcome; committed means the supported local
 * mutation confirmed this lifetime's removal (including partial folder deletion).
 * Neither state may be used as an admitted retirement or a new file identity.
 */
export declare function migrateCommentFileRetirements(db: Database.Database): void;
export declare function pendingCommentFileRetirements(db: Database.Database, projectId: string): {
    workspaceId: string;
    creatorMemberId: string;
    fact: CommentFileFact;
    committed: boolean;
}[];
export declare function assertCommentFileNotPending(db: Database.Database, projectId: string, file: {
    sourceFileId?: string;
    filePath?: string;
}): void;
/** A root upload contains every path, so no pending lifetime may pass it. */
export declare function assertNoPendingCommentFileRetirements(db: Database.Database, projectId: string): void;
