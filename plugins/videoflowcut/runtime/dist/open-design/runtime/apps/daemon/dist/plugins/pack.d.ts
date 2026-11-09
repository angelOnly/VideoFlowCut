export interface PackPluginInput {
    folder: string;
    out?: string;
}
export interface PackPluginResult {
    outPath: string;
    bytes: number;
    files: string[];
    pluginId?: string;
    pluginVersion?: string;
}
export declare class PackPluginError extends Error {
    constructor(message: string);
}
export declare function packPlugin(input: PackPluginInput): Promise<PackPluginResult>;
