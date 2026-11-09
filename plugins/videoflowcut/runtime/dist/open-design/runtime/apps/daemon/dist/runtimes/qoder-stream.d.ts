/**
 * Parses Qoder CLI's `--output-format stream-json` JSONL stream into the
 * small event set consumed by the chat UI. Qoder's top-level records are
 * wrapper objects (`system`, `assistant`, `result`) with adapter-specific
 * fields, so keep this parser separate from Claude/Codex-compatible streams.
 */
type QoderEvent = Record<string, unknown>;
type QoderEventSink = (event: QoderEvent) => void;
export declare function createQoderStreamHandler(onEvent: QoderEventSink): {
    feed: (chunk: unknown) => void;
    flush: () => void;
};
export {};
