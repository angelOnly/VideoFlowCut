export declare const APP_VERSION_FALLBACK = "0.0.0";
export declare const UNKNOWN_APP_VERSION = "unknown";
export interface AppVersionInfo {
    version: string;
    channel: string;
    packaged: boolean;
    platform: string;
    arch: string;
}
export declare function normalizeTelemetryAppVersion(value: unknown): string | null;
export declare function normalizeTelemetryAppVersionInfo(value: unknown): AppVersionInfo | null;
interface PackageMetadata {
    version?: unknown;
}
export interface ResolveAppVersionInfoOptions {
    env?: NodeJS.ProcessEnv | undefined;
    packageMetadata?: PackageMetadata | null;
    resourcesPath?: string | undefined;
    execPath?: string | undefined;
    platform?: NodeJS.Platform | undefined;
    arch?: NodeJS.Architecture | undefined;
}
export interface ReadAppVersionInfoOptions extends ResolveAppVersionInfoOptions {
    packageJsonUrl?: URL | undefined;
}
export declare function inferReleaseChannelFromVersion(version: string): string | null;
export declare function isPackagedRuntime({ resourcesPath, execPath, platform, }?: Pick<ResolveAppVersionInfoOptions, 'resourcesPath' | 'execPath' | 'platform'>): boolean;
export declare function resolveAppVersionInfo({ env, packageMetadata, resourcesPath, execPath, platform, arch, }?: ResolveAppVersionInfoOptions): AppVersionInfo;
export declare function readCurrentAppVersionInfo({ packageJsonUrl, packageMetadata, env, resourcesPath, execPath, platform, arch, }?: ReadAppVersionInfoOptions): Promise<AppVersionInfo>;
export {};
