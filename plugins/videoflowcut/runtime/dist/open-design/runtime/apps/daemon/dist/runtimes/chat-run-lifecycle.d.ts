export declare function assertValidRuntimeDefInactivityTimeoutMs(agentDefault?: number): void;
export declare function assertValidRuntimeDefFirstOutputTimeoutMs(agentDefault?: number): void;
export declare function resolveChatRunInactivityTimeoutMs(agentDefault?: number): number;
export declare function resolveChatRunFirstOutputTimeoutMs(agentDefault?: number): number;
export declare function resolveChatRunArtifactQuietPeriodMs(): number;
export declare function resolveActiveInactivityTimeoutMs(params: {
    inactivityTimeoutMs: number;
    artifactQuietPeriodMs: number;
    artifactRegistered: boolean;
}): number;
export declare function classifyChatRunCloseStatus(params: {
    cancelRequested: boolean;
    code: number | null;
    signal: NodeJS.Signals | string | null;
    acpCleanCompletion: boolean;
    /** The daemon began terminating this ACP attempt after its prompt completed. */
    acpCompletionShutdownRequested?: boolean;
    artifactQuietShutdownRequested: boolean;
    turnCompletedCleanly: boolean;
    artifactProducedThisRun: boolean;
}): 'canceled' | 'succeeded' | 'failed';
type ClaudeStreamJsonBookkeepingRun = {
    stdinOpen?: boolean;
    turnCompletedCleanly?: boolean;
    child?: {
        stdin?: {
            destroyed?: boolean;
            end: () => void;
        } | null;
    } | null;
};
export declare function applyClaudeStreamJsonRunBookkeeping(run: ClaudeStreamJsonBookkeepingRun, ev: unknown): void;
/**
 * Whether an emission from a runtime adapter counts as *agent progress* for the
 * inactivity clock (`run.lastAgentActivityAt`, exported to analytics as
 * `last_progress_age_ms`).
 *
 * Only bytes the agent produced count. Everything the daemon manufactures while
 * closing out a turn is excluded, because stamping the progress clock from our
 * own bookkeeping means the last recorded "progress" is the very act of giving
 * up — so `last_progress_age_ms` reads near zero on exactly the stalled runs
 * whose contract says it must read "near the inactivity ceiling" (see
 * TrackingRunFinished in packages/contracts). That is what made the 2026-07-28
 * AMR design-system stall (run 14b04dd3, ~30 minutes of silence, reported age
 * 664ms) look like a run that was still working when it was killed.
 *
 * Two kinds of emission are ours, not the agent's:
 *
 * 1. A terminal `error` — the daemon reporting its own verdict (an ACP
 *    stage-watchdog timeout, a protocol failure we detected, a close with no
 *    result).
 * 2. Any emission flagged `hostSynthesized` — currently the terminal
 *    `tool_use`/`tool_result` pair the ACP bridge writes for a tool the agent
 *    left open (`flushOpenAcpTools`). These ride the normal `agent` channel and
 *    are otherwise indistinguishable from real tool traffic, and they are
 *    emitted on every ACP failure path immediately BEFORE the terminal error —
 *    so excluding only case 1 still lets a stall that died with a tool in
 *    flight report a near-zero age. That is the common stall shape, not an
 *    edge case.
 *
 * Agent-originated errors are not lost by this: they arrive on the child's
 * stdout/stderr, and those raw-chunk handlers stamp the clock already.
 *
 * This predicate only covers emissions that reach the daemon BEFORE the verdict
 * — `fail()` flushes open tools and only then sends the error. Everything that
 * arrives after it (the child's shutdown line on stderr, diagnostics promoted
 * from it) is handled by the attempt-scoped freeze in `startChatRun`; see
 * `freezeProgressClock`. The two together are one rule: the progress clock runs
 * from the agent's bytes and stops when the daemon gives up.
 */
export declare function runtimeEmissionCountsAsAgentProgress(channel: string, meta?: {
    hostSynthesized?: boolean;
}): boolean;
export declare function resolveChatRunShutdownGraceMs(): number;
export declare function resolveAcpStageTimeoutMs(agentDefault?: number): number | undefined;
/**
 * Whether a runtime reads its whole prompt from stdin (and then waits for
 * EOF). Those runtimes get the prompt — as plain text, or in the shape their
 * `encodeStdinPrompt` produces — as a complete file-backed stdin at spawn; see
 * `openCompletePromptAsStdin` in `agent-process.ts` and
 * `agentStdinPromptPayload` below.
 *
 * Excluded are the runtimes whose stdin carries a framed protocol instead:
 * Claude's `stream-json` input (stdin stays open for mid-turn messages),
 * pi-rpc, dsh-profile JSONL, ACP / Codex app-server JSON-RPC (those set
 * `promptViaStdin: false`). A frame cut short by a dying daemon does not parse,
 * so they cannot act on a partial prompt the way a plain-text reader does.
 */
export declare function runtimeReadsPlainTextPromptFromStdin(def: {
    promptViaStdin?: boolean;
    promptInputFormat?: string;
    streamFormat?: string;
}): boolean;
/**
 * The bytes a whole-prompt stdin runtime receives for the composed prompt:
 * the raw text unless the runtime declares its own stdin framing (e.g.
 * Antigravity's one-message stream-json NDJSON). Shared by the chat-run spawn
 * and the connection test so the two can never hand a CLI different shapes.
 */
export declare function agentStdinPromptPayload(def: {
    encodeStdinPrompt?: (prompt: string) => string;
}, prompt: string): string;
/**
 * Stdin telemetry for a prompt handed over as the child's file-backed stdin
 * at spawn.
 *
 * The prompt was complete on disk before the child existed, so the daemon's
 * side of the write is finished the moment the child is spawned: it cannot be
 * backpressured (`stdin_backpressure` is false by construction — a child that
 * never reads its stdin now stalls in its own first-token wait, not in a daemon
 * write), and `stdin_write_start`/`stdin_write_end` land together, in their
 * historical position after spawn, so phase math and the Langfuse
 * `stdin-write` span keep their shape.
 */
export declare function recordPromptDeliveredAtSpawn(run: {
    stdinBackpressure?: boolean;
}, lifecycle: {
    mark: (mark: 'model_call_start' | 'stdin_write_start' | 'stdin_write_end') => void;
}): void;
export {};
