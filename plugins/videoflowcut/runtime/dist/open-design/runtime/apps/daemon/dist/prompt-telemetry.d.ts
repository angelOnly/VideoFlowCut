import { type StrategyInputStageV2 } from '@open-design/contracts';
import type { StrategyTaskFinalTextIdentity } from './strategies/task-store.js';
export declare const PROMPT_STACK_REDACTION_VERSION = "prompt-stack-redaction-v1";
export declare const PROMPT_STACK_PATH_MARKER = "[REDACTED:path]";
export type PromptTelemetrySectionKind = 'formOverride' | 'daemonSystemPrompt' | 'runtimeToolPrompt' | 'researchCommandContract' | 'runContextPrompt' | 'clientSystemPrompt' | 'echoGuard' | 'userRequest' | 'skillPrompt' | 'designSystemPrompt' | 'pluginStagePrompt' | 'odNextExactFinalText' | 'cwdHint' | 'linkedDirsHint' | 'attachments' | 'commentAttachments' | 'promptImagePaths';
export interface PromptTelemetryInputSection {
    kind: PromptTelemetrySectionKind;
    content?: string | null;
    captureContent?: boolean;
    metadata?: unknown;
}
export interface PromptTelemetrySection {
    kind: PromptTelemetrySectionKind;
    ordinal: number;
    present: boolean;
    contentMode: 'redacted-section-content' | 'metadata-only';
    rawBytes: number;
    redactedBytes: number;
    fingerprint: string;
    truncated: boolean;
    truncationReason?: 'section_byte_limit' | 'total_budget_exceeded';
    redactedContent?: string;
    metadata?: Record<string, unknown>;
}
export interface PromptStackTelemetry {
    redactionVersion: typeof PROMPT_STACK_REDACTION_VERSION;
    promptFingerprint: string;
    stackFingerprint: string;
    rawBytes: number;
    redactedBytes: number;
    sectionCount: number;
    redactedContentBytes: number;
    redactedContentBudgetBytes: number;
    sections: PromptTelemetrySection[];
    odNextExactSend?: OdNextExactSendPromptEvidenceV1;
}
export interface OdNextExactSendPromptEvidenceV1 {
    schema: 'open-design.od-next-exact-send-prompt/v1';
    boundary: 'hostComposed';
    kind: StrategyTaskFinalTextIdentity['kind'];
    promptSchema: StrategyTaskFinalTextIdentity['schema'];
    stage: StrategyInputStageV2;
    sha256: string;
    utf8Bytes: number;
}
export declare class InvalidOdNextExactSendPromptError extends Error {
    constructor(message: string);
}
export interface StructuredPromptStackInput {
    type: 'open-design.prompt-stack';
    redactionVersion: typeof PROMPT_STACK_REDACTION_VERSION;
    promptFingerprint: string;
    stackFingerprint: string;
    sectionCount: number;
    redactedContentBytes: number;
    redactedContentBudgetBytes: number;
    sections: Array<{
        kind: PromptTelemetrySectionKind;
        ordinal: number;
        contentMode: PromptTelemetrySection['contentMode'];
        rawBytes: number;
        redactedBytes: number;
        fingerprint: string;
        truncated: boolean;
        truncationReason?: PromptTelemetrySection['truncationReason'];
        redactedContent?: string;
        metadata?: Record<string, unknown>;
    }>;
}
export interface SafeChildPromptInput extends Record<string, unknown> {
    type: 'open-design.child-injected-prompt';
    redactionVersion: typeof PROMPT_STACK_REDACTION_VERSION;
    messageCount: number;
    capturedMessageCount: number;
    rawBytes: number;
    redactedContentBytes: number;
    redactedContentBudgetBytes: number;
    truncated: boolean;
    messages: Array<{
        ordinal: number;
        rawBytes: number;
        redactedBytes: number;
        fingerprint: string;
        truncated: boolean;
        redactedContent: string;
    }>;
}
export interface SafeChildPromptTelemetry {
    hash: string;
    bytes: number;
    safePayload: SafeChildPromptInput;
    truncated: boolean;
}
export declare function redactLocalPaths(input: string): string;
export declare function redactPromptText(input: string): string;
/**
 * Capture the runtime-visible Child task text without retaining its raw body.
 * The same secret/path redaction used for host-composed Prompt telemetry runs
 * before bounded content enters a Normalized observation. Callers may persist
 * the returned object; they must never persist the input strings separately.
 */
export declare function buildSafeChildPromptTelemetry(messages: readonly string[]): SafeChildPromptTelemetry;
export declare function buildPromptStackTelemetry({ composedPrompt, sections, }: {
    composedPrompt: string;
    sections: PromptTelemetryInputSection[];
}): PromptStackTelemetry;
/**
 * Bind the mapped OD Next identity to the exact inner text that is about to
 * cross a runtime transport. The caller must pass the same variable used by
 * prompt-file, argv, ACP, stdin, or stream-json encoding; wrappers are applied
 * only after this gate and therefore never enter this identity.
 */
export declare function bindOdNextExactSendPromptEvidence(input: {
    telemetry: PromptStackTelemetry;
    finalText: string;
    persisted: StrategyTaskFinalTextIdentity;
    stage: StrategyInputStageV2;
    purpose?: 'intent_resolution' | undefined;
}): PromptStackTelemetry;
/**
 * Revalidate durable exact-send evidence before task-level export. The task
 * mapping is the persisted source of truth; this comparison deliberately does
 * not replace the run evidence or rebuild an export payload from task state.
 */
export declare function assertOdNextExactSendPromptEvidence(input: {
    telemetry: PromptStackTelemetry;
    persisted: StrategyTaskFinalTextIdentity;
    stage: StrategyInputStageV2;
    purpose?: 'intent_resolution' | undefined;
}): void;
export declare function promptStackWithoutContent(telemetry: PromptStackTelemetry): PromptStackTelemetry;
export declare function structuredPromptStackInput(telemetry: PromptStackTelemetry): StructuredPromptStackInput;
export declare function buildPromptStackFlatMetadata(telemetry: PromptStackTelemetry): Record<string, unknown>;
