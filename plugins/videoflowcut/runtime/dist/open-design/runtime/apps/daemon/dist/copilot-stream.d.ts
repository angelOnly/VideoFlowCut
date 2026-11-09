/**
 * Parses GitHub Copilot CLI's `--output-format json` JSONL stream into the
 * same UI-friendly events that claude-stream.js emits, so the chat panel
 * can render Copilot's thinking / tool calls / text the same way it does
 * Claude Code's.
 *
 * Copilot's schema uses dotted top-level types (`assistant.*`, `tool.*`,
 * `session.*`, `user.*`, `result`) with the payload under `data`. The
 * `ephemeral: true` events (session.mcp_*, reasoning_delta, etc.) are still
 * useful — they carry the streaming deltas — but events we don't have a UI
 * lane for (mcp_server_status, skills_loaded, full reasoning recap, turn
 * boundaries) are dropped on the floor.
 *
 * Mapping:
 *   session.tools_updated         -> status (initializing, with model name)
 *   assistant.turn_start          -> status (streaming)
 *   assistant.reasoning_delta     -> thinking_delta
 *   assistant.message_delta       -> text_delta
 *   tool.execution_start          -> tool_use
 *   tool.execution_complete       -> tool_result
 *   result                        -> usage
 */
type StreamEvent = Record<string, unknown>;
type EventSink = (event: StreamEvent) => void;
export declare function createCopilotStreamHandler(onEvent: EventSink): {
    feed: (chunk: string) => void;
    flush: () => void;
};
export {};
