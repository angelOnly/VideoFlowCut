import { type MediaExecutionPolicy, type OdNextProductionTaskTypeV1, type OdNextTaskConfigurationV1 } from '@open-design/contracts';
export declare const DEFAULT_OD_NEXT_ATTACHMENT_FILE_CAP_BYTES: number;
export declare const DEFAULT_OD_NEXT_ATTACHMENT_TOTAL_CAP_BYTES: number;
export declare const DEFAULT_OD_NEXT_ATTACHMENT_COUNT_CAP = 32;
export declare const DEFAULT_OD_NEXT_INPUT_MANIFEST_CAP_BYTES: number;
export declare class OdNextTaskInputSnapshotError extends Error {
    readonly code: string;
    constructor(message: string, code?: string);
}
export interface OdNextTaskInputSnapshotDescriptor {
    taskExecutionId: string;
    snapshotDir: string;
    manifestSha256: string;
}
export type SnapshotFile = {
    sourcePathHash?: string;
    id: string;
    relativePath: string;
    kind: 'file' | 'image';
    mediaType: string;
    bytes: number;
    sha256: string;
};
export interface LoadedOdNextTaskInputSnapshot {
    taskConfigText: string;
    requestInputText: string;
    taskType: string;
    attachmentFactsText: string;
    workspaceInputFactsText: string;
    attachmentReferences: string[];
    attachmentPaths: string[];
    imagePaths: string[];
    snapshotDir: string;
    files: Array<SnapshotFile & {
        content: Buffer;
    }>;
}
export interface OdNextRunInputProjection {
    taskConfigText: string;
    requestInputText: string;
    attachmentReferences: string[];
    attachmentPaths: string[];
    imagePaths: string[];
    projectionDir: string;
    projectionAccessRoot: string;
}
export interface SnapshotReadLimits {
    manifestCapBytes?: number;
    fileCapBytes?: number;
    totalCapBytes?: number;
    countCap?: number;
}
export interface SnapshotReadHooks {
    beforeOpenManifest?: (manifestPath: string) => void;
    beforeOpenFile?: (filePath: string) => void;
}
export interface SnapshotCleanupHooks {
    beforeLookupSnapshot?: (snapshotsRoot: string) => void;
    beforeClaimSnapshot?: (snapshotDir: string) => void;
    beforeRemoveClaimedSnapshot?: (claimedSnapshotDir: string) => void;
}
export type OdNextTaskInputCleanupPhase = 'create' | 'replace-partial' | 'initial-bundle' | 'run-claim' | 'non-ready';
export declare function buildOdNextTaskConfigurationV1(input: {
    taskType: OdNextProductionTaskTypeV1;
    locale?: unknown;
    selectedAgentId: string;
    sessionMode?: unknown;
    model?: unknown;
    reasoning?: unknown;
    serviceTier?: unknown;
    mediaExecution: MediaExecutionPolicy;
    route?: 'direct_edit' | 'full_plan';
    mode?: 'simple' | 'complex' | 'unresolved';
}): OdNextTaskConfigurationV1;
export declare function createOdNextTaskInputSnapshot(input: {
    snapshotsRoot: string;
    taskExecutionId: string;
    taskConfiguration: OdNextTaskConfigurationV1;
    projectRoot: string;
    projectAttachments?: readonly string[];
    /** Host-owned prior task inputs; validated against the same managed root. */
    inheritedSnapshot?: OdNextTaskInputSnapshotDescriptor;
    uploadRoot: string;
    imagePaths?: readonly string[];
    commentCount?: number;
    linkedDirectoryCount?: number;
    mcpServerCount?: number;
    fileCapBytes?: number;
    totalCapBytes?: number;
    countCap?: number;
    beforeOpenSource?: (sourcePath: string) => void;
    afterReadSource?: (sourcePath: string) => void;
}): OdNextTaskInputSnapshotDescriptor;
export declare function loadOdNextTaskInputSnapshot(descriptor: OdNextTaskInputSnapshotDescriptor, snapshotsRoot: string, limits?: SnapshotReadLimits, hooks?: SnapshotReadHooks): LoadedOdNextTaskInputSnapshot;
export declare function createOdNextRunInputProjection(input: {
    descriptor: OdNextTaskInputSnapshotDescriptor;
    snapshotsRoot: string;
    projectionsRoot: string;
    runId: string;
    limits?: SnapshotReadLimits;
    hooks?: SnapshotReadHooks;
}): OdNextRunInputProjection;
/**
 * Remove one immutable per-Run projection and its now-empty task directory.
 * Canonical task inputs are intentionally untouched; only the disposable
 * projection returned by createOdNextRunInputProjection is accepted.
 */
export declare function removeOdNextRunInputProjection(projection: Pick<OdNextRunInputProjection, 'projectionDir' | 'projectionAccessRoot'>): void;
export declare function removeOdNextTaskInputSnapshot(descriptor: OdNextTaskInputSnapshotDescriptor | null | undefined, snapshotsRoot: string, hooks?: SnapshotCleanupHooks): void;
export declare function removeOdNextTaskInputSnapshotBestEffort(descriptor: OdNextTaskInputSnapshotDescriptor | null | undefined, snapshotsRoot: string, phase: OdNextTaskInputCleanupPhase): void;
