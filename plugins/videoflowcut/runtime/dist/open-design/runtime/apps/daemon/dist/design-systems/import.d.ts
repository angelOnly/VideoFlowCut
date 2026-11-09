export type LocalDesignSystemImportResult = {
    id: string;
    dir: string;
    files: string[];
};
export type LocalDesignSystemImportOptions = {
    now?: Date;
    name?: string;
    fallbackName?: string;
    reservedIds?: Iterable<string>;
    source?: DesignSystemProjectSource;
    importMode?: 'normalized' | 'hybrid' | 'verbatim';
    craftApplies?: string[];
};
export type DesignSystemProjectSource = {
    type: 'local';
    path: string;
    importedAt?: string;
} | {
    type: 'github';
    url: string;
    branch?: string;
    commit?: string;
    importedAt?: string;
} | {
    type: 'shadcn';
    reference: string;
    registryUrl?: string;
    item?: string;
    homepage?: string;
    importedAt?: string;
};
export declare function importLocalDesignSystemProject(sourceRootInput: string, userDesignSystemsRoot: string, options?: LocalDesignSystemImportOptions): Promise<LocalDesignSystemImportResult>;
export declare class LocalDesignSystemImportError extends Error {
    readonly code: 'BAD_REQUEST' | 'INTERNAL_ERROR';
    constructor(code: 'BAD_REQUEST' | 'INTERNAL_ERROR', message: string);
}
