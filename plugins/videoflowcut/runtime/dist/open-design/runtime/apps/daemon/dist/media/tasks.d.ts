import type Database from 'better-sqlite3';
import { type MediaFailureNextStep } from '@open-design/contracts';
export type MediaTaskStatus = 'queued' | 'running' | 'done' | 'failed' | 'interrupted';
/** What a content-safety policy objected to, when the supplier proved it. */
export type MediaTaskErrorSubject = 'prompt' | 'input_image' | 'output_image';
export interface MediaTaskError {
    message: string;
    status?: number;
    code?: string;
    /**
     * Optional hint about what a content-safety policy objected to, forwarded
     * only when the upstream supplier proved it. Absent means "not proven", not
     * "not applicable" — a client must then name both the prompt and the
     * reference images rather than blame one of them.
     */
    subject?: MediaTaskErrorSubject;
    /**
     * Whether repeating the identical request could plausibly behave
     * differently. Undefined means the producer did not say; only an explicit
     * `false` licenses telling a user that retrying is pointless.
     */
    retryable?: boolean;
    /**
     * What the reader should do next. This is the field a user-facing sentence
     * and an agent's retry decision are both built from -- `code` names the
     * failure, `nextStep` answers it.
     */
    nextStep?: MediaFailureNextStep;
}
export interface MediaTaskRow {
    id: string;
    projectId: string;
    /**
     * Monotonic creation order (SQLite's rowid). Only the ordering it induces is
     * meaningful — never persist or display the value. It exists because
     * `started_at` ties on every parallel fan-out, and a tie broken by storage
     * order lets a batch's cells swap places between two reads.
     */
    sequence: number;
    runId?: string;
    status: MediaTaskStatus;
    surface?: string;
    model?: string;
    progress: string[];
    file: unknown | null;
    error: MediaTaskError | null;
    startedAt: number;
    endedAt: number | null;
    createdAt: number;
    updatedAt: number;
}
export interface MediaTaskInsert {
    id: string;
    projectId: string;
    runId?: string;
    status?: MediaTaskStatus;
    surface?: string;
    model?: string;
    progress?: string[];
    file?: unknown | null;
    error?: MediaTaskError | null;
    startedAt?: number;
    endedAt?: number | null;
    createdAt?: number;
    updatedAt?: number;
}
export interface MediaTaskPatch {
    runId?: string | null;
    status?: MediaTaskStatus;
    surface?: string | null;
    model?: string | null;
    progress?: string[];
    file?: unknown | null;
    error?: MediaTaskError | null;
    startedAt?: number;
    endedAt?: number | null;
    updatedAt?: number;
}
export declare function migrateMediaTasks(db: Database.Database): void;
export declare function insertMediaTask(db: Database.Database, input: MediaTaskInsert): MediaTaskRow;
export declare function getMediaTask(db: Database.Database, id: string): MediaTaskRow | null;
export declare function updateMediaTask(db: Database.Database, id: string, patch: MediaTaskPatch): MediaTaskRow | null;
export declare function listMediaTasksByProject(db: Database.Database, projectId: string, options?: {
    includeTerminal?: boolean;
}): MediaTaskRow[];
export declare function listRecentMediaTasks(db: Database.Database, options: {
    terminalTtlMs: number;
    now?: number;
}): MediaTaskRow[];
export declare function deleteMediaTask(db: Database.Database, id: string): void;
export declare function reconcileMediaTasksOnBoot(db: Database.Database, options: {
    terminalTtlMs: number;
    now?: number;
}): {
    interrupted: number;
    deleted: number;
};
