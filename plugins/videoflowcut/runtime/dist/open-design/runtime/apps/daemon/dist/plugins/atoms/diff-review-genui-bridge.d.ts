import { type DiffReviewer, type DiffReviewReport } from './diff-review.js';
import { type RunAndPersistHandoffResult } from './handoff.js';
export declare function isDiffReviewSurfaceId(id: string): boolean;
export interface ParsedDiffReviewDecision {
    decision: 'accept' | 'reject' | 'partial';
    accepted_files?: string[];
    rejected_files?: string[];
    reason?: string;
}
export declare function parseDiffReviewGenuiResponse(value: unknown): ParsedDiffReviewDecision | {
    error: string;
};
export interface ApplyDiffReviewDecisionInput {
    cwd: string;
    value: unknown;
    reviewer: DiffReviewer;
}
export interface ApplyDiffReviewDecisionResult {
    ok: true;
    report: DiffReviewReport;
    handoff?: RunAndPersistHandoffResult;
    handoffError?: string;
}
export interface ApplyDiffReviewDecisionFailure {
    ok: false;
    error: string;
}
export declare function applyDiffReviewDecisionToCwd(input: ApplyDiffReviewDecisionInput): Promise<ApplyDiffReviewDecisionResult | ApplyDiffReviewDecisionFailure>;
