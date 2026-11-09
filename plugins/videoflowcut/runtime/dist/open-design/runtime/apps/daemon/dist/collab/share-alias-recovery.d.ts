import { type createShareAliasReservations } from './share-alias-reservation.js';
import { type ProjectShareState } from './vela-project-share-state.js';
import type { PublicFilePublicationScope, PublicFilePublicationStore } from './public-file-publication-store.js';
import type { ShareBindingOutbox } from './share-binding-outbox.js';
/** Only authoritative absence permits a new alias. A matching cloud lifetime
 * restores its original alias; a local unpublished reservation is not authority
 * to replace it. Never discard a conflicting confirmed/pending publication.
 */
export declare function reserveFileShareAlias(input: {
    scope: PublicFilePublicationScope;
    history: ProjectShareState | null;
    reservations: ReturnType<typeof createShareAliasReservations>;
    publications: PublicFilePublicationStore;
    outbox: ShareBindingOutbox;
}): import("./share-alias-reservation.js").ShareAliasReservation;
