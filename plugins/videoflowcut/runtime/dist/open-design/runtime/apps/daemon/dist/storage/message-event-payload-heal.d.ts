/**
 * I3 — Existing oversized run-event rows are healed once.
 *
 * Before the run-event payload budget (`runtimes/run-event-payload-budget.ts`)
 * the daemon stored agent tool lines verbatim; a long cursor-agent
 * conversation reached ~1.4 MB per turn in `messages.events_json` and
 * `message_event_batches`. The writer is bounded now, but those rows are still
 * on disk, and every conversation read has to bound them again until they are
 * rewritten. This pass rewrites them with the same budget, once:
 *
 * - started after the daemon is listening, never on a request path;
 * - ONE row per transaction (`healOversizedMessageEvents` /
 *   `healOversizedMessageEventBatch` in `db.ts`), streaming each row's events
 *   out of SQLite one element at a time — never a whole conversation, never a
 *   whole event log in JS;
 * - yields to the event loop between rows, so request handling interleaves;
 * - skips rows whose run is still queued/running (their writer owns them);
 * - idempotent: an already-bounded row is not rewritten, and once a pass has
 *   covered every row without skipping any, a completion marker stops later
 *   starts from rescanning. Dying mid-way is safe — each row is either as it
 *   was or fully healed, and the next start resumes.
 */
import type Database from 'better-sqlite3';
/** Completion-marker name; bump the suffix if the budget ever tightens. */
export declare const MESSAGE_EVENT_PAYLOAD_HEAL_PASS = "run-event-payload-budget-v1";
export interface MessageEventPayloadHealReport {
    /** A previous pass already completed; nothing was scanned. */
    alreadyCompleted: boolean;
    /** Every candidate row was examined and none had to be skipped or failed. */
    completed: boolean;
    messagesExamined: number;
    messagesRewritten: number;
    batchesExamined: number;
    batchesRewritten: number;
    /** Rows (messages or batches) left alone because their run is still active. */
    skippedActive: number;
    /** Rows whose stored events are not a JSON array; nothing to heal safely. */
    skippedMalformed: number;
    errors: number;
    /** UTF-8 bytes of the rewritten rows before and after. */
    bytesBefore: number;
    bytesAfter: number;
}
export interface MessageEventPayloadHealOptions {
    db: Database.Database;
    /** Rescan even when a completed pass is on record (tests, diagnostics). */
    ignoreCompletionMarker?: boolean;
    /** Checked between rows; returning true ends the pass early (incomplete). */
    shouldStop?: () => boolean;
    /** Called after each row that was rewritten. */
    onRowHealed?: (row: {
        table: 'messages' | 'message_event_batches';
        bytesBefore: number;
        bytesAfter: number;
    }) => void;
    logger?: (message: string) => void;
}
/** One full pass over messages, then batches. Resolves with what it did. */
export declare function runMessageEventPayloadHealPass(options: MessageEventPayloadHealOptions): Promise<MessageEventPayloadHealReport>;
export interface MessageEventPayloadHealHandle {
    /** Ends the pass at the next row boundary and waits for it to settle. */
    stop(): Promise<void>;
}
/** Start one background pass. Failures are logged, never thrown. */
export declare function startMessageEventPayloadHeal(options: {
    db: Database.Database;
    logger?: (message: string) => void;
}): MessageEventPayloadHealHandle;
