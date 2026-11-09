import { type AmrContinuationCursor, type AmrContinuationRecovery, type ExecutionProfile } from '@open-design/contracts';
import type { AcpChildProcess } from './types.js';
import { type AcpMcpServerInput } from './session-params.js';
import { type AcpEmissionMeta } from './emission-provenance.js';
/**
 * Out-of-band provenance for a single `send` from this bridge.
 *
 * Deliberately NOT part of the event payload: this says where the emission came
 * from, not what it contains, and it must not reach the persisted transcript,
 * the SSE wire, or Langfuse metadata.
 *
 * `hostSynthesized` marks an event the daemon manufactured while closing its own
 * books — the terminal `tool_use`/`tool_result` pair `flushOpenAcpTools` writes
 * for a tool the agent never terminated. The agent produced no bytes for it.
 * Consumers that measure *agent* liveness (the chat run's progress clock) must
 * exclude these; consumers that build the transcript still want them, which is
 * why the pair is emitted rather than dropped.
 */
export type { AcpEmissionMeta } from './emission-provenance.js';
export interface AcpPromptBudgetContext {
    modelId?: string | null;
    modelIdSource?: 'model_catalog' | 'unknown';
    contextWindowTokens?: number | null;
    contextWindowSource?: 'model_metadata' | 'unknown';
    priorSessionInputTokens?: number | null;
    priorSessionUsageSource?: 'agent_session' | 'unknown';
}
/**
 * Options for `attachAcpSession`. All fields except `child`, `prompt`, and
 * `send` are optional and carry sensible defaults.
 */
export interface AttachAcpSessionOptions {
    child: AcpChildProcess;
    prompt: string;
    cwd?: string;
    model?: string | null;
    imagePaths?: string[];
    /** Frozen non-image/image resources delivered as ACP resource_link blocks. */
    resourcePaths?: string[];
    mcpServers?: AcpMcpServerInput[];
    envFormat?: 'array' | 'map';
    stdioMcpRemovedInVersion?: string | null;
    send: (event: string, payload: unknown, meta?: AcpEmissionMeta) => void;
    clientName?: string;
    clientVersion?: string;
    stageTimeoutMs?: number;
    executionProfile?: ExecutionProfile;
    modelUnavailableErrorCode?: 'AMR_MODEL_UNAVAILABLE';
    fallbackModel?: string | null;
    completePromptOnTurnEnd?: boolean;
    resumeSessionId?: string | null;
    nativeContinuation?: AmrContinuationCursor | null;
    /** Safe model/session metadata attached to the exact prompt-frame diagnostic. */
    promptBudgetContext?: AcpPromptBudgetContext;
    onCliReady?: () => void;
    onSessionInit?: () => void;
    onPromptComplete?: () => void;
    /**
     * Transfers process-tree teardown ownership to the caller once this
     * one-prompt session has a clean or fatal verdict. When provided, the ACP
     * bridge does not fall back to direct-child SIGTERM; the caller must stop the
     * complete owned tree and gate terminal publication on its quiescence.
     */
    onTerminal?: (kind: 'completed' | 'fatal') => void;
}
/**
 * Attaches an ACP protocol session to an already-spawned child process and
 * drives the full JSON-RPC conversation from handshake to prompt completion.
 *
 * Sequence:
 * 1. Sends `initialize` to confirm the protocol version.
 * 2. Sends `session/new` (or `session/load` when `resumeSessionId` is set).
 * 3. Optionally sends `session/set_model` when a non-default model is requested.
 * 4. Sends `session/prompt` with the user's prompt and any image attachments.
 * 5. Streams `session/update` events to the `send` callback, translating:
 *    - `agent_thought_chunk` → `thinking_start` / `thinking_delta`
 *    - `agent_message_chunk` → `text_delta` (with DSML and tool-call text suppression)
 *    - `tool_call` / `tool_call_update` → full `tool_use` / `tool_result` transcript
 *      (all tools; write tools keep Claude-shaped names + `file_path` for artifact count)
 *    - status updates → `agent.status` events
 * 6. Handles `session/request_permission` calls by auto-approving.
 * 7. On prompt completion, flushes suppression buffers, emits usage, and closes stdin.
 *
 * Returns a controller object that the caller may use to query session state
 * and to abort the in-progress turn.
 *
 * @param options - See `AttachAcpSessionOptions` for all fields.
 * @returns A controller with `hasFatalError`, `getDurableSessionId`,
 *   `completedSuccessfully`, and `abort` methods.
 */
export declare function attachAcpSession({ child, prompt, cwd, model, imagePaths, resourcePaths, mcpServers, envFormat, stdioMcpRemovedInVersion, send, clientName, clientVersion, stageTimeoutMs, executionProfile, modelUnavailableErrorCode, fallbackModel, completePromptOnTurnEnd, resumeSessionId, nativeContinuation, promptBudgetContext, onCliReady, onSessionInit, onPromptComplete, onTerminal, }: AttachAcpSessionOptions): {
    /** Returns `true` when the session ended with a fatal protocol or transport error, allowing the caller to surface the failure. */
    hasFatalError(): boolean;
    /**
     * Child-evidence coverage for this ACP run, or `undefined` when the agent
     * is not the AMR-discriminated runtime and therefore has no child-evidence
     * consumer. The daemon publishes this as the `child_evidence_coverage_v1`
     * diagnostic at child close; without it every AMR task aggregates as
     * `child_lifecycle_unavailable_not_zero`, which cannot distinguish a run
     * that had no Child agents from a run nobody was observing.
     */
    childEvidenceCoverage(): {
        availability: "complete" | "partial" | "unavailable";
        source: string;
        knownChildCount: number;
        explicitZero: boolean;
        limitations: string[];
        diagnosticCounts: {
            code: string;
            count: number;
        }[];
    } | undefined;
    /** Evidence captured before synthetic tool closure; never permits prompt replay. */
    getContinuationRecovery(): AmrContinuationRecovery | null;
    getDurableSessionId(): string | null;
    /** Returns `true` when the prompt request resolved cleanly without a fatal error and without an abort, even if the child process later exited via SIGTERM. */
    completedSuccessfully(): boolean;
    /**
     * Aborts an in-progress ACP session. Sends `session/cancel` when a session
     * id has already been established, then always closes stdin so the agent
     * receives EOF and can tear down its own runtime (e.g. vela's private
     * OpenCode server). Idempotent — subsequent calls are no-ops.
     */
    abort(): void;
};
