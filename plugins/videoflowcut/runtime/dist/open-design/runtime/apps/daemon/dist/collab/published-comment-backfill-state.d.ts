import type Database from 'better-sqlite3';
import type { CommentBackfillState } from '@open-design/contracts';
import type { PublicFilePublicationRevision, PublicFilePublicationScope } from './public-file-publication-store.js';
type SqliteDb = Database.Database;
type BackfillOutcome = 'delivered' | 'discarded' | 'deferred';
export interface PublishedCommentBackfillSubject {
    projectId: string;
    workspaceId: string;
    workspaceMemberId: string;
    /** A project-wide question has no safe backfill answer. */
    filePath?: string;
}
export interface RecordPublishedCommentBackfillInput {
    scope: PublicFilePublicationScope;
    publicationRevision: PublicFilePublicationRevision;
    /** Exact ids present at publication time; later comments cannot satisfy this batch. */
    commentIds: readonly string[];
    /** Trusted receipt origin; omitted legacy batches have unknown provenance. */
    reopened?: boolean;
}
export interface PublishedCommentBackfillOutboxRecord {
    workspaceId: string;
    workspaceMemberId: string;
    projectId: string;
    commentId: string;
    comment: {
        filePath: string;
    };
    publication?: {
        slug: string;
        token: string;
        publicFilePath: string;
    };
}
/** Durable outcome schema, intentionally separate from generic relay retry state. */
export declare function migratePublishedCommentBackfillState(db: SqliteDb): void;
/**
 * Captures one publish's initial eligible comment set inside its publication transaction.
 * Empty batches are completed work, rather than an absent/not-run state.
 */
export declare function recordPublishedCommentBackfill(db: SqliteDb, input: RecordPublishedCommentBackfillInput): void;
/**
 * Applies an outcome only to a still-current publication and one of its initial
 * members. It deliberately does not infer delivery from queue deletion.
 */
export declare function markPublishedCommentBackfillOutcome(db: SqliteDb, record: PublishedCommentBackfillOutboxRecord, outcome: BackfillOutcome): void;
/** Returns a result only for the caller's exact, still-current published file. */
export declare function readPublishedCommentBackfill(db: SqliteDb, subject: PublishedCommentBackfillSubject): CommentBackfillState | undefined;
export {};
