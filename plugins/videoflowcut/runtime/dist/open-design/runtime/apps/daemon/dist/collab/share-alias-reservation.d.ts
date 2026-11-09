import type Database from 'better-sqlite3';
import type { PublicFilePublicationScope } from './public-file-publication-store.js';
export interface ShareAliasReservation {
    slug: string;
    sourceKey: string;
}
interface CloudFileAlias {
    sourceFilePath: string;
    sourceFileId?: string;
    slug: string;
}
export declare class ShareAliasIdentityMismatchError extends Error {
    constructor();
}
/** Reserve before remote publication. Failed uploads and lost responses must
 * reuse the same alias and idempotency identity after restart. This is not a
 * publication record: reservation alone never means the content is public.
 * Legacy snapshot identifiers must not be reinterpreted as stable aliases.
 */
export declare function createShareAliasReservations(db: Database.Database, generateId?: () => string): {
    get: (scope: PublicFilePublicationScope) => ShareAliasReservation | null;
    reserve: (scope: PublicFilePublicationScope) => ShareAliasReservation;
    restore: (scope: PublicFilePublicationScope, cloud: CloudFileAlias) => ShareAliasReservation;
};
export {};
