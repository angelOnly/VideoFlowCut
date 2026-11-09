import type { BoundedJsonObject, LiveArtifact, LiveArtifactRefreshSourceMetadata, LiveArtifactSource } from './schema.js';
export declare const DEFAULT_LIVE_ARTIFACT_SOURCE_TIMEOUT_MS = 30000;
export declare const DEFAULT_LIVE_ARTIFACT_TOTAL_TIMEOUT_MS = 120000;
export type LiveArtifactRefreshAbortKind = 'cancelled' | 'source_timeout' | 'total_timeout';
export interface LiveArtifactRefreshTimeouts {
    sourceTimeoutMs: number;
    totalTimeoutMs: number;
}
export interface LiveArtifactRefreshRunScope {
    projectId: string;
    artifactId: string;
    refreshId: string;
}
export interface LiveArtifactRefreshRun extends LiveArtifactRefreshRunScope {
    readonly signal: AbortSignal;
    readonly startedAt: Date;
}
export interface LiveArtifactRefreshRunOptions extends LiveArtifactRefreshRunScope {
    totalTimeoutMs?: number;
    now?: Date;
}
export interface LiveArtifactRefreshSourceExecutionOptions {
    step: string;
    source?: LiveArtifactRefreshSourceMetadata;
    sourceTimeoutMs?: number;
}
export type LocalDaemonRefreshToolName = 'project_files.search' | 'project_files.read_json' | 'git.summary' | 'public_github_repository_metric';
export interface ExecuteLocalDaemonRefreshSourceOptions {
    projectsRoot: string;
    projectId: string;
    source: LiveArtifactSource;
    signal?: AbortSignal;
}
export interface ApplyLiveArtifactOutputMappingOptions {
    source: LiveArtifactSource;
    output: BoundedJsonObject;
}
export interface LiveArtifactRefreshDocumentOutput {
    output: BoundedJsonObject;
}
export interface BuildLiveArtifactRefreshCandidateOptions {
    artifact: LiveArtifact;
    currentDataJson: BoundedJsonObject;
    documentOutput?: LiveArtifactRefreshDocumentOutput;
    now?: Date;
}
export interface LiveArtifactRefreshCandidate {
    dataJson: BoundedJsonObject;
}
export interface ProjectFilesSearchInput extends BoundedJsonObject {
    query?: string;
    maxResults?: number;
}
export interface ProjectFilesReadJsonInput extends BoundedJsonObject {
    path?: string;
    file?: string;
    name?: string;
}
export interface GitSummaryInput extends BoundedJsonObject {
    maxCommits?: number;
}
export interface PublicGithubRepositoryMetricInput extends BoundedJsonObject {
    url?: string;
    fields?: string[];
}
export declare class LiveArtifactRefreshAbortError extends Error {
    readonly kind: LiveArtifactRefreshAbortKind;
    readonly projectId: string;
    readonly artifactId: string;
    readonly refreshId: string;
    readonly timeoutMs?: number;
    readonly step?: string;
    constructor(message: string, options: LiveArtifactRefreshRunScope & {
        kind: LiveArtifactRefreshAbortKind;
        timeoutMs?: number;
        step?: string;
    });
}
export declare function normalizeLiveArtifactRefreshTimeouts(options?: Partial<LiveArtifactRefreshTimeouts>): LiveArtifactRefreshTimeouts;
export declare class LiveArtifactRefreshRunRegistry {
    private readonly runs;
    startRun(options: LiveArtifactRefreshRunOptions): LiveArtifactRefreshRun;
    finishRun(run: LiveArtifactRefreshRunScope): void;
    cancelRun(scope: LiveArtifactRefreshRunScope, reason?: string): boolean;
    hasRun(scope: LiveArtifactRefreshRunScope): boolean;
}
export declare const liveArtifactRefreshRunRegistry: LiveArtifactRefreshRunRegistry;
export declare function withLiveArtifactRefreshRun<T>(registry: LiveArtifactRefreshRunRegistry, options: LiveArtifactRefreshRunOptions, callback: (run: LiveArtifactRefreshRun) => Promise<T>): Promise<T>;
export declare function withLiveArtifactRefreshSourceTimeout<T>(run: LiveArtifactRefreshRun, options: LiveArtifactRefreshSourceExecutionOptions, callback: (signal: AbortSignal) => Promise<T>): Promise<T>;
export declare function applyLiveArtifactOutputMapping(options: ApplyLiveArtifactOutputMappingOptions): BoundedJsonObject;
export declare function buildLiveArtifactRefreshCandidate(options: BuildLiveArtifactRefreshCandidateOptions): LiveArtifactRefreshCandidate;
export declare function executeLocalDaemonRefreshSource(options: ExecuteLocalDaemonRefreshSourceOptions): Promise<BoundedJsonObject>;
