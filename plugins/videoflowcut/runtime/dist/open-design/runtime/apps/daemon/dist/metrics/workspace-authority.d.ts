import { Counter, Histogram } from 'prom-client';
import type { WorkspaceAuthorityCacheMode } from '../collab/workspace-authority-health.js';
export type WorkspaceAuthorityMetricSource = 'cache' | 'directory' | 'current' | 'billing' | 'sse';
export type WorkspaceAuthorityMetricReason = 'cold' | 'lease_hit' | 'lease_expired' | 'in_flight' | 'failure_backoff' | 'fresh' | 'mutation' | 'event_dirty' | 'auth_reject' | 'catch_up' | 'safety_floor' | 'mode_disabled' | 'capability_missing' | 'source_gap' | 'unhealthy' | 'healthy';
export type WorkspaceAuthorityMetricOutcome = 'allow' | 'deny' | 'unavailable' | 'fallback';
export declare const workspaceAuthorityDecisionsTotal: Counter<"mode" | "outcome" | "reason" | "source">;
export declare const workspaceAuthoritySuppressedRequestsTotal: Counter<"mode" | "reason" | "source">;
export declare const workspaceAuthorityInvalidationsTotal: Counter<"mode" | "reason" | "source">;
export declare const workspaceAuthorityRealtimeTransitionsTotal: Counter<"health" | "listener_status" | "member_events" | "mode" | "source_gap">;
export declare const workspaceAuthorityAgeMs: Histogram<"mode" | "source">;
export declare const workspaceAuthorityRevocationClearMs: Histogram<"mode">;
export declare function recordWorkspaceAuthorityDecision(input: {
    mode: WorkspaceAuthorityCacheMode;
    source: WorkspaceAuthorityMetricSource;
    reason: WorkspaceAuthorityMetricReason;
    outcome: WorkspaceAuthorityMetricOutcome;
    ageMs?: number;
}): void;
export declare function recordWorkspaceAuthoritySuppressedRequest(input: {
    mode: WorkspaceAuthorityCacheMode;
    source: WorkspaceAuthorityMetricSource;
    reason: 'lease_hit' | 'in_flight' | 'failure_backoff' | 'safety_floor';
}): void;
export declare function recordWorkspaceAuthorityInvalidation(input: {
    mode: WorkspaceAuthorityCacheMode;
    source: 'cache' | 'current';
    reason: 'mutation' | 'event_dirty' | 'auth_reject' | 'catch_up' | 'unhealthy';
}): void;
export declare function recordWorkspaceAuthorityRealtimeTransition(input: {
    mode: WorkspaceAuthorityCacheMode;
    healthy: boolean;
    memberEvents: boolean;
    listenerStatus: boolean;
    sourceGap: boolean;
}): void;
export declare function recordWorkspaceAuthorityRevocationClear(mode: WorkspaceAuthorityCacheMode, durationMs: number): void;
export declare function __resetWorkspaceAuthorityMetricsForTests(): void;
