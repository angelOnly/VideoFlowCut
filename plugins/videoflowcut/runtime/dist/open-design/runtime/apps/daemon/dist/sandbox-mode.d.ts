export declare const SANDBOX_MODE_ENV = "OD_SANDBOX_MODE";
export declare const SANDBOX_IMPORT_ALLOWED_ROOTS_ENV = "OD_SANDBOX_IMPORT_ALLOWED_ROOTS";
export declare const SANDBOX_IMPORTED_PROJECT_UNAVAILABLE_MESSAGE: string;
export declare const SANDBOX_IMPORT_ALLOWED_ROOTS_INVALID_MESSAGE = "OD_SANDBOX_IMPORT_ALLOWED_ROOTS entries must be absolute paths.";
export interface SandboxRuntimeRoots {
    agentHomeDir: string;
    cacheDir: string;
    configDir: string;
    generatedFilesDir: string;
    logsDir: string;
    mcpConfigDir: string;
    pluginStateDir: string;
    previewStateDir: string;
    skillsCacheDir: string;
    tempDir: string;
    toolConfigDir: string;
}
export interface SandboxRuntimeConfig {
    enabled: boolean;
    dataDir: string;
    roots: SandboxRuntimeRoots;
}
export declare function isSandboxModeEnabled(env?: Record<string, string | undefined>): boolean;
export declare function sandboxImportAllowedRoots(env?: Record<string, string | undefined>): string[];
export declare function isSandboxImportedProjectRootAllowed(projectRoot: string, env?: Record<string, string | undefined>): boolean;
export declare function sandboxImportedProjectRootUnavailableReason(projectRoot: string, env?: Record<string, string | undefined>): string | null;
export declare function resolveSandboxRuntimeConfig(enabled: boolean, dataDir: string): SandboxRuntimeConfig;
export declare function resolveSandboxRuntimeConfigFromEnv(env: Record<string, string | undefined>, projectRoot: string): SandboxRuntimeConfig | null;
export declare function sandboxAgentProfilesConfigPath(config: SandboxRuntimeConfig): string;
export declare function ensureSandboxRuntimeDirs(config: SandboxRuntimeConfig): void;
export declare function applySandboxRuntimeEnv(baseEnv: NodeJS.ProcessEnv, config: SandboxRuntimeConfig): NodeJS.ProcessEnv;
