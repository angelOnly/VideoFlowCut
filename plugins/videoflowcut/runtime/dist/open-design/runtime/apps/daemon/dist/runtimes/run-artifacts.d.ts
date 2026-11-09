import type { TrackingRunResult } from '@open-design/contracts/analytics';
export declare const WRITE_OR_EDIT_TOOL_NAMES: ReadonlySet<string>;
export declare function extractToolFilePath(input: unknown): string | null;
export declare function isArtifactPath(path: string): boolean;
export declare function isDesignSystemFile(path: string): boolean;
export declare function isPreviewModulePath(path: string): boolean;
export interface RunEventLike {
    event?: string;
    data?: unknown;
}
export declare function readToolUseId(data: unknown): string | null;
export declare function readToolResultId(data: unknown): string | null;
export declare function readToolResultIsError(data: unknown): boolean;
export declare function didRunCreateDesignSystemFile(events: readonly RunEventLike[]): boolean;
export declare function countDesignSystemPreviewModules(events: readonly RunEventLike[]): number;
export declare function countNewArtifacts(events: readonly RunEventLike[]): number;
export declare function countWrittenFiles(events: readonly RunEventLike[]): number;
export declare function runAskedUserQuestion(events: readonly RunEventLike[]): boolean;
export declare function reconstructAssistantText(events: readonly RunEventLike[]): string;
export declare function deriveActivationMilestones(args: {
    result: TrackingRunResult;
    artifactCount: number;
    designSystemCreated: boolean;
    isDesignSystemRun: boolean;
    capturedAtIso: string;
}): {
    first_artifact_at?: string;
    first_design_system_at?: string;
} | undefined;
