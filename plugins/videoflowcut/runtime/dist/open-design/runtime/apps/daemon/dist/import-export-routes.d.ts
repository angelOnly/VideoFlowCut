import { type CommentFileDeletion } from './collab/comment-file-deletion.js';
import type { Express } from 'express';
import type { PublicFileMutations } from './collab/public-file-mutations.js';
import type { RouteDeps } from './server-context.js';
import type { AuthorizeProjectRequest, AuthorizeProjectToolRequest } from './collab/project-request-authority.js';
import type { WorkspaceDirectoryFetchResult } from './collab/vela-workspace-context.js';
import type { BoundWorkspaceResourceMutationGate } from './collab/workspace-resource-mutation.js';
export interface RegisterImportRoutesDeps extends RouteDeps<'db' | 'http' | 'uploads' | 'node' | 'ids' | 'paths' | 'imports' | 'auth' | 'projectStore' | 'conversations' | 'projectFiles' | 'validation'> {
    publicFileMutations?: PublicFileMutations;
    stopPublicFilesBeforeDelete?: CommentFileDeletion;
    fetchProjectCreationWorkspaceDirectory?: () => Promise<WorkspaceDirectoryFetchResult>;
    enforceWorkspaceProjectMutation?: BoundWorkspaceResourceMutationGate;
}
export declare function registerImportRoutes(app: Express, ctx: RegisterImportRoutesDeps): void;
/**
 * Turn a desktop-renderer IPC failure into the message we are willing to hand
 * back over HTTP, and put the unredacted one in the daemon log.
 *
 * This split is the point. The renderer is reached over a unix socket whose
 * path encodes the runtime namespace, so a failed connect arrives as
 * `connect ENOENT /tmp/open-design/ipc/<namespace>/desktop.sock` and a timeout
 * as `IPC request timed out: <same path>`. That string does not stop here:
 * `od export` writes the daemon's `message` verbatim to its stderr, the agent
 * reads it, and from there it is one prompt-adherence failure away from the
 * user's reply. Redaction is the defence behind the prompt rule, not a
 * replacement for it.
 *
 * The log call is load-bearing rather than decorative: it is the ONLY copy.
 * `sendApiError` does not log, `recordApiFailure` keeps just
 * {method, route, status, code} and drops the message, and the sidecar's own
 * `traceJsonIpc` is gated behind OD_JSON_IPC_TRACE. Remove it and the socket
 * path stops being a leak by ceasing to exist anywhere.
 *
 * What survives redaction is deliberate. `apps/web/src/analytics/export-error-code.ts`
 * buckets export failures by matching this message — `unknown \w+ sidecar
 * message` is the daemon↔desktop version-skew signal, `renderer unavailable`
 * and `timed out` are the others — so this returns a redacted sentence rather
 * than a fixed one. Flattening it would silently empty those buckets.
 */
export declare function describeDesktopRendererFailure(err: unknown): string;
export interface RegisterProjectExportRoutesDeps extends RouteDeps<'db' | 'http' | 'paths' | 'node' | 'ids' | 'projectStore' | 'exports' | 'projectFiles' | 'validation' | 'auth' | 'projectPreviewScopes'> {
    authorizeProjectRequest: AuthorizeProjectRequest;
    authorizeProjectToolRequest: AuthorizeProjectToolRequest;
    isApiTokenAuthorization: (authorization: string | undefined) => boolean;
}
export declare function registerProjectExportRoutes(app: Express, ctx: RegisterProjectExportRoutesDeps): void;
export interface RegisterFinalizeRoutesDeps extends RouteDeps<'db' | 'http' | 'paths' | 'projectStore' | 'validation' | 'finalize'> {
    authorizeProjectRequest: AuthorizeProjectRequest;
}
export declare function registerFinalizeRoutes(app: Express, ctx: RegisterFinalizeRoutesDeps): void;
