export declare const STANDALONE_FEEDBACK_SCHEMA: 1;
export type StandaloneFeedbackPhase = "channel-discovery" | "metadata-verification" | "sync-planning" | "blob-resolution" | "blob-download" | "blob-verification" | "blob-materialization" | "sync-ready" | "generation-prepared" | "closure-starting" | "closure-ready" | "rollback" | "failure";
export type StandaloneFeedbackEvent = Readonly<{
    schemaVersion: typeof STANDALONE_FEEDBACK_SCHEMA;
    operationId: string;
    sequence: number;
    phase: StandaloneFeedbackPhase;
    state: "begin" | "progress" | "reused" | "complete" | "failed";
    channel: string;
    namespace: string;
    generationId?: string;
    resourceId?: string;
    blobSha256?: string;
    source?: "cas" | "shell" | "seed" | "remote";
    receivedBytes?: number;
    totalBytes?: number;
    error?: Readonly<{
        code: string;
        message: string;
    }>;
}>;
export type StandaloneFeedbackHandler = (event: StandaloneFeedbackEvent) => void | Promise<void>;
/**
 * Feedback is an observation surface, never lifecycle authority. A failed UI,
 * renderer, or terminal sink must not corrupt preparation or activation.
 */
export declare class StandaloneFeedbackEmitter {
    private readonly operationId;
    private readonly scope;
    private readonly handler?;
    private sequence;
    constructor(operationId: string, scope: Readonly<{
        channel: string;
        namespace: string;
    }>, handler?: StandaloneFeedbackHandler | undefined);
    emit(event: Omit<StandaloneFeedbackEvent, "schemaVersion" | "operationId" | "sequence" | "channel" | "namespace">): void;
}
//# sourceMappingURL=feedback.d.ts.map