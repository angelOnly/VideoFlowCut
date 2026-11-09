import type { Request, Response } from 'express';
import type { ToolTokenGrant, ToolTokenRegistry } from '../tool-tokens.js';
export declare function bearerTokenFromRequest(req: Request): string | undefined;
export declare function createToolRequestAuth(registry: ToolTokenRegistry): {
    authorizeToolRequest(req: Request, res: Response, operation: string, options?: {
        endpoint?: string;
    }): ToolTokenGrant | null;
    optionalToolGrantFromRequest(req: Request, options?: Parameters<ToolTokenRegistry['validate']>[1]): ToolTokenGrant | null;
    requestProjectOverride(projectId: string | null | undefined, tokenProjectId: string | null | undefined): boolean;
    requestRunOverride(runId: string | null | undefined, tokenRunId: string | null | undefined): boolean;
};
export declare function requestProjectOverride(projectId: string | null | undefined, tokenProjectId: string | null | undefined): boolean;
export declare function requestRunOverride(runId: string | null | undefined, tokenRunId: string | null | undefined): boolean;
