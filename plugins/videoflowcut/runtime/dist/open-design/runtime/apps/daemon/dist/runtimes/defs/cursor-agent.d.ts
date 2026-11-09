import type { RuntimeModelOption } from '../types.js';
export declare function parseCursorAgentModels(stdout: string): RuntimeModelOption[] | null;
export declare const cursorAgentDef: {
    id: string;
    name: string;
    bin: string;
    versionArgs: string[];
    helpArgs: string[];
    capabilityFlags: {
        '--trust': string;
    };
    listModels: {
        args: string[];
        timeoutMs: number;
        parse: (stdout: string) => RuntimeModelOption[] | null;
    };
    fallbackModels: RuntimeModelOption[];
    buildArgs: (_prompt: string, _imagePaths: string[], _extra: string[] | undefined, options?: import("../types.js").RuntimeBuildOptions | undefined, runtimeContext?: import("../types.js").RuntimeContext | undefined) => string[];
    promptViaStdin: true;
    streamFormat: string;
    eventParser: string;
    authProbe: {
        args: string[];
        timeoutMs: number;
    };
};
