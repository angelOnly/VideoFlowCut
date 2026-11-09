export function resolveWorkspaceAuthorityCacheMode(value) {
    if (value == null || value.trim() === '')
        return 'adaptive';
    const normalized = value.trim().toLowerCase();
    return normalized === 'observe' || normalized === 'adaptive'
        ? normalized
        : 'legacy';
}
/**
 * Converts strict upstream health into permission to suppress legacy polls.
 * A healthy frame is only a candidate: adaptive mode remains on legacy
 * cadence until one exact-workspace catch-up completes. Generation fencing
 * prevents a late catch-up from re-enabling suppression after a disconnect.
 */
export function createWorkspaceAuthorityHealthCoordinator(options) {
    const generations = new Map();
    const retryTimers = new Map();
    const catchUpRetryMs = Math.max(1, options.catchUpRetryMs ?? 30_000);
    const setHealthy = (workspaceId, healthy) => {
        options.setDirectoryPollingHealthy(workspaceId, healthy);
        options.setBillingPollingHealthy(workspaceId, healthy);
        options.setContextCachingHealthy?.(workspaceId, healthy);
    };
    function clearRetry(workspaceId) {
        const timer = retryTimers.get(workspaceId);
        if (!timer)
            return;
        clearTimeout(timer);
        retryTimers.delete(workspaceId);
    }
    async function update(input) {
        const workspaceId = input.workspaceId?.trim() ?? '';
        if (!workspaceId)
            return;
        clearRetry(workspaceId);
        const generation = (generations.get(workspaceId) ?? 0) + 1;
        generations.set(workspaceId, generation);
        if (options.mode !== 'adaptive' || !input.healthy) {
            setHealthy(workspaceId, false);
            options.onDecision?.({
                source: 'sse',
                reason: input.healthy ? 'mode_disabled' : 'unhealthy',
                outcome: 'fallback',
            });
            return;
        }
        // Keep legacy cadence through the catch-up window. Only a completed
        // catch-up in the still-current health generation may enable the floor.
        setHealthy(workspaceId, false);
        try {
            await options.catchUp(workspaceId);
        }
        catch (error) {
            options.onDecision?.({
                source: 'sse',
                reason: 'catch_up',
                outcome: 'unavailable',
            });
            options.onError?.(error);
            // The hub edge-publishes health, so another healthy heartbeat will not
            // re-notify us after a transient catch-up failure. Retry locally at a
            // bounded cadence; a disconnect/unhealthy update advances the generation
            // and cancels this recovery before it can re-enable suppression.
            if (generations.get(workspaceId) === generation) {
                const timer = setTimeout(() => {
                    retryTimers.delete(workspaceId);
                    if (generations.get(workspaceId) !== generation)
                        return;
                    void update({ workspaceId, healthy: true });
                }, catchUpRetryMs);
                timer.unref?.();
                retryTimers.set(workspaceId, timer);
            }
            return;
        }
        if (generations.get(workspaceId) !== generation)
            return;
        setHealthy(workspaceId, true);
        options.onDecision?.({
            source: 'sse',
            reason: 'healthy',
            outcome: 'allow',
        });
    }
    return {
        update,
    };
}
//# sourceMappingURL=workspace-authority-health.js.map