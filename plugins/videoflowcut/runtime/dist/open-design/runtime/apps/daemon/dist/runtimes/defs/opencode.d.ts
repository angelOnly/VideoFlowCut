import type { RuntimeModelOption } from '../types.js';
/**
 * Parse `opencode models --verbose`, retaining each model's exact variant
 * names. Plain one-id-per-line output remains accepted as a compatibility
 * fallback, but only verbose metadata can advertise reasoning choices.
 */
export declare function parseOpenCodeModels(stdout: string): RuntimeModelOption[] | null;
export declare const opencodeAgentDef: {
    helpArgs: string[];
    capabilityFlags: {
        "--dangerously-skip-permissions": string;
    };
    id: string;
    name: string;
    bin: string;
    fallbackBins: string[];
    versionArgs: string[];
    listModels: {
        args: string[];
        parse: typeof parseOpenCodeModels;
        timeoutMs: number;
    };
    fallbackModels: RuntimeModelOption[];
    buildArgs: (_prompt: string, _imagePaths: string[], _extra: string[] | undefined, options?: import("../types.js").RuntimeBuildOptions | undefined, runtimeContext?: import("../types.js").RuntimeContext | undefined) => string[];
    promptViaStdin: true;
    resumesSessionViaCli: true;
    capturesSessionIdFromStream: true;
    streamFormat: string;
    eventParser: string;
    externalMcpInjection: "opencode-env-content";
};
