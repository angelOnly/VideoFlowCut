export type ImageGenerationRetryReason = 'rate_limit_429' | 'service_unavailable_503';
export type ImageGenerationRequestSummary = {
    attemptCount: number;
    retryCount: number;
    initialResponseStatus?: number;
    responseStatus?: number;
    retryReason?: ImageGenerationRetryReason;
    retryAfterMs?: number;
    retryDelayMs?: number;
    retryFinalResult: 'not_attempted' | 'success' | 'failed' | 'skipped_retry_after_budget';
};
type RetryDependencies = {
    now?: () => number;
    random?: () => number;
    sleep?: (delayMs: number) => Promise<void>;
};
export declare function fetchImageGenerationWithResponseRetry(issueRequest: () => Promise<Response>, onSettled?: (summary: ImageGenerationRequestSummary) => void, dependencies?: RetryDependencies): Promise<Response>;
export {};
