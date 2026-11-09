export type ChatTurnHostProtocolPolicy = 'ordinary' | 'od_next_request' | 'od_next_production';
export interface ChatTurnHostProtocolInstructions {
    doneMarker: string;
    nextSteps: string;
    artifactFocus: string;
    text: string;
}
/**
 * Render the keyed, per-turn protocol that hands a completed model turn back to
 * the chat host. The nonce keeps this text out of every cache-stable prompt
 * head; callers inject it into the request/continuation slice only.
 *
 * `locale` is the run's UI locale (`ChatRequest.locale`). Callers that have it
 * must pass it; see `nextStepLanguageRule` for why this block restates a rule
 * the stable prompt head already carries.
 */
export declare function renderChatTurnHostProtocolInstructions(key: string, policy?: ChatTurnHostProtocolPolicy, locale?: string | undefined): ChatTurnHostProtocolInstructions;
//# sourceMappingURL=chat-turn-host-protocol.d.ts.map