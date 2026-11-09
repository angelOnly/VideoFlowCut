interface RunEventRecord {
    event?: unknown;
    data?: unknown;
}
export declare function extractOrbitAgentFinalExplanation(events: readonly RunEventRecord[]): string | null;
export declare function buildOrbitNoLiveArtifactSummary(events: readonly RunEventRecord[]): string;
export {};
