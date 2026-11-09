import type { Express } from 'express';
import type { BrowserSessionService } from '../browser-sessions.js';
import type { AuthorizeProjectRequest } from '../collab/project-request-authority.js';
import type { RouteDeps } from '../server-context.js';
export interface RegisterBrowserSessionRoutesDeps extends RouteDeps<'db' | 'http' | 'projectStore'> {
    browserSessions: BrowserSessionService;
    authorizeProjectRequest: AuthorizeProjectRequest;
}
export declare function registerBrowserSessionRoutes(app: Express, ctx: RegisterBrowserSessionRoutesDeps): void;
