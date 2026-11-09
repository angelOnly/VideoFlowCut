type Part = {
    sha256: string;
    bytes: number;
};
type Receipt = {
    project: string;
    run_id: string;
    frozen_version: string;
    bundle_sha256: string;
    source: Part;
    manifest: Part;
};
/** 与 VFC 相同的字段顺序：源码和清单的内容身份及字节数。 */
export declare const frozenMotionBundleHash: (source: Part, manifest: Part) => string;
/** 从已原子发布的回执发现阶段作品，不读取或复制源码。 */
export declare function listFrozenWorks(dataRoot: string, project: string, runId: string): Promise<Receipt[]>;
/** 作者显式交件时才配对源码与清单；冻结阶段不得重新配对。 */
export declare function prepareAuthoredWorkSubmission(projectsRoot: string, projectId: string, sourcePath: string, manifestPath: string, metadata?: unknown): Promise<{
    authorSubmissionId: any;
    contract_version: string;
    source_sha256: string;
    manifest_sha256: string;
}>;
export declare function freezeProjectWork(input: {
    projectsRoot: string;
    dataRoot: string;
    project: string;
    runId: string;
    sourcePath: string;
    manifestPath: string;
    sourceSha256: string;
    manifestSha256: string;
    metadata?: unknown;
    assertSource?: () => Promise<void>;
}): Promise<Receipt>;
export declare function readFrozenWork(dataRoot: string, project: string, version: string, options?: {
    identityOnly?: boolean;
}): Promise<{
    receipt: Receipt;
    source_base64: string;
    manifest_base64: string;
}>;
export {};
