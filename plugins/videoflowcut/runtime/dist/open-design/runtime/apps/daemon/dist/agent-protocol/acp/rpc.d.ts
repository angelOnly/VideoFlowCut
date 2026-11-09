/** @module agent-protocol/acp/rpc
 * JSON-RPC 2.0 send helpers, error-shape parsers, usage normaliser, and
 * permission-outcome selector for the ACP protocol layer. Depends on
 * acp/types and acp/json; consumed by acp/session.ts and acp/models.ts.
 */
import type { JsonRpcId, RpcWritable } from './types.js';
/** Safe numeric facts derived from the exact serialized request frame. */
export interface SerializedRpcFrameObservation {
    method: string;
    frameBytes: number;
}
/** Best-effort observer invoked after the serialized request is written. */
export type SerializedRpcFrameObserver = (observation: SerializedRpcFrameObservation) => void;
/**
 * Writes a JSON-RPC 2.0 request frame to `writable` as a single newline-terminated
 * line. Used to send ACP method calls (e.g. `initialize`, `session/new`,
 * `session/prompt`) to an agent subprocess's stdin.
 *
 * @param writable - The agent's stdin (or equivalent writable).
 * @param id - The JSON-RPC request id used to correlate the response.
 * @param method - The RPC method name.
 * @param params - The method parameter payload (any JSON-serialisable value).
 */
export declare function sendRpc(writable: RpcWritable, id: JsonRpcId, method: string, params: unknown, observeSerializedFrame?: SerializedRpcFrameObserver): void;
/**
 * Writes a JSON-RPC 2.0 result response frame to `writable`. Used to reply to
 * incoming `session/request_permission` calls from an ACP agent.
 *
 * @param writable - The agent's stdin (or equivalent writable).
 * @param id - The id from the incoming request being answered.
 * @param result - The result payload to include in the response.
 */
export declare function sendRpcResult(writable: RpcWritable, id: JsonRpcId, result: unknown): void;
/** Writes an ACP notification without a request id or an expected response. */
export declare function sendRpcNotification(writable: RpcWritable, method: string, params: unknown): void;
/**
 * Type guard that returns `true` when `value` is a valid JSON-RPC id
 * (a `number` or `string`). Used before replying to incoming requests.
 */
export declare function isJsonRpcId(value: unknown): value is JsonRpcId;
/**
 * Extracts a human-readable error message from a raw JSON-RPC response object
 * that contains an `error` field. Returns an empty string when the response
 * is not an error frame, allowing callers to use it as a truthy check.
 *
 * @param raw - A parsed JSON-RPC response object (unknown shape).
 * @returns A non-empty error message string, or `''` when not an error response.
 */
export declare function rpcErrorMessage(raw: unknown): string;
/**
 * Extracts the structured `data` field from a JSON-RPC error response's `error`
 * object, if present. Used to retrieve typed failure details (e.g. `retryable`,
 * vendor-specific error codes) without throwing.
 *
 * @param raw - A parsed JSON-RPC response object (unknown shape).
 * @returns The `error.data` value, or `undefined` when absent.
 */
export declare function rpcErrorData(raw: unknown): unknown;
/**
 * Reads an upstream retryability statement out of a structured RPC error `data`
 * payload. Returns `undefined` when no statement is present so callers can
 * distinguish "explicitly false" from "not present" and apply their own default.
 *
 * The two spellings are not read with equal authority, and deliberately so:
 * ACP's own `retryable` is honoured in both directions, while the vendor
 * `isRetryable` flag is honoured only when it says `true` — the same asymmetry
 * `inferRpcErrorRetryable` applies to that field's string form, so the bridge's
 * verdict does not depend on which shape the adapter happened to send.
 *
 * @param data - The value of `error.data` extracted via `rpcErrorData`.
 */
export declare function rpcErrorRetryable(data: unknown): boolean | undefined;
/**
 * Fallback retryability inference from the error message/details text, used when
 * the runtime does not set an explicit `retryable` field. `request_too_large`
 * (the prompt must shrink) is non-retryable; upstream transport blips
 * (`stream idle timeout`, `overloaded`, gateway/service outages) are retryable.
 * Returns `undefined` when nothing matches so callers keep their own default.
 */
export declare function inferRpcErrorRetryable(message: string, data: unknown): boolean | undefined;
/**
 * Promotes an opencode `ROLE_MARKER_HALLUCINATION` error embedded in an ACP
 * JSON-RPC `error.data` payload into a canonical OpenDesign error object.
 * Returns `null` when the data payload does not match the expected shape.
 * Exists so callers can surface a vendor-specific failure with a structured
 * error code rather than a bare generic message.
 *
 * @param data - The `error.data` field from a JSON-RPC error response.
 * @param fallbackMessage - Used when the payload's `message` field is blank.
 * @returns A structured error payload, or `null` when not applicable.
 */
export declare function promotedOpenCodeSessionErrorPayload(data: unknown, fallbackMessage: string): {
    message: string;
    error: {
        code: string;
        message: string;
        retryable: boolean;
        details: {
            promoted_by: string;
        };
    };
} | null;
/** Normalised token-usage counters extracted from an ACP session result for downstream analytics and cost tracking. */
export interface FormattedUsage {
    input_tokens?: number;
    output_tokens?: number;
    /** OpenAI-like inclusive cache-read subset (input already includes cache). */
    cached_read_tokens?: number;
    /** Anthropic-like additive cache-read (input is uncached remainder). */
    cache_read_input_tokens?: number;
    /** Generic / OpenAI-like cache write alias. */
    cache_creation_tokens?: number;
    /** Anthropic-like cache creation field name. */
    cache_creation_input_tokens?: number;
    /** OpenAI-like cache write alias used by some ACP adapters. */
    cached_write_tokens?: number;
    thought_tokens?: number;
    total_tokens?: number;
}
/**
 * Normalises an ACP agent's raw `usage` object (camelCase and/or snake_case
 * keys) into the snake_case `FormattedUsage` shape used by the daemon event
 * stream. Returns `null` when the input is not a recognisable usage object or
 * has no known fields.
 *
 * Cache field names are preserved by family so
 * `scanRunEventsForUsageAnalytics` can classify anthropic (additive) vs
 * openai (inclusive) correctly. Do not collapse Anthropic
 * `cache_read_input_tokens` into `cached_read_tokens`.
 *
 * @param usage - The raw `result.usage` value from a `session/prompt` response.
 * @returns A `FormattedUsage` object with at least one field, or `null`.
 */
export declare function formatUsage(usage: unknown): FormattedUsage | null;
/**
 * Selects the best permission-outcome `optionId` to reply with when an ACP
 * agent sends a `session/request_permission` request. Prefers
 * `approve_for_session`, then `allow_always`, then `allow_once`.
 *
 * @param options - The `params.options` array from the incoming permission request.
 * @returns The chosen `optionId` string, or `null` when no approvable option is found.
 */
export declare function choosePermissionOutcome(options: unknown): string | null;
