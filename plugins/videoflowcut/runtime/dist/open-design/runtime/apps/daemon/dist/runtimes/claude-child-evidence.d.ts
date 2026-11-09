import { type ChildEvidenceCoverageV1, type NormalizedAgentObservationV1, type StrategyInputStageV2 } from '@open-design/contracts';
import { type SafeChildPromptInput } from '../prompt-telemetry.js';
export declare const CLAUDE_CHILD_EVIDENCE_ADAPTER_VERSION: 'od-claude-child-evidence/v1';
export type ClaudeChildRuntimeFactState = 'started' | 'completed' | 'failed' | 'canceled' | 'conflicted';
export type ClaudeChildEvidenceConflictReason = 'runtime_session_changed' | 'task_parent_rebound' | 'native_agent_type_rebound' | 'native_agent_id_reused' | 'terminal_state_conflict';
/**
 * Provider-shaped fact emitted beside the existing Claude UI stream.
 *
 * Prompt text is immediately bounded/redacted and usage is accepted only from
 * the matching root tool result. The fact carries no strategy or exporter
 * field. A non-null `parent_tool_use_id` only proves a child lifecycle after
 * the matching native Task/Agent tool_use was observed.
 */
export interface ClaudeChildRuntimeFact {
    adapterVersion: typeof CLAUDE_CHILD_EVIDENCE_ADAPTER_VERSION;
    childId: string;
    parentChildId?: string;
    state: ClaudeChildRuntimeFactState;
    source: 'claude_stream_json';
    sourceEventType: 'assistant.parent_tool_use_id' | 'user.tool_result' | 'system.init' | 'host_process_close';
    observedAtMs: number;
    startedAtMs: number;
    endedAtMs?: number;
    runtimeSessionId?: string;
    runtimeReportedVersion?: string;
    promptHash?: string;
    promptBytes?: number;
    promptSafePayload?: SafeChildPromptInput;
    promptTruncated?: boolean;
    nativeAgentId?: string;
    nativeAgentType?: string;
    resolvedModel?: string;
    buildPackageId?: string;
    usage?: {
        inputTokens?: number;
        outputTokens?: number;
        totalTokens?: number;
        thoughtTokens?: number;
        cacheReadTokens?: number;
        cacheWriteTokens?: number;
    };
    nativeDurationMs?: number;
    terminationReason?: 'assistant_error' | 'canceled' | 'timeout' | 'stream_incomplete';
    conflictReasons?: ClaudeChildEvidenceConflictReason[];
}
export type ClaudeChildToolRuntimeFactState = 'started' | 'completed' | 'failed' | 'canceled' | 'conflicted';
export interface ClaudeChildToolRuntimeFact {
    adapterVersion: typeof CLAUDE_CHILD_EVIDENCE_ADAPTER_VERSION;
    childId: string;
    toolCallHash: string;
    toolName: string;
    state: ClaudeChildToolRuntimeFactState;
    source: 'claude_stream_json';
    sourceEventType: 'assistant.child_tool_use' | 'user.child_tool_result' | 'host_process_close';
    observedAtMs: number;
    startedAtMs: number;
    endedAtMs?: number;
    runtimeSessionId?: string;
    runtimeReportedVersion?: string;
    buildPackageId?: string;
    terminationReason?: 'tool_error' | 'canceled' | 'timeout' | 'stream_incomplete';
    conflictReasons?: Array<'tool_call_reused' | 'tool_name_rebound' | 'terminal_state_conflict'>;
}
export type ClaudeOpenChildTerminationReason = 'complete' | 'canceled' | 'timeout' | 'stream_incomplete';
export interface ClaudeChildEvidenceCollector {
    observe(value: unknown): void;
    finishOpenChildren(reason: ClaudeOpenChildTerminationReason): void;
    coverage(): ChildEvidenceCoverageV1;
}
/**
 * Collect native Claude Task sidechain lifecycle facts without changing the
 * order or meaning of the main stream parser. Unknown frames are ignored.
 */
export declare function createClaudeChildEvidenceCollector(input: {
    onFact?: (fact: ClaudeChildRuntimeFact) => void;
    onToolFact?: (fact: ClaudeChildToolRuntimeFact) => void;
    now?: () => number;
}): ClaudeChildEvidenceCollector;
export interface AdaptClaudeChildFactInput {
    fact: ClaudeChildRuntimeFact;
    agentCliVersion?: string;
    taskExecutionId: string;
    runId: string;
    taskRunIndex: number;
    taskRunObservationId: string;
    /** Langfuse-only parent span for the root native Agent tool invocation. */
    rootParentToolObservationId?: string;
    stage: StrategyInputStageV2;
}
/**
 * Convert one Claude runtime fact to the provider-neutral V1 observation.
 * Claude 2.1.233 exposes Child task text in the structured Agent tool input
 * and independent usage in the matching root tool result. Effective context
 * remains unobservable and is never inferred from the injected task text.
 */
export declare function adaptClaudeChildRuntimeFactV1(input: AdaptClaudeChildFactInput): NormalizedAgentObservationV1;
export interface AdaptClaudeChildToolFactInput {
    fact: ClaudeChildToolRuntimeFact;
    agentCliVersion?: string;
    taskExecutionId: string;
    runId: string;
    taskRunIndex: number;
    stage: StrategyInputStageV2;
}
/**
 * Convert one provider-observed Child tool lifecycle into a safe tool span.
 * Tool arguments and results are intentionally absent; only the allowlisted
 * tool name, hashed native call identity, lifecycle, timing, versions, and
 * optional locked Build Package ownership cross the telemetry boundary.
 */
export declare function adaptClaudeChildToolRuntimeFactV1(input: AdaptClaudeChildToolFactInput): NormalizedAgentObservationV1;
