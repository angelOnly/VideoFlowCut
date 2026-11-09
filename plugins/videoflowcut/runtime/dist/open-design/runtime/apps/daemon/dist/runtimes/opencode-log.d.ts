import { type AgentServiceFailureCode } from './auth.js';
export interface OpenCodeServiceFailure {
    code: AgentServiceFailureCode;
    message: string;
    retryable: boolean;
    statusCode: number | null;
}
export declare function resolveOpenCodeLogDir(env: Record<string, string | undefined>): string | null;
export declare function readLatestOpenCodeLogTail(logDir: string, options?: {
    maxBytes?: number;
    since?: number;
}): string | null;
export declare function extractOpenCodeServiceFailure(logTail: string): OpenCodeServiceFailure | null;
export declare function readOpenCodeServiceFailure(env: Record<string, string | undefined>, options?: {
    since?: number;
}): OpenCodeServiceFailure | null;
