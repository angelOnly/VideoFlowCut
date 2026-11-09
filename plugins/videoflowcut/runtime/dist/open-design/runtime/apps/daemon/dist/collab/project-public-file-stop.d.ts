import type { ProjectDeleteShareResidual } from '@open-design/contracts';
import type { PreparePublicFileStop, PublicFilePublicationScope, StopQueuePublicFilePublicationStore } from './public-file-publication-store.js';
export type PublicFileDeleteTarget = string | {
    folderPath: string;
};
/** Folder boundaries are path segments, never bare string prefixes. */
export declare function matchesPublicFileDeleteTarget(filePath: string, target?: PublicFileDeleteTarget): boolean;
/** Internal handoff only: this error does not assert local deletion succeeded.
 * The deletion owner must finish its local work before returning ok: true.
 */
export declare class ProjectPublicFileStopPendingError extends Error {
    readonly canContinueLocalDelete: boolean;
    readonly shareResiduals: ReadonlyArray<ProjectDeleteShareResidual>;
    constructor(residuals: ReadonlyArray<ProjectDeleteShareResidual>, canContinueLocalDelete?: boolean);
}
/**
 * Stop the original owner's publications before allowing catalog/local deletion.
 * Failed stops remain independent durable tasks. A changed publication invalidates
 * this deletion attempt: an older response must never erase a newer witness.
 */
export declare function createProjectPublicFileStop(store: StopQueuePublicFilePublicationStore, prepare: PreparePublicFileStop): (scope: Omit<PublicFilePublicationScope, 'filePath'>, target?: PublicFileDeleteTarget) => Promise<void>;
