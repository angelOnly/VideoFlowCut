import type { PatchReceiptEntry } from './patch-edit.js';
export type DiffReviewDecision = 'accept' | 'reject' | 'partial';
export type DiffReviewer = 'user' | 'agent';
export interface DiffReviewDecisionFile {
    decision: DiffReviewDecision;
    accepted_files: string[];
    rejected_files: string[];
    reviewer: DiffReviewer;
    reason?: string;
    decidedAt: string;
}
export interface DiffReviewMeta {
    generatedAt: string;
    atomDigest: string;
    planRevision: number;
}
export interface DiffReviewReport {
    files: string[];
    added: number;
    removed: number;
    receipts: PatchReceiptEntry[];
    decision?: DiffReviewDecisionFile;
    meta: DiffReviewMeta;
}
export interface DiffReviewOptions {
    cwd: string;
    decision?: {
        decision: DiffReviewDecision;
        reviewer: DiffReviewer;
        accepted_files?: string[];
        rejected_files?: string[];
        reason?: string;
    };
}
export declare function runDiffReview(opts: DiffReviewOptions): Promise<DiffReviewReport>;
