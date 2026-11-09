import type { PluginManifest } from '@open-design/contracts';
export interface MergeInputs {
    sidecar?: PluginManifest | undefined;
    adapters?: PluginManifest[] | undefined;
}
export declare function mergeManifests(inputs: MergeInputs): PluginManifest;
//# sourceMappingURL=merge.d.ts.map