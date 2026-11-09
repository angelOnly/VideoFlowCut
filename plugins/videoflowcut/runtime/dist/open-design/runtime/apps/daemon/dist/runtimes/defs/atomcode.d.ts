export declare const atomcodeAgentDef: {
    id: string;
    name: string;
    bin: string;
    versionArgs: string[];
    fallbackModels: import("../types.js").RuntimeModelOption[];
    buildArgs: (_prompt: string, _imagePaths: string[], _extraAllowedDirs?: string[] | undefined, options?: import("../types.js").RuntimeBuildOptions | undefined, runtimeContext?: import("../types.js").RuntimeContext | undefined) => string[];
    promptViaFile: true;
    promptViaStdin: false;
    streamFormat: string;
    installUrl: string;
    docsUrl: string;
};
