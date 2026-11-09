import type { GenUISurfaceSpec, PluginPipeline } from '@open-design/contracts';
export interface AutoAtomSurfaceContext {
    pipeline?: PluginPipeline | undefined;
}
export declare function deriveAutoAtomSurfaces(ctx: AutoAtomSurfaceContext): GenUISurfaceSpec[];
