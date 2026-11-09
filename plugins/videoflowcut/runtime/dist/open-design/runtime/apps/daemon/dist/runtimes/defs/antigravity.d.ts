export declare function encodeAntigravityStdinPrompt(prompt: string): string;
export declare function writeAntigravityModelSelection(label: string, settingsPath?: string): void;
export declare function acquireAntigravityModelLock(): Promise<() => void>;
export declare function _resetAntigravityModelLockForTests(): void;
export interface WaitForAgyModelOptions {
    timeoutMs?: number;
    pollIntervalMs?: number;
    readFile?: (path: string) => Promise<string>;
    now?: () => number;
    abortSignal?: AbortSignal;
}
export declare function waitForAgyToReadModel(logFilePath: string, expectedModel: string, options?: WaitForAgyModelOptions): Promise<boolean>;
export declare const antigravityAgentDef: {
    id: string;
    name: string;
    bin: string;
    versionArgs: string[];
    helpArgs: string[];
    capabilityFlags: {
        "--dangerously-skip-permissions": string;
    };
    fallbackModels: import("../types.js").RuntimeModelOption[];
    supportsCustomModel: false;
    buildArgs: (_prompt: string, _imagePaths: string[], _extra?: string[] | undefined, options?: import("../types.js").RuntimeBuildOptions | undefined, runtimeContext?: import("../types.js").RuntimeContext | undefined) => string[];
    promptViaStdin: true;
    encodeStdinPrompt: typeof encodeAntigravityStdinPrompt;
    streamFormat: string;
    eventParser: string;
    installUrl: string;
    docsUrl: string;
};
