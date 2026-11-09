import type { JsonValue } from '../common.js';
import type { AgentToolName } from './descriptor.js';
/**
 * Wire-format version for the browser-action request/result pair. Carried on
 * both messages so the daemon and a browser session can detect skew; bump it
 * when the envelope shape changes incompatibly.
 */
export declare const AGENT_ACTIONS_PROTOCOL_VERSION = 1;
/**
 * One invocation of a browser-surface tool, minted by the daemon and dispatched
 * toward a live browser session over the existing outbound run-event stream.
 *
 * The daemon mints `invocationId`; a provider `tool_call_id` (BYOK loop) or an
 * MCP request id (local-CLI agent) is mapped to it daemon-side and never enters
 * this contract, so the shape stays neutral across both execution models.
 */
export interface BrowserActionRequest {
    protocolVersion: typeof AGENT_ACTIONS_PROTOCOL_VERSION;
    /** The stable action identity. Daemon-minted, unique per invocation. */
    invocationId: string;
    /** The run this invocation belongs to. */
    runId: string;
    /** Which tool to invoke (matches a registered `BrowserToolDescriptor.name`). */
    tool: AgentToolName;
    /** Validated against the tool's `inputSchema` before dispatch. */
    input: JsonValue;
}
/**
 * Terminal error codes for a browser action. The `const` array mirrors the
 * house `API_ERROR_CODES` idiom so the union derives from a single source.
 */
export declare const BROWSER_ACTION_ERROR_CODES: readonly ['TOOL_NOT_AVAILABLE', 'INVALID_INPUT', 'EXECUTION_FAILED', 'TIMEOUT', 'SUPERSEDED', 'USER_DENIED'];
export type BrowserActionErrorCode = (typeof BROWSER_ACTION_ERROR_CODES)[number];
/**
 * The uniform terminal result of a browser action, `ok`-discriminated and
 * correlated to its request by `invocationId`. `result` is a {@link JsonValue}
 * so a navigation acknowledgement (`{ view: 'media' }`) and a future
 * data-returning read serialize through the same shape — never a navigation
 * special case.
 */
export type BrowserActionResult = {
    protocolVersion: typeof AGENT_ACTIONS_PROTOCOL_VERSION;
    /** Echoes `BrowserActionRequest.invocationId` — the join key back to the run. */
    invocationId: string;
    /** Echoes the tool name for observability; not an identity. */
    tool: AgentToolName;
    ok: true;
    result: JsonValue;
} | {
    protocolVersion: typeof AGENT_ACTIONS_PROTOCOL_VERSION;
    invocationId: string;
    tool: AgentToolName;
    ok: false;
    error: {
        code: BrowserActionErrorCode;
        message: string;
        details?: JsonValue;
    };
};
//# sourceMappingURL=actions.d.ts.map