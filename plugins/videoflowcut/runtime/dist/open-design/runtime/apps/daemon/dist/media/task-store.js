import { deleteMediaTask, getMediaTask, insertMediaTask, updateMediaTask, } from './tasks.js';
// Terminal tasks receive a bounded cleanup sweep. Tasks owned by an active run
// are retained and reconsidered on the next sweep so a sliding tool token can
// never outlive its pollable result.
export const TASK_TTL_AFTER_DONE_MS = 60 * 60 * 1000;
const MEDIA_TERMINAL_STATUSES = new Set(['done', 'failed', 'interrupted']);
export function createMediaTaskStore(db, options = {}) {
    const mediaTasks = new Map();
    function hydrateMediaTask(row) {
        const task = {
            id: row.id,
            projectId: row.projectId,
            runId: row.runId,
            status: row.status,
            surface: row.surface,
            model: row.model,
            progress: Array.isArray(row.progress) ? row.progress.slice() : [],
            file: row.file ?? null,
            error: row.error ?? null,
            startedAt: row.startedAt,
            endedAt: row.endedAt,
            waiters: new Set(),
        };
        mediaTasks.set(task.id, task);
        return task;
    }
    function getLiveMediaTask(taskId) {
        const cached = mediaTasks.get(taskId);
        if (cached)
            return cached;
        const row = getMediaTask(db, taskId);
        return row ? hydrateMediaTask(row) : null;
    }
    function createMediaTask(taskId, projectId, info = {}) {
        const task = {
            id: taskId,
            projectId,
            runId: info.runId,
            status: 'queued',
            surface: info.surface,
            model: info.model,
            progress: [],
            file: null,
            error: null,
            startedAt: Date.now(),
            endedAt: null,
            waiters: new Set(),
        };
        mediaTasks.set(taskId, task);
        const insert = {
            id: taskId,
            projectId,
            ...(task.runId !== undefined ? { runId: task.runId } : {}),
            status: task.status,
            progress: task.progress,
            file: task.file,
            error: task.error,
            startedAt: task.startedAt,
            endedAt: task.endedAt,
            ...(task.surface !== undefined ? { surface: task.surface } : {}),
            ...(task.model !== undefined ? { model: task.model } : {}),
        };
        insertMediaTask(db, insert);
        return task;
    }
    function persistMediaTask(task) {
        const patch = {
            ...(task.runId !== undefined ? { runId: task.runId } : {}),
            status: task.status,
            progress: task.progress,
            file: task.file,
            error: task.error,
            startedAt: task.startedAt,
            endedAt: task.endedAt,
            ...(task.surface !== undefined ? { surface: task.surface } : {}),
            ...(task.model !== undefined ? { model: task.model } : {}),
        };
        updateMediaTask(db, task.id, patch);
    }
    function appendTaskProgress(task, line) {
        task.progress.push(line);
        persistMediaTask(task);
        notifyTaskWaiters(task);
    }
    function notifyTaskWaiters(task) {
        const wakers = Array.from(task.waiters);
        for (const w of wakers) {
            try {
                w();
            }
            catch {
                // Never let one bad waiter block the rest.
            }
        }
        if (MEDIA_TERMINAL_STATUSES.has(task.status) &&
            !task._gcScheduled) {
            task._gcScheduled = true;
            scheduleTerminalTaskGc(task);
        }
    }
    function scheduleTerminalTaskGc(task) {
        setTimeout(() => {
            if (task.waiters.size > 0
                || (task.runId && options.isRunActive?.(task.runId) === true)) {
                scheduleTerminalTaskGc(task);
                return;
            }
            mediaTasks.delete(task.id);
            deleteMediaTask(db, task.id);
        }, TASK_TTL_AFTER_DONE_MS).unref?.();
    }
    function mediaTaskSnapshot(task, since = 0) {
        const snapshot = {
            taskId: task.id,
            status: task.status,
            startedAt: task.startedAt,
            endedAt: task.endedAt,
            progress: task.progress.slice(since),
            nextSince: task.progress.length,
        };
        if (task.status === 'done')
            snapshot.file = task.file;
        if (task.status === 'failed' || task.status === 'interrupted') {
            snapshot.error = task.error;
        }
        return snapshot;
    }
    return {
        mediaTasks,
        hydrateMediaTask,
        getLiveMediaTask,
        createMediaTask,
        persistMediaTask,
        appendTaskProgress,
        notifyTaskWaiters,
        mediaTaskSnapshot,
    };
}
//# sourceMappingURL=task-store.js.map