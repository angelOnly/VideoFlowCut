import { type DeliverableSyntaxMetrics, type DeliverableSyntaxRepairState, type DeliverableSyntaxValidationEvidence, type DeliverableSyntaxFinalizationReason, type DeliverableSyntaxSafeFixRefusal, type DeliverableSyntaxFinalization } from '@open-design/contracts';
export declare const HOST_SYNTAX_MAX_PATCHES = 8;
export declare const HOST_SYNTAX_MAX_EDITED_CHARACTERS = 32;
export declare const HOST_SYNTAX_REPAIR_BUDGET_MS = 1000;
type HostSummary = Required<Pick<DeliverableSyntaxFinalization, 'summaryVersion' | 'initialStatus' | 'repairEngine' | 'stagedPatchCount' | 'committedPatchCount' | 'committedRepairRules'>>;
export type DeliverableSyntaxFinalizationOutcome = {
    action: 'skip';
} | {
    action: 'allow';
    validation: DeliverableSyntaxValidationEvidence;
} | {
    action: 'warn';
    validation: DeliverableSyntaxValidationEvidence;
    location: string;
    reason: DeliverableSyntaxFinalizationReason;
    refusal?: DeliverableSyntaxSafeFixRefusal;
};
/**
 * Host-owned best-effort syntax finalizer. It never executes the artifact or starts a
 * model turn. Patches stay in memory until the complete candidate parses, then
 * a guarded atomic replacement publishes the verified bytes.
 */
declare function finalizeCandidate(input: {
    artifactKind: string | null | undefined;
    projectRoot: string;
    entryFile: string | null | undefined;
    relatedPaths?: readonly string[];
    processTreeQuiescent: boolean;
    repairState?: DeliverableSyntaxRepairState;
    previousMetrics?: DeliverableSyntaxMetrics;
    checkedAt?: number;
    /** Test seam for measuring parser wall time without changing checkedAt. */
    monotonicNow?: () => number;
    /** Test seam for repair-window wall-clock timestamps. */
    wallNow?: () => number;
}, summary: HostSummary, progress: {
    validation?: DeliverableSyntaxValidationEvidence;
}): Promise<DeliverableSyntaxFinalizationOutcome>;
/** Only the delivery owner may recover from an internal finalizer failure. */
export declare class DeliverableSyntaxInternalError extends Error {
    readonly outcome: Extract<DeliverableSyntaxFinalizationOutcome, {
        action: 'warn';
    }>;
    constructor(outcome: Extract<DeliverableSyntaxFinalizationOutcome, {
        action: 'warn';
    }>, cause: unknown);
}
export declare function finalizeDeliverableSyntax(input: Parameters<typeof finalizeCandidate>[0]): Promise<DeliverableSyntaxFinalizationOutcome>;
export {};
