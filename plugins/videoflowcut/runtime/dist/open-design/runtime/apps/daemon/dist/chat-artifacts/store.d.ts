import type Database from 'better-sqlite3';
import type { ChatArtifactDisplayPolicy, ChatArtifactFailureCode, ChatArtifactSnapshotState } from './types.js';
type SqliteDb = Database.Database;
export interface WorkspaceArtifactRow {
    id: string;
    projectId: string;
    currentPath: string | null;
    kind: string;
    mime: string | null;
    currentDigest: string | null;
    currentSize: number | null;
    currentMtime: number | null;
    createdAt: number;
    updatedAt: number;
    deletedAt: number | null;
}
export interface ChatArtifactSnapshotRow {
    id: string;
    projectId: string;
    workspaceArtifactId: string | null;
    sourcePathAtCapture: string;
    kind: string;
    mime: string | null;
    contentDigest: string | null;
    thumbnailDigest: string | null;
    motionPreviewJson?: string | null;
    sourceSize: number | null;
    sourceMtime: number | null;
    expectedSize: number | null;
    expectedMtime: number | null;
    expectedDigest: string | null;
    tempKey: string | null;
    runId: string | null;
    mediaTaskId: string | null;
    captureState: ChatArtifactSnapshotState;
    failureCode: string | null;
    createdAt: number;
    readyAt: number | null;
}
export interface MessageArtifactRow {
    id: string;
    messageId: string;
    ordinal: number;
    snapshotId: string | null;
    workspaceArtifactId: string | null;
    displayPolicy: ChatArtifactDisplayPolicy;
    labelAtCapture: string;
    kind: string;
    htmlVersionId: string | null;
    createdAt: number;
}
export interface ChatArtifactBlobRow {
    digest: string;
    storageKey: string;
    byteSize: number;
    mime: string | null;
    createdAt: number;
    lastVerifiedAt: number | null;
}
export declare function migrateChatArtifacts(db: SqliteDb): void;
export declare function setSnapshotMotionPreview(db: SqliteDb, id: string, preview: import('@open-design/contracts').MotionArtifactPreview): void;
export interface EnsureWorkspaceArtifactInput {
    projectId: string;
    /** Project-relative, forward-slash path. */
    path: string;
    kind: string;
    mime?: string | null;
    digest?: string | null;
    size?: number | null;
    mtime?: number | null;
    now?: number;
}
/**
 * Resolve the live identity for a project path, creating it on first sight.
 *
 * Overwrite semantics live here: a second call for the same path returns the
 * SAME id and only advances digest/size/mtime. That is what keeps a later
 * `hero.png` from stealing an earlier message's history.
 */
export declare function ensureWorkspaceArtifactForPath(db: SqliteDb, input: EnsureWorkspaceArtifactInput): WorkspaceArtifactRow;
export declare function getWorkspaceArtifact(db: SqliteDb, id: string): WorkspaceArtifactRow | null;
export declare function getLiveWorkspaceArtifactByPath(db: SqliteDb, projectId: string, filePath: string): WorkspaceArtifactRow | null;
/**
 * Follow a rename. The identity survives; `source_path_at_capture` on old
 * snapshots deliberately does not move — it records where the bytes came from
 * at the time, which is history, not a lookup key.
 */
export declare function renameWorkspaceArtifactPath(db: SqliteDb, projectId: string, fromPath: string, toPath: string, now?: number): WorkspaceArtifactRow | null;
/**
 * Tombstone the live identity at a path. The row is kept so historical cards
 * can say "the current file was deleted" instead of quietly opening whatever
 * later takes the name.
 */
export declare function deleteWorkspaceArtifact(db: SqliteDb, projectId: string, filePath: string, now?: number): WorkspaceArtifactRow | null;
/** Explicit managed working-directory replacement ends the old project file lifetimes. */
export declare function deleteProjectWorkspaceArtifacts(db: SqliteDb, projectId: string, now?: number): void;
/** Successful explicit folder deletion ends every local pointer in that subtree. */
export declare function deleteWorkspaceArtifactsInFolder(db: SqliteDb, projectId: string, folderPath: string, now?: number): void;
export declare function getChatArtifactBlob(db: SqliteDb, digest: string): ChatArtifactBlobRow | null;
export declare function upsertChatArtifactBlob(db: SqliteDb, input: {
    digest: string;
    storageKey: string;
    byteSize: number;
    mime?: string | null;
    now?: number;
}): void;
export interface SnapshotIntentInput {
    id: string;
    projectId: string;
    sourcePathAtCapture: string;
    kind: string;
    mime?: string | null;
    workspaceArtifactId?: string | null;
    runId?: string | null;
    mediaTaskId?: string | null;
    expectedSize?: number | null;
    expectedMtime?: number | null;
    expectedDigest?: string | null;
    tempKey: string | null;
    now?: number;
}
/** Phase 1 of the two-phase commit: the durable intent, written before bytes. */
export declare function insertSnapshotIntent(db: SqliteDb, input: SnapshotIntentInput): ChatArtifactSnapshotRow;
export declare function getChatArtifactSnapshot(db: SqliteDb, id: string): ChatArtifactSnapshotRow | null;
export interface SnapshotReadyInput {
    id: string;
    contentDigest?: string | null;
    thumbnailDigest?: string | null;
    sourceSize?: number | null;
    sourceMtime?: number | null;
    now?: number;
}
/** Phase 4: flip to ready once the blob is installed and verified. */
export declare function markSnapshotReady(db: SqliteDb, input: SnapshotReadyInput): void;
export declare function markSnapshotFailed(db: SqliteDb, id: string, failureCode: ChatArtifactFailureCode): void;
export declare function listSnapshotsByState(db: SqliteDb, state: ChatArtifactSnapshotState, limit?: number): ChatArtifactSnapshotRow[];
export interface MessageArtifactInput {
    id?: string;
    snapshotId?: string | null;
    workspaceArtifactId?: string | null;
    displayPolicy: ChatArtifactDisplayPolicy;
    label: string;
    kind: string;
    htmlVersionId?: string | null;
}
/**
 * Rewrite one message's refs. Called on capture and again when a fork copies a
 * message: the copy gets its OWN ref rows pointing at the SAME immutable
 * snapshot, so neither branch can invalidate the other's history.
 */
export declare function replaceMessageArtifacts(db: SqliteDb, messageId: string, refs: readonly MessageArtifactInput[], now?: number): MessageArtifactRow[];
export declare function listMessageArtifactRows(db: SqliteDb, messageId: string): MessageArtifactRow[];
export declare function listMessageArtifactRowsForConversation(db: SqliteDb, conversationId: string): Map<string, MessageArtifactRow[]>;
export declare function getMessageArtifactRowById(db: SqliteDb, id: string): MessageArtifactRow | null;
/**
 * Backfill the HTML version store's id onto the refs of one message.
 *
 * Lineage arrives LATE by construction: the refs are written at the terminal
 * chokepoint, and the AI HTML versions are snapshotted right after, so at
 * ref-write time the version does not exist yet. Rather than reorder two
 * independent terminal passes, the second one tells the first what it produced.
 *
 * Only fills rows that have no lineage yet. A ref that already names a version
 * is capture-time evidence and must not be re-pointed at a later one.
 */
export declare function setMessageArtifactHtmlVersionIds(db: SqliteDb, messageId: string, versionIdByLabel: ReadonlyMap<string, string>): number;
export {};
