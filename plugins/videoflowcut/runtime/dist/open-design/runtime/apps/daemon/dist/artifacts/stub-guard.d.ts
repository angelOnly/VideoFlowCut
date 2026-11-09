export type ArtifactStubGuardMode = 'reject' | 'warn' | 'off';
export interface ArtifactStubGuardConfig {
    mode: ArtifactStubGuardMode;
    minRetainedRatio: number;
    minPriorBytes: number;
}
export interface PriorArtifactSibling {
    name: string;
    size: number;
}
export interface ArtifactStubGuardWarning {
    code: 'ARTIFACT_REGRESSION';
    message: string;
    identifier: string;
    newSize: number;
    priorSize: number;
    priorName: string;
}
export interface EvaluateArtifactStubGuardInput {
    scanDir: string;
    identifier: string;
    newSize: number;
    config: ArtifactStubGuardConfig;
}
export interface EvaluateArtifactStubGuardResult {
    outcome: 'pass' | 'warn' | 'reject';
    warning?: ArtifactStubGuardWarning;
}
export declare class ArtifactRegressionError extends Error {
    readonly code = "ARTIFACT_REGRESSION";
    readonly identifier: string;
    readonly newSize: number;
    readonly priorSize: number;
    readonly priorName: string;
    constructor(message: string, details: {
        identifier: string;
        newSize: number;
        priorSize: number;
        priorName: string;
    });
}
export declare const DEFAULT_ARTIFACT_STUB_GUARD_CONFIG: ArtifactStubGuardConfig;
export declare const STUB_GUARDED_MANIFEST_KINDS: ReadonlySet<string>;
export declare function slugifyArtifactIdentifier(value: string): string;
export declare const EMPTY_SLUG_FALLBACK_NAME = "artifact";
export declare function artifactIdentifiersMatch(a: string, b: string): boolean;
export declare function findPriorArtifactSiblings(scanDir: string, identifier: string): Promise<PriorArtifactSibling[]>;
export declare function readArtifactStubGuardConfigFromEnv(env?: NodeJS.ProcessEnv): ArtifactStubGuardConfig;
export declare function classifyArtifactStubGuard(priors: PriorArtifactSibling[], identifier: string, newSize: number, config: ArtifactStubGuardConfig): EvaluateArtifactStubGuardResult;
export declare function evaluateArtifactStubGuard(input: EvaluateArtifactStubGuardInput): Promise<EvaluateArtifactStubGuardResult>;
