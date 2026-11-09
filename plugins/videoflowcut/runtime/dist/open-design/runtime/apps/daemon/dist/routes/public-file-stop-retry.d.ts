import type { Express, Request } from 'express';
import type { VerifiedWorkspaceRequestContextResult } from '../collab/request-workspace-context.js';
import type { PublicFileMutations } from '../collab/public-file-mutations.js';
import { type StopQueuePublicFilePublicationStore, type PreparePublicFileStop } from '../collab/public-file-publication-store.js';
export interface PublicFileStopRetryDeps {
    /** Verify membership only: do not resolve the deleted project. */
    verify(req: Request): Promise<VerifiedWorkspaceRequestContextResult>;
    store: StopQueuePublicFilePublicationStore;
    prepare: PreparePublicFileStop;
    mutations: PublicFileMutations;
}
/** Only an original owner's persisted deletion intent authorizes this operation. */
export declare function registerPublicFileStopRetryRoutes(app: Express, deps: PublicFileStopRetryDeps): void;
