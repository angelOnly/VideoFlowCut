import type Database from 'better-sqlite3';
import { type PublicFilePublicationScope, type PublicFilePublicationRevision } from './public-file-publication-store.js';
export interface PublishedFileCommentBackfillInput {
    scope: PublicFilePublicationScope;
    publicationRevision: PublicFilePublicationRevision;
    /** Produced by the publisher's actual file mapping; never guessed here. */
    publicFilePath: string;
    /** From the verified publication completion, not a local URL guess. */
    reopened?: boolean;
}
/**
 * Enqueue existing local comments in the publication transaction, never send.
 * The user explicitly authorized all conversations of this ONE published file.
 * Publication identity and original authors remain independent: publishing a
 * file cannot turn an inbound web comment into a comment by its publisher.
 */
export declare function enqueuePublishedFileComments(db: Database.Database, input: PublishedFileCommentBackfillInput): {
    enqueued: number;
    skippedInbound: number;
};
