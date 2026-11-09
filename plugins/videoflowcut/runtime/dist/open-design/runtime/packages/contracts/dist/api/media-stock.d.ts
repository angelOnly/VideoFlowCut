export type StockProvider = string;
/** Stable service-managed channel IDs; never URLs or credentials. */
export declare const isStockProvider: (value: unknown) => value is StockProvider;
export type StockOrientation = 'landscape' | 'portrait' | 'square';
/** Quota headers describe the monthly API window, not the hourly budget. */
export type StockRateLimit = {
    period: 'month';
    limit: number | null;
    remaining: number | null;
    resetUnix: number | null;
};
export type StockSearchAttempt = {
    provider: StockProvider;
    stage: 'search' | 'download';
    status: 'ok' | 'not_found' | 'error';
    timestamp: string;
    /** Monotonic elapsed time; downloads include decoding and writing bytes. */
    durationMs: number;
    httpStatus: number | null;
    rateLimited: boolean;
    rateLimit?: StockRateLimit;
    retryAfter?: string;
    error?: string;
};
export type StockSlot = {
    id: string;
    query: string;
    /** Display width in CSS pixels; the file is requested at this width. */
    width?: number;
    orientation?: StockOrientation;
};
export type StockSlotResult = {
    id: string;
    query: string;
    status: 'ok' | 'not_found' | 'error' | 'budget_exceeded';
    provider?: StockProvider;
    path?: string;
    width?: number;
    height?: number;
    bytes?: number;
    alt?: string;
    author?: string;
    authorUrl?: string;
    sourceUrl?: string;
    license?: string;
    error?: string;
    /** Includes failed providers even when a later provider succeeds. */
    attempts?: StockSearchAttempt[];
};
export type StockSearchReport = {
    providers: StockProvider[];
    slots: StockSlotResult[];
};
export interface StockSearchRequest {
    slots: StockSlot[];
    /** Relative to the authorized project; defaults to assets/stock. */
    outDir?: string;
    requestTimeoutMs?: number;
    budgetMs?: number;
    concurrency?: number;
}
export interface StockSearchResponse extends StockSearchReport {
    telemetry: {
        callId: string;
        collectionStatus: 'complete' | 'failed' | 'disabled';
    };
}
/** The caller cannot supply credentials, cwd, or project/run authority. */
export declare function parseStockSearchRequest(input: unknown): StockSearchRequest;
//# sourceMappingURL=media-stock.d.ts.map