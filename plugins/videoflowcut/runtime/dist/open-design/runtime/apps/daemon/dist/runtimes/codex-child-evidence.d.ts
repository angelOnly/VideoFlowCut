import { type NormalizedAgentObservationV1, type StrategyInputStageV2 } from '@open-design/contracts';
export type CodexRolloutReadFailureReason = 'parent_session_not_declared' | 'codex_home_not_declared' | 'codex_home_not_absolute' | 'invalid_session_id' | 'sessions_root_unavailable' | 'unsafe_rollout_directory' | 'rollout_rotation_window_exhausted' | 'rollout_not_found' | 'rollout_ambiguous' | 'unsafe_rollout_file' | 'rollout_too_large' | 'rollout_read_failed';
export interface CodexChildEvidenceDiagnostic {
    code: CodexRolloutReadFailureReason | string;
    count: number;
}
export interface CollectCodexChildEvidenceInput {
    /**
     * Must be the effective CODEX_HOME passed to the launched runtime. The
     * collector deliberately has no homedir fallback: callers that cannot name
     * the runtime-owned root get unavailable evidence instead of a home scan.
     */
    codexHome?: string | null;
    parentSessionId?: string | null;
    parentTurnId?: string | null;
    taskExecutionId: string;
    runId: string;
    taskRunIndex: number;
    stage: StrategyInputStageV2;
    parentObservationId: string;
    agentCliVersion?: string;
    runStartedAtMs?: number;
    runEndedAtMs?: number;
    maxDayDirectories?: number;
    maxDirectoryEntries?: number;
    maxRolloutBytes?: number;
    maxChildSessions?: number;
    maxRecursionDepth?: number;
}
export interface CodexChildEvidenceCollection {
    availability: 'complete' | 'partial' | 'unavailable';
    source: 'codex_rollout';
    /** Distinct Child agents observed, not invocations. See `knownChildCount`. */
    knownChildCount: number;
    observations: NormalizedAgentObservationV1[];
    limitations: string[];
    diagnostics: CodexChildEvidenceDiagnostic[];
}
/**
 * Collect Codex child facts beside the main JSON event parser. It only opens
 * the explicitly declared parent session plus child session ids referenced by
 * that parent's selected turn, and it never returns rollout paths or prompt
 * text. Failure is data: callers receive unavailable/partial facts and the
 * normal Run lifecycle remains untouched.
 */
export declare function collectCodexChildEvidence(input: CollectCodexChildEvidenceInput): Promise<CodexChildEvidenceCollection>;
