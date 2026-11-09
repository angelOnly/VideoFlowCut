import type { Express, RequestHandler } from 'express';
export interface RegisterDaemonRoutesDeps {
    db: any;
    paths: {
        PROJECT_ROOT: string;
        RESOURCE_ROOT: string;
        RUNTIME_DATA_DIR: string;
    };
    http: {
        requireLocalDaemonRequest: RequestHandler;
        sendApiError: (...args: any[]) => any;
    };
    host: string;
    getResolvedPort: () => number;
    getDaemonShuttingDown: () => boolean;
    sandboxRuntime: {
        enabled: boolean;
        roots?: unknown;
    };
    env: NodeJS.ProcessEnv;
}
export declare function registerDaemonRoutes(app: Express, deps: RegisterDaemonRoutesDeps): void;
