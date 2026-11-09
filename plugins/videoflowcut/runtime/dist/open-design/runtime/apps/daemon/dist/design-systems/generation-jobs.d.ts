import { type DesignSystemRevision, type DesignSystemRevisionFileChange, type DesignSystemSummary, type UserDesignSystemInput, type UserDesignSystemRevisionInput } from './index.js';
import type { DesignSystemTokenContractRebuildDecision } from '@open-design/contracts';
import { type DesignSystemSourceContext } from './source-context.js';
export type DesignSystemGenerationJobStatus = 'queued' | 'running' | 'succeeded' | 'failed';
export type DesignSystemGenerationStepStatus = 'pending' | 'running' | 'succeeded' | 'failed';
export type DesignSystemGenerationStep = {
    id: string;
    title: string;
    status: DesignSystemGenerationStepStatus;
    message?: string;
    startedAt?: string;
    completedAt?: string;
};
export type DesignSystemGenerationJob = {
    id: string;
    kind?: 'generation' | 'revision' | 'token-contract-rebuild';
    status: DesignSystemGenerationJobStatus;
    progress: number;
    steps: DesignSystemGenerationStep[];
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
    designSystemId?: string;
    revisionId?: string;
    error?: string;
    message?: string;
};
type StoreOptions = {
    root: string;
    createDesignSystem?: (root: string, input: UserDesignSystemInput) => Promise<DesignSystemSummary>;
    readDesignSystem?: (root: string, id: string, options?: {
        idPrefix?: string;
    }) => Promise<string | null>;
    createRevision?: (root: string, id: string, input: UserDesignSystemRevisionInput) => Promise<DesignSystemRevision | null>;
    collectSourceContext?: (input: UserDesignSystemInput) => Promise<DesignSystemSourceContext>;
    listFiles?: (root: string, id: string) => Promise<Array<{
        path: string;
    }> | null>;
    delayMs?: number;
    idFactory?: () => string;
};
export type DesignSystemRevisionInput = {
    /** Exact authorized storage root; defaults to the store root for Personal jobs. */
    root?: string;
    designSystemId: string;
    feedback: string;
    sectionTitle?: string;
    body?: string;
};
export type DesignSystemTokenContractRebuildInput = {
    /** Exact authorized storage root; defaults to the store root for Personal jobs. */
    root?: string;
    designSystemId: string;
    decision: DesignSystemTokenContractRebuildDecision;
    feedback: string;
    sectionTitle: string;
    baseBody: string;
    proposedBody: string;
    fileChanges?: DesignSystemRevisionFileChange[];
};
export declare function createDesignSystemGenerationJobStore(options: StoreOptions): {
    start: (input: UserDesignSystemInput, createDesignSystemForJob?: StoreOptions['createDesignSystem']) => DesignSystemGenerationJob;
    revise: (input: DesignSystemRevisionInput) => DesignSystemGenerationJob;
    rebuildTokenContract: (input: DesignSystemTokenContractRebuildInput) => DesignSystemGenerationJob;
    get: (id: string) => DesignSystemGenerationJob | null;
};
export {};
