type EventSink = (event: {
    type: 'text_delta';
    delta: string;
}) => void;
export interface ArtifactTextSuppressor {
    strip(text: string): string;
    flush(): string;
    /** Drain for a no-visible-output check without promoting an incomplete tool opener to prose. */
    flushForVisibleOutputCheck?(): string;
    isSuppressing(): boolean;
    hasPendingCandidate(): boolean;
    stats(): ArtifactTextSuppressorStats;
}
interface CompletionTextSuppressor extends ArtifactTextSuppressor {
    flushForVisibleOutputCheck(): string;
}
export interface ArtifactTextSuppressorStats {
    suppressedChars: number;
    suppressedChunks: number;
    openedBlocks: number;
    closedBlocks: number;
    pendingCandidateChars: number;
    suppressing: boolean;
}
export declare function createDsmlArtifactTextSuppressor(): ArtifactTextSuppressor;
export declare function createToolCallTextSuppressor(): CompletionTextSuppressor;
/**
 * Removes the proprietary DSML closing sequence only when it is the final
 * suffix of otherwise visible text. The ordered three-tag requirement keeps
 * literal XML/Markdown examples intact while repairing already-persisted AMR
 * output that predates the streaming suppressor.
 */
export declare function scrubDsmlToolProtocolTail(text: string): string;
export declare function emitWithTextSuppressor(suppressor: ArtifactTextSuppressor, onEvent: EventSink, text: string): boolean;
export {};
