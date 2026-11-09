export declare const claudeAgentDef: {
    id: string;
    name: string;
    bin: string;
    fallbackBins: string[];
    versionArgs: string[];
    authProbe: {
        args: string[];
        timeoutMs: number;
    };
    helpArgs: string[];
    capabilityFlags: {
        '--include-partial-messages': string;
        '--forward-subagent-text': string;
        '--agents': string;
        '--add-dir': string;
    };
    hiddenCapabilityFlags: {
        probeArgsPrefix: string[];
        flags: {
            '--thinking-display': string;
        };
    };
    fallbackModels: import("../types.js").RuntimeModelOption[];
    fetchModels: (_resolvedBin: string, env: import("../types.js").RuntimeEnv) => Promise<import("../types.js").RuntimeModelOption[] | null>;
    buildArgs: (_prompt: string, _imagePaths: string[], extraAllowedDirs?: string[] | undefined, options?: import("../types.js").RuntimeBuildOptions | undefined, runtimeContext?: import("../types.js").RuntimeContext | undefined) => string[];
    promptViaStdin: true;
    promptInputFormat: "stream-json";
    streamFormat: string;
    externalMcpInjection: "claude-mcp-json";
    resumesSessionViaCli: true;
};
