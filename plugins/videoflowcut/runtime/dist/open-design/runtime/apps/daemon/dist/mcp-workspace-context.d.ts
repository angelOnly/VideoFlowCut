import type { WorkspaceDirectoryItem } from '@open-design/contracts';
/**
 * Workspace-aware request context for the MCP stdio bridge (#6569).
 *
 * 0.18.0 introduced workspace isolation: projects are lazy-adopted into the
 * signed-in user's workspace (`bindUnboundProjectsToPersonalWorkspace`), so the
 * NO-SCOPE catalog (`GET /api/projects`) returns empty to a headerless caller
 * and bound-project reads 400 with `WORKSPACE_CONTEXT_REQUIRED`. The MCP bridge
 * therefore resolves the daemon's signed-in workspace once via the headerless
 * `GET /api/workspace/directory` and sends the resulting `x-od-workspace-*`
 * headers on every project/run call.
 *
 * Selection mirrors the daemon's own `selectDefaultCandidate`
 * (collab/vela-workspace-context.ts): active memberships only, then the
 * personal workspace, then the first remaining candidate.
 */
export interface McpWorkspaceContext {
    workspaceId: string;
    workspaceMemberId: string;
    workspaceType: 'personal' | 'team';
    headers: {
        'x-od-workspace-id': string;
        'x-od-workspace-member-id': string;
    };
}
/** Keep the bridge's view fresh at the same cadence as the daemon's directory cache. */
export declare const MCP_WORKSPACE_CONTEXT_TTL_MS = 15000;
/** Back off after a directory outage instead of hammering the daemon. */
export declare const MCP_WORKSPACE_FAILURE_COOLDOWN_MS = 60000;
/**
 * Pick the best default membership out of an already-fetched directory list.
 * Verbatim port of `selectDefaultCandidate` in vela-workspace-context.ts so the
 * bridge and the UI pick the same workspace for a multi-workspace user.
 */
export declare function selectDefaultMcpCandidate(items: WorkspaceDirectoryItem[], preferredId?: string): WorkspaceDirectoryItem | undefined;
/**
 * Resolve the signed-in workspace to scope MCP project/run calls, or null for a
 * headerless fallback (non-vela, signed-out, or a directory outage). Results are
 * cached per base URL for MCP_WORKSPACE_CONTEXT_TTL_MS; failures suppress
 * re-fetch for MCP_WORKSPACE_FAILURE_COOLDOWN_MS. `force` bypasses both.
 */
export declare function resolveMcpWorkspaceContext(baseUrl: string, options?: {
    force?: boolean;
}): Promise<McpWorkspaceContext | null>;
/** Test-only reset. */
export declare function _resetMcpWorkspaceContextCacheForTests(): void;
