import type { PublicFilePublicationStore } from './public-file-publication-store.js';
import type { PublicFileMutations } from './public-file-mutations.js';
import type { ShareBindingOutbox, ShareBindingTask } from './share-binding-outbox.js';
import { type AmrShareLink } from './public-share-viewer-url.js';
export interface PreparedShareBinding {
    resourceTeamId: string;
    ownerMemberId: string;
    /** Must bind only this captured immutable publication, never publish again.
     * Resolves with the address AMR reported for the bound share, if any. */
    bind(): Promise<AmrShareLink | null | void>;
}
export type PrepareShareBinding = (task: Readonly<ShareBindingTask>) => Promise<PreparedShareBinding | null>;
export interface ShareBindingStartupOptions {
    prepare: PrepareShareBinding | null;
    publications: Pick<PublicFilePublicationStore, 'getRevision'> & Partial<Pick<PublicFilePublicationStore, 'updateLink'>>;
    /** Optional extra host restrictions; cannot override the durable witness. */
    isCurrent?(task: ShareBindingTask): boolean;
    mutations: PublicFileMutations;
}
export interface ShareBindingStartupResult {
    bound: number;
    failed: number;
    deferred: number;
    persistenceFailures: number;
}
/** One binding-only pass per lifecycle. A missing primitive defers; it is not
 * a failed network attempt. Local CAS protects bookkeeping, not cloud atomicity.
 */
export declare function createShareBindingStartup(outbox: ShareBindingOutbox, options: ShareBindingStartupOptions): () => Promise<ShareBindingStartupResult>;
