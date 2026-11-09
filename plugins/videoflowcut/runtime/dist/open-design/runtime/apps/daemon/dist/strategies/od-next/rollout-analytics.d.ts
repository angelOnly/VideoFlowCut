import type { OdNextRolloutDecision } from './rollout.js';
/** Low-cardinality fields shared byte-for-byte by run_created/run_finished. */
export declare function odNextRolloutAnalyticsProperties(decision: OdNextRolloutDecision | null): Record<string, unknown>;
