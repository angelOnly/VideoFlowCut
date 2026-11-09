/** ACP extension. A cursor continues persisted work; it never authorizes prompt replay. */
export declare const AMR_CONTINUATION_CAPABILITY = "com.open-design.nativeSessionContinue";
export declare const AMR_CONTINUATION_ERROR_CODE = "OPENCODE_COMPACTION_CONTINUATION_INCOMPLETE";
export interface AmrContinuationCursor {
    version: 1;
    userMessageId: string;
    assistantMessageId: string;
    toolResultsCommitted: true;
}
export interface AmrContinuationRecovery {
    sessionId: string;
    cursor: AmrContinuationCursor;
}
export declare function supportsAmrNativeContinuation(initializeResult: unknown): boolean;
/** Call only on the RPC failure channel, never on assistant prose. */
export declare function isAmrContinuationIncomplete(message: string, data: unknown): boolean;
export declare function parseAmrContinuationRecovery(data: unknown): AmrContinuationRecovery | null;
//# sourceMappingURL=amr-continuation.d.ts.map