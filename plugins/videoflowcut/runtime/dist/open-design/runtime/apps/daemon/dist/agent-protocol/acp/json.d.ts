/** @module agent-protocol/acp/json
 * Pure JSON value-extraction and text-traversal helpers for the ACP layer,
 * plus the `OD_ACP_TIMEOUT_MS` environment resolver. Has no side effects and
 * performs no I/O; depends only on acp/types and acp/constants.
 * Consumed by acp/rpc.ts, acp/session.ts, acp/models.ts, and acp/updates.ts.
 */
import type { JsonObject } from './types.js';
/**
 * Extracts a human-readable error message from an unknown thrown value.
 * Returns `err.message` for `Error` instances, `String(err)` otherwise.
 *
 * @param err - Any caught value (typically an `Error` but may be anything).
 */
export declare function errorMessage(err: unknown): string;
/**
 * Resolves the effective ACP timeout from `OD_ACP_TIMEOUT_MS` in the process
 * environment, falling back to `fallbackMs` when the variable is absent or
 * non-finite. Clamps the result to `[0, MAX_TIMEOUT_MS]`.
 *
 * @param env - The process environment object to read `OD_ACP_TIMEOUT_MS` from.
 * @param fallbackMs - The default timeout to use when the env var is unset.
 * @returns The resolved timeout in milliseconds.
 */
export declare function resolveAcpTimeoutMs(env: NodeJS.ProcessEnv, fallbackMs: number): number;
/**
 * Coerces an unknown value to a `JsonObject` if it is a non-null, non-array
 * plain object, or returns `null` otherwise. The primary guard used throughout
 * the ACP layer before accessing named properties on parsed JSON frames.
 *
 * @param value - Any value from a JSON parse result.
 * @returns The value cast as `JsonObject`, or `null` when the cast is unsafe.
 */
export declare function asObject(value: unknown): JsonObject | null;
/**
 * Returns a short diagnostic string describing the JSON kind of `value`:
 * `'array'`, `'null'`, or the result of `typeof`. Used to build
 * `acp_raw_event_shape` diagnostics without touching the value.
 *
 * @param value - Any value from a parsed ACP update object.
 */
export declare function acpValueKind(value: unknown): string;
/**
 * Returns a sorted array of own string keys from `value` if it is a
 * `JsonObject`, or an empty array otherwise. Used to snapshot object
 * structure for diagnostic payloads without risking a throw.
 *
 * @param value - Any value from a parsed ACP update object.
 */
export declare function objectKeys(value: unknown): string[];
/**
 * Recursively traverses an ACP update value up to 4 levels deep and returns
 * the first non-empty string found, checking common text-bearing keys in order:
 * `text`, `delta`, `content`, `message`, `output`, `answer`, `value`, `body`,
 * `parts`, `choices`. Handles string scalars, flat arrays, and nested objects.
 *
 * Used as the extraction primitive by `extractAcpUpdateText`.
 *
 * @param value - A value from a parsed ACP session update.
 * @param depth - Current recursion depth (max 4); callers omit this.
 * @returns The first non-empty string found, or `null` when none is present.
 */
export declare function extractAcpTextValue(value: unknown, depth?: number): string | null;
/**
 * Extracts the first non-empty text string from the top-level properties of a
 * parsed ACP session update object. Checks the same key list as
 * `extractAcpTextValue` but at only one level of depth (the update object
 * itself), delegating deep traversal to that helper.
 *
 * @param update - A parsed ACP `session/update` params object.
 * @returns The first non-empty text string, or `null` when none is present.
 */
export declare function extractAcpUpdateText(update: JsonObject): string | null;
/**
 * Pull a short human-readable status detail (`message` / `detail`) off an ACP
 * `session/update`, so a status event can carry e.g. a "compacting context"
 * reason. Returns `undefined` when neither field is a non-empty string.
 */
export declare function extractAcpStatusDetail(update: JsonObject): string | undefined;
