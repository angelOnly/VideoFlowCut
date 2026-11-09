import type { Request, Response, RequestHandler } from 'express';
import type { PublicFileMutations } from '../collab/public-file-mutations.js';
/** Serialize the entire handler, including authorization and post-request cleanup. */
export declare function publicFileMutationHandler(mutations: PublicFileMutations | undefined, handler: (req: Request, res: Response) => Promise<unknown>): RequestHandler;
