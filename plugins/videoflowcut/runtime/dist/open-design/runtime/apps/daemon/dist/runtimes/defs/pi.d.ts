export declare const piAgentDef: {
    id: string;
    name: string;
    bin: string;
    versionArgs: string[];
    versionProbeTimeoutMs: number;
    fetchModels: (resolvedBin: string, env: import("../types.js").RuntimeEnv) => Promise<import("../../agent-protocol/pi-rpc/models.js").PiModelOption[] | null>;
    fallbackModels: import("../types.js").RuntimeModelOption[];
    reasoningOptions: {
        id: string;
        label: string;
    }[];
    buildArgs: (_prompt: string, _imagePaths: string[], _extraAllowedDirs?: string[] | undefined, options?: import("../types.js").RuntimeBuildOptions | undefined, runtimeContext?: import("../types.js").RuntimeContext | undefined) => string[];
    promptViaStdin: true;
    streamFormat: string;
    supportsImagePaths: true;
};
