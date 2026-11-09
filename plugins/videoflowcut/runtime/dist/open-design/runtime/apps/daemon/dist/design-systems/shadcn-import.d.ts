import { type LocalDesignSystemImportOptions, type LocalDesignSystemImportResult } from './import.js';
export type ShadcnFetchResponse = {
    ok: boolean;
    status: number;
    statusText: string;
    text(): Promise<string>;
    headers?: {
        get(name: string): string | null;
    };
    body?: ReadableStream<Uint8Array> | null;
};
export type ShadcnFetch = (url: string, init?: {
    signal?: AbortSignal;
}) => Promise<ShadcnFetchResponse>;
export type ShadcnDesignSystemImportOptions = Pick<LocalDesignSystemImportOptions, 'craftApplies' | 'importMode' | 'name' | 'now' | 'reservedIds'> & {
    /** Injectable fetch for tests / self-hosted registries. Defaults to global fetch. */
    fetchImpl?: ShadcnFetch;
};
export type ParsedShadcnReference = {
    kind: 'url';
    url: string;
    item?: string;
} | {
    kind: 'github';
    owner: string;
    repo: string;
    item: string;
    ref?: string;
};
type ShadcnCssVars = {
    theme?: Record<string, unknown>;
    light?: Record<string, unknown>;
    dark?: Record<string, unknown>;
};
export declare function importShadcnDesignSystemProject(reference: string, tmpRoot: string, userDesignSystemsRoot: string, options?: ShadcnDesignSystemImportOptions): Promise<LocalDesignSystemImportResult>;
export declare function parseShadcnReference(input: string): ParsedShadcnReference;
export declare function renderShadcnSourceCss(cssVars: ShadcnCssVars | undefined): string;
export declare function wrapShadcnColorValue(value: string): string;
export {};
