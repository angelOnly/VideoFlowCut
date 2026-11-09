export declare const DAEMON_CLI_PATH_ENV = "OD_DAEMON_CLI_PATH";
export declare const RESOURCE_ROOT_ENV = "OD_RESOURCE_ROOT";
export declare function resolveDaemonCliPath(env?: NodeJS.ProcessEnv): string;
export declare function resolveProcessResourcesPath(): string | null;
export interface ResolveDaemonResourceRootOptions {
    configured?: string;
    safeBases?: Array<string | null | undefined>;
}
export declare function resolveDaemonResourceRoot({ configured, safeBases, }?: ResolveDaemonResourceRootOptions): string | null;
export declare function resolveDaemonResourceDir(resourceRoot: string | null, segment: string, fallback: string): string;
export interface ResolveDaemonPluginPreviewsDirOptions {
    env?: NodeJS.ProcessEnv;
    resourceRoot: string | null | undefined;
    projectRoot: string;
}
export declare function resolveDaemonPluginPreviewsDir({ env, resourceRoot, projectRoot, }: ResolveDaemonPluginPreviewsDirOptions): string;
export interface ResolveDataDirOptions {
    requireExplicit?: boolean;
}
export declare function resolveDataDir(raw: string | undefined, projectRoot: string, options?: ResolveDataDirOptions): string;
