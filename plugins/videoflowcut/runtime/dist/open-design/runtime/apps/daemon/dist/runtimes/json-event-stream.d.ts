import { type OpenCodeTaskTerminalCandidate } from './opencode-child-evidence.js';
type JsonObject = Record<string, unknown>;
type StreamEvent = Record<string, unknown>;
type StreamEventHandler = (event: StreamEvent) => void;
type ParserKind = string;
/**
 * Feed already-parsed codex stream frames (the `exec --json` object shapes)
 * through the same branch `createJsonEventStreamHandler('codex', …)` uses.
 *
 * This exists so the app-server transport can reuse the shipping item ->
 * tool_use/tool_result/thinking mapping verbatim instead of maintaining a
 * second copy that would drift. The app-server bridge translates its camelCase
 * JSON-RPC notifications into these frames and routes them here; anything the
 * codex branch does not recognise reports `false` so the caller can decide
 * whether to ignore it or surface it.
 */
export declare function createCodexFrameHandler(onEvent: StreamEventHandler): {
    /** Returns true when the codex branch consumed the frame. */
    handleFrame(frame: JsonObject): boolean;
};
export interface JsonEventStreamHandlerOptions {
    openCodeChildEvidence?: {
        rootSessionId?: string;
        cliVersion: string;
        onCandidate: (candidate: OpenCodeTaskTerminalCandidate) => void;
        now?: () => number;
    };
}
export declare function createJsonEventStreamHandler(kind: ParserKind, onEvent: StreamEventHandler, options?: JsonEventStreamHandlerOptions): {
    feed: (chunk: string) => void;
    flush: () => void;
    childEvidenceCoverage: (streamComplete: boolean) => {
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
    childEvidenceCandidates: () => readonly OpenCodeTaskTerminalCandidate[];
};
export {};
