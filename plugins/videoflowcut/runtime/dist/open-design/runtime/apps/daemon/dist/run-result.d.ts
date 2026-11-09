export type RunResult = 'success' | 'failed' | 'cancelled';
export interface RunStatusForAnalytics {
    status: string;
    errorCode?: string | null;
    exitCode?: number | null;
    signal?: string | null;
}
export declare function runResultFromStatus(status: string | undefined): RunResult;
export declare function deriveRunErrorCode(status: RunStatusForAnalytics): string | undefined;
