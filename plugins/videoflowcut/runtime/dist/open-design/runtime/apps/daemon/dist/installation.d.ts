/**
 * Wire shape persisted at `<installationDir>/installation.json`.
 * Kept intentionally narrow: only fields that need to survive a
 * namespace-scoped data-dir wipe belong here.
 */
export interface InstallationFile {
    installationId?: string;
    pendingAttribution?: PendingAttribution;
    attributionClaimedAt?: string;
    attributionClaimResultAt?: string;
}
export interface PendingAttribution {
    token: string;
    source: string;
    capturedAt: string;
    rawUrl?: string;
    platform?: string;
}
export declare function resolveInstallationDir(dataDir: string): string;
export declare function readInstallationFile(installationDir: string): Promise<InstallationFile>;
export declare function readInstallationFileSync(installationDir: string): InstallationFile;
/**
 * Patch shape for {@link writeInstallationFile}.
 *
 * Distinct from `Partial<InstallationFile>` because `exactOptionalPropertyTypes`
 * blocks `{ installationId: undefined }` and we explicitly need a way to
 * **clear** the id (Settings → "Delete my data", or an explicit null write
 * via `writeAppConfig`). The convention here:
 *
 *   - field present with a non-empty string  → assign the new value
 *   - field present with null / empty string → delete the field on disk
 *   - field absent                           → leave the existing value alone
 */
export type InstallationFilePatch = {
    installationId?: string | null;
    pendingAttribution?: PendingAttribution | null;
    attributionClaimedAt?: string | null;
    attributionClaimResultAt?: string | null;
};
export declare function writeInstallationFile(installationDir: string, patch: InstallationFilePatch): Promise<InstallationFile>;
