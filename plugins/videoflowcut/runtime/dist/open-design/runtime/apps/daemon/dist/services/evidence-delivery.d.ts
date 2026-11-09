import { TelemetryOutbox } from '../storage/telemetry-outbox.js';
import { type FeedbackReportContext, type ReportContext } from '../langfuse-trace.js';
import { type TraceObjectSource, type TraceObjectUploadManifests } from '../trace-object-manifest.js';
import { type AttachmentContextEntry } from '../observability/eval-context.js';
export declare function evidenceStore(dataDir: string): Promise<TelemetryOutbox>;
export declare function enqueueObjectEvidence(dataDir: string, context: ReportContext, sources: TraceObjectSource[], taskTraceId?: string): Promise<"capacity_exceeded" | "existing" | "not_required" | "queued">;
/** A Task owns the trace; this queue owns only its original physical-Run objects. */
export declare function readObjectEvidence(dataDir: string, runId: string): Promise<{
    sources: {
        redacted?: boolean;
        sourcePathHash?: string;
        objectClass: "artifact" | "attachment" | "input_text_snapshot";
        id: string;
        filename: string;
        mime: string;
        type?: string;
        sizeBytes?: number;
        reason?: string;
        source: string;
        truncated?: boolean;
        body?: Buffer<ArrayBufferLike>;
    }[];
    capturedAt: string;
    uploaded: TraceObjectUploadManifests | undefined;
} | undefined>;
/** Reuse only unambiguous, integrity-checked bytes from this project's exact conversation. */
export declare function inheritFrozenAttachments(dataDir: string, context: {
    projectId: string;
    conversationId: string;
    runId: string;
}, entries: AttachmentContextEntry[], sources: TraceObjectSource[]): Promise<TraceObjectSource[]>;
export declare function enqueueFeedbackEvidence(dataDir: string, context: FeedbackReportContext): Promise<"capacity_exceeded" | "existing" | "queued">;
/** All Task publishers share the same clearing history because the receiver deep-merges maps. */
export declare function reconcileTaskObjectReasons(store: TelemetryOutbox, taskTraceId: string, metadata: Record<string, unknown>): void;
/** Preserve acknowledged objects while retrying only the unacknowledged siblings. */
export declare function mergeObjectUploadReceipts(previous: TraceObjectUploadManifests | undefined, next: TraceObjectUploadManifests): TraceObjectUploadManifests;
export declare const taskObjectDeliveryEnabled: (mode: string | undefined) => boolean;
export declare function drainEvidence(dataDir: string, fetchImpl?: typeof fetch): Promise<void>;
/** Startup recovery runs outside product requests. Off/observe never open or drain the queue. */
export declare function startEvidenceDelivery(dataDir: string): () => void;
