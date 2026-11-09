import { Counter, Histogram, register } from 'prom-client';
export const workspaceAuthorityDecisionsTotal = new Counter({
    name: 'open_design_workspace_authority_decisions_total',
    help: 'Workspace authority decisions by bounded mode, source, reason, and outcome.',
    labelNames: ['mode', 'source', 'reason', 'outcome'],
    registers: [register],
});
export const workspaceAuthoritySuppressedRequestsTotal = new Counter({
    name: 'open_design_workspace_authority_suppressed_requests_total',
    help: 'Upstream Workspace authority requests avoided by a valid lease or realtime safety floor.',
    labelNames: ['mode', 'source', 'reason'],
    registers: [register],
});
export const workspaceAuthorityInvalidationsTotal = new Counter({
    name: 'open_design_workspace_authority_invalidations_total',
    help: 'Workspace authority cache invalidations by bounded reason.',
    labelNames: ['mode', 'source', 'reason'],
    registers: [register],
});
export const workspaceAuthorityRealtimeTransitionsTotal = new Counter({
    name: 'open_design_workspace_authority_realtime_transitions_total',
    help: 'Strict Workspace authority realtime health observations.',
    labelNames: ['mode', 'health', 'member_events', 'listener_status', 'source_gap'],
    registers: [register],
});
export const workspaceAuthorityAgeMs = new Histogram({
    name: 'open_design_workspace_authority_age_ms',
    help: 'Age of cached Workspace authority when it is used for a local response.',
    labelNames: ['mode', 'source'],
    buckets: [10, 100, 500, 1_000, 5_000, 10_000, 15_000, 30_000, 60_000, 300_000],
    registers: [register],
});
export const workspaceAuthorityRevocationClearMs = new Histogram({
    name: 'open_design_workspace_authority_revocation_clear_ms',
    help: 'Time from receiving an access-revoked frame to clearing local authority state.',
    labelNames: ['mode'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 25, 50, 100, 250, 500, 1_000],
    registers: [register],
});
export function recordWorkspaceAuthorityDecision(input) {
    try {
        workspaceAuthorityDecisionsTotal.inc({
            mode: input.mode,
            source: input.source,
            reason: input.reason,
            outcome: input.outcome,
        });
        if (input.ageMs != null && Number.isFinite(input.ageMs) && input.ageMs >= 0) {
            workspaceAuthorityAgeMs.observe({ mode: input.mode, source: input.source }, input.ageMs);
        }
    }
    catch {
        // Metrics are diagnostic only and must never change an authority result.
    }
}
export function recordWorkspaceAuthoritySuppressedRequest(input) {
    try {
        workspaceAuthoritySuppressedRequestsTotal.inc(input);
    }
    catch {
        // Metrics are diagnostic only and must never change an authority result.
    }
}
export function recordWorkspaceAuthorityInvalidation(input) {
    try {
        workspaceAuthorityInvalidationsTotal.inc(input);
    }
    catch {
        // Metrics are diagnostic only and must never change an authority result.
    }
}
export function recordWorkspaceAuthorityRealtimeTransition(input) {
    try {
        workspaceAuthorityRealtimeTransitionsTotal.inc({
            mode: input.mode,
            health: input.healthy ? 'healthy' : 'unhealthy',
            member_events: input.memberEvents ? 'present' : 'missing',
            listener_status: input.listenerStatus ? 'present' : 'missing',
            source_gap: input.sourceGap ? 'yes' : 'no',
        });
    }
    catch {
        // Metrics are diagnostic only and must never change an authority result.
    }
}
export function recordWorkspaceAuthorityRevocationClear(mode, durationMs) {
    if (!Number.isFinite(durationMs) || durationMs < 0)
        return;
    try {
        workspaceAuthorityRevocationClearMs.observe({ mode }, durationMs);
    }
    catch {
        // Metrics are diagnostic only and must never change an authority result.
    }
}
export function __resetWorkspaceAuthorityMetricsForTests() {
    workspaceAuthorityDecisionsTotal.reset();
    workspaceAuthoritySuppressedRequestsTotal.reset();
    workspaceAuthorityInvalidationsTotal.reset();
    workspaceAuthorityRealtimeTransitionsTotal.reset();
    workspaceAuthorityAgeMs.reset();
    workspaceAuthorityRevocationClearMs.reset();
}
//# sourceMappingURL=workspace-authority.js.map