import type { JsonObject } from './types.js';
type RecordValue = Record<string, unknown>;
export interface ToolExecutionLifecycleDiagnostic {
    type: 'diagnostic';
    name: 'tool_execution_lifecycle';
    source: 'amr-opencode';
    schema: 'vela.tool_execution_lifecycle';
    version: 1;
    toolCallIdHash: string;
    status?: string;
    phase?: string;
    executionVersion?: 1;
    elapsedMs?: number;
    requestedTimeoutMs?: number | null;
    effectiveTimeoutMs?: number;
    forceKillAfterMs?: number;
    trigger?: string;
    terminal?: string;
    droppedEvents?: number;
    events?: RecordValue[];
    toolTerminal?: RecordValue;
}
export declare function sanitizeToolExecutionLifecycleUpdate(update: JsonObject): ToolExecutionLifecycleDiagnostic | null;
export declare function createToolExecutionLifecycleDeduper(): {
    accept(diagnostic: ToolExecutionLifecycleDiagnostic): boolean;
};
/** Re-validates persisted diagnostics before they leave the daemon for Langfuse. */
export declare function projectToolExecutionLifecycleDiagnostic(value: unknown): RecordValue | null;
export {};
