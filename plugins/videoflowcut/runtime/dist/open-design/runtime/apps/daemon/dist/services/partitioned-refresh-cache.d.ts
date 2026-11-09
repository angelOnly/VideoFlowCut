export interface PartitionedRefreshCacheOptions<T> {
    fetch(key: string): Promise<T>;
    /** Return null when this result must not be cached. */
    ttlMs(value: T): number | null;
    maxEntries?: number;
    now?: () => number;
}
export interface PartitionedRefreshReadOptions {
    /** Ignore a settled value, while still joining current-generation work. */
    force?: boolean;
    /**
     * If invalidated while a read is in flight, join that read and perform at
     * most one current-generation trailing refresh before answering.
     */
    revalidateOnInvalidation?: boolean;
}
export interface PartitionedRefreshCache<T> {
    read(key: string, options?: PartitionedRefreshReadOptions): Promise<T>;
    invalidate(key: string, token?: string): void;
    clear(): void;
}
/**
 * Small process-local primitive for event-invalidated upstream snapshots.
 *
 * Keys normally represent credential identity plus resource scope. Settled
 * values and in-flight reads never cross keys. Invalidation advances an opaque
 * generation, so work started before an event may finish for its original
 * caller but cannot seed the post-event cache.
 */
export declare function createPartitionedRefreshCache<T>(options: PartitionedRefreshCacheOptions<T>): PartitionedRefreshCache<T>;
