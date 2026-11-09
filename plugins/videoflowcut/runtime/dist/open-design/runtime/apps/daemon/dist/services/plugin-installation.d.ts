import { type PluginInstallErrorCode } from '../plugins/installer.js';
import type { RegistryRoots } from '../plugins/registry.js';
export interface PluginInstallResult {
    ok: boolean;
    plugin: InstalledPluginLike | null;
    warnings: unknown[];
    message: string;
    log: string[];
    errorCode?: PluginInstallErrorCode;
}
export interface PluginInstallationHelpersDeps {
    db: PluginDbLike;
    installFromLocalFolder: (db: PluginDbLike, args: InstallFromLocalFolderArgs) => AsyncIterable<InstallFromLocalFolderEvent>;
    PLUGIN_REGISTRY_ROOTS: RegistryRoots;
    PLUGIN_LOCKFILE_PATH: string;
    PLUGIN_UPLOAD_MAX_BYTES: number;
}
interface PluginDbLike {
    prepare(sql: string): {
        all(...params: unknown[]): unknown[];
        get(...params: unknown[]): unknown;
        run(...params: unknown[]): unknown;
    };
}
interface InstalledPluginLike {
    title?: string;
    [key: string]: unknown;
}
interface InstallFromLocalFolderArgs {
    source: string;
    roots: RegistryRoots;
    _stagedFolder: string;
    _stagedSourceKind: string;
    lockfilePath: string;
}
interface InstallFromLocalFolderEvent {
    kind?: string;
    message?: string;
    warnings?: unknown[];
    plugin?: InstalledPluginLike;
    code?: PluginInstallErrorCode;
}
export declare function normalizeProjectPluginFolderPath(input: unknown): string;
export declare function resolveProjectChildDirectory(projectRoot: string, relativePath: string): Promise<string>;
export declare function folderLooksLikePlugin(folder: string): Promise<boolean>;
export declare function findUploadedPluginRoot(stagedFolder: string): Promise<string>;
export declare function safeUploadRelativePath(input: unknown): string;
export declare function extractPluginZipToFolder(buffer: Buffer, stagedFolder: string, maxBytes: number): Promise<void>;
export declare function createPluginInstallationHelpers(deps: PluginInstallationHelpersDeps): {
    finishUploadedPluginInstall: (stagedFolder: string, source: string) => Promise<PluginInstallResult>;
    stageUploadedPluginZip: (buffer: Buffer, source: string) => Promise<PluginInstallResult>;
    stageUploadedPluginFolder: (files: Array<{
        buffer: Buffer;
        originalname: string;
    }>, rawPaths: unknown) => Promise<PluginInstallResult>;
};
export {};
