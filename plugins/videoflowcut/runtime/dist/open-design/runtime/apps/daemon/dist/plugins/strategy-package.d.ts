import { type AppliedStrategyBindingV2, type InstalledPluginRecord, type StrategyTaskTypeV2 } from '@open-design/contracts';
export type SelectableStrategyTaskTypeV2 = Exclude<StrategyTaskTypeV2, 'generic'>;
export declare class StrategyPackageIdentityError extends Error {
    constructor(message: string);
}
export declare class StrategyPackageAssetPathError extends StrategyPackageIdentityError {
    constructor(message: string);
}
export interface BundledStrategyPromptAssetsV2 {
    binding: AppliedStrategyBindingV2;
    coreStrategy: string;
    generalOrchestration: string;
    taskSkill: string;
    /**
     * The selected profile's declared non-prompt resources (device shells and
     * the like), decoded from the same verified roster as the prompt text.
     */
    taskResources: ReadonlyArray<{
        path: string;
        text: string;
    }>;
}
/**
 * Daemon-owned I/O edge for the internal OD Next strategy. The manifest
 * supplies declared assets and this owner explicitly adds the mandatory package
 * manifest and SKILL.md; the function never scans directories.
 */
export declare function createBundledStrategyBindingV2(input: {
    plugin: InstalledPluginRecord;
    taskType: SelectableStrategyTaskTypeV2;
}): AppliedStrategyBindingV2;
/**
 * Re-read the exact explicit roster and require it to match the persisted
 * apply-time binding before returning prompt text. Content drift therefore
 * fails closed instead of pairing an old snapshot identity with new files.
 */
export declare function loadBundledStrategyPromptAssetsV2(input: {
    plugin: InstalledPluginRecord;
    binding: AppliedStrategyBindingV2;
}): BundledStrategyPromptAssetsV2;
