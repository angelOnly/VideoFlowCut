import type Database from 'better-sqlite3';
/** Rebind only explicit local pre-share comments, with their durable outbound
 * snapshots. The caller commits this together with fresh receipt-backed facts.
 * Artifact IDs, inbound comments and identity-less history remain unchanged.
 */
export declare function rebindLocalCommentFileIdentity(db: Database.Database, input: {
    projectId: string;
    workspaceId: string;
    creatorMemberId: string;
    filePath: string;
    localSourceFileId: string;
    sourceFileId: string;
}): void;
