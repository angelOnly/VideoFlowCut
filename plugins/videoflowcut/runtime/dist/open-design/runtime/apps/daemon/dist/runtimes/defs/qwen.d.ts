export declare const qwenAgentDef: {
    id: string;
    name: string;
    bin: string;
    versionArgs: string[];
    fallbackModels: import("../types.js").RuntimeModelOption[];
    fetchModels: (_resolvedBin: string, env: import("../types.js").RuntimeEnv) => Promise<import("../types.js").RuntimeModelOption[] | null>;
    buildArgs: (_prompt: string, _imagePaths: string[], _extra: string[] | undefined, options?: import("../types.js").RuntimeBuildOptions | undefined) => string[];
    promptViaStdin: true;
    streamFormat: string;
};
