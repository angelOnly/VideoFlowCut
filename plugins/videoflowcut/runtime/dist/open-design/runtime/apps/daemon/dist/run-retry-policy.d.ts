import type { TrackingRunFailureCategory, TrackingRunFailureDetail, TrackingRunFailureStage, TrackingRunRetryStrategy, TrackingRunRetrySuppressedReason, TrackingRunResult } from '@open-design/contracts/analytics';
export declare const DEFAULT_SAFE_RUN_RETRY_MAX_ATTEMPTS = 1;
export declare const SAFE_RUN_RETRY_STRATEGY: TrackingRunRetryStrategy;
export declare const NATIVE_SESSION_CONTINUE_STRATEGY: TrackingRunRetryStrategy;
export declare const POST_TOOL_RESUME_CONTINUATION_PROMPT: string;
export declare const RATE_LIMIT_RETRY_BASE_DELAY_MS = 1000;
export declare const TRANSIENT_RETRY_BASE_DELAY_MS = 500;
export declare const RETRY_BACKOFF_MULTIPLIER = 2;
export declare const MAX_RETRY_BACKOFF_DELAY_MS = 8000;
export declare function computeRetryBackoffMs(attemptIndex: number, category: TrackingRunFailureCategory | undefined, random?: () => number): number;
export interface RunRetryFailureSignal {
    failure_category?: TrackingRunFailureCategory;
    failure_detail?: TrackingRunFailureDetail;
    failure_stage?: TrackingRunFailureStage;
    retryable?: boolean;
}
export interface RunRetrySideEffectState {
    cancelRequested?: boolean;
    userVisibleOutputSeen?: boolean;
    toolCallSeen?: boolean;
    artifactWriteSeen?: boolean;
    liveArtifactSeen?: boolean;
}
export interface RunRetryPolicyInput {
    result: TrackingRunResult;
    failure?: RunRetryFailureSignal;
    attemptCount: number;
    maxAttempts?: number;
    sideEffects?: RunRetrySideEffectState;
    random?: () => number;
}
export type RunRetryPolicyDecision = {
    shouldRetry: true;
    retryAttemptIndex: number;
    retryMaxAttempts: number;
    retryStrategy: TrackingRunRetryStrategy;
    retryReason: 'transient_failure' | 'post_tool_resume';
    retryDelayMs: number;
} | {
    shouldRetry: false;
    retryAttemptIndex: number;
    retryMaxAttempts: number;
    retryStrategy: TrackingRunRetryStrategy;
    retrySuppressedReason: TrackingRunRetrySuppressedReason;
};
export interface PostToolResumeRecoveryInput {
    result: TrackingRunResult;
    failure?: RunRetryFailureSignal;
    continuationAttemptCount: number;
    totalRetryAttemptCount: number;
    maxAttempts?: number;
    sideEffects?: RunRetrySideEffectState;
    supportsNativeSessionContinue: boolean;
    hasNativeSession: boolean;
    hasVerifiedAmrContinuation?: boolean;
}
export declare function decidePostToolResumeRecovery(input: PostToolResumeRecoveryInput): Extract<RunRetryPolicyDecision, {
    shouldRetry: true;
}> | null;
export declare function decideSafeRunRetry(input: RunRetryPolicyInput): RunRetryPolicyDecision;
