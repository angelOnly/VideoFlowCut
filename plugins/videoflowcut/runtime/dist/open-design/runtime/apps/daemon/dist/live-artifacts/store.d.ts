import type { BoundedJsonObject, LiveArtifact, LiveArtifactProvenance, LiveArtifactRefreshErrorRecord, LiveArtifactRefreshLogEntry, LiveArtifactRefreshSourceMetadata, LiveArtifactRefreshStepStatus, LiveArtifactValidationIssue } from './schema.js';
export type LiveArtifactSummary = Omit<LiveArtifact, 'document'> & {
    hasDocument: boolean;
};
export declare const LIVE_ARTIFACTS_DIR_NAME: '.live-artifacts';
export declare const LIVE_ARTIFACT_ARTIFACT_FILE: 'artifact.json';
export declare const LIVE_ARTIFACT_TEMPLATE_FILE: 'template.html';
export declare const LIVE_ARTIFACT_PREVIEW_FILE: 'index.html';
export declare const LIVE_ARTIFACT_DATA_FILE: 'data.json';
export declare const LIVE_ARTIFACT_PROVENANCE_FILE: 'provenance.json';
export declare const LIVE_ARTIFACT_REFRESHES_FILE: 'refreshes.jsonl';
export declare const LIVE_ARTIFACT_REFRESH_LOCK_FILE: 'refresh.lock.json';
export declare const LIVE_ARTIFACT_REFRESH_STATE_FILE: 'refresh-state.json';
export declare const LIVE_ARTIFACT_SNAPSHOTS_DIR: 'snapshots';
export interface LiveArtifactStorePaths {
    projectDir: string;
    rootDir: string;
    artifactDir: string;
    artifactJsonPath: string;
    templateHtmlPath: string;
    generatedPreviewHtmlPath: string;
    dataJsonPath: string;
    provenanceJsonPath: string;
    refreshesJsonlPath: string;
    refreshLockPath: string;
    refreshStatePath: string;
    snapshotsDir: string;
}
export interface LiveArtifactStoreSummary {
    artifact: LiveArtifactSummary;
    paths: LiveArtifactStorePaths;
}
export interface LiveArtifactStoreRecord {
    artifact: LiveArtifact;
    paths: LiveArtifactStorePaths;
}
export interface GenerateLiveArtifactIdOptions {
    title: string;
    slug?: string;
    randomSuffix?: string;
}
export interface CreateLiveArtifactOptions {
    projectsRoot: string;
    projectId: string;
    input: unknown;
    templateHtml?: string;
    provenanceJson?: LiveArtifactProvenance;
    createdByRunId?: string;
    now?: Date;
}
export interface ListLiveArtifactsOptions {
    projectsRoot: string;
    projectId: string;
}
export interface GetLiveArtifactOptions {
    projectsRoot: string;
    projectId: string;
    artifactId: string;
}
export interface UpdateLiveArtifactOptions {
    projectsRoot: string;
    projectId: string;
    artifactId: string;
    input: unknown;
    templateHtml?: string;
    provenanceJson?: LiveArtifactProvenance;
    now?: Date;
}
export interface DeleteLiveArtifactOptions {
    projectsRoot: string;
    projectId: string;
    artifactId: string;
}
export interface RegenerateLiveArtifactPreviewOptions {
    projectsRoot: string;
    projectId: string;
    artifactId: string;
}
export interface AcquireLiveArtifactRefreshLockOptions {
    projectsRoot: string;
    projectId: string;
    artifactId: string;
    now?: Date;
}
export interface AppendLiveArtifactRefreshLogEntryOptions {
    projectsRoot: string;
    projectId: string;
    artifactId: string;
    refreshId: string;
    sequence: number;
    step: string;
    status: LiveArtifactRefreshStepStatus;
    startedAt: Date | string;
    finishedAt?: Date | string;
    durationMs?: number;
    source?: LiveArtifactRefreshSourceMetadata;
    error?: LiveArtifactRefreshErrorRecord | unknown;
    metadata?: BoundedJsonObject;
    now?: Date;
}
export interface ListLiveArtifactRefreshLogEntriesOptions {
    projectsRoot: string;
    projectId: string;
    artifactId: string;
}
export interface MarkLiveArtifactRefreshCommittedOptions {
    projectsRoot: string;
    projectId: string;
    artifactId: string;
    refreshId: string;
}
export interface MarkLiveArtifactRefreshRunningOptions extends MarkLiveArtifactRefreshCommittedOptions {
    now?: Date;
}
export interface CommitLiveArtifactRefreshCandidateOptions extends MarkLiveArtifactRefreshCommittedOptions {
    dataJson: BoundedJsonObject;
    provenanceJson?: LiveArtifactProvenance;
    now?: Date;
}
export interface MarkLiveArtifactRefreshFailedOptions extends MarkLiveArtifactRefreshCommittedOptions {
    now?: Date;
}
export interface RecoverStaleLiveArtifactRefreshesOptions {
    projectsRoot: string;
    now?: Date;
    staleAfterMs?: number;
}
export interface LiveArtifactRefreshRecoveryResult {
    projectId: string;
    artifactId: string;
    refreshId: string;
    status: 'recovered' | 'skipped';
    reason?: string;
}
export interface LiveArtifactPreviewRenderRecord extends LiveArtifactStoreRecord {
    html: string;
}
export interface LiveArtifactRefreshLockMetadata {
    schemaVersion: 1;
    projectId: string;
    artifactId: string;
    refreshId: string;
    refreshOrdinal: number;
    acquiredAt: string;
    lockId: string;
}
export interface LiveArtifactRefreshState {
    schemaVersion: 1;
    projectId: string;
    artifactId: string;
    nextRefreshOrdinal: number;
    lastCommittedRefreshId?: string;
    lastCommittedRefreshOrdinal?: number;
}
export interface LiveArtifactRefreshLock {
    artifactId: string;
    lockPath: string;
    metadata: LiveArtifactRefreshLockMetadata;
}
export declare class LiveArtifactStoreValidationError extends Error {
    readonly issues: LiveArtifactValidationIssue[];
    constructor(message: string, issues: LiveArtifactValidationIssue[]);
}
export declare class LiveArtifactRefreshLockError extends Error {
    readonly projectId: string;
    readonly artifactId: string;
    readonly lockPath: string;
    constructor(message: string, options: {
        projectId: string;
        artifactId: string;
        lockPath: string;
    });
}
export declare class LiveArtifactStaleRefreshError extends Error {
    readonly projectId: string;
    readonly artifactId: string;
    readonly refreshId: string;
    readonly lastCommittedRefreshId?: string;
    constructor(message: string, options: {
        projectId: string;
        artifactId: string;
        refreshId: string;
        lastCommittedRefreshId?: string;
    });
}
export declare function generateLiveArtifactSlug(input: string): string;
export declare function generateLiveArtifactId(options: GenerateLiveArtifactIdOptions): string;
export declare function validateLiveArtifactStorageId(artifactId: string): string;
export declare function liveArtifactsRootDir(projectsRoot: string, projectId: string): string;
export declare function liveArtifactStorePaths(projectsRoot: string, projectId: string, artifactId: string): LiveArtifactStorePaths;
export declare function ensureLiveArtifactStoreLayout(projectsRoot: string, projectId: string, artifactId: string): Promise<LiveArtifactStorePaths>;
export declare function compactLiveArtifactRefreshError(error: unknown): LiveArtifactRefreshErrorRecord;
export declare function createLiveArtifact(options: CreateLiveArtifactOptions): Promise<LiveArtifactStoreRecord>;
export declare function listLiveArtifacts(options: ListLiveArtifactsOptions): Promise<LiveArtifactSummary[]>;
export declare function getLiveArtifact(options: GetLiveArtifactOptions): Promise<LiveArtifactStoreRecord>;
export declare function appendLiveArtifactRefreshLogEntry(options: AppendLiveArtifactRefreshLogEntryOptions): Promise<LiveArtifactRefreshLogEntry>;
export declare function acquireLiveArtifactRefreshLock(options: AcquireLiveArtifactRefreshLockOptions): Promise<LiveArtifactRefreshLock>;
export declare function markLiveArtifactRefreshCommitted(options: MarkLiveArtifactRefreshCommittedOptions): Promise<LiveArtifactRefreshState>;
export declare function markLiveArtifactRefreshRunning(options: MarkLiveArtifactRefreshRunningOptions): Promise<LiveArtifactStoreRecord>;
export declare function commitLiveArtifactRefreshCandidate(options: CommitLiveArtifactRefreshCandidateOptions): Promise<LiveArtifactStoreRecord>;
export declare function markLiveArtifactRefreshFailed(options: MarkLiveArtifactRefreshFailedOptions): Promise<LiveArtifactStoreRecord>;
export declare function releaseLiveArtifactRefreshLock(lock: LiveArtifactRefreshLock): Promise<void>;
export declare function withLiveArtifactRefreshLock<T>(options: AcquireLiveArtifactRefreshLockOptions, callback: (lock: LiveArtifactRefreshLock) => Promise<T>): Promise<T>;
export declare function listLiveArtifactRefreshLogEntries(options: ListLiveArtifactRefreshLogEntriesOptions): Promise<LiveArtifactRefreshLogEntry[]>;
export declare function recoverStaleLiveArtifactRefreshes(options: RecoverStaleLiveArtifactRefreshesOptions): Promise<LiveArtifactRefreshRecoveryResult[]>;
export declare function regenerateLiveArtifactPreview(options: RegenerateLiveArtifactPreviewOptions): Promise<LiveArtifactPreviewRenderRecord>;
export declare function ensureLiveArtifactPreview(options: RegenerateLiveArtifactPreviewOptions): Promise<LiveArtifactPreviewRenderRecord>;
export type LiveArtifactCodeVariant = 'template' | 'rendered';
export declare function readLiveArtifactCode(options: RegenerateLiveArtifactPreviewOptions & {
    variant: LiveArtifactCodeVariant;
}): Promise<string>;
export declare function updateLiveArtifact(options: UpdateLiveArtifactOptions): Promise<LiveArtifactStoreRecord>;
export declare function deleteLiveArtifact(options: DeleteLiveArtifactOptions): Promise<void>;
export declare function summarizeLiveArtifactRecord(record: LiveArtifactStoreRecord): LiveArtifactStoreSummary;
