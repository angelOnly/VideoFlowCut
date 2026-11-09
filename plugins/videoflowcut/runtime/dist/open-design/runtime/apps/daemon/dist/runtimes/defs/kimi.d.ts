export declare const kimiAgentDef: {
    id: string;
    name: string;
    bin: string;
    versionArgs: string[];
    fallbackModels: import("../types.js").RuntimeModelOption[];
    fetchModels: (resolvedBin: string, env: import("../types.js").RuntimeEnv) => Promise<import("../../agent-protocol/index.js").ModelOption[]>;
    buildArgs: () => string[];
    streamFormat: string;
    mcpDiscovery: string;
    externalMcpInjection: "acp-merge";
    acpStdioMcpRemovedInVersion: string;
};
