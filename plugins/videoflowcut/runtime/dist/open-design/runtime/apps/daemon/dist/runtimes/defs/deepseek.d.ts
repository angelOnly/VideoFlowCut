export declare const deepseekAgentDef: {
    id: string;
    name: string;
    bin: string;
    fallbackBins: string[];
    versionArgs: string[];
    fallbackModels: import("../types.js").RuntimeModelOption[];
    buildArgs: (prompt: string, _imagePaths: string[], _extra: string[] | undefined, options?: import("../types.js").RuntimeBuildOptions | undefined) => string[];
    maxPromptArgBytes: number;
    streamFormat: string;
};
