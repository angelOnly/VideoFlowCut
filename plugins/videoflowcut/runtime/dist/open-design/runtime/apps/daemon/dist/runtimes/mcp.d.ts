import type { RuntimeAgentDef } from './types.js';
type McpOptions = {
    enabled?: boolean;
    command?: string;
    argsPrefix?: string[];
};
export declare function buildLiveArtifactsMcpServersForAgent(def: RuntimeAgentDef, { enabled, command, argsPrefix }?: McpOptions): {
    name: string;
    command: string;
    args: string[];
    env: {
        name: string;
        value: string;
    }[] | {
        ELECTRON_RUN_AS_NODE: string;
    };
}[];
export {};
