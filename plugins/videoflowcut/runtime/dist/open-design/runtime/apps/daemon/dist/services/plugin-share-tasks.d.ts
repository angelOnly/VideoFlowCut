import type { randomUUID } from 'node:crypto';
export type PluginShareAction = 'publish-github' | 'contribute-open-design';
export interface PluginShareTask {
    id: string;
    projectId: string;
    status: 'queued' | 'running' | 'done' | 'failed';
    action: PluginShareAction | undefined;
    path: string | undefined;
    progress: string[];
    result: unknown;
    error: unknown;
    startedAt: number;
    endedAt: number | null;
    waiters: Set<() => void>;
    _gcScheduled?: boolean;
}
export interface CreatePluginShareTaskInfo {
    action?: PluginShareAction;
    path?: string;
}
export interface CreatePluginShareTaskStoreDeps {
    randomUUID: typeof randomUUID;
    execCommandViaLoginShell: (command: string, args: string[], opts?: Record<string, unknown>) => Promise<ExecCommandResult>;
    OD_NODE_BIN: string;
    OD_BIN: string;
}
interface ExecCommandResult {
    ok: boolean;
    stdout?: string;
    stderr?: string;
}
export declare function createPluginShareTaskStore(deps: CreatePluginShareTaskStoreDeps): {
    create: (taskId: string, projectId: string, info?: CreatePluginShareTaskInfo) => PluginShareTask;
    get: (taskId: string) => PluginShareTask | null;
    appendProgress: (task: PluginShareTask, line: unknown) => void;
    snapshot: (task: PluginShareTask, since?: number) => Record<string, unknown>;
    notify: (task: PluginShareTask) => void;
    run: (task: PluginShareTask, folder: string) => Promise<void>;
    createAndStart: (projectId: string, info: CreatePluginShareTaskInfo, folder: string) => PluginShareTask;
};
export {};
