declare function parseModels(stdout: string): {
    id: string;
    label: string;
    reasoningOptions?: {
        id: string;
        label: string;
        default?: boolean;
    }[];
}[] | null;
export declare function hasOpenDesignProfile(env: NodeJS.ProcessEnv): boolean;
export declare function resolveOpenDesignProfileDir(env: NodeJS.ProcessEnv): string;
export declare function parseDeepSeekHarnessVersion(raw: string): string | null;
export declare const deepseekHarnessAgentDef: {
    id: string;
    name: string;
    bin: string;
    versionArgs: string[];
    versionPolicy: {
        supportedVersions: string[];
        supportedVersionPattern: RegExp;
        requireVersion: true;
        parse: typeof parseDeepSeekHarnessVersion;
    };
    compatibilityProbe: {
        args: string[];
        timeoutMs: number;
        preflight: typeof hasOpenDesignProfile;
        parse: (stdout: string) => string;
    };
    listModels: {
        args: string[];
        parse: typeof parseModels;
        timeoutMs: number;
    };
    fallbackModels: import("../types.js").RuntimeModelOption[];
    buildArgs: () => string[];
    promptViaStdin: true;
    streamFormat: string;
    resumesSessionViaProfileStdio: true;
    capturesSessionIdFromStream: true;
    supportsCustomModel: false;
};
export {};
