import type { AgentEventPayloadTruncation } from '@open-design/contracts';
/** Maximum UTF-8 size of one stored run event's JSON. */
export declare const RUN_EVENT_JSON_BUDGET_BYTES: number;
/** Size a string payload is shortened to when its event exceeds the budget. */
export declare const RUN_EVENT_STRING_PAYLOAD_BUDGET_BYTES: number;
/**
 * `value` cut to at most `budgetBytes` UTF-8 bytes: its head, an explicit
 * marker (bytes omitted, original size, a digest of the original), its tail.
 * Cuts land on code-point boundaries. The digest makes two different originals
 * that share a head and tail shorten to different strings, so downstream
 * adjacent-duplicate folding can never merge them.
 */
export declare function truncateTextToUtf8Budget(value: string, budgetBytes: number): string;
/**
 * A stdout line no parser recognised, bounded so that the `raw` event carrying
 * it fits the per-event budget. `parsed` is the line's already-parsed JSON when
 * the caller has it (the stream parsers do), so it is not parsed twice.
 *
 * A JSON line stays valid JSON: known full-content fields are replaced by a
 * marker first, then long strings are shortened. Only a line that is not JSON
 * (or whose structure alone is too large) is cut as plain text.
 */
export declare function boundRawAgentLine(line: string, parsed?: unknown): {
    line: string;
    truncated?: AgentEventPayloadTruncation;
};
/** The SSE `agent` payload for an unrecognised stdout line, already bounded. */
export declare function boundedRawAgentEvent(line: string, parsed?: unknown): {
    type: 'raw';
    line: string;
    truncated?: AgentEventPayloadTruncation;
};
/**
 * `event` as it may be stored: returned unchanged (same reference) when it
 * fits the per-event budget or is a `text`/`thinking` event; otherwise a copy
 * whose payload is shortened until it fits (see the module comment).
 */
export declare function boundPersistedAgentEvent<T>(event: T): T;
/** {@link boundPersistedAgentEvent} over a list; the same array when nothing changed. */
export declare function boundPersistedAgentEvents<T>(events: readonly T[]): readonly T[];
/**
 * The `events_json` text for a list of run events, every event bounded. Byte
 * for byte what `JSON.stringify(events)` produces whenever every event already
 * fits, and it serializes each event once in that case.
 */
export declare function serializeRunEventsForStorage(events: readonly unknown[]): string;
