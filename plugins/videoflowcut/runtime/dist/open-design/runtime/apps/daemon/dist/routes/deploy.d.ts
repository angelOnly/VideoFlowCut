import type { Express } from 'express';
import type { RouteDeps } from '../server-context.js';
import type { AuthorizeProjectRequest } from '../collab/project-request-authority.js';
export interface RegisterDeployRoutesDeps extends RouteDeps<'db' | 'http' | 'paths' | 'ids' | 'deploy' | 'projectStore'> {
    authorizeProjectRequest: AuthorizeProjectRequest;
}
export declare function registerDeployRoutes(app: Express, ctx: RegisterDeployRoutesDeps): void;
export interface RegisterDeploymentCheckRoutesDeps extends RouteDeps<'db' | 'http' | 'deploy' | 'projectStore'> {
    authorizeProjectRequest: AuthorizeProjectRequest;
}
export declare function registerDeploymentCheckRoutes(app: Express, ctx: RegisterDeploymentCheckRoutesDeps): void;
