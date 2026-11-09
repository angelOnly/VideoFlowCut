import type { Express } from 'express';
import type Database from 'better-sqlite3';
import type { AuthorizeProjectRequest } from '../collab/project-request-authority.js';
export interface RegisterGenuiRoutesDeps {
    db: Database.Database;
    design: {
        runs: {
            get(runId: string): {
                projectId?: string | null;
            } | undefined;
        };
    };
    paths: {
        PROJECTS_DIR: string;
    };
    authorizeProjectRequest: AuthorizeProjectRequest;
}
export declare function registerGenuiRoutes(app: Express, deps: RegisterGenuiRoutesDeps): void;
