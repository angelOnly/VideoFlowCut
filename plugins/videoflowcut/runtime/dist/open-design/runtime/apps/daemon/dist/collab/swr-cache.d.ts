export interface SwrCache<T> {
    (): Promise<T>;
    /**
     * Drop the cached value for the key last used, so the next read is a real
     * fetch instead of the stale one. Only needed for the moments a caller KNOWS
     * the underlying data changed (a local mutation, a hub push) — correctness
     * does not depend on it, since the fetcher will naturally refresh once
     * `freshMs` elapses, but without it a just-made change can take up to that
     * long (or longer, behind a slower client poll) to become visible.
     *
     * Safe to call while a background refresh is already in flight: that
     * refresh's result is keyed against the pre-invalidate entry identity, so it
     * is discarded on landing instead of clobbering whatever the post-invalidate
     * read produces.
     */
    invalidate(): void;
}
export declare function createSwrCache<T>(fetcher: () => Promise<T>, keyFn: () => string, freshMs: number): SwrCache<T>;
