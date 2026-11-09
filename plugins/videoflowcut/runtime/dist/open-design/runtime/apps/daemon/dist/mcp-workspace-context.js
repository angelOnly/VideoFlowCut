/** Keep the bridge's view fresh at the same cadence as the daemon's directory cache. */
export const MCP_WORKSPACE_CONTEXT_TTL_MS = 15_000;
/** Back off after a directory outage instead of hammering the daemon. */
export const MCP_WORKSPACE_FAILURE_COOLDOWN_MS = 60_000;
const DIRECTORY_TIMEOUT_MS = 8_000;
/**
 * Pick the best default membership out of an already-fetched directory list.
 * Verbatim port of `selectDefaultCandidate` in vela-workspace-context.ts so the
 * bridge and the UI pick the same workspace for a multi-workspace user.
 */
export function selectDefaultMcpCandidate(items, preferredId) {
    const candidates = items.filter((item) => item.memberStatus === 'active' && item.lifecycleState === 'active');
    return ((preferredId ? candidates.find((item) => item.workspaceId === preferredId) : undefined) ??
        candidates.find((item) => item.workspaceType === 'personal') ??
        candidates[0]);
}
// Keyed by daemon base URL so a daemon URL change naturally re-bootstraps.
const cache = new Map();
const lastFailureAt = new Map();
/**
 * Resolve the signed-in workspace to scope MCP project/run calls, or null for a
 * headerless fallback (non-vela, signed-out, or a directory outage). Results are
 * cached per base URL for MCP_WORKSPACE_CONTEXT_TTL_MS; failures suppress
 * re-fetch for MCP_WORKSPACE_FAILURE_COOLDOWN_MS. `force` bypasses both.
 */
export async function resolveMcpWorkspaceContext(baseUrl, options = {}) {
    const now = Date.now();
    const cached = cache.get(baseUrl);
    if (!options.force && cached && now - cached.fetchedAt < MCP_WORKSPACE_CONTEXT_TTL_MS) {
        return cached.context;
    }
    const failedAt = lastFailureAt.get(baseUrl);
    if (!options.force &&
        failedAt !== undefined &&
        now - failedAt < MCP_WORKSPACE_FAILURE_COOLDOWN_MS) {
        return null;
    }
    try {
        const resp = await fetch(`${baseUrl}/api/workspace/directory`, {
            signal: AbortSignal.timeout(DIRECTORY_TIMEOUT_MS),
        });
        if (!resp.ok) {
            recordFailure(baseUrl);
            return null;
        }
        const data = (await resp.json());
        const selected = selectDefaultMcpCandidate(data.items, data.activeWorkspaceId ?? undefined);
        if (!selected) {
            // 200 with empty items — non-vela (dev provider) or no live membership.
            recordFailure(baseUrl);
            return null;
        }
        const context = {
            workspaceId: selected.workspaceId,
            workspaceMemberId: selected.workspaceMemberId,
            workspaceType: selected.workspaceType,
            headers: {
                'x-od-workspace-id': selected.workspaceId,
                'x-od-workspace-member-id': selected.workspaceMemberId,
            },
        };
        cache.set(baseUrl, { context, fetchedAt: Date.now() });
        lastFailureAt.delete(baseUrl);
        return context;
    }
    catch {
        recordFailure(baseUrl);
        return null;
    }
}
function recordFailure(baseUrl) {
    cache.delete(baseUrl);
    lastFailureAt.set(baseUrl, Date.now());
}
/** Test-only reset. */
export function _resetMcpWorkspaceContextCacheForTests() {
    cache.clear();
    lastFailureAt.clear();
}
//# sourceMappingURL=mcp-workspace-context.js.map