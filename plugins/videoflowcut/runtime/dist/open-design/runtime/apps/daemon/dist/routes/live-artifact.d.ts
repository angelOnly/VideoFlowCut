import type { Express } from 'express';
import type { RouteDeps } from '../server-context.js';
import type { AuthorizeProjectRequest, AuthorizeProjectToolRequest } from '../collab/project-request-authority.js';
export interface RegisterLiveArtifactRoutesDeps extends RouteDeps<'db' | 'http' | 'paths' | 'auth' | 'liveArtifacts' | 'projectStore'> {
    authorizeProjectRequest: AuthorizeProjectRequest;
    authorizeProjectToolRequest: AuthorizeProjectToolRequest;
}
export declare function registerLiveArtifactRoutes(app: Express, ctx: RegisterLiveArtifactRoutesDeps): void;
