import type { AutomationSourceIngestionResponse } from './automations.js';
import type { RunContextSelection } from './context.js';
import type { AutomationWorkspaceScope } from './app-config.js';
export type RoutineScheduleKind = 'hourly' | 'daily' | 'weekdays' | 'weekly';
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export interface RoutineHourlySchedule {
    kind: 'hourly';
    minute: number;
}
export interface RoutineDailySchedule {
    kind: 'daily';
    time: string;
    timezone: string;
}
export interface RoutineWeekdaysSchedule {
    kind: 'weekdays';
    time: string;
    timezone: string;
}
export interface RoutineWeeklySchedule {
    kind: 'weekly';
    time: string;
    timezone: string;
    weekday: Weekday;
}
export type RoutineSchedule = RoutineHourlySchedule | RoutineDailySchedule | RoutineWeekdaysSchedule | RoutineWeeklySchedule;
export type RoutineProjectMode = 'create_each_run' | 'reuse';
export interface RoutineCreateEachRunTarget {
    mode: 'create_each_run';
}
export interface RoutineReuseProjectTarget {
    mode: 'reuse';
    projectId: string;
}
export type RoutineProjectTarget = RoutineCreateEachRunTarget | RoutineReuseProjectTarget;
export type RoutineRunStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled';
export type RoutineRunTrigger = 'manual' | 'scheduled';
export interface RoutineLastRunSummary {
    runId: string;
    status: RoutineRunStatus;
    trigger: RoutineRunTrigger;
    startedAt: number;
    completedAt?: number;
    projectId: string;
    conversationId: string;
    agentRunId: string;
    summary?: string;
    error?: string;
    errorCode?: string;
}
export interface Routine {
    id: string;
    name: string;
    prompt: string;
    schedule: RoutineSchedule;
    target: RoutineProjectTarget;
    skillId: string | null;
    agentId: string | null;
    context?: RoutineContextSelection;
    enabled: boolean;
    nextRunAt: number | null;
    lastRun: RoutineLastRunSummary | null;
    createdAt: number;
    updatedAt: number;
}
export interface RoutineContextSelection extends RunContextSelection {
    /**
     * Persisted only for create_each_run. Reuse routines derive their Workspace
     * from the target project's binding instead of this field.
     */
    workspaceScope?: AutomationWorkspaceScope | null;
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
export interface CreateRoutineRequest {
    name: string;
    prompt: string;
    schedule: RoutineSchedule;
    target: RoutineProjectTarget;
    skillId?: string | null;
    agentId?: string | null;
    context?: RoutineContextSelection;
    enabled?: boolean;
}
export interface UpdateRoutineRequest {
    name?: string;
    prompt?: string;
    schedule?: RoutineSchedule;
    target?: RoutineProjectTarget;
    skillId?: string | null;
    agentId?: string | null;
    context?: RoutineContextSelection;
    enabled?: boolean;
}
export interface RoutinesResponse {
    routines: Routine[];
}
export interface RoutineResponse {
    routine: Routine;
}
export interface RoutineRunResponse {
    routine: Routine;
    run: RoutineRun;
}
export interface RoutineRunsResponse {
    runs: RoutineRun[];
}
export interface RoutineRunCrystallizeResponse extends AutomationSourceIngestionResponse {
    routineId: string;
    runId: string;
}
//# sourceMappingURL=routines.d.ts.map