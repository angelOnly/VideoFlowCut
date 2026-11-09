export type ArtifactLintSeverity = 'P0' | 'P1' | 'P2';
export interface ArtifactLintFinding {
    severity: ArtifactLintSeverity;
    /** Stable rule id, e.g. `purple-gradient`, `invented-metric`. */
    id: string;
    message: string;
    /** Actionable remediation, phrased for the generating agent. */
    fix: string;
    /** Offending excerpt when the rule can isolate one. */
    snippet?: string;
}
export interface LintArtifactRequest {
    html: string;
}
export interface LintArtifactResponse {
    findings: ArtifactLintFinding[];
    /**
     * Findings pre-rendered as an `<artifact-lint>` block, formatted to be
     * spliced into the generating agent's next turn for self-correction.
     */
    agentMessage: string;
}
/** Severity threshold for `od lint`'s exit code. `none` never fails. */
export type LintFailOn = 'p0' | 'p1' | 'p2' | 'none';
export interface LintArtifactCliCounts {
    p0: number;
    p1: number;
    p2: number;
}
/** Machine envelope printed by `od lint --json`. */
export interface LintArtifactCliResultEnvelope {
    ok: boolean;
    file: string;
    failOn: LintFailOn;
    counts: LintArtifactCliCounts;
    findings: ArtifactLintFinding[];
    agentMessage: string;
}
//# sourceMappingURL=artifact-lint.d.ts.map