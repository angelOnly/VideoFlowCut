import type { Express } from 'express';
export interface RegisterAutomationRoutesDeps {
    paths: {
        RUNTIME_DATA_DIR: string;
    };
}
export declare function registerAutomationRoutes(app: Express, deps: RegisterAutomationRoutesDeps): void;
