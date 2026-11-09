import { type ChildEvidenceCoverageV1, type NormalizedAgentObservationV1, type StrategyInputStageV2 } from '@open-design/contracts';
import { type SafeChildPromptInput } from '../prompt-telemetry.js';
export declare const OPENCODE_CHILD_EVIDENCE_ADAPTER_VERSION: 'od-opencode-child-evidence/v1';
export declare const OPENCODE_CHILD_EVIDENCE_CLI_VERSION: '1.18.18';
export declare const OPENCODE_CHILD_EXPORT_TIMEOUT_MS = 10000;
export declare const OPENCODE_CHILD_EXPORT_MAX_BYTES: number;
export declare const OPENCODE_CHILD_EXPORT_TOTAL_BUDGET_MS = 20000;
export declare const OPENCODE_MAX_RETAINED_CHILD_CANDIDATES = 64;
export interface OpenCodeTaskTerminalCandidate {
    adapterVersion: typeof OPENCODE_CHILD_EVIDENCE_ADAPTER_VERSION;
    cliVersion: string;
    rootSessionId: string;
    childSessionId: string;
    toolCallId: string;
    state: 'completed' | 'failed' | 'canceled';
    observedAtMs: number;
    startedAtMs?: number;
    endedAtMs?: number;
    promptHash?: string;
    promptBytes?: number;
    promptSafePayload?: SafeChildPromptInput;
    model?: {
        providerId: string;
        modelId: string;
    };
}
export interface OpenCodeChildRuntimeFact extends Omit<OpenCodeTaskTerminalCandidate, 'state'> {
    state: 'started' | 'completed' | 'failed' | 'canceled';
    source: 'opencode_root_task_tool_and_sanitized_export';
    sourceEventType: 'root_task_tool_terminal' | 'sanitized_child_export';
    usage?: {
        inputTokens?: number;
        outputTokens?: number;
        thoughtTokens?: number;
        cacheReadTokens?: number;
        cacheWriteTokens?: number;
    };
    limitations: string[];
}
export interface OpenCodeRootTaskEvidenceCollector {
    observe(value: unknown): void;
    coverage(streamComplete: boolean): ChildEvidenceCoverageV1;
    /**
     * Terminal candidates retained for the post-run sanitized-export upgrade.
     * The root JSON stream is the only place the child id, its parent binding,
     * and the native Task time window appear together, and it is gone by the time
     * the export can be read.
     */
    candidates(): readonly OpenCodeTaskTerminalCandidate[];
}
/**
 * Observe only terminal native Task parts from the root OpenCode JSON stream.
 *
 * The verified OpenCode adapter family filters child-session events out of
 * `run --format json`.
 * The terminal root Task part nevertheless carries a child `sessionId`, a
 * `parentSessionId`, and the root tool call id. The raw Prompt is reduced to a
 * hash and byte count synchronously and is never retained in a fact.
 */
export declare function createOpenCodeRootTaskEvidenceCollector(input: {
    rootSessionId?: string;
    cliVersion: string;
    onCandidate: (candidate: OpenCodeTaskTerminalCandidate) => void;
    now?: () => number;
}): OpenCodeRootTaskEvidenceCollector;
/**
 * Bind one root Task candidate to one explicitly requested sanitized child
 * export. The caller chooses the child id from the candidate; this function
 * never lists or scans unrelated OpenCode sessions.
 */
export declare function verifyOpenCodeChildExport(input: {
    candidate: OpenCodeTaskTerminalCandidate;
    sanitizedExport: unknown;
}): OpenCodeChildRuntimeFact[];
/**
 * Run the post-run lookup through an injected, exact-id loader. Query failures
 * deliberately degrade to no facts and never escape into the parent Run.
 */
export declare function collectOpenCodeChildRuntimeFacts(input: {
    candidate: OpenCodeTaskTerminalCandidate;
    loadSanitizedExport: (childSessionId: string) => Promise<unknown>;
}): Promise<OpenCodeChildRuntimeFact[]>;
/**
 * Read one child session through `opencode export <id> --sanitize`, the only
 * OpenCode surface that emits a child transcript together with the `parentID`
 * the two-sided verification needs, and with transcript and file bytes already
 * redacted by the CLI itself.
 *
 * `--pure` keeps a user-installed OpenCode plugin from executing inside the
 * evidence path, and `execAgentFile` supplies a neutral working directory so
 * the bun-based CLI cannot drop a lockfile into the user's project (see
 * `invocation.ts`). The env must be the one the Run was spawned with: it
 * carries the `XDG_DATA_HOME` / `HOME` that decide which session store the
 * spawned CLI actually wrote to.
 */
export declare function createOpenCodeSanitizedExportLoader(input: {
    launchPath: string;
    env: NodeJS.ProcessEnv;
    timeoutMs?: number;
    maxBytes?: number;
}): (childSessionId: string) => Promise<unknown>;
/**
 * Resolve every observed candidate against its own sanitized export.
 *
 * A child whose export is missing, unrelated, or malformed contributes no
 * facts at all, so the caller keeps that child's L1 candidate instead of
 * publishing a half-built lifecycle that would fail the evidence graph on
 * `child_started_missing`. Exports run one at a time under a shared wall-clock
 * budget: this executes on the Run's close path, where added latency is
 * user-visible, and a Run that outruns the budget degrades to L1 rather than
 * holding the close open.
 */
export declare function collectOpenCodeChildEvidenceFacts(input: {
    candidates: readonly OpenCodeTaskTerminalCandidate[];
    loadSanitizedExport: (childSessionId: string) => Promise<unknown>;
    totalBudgetMs?: number;
    now?: () => number;
}): Promise<OpenCodeChildRuntimeFact[]>;
export interface AdaptOpenCodeChildFactInput {
    fact: OpenCodeChildRuntimeFact;
    taskExecutionId: string;
    runId: string;
    taskRunIndex: number;
    taskRunObservationId: string;
    stage: StrategyInputStageV2;
}
/**
 * Map the root Task terminal candidate when post-run child export is not yet
 * available. This is deliberately L1/partial: it is sufficient to expose the
 * bounded childInjected Prompt, but never substitutes for the two-sided L2
 * parent/child verification used by capability enforcement.
 */
export declare function adaptOpenCodeTaskCandidateV1(input: {
    candidate: OpenCodeTaskTerminalCandidate;
    taskExecutionId: string;
    runId: string;
    taskRunIndex: number;
    taskRunObservationId: string;
    stage: StrategyInputStageV2;
}): NormalizedAgentObservationV1;
/** Convert one verified, provider-shaped fact without consulting any store. */
export declare function adaptOpenCodeChildRuntimeFactV1(input: AdaptOpenCodeChildFactInput): NormalizedAgentObservationV1;
