export type RoutineRunStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled';
export type RoutineRunTrigger = 'manual' | 'scheduled';
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type RoutineSchedule = {
    kind: 'hourly';
    minute: number;
} | {
    kind: 'daily';
    time: string;
    timezone: string;
} | {
    kind: 'weekdays';
    time: string;
    timezone: string;
} | {
    kind: 'weekly';
    time: string;
    timezone: string;
    weekday: Weekday;
};
export type RoutineProjectTarget = {
    mode: 'create_each_run';
} | {
    mode: 'reuse';
    projectId: string;
};
export interface RoutineContextSelection {
    skillIds?: string[];
    pluginIds?: string[];
    mcpServerIds?: string[];
    connectorIds?: string[];
    workspaceScope?: {
        workspaceId: string;
        workspaceMemberId: string;
    } | null;
}
export interface Routine {
    id: string;
    name: string;
    prompt: string;
    schedule: RoutineSchedule;
    target: RoutineProjectTarget;
    skillId: string | null;
    agentId: string | null;
    context: RoutineContextSelection;
    enabled: boolean;
    nextRunAt: number | null;
    lastRun: unknown;
    createdAt: number;
    updatedAt: number;
}
export interface RoutineRun {
    id: string;
    routineId: string;
    trigger: RoutineRunTrigger;
    status: RoutineRunStatus;
    projectId: string;
    conversationId: string;
    agentRunId: string;
    startedAt: number;
    completedAt: number | null;
    summary: string | null;
    error: string | null;
    errorCode: string | null;
}
export interface RoutineRunHandlerStart {
    projectId: string;
    conversationId: string;
    agentRunId: string;
    completion: Promise<RoutineRunCompletion>;
    prepare?: (run: RoutineRun) => void | Promise<void>;
    start?: () => void;
    discard?: () => void;
    discardUnstarted?: () => void;
}
export interface RoutineRunCompletion {
    status: RoutineRunStatus;
    summary?: string;
    error?: string;
    errorCode?: string | null;
}
export type RoutineRunHandler = (input: {
    routine: Routine;
    trigger: RoutineRunTrigger;
    startedAt: number;
    runId: string;
}) => Promise<RoutineRunHandlerStart>;
export interface RoutinePersistence {
    list(): Routine[];
    insertRun(run: RoutineRun, options?: {
        scheduledSlotAt?: number;
    }): boolean | void;
    updateRun(id: string, patch: Partial<RoutineRun>): void;
    getLatestRun(routineId: string): RoutineRun | null;
}
export declare function nextHourlyRunAt(minute: number, now?: Date): Date;
export declare function nextRunAtForSchedule(schedule: RoutineSchedule, now?: Date): Date | null;
export declare function isValidWallTime(time: string): boolean;
export declare function isValidTimezone(tz: string): boolean;
export declare function validateSchedule(schedule: RoutineSchedule): void;
export declare function validateTarget(target: RoutineProjectTarget): void;
export declare class RoutineService {
    private readonly persistence;
    private timers;
    private inflight;
    private runHandler;
    private started;
    constructor(persistence: RoutinePersistence);
    setRunHandler(handler: RoutineRunHandler): void;
    start(): void;
    stop(): void;
    rescheduleAll(): void;
    rescheduleOne(routineId: string): void;
    unschedule(routineId: string): void;
    private scheduleRoutine;
    private retryScheduledSlot;
    private scheduleRoutineAt;
    nextRunAt(routineId: string): Date | null;
    runNow(routineId: string): Promise<RoutineRunHandlerStart>;
    private start_;
}
