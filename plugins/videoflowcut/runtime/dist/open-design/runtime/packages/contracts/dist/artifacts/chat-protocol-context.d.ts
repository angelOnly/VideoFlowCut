export type ChatProtocolRange = readonly [number, number];
export declare const CHAT_PROTOCOL_FENCE_OPEN_RE: RegExp;
export declare const CHAT_PROTOCOL_FENCE_CLOSE_RE: RegExp;
/**
 * Headings/list rows have separate inline-code contexts in the chat renderer.
 * Horizontal rules are deliberately absent: inside an existing paragraph they
 * remain paragraph text, so inline backticks can pair across those rows.
 */
export declare function isChatProtocolStandaloneLine(line: string): boolean;
/** Form grammar stays with its parser; this walker only owns nesting/order. */
type ReadFormPayload = (text: string, openStart: number) => ChatProtocolRange | null;
/**
 * Code and protocol payloads are data, never independent question/done markers.
 * Recognized cards/forms reset Markdown after their close: JSON field strings
 * cannot open code or cards in following prose. An unfinished card owns its
 * remaining payload until a later delta completes it.
 *
 * All indexes advance monotonically. In particular, a sequence of valid cards
 * does not rescan the entire remaining Markdown tail once per card.
 */
export declare function chatProtocolSkipRanges(text: string, readFormPayload: ReadFormPayload): ChatProtocolRange[];
/** Equal-length search view only; the original text remains the rendered data. */
export declare function maskChatProtocolPayloads(text: string, readFormPayload: ReadFormPayload): string;
export {};
//# sourceMappingURL=chat-protocol-context.d.ts.map