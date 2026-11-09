interface ShareStagingFile {
    file: string;
    data: Buffer | Uint8Array | string;
}
/**
 * Materialize a share plan without merging distinct public paths. The source
 * and temporary volumes can have different case/Unicode equivalence rules.
 * Refuse before upload if the destination cannot represent the plan exactly;
 * changing URL spelling would break the document's references.
 * The caller owns a fresh private directory and cleans it on every outcome.
 */
export declare function stageShareFiles(directory: string, files: readonly ShareStagingFile[]): Promise<void>;
export {};
