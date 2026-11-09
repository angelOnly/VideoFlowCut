import type Database from 'better-sqlite3';
import type { CollabCloudComment } from '@open-design/contracts';
import type { CollabCloudMemberPage, CollabCloudMemberPageMode, CollabCloudMemberPageQuery } from '../integrations/collab-cloud.js';
type SqliteDb = Database.Database;
/** The exact team identity a member cursor belongs to. */
export interface MemberSyncScope {
    workspaceId: string;
    memberId: string;
    teamId: string;
    projectId: string;
}
export interface MemberSyncCursor {
    /** Mode of the round the next request continues or starts. */
    phase: CollabCloudMemberPageMode;
    /** Continuation token of an open round; null between rounds. */
    pageToken: string | null;
    /** Persistent resume point after a completed round. */
    resumeToken: string | null;
    streamEpoch: string;
    scopeToken: string;
    watermarkSeq: number;
    /** Cumulative count of malformed items skipped for this scope. */
    skippedCount: number;
}
export type MemberPageMerge = (comment: CollabCloudComment) => 'changed' | 'unchanged';
export type ApplyMemberPageResult = {
    status: 'committed';
    changed: number;
    /** Rows removed by tombstones. */
    deleted: number;
    /** Rows removed at snapshot completion because the snapshot lacked them. */
    pruned: number;
    skipped: number;
    cursor: MemberSyncCursor;
} | {
    status: 'conflict';
} | {
    status: 'rebuild-required';
    reason: 'scope-changed';
};
export interface CommentInboundStore {
    read(scope: MemberSyncScope): MemberSyncCursor | null;
    apply(input: ApplyMemberPageInput): ApplyMemberPageResult;
    /**
     * Author kind of a stored comment, or null when absent. Lets the legacy pull
     * route an author-less tombstone: a share-page ('user') target is still the
     * legacy pull's to delete; member targets belong to the member page stream.
     */
    storedAuthorKind(projectId: string, commentId: string): 'member' | 'user' | null;
    /**
     * Drop the scope's cursor so the next request is a fresh snapshot. The
     * ledger is kept: that snapshot's completion prunes against it.
     */
    reset(scope: MemberSyncScope): void;
    /**
     * Drop every member-sync cursor and ledger of `projectId` except `keep`'s.
     * Local comment rows are never touched. Returns the cursors removed.
     */
    forgetProject(projectId: string, keep?: MemberSyncScope): number;
}
export interface ApplyMemberPageInput {
    scope: MemberSyncScope;
    /** The query the page answers; must equal the cursor's next query (CAS). */
    query: CollabCloudMemberPageQuery;
    page: CollabCloudMemberPage;
    /**
     * Synchronous, side-effect-free merge of one full comment into
     * preview_comments. It runs inside the page transaction: no notifications,
     * Runs or I/O may happen here, because a later failure rolls the row back.
     */
    merge: MemberPageMerge;
}
export declare function migrateCommentInboundStore(db: SqliteDb): void;
export declare function resetMemberSyncCursor(db: SqliteDb, scope: MemberSyncScope): void;
export declare function forgetMemberSyncProject(db: SqliteDb, projectId: string, keep?: MemberSyncScope): number;
export declare function readMemberSyncCursor(db: SqliteDb, scope: MemberSyncScope): MemberSyncCursor | null;
/**
 * The single request a cursor leads to. No cursor → a fresh snapshot. An open
 * round continues with its page token in the round's own mode; a completed
 * round resumes incrementally.
 */
export declare function nextMemberPageQuery(cursor: MemberSyncCursor | null): CollabCloudMemberPageQuery;
export declare function applyMemberPage(db: SqliteDb, input: ApplyMemberPageInput): ApplyMemberPageResult;
export declare function createCommentInboundStore(db: SqliteDb): CommentInboundStore;
export {};
