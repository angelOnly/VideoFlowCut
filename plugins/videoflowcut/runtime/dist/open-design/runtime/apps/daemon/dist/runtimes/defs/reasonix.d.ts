export declare const reasonixAgentDef: {
    id: string;
    name: string;
    bin: string;
    fallbackBins: string[];
    versionArgs: string[];
    fetchModels: (resolvedBin: string, env: import("../types.js").RuntimeEnv) => Promise<import("../../agent-protocol/index.js").ModelOption[]>;
    buildArgs: () => string[];
    streamFormat: string;
    mcpDiscovery: string;
    externalMcpInjection: "acp-merge";
    acpMcpEnvFormat: "map";
    env: {
        REASONIX_ACP_SYSTEM_APPEND: string;
        REASONIX_HOME: string;
    };
    fallbackModels: import("../types.js").RuntimeModelOption[];
    installUrl: string;
    docsUrl: string;
};
