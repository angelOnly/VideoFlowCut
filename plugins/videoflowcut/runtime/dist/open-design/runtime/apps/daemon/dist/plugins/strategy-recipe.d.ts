import { type AppliedPluginSnapshot, type OdNextStrategyRequestRecipeV2 } from '@open-design/contracts';
export declare class InvalidOdNextStrategyPromptRecipeV2Error extends Error {
    constructor(message: string);
}
export interface OdNextStrategyAtomBodyV2 {
    atomId: string;
    body: string;
}
/**
 * Resolve the internal prompt payload from the hidden shipped folder. A
 * snapshot without a Strategy Binding is an ordinary plugin snapshot and
 * returns null, even when its display id imitates the official strategy.
 */
export declare function resolveOdNextStrategyRequestRecipeV2(input: {
    bundledPluginsDir: string;
    snapshot: AppliedPluginSnapshot;
    executionProfile: 'filesystem' | 'text_artifact';
    atomPromptsEnabled: boolean;
    loadAtomBodies: (atomIds: ReadonlyArray<string>) => Promise<ReadonlyArray<OdNextStrategyAtomBodyV2>>;
}): Promise<OdNextStrategyRequestRecipeV2 | null>;
