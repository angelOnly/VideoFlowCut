import { type ChildEvidenceCoverageV1, type NormalizedAgentObservationV1, type RuntimeObservationEvidenceLevelV1, type StrategyInputStageV2 } from '@open-design/contracts';
import { type SafeChildPromptInput } from '../prompt-telemetry.js';
export declare const VELA_CHILD_EVIDENCE_EXTENSION: 'vela.opencode.child_agent_lifecycle';
export declare const VELA_CHILD_EVIDENCE_SCHEMA_VERSION: 1;
export declare const VELA_CHILD_EVIDENCE_ADAPTER_VERSION: 'od-vela-opencode-child-evidence/v1';
/**
 * Coverage `source` discriminator for this runtime, alongside the sibling
 * runtimes' `opencode_json_event_stream` and `claude_stream_json`. Downstream
 * aggregation reads it to attribute a coverage gap to the producing runtime.
 */
export declare const VELA_CHILD_EVIDENCE_COVERAGE_SOURCE: 'vela_opencode_acp';
/**
 * Review pin for the candidate wire fixture, carried into every observation as
 * `candidateCommit` so evidence stays attributable to the producer that emitted
 * it.
 *
 * `published` stays false: the producer lives on an unmerged Vela branch, so a
 * build carrying it is not something a user can install. `verifiedRuntimeSupport`
 * is now true — a local Vela built from that branch negotiated the extension and
 * drove a complex OD Next task to `availability: complete` with three observed
 * Children, which is the claim this flag makes. Flip `published` and re-pin the
 * commit once the producer lands on Vela's main.
 */
export declare const VELA_CHILD_EVIDENCE_CANDIDATE: Readonly<{
    repository: "PowerformerAI/vela";
    commit: "c833b74e82e31c89414b7eaf01edabab1e2d0b06";
    fixture: "apps/cli/internal/agent/testdata/opencode_child_evidence_wire_v1.golden.json";
    published: false;
    bestEffortEvidenceVerified: true;
    verifiedOpenCodeVersion: "1.18.18";
    verifiedRuntimeSupport: true;
}>;
export type VelaChildLifecycleStatus = 'running' | 'completed' | 'failed' | 'cancelled' | 'timed_out';
export type VelaChildEvidenceRejectionReason = 'capability_not_negotiated' | 'unsupported_schema_version' | 'acp_session_mismatch' | 'invalid_wire_shape' | 'root_session_conflict' | 'parent_cycle' | 'parent_conflict' | 'tool_call_rebound' | 'evidence_id_conflict' | 'status_regression' | 'terminal_conflict';
export interface VelaChildEvidenceNegotiation {
    advertised: boolean;
    supported: boolean;
    schemaVersion?: number;
    producerName?: string;
    producerVersion?: string;
    reason: 'extension_missing' | 'supported_candidate' | 'unsupported_schema_version';
    candidatePublished: false;
    candidateCommit: typeof VELA_CHILD_EVIDENCE_CANDIDATE.commit;
}
export interface VelaChildRuntimeFact {
    adapterVersion: typeof VELA_CHILD_EVIDENCE_ADAPTER_VERSION;
    schemaVersion: typeof VELA_CHILD_EVIDENCE_SCHEMA_VERSION;
    producerVersion?: string;
    evidenceId: string;
    state: VelaChildLifecycleStatus;
    phase: 'start' | 'end';
    rootSessionId: string;
    childSessionId: string;
    toolCallId: string;
    observedAtMs: number;
    startedAtMs: number;
    endedAtMs?: number;
    timingEvidence: 'source_timestamp' | 'bridge_observed';
    lifecycleCompleteness: 'complete' | 'partial';
    sourceEvidence: VelaChildSourceEvidence[];
    role?: string;
    provider?: string;
    model?: string;
    prompt?: {
        sha256: string;
        bytes: number;
        safePayload?: SafeChildPromptInput;
    };
    usage?: {
        completeness: 'complete' | 'partial';
        source: 'child_step_finish' | 'opencode_export_step_finish' | 'opencode_export_message_snapshot';
        inputTokens?: number;
        outputTokens?: number;
        totalTokens?: number;
        thoughtTokens?: number;
        cacheReadTokens?: number;
        cacheWriteTokens?: number;
    };
    evidenceLevel: RuntimeObservationEvidenceLevelV1;
    l3Eligible: false;
    limitations: string[];
}
export interface VelaChildEvidenceObserveResult {
    handled: boolean;
    accepted: boolean;
    fact?: VelaChildRuntimeFact;
    reason?: VelaChildEvidenceRejectionReason;
}
export interface VelaChildEvidenceCoverageInput {
    /**
     * `true` only when the ACP prompt turn resolved without a fatal protocol or
     * transport error and without an abort. A turn that ended any other way may
     * have dropped child terminals that were still in flight, so it can never
     * claim complete coverage.
     */
    sessionComplete: boolean;
}
export interface VelaChildEvidenceConsumer {
    negotiate(initializeResult: unknown): VelaChildEvidenceNegotiation;
    observe(input: {
        expectedAcpSessionId: string | null;
        envelopeAcpSessionId: unknown;
        update: unknown;
    }): VelaChildEvidenceObserveResult;
    getNegotiation(): VelaChildEvidenceNegotiation;
    /**
     * Provider-neutral child-evidence coverage for this ACP run. Without it the
     * daemon has nothing to publish as `child_evidence_coverage_v1`, and task
     * aggregation falls back to `child_lifecycle_unavailable_not_zero` for every
     * AMR task — which cannot distinguish a run that provably had no Child
     * agents from a run nobody was observing.
     */
    childEvidenceCoverage(input: VelaChildEvidenceCoverageInput): ChildEvidenceCoverageV1;
}
export declare function negotiateVelaChildEvidence(initializeResult: unknown): VelaChildEvidenceNegotiation;
type VelaChildSourceEvidence = 'root_task_metadata' | 'session.created' | 'child_session_status' | 'child_session_error' | 'root_task_tool' | 'parent_prompt_cancelled' | 'parent_prompt_timeout' | 'opencode_export_step_finish' | 'opencode_export_message_snapshot' | 'opencode_export_unavailable';
/**
 * Stateful, per-ACP-run consumer. It never lists sessions or reads Vela
 * storage. The first accepted root id is bound to this ACP run and every
 * later fact must remain in that flat root/child graph.
 */
export declare function createVelaChildEvidenceConsumer(input?: {
    onFact?: (fact: VelaChildRuntimeFact) => void;
    now?: () => number;
}): VelaChildEvidenceConsumer;
export interface AdaptVelaChildFactInput {
    fact: VelaChildRuntimeFact;
    agentCliVersion?: string;
    runtimeCompanionVersion?: string;
    taskExecutionId: string;
    runId: string;
    taskRunIndex: number;
    taskRunObservationId: string;
    stage: StrategyInputStageV2;
}
/** Map one accepted, allowlisted wire fact without consulting Vela state. */
export declare function adaptVelaChildRuntimeFactV1(input: AdaptVelaChildFactInput): NormalizedAgentObservationV1;
export {};
