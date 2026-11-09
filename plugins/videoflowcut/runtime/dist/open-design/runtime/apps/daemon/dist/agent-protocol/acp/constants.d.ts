/** @module agent-protocol/acp/constants
 * Protocol version, timeout defaults, artifact-detection patterns, and
 * model-config identifier sets used across all acp/ files. No dependencies
 * on other agent-protocol modules — safe to import from anywhere in acp/.
 */
/** ACP JSON-RPC protocol version sent in every `initialize` handshake. */
export declare const ACP_PROTOCOL_VERSION = 1;
/** Default timeout in milliseconds for short-lived ACP operations such as model detection. */
export declare const DEFAULT_TIMEOUT_MS = 15000;
/** Absolute upper ceiling for any ACP-derived timeout value (24 hours). */
export declare const MAX_TIMEOUT_MS: number;
/** Default per-stage inactivity watchdog timeout (10 minutes) for an ACP session; resets on every received line from the agent subprocess. */
export declare const DEFAULT_STAGE_TIMEOUT_MS: number;
/** Regex source fragment matching an opening DSML artifact or plain `artifact` tag in an ACP agent's text output. */
export declare const ACP_ARTIFACT_OPEN_PATTERN: string;
/** Regex source fragment matching agent preamble text like "here is the generated file:" that precedes an artifact open tag. */
export declare const ACP_GENERATED_FILE_PREFIX_PATTERN: string;
/** Compiled regex that detects the start of an ACP artifact echo in an `agent_message_chunk` delta; used to arm the DSML text suppressor. */
export declare const ACP_ARTIFACT_ECHO_START_RE: RegExp;
/** Maximum number of `acp_raw_event_shape` and `acp_artifact_text_suppression` diagnostic events emitted per session to avoid flooding the event stream. */
export declare const ACP_RAW_EVENT_SHAPE_DIAGNOSTIC_LIMIT = 8;
/** Maximum number of bytes retained from stderr to detect AMR retry/failure signals; older bytes are discarded to bound memory use. */
export declare const AMR_STDERR_RETRY_TAIL_LIMIT = 16000;
/** Maximum number of redacted stderr characters attached to an ACP child-exit diagnostic. */
export declare const ACP_STDERR_DIAGNOSTIC_TAIL_LIMIT = 4000;
/**
 * Floor between two `tool_in_flight` publications for the SAME tool call.
 *
 * The first publication of a call is never throttled — that is the entire
 * point, since a row must appear the moment the agent says it started. This
 * only bounds the UPDATES that follow.
 *
 * 250ms is read off the real AMR corpus (202 calls / 911 frames): a shell call
 * lands its `in_progress` frames in bursts of three within ~14ms while its
 * payload is unchanged, and no burst of *changed* payloads was ever tighter
 * than a second. A quarter second collapses those bursts, keeps at most four
 * updates per second for an agent that streams output, and is far below the
 * threshold at which a growing number reads as stalled.
 */
export declare const ACP_IN_FLIGHT_TOOL_MIN_INTERVAL_MS = 250;
/** Maximum characters of in-progress tool output carried on a `tool_in_flight` event. */
export declare const ACP_IN_FLIGHT_TOOL_OUTPUT_LIMIT = 2000;
/** Normalised token IDs that identify a model-selection config option in an ACP `session/new` response's `configOptions` array. */
export declare const MODEL_CONFIG_OPTION_IDS: Set<string>;
