export declare const aiderAgentDef: {
    id: string;
    name: string;
    bin: string;
    versionArgs: string[];
    fallbackModels: import("../types.js").RuntimeModelOption[];
    buildArgs: (prompt: string, _imagePaths: string[], _extra: string[] | undefined, options?: import("../types.js").RuntimeBuildOptions | undefined) => string[];
    maxPromptArgBytes: number;
    streamFormat: string;
    installUrl: string;
    docsUrl: string;
};
