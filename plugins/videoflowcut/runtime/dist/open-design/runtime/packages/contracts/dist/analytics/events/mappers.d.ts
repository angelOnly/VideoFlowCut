import type { AnalyticsConfigureGlobals } from '../public-params.js';
import type { TrackingArtifactKind, TrackingByokProviderId, TrackingCliProviderId, TrackingExecutionMode, TrackingFeedbackProviderId, TrackingFidelity, TrackingFileSizeBucket, TrackingFileType, TrackingHarness, TrackingNewProjectTab, TrackingProjectKind } from './shared-enums.js';
import type { TrackingSessionMode, TrackingSettingsArea } from './ui-click.js';
export declare function sessionModeToTracking(mode: string | null | undefined): TrackingSessionMode;
export interface ProjectKindTrackingHints {
    fidelity?: string | null | undefined;
    intent?: string | null | undefined;
    platform?: string | null | undefined;
    platformTargets?: readonly string[] | null | undefined;
}
export declare function projectKindToTracking(kind: string | null | undefined, videoModel?: string | null, hints?: ProjectKindTrackingHints): TrackingProjectKind | null;
export declare function projectKindFromMetadataToTracking(metadata: {
    kind?: string | null;
    videoModel?: string | null;
    fidelity?: string | null;
    intent?: string | null;
    platform?: string | null;
    platformTargets?: readonly string[] | null;
} | null | undefined): TrackingProjectKind | null;
export declare function projectKindFromMetadataToTrackingOrLegacyDefault(metadata: Parameters<typeof projectKindFromMetadataToTracking>[0]): TrackingProjectKind;
export declare function createTabToTracking(tab: string): TrackingNewProjectTab;
export declare function fidelityToTracking(fidelity: string | null | undefined): TrackingFidelity;
export declare function executionModeToTracking(mode: string | null | undefined): TrackingExecutionMode;
export declare function modelIdForTracking(model: string | null | undefined): string;
export declare function agentIdToTracking(agentId: string | null | undefined): TrackingCliProviderId;
export declare function feedbackAgentProviderIdToTracking(agentId: string | null | undefined): TrackingFeedbackProviderId;
export declare function byokProtocolToTracking(protocol: string | null | undefined): TrackingByokProviderId | null;
export declare function settingsSectionToTracking(section: string): TrackingSettingsArea;
export declare function artifactKindToTracking(args: {
    rendererId?: string | null;
    fileKind?: string | null;
}): TrackingArtifactKind;
export declare function fileSizeBucketToTracking(bytes: number): TrackingFileSizeBucket;
export declare function fileTypeToTracking(args: {
    mime?: string | null;
    isFolder?: boolean;
    isZip?: boolean;
}): TrackingFileType;
export interface DeriveConfigureGlobalsInput {
    mode?: string | null;
    agentId?: string | null;
    agents?: ReadonlyArray<{
        id: string;
        available?: boolean;
    }>;
    byokConfigured?: boolean;
    amrAuthorized?: boolean;
}
export declare function deriveConfigureGlobals(input: DeriveConfigureGlobalsInput): AnalyticsConfigureGlobals;
export declare function normalizeCustomReason(text: string | null | undefined): string;
/**
 * Project a run's rollout decision onto the two analytics fields.
 *
 * Structural input on purpose: this file stays free of the strategy contract,
 * and a test can hand it a literal. A run with no decision at all (every run
 * before the strategy existed, and every run on an install that never opted in)
 * reports nothing rather than guessing `ordinary` — absent and "took the
 * ordinary route" are different facts and the dashboard should be able to tell
 * them apart.
 */
/**
 * The OD Next gate that refused a turn, for `run_finished`.
 *
 * `run_finished.result` is derived from the PHYSICAL run status, and a refused
 * OD Next turn normally exits 0 with a complete reply on screen — so this whole
 * class of failure reported `result: 'success'` while the user was looking at a
 * red card, and nothing queryable disagreed.
 *
 * Only a TERMINAL `blocked` projection counts. A task still running may block
 * later or may not, and a `completed` / `canceled` one refused nothing; either
 * would make the field mean "an OD Next task passed through here", which is
 * what `harness` already says.
 *
 * `reasonCodes[0]` deliberately, not the whole list: it is the same value the
 * failure card keys on and the same one the daemon logs, so the metric and the
 * thing the user saw cannot drift apart.
 */
export declare function odNextBlockedAnalyticsFromStrategyTask(strategyTask: {
    terminal?: boolean;
    outcome?: string;
    blockedContext?: {
        reasonCodes?: readonly string[] | undefined;
    } | null | undefined;
} | null | undefined): {
    od_next_blocked_reason_code?: string;
};
export declare function harnessAnalyticsFromRolloutDecision(decision: {
    effectiveMode?: string;
    primaryReasonCode?: string;
} | null | undefined): {
    harness?: TrackingHarness;
    harness_fallback_reason?: string;
};
//# sourceMappingURL=mappers.d.ts.map