import type { PluginPipeline } from '@open-design/contracts';
export interface EnsureCoreStagesInput {
    pipeline: PluginPipeline | undefined;
    taskKind: string;
    mode?: string | undefined;
    source?: 'declared' | 'scenario' | 'none' | undefined;
}
export declare function ensureCoreQualityStages(input: EnsureCoreStagesInput): PluginPipeline | undefined;
