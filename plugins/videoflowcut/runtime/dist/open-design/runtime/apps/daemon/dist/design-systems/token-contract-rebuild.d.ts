import type { DesignSystemTokenContractRebuildDecision } from '@open-design/contracts';
import type { DesignSystemRevisionFileChange } from './index.js';
export type DesignTokenContractRebuildPreparation = {
    decision: DesignSystemTokenContractRebuildDecision;
    revision?: {
        feedback: string;
        sectionTitle: string;
        baseBody: string;
        proposedBody: string;
        fileChanges: DesignSystemRevisionFileChange[];
    };
};
type PrepareOptions = {
    force?: boolean;
    now?: Date;
};
export declare function prepareDesignTokenContractRebuild(root: string, id: string, options?: PrepareOptions): Promise<DesignTokenContractRebuildPreparation>;
export {};
