import type Database from 'better-sqlite3';
import type { ShareContentFreshness } from '@open-design/contracts';
import type { PublicFilePublicationScope, PublicFilePublicationRevision, PublicFilePublicationStore } from './public-file-publication-store.js';
type PayloadFile = {
    file: string;
    data: string | Uint8Array;
};
/** Hash exactly the complete staged payload, not source mtimes or alias identity.
 * Sorting removes traversal-order differences; length framing includes names and bytes.
 */
export declare function fingerprintSharePayload(files: readonly PayloadFile[] | null): string | null;
/** Internal evidence only. Call remember AFTER confirmed publication using the
 * exact plan staged for that operation. No raw payload or credentials are stored.
 */
export interface ShareContentFingerprints {
    remember(scope: PublicFilePublicationScope, expected: PublicFilePublicationRevision, files: readonly PayloadFile[]): boolean;
    /** Carry the stored fingerprint to a new local revision of the SAME alias.
     * Only valid when that revision reopens the exact bytes the fingerprint
     * already describes (stop → resume reopens Vela's saved version). */
    rebind(scope: PublicFilePublicationScope, expected: PublicFilePublicationRevision): boolean;
    compare(scope: PublicFilePublicationScope, files: readonly PayloadFile[] | null): ShareContentFreshness;
}
export declare function createShareContentFingerprints(db: Database.Database, publications: Pick<PublicFilePublicationStore, 'getRevision'>): ShareContentFingerprints;
export {};
