export declare const DECK_PROTOCOL_VERSION: 1;
export declare const DECK_NAVIGATE_MESSAGE_TYPE: 'od:slide';
export declare const DECK_STATE_MESSAGE_TYPE: 'od:slide-state';
export declare const DECK_READY_MESSAGE_TYPE: 'od:deck-ready';
export declare const DECK_PROTOCOL_V1_CAPABILITIES: readonly ['absolute-navigation', 'state-events'];
export type DeckNavigationAction = 'next' | 'prev' | 'first' | 'last' | 'go';
interface DeckNavigateMessageBase {
    type: typeof DECK_NAVIGATE_MESSAGE_TYPE;
    /** Omitted by legacy hosts; v1 runtimes intentionally accept both forms. */
    protocolVersion?: typeof DECK_PROTOCOL_VERSION;
}
export type DeckNavigateMessage = DeckNavigateMessageBase & ({
    action: 'go';
    /** Zero-based target index. */
    index: number;
} | {
    action: Exclude<DeckNavigationAction, 'go'>;
    index?: never;
});
export interface DeckStateMessage {
    type: typeof DECK_STATE_MESSAGE_TYPE;
    active: number;
    count: number;
    protocolVersion: typeof DECK_PROTOCOL_VERSION;
}
export interface DeckReadyMessage {
    type: typeof DECK_READY_MESSAGE_TYPE;
    protocolVersion: typeof DECK_PROTOCOL_VERSION;
    capabilities: typeof DECK_PROTOCOL_V1_CAPABILITIES;
}
/**
 * Canonical inline adapter used by the fixed Agent deck skeleton.
 *
 * The surrounding skeleton owns `idx`, `slides`, and `go(index)`. Keeping the
 * host protocol in one shared literal prevents the daemon and API/BYOK prompt
 * copies from growing different message dialects while leaving deck styling
 * and standalone keyboard/click navigation fully local to the artifact.
 */
export declare const DECK_PROTOCOL_V1_INLINE_RUNTIME: string;
export {};
//# sourceMappingURL=deck-protocol.d.ts.map