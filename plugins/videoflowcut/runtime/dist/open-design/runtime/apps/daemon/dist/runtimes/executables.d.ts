import type { RuntimeAgentDef } from './types.js';
export declare function userToolchainBinDirs(): string[];
export declare function agentSearchDirs(): string[];
export declare function agentBinEnvKey(agentId: string | undefined): string | null;
export declare function resolveAllOnPath(bin: string): string[];
export declare function resolveOnPath(bin: string): string | null;
export declare function resolveAmrOpenCodeExecutable(env?: Record<string, string | undefined>): string | null;
export declare function codexAppBundleCandidates(): string[];
export declare function resolveAgentExecutable(def: RuntimeAgentDef, configuredEnv?: Record<string, string>): string | null;
/** Record an executable a detection pass proved could not be launched. */
export declare function rememberUnusableExecutable(agentId: string, resolvedPath: string): void;
/**
 * Drop what an agent proved unusable. Detection clears it before each pass, so
 * a rescan after the user repairs or reinstalls a CLI never keeps skipping it.
 */
export declare function forgetUnusableExecutables(agentId: string): void;
export declare function inspectAgentExecutableResolution(def: RuntimeAgentDef, configuredEnv?: Record<string, string>, options?: {
    skipPathCandidates?: readonly string[];
}): {
    configuredOverridePath: string | null;
    pathResolvedPath: string | null;
    selectedPath: string | null;
};
