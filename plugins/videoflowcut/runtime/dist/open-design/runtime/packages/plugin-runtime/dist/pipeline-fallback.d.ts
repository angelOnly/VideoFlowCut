import type { PluginManifest, PluginPipeline } from '@open-design/contracts';
import type { ScenarioRegistryEntry } from './resolve.js';
export interface ResolvePipelineInput {
    manifest: PluginManifest;
    scenarios?: ReadonlyArray<ScenarioRegistryEntry> | undefined;
}
export interface ResolvePipelineResult {
    pipeline: PluginPipeline | undefined;
    source: 'declared' | 'scenario' | 'none';
    scenarioId?: string;
}
export declare function resolveAppliedPipeline(input: ResolvePipelineInput): ResolvePipelineResult;
//# sourceMappingURL=pipeline-fallback.d.ts.map