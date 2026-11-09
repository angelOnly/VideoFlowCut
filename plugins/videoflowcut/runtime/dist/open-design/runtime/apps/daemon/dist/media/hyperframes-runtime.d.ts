export declare const HYPERFRAMES_CLI_ENV = "OD_HYPERFRAMES_BIN";
export declare function resolveHyperFramesCliPath({ env, resolvePackage, }?: {
    env?: NodeJS.ProcessEnv | Record<string, string | undefined>;
    resolvePackage?: (id: string) => string;
}): string;
export declare function resolveHyperFramesBrowserRuntimePath({ resolvePackage, }?: {
    resolvePackage?: (id: string) => string;
}): string;
export declare function resolveHyperFramesNodeBin(env?: NodeJS.ProcessEnv | Record<string, string | undefined>, execPath?: string): string;
