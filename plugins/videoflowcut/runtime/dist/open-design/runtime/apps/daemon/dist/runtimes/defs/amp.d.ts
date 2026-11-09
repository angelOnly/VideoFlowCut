export declare const ampAgentDef: {
    id: string;
    name: string;
    bin: string;
    versionArgs: string[];
    fallbackModels: import("../types.js").RuntimeModelOption[];
    supportsCustomModel: false;
    buildArgs: (_prompt: string, _imagePaths: string[], _extraAllowedDirs?: string[] | undefined, options?: import("../types.js").RuntimeBuildOptions | undefined) => string[];
    promptViaStdin: true;
    streamFormat: string;
};
