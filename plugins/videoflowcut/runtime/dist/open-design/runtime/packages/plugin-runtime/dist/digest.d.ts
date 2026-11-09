import type { PluginManifest } from '@open-design/contracts';
export interface DigestInput {
    manifest: PluginManifest;
    inputs: Record<string, string | number | boolean>;
    resolvedContextRefs: Array<{
        kind: string;
        ref: string;
    }>;
}
export declare function manifestSourceDigest(input: DigestInput): string;
//# sourceMappingURL=digest.d.ts.map