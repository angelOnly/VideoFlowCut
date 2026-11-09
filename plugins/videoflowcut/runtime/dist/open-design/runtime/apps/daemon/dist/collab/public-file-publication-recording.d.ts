import type Database from 'better-sqlite3';
import type { PublicFilePublicationScope, PublicFilePublication, PublicFilePublicationRevision, PublicFilePublicationStore } from './public-file-publication-store.js';
import { type ShareFileMapping } from './share-file-mapping.js';
export type RecordPublicFilePublication = (scope: PublicFilePublicationScope, publication: PublicFilePublication, mapping: ShareFileMapping, reopened?: boolean) => PublicFilePublicationRevision;
type EnqueuePublishedFileComments = (db: Database.Database, input: {
    scope: PublicFilePublicationScope;
    publicationRevision: PublicFilePublicationRevision;
    publicFilePath: string;
    reopened: boolean;
}) => {
    enqueued: number;
    skippedInbound: number;
};
/** Record publication and its comment intent atomically, after network success.
 * The enqueuer is synchronous/local-only. It owns author policy and durable mapping.
 */
export declare function createPublicFilePublicationRecorder(db: Database.Database, publications: PublicFilePublicationStore, enqueue: EnqueuePublishedFileComments): RecordPublicFilePublication;
export {};
