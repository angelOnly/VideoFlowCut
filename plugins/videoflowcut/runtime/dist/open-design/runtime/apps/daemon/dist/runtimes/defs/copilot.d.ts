export declare const copilotAgentDef: {
    id: string;
    name: string;
    bin: string;
    versionArgs: string[];
    fallbackModels: import("../types.js").RuntimeModelOption[];
    buildArgs: (_prompt: string, _imagePaths: string[], extraAllowedDirs?: string[] | undefined, options?: import("../types.js").RuntimeBuildOptions | undefined) => string[];
    promptViaStdin: true;
    streamFormat: string;
    inactivityTimeoutMs: number;
};
