import type { SharePublishResult } from '@open-design/contracts';
import type { PublicFilePublicationScope } from './public-file-publication-store.js';
import type { createShareAliasReservations } from './share-alias-reservation.js';
import { runVelaCommand } from '../integrations/vela-command.js';
import { type AmrShareLink } from './public-share-viewer-url.js';
/** A publish outcome plus what AMR said about its address. Only a published
 * (bound) share carries one; `amrLink` is absent when AMR said nothing. */
export type VelaSharePublishResult = SharePublishResult & {
    amrLink?: AmrShareLink;
};
export interface VelaSharePublishInput {
    /** Original local file, not the rewritten package entry. */
    filePath: string;
    workspaceId: string;
    projectId: string;
    resourceId: string;
    slug: string;
    sourceKey: string;
    entryPath: string;
    name: string;
    versionId: string;
}
export type ReservedVelaSharePublishInput = Omit<VelaSharePublishInput, 'filePath' | 'workspaceId' | 'projectId' | 'slug' | 'sourceKey'> & {
    scope: PublicFilePublicationScope;
};
/** Reserve the original file's stable identity before any remote mutation.
 * A rejected call leaves the reservation intact for the next explicit attempt.
 * This does not retry, record a successful publication, or enqueue binding.
 */
export declare function publishReservedVelaShareVersion(input: ReservedVelaSharePublishInput, reservations: ReturnType<typeof createShareAliasReservations>, run?: typeof runVelaCommand): Promise<VelaSharePublishResult>;
/** Go share publish atomically advances the alias and binds the project.
 * Accept only a committed receipt for this exact alias, entry and immutable upload.
 * A two-step CLI binary returning binding_pending cannot satisfy this contract.
 */
export declare function publishVelaShareVersion(input: VelaSharePublishInput, run?: typeof runVelaCommand): Promise<VelaSharePublishResult>;
