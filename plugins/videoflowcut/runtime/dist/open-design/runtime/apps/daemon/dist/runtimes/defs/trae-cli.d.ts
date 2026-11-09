export declare const traeCliAgentDef: {
    id: string;
    name: string;
    bin: string;
    versionArgs: string[];
    versionProbeTimeoutMs: number;
    fetchModels: (resolvedBin: string, env: import("../types.js").RuntimeEnv) => Promise<import("../../agent-protocol/index.js").ModelOption[]>;
    fallbackModels: import("../types.js").RuntimeModelOption[];
    buildArgs: () => string[];
    streamFormat: string;
    mcpDiscovery: string;
    externalMcpInjection: "acp-merge";
};
