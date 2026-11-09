import type { OdNextRolloutDecision, OdNextRolloutMode, OdNextRolloutModeSource, OdNextRolloutTaskType } from '@open-design/contracts';
export type { OdNextRolloutDecision, OdNextRolloutMode, OdNextRolloutModeSource, OdNextRolloutTaskType, } from '@open-design/contracts';
/**
 * Legacy app-config shape accepted for source compatibility. The retired field is ignored. the
 * daemon's `AppConfigPrefs`, a partially read config, and a test literal all
 * satisfy it without this module depending on the config reader.
 */
export interface OdNextRolloutAppConfig {
    odNextStrategyMode?: OdNextRolloutMode | null | undefined;
}
export interface OdNextRolloutPolicy {
    requestedMode: OdNextRolloutMode;
    requestedModeSource: OdNextRolloutModeSource;
    assignmentPercent: number;
    assignmentSalt: string;
    contentEnabled: boolean;
    behaviorEnabled: boolean;
    eligibleTaskTypes: readonly OdNextRolloutTaskType[];
    eligibleAgents: readonly string[];
    productionActiveApproved: boolean;
    localSyntheticCanary: boolean;
}
export declare function readOdNextRolloutPolicy(env?: NodeJS.ProcessEnv, appConfig?: OdNextRolloutAppConfig | null): OdNextRolloutPolicy;
export declare function odNextTaskTypeForProjectScenarioBinding(binding: {
    provenance?: unknown;
    taskProfile?: unknown;
} | null | undefined): OdNextRolloutTaskType | null;
export declare function stableOdNextAssignmentBucket(identity: string, salt: string): number;
export declare function evaluateOdNextRollout(input: {
    policy: OdNextRolloutPolicy;
    assignmentIdentity: string;
    taskType: OdNextRolloutTaskType | null;
    agentId: string | null;
    agentVersion: string | null;
    sourceKind: string | null;
    routeApplicability?: 'eligible' | 'explicit_user' | 'not_applicable';
}): OdNextRolloutDecision;
/**
 * What decides OD Next for this daemon, and what that decision came out as.
 *
 * Derived, with nothing persisted behind it. This used to consult a
 * `strategy_rollout_controls` row — a stop latch that outranked the saved mode
 * for the whole daemon instance and survived restart. That row is gone, so the
 * effective mode is a pure function of the requested mode and the two content
 * flags, and two callers reading this at the same moment cannot disagree.
 *
 * `requestedModeSource` is what makes this worth reporting at all: the mode
 * alone does not say who chose it, and `default` and a saved `off` now resolve
 * to opposite routes.
 */
export declare function readOdNextRolloutControlStatus(env?: NodeJS.ProcessEnv, appConfig?: OdNextRolloutAppConfig | null): {
    strategyId: 'od-next-strategy';
    scope: 'daemon_instance';
    requestedMode: OdNextRolloutMode;
    requestedModeSource: OdNextRolloutModeSource;
    effectiveMode: OdNextRolloutMode;
};
