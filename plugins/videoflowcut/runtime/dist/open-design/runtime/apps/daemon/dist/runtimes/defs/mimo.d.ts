export declare const mimoAgentDef: {
    id: string;
    name: string;
    bin: string;
    versionArgs: string[];
    fallbackModels: import("../types.js").RuntimeModelOption[];
    buildArgs: (_prompt: string, _imagePaths: string[], _extra: string[] | undefined, options?: import("../types.js").RuntimeBuildOptions | undefined) => string[];
    promptViaStdin: true;
    streamFormat: string;
    eventParser: string;
    externalMcpInjection: "mimo-env-content";
};
