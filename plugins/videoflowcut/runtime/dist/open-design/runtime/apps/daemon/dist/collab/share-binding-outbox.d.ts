import type Database from 'better-sqlite3';
import type { SharePublishReceipt, SharePublishResult } from '@open-design/contracts';
export interface ShareBindingIntent {
    resourceTeamId: string;
    ownerMemberId: string;
    resourceId: string;
    projectId: string;
    publicationRevision: string;
    receipt: SharePublishReceipt;
}
export interface ShareBindingTask extends ShareBindingIntent {
    id: number;
    failureCount: number;
}
export interface ShareBindingOutbox {
    enqueue(intent: ShareBindingIntent): ShareBindingTask;
    list(): ShareBindingTask[];
    fail(task: ShareBindingTask): void;
    complete(task: ShareBindingTask): void;
}
/** Validate and copy only the public, confirmed immutable publication fields. */
export declare function confirmedReceipt(value: SharePublishReceipt): SharePublishReceipt;
/** Binding-only outbox. No project FK and no credentials: survives local deletion.
 * Each immutable publication generation has its own task, never a stop intent.
 * A consumer must verify current generation and original identity before sending.
 */
export declare function createShareBindingOutbox(db: Database.Database): ShareBindingOutbox;
/** Use only after server-confirmed content publication and failed binding.
 * Availability is explicit: storage alone is not an automatic retry mechanism.
 */
export declare function recordPendingShareBinding(outbox: ShareBindingOutbox, intent: ShareBindingIntent, retryAvailable?: boolean, propagateStorageFailure?: boolean): SharePublishResult;
