import type Database from 'better-sqlite3';
import { type StrategyTaskExecutionRecord } from '../task-store.js';
export declare class StrategyHandoffError extends Error {
    readonly status: number;
    readonly code: string;
    constructor(status: number, code: string, message: string);
}
/**
 * Whether a Run still owns its conversation, so a follow-up has to wait for it.
 *
 * A Run the user already asked to stop does not. Stopping answers only after the
 * agent process exits, while the Web client sends its next message (Stop, or
 * "send now" on a queued message) as soon as the stop is requested. Counting the
 * draining Run would refuse exactly the message the user stopped it for.
 */
export declare function holdsConversation(run: {
    status: string;
    cancelRequested?: boolean;
}): boolean;
/** Host records select context; the agent interprets the latest user request. */
export declare function resolveStrategyHandoff(db: Database.Database, input: {
    projectId?: unknown;
    conversationId?: unknown;
    taskExecutionId?: unknown;
    clientRequestId?: unknown;
    pluginId?: unknown;
    appliedPluginSnapshotId?: unknown;
}, runs: readonly {
    id: string;
    status: string;
    clientRequestId?: string | null;
    cancelRequested?: boolean;
}[]): StrategyTaskExecutionRecord | null;
export declare function strategyHandoffTranscript(db: Database.Database, task: StrategyTaskExecutionRecord): string;
