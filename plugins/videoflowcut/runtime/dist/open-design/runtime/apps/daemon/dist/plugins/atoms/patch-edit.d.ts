import type { RewriteStep } from './rewrite-plan.js';
export type PatchStepStatus = 'pending' | 'completed' | 'skipped' | 'failed';
export interface PatchStepRecord extends Omit<RewriteStep, 'rationale'> {
    rationale?: string;
    status?: PatchStepStatus;
    completedAt?: string;
}
export interface PatchReceiptEntry {
    step: string;
    files: string[];
    added: number;
    removed: number;
    rationale: string;
    completedAt: string;
}
export interface ApplyPatchInput {
    cwd: string;
    stepId: string;
    diff: string;
    rationale?: string;
    allowOutOfStepCreation?: boolean;
}
export interface ApplyPatchResult {
    status: 'completed' | 'skipped' | 'failed';
    filesTouched: string[];
    added: number;
    removed: number;
    reason?: string;
}
export interface SkipStepInput {
    cwd: string;
    stepId: string;
    rationale: string;
}
export declare function applyPatchForStep(input: ApplyPatchInput): Promise<ApplyPatchResult>;
export declare function skipStep(input: SkipStepInput): Promise<void>;
export declare function readPlanProgress(cwd: string): Promise<{
    total: number;
    terminal: number;
}>;
