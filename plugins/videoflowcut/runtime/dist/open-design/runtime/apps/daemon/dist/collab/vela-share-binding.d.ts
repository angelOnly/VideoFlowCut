import type { SharePublishReceipt } from '@open-design/contracts';
import type { PublicFilePublicationScope } from './public-file-publication-store.js';
import { runVelaCommand } from '../integrations/vela-command.js';
import { type AmrShareLink } from './public-share-viewer-url.js';
export interface VelaShareBindingInput {
    /** Original project-relative path persisted in the publication receipt. */
    sourceFilePath: string;
    workspaceId: string;
    projectId: string;
    resourceId: string;
    slug: string;
    version: number;
    versionId: string;
}
/** Complete only the captured publication's binding. The Go command uses a
 * dedicated guarded endpoint; never fall back to registration or publication.
 * Callers can supply a runner pinned to the original verified session.
 */
export declare function bindVelaShareVersion(input: VelaShareBindingInput, run?: typeof runVelaCommand): Promise<AmrShareLink | null>;
/** Only an explicit owner publish request may resume a stopped generation.
 * Background binding retries must continue using bindVelaShareVersion. */
export declare function resumeVelaShareVersion(input: VelaShareBindingInput, run?: typeof runVelaCommand): Promise<AmrShareLink | null>;
/** Reopen an Owner-stopped alias at the immutable version already held by Vela.
 * The authenticated command reads the exact published source/version under an
 * alias generation lock. Neither OD nor the caller may supply a guessed version.
 */
export declare function resumeExistingVelaShare(scope: PublicFilePublicationScope, slug: string, run?: typeof runVelaCommand): Promise<{
    receipt: SharePublishReceipt;
    amrLink: AmrShareLink | null;
}>;
