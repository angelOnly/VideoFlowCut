import type { Express, Request, Response } from 'express';
import type { ToolTokenGrant } from '../tool-tokens.js';
type ProjectRecord = {
    id: string;
    designSystemId?: string | null;
};
type SendApiError = (res: Response, status: number, code: string, message: string, extras?: Record<string, unknown>) => void;
export type RegisterDesignSystemToolRoutesDeps = {
    auth: {
        authorizeToolRequest: (req: Request, res: Response, operation: string) => ToolTokenGrant | null;
    };
    http: {
        sendApiError: SendApiError;
    };
    paths: {
        DESIGN_SYSTEMS_DIR: string;
        USER_DESIGN_SYSTEMS_DIR: string;
    };
    projects: {
        getProject: (id: string) => ProjectRecord | null | undefined;
    };
};
export declare function registerDesignSystemToolRoutes(app: Express, ctx: RegisterDesignSystemToolRoutesDeps): void;
export {};
