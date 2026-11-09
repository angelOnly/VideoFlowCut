import type { ArtifactManifestEntry, AttachmentManifestEntry, MessageSummary } from '../langfuse-trace.js';
import type { PromptStackTelemetry } from '../prompt-telemetry.js';
export type EvidenceMode = 'off' | 'observe' | 'send';
export declare const evidenceMode: (value: string | undefined) => EvidenceMode;
type Row = Record<string, unknown>;
export interface AttachmentContextEntry {
    identity: string;
    originMessageId: string;
    source: 'user_upload';
    source_path_hash?: string;
    sha256?: string;
    size_bytes?: number;
    storage_ref?: string;
}
/** Origin and normalized path are stable across Runs; paths themselves never leave the host. */
export declare function attachmentContext(messages: Row[], assistantIndex: number, projectId: string): {
    turnDelta: {
        semantics: 'current_user_turn';
        entries: AttachmentContextEntry[];
    };
    effectiveContext: {
        semantics: 'conversation_context_before_run';
        entries: AttachmentContextEntry[];
    };
};
export interface EvalContextInput {
    runStatus: string;
    resultDeliveryState?: unknown;
    endedWithUnfinishedWork?: boolean;
    toolErrorCount: number;
    attachments?: ReturnType<typeof attachmentContext>;
    attachmentManifest: AttachmentManifestEntry[];
    artifactManifest: ArtifactManifestEntry[];
    agentId?: string;
    usage?: MessageSummary['usage'];
    turnUsage?: {
        input: number;
        output: number;
        total: number;
        modelCalls: number;
    } | null;
    prompt?: PromptStackTelemetry;
    failureCode?: string;
    failureStage?: string;
}
export declare function buildEvalContext(input: EvalContextInput): {
    schema: 'open-design.eval-context/v2';
    productOutcome: {
        runStatus: string;
        resultDeliveryState: {};
        endedWithUnfinishedWork: boolean;
        toolErrorCount: number;
        failureCode?: string;
        failureStage?: string;
    };
    evaluationOutcome: string;
    attachments: {
        turnDelta: {
            semantics: 'current_user_turn';
            entries: AttachmentContextEntry[];
        };
        effectiveContext: {
            semantics: 'conversation_context_before_run';
            entries: AttachmentContextEntry[];
        };
    };
    artifacts: {
        snapshotStatus: string;
        entries: ArtifactManifestEntry[];
    };
    usage: {
        scope: string;
        status: string;
        turn?: {
            input: number;
            output: number;
            total: number;
            modelCalls: number;
        } | {
            input: number;
            output: number;
            total: number;
        };
        sessionCumulative?: {
            inputTokens?: number;
            inputTokensProvider?: number;
            inputTokensEffective?: number;
            outputTokens?: number;
            totalTokens?: number;
            thoughtTokens?: number;
            cacheReadInputTokens?: number;
            cacheCreationInputTokens?: number;
            uncachedInputTokens?: number;
            estimatedContextTokens?: number;
            cacheHitRatio?: number;
            cacheTokenSource?: 'anthropic' | 'openai' | 'unavailable';
        };
    };
    prompt: {
        identityAvailability: string;
        payloadAvailability: string;
        sha256?: unknown;
        bytes?: unknown;
    };
    delivery: {
        trace: {
            status: string;
            materialization: string;
        };
        objects: {
            status: string;
            materialization: string;
        };
        feedback: {
            status: string;
        };
        materializationEvidence: {};
    };
    completeness: {
        status: string;
        reasons: string[];
    };
};
export type EvalContextV2 = ReturnType<typeof buildEvalContext>;
export {};
