import { type DeliverableSyntaxCheckResult, type DeliverableSyntaxMetrics, type DeliverableSyntaxSafeFixRule } from '@open-design/contracts';
/** Add one actual parser invocation to the persisted per-Run aggregate. */
export declare function recordDeliverableSyntaxCheck(input: {
    previous?: DeliverableSyntaxMetrics;
    result: DeliverableSyntaxCheckResult;
    durationMs: number;
    checkedAtMs: number;
}): DeliverableSyntaxMetrics;
/** Add one staged deterministic patch to the persisted per-Run aggregate. */
export declare function recordDeliverableSyntaxSafeFix(input: {
    previous: DeliverableSyntaxMetrics;
    durationMs: number;
    rule: DeliverableSyntaxSafeFixRule;
}): DeliverableSyntaxMetrics;
/** Freeze the repair-to-terminal window at the physical Run terminal boundary. */
export declare function recordDeliverableSyntaxDelivery(input: {
    previous: DeliverableSyntaxMetrics;
    terminalAtMs: number;
}): DeliverableSyntaxMetrics;
