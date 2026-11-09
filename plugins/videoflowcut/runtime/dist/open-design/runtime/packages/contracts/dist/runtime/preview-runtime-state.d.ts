export declare const PREVIEW_RUNTIME_STATE_VERSION: 1;
export declare const PREVIEW_RUNTIME_STATE_LIMITS: {
    readonly maxElements: 3500;
    readonly maxRoots: 64;
    readonly maxRootHtmlLength: number;
    readonly maxBodyHtmlLength: number;
    readonly maxAttributes: 64;
    readonly maxAttributeNameLength: 128;
    readonly maxAttributeValueLength: 20000;
    readonly maxHashLength: 4096;
    readonly maxTagLength: 32;
    readonly maxPathLength: 64;
    readonly maxPathIndex: 100000;
    readonly maxIdentityLength: 4096;
    readonly maxValueLength: 100000;
};
export type PreviewRuntimeStateEntry = {
    path: number[];
    tag: string;
    id?: string;
    odId?: string;
    attrs: Record<string, string>;
    value?: string;
    checked?: boolean;
    selectedIndex?: number;
    scrollLeft?: number;
    scrollTop?: number;
};
export type PreviewRuntimeStateRoot = {
    path: number[];
    tag: string;
    id?: string;
    odId?: string;
    html: string;
};
export type PreviewRuntimeState = {
    version: typeof PREVIEW_RUNTIME_STATE_VERSION;
    hash: string;
    bodyHtml?: string | null;
    roots?: PreviewRuntimeStateRoot[];
    htmlAttrs: Record<string, string>;
    bodyAttrs: Record<string, string>;
    entries: PreviewRuntimeStateEntry[];
};
export declare function isPreviewRuntimeState(value: unknown): value is PreviewRuntimeState;
//# sourceMappingURL=preview-runtime-state.d.ts.map