export declare const MAX_STANDALONE_ENTRY_BYTES: number;
export declare const MAX_STANDALONE_FIRST_LEVEL_CANDIDATES = 500;
export declare const MAX_STANDALONE_GRAPH_NODES = 2500;
export declare const MAX_STANDALONE_ASSET_BYTES: number;
export declare const MAX_STANDALONE_RAW_BYTES: number;
export declare const MAX_STANDALONE_OUTPUT_BYTES: number;
export type StandaloneHtmlExportErrorKind = 'dependency-cycle' | 'invalid-source' | 'limit-exceeded' | 'missing-local-dependency' | 'path-outside-project' | 'unpersistable-url';
export declare class StandaloneHtmlExportError extends Error {
    readonly kind: StandaloneHtmlExportErrorKind;
    readonly dependency?: string | undefined;
    readonly chain: string[];
    readonly limit?: string | undefined;
    constructor(message: string, kind: StandaloneHtmlExportErrorKind, dependency?: string | undefined, chain?: string[], limit?: string | undefined);
}
export interface StandaloneAssetHandle {
    readonly buffer?: Buffer;
    readonly mime: string;
    readonly size: number;
    read?(): Promise<Buffer>;
}
export interface StandaloneAssetReader {
    (projectPath: string): Promise<StandaloneAssetHandle | null>;
}
export interface StandaloneHtmlOptions {
    entryPath: string;
    html: string;
    readAsset: StandaloneAssetReader;
    limits?: Partial<StandaloneHtmlLimits>;
}
export interface StandaloneHtmlLimits {
    entryBytes: number;
    firstLevelCandidates: number;
    graphNodes: number;
    assetBytes: number;
    rawBytes: number;
    outputBytes: number;
}
export interface StandaloneHtmlResult {
    html: string;
    externalDependencies: string[];
}
export declare function bundleStandaloneHtml(options: StandaloneHtmlOptions): Promise<StandaloneHtmlResult>;
