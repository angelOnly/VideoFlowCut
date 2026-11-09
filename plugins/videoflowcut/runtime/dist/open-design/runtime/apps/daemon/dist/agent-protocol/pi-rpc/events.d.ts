/** @module agent-protocol/pi-rpc/events
 * Pure event mapper for pi's JSON-RPC stream protocol. Translates raw JSON
 * objects emitted by `pi --mode rpc` into the daemon's typed UI events:
 * status, text_delta, thinking, tool_use, tool_result, usage, and error.
 * No I/O — all side effects flow through the SendAgentEvent callback.
 */
import type { JsonRecord, SendAgentEvent } from './internal.js';
/** Timing and first-token-tracking context threaded through every mapPiRpcEvent call. */
export type PiRpcContext = {
    runStartedAt: number;
    sentFirstToken: {
        value: boolean;
    };
};
/**
 * Maps a single raw pi RPC JSON object to zero or more daemon SSE events,
 * dispatching each through `send`. Returns `'agent_end'` when pi signals the
 * end of the run; returns `null` for every other event type.
 *
 * @param raw  - Parsed JSON object read from pi's stdout.
 * @param send - Callback that forwards a typed event to the daemon SSE layer.
 * @param ctx  - Per-run context: start timestamp and first-token sentinel.
 * @returns `'agent_end'` on run completion, `null` otherwise.
 */
export declare function mapPiRpcEvent(raw: JsonRecord, send: SendAgentEvent, ctx: PiRpcContext): 'agent_end' | null;
