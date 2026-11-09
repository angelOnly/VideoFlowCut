export declare const DEFAULT_TOOL_TOKEN_TTL_MS: number;
export declare const CHAT_TOOL_TOKEN_TTL_BUFFER_MS: number;
export declare function resolveChatToolTokenTtlMs(inactivityTimeoutMs: number): number;
export declare const MEDIA_TASK_WAIT_TOOL_ENDPOINT = "/api/media/tasks/:id/wait";
export declare const STOCK_SEARCH_TOOL_ENDPOINT = "/api/tools/media/stock-search";
export declare const HYPERFRAMES_SCAFFOLD_TOOL_ENDPOINT = "/api/tools/media/hyperframes/scaffold";
export declare const PROJECT_EXPORT_TOOL_ENDPOINT = "/api/projects/:id/export/:format";
export declare const DELIVERABLE_SYNTAX_CHECK_TOOL_ENDPOINT = "/api/tools/deliverable-syntax/check";
export declare const CHAT_TOOL_ENDPOINTS: readonly ['/api/tools/motion-work/stage', '/api/tools/live-artifacts/create', '/api/tools/live-artifacts/list', '/api/tools/live-artifacts/refresh', '/api/tools/live-artifacts/update', '/api/tools/connectors/list', '/api/tools/connectors/execute', '/api/tools/design-systems/read', '/api/tools/media/generate', "/api/tools/media/stock-search", "/api/tools/media/hyperframes/scaffold", "/api/tools/deliverable-syntax/check", "/api/media/tasks/:id/wait", "/api/projects/:id/export/:format", '/api/tools/library/search', '/api/tools/library/apply'];
export declare const CHAT_TOOL_OPERATIONS: readonly ['motion-work:stage', 'live-artifacts:create', 'live-artifacts:list', 'live-artifacts:refresh', 'live-artifacts:update', 'connectors:list', 'connectors:execute', 'design-systems:read', 'media:generate', 'media:stock-search', 'media:scaffold', 'deliverable-syntax:check', 'project:export', 'library:search', 'library:apply'];
export type ToolEndpoint = (typeof CHAT_TOOL_ENDPOINTS)[number] | (string & {});
export type ToolOperation = (typeof CHAT_TOOL_OPERATIONS)[number] | (string & {});
export type ToolTokenRevocationReason = 'child_exit' | 'sse_end' | 'ttl_expired' | 'manual';
export type ToolTokenErrorCode = 'TOOL_TOKEN_MISSING' | 'TOOL_TOKEN_INVALID' | 'TOOL_TOKEN_EXPIRED' | 'TOOL_ENDPOINT_DENIED' | 'TOOL_OPERATION_DENIED';
export interface ToolTokenGrant {
    token: string;
    runId: string;
    projectId: string;
    allowedEndpoints: readonly ToolEndpoint[];
    allowedOperations: readonly ToolOperation[];
    issuedAt: string;
    expiresAt: string;
    pluginSnapshotId?: string;
    pluginTrust?: 'trusted' | 'restricted' | 'bundled';
    pluginCapabilitiesGranted?: readonly string[];
}
export interface MintToolTokenOptions {
    runId: string;
    projectId: string;
    allowedEndpoints?: readonly ToolEndpoint[];
    allowedOperations?: readonly ToolOperation[];
    ttlMs?: number;
    nowMs?: number;
    pluginSnapshotId?: string;
    pluginTrust?: 'trusted' | 'restricted' | 'bundled';
    pluginCapabilitiesGranted?: readonly string[];
}
export interface RefreshToolTokenOptions {
    ttlMs?: number;
    nowMs?: number;
}
export type ToolTokenValidationResult = {
    ok: true;
    grant: ToolTokenGrant;
} | {
    ok: false;
    code: ToolTokenErrorCode;
    message: string;
};
export declare function checkConnectorAccess(grant: ToolTokenGrant, connectorId: string): {
    ok: true;
} | {
    ok: false;
    reason: string;
};
export declare class ToolTokenRegistry {
    #private;
    mint(options: MintToolTokenOptions): ToolTokenGrant;
    validate(token: string | null | undefined, options?: {
        endpoint?: string;
        operation?: string;
        nowMs?: number;
    }): ToolTokenValidationResult;
    refreshToken(token: string | null | undefined, options?: RefreshToolTokenOptions): ToolTokenGrant | null;
    revokeToken(token: string | null | undefined, _reason?: ToolTokenRevocationReason): boolean;
    revokeRun(runId: string, reason?: ToolTokenRevocationReason): number;
    activeTokenCount(): number;
    activeRunTokenCount(runId: string): number;
    clear(): void;
}
export declare const toolTokenRegistry: ToolTokenRegistry;
