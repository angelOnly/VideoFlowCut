import type { ArtifactOrigin, ProjectFileVersion, ProjectFileVersionPromptSource } from '@open-design/contracts';
import type { RunArtifactDiff } from './run-artifact-fs.js';
export interface AiHtmlVersionSnapshotInput {
    projectsRoot: string;
    projectId: string;
    projectRoot: string;
    diff: Pick<RunArtifactDiff, 'touchedPaths'>;
    prompt: string | null;
    promptSource?: ProjectFileVersionPromptSource;
    origin?: ArtifactOrigin;
    metadata?: unknown;
}
export interface AiHtmlVersionSnapshotFailure {
    fileName: string;
    message: string;
}
export interface AiHtmlVersionSnapshot {
    fileName: string;
    version: ProjectFileVersion;
}
export interface AiHtmlVersionSnapshotResult {
    snapshots: AiHtmlVersionSnapshot[];
}
export declare function artifactOriginForRun(input: {
    runId: string;
    externalPluginAnalytics?: Record<string, unknown> | null;
}): ArtifactOrigin | undefined;
export declare class AiHtmlVersionSnapshotError extends Error {
    readonly code = "HTML_VERSION_SNAPSHOT_FAILED";
    readonly failures: AiHtmlVersionSnapshotFailure[];
    constructor(failures: AiHtmlVersionSnapshotFailure[]);
}
export declare function snapshotAiHtmlVersionsForRun(input: AiHtmlVersionSnapshotInput): Promise<AiHtmlVersionSnapshotResult>;
