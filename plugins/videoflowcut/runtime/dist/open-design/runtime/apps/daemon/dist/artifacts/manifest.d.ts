type JsonRecord = Record<string, unknown>;
type ValidationResult = {
    ok: true;
    value: JsonRecord | null;
} | {
    ok: false;
    error: string;
};
type ValidationOptions = {
    preserveUpdatedAt?: boolean;
};
export declare function validateArtifactManifestInput(manifest: unknown, entry: unknown, options?: ValidationOptions): ValidationResult;
export declare function sanitizeManifest(manifest: JsonRecord, entry: string, options?: ValidationOptions): JsonRecord;
export declare function parsePersistedManifest(raw: string, fallbackEntry: string): JsonRecord | null;
export declare function inferLegacyManifest(entry: string): JsonRecord | null;
export {};
