export declare const XAI_CALLBACK_HOST = "127.0.0.1";
export declare const XAI_CALLBACK_PORT = 56121;
export declare const XAI_CALLBACK_PATH = "/callback";
export type CallbackOutcome = {
    kind: 'ok';
    code: string;
    state: string;
} | {
    kind: 'error';
    error: string;
    state?: string;
};
export interface StartCallbackListenerInput {
    expectedState: string;
    onCallback: (outcome: CallbackOutcome) => Promise<void> | void;
    timeoutMs?: number;
    /** Override port (useful for tests; default 56121). */
    port?: number;
    /** Override host (useful for tests; default 127.0.0.1). */
    host?: string;
}
export interface CallbackListener {
    /** Where the listener is actually bound (informational, esp. for tests). */
    readonly address: {
        host: string;
        port: number;
    };
    /** Stop the listener early (e.g. user cancelled OAuth in the UI). */
    stop(): Promise<void>;
}
/**
 * Open a one-shot HTTP listener for the xAI OAuth redirect.
 *
 * Resolves once the listener is bound; callback handling is asynchronous
 * via `onCallback`. The listener self-closes after the first matching
 * callback OR after `timeoutMs` (default 30 min), whichever comes first.
 */
export declare function startCallbackListener(input: StartCallbackListenerInput): Promise<CallbackListener>;
