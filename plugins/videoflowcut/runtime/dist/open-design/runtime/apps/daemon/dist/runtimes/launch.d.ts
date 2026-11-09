import { inspectAgentExecutableResolution } from './executables.js';
import type { RuntimeAgentDef } from './types.js';
export type AgentLaunchKind = 'selected' | 'codex-native';
export type AgentLaunchResolution = ReturnType<typeof inspectAgentExecutableResolution> & {
    launchPath: string | null;
    launchKind: AgentLaunchKind;
    childPathPrepend: string[];
    diagnostic: string | null;
};
export declare function resolveAgentLaunch(def: RuntimeAgentDef, configuredEnv?: Record<string, string>, options?: {
    skipPathCandidates?: readonly string[];
}): AgentLaunchResolution;
export declare function applyAgentLaunchEnv(env: NodeJS.ProcessEnv, launch: Pick<AgentLaunchResolution, 'childPathPrepend'>, nodeBinDir?: string, appendPathDirs?: string[]): NodeJS.ProcessEnv;
