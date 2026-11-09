import type { Express, Request, Response } from 'express';
import { type DeliverableSyntaxValidationEvidence, type ProjectMetadata } from '@open-design/contracts';
import { type DeliverableSyntaxRepairState } from '../artifacts/deliverable-syntax-repair.js';
interface ToolGrant {
    runId: string;
    projectId: string;
}
interface ToolRun {
    id: string;
    deliverableSyntaxRepair?: DeliverableSyntaxRepairState;
    deliverableSyntaxValidation?: DeliverableSyntaxValidationEvidence;
}
interface ProjectRecord {
    metadata?: Partial<ProjectMetadata> | Record<string, unknown> | null;
}
export interface RegisterDeliverableSyntaxToolRoutesDeps {
    projectsRoot: string;
    authorizeToolRequest(req: Request, res: Response, operation: string): ToolGrant | null;
    authorizeProjectToolRequest(res: Response, projectId: string, access: {
        mode: 'read';
    }): Promise<boolean>;
    getProject(projectId: string): ProjectRecord | null;
    getRun(runId: string): ToolRun | null;
    persistRunState(run: ToolRun): void;
    relatedPathsForRun(input: {
        runId: string;
        projectRoot: string;
    }): Promise<readonly string[]>;
    /** Test seam for measuring parser wall time without changing checkedAt. */
    monotonicNow?: () => number;
}
export declare function registerDeliverableSyntaxToolRoutes(app: Express, ctx: RegisterDeliverableSyntaxToolRoutesDeps): void;
export {};
