import { type DeliverableSyntaxRepairState as ContractDeliverableSyntaxRepairState } from '@open-design/contracts';
import type { DeliverableSyntaxResult } from './deliverable-syntax.js';
export declare const DEFAULT_DELIVERABLE_SYNTAX_REPAIR_MAX_ATTEMPTS = 3;
export type DeliverableSyntaxRepairState = ContractDeliverableSyntaxRepairState;
export type DeliverableSyntaxRepairDecision = {
    action: 'accept';
    next: DeliverableSyntaxRepairState | undefined;
} | {
    action: 'retry';
    next: DeliverableSyntaxRepairState;
} | {
    action: 'block';
    next: DeliverableSyntaxRepairState | undefined;
    reason: 'attempt_limit_reached' | 'no_progress';
};
/**
 * Decide the host-owned repair loop without spending a retry for a passing,
 * skipped, or inconclusive check. `attempt` counts accepted repair patches,
 * not validator executions: the initial validation is attempt zero.
 */
export declare function decideDeliverableSyntaxRepair(input: {
    result: DeliverableSyntaxResult;
    previous: DeliverableSyntaxRepairState | undefined;
    maxAttempts?: number;
}): DeliverableSyntaxRepairDecision;
/** Render only the host-confirmed syntax facts; never replay the whole file. */
export declare function renderDeliverableSyntaxRepairPrompt(input: {
    result: Extract<DeliverableSyntaxResult, {
        status: 'repairable';
    }>;
    attempt: number;
    maxAttempts: number;
}): string;
