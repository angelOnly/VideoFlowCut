import type { Express, Response } from 'express';
import type { RouteDeps } from '../server-context.js';
import type { BoundWorkspaceResourceMutationGate } from '../collab/workspace-resource-mutation.js';
import type { WorkspaceDirectoryFetchResult } from '../collab/vela-workspace-context.js';
export interface RegisterLibraryRoutesDeps extends RouteDeps<'db' | 'http' | 'paths' | 'projectStore' | 'projectFiles' | 'conversations' | 'auth'> {
    fetchProjectCreationWorkspaceDirectory?: () => Promise<WorkspaceDirectoryFetchResult>;
    enforceWorkspaceProjectMutation?: BoundWorkspaceResourceMutationGate;
}
/**
 * Stream a file to the HTTP response with an `error` handler on the read stream.
 * `.pipe()` does NOT forward the source's errors, so without this a mid-stream
 * read failure (file deleted/truncated mid-read, EIO, an fd race) emits an
 * unhandled `error` on the Readable, which Node escalates to an uncaughtException
 * that takes the whole daemon down. On error we fall back to `onOpenError`
 * (a 404) when nothing has been written yet, else tear the response down.
 */
export declare function streamAssetFileToResponse(abs: string, res: Response, onOpenError: () => void): void;
export declare function registerLibraryRoutes(app: Express, ctx: RegisterLibraryRoutesDeps): void;
