export type OwnershipTier = 'leaf' | 'shared' | 'route' | 'shell';
export interface OwnershipEntry {
    file: string;
    layer: OwnershipTier;
}
export interface RewriteStep {
    id: string;
    files: string[];
    rationale: string;
    risk: 'low' | 'medium' | 'high';
}
export interface RewritePlanReport {
    steps: RewriteStep[];
    ownership: OwnershipEntry[];
    meta: {
        generatedAt: string;
        atomDigest: string;
        tokenMapDigest: string;
        intent: string;
    };
    planMarkdown: string;
}
export interface RewritePlanOptions {
    cwd: string;
    intent?: string;
    buildTestStepId?: string;
}
export declare function runRewritePlan(opts: RewritePlanOptions): Promise<RewritePlanReport>;
