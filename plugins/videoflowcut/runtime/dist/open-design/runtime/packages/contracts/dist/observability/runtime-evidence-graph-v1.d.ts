/** Describes native observation completeness; never an execution prerequisite. */
export type RuntimeObservationEvidenceLevelV1 = 'L0' | 'L1' | 'L2' | 'L3';
export type RuntimeEvidenceGraphIssueCodeV1 = 'invalid_observation' | 'missing_task_run' | 'observation_identity_changed' | 'observation_kind_changed' | 'child_parent_missing' | 'task_run_not_root' | 'parent_missing' | 'parent_identity_changed' | 'cross_run_parent' | 'parent_cycle' | 'status_regression' | 'terminal_status_changed' | 'child_started_missing' | 'child_terminal_missing' | 'turn_owner_missing' | 'turn_owner_mismatch' | 'turn_counted_more_than_once' | 'turn_excluded_copy_missing' | 'turn_owner_kind_invalid' | 'turn_owner_usage_not_independent' | 'turn_group_not_closed' | 'turn_child_group_count_invalid';
export interface RuntimeEvidenceGraphIssueV1 {
    code: RuntimeEvidenceGraphIssueCodeV1;
    observationId?: string;
    detail?: string;
}
export interface RuntimeEvidenceGraphEvaluationV1 {
    valid: boolean;
    evidenceLevel: RuntimeObservationEvidenceLevelV1;
    issues: RuntimeEvidenceGraphIssueV1[];
    childObservationIds: string[];
    countedTurnIds: string[];
}
/**
 * Evaluate normalized replay events without consulting a provider or parser.
 * Input order is replay order and therefore owns lifecycle monotonicity.
 */
export declare function evaluateRuntimeEvidenceGraphV1(input: readonly unknown[]): RuntimeEvidenceGraphEvaluationV1;
//# sourceMappingURL=runtime-evidence-graph-v1.d.ts.map