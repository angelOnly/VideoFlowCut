import type Database from 'better-sqlite3';
import type { MediaTaskRow, MediaTaskStatus } from './tasks.js';
export interface LiveMediaTask {
    id: string;
    projectId: string;
    runId?: string | undefined;
    status: MediaTaskStatus;
    surface?: string | undefined;
    model?: string | undefined;
    progress: string[];
    file: unknown | null;
    error: MediaTaskRow['error'];
    startedAt: number;
    endedAt: number | null;
    waiters: Set<() => void>;
    _gcScheduled?: boolean;
}
export interface CreateMediaTaskInfo {
    surface?: string | undefined;
    model?: string | undefined;
    runId?: string | undefined;
}
export interface MediaTaskStoreOptions {
    isRunActive?: ((runId: string) => boolean) | undefined;
}
export interface MediaTaskSnapshot {
    taskId: string;
    status: MediaTaskStatus;
    startedAt: number;
    endedAt: number | null;
    progress: string[];
    nextSince: number;
    file?: unknown | null;
    error?: MediaTaskRow['error'];
}
export declare const TASK_TTL_AFTER_DONE_MS: number;
export declare function createMediaTaskStore(db: Database.Database, options?: MediaTaskStoreOptions): {
    mediaTasks: Map<string, LiveMediaTask>;
    hydrateMediaTask(row: MediaTaskRow): LiveMediaTask;
    getLiveMediaTask(taskId: string): LiveMediaTask | null;
    createMediaTask(taskId: string, projectId: string, info?: CreateMediaTaskInfo): LiveMediaTask;
    persistMediaTask(task: LiveMediaTask): void;
    appendTaskProgress(task: LiveMediaTask, line: string): void;
    notifyTaskWaiters(task: LiveMediaTask): void;
    mediaTaskSnapshot(task: LiveMediaTask, since?: number): MediaTaskSnapshot;
};
