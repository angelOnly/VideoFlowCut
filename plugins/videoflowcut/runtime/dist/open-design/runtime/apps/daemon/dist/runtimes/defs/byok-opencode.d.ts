export declare const byokOpenCodeAgentDef: {
    helpArgs: string[];
    capabilityFlags: {
        "--dangerously-skip-permissions": string;
    };
    id: string;
    name: string;
    bin: string;
    fallbackBins: string[];
    versionArgs: string[];
    fallbackModels: import("../types.js").RuntimeModelOption[];
    buildArgs: (_prompt: string, _imagePaths: string[], _extra: string[] | undefined, options?: import("../types.js").RuntimeBuildOptions | undefined, runtimeContext?: import("../types.js").RuntimeContext | undefined) => string[];
    promptViaStdin: true;
    streamFormat: string;
    eventParser: string;
    externalMcpInjection: "opencode-env-content";
    supportsCustomModel: true;
};
