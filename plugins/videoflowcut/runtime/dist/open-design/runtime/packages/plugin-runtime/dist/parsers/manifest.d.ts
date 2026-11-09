import { type PluginManifest } from '@open-design/contracts';
export interface ManifestParseSuccess {
    ok: true;
    manifest: PluginManifest;
    warnings: string[];
}
export interface ManifestParseFailure {
    ok: false;
    warnings: string[];
    errors: string[];
}
export type ManifestParseResult = ManifestParseSuccess | ManifestParseFailure;
export declare function parseManifest(raw: string): ManifestParseResult;
export declare function parseManifestObject(value: unknown): ManifestParseResult;
//# sourceMappingURL=manifest.d.ts.map