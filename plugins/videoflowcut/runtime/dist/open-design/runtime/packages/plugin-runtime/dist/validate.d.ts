import { type PluginManifest } from '@open-design/contracts';
export interface ValidateResult {
    ok: boolean;
    warnings: string[];
    errors: string[];
}
export declare function validateManifest(value: unknown): ValidateResult;
export declare function validateSafe(manifest: PluginManifest): ValidateResult;
//# sourceMappingURL=validate.d.ts.map