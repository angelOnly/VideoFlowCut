import type { Express } from 'express';
import type { RouteDeps } from '../server-context.js';
import type { AuthorizeProjectRequest } from '../collab/project-request-authority.js';
export interface RegisterChatRoutesDeps extends RouteDeps<'db' | 'design' | 'http' | 'chat' | 'agents' | 'critique' | 'validation' | 'lifecycle' | 'paths' | 'telemetry' | 'appConfig'> {
    authorizeProjectRequest: AuthorizeProjectRequest;
}
export declare function registerChatRoutes(app: Express, ctx: RegisterChatRoutesDeps): void;
