import type { Express } from 'express';
import { type RoutineService } from '../routines.js';
import type { PathDeps, RouteDeps } from '../server-context.js';
export interface RegisterRoutineRoutesDeps extends RouteDeps<'db' | 'routines'> {
    paths: Pick<PathDeps, 'RUNTIME_DATA_DIR'>;
}
export type RoutineRoutesService = Pick<RoutineService, 'nextRunAt' | 'rescheduleOne' | 'runNow' | 'unschedule'>;
export declare function routineDbRowToContract(row: any, latestRun: any): {
    id: any;
    name: any;
    prompt: any;
    schedule: any;
    target: {
        mode: string;
        projectId: any;
    } | {
        projectId?: never;
        mode: string;
    };
    skillId: any;
    agentId: any;
    context: {
        [k: string]: string[] | import("../automations/workspace-scope.js").PersistedAutomationWorkspaceScope | null;
    };
    enabled: boolean;
    nextRunAt: number | null;
    lastRun: {
        runId: any;
        status: any;
        trigger: any;
        startedAt: any;
        completedAt?: any;
        projectId: any;
        conversationId: any;
        agentRunId: any;
        summary?: any;
        error?: any;
        errorCode?: any;
    } | null;
    createdAt: any;
    updatedAt: any;
};
export declare function registerRoutineRoutes(app: Express, ctx: RegisterRoutineRoutesDeps): void;
