/**
 * Parses Claude Code's `--output-format stream-json --verbose` JSONL stream
 * (with or without `--include-partial-messages`) into a small set of
 * UI-friendly events. With partial messages on, text arrives as
 * `stream_event` deltas; without it (older builds <1.0.86, or any build
 * where the flag isn't passed) text arrives only in the final `assistant`
 * wrapper. We handle both. The UI only needs to know five things:
 *
 *   - status        : high-level lifecycle ("initializing", "requesting",
 *                     "thinking")
 *   - text_delta    : assistant text chunk (gets fed to the artifact parser)
 *   - thinking_delta: extended-thinking chunk (shown in a collapsed block)
 *   - tool_use      : { id, name, input }     (fires when input is complete)
 *   - tool_result   : { tool_use_id, content, is_error }
 *   - usage         : aggregated input/output/cache tokens + cost
 *
 * Callers give us `onEvent({ type, ...payload })`. We track per-content-block
 * state to accumulate partial tool_use input JSON and emit a single
 * `tool_use` event when that block stops.
 */
import { type ClaudeChildRuntimeFact, type ClaudeChildToolRuntimeFact, type ClaudeOpenChildTerminationReason } from './claude-child-evidence.js';
type StreamEvent = Record<string, unknown>;
type EventSink = (event: StreamEvent) => void;
/** Token fields carried on a single assistant `message.usage`. Mirrors the
 *  raw claude stream-json shape so the per-request sum reconciles with the
 *  run-level `result.usage` aggregate. */
export interface ClaudePerRequestUsage {
    input_tokens?: number;
    output_tokens?: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
}
export interface ClaudeStreamHandlerOptions {
    suppressHtmlArtifactsAfterFileWrite?: boolean;
    onChildRuntimeFact?: (fact: ClaudeChildRuntimeFact) => void;
    onChildToolRuntimeFact?: (fact: ClaudeChildToolRuntimeFact) => void;
    childEvidenceNow?: () => number;
    /** Consume forwarded Child frames only as native evidence, never as parent UI output. */
    suppressForwardedSubagentEvents?: boolean;
    /** 墙上时间。只用来给在途那一行盖一个不动的计时起点;测试注入。 */
    now?: () => number;
}
export declare function createClaudeStreamHandler(onEvent: EventSink, options?: ClaudeStreamHandlerOptions): {
    feed: (chunk: string) => void;
    flush: () => void;
    finishOpenChildEvidence: (reason: ClaudeOpenChildTerminationReason) => void;
    childEvidenceCoverage: () => {
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
};
export {};
