/**
 * Shared Markdown-context helpers used by both the streaming artifact parser
 * and the post-stream `<artifact>` stripper. The single source of truth for
 * what counts as a fenced code block or an inline code span — kept in lock
 * step with the web chat Markdown renderer so the parser/stripper view of
 * a buffer matches what the chat UI will actually render.
 *
 * Anything that "looks like" an artifact tag inside one of these regions is
 * literal Markdown and must not be treated as a real protocol tag.
 */
import { CHAT_PROTOCOL_FENCE_OPEN_RE as FENCE_OPEN_RE, CHAT_PROTOCOL_FENCE_CLOSE_RE as FENCE_CLOSE_RE, isChatProtocolStandaloneLine as isStandaloneMarkdownLine, type ChatProtocolRange as Range } from './chat-protocol-context.js';
export { FENCE_OPEN_RE, FENCE_CLOSE_RE, isStandaloneMarkdownLine, type Range };
export declare const INLINE_CODE_RE: RegExp;
export declare function isRealArtifactOpenAt(content: string, idx: number): boolean;
/**
 * Compute the half-open `[start, end)` ranges of `buffer` that the renderer
 * would treat as fenced code blocks or inline code spans. The `unclosedFenceStart`
 * is the index of an opening fence with no matching close in the buffer (or
 * `null` if every fence is closed) — the streaming parser uses it to hold
 * back; the stripper ignores it.
 *
 * Lines without a terminating `\n` (the trailing partial line during
 * streaming) are not classified as fence delimiters here. Callers that care
 * about partial-state behavior should inspect the tail themselves.
 */
export declare function computeSkipRanges(buffer: string): {
    ranges: Range[];
    unclosedFenceStart: number | null;
};
export declare function rangeContains(ranges: ReadonlyArray<Range>, p: number): boolean;
//# sourceMappingURL=artifact-markdown-context.d.ts.map