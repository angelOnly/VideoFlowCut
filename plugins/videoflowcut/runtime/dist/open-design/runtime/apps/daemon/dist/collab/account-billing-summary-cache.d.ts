import type { WorkspaceBillingSummary } from '@open-design/contracts';
export interface AccountBillingSummaryCacheOptions {
    identity(): string;
    fetch(): Promise<WorkspaceBillingSummary | null>;
    ttlMs?: number;
    negativeTtlMs?: number;
    maxEntries?: number;
    now?: () => number;
}
export interface AccountBillingSummaryCache {
    read(): Promise<WorkspaceBillingSummary | null>;
    invalidate(token?: string): void;
    clear(): void;
}
/**
 * Process-local account billing cache, partitioned by the current credential
 * revision. Concurrent readers share one command. If an SSE invalidation lands
 * during that command, readers wait for at most one sequential trailing fetch
 * instead of starting another process in parallel.
 */
export declare function createAccountBillingSummaryCache(options: AccountBillingSummaryCacheOptions): AccountBillingSummaryCache;
