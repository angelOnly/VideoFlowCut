import type { Express } from 'express';
import type { AuthorizeProjectRequest } from '../../collab/project-request-authority.js';
import type { RouteDeps } from '../../server-context.js';
export interface RegisterProjectChatArtifactRoutesDeps extends RouteDeps<'db' | 'http' | 'paths' | 'projectStore'> {
    authorizeProjectRequest: AuthorizeProjectRequest;
}
export declare function registerProjectChatArtifactRoutes(app: Express, ctx: RegisterProjectChatArtifactRoutesDeps): void;
