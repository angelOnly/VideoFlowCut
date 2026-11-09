export interface RunEventRecordLike {
    event: string;
    data: unknown;
}
export interface ProjectMetadataForAnalytics {
    kind?: string | null;
    videoModel?: string | null;
    fidelity?: string | null;
    intent?: string | null;
    platform?: string | null;
    platformTargets?: readonly string[] | null;
    importedFrom?: unknown;
}
export interface RunRetrySideEffects {
    userVisibleOutputSeen: boolean;
    toolCallSeen: boolean;
    artifactWriteSeen: boolean;
    liveArtifactSeen: boolean;
}
export declare function resolveRunProjectKindForAnalytics({ hintProjectKind, projectMetadata, }: {
    hintProjectKind?: unknown;
    projectMetadata?: ProjectMetadataForAnalytics | null;
}): string | null;
export declare function scanRunEventsForFinishedProps(events: RunEventRecordLike[], reqBodyModel: unknown): {
    inputTokens?: number;
    outputTokens?: number;
    agentReportedModel: string | null;
};
export declare function scanRunEventsForRetrySideEffects(events: unknown): RunRetrySideEffects;
export interface RunSideEffectLedger {
    userVisibleOutputSeen: boolean;
    toolCallSeen: boolean;
    directArtifactEventSeen: boolean;
    liveArtifactSeen: boolean;
    artifactPaths: Set<string>;
    writtenFilePaths: Set<string>;
    designSystemFileWritten: boolean;
    previewModulePaths: Set<string>;
    pendingWritePathById: Map<string, string>;
    /** Terminal-attempt admission evidence, folded before event truncation. */
    admissionEvidence: RunAdmissionEvidence;
}
export interface RunAdmissionEvidence {
    attemptStarted: boolean;
    acp: boolean;
    promptSent: boolean;
    executionEvidenceSeen: boolean;
    terminalSeen: boolean;
}
export declare function createRunSideEffectLedger(): RunSideEffectLedger;
export declare function foldEventIntoRunSideEffectLedger(ledger: RunSideEffectLedger, record: {
    event?: unknown;
    data?: unknown;
}): void;
export declare function sideEffectsFromLedger(ledger: RunSideEffectLedger): RunRetrySideEffects;
export declare function runSideEffectsForRun(run: {
    sideEffectLedger?: RunSideEffectLedger;
    events?: unknown;
}): RunRetrySideEffects;
export declare function runAdmissionEvidenceForRun(run: {
    sideEffectLedger?: RunSideEffectLedger;
    events?: unknown;
}): RunAdmissionEvidence | undefined;
export declare function runArtifactCountForRun(run: {
    sideEffectLedger?: RunSideEffectLedger;
    events?: unknown;
}): number;
export declare function runFilesWrittenForRun(run: {
    sideEffectLedger?: RunSideEffectLedger;
    events?: unknown;
}): number;
export declare function runDesignSystemCreatedForRun(run: {
    sideEffectLedger?: RunSideEffectLedger;
    events?: unknown;
}): boolean;
export declare function runPreviewModuleCountForRun(run: {
    sideEffectLedger?: RunSideEffectLedger;
    events?: unknown;
}): number;
export declare function retryFinalResultForRunStatus(status: string, retryAttemptCount?: number | null): "failed" | "not_attempted" | "success" | "suppressed";
export declare function runRetryEventsForAnalytics(events: unknown): RunEventRecordLike[];
