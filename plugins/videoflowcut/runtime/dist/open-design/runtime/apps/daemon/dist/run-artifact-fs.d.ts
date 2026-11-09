export interface ArtifactFingerprint {
    size: number;
    mtimeMs: number;
    hash: string | null;
    manifestBacked?: boolean;
}
export type ArtifactSnapshot = Map<string, ArtifactFingerprint>;
export declare function snapshotProjectArtifacts(rootDir: string): ArtifactSnapshot;
export declare function snapshotProjectArtifactsAsync(rootDir: string): Promise<ArtifactSnapshot>;
export interface RunArtifactDiff {
    /** A best-effort scan cannot establish zero writes when either side was incomplete. */
    filesWrittenUnknown?: true;
    created: number;
    modified: number;
    touched: number;
    designSystemCreated: boolean;
    previewModuleCount: number;
    touchedPaths: string[];
    contentCreated: number;
    contentModified: number;
    contentTouched: number;
    contentTouchedPaths: string[];
    renderDependencyTouched: number;
    renderDependencyTouchedPaths: string[];
    supportingMediaTouched: number;
    filesWritten: number;
}
export declare function diffRunArtifacts(before: ArtifactSnapshot, after: ArtifactSnapshot): RunArtifactDiff;
export type PrimaryArtifactChange = 'none' | 'created' | 'modified';
export declare function primaryArtifactChangeForRun(input: {
    diff: RunArtifactDiff;
    projectKind: string | null;
    hadExistingArtifacts: boolean;
    interactionMode?: string;
    clarificationRequested: boolean;
}): PrimaryArtifactChange | undefined;
export declare function supportingAssetFilesChangedForRun(diff: RunArtifactDiff, projectKind: string | null): number | undefined;
export interface RunArtifactBaseline {
    cwd: string;
    before: ArtifactSnapshot;
    contended: boolean;
}
export declare function createRunArtifactBaselines(cap?: number): {
    remember(runId: string, cwd: string, before: ArtifactSnapshot): void;
    peek(runId: string): RunArtifactBaseline | undefined;
    take(runId: string): RunArtifactBaseline | undefined;
};
