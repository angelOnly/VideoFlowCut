export interface ClaudeCliDiagnosticInput {
    agentId: string;
    exitCode?: number | null;
    signal?: string | null;
    stderrTail?: string | null;
    stdoutTail?: string | null;
    env?: Record<string, unknown> | null;
    resolvedBin?: string | null;
}
export interface ClaudeCliDiagnostic {
    message: string;
    detail: string;
    retryable: boolean;
    /**
     * Stable `ApiErrorCode` for this failure class, when one is more specific
     * than the generic `AGENT_EXECUTION_FAILED`. Lets the web map the code to a
     * localized message and lets triage count failures by class. Omitted for
     * branches that have no dedicated code yet.
     */
    code?: string;
}
export declare function diagnoseClaudeCliFailure(input: ClaudeCliDiagnosticInput): ClaudeCliDiagnostic | null;
