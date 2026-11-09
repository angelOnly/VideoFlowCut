import type Database from 'better-sqlite3';
import type { SharePublishResult } from '@open-design/contracts';
import type { PublicFilePublication, PublicFilePublicationScope } from './public-file-publication-store.js';
import type { RecordPublicFilePublication } from './public-file-publication-recording.js';
import { type ShareBindingOutbox } from './share-binding-outbox.js';
import { type ShareFileMapping } from './share-file-mapping.js';
export interface SharePublicationCompletionInput {
    scope: PublicFilePublicationScope;
    resourceId: string;
    publication: PublicFilePublication;
    mapping: ShareFileMapping;
    result: SharePublishResult;
    /** Set only by the HTTP route after a remote stopped-alias witness and resume receipt. */
    reopened?: boolean;
}
/** Persist local witnesses and both kinds of intent in one transaction, after
 * confirmed network publication. A failed pending write retains the receipt in
 * the response, but cannot promise an automatic binding retry.
 * All dependencies must use the same database; no callback performs network I/O.
 */
export declare function createSharePublicationCompletion(db: Database.Database, recordPublication: RecordPublicFilePublication, outbox: ShareBindingOutbox, retryAvailable?: boolean): (input: SharePublicationCompletionInput) => SharePublishResult;
