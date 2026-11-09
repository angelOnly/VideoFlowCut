import { type SeedToken } from './engine/index.js';
import type { AssetKind } from './schema.js';
export declare const BRAND_ARTIFACT_KINDS: AssetKind[];
export declare function brandSystemDir(brandsRoot: string, id: string): string;
export declare function rebuildSystem(brandsRoot: string, id: string, seedOverrides?: Partial<SeedToken>): Promise<{
    themes: string[];
    files: string[];
}>;
export declare function listSystemArtifacts(brandsRoot: string, id: string): AssetKind[];
export declare function readSystemSummary(brandsRoot: string, id: string): {
    hasSystem: boolean;
    seed: SeedToken | null;
    themes: string[];
};
