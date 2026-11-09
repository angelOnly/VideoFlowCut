import type { RuntimeModelOption } from '../types.js';
export declare function parseGrokBuildModels(stdout: string): RuntimeModelOption[];
export declare const grokBuildAgentDef: {
    id: string;
    name: string;
    bin: string;
    versionArgs: string[];
    helpArgs: string[];
    listModels: {
        args: string[];
        timeoutMs: number;
        parse: typeof parseGrokBuildModels;
    };
    fallbackModels: RuntimeModelOption[];
    buildArgs: (_prompt: string, _imagePaths: string[], _extra?: string[] | undefined, options?: import("../types.js").RuntimeBuildOptions | undefined, runtimeContext?: import("../types.js").RuntimeContext | undefined) => string[];
    reasoningOptions: {
        id: string;
        label: string;
    }[];
    promptViaFile: true;
    promptViaStdin: false;
    streamFormat: string;
    installUrl: string;
    docsUrl: string;
};
