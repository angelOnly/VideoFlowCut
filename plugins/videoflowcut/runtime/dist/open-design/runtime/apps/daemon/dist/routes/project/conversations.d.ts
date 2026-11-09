import type { Express } from 'express';
import type { RouteDeps } from '../../server-context.js';
import type { BoundWorkspaceResourceMutationGate } from '../../collab/workspace-resource-mutation.js';
import type { AuthorizeProjectRequest } from '../../collab/project-request-authority.js';
export interface RegisterProjectConversationRoutesDeps extends RouteDeps<'db' | 'design' | 'http' | 'paths' | 'projectStore' | 'conversations' | 'ids' | 'telemetry' | 'appConfig' | 'agents'> {
    /**
     * Threaded straight through to `registerProjectCommentRoutes` — a comment
     * has no workspace binding of its own, so it borrows its PARENT PROJECT's
     * `enforceWorkspaceProjectMutation` gate (built once in
     * `registerProjectRoutes`, complete with the last-known-membership
     * cross-check) rather than re-deriving a weaker one here. See
     * `RegisterProjectCommentRoutesDeps` in `./comments.js`.
     */
    enforceWorkspaceProjectMutation?: BoundWorkspaceResourceMutationGate;
    authorizeProjectRequest?: AuthorizeProjectRequest;
    /**
     * Passed alongside `enforceWorkspaceProjectMutation` above — the gate calls
     * this to write the 401/403 response body when it denies a mutation. Kept
     * as its own field (rather than requiring the full `http` dep bag) so
     * fixtures that only exercise comment CRUD semantics, not workspace
     * isolation, are not forced to stub unrelated HTTP helpers.
     */
    sendApiError?: (res: any, status: number, code: string, message: string) => unknown;
}
export declare function registerProjectConversationRoutes(app: Express, ctx: RegisterProjectConversationRoutesDeps): void;
