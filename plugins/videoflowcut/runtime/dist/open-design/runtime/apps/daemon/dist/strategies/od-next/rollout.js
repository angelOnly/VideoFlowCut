import { createHash } from 'node:crypto';
import { AGENT_DEFS } from '../../runtimes/registry.js';
const DEFAULT_TASK_TYPES = [
    'prototype',
    'ppt',
    'marketing',
    'hyperframes',
    'discovery',
    'motion-design',
];
function bool(value, fallback) {
    if (value === undefined)
        return fallback;
    return value === '1' || value.toLowerCase() === 'true';
}
function list(value) {
    return (value ?? '').split(',').map((item) => item.trim()).filter(Boolean);
}
function envMode(value) {
    const trimmed = value?.trim() ?? '';
    if (trimmed === '')
        return null;
    return trimmed === 'observe' || trimmed === 'active' ? trimmed : 'off';
}
/** User Labs preference is retired. Process overrides remain an engineering rollback. */
function resolveRequestedMode(env, _appConfig) {
    const fromEnv = envMode(env.OD_NEXT_STRATEGY_ROLLOUT);
    if (fromEnv)
        return { mode: fromEnv, source: 'env' };
    return { mode: 'active', source: 'default' };
}
export function readOdNextRolloutPolicy(env = process.env, appConfig) {
    const taskTypes = list(env.OD_NEXT_STRATEGY_TASK_TYPES).filter((value) => (value === 'prototype' || value === 'ppt' || value === 'marketing' || value === 'hyperframes' || value === 'discovery' || value === 'motion-design'));
    const percent = Number(env.OD_NEXT_STRATEGY_ASSIGNMENT_PERCENT ?? '100');
    const requested = resolveRequestedMode(env, appConfig);
    return {
        requestedMode: requested.mode,
        requestedModeSource: requested.source,
        assignmentPercent: Number.isFinite(percent) ? Math.max(0, Math.min(100, percent)) : 0,
        assignmentSalt: env.OD_NEXT_STRATEGY_ASSIGNMENT_SALT?.trim() || 'od-next-v2-rollout',
        contentEnabled: bool(env.OD_NEXT_STRATEGY_CONTENT_ENABLED, true),
        behaviorEnabled: bool(env.OD_NEXT_STRATEGY_BEHAVIOR_ENABLED, true),
        eligibleTaskTypes: taskTypes.length > 0 ? taskTypes : DEFAULT_TASK_TYPES,
        eligibleAgents: list(env.OD_NEXT_STRATEGY_AGENTS).length > 0
            ? list(env.OD_NEXT_STRATEGY_AGENTS)
            : AGENT_DEFS.map((agent) => agent.id),
        productionActiveApproved: bool(env.OD_NEXT_STRATEGY_PRODUCTION_ACTIVE_APPROVED, true),
        localSyntheticCanary: bool(env.OD_NEXT_STRATEGY_LOCAL_SYNTHETIC_CANARY, false),
    };
}
export function odNextTaskTypeForProjectScenarioBinding(binding) {
    if (binding?.provenance !== 'automatic_default')
        return null;
    return binding.taskProfile === 'prototype'
        || binding.taskProfile === 'ppt'
        || binding.taskProfile === 'marketing'
        || binding.taskProfile === 'hyperframes'
        || binding.taskProfile === 'motion-design'
        ? binding.taskProfile
        : null;
}
export function stableOdNextAssignmentBucket(identity, salt) {
    const digest = createHash('sha256').update(`${salt}:${identity}`).digest();
    return digest.readUInt32BE(0) % 10_000;
}
export function evaluateOdNextRollout(input) {
    const { policy } = input;
    const assignmentBucket = stableOdNextAssignmentBucket(input.assignmentIdentity, policy.assignmentSalt);
    const reasons = [];
    const routeApplicability = input.routeApplicability ?? 'eligible';
    if (routeApplicability === 'explicit_user') {
        reasons.push('od_next_rollout_explicit_user_authority');
    }
    else if (routeApplicability === 'not_applicable') {
        reasons.push('od_next_rollout_not_applicable');
    }
    const evaluateEligibility = routeApplicability === 'eligible';
    if (policy.requestedMode === 'off')
        reasons.push('od_next_rollout_off');
    if (!policy.contentEnabled)
        reasons.push('od_next_rollout_content_disabled');
    if (!policy.behaviorEnabled)
        reasons.push('od_next_rollout_behavior_disabled');
    if (evaluateEligibility && (!input.taskType || !policy.eligibleTaskTypes.includes(input.taskType))) {
        reasons.push('od_next_rollout_task_bucket_ineligible');
    }
    if (evaluateEligibility && (!input.agentId || !policy.eligibleAgents.includes(input.agentId))) {
        reasons.push('od_next_rollout_agent_ineligible');
    }
    if (evaluateEligibility && input.sourceKind !== 'bundled')
        reasons.push('od_next_rollout_bundled_identity_required');
    if (evaluateEligibility && assignmentBucket >= policy.assignmentPercent * 100) {
        reasons.push('od_next_rollout_assignment_excluded');
    }
    // This is an explicit, local-only escape hatch used to prove the public
    // daemon/browser chain while X1/X2 remain unresolved. It must never be
    // inferred from a runtime version (or enabled in a production process).
    const syntheticCanary = Boolean(policy.localSyntheticCanary && process.env.NODE_ENV !== 'production');
    if (evaluateEligibility && !policy.productionActiveApproved && !syntheticCanary) {
        reasons.push('od_next_rollout_x2_active_unapproved');
    }
    const requestedActive = policy.requestedMode === 'active';
    const eligible = evaluateEligibility && requestedActive && reasons.length === 0;
    const effectiveMode = !evaluateEligibility
        ? 'off'
        : policy.requestedMode === 'off'
            || !policy.contentEnabled
            || !policy.behaviorEnabled
            ? 'off'
            : eligible
                ? 'active'
                : 'observe';
    return {
        schemaVersion: 1,
        decisionClass: routeApplicability === 'explicit_user'
            ? 'explicit_user'
            : routeApplicability === 'not_applicable'
                ? 'not_applicable'
                : effectiveMode,
        requestedMode: policy.requestedMode,
        effectiveMode,
        taskType: input.taskType,
        assignmentBucket,
        eligible,
        syntheticCanary,
        reasonCodes: [...new Set(reasons)],
        primaryReasonCode: reasons[0] ?? 'od_next_rollout_eligible',
    };
}
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
export function readOdNextRolloutControlStatus(env = process.env, appConfig) {
    const policy = readOdNextRolloutPolicy(env, appConfig);
    const effectiveMode = policy.requestedMode === 'off'
        || !policy.contentEnabled
        || !policy.behaviorEnabled
        ? 'off'
        : policy.requestedMode;
    return {
        strategyId: 'od-next-strategy',
        scope: 'daemon_instance',
        requestedMode: policy.requestedMode,
        requestedModeSource: policy.requestedModeSource,
        effectiveMode,
    };
}
//# sourceMappingURL=rollout.js.map