function parsePluginShareCliPayload(value) {
    if (!value)
        return null;
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object')
        return null;
    return parsed;
}
const TASK_TTL_AFTER_DONE_MS = 10 * 60 * 1000;
const PLUGIN_SHARE_TERMINAL_STATUSES = new Set(['done', 'failed']);
function pluginShareActionToCli(action) {
    if (action === 'publish-github') {
        return {
            argv: ['plugin', 'publish-repo'],
            title: 'Publish repo',
            command: 'od plugin publish-repo',
            successMessage: 'Published plugin to GitHub.',
            failureCode: 'publish-repo-failed',
        };
    }
    return {
        argv: ['plugin', 'open-design-pr'],
        title: 'OpenDesign PR',
        command: 'od plugin open-design-pr',
        successMessage: 'Opened OpenDesign PR flow.',
        failureCode: 'open-design-pr-failed',
    };
}
function pluginShareProgressPlan(action) {
    if (action === 'publish-github') {
        return [
            'Resolve GitHub owner and validate plugin metadata',
            'Create or update the GitHub repository',
            'Push plugin files',
            'Return the repository URL',
        ];
    }
    return [
        'Ensure the OpenDesign fork exists',
        'Clone the fork and prepare a branch',
        'Copy the plugin into plugins/community',
        'Push the branch and open the PR form',
    ];
}
export function createPluginShareTaskStore(deps) {
    const pluginShareTasks = new Map();
    function create(taskId, projectId, info = {}) {
        const task = {
            id: taskId,
            projectId,
            status: 'queued',
            action: info.action,
            path: info.path,
            progress: [],
            result: null,
            error: null,
            startedAt: Date.now(),
            endedAt: null,
            waiters: new Set(),
        };
        pluginShareTasks.set(taskId, task);
        return task;
    }
    function get(taskId) {
        return pluginShareTasks.get(taskId) ?? null;
    }
    function appendProgress(task, line) {
        task.progress.push(String(line ?? ''));
        notify(task);
    }
    function snapshot(task, since = 0) {
        const out = {
            taskId: task.id,
            action: task.action,
            path: task.path,
            status: task.status,
            startedAt: task.startedAt,
            endedAt: task.endedAt,
            progress: task.progress.slice(since),
            nextSince: task.progress.length,
        };
        if (task.status === 'done')
            out.result = task.result;
        if (task.status === 'failed')
            out.error = task.error;
        return out;
    }
    function notify(task) {
        const wakers = Array.from(task.waiters);
        for (const w of wakers) {
            try {
                w();
            }
            catch { }
        }
        if (PLUGIN_SHARE_TERMINAL_STATUSES.has(task.status) && !task._gcScheduled) {
            task._gcScheduled = true;
            setTimeout(() => {
                if (task.waiters.size === 0)
                    pluginShareTasks.delete(task.id);
            }, TASK_TTL_AFTER_DONE_MS).unref?.();
        }
    }
    async function run(task, folder) {
        const action = task.action ?? 'publish-github';
        const share = pluginShareActionToCli(action);
        appendProgress(task, `${share.title} started for ${task.path}`);
        appendProgress(task, `$ ${share.command} ${task.path}`);
        for (const step of pluginShareProgressPlan(action))
            appendProgress(task, `- ${step}`);
        const result = await deps.execCommandViaLoginShell(deps.OD_NODE_BIN, [deps.OD_BIN, ...share.argv, folder, '--json'], { timeout: action === 'publish-github' ? 240_000 : 300_000 });
        let payload = null;
        try {
            payload = parsePluginShareCliPayload(result.stdout);
        }
        catch (error) {
            appendProgress(task, `Failed to parse CLI JSON output: ${error instanceof Error ? error.message : String(error)}`);
        }
        const stepLog = payload?.steps?.map((step) => step.stderr || step.stdout || step.command).filter(Boolean) ?? [];
        for (const line of stepLog)
            appendProgress(task, String(line).trim());
        if (!result.ok || !payload?.ok) {
            task.status = 'failed';
            task.error = {
                code: payload?.error?.label || share.failureCode,
                message: payload?.error?.stderr || payload?.error?.stdout || result.stderr || result.stdout || `${share.title} failed.`,
                log: stepLog.length > 0 ? stepLog : [result.stderr || result.stdout || `${share.command} failed`],
            };
            task.endedAt = Date.now();
            notify(task);
            return;
        }
        const url = payload.repoUrl || payload.prUrl || undefined;
        task.status = 'done';
        task.result = {
            message: url
                ? (action === 'publish-github' ? `Published plugin to ${url}.` : `Opened OpenDesign PR flow at ${url}.`)
                : share.successMessage,
            ...(url ? { url } : {}),
            log: stepLog,
        };
        task.endedAt = Date.now();
        notify(task);
    }
    function createAndStart(projectId, info, folder) {
        const taskId = deps.randomUUID();
        const task = create(taskId, projectId, info);
        task.status = 'running';
        notify(task);
        void run(task, folder).catch((err) => {
            task.status = 'failed';
            task.error = {
                code: 'plugin-share-task-failed',
                message: err instanceof Error ? err.message : String(err),
                log: [err instanceof Error ? String(err.stack || err.message) : String(err)],
            };
            task.endedAt = Date.now();
            notify(task);
        });
        return task;
    }
    return { create, get, appendProgress, snapshot, notify, run, createAndStart };
}
//# sourceMappingURL=plugin-share-tasks.js.map