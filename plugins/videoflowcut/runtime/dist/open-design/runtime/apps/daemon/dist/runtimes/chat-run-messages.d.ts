import type Database from 'better-sqlite3';
import type { PersistedAgentEvent } from '@open-design/contracts';
import type { RunFinishedProps } from '@open-design/contracts/analytics';
type SqliteDb = Database.Database;
type ChatRunMessageState = {
    id: string;
    assistantMessageId?: string | null;
    conversationId?: string | null;
    agentId?: string | null;
    status?: string;
    createdAt?: number;
    sessionMode?: string | null;
    context?: Record<string, unknown> | null;
    error?: string | null;
    errorCode?: string | null;
    failureCategory?: string | null;
    failureDetail?: string | null;
    failureAction?: string | null;
    retryable?: boolean | null;
};
export type RunMessageEventPersistenceTelemetry = {
    storageMode: 'append_only';
    inputEventCount: number;
    deltaEventCount: number;
    inputCharCount: number;
    flushCount: number;
    batchEventCount: number;
    persistedEventCount: number;
    flushTotalMs: number;
    flushMaxMs: number;
    pendingCharPeak: number;
    finalizeCount: number;
    finalizeTotalMs: number;
    finalizeMaxMs: number;
    finalEventCount: number;
    persistenceErrorCount: number;
};
type RunMessageEventPersistenceAnalytics = Pick<RunFinishedProps, 'message_event_storage_mode' | 'message_event_input_count' | 'message_event_delta_count' | 'message_event_input_char_count' | 'message_event_flush_count' | 'message_event_batch_event_count' | 'message_event_persisted_count' | 'message_event_flush_total_ms' | 'message_event_flush_max_ms' | 'message_event_pending_char_peak' | 'message_event_finalize_count' | 'message_event_finalize_total_ms' | 'message_event_finalize_max_ms' | 'message_event_final_event_count' | 'message_event_persistence_error_count'>;
export declare const RUN_MESSAGE_EVENT_FLUSH_INTERVAL_MS = 250;
export declare function readRunMessageEventPersistenceTelemetry(run: ChatRunMessageState): RunMessageEventPersistenceTelemetry | null;
export declare function runMessageEventPersistenceAnalytics(run: ChatRunMessageState): RunMessageEventPersistenceAnalytics | Record<string, never>;
/** In-process event shape counters; absent after a daemon restart, never 0-filled. */
export declare function runEventStorageShapeAnalytics(run: ChatRunMessageState): Pick<RunFinishedProps, 'storage_largest_event_chars' | 'storage_largest_event_kind' | 'storage_truncated_event_count' | 'storage_truncated_original_bytes'>;
export declare function persistRunEventToAssistantMessage(db: SqliteDb, run: ChatRunMessageState, event: string, data: unknown): void;
export declare function flushRunMessageEvents(run: ChatRunMessageState): void;
export declare function finalizeRunMessageEvents(db: SqliteDb, run: ChatRunMessageState): void;
/**
 * Stamp the daemon's finalize-time failure classification onto the persisted
 * assistant message so a reload — or any consumer that reads the stored
 * message instead of the live SSE stream — still sees the fine-grained cause.
 *
 * The `error` SSE frame is emitted from the child-close handler BEFORE the run
 * is finalized, so `failureCategory` / `failureDetail` (computed at finalize)
 * aren't known when that frame is first persisted. This enriches the last
 * persisted `status:error` event in place once the classification exists, and
 * appends one only if a failed run somehow never persisted an error frame.
 * Without this, a daemon-persisted failure (no live web error handler saving
 * the message, or a conversation reloaded before that save) falls back to the
 * coarse `errorCode` UI and loses the specific fix guidance.
 */
export declare function persistRunFailureClassification(db: SqliteDb, run: ChatRunMessageState): void;
/**
 * The persisted form of one SSE run event, or `null` when the event is
 * live-only. Always within the per-event storage budget
 * (`boundPersistedAgentEvent`): this is where every run event enters the
 * pending batch, so an oversized tool payload is never held, flushed or
 * folded at full size.
 */
export declare function runSseEventToPersistedAgentEvent(event: string, data: unknown): PersistedAgentEvent | null;
/** The persisted form of one `agent` SSE payload, within the storage budget. */
export declare function daemonAgentPayloadToPersistedAgentEvent(data: unknown): PersistedAgentEvent | null;
export declare function pinAssistantMessageOnRunCreate(db: SqliteDb, run: ChatRunMessageState, opts?: {
    status?: string;
    beforeFreshInsert?: () => void;
    beforeClaimCommit?: () => void;
    isRunActive?: (runId: string) => boolean;
}): {
    ok: boolean;
    reason?: 'active' | 'scope';
};
export {};
