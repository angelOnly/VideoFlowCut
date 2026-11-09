export interface RecentApiFailure {
    at: string;
    method: string;
    path: string;
    status: number;
    code: string;
    retryable: boolean;
    requestId?: string;
}
export interface ApiFailureToRecord extends Omit<RecentApiFailure, 'method' | 'path'> {
    request?: {
        method?: string;
        route?: {
            path?: unknown;
        };
    };
}
export declare function observeApiFailures(listener: (failure: RecentApiFailure) => void): () => void;
export declare function recordApiFailure(failure: ApiFailureToRecord): void;
export declare function readRecentApiFailures(): RecentApiFailure[];
/** Test-only reset for this process-local diagnostic journal. */
export declare function clearRecentApiFailures(): void;
