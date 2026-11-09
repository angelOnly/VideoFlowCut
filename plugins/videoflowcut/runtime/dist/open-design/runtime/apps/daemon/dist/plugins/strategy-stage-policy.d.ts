import type { AppliedStrategyBindingV2, InstalledPluginRecord, PluginPipeline } from '@open-design/contracts';
export declare class InvalidOdNextStrategyPipelineV2Error extends Error {
    constructor(message: string);
}
/**
 * Exact, internal stage policy for the hash-gated bundled strategy. The
 * ordinary quality floor never calls this function, and community manifests
 * cannot supply the validated binding required to cross the apply boundary.
 */
export declare function enforceOdNextStrategyPipelineV2(input: {
    plugin: InstalledPluginRecord;
    binding: AppliedStrategyBindingV2;
    pipeline: PluginPipeline | undefined;
}): PluginPipeline;
