import type { PluginManifest, PluginPipeline, ResolvedContext } from '@open-design/contracts';
export interface RegistryView {
    skills: ReadonlyArray<{
        id: string;
        title?: string;
        description?: string;
    }>;
    designSystems: ReadonlyArray<{
        id: string;
        title?: string;
    }>;
    craft: ReadonlyArray<{
        id: string;
        title?: string;
    }>;
    atoms: ReadonlyArray<{
        id: string;
        label?: string;
    }>;
    activeProjectDesignSystem?: {
        id: string;
        title?: string;
    } | undefined;
    scenarios?: ReadonlyArray<ScenarioRegistryEntry> | undefined;
}
export interface ScenarioRegistryEntry {
    id: string;
    taskKind: 'new-generation' | 'figma-migration' | 'code-migration' | 'tune-collab';
    pipeline: PluginPipeline;
}
export interface ResolveOptions {
    registry: RegistryView;
    warnOnMissing?: boolean;
}
export interface ResolveResult {
    context: ResolvedContext;
    warnings: string[];
    digestRefs: Array<{
        kind: string;
        ref: string;
    }>;
}
export declare function resolveContext(manifest: PluginManifest, opts: ResolveOptions): ResolveResult;
//# sourceMappingURL=resolve.d.ts.map