declare function parseCodebuddyHelpModels(stdout: string): {
    id: string;
    label: string;
}[] | null;
export declare const codebuddyAgentDef: {
    id: string;
    name: string;
    bin: string;
    fallbackBins: string[];
    versionArgs: string[];
    helpArgs: string[];
    capabilityFlags: {
        '--include-partial-messages': string;
        '--add-dir': string;
    };
    listModels: {
        args: string[];
        parse: typeof parseCodebuddyHelpModels;
        timeoutMs: number;
    };
    fallbackModels: import("../types.js").RuntimeModelOption[];
    reasoningOptions: {
        id: string;
        label: string;
    }[];
    buildArgs: (_prompt: string, _imagePaths: string[], extraAllowedDirs?: string[] | undefined, options?: import("../types.js").RuntimeBuildOptions | undefined, runtimeContext?: import("../types.js").RuntimeContext | undefined) => string[];
    promptViaStdin: true;
    promptInputFormat: "stream-json";
    streamFormat: string;
    externalMcpInjection: "claude-mcp-json";
    resumesSessionViaCli: true;
    installUrl: string;
    docsUrl: string;
};
export {};
