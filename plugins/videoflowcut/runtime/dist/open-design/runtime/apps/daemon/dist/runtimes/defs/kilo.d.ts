export declare const kiloAgentDef: {
    id: string;
    name: string;
    bin: string;
    versionArgs: string[];
    fetchModels: (resolvedBin: string, env: import("../types.js").RuntimeEnv) => Promise<import("../../agent-protocol/index.js").ModelOption[]>;
    fallbackModels: import("../types.js").RuntimeModelOption[];
    buildArgs: () => string[];
    streamFormat: string;
    externalMcpInjection: "acp-merge";
};
