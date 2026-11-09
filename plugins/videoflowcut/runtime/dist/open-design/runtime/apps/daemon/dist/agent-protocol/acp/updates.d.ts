import type { JsonObject } from './types.js';
/**
 * Produces a shallow diagnostic snapshot of an ACP update object for the
 * `acp_raw_event_shape` diagnostic event. Captures key presence, value kinds,
 * and content structure without serialising the full update, so the payload
 * stays bounded in size. Emitted only for AMR sessions where unknown shapes
 * may require debugging.
 *
 * @param update - A parsed ACP `session/update` params object.
 * @returns A flat diagnostic object suitable for inclusion in an agent event payload.
 */
export declare function acpRawEventShape(update: JsonObject): {
    sessionUpdate: string | null;
    keys: string[];
    contentKind: string;
    contentKeys: string[];
    hasText: boolean;
    hasTopLevelText: boolean;
    hasTopLevelDelta: boolean;
    hasTopLevelMessage: boolean;
    hasToolCallId: boolean;
    hasRawInput: boolean;
    rawInputKind: string;
    rawInputKeys: string[];
    locationsKind: string;
    locationsCount: number | undefined;
    status: string | undefined;
    titlePresent: boolean;
};
/**
 * Normalises the `status` field of an ACP update to a lowercase,
 * whitespace-and-punctuation-stripped token. Returns `''` when the field
 * is absent or not a string, so all status comparisons use the token form.
 *
 * @param update - A parsed ACP `session/update` params object.
 */
export declare function acpUpdateStatus(update: JsonObject): string;
/**
 * Returns `true` when the update's `status` field represents a successful
 * terminal state (`completed`, `complete`, `succeeded`, or `success`).
 * Used to decide when to emit deferred artifact-write tool events.
 */
export declare function isAcpCompletedStatus(update: JsonObject): boolean;
/**
 * Returns `true` when the update's `status` field represents a terminal
 * failure state (`failed`, `failure`, `error`, `cancelled`, or `canceled`).
 * Used to clean up pending write-suppression state and emit failed tool events.
 */
export declare function isAcpTerminalFailureStatus(update: JsonObject): boolean;
/**
 * Returns whether an ACP tool update explicitly reports a failed operation.
 * ACP adapters use both camelCase and snake_case for process exit codes, and
 * some expose the canonical `isError` flag directly. A terminal `completed`
 * status therefore cannot be treated as success when one of these fields
 * reports failure.
 */
export declare function isAcpToolUpdateError(update: JsonObject): boolean;
/**
 * Returns `true` when the update's status is a terminal tool outcome
 * (completed or failed). Used to decide when to emit `tool_result`.
 */
export declare function isAcpTerminalToolStatus(update: JsonObject): boolean;
/**
 * Returns `true` when the update's status is `'retry'`. Signals that the AMR
 * agent wants to restart the request; the session promoter maps this to a
 * structured error payload via `promotedAmrRetryStatusPayload`.
 */
export declare function isAcpRetryStatus(update: JsonObject): boolean;
/**
 * Recursively collects all text-bearing leaf values from an ACP update
 * (strings, numbers, booleans) up to 4 levels deep. Used to produce a flat
 * text corpus for `classifyAmrAccountFailure` pattern matching without
 * requiring knowledge of a specific agent's response shape.
 *
 * @param value - Any value from a parsed ACP session update.
 * @param depth - Current recursion depth (max 4); callers omit this.
 * @returns A flat array of trimmed non-empty string representations.
 */
export declare function acpUpdateDiagnosticText(value: unknown, depth?: number): string[];
/**
 * Promotes an AMR `retry` status update into a structured OpenDesign error
 * payload when the update's diagnostic text matches a known AMR account failure
 * pattern (e.g. quota exceeded, auth failure). Returns `null` when the update
 * is not a retry or does not match a known pattern.
 *
 * @param update - A parsed ACP `session/update` params object.
 * @returns A structured error payload with `message` and `error`, or `null`.
 */
export declare function promotedAmrRetryStatusPayload(update: JsonObject): {
    message: string;
    error: {
        code: import("../../integrations/vela-errors.js").AmrAccountErrorCode;
        message: string;
        retryable: boolean;
        details: {
            kind: string;
            action: "recharge" | "relogin" | "upgrade";
            actionUrl?: string;
            promoted_by: string;
        };
    };
} | null;
/**
 * Scans a rolling tail of AMR stderr output for known retry/session-failure
 * signals and promotes a match to a structured OpenDesign error payload.
 * Returns `null` when the chunk does not contain the expected markers or does
 * not match a known failure pattern.
 *
 * @param chunk - A tail slice of accumulated stderr bytes from the AMR subprocess.
 * @returns A structured error payload, or `null` when not applicable.
 */
export declare function promotedAmrStderrPayload(chunk: string): {
    message: string;
    error: {
        code: import("../../integrations/vela-errors.js").AmrAccountErrorCode;
        message: string;
        retryable: boolean;
        details: {
            kind: string;
            action: "recharge" | "relogin" | "upgrade";
            actionUrl?: string;
            promoted_by: string;
        };
    };
} | null;
/**
 * Extracts and trims the `toolCallId` string from an ACP update, or returns
 * `null` when absent or empty. Used as a stable dedup key for artifact-write
 * tracking across update frames.
 *
 * @param update - A parsed ACP `session/update` params object.
 */
export declare function acpToolCallId(update: JsonObject): string | null;
/**
 * True when ACP `kind` is a known tool family we trust over title heuristics.
 * Unknown kinds still map to a display name but do not lock the tool name
 * across partial frames (agents sometimes invent kind strings).
 */
export declare function isAcpRecognizedKind(kind: string): boolean;
/**
 * Returns `true` when the update's `kind`, `title`, or `name` field indicates
 * a file-write operation (`edit`, `write`, `create`, `update`, `save`,
 * `patch`, or `replace`). Used to identify artifact-write tool calls for the
 * DSML suppressor (including kind-only write frames with no title words).
 *
 * @param update - A parsed ACP `session/update` params object.
 */
export declare function isAcpArtifactWriteLabel(update: JsonObject): boolean;
/**
 * Returns `true` when the tool is pure think/reason activity and must not
 * count as a concrete tool event for AMR no-output detection (and is omitted
 * from the tool_use/tool_result transcript).
 */
export declare function isAcpThinkOnlyTool(update: JsonObject): boolean;
/** Path source rank: higher wins when merging partial ACP frames. */
export declare const ACP_PATH_RANK_LOCATIONS = 3;
export declare const ACP_PATH_RANK_RAW_INPUT = 2;
export declare const ACP_PATH_RANK_TITLE = 1;
export type AcpPathCandidate = {
    path: string;
    rank: number;
};
/** Options for path extraction; `sessionCwd` is the run's working directory. */
export type AcpPathOptions = {
    sessionCwd?: string | null;
};
/**
 * Best-effort path extraction with a precedence rank so partial-frame merges
 * can upgrade a weak title path when locations/rawInput arrive later.
 */
export declare function acpArtifactWritePathRanked(update: JsonObject, options?: AcpPathOptions): AcpPathCandidate | null;
/**
 * Returns `true` when an ACP update represents the terminal completion of an
 * artifact-write tool call and should arm the DSML text suppressor. Requires
 * a completed status combined with either a write-style label or a tool call
 * id tracked in `writeToolCallIds`.
 *
 * @param update - A parsed ACP `session/update` params object.
 * @param writeToolCallIds - The set of tool call ids identified as artifact writes so far.
 */
export declare function isAcpArtifactWriteUpdate(update: JsonObject, writeToolCallIds: Set<string>): boolean;
/**
 * Returns `true` when `token` looks like a filesystem path rather than a
 * dotted identifier (`Image.open`, `f.read`, `pptx.util`).
 */
export declare function isAcpPathLikeToken(token: string): boolean;
/** True when a tool name would enter Langfuse's Bash-like partial-redact allowlist. */
export declare function isAcpPartialRedactToolName(toolName: string): boolean;
/**
 * Sanitizes an ACP custom/adapter tool name before it enters the transcript.
 *
 * Kind `other` tools may ship free-text `name` values that embed paths, URLs,
 * tokens, or other user-specific strings. Those names flow into tool_use events
 * and then into Langfuse span labels / toolName metadata (even when content
 * telemetry is off). Only identifier-like names are kept; everything else
 * collapses to the opaque family label `Other`. Langfuse additionally
 * canonicalizes non-allowlisted names at the telemetry boundary.
 *
 * Callers that resolve names without a recognized execute-family kind
 * (missing kind, kind:other, unknown kinds) must also reject Bash-like
 * partial-redact labels via `isAcpPartialRedactToolName` so custom tools
 * cannot impersonate the sole non-fail-closed family.
 */
export declare function sanitizeAcpCustomToolName(raw: string): string;
/**
 * Maps an ACP adapter `toolCallId` to a transcript/telemetry-safe id.
 *
 * Adapters may embed user paths or secrets in toolCallId (for example
 * `read:/home/alice/.env`, `sk-proj-…`, `ghp_…`, or a JWT). Those values
 * would otherwise flow into tool_use/tool_result events, then into Langfuse
 * span ids and `metadata.toolCallId`. Every non-empty adapter id is replaced
 * with a stable opaque hash so identifier-shaped secrets cannot leak even
 * when they contain no path characters. Session-local maps may still key
 * off the raw id for frame correlation.
 */
export declare function acpTelemetryToolCallId(raw: string): string;
/**
 * Resolves a stable Claude-shaped tool name from an ACP tool-call update.
 * Trusted ACP `kind` wins over both explicit `name` and title heuristics when
 * the kind is a known tool family (so `kind: read` + `name: read_file` or
 * title "update …" stays Read). That keeps content-tool redaction and analytics
 * families aligned with Langfuse's canonical name set. Kind `other` is the
 * exception: it is recognized for stickiness but is not a family, so an
 * explicit identifier-like name still wins there for UI/transcript — except
 * Bash-like partial-redact labels, which collapse to `Other` so custom MCP
 * tools cannot bypass Langfuse fail-closed payload redaction. The same rule
 * applies when `kind` is missing: a bare `name: "Bash"` (or Bash-like title)
 * must not unlock partial redaction without a recognized execute-family kind.
 * Untrusted free-text names (paths, tokens, titles) are collapsed to `Other`
 * before the event is emitted so Langfuse span labels cannot carry
 * user-specific strings. Payloads for unknown tools still fail closed in
 * Langfuse (`shouldFullyRedactToolPayload`). Write-label override to Write/Edit
 * applies only when there is no recognized non-write kind, so
 * `countNewArtifacts` keeps working for title-only write frames.
 */
export declare function acpToolName(update: JsonObject): string;
/**
 * Builds a Claude-shaped tool input object from an ACP tool-call update.
 * Starts from `rawInput` when present, attaches `file_path` when a real path
 * is available, and never fabricates a path from `toolCallId`.
 */
export declare function acpToolInput(update: JsonObject, options?: AcpPathOptions): Record<string, unknown>;
/**
 * Extracts tool-result text from an ACP terminal tool-call update.
 * Prefers `rawOutput`, then text/diff content entries. Truncates large
 * payloads so trace storage stays bounded.
 */
export declare function acpToolResultContent(update: JsonObject, maxChars?: number): string;
/** True when `toolName` is an ACP execute/bash-family tool. */
export declare function isAcpExecuteToolName(toolName: string): boolean;
/**
 * Sanitizes ACP tool_result content for the canonical agent transcript.
 *
 * Content tools (Read/Write/…) keep full bodies so the local UI and Langfuse
 * content-tool redactor can each do their job. Execute/Bash is different:
 * Langfuse only applies lexical secret+path masking to Bash, and ACP only
 * started forwarding execute results with the full-transcript change — so a
 * `cat .env` body would ship to telemetry almost intact. Replace raw stdout
 * with a length summary before emit.
 */
export declare function acpSafeToolResultContent(toolName: string, content: string): string;
/**
 * Best-effort extraction of a concrete file path from an ACP tool-call update,
 * checking three sources in priority order:
 * 1. `locations` or `content` array entries with a `path` field.
 * 2. `rawInput.path`, `rawInput.file_path`, `rawInput.filename`, or `rawInput.filePath`.
 * 3. A path-like filename token embedded in the human-readable `title` field
 *    (rejects dotted identifiers like `Image.open`).
 *
 * Returns `null` when no concrete path is present. Does not use `toolCallId`
 * as a path — callers decide how to key pathless writes.
 *
 * @param update - A parsed ACP `session/update` params object.
 * @returns An absolute or relative file path string, or `null` when absent.
 */
export declare function acpArtifactWritePath(update: JsonObject, options?: AcpPathOptions): string | null;
