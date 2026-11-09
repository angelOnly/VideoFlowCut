export interface EventRefreshScheduler {
    now(): number;
    setTimeout(callback: () => void, delayMs: number): ReturnType<typeof setTimeout>;
    clearTimeout(timer: ReturnType<typeof setTimeout>): void;
}
export interface EventRefreshCoordinatorOptions {
    /**
     * Leading refreshes still start immediately. A later refresh for the same
     * resource starts no sooner than this floor, and only the latest queued task
     * survives. This bounds an event storm without delaying the first signal or
     * losing the final authoritative re-read.
     */
    minIntervalMs?: number;
    maxKeys?: number;
    scheduler?: EventRefreshScheduler;
    onError?: (error: unknown, key: string) => void;
}
export interface EventRefreshCoordinator {
    request(key: string, task: () => void | Promise<void>, token?: string): void;
    dispose(): void;
}
/**
 * Bound background work caused by thin invalidation events.
 *
 * The first event for a resource runs immediately. While that work is running
 * (or inside the short start-rate floor), newer events replace one pending
 * trailing task. Duplicate revision/sequence tokens are ignored. This is safe
 * for snapshot refreshes: intermediate transitions need not each trigger a GET,
 * but the final state must always be observed.
 */
export declare function createEventRefreshCoordinator(options?: EventRefreshCoordinatorOptions): EventRefreshCoordinator;
