import type { runVelaCommand } from '../integrations/vela-command.js';
import type { PublicFilePublicationScope, PublicFilePublicationStore } from './public-file-publication-store.js';
import type { ShareBindingOutbox } from './share-binding-outbox.js';
import type { VelaSharePublishResult } from './vela-share-publish.js';
/** Caller holds the project mutation lock and verified the original author.
 * An explicit retry finishes the current durable generation: never push bytes,
 * publish another version, rotate the alias, or replace the local witness. */
export declare function resumePendingShareBinding(scope: PublicFilePublicationScope, publications: PublicFilePublicationStore, outbox: ShareBindingOutbox, run: typeof runVelaCommand, stoppedSlug?: string): Promise<VelaSharePublishResult | null>;
