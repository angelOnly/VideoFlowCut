import { type SyncDigestFace, type SyncDigestReader } from './sync-digest.js';
import type { CollabSyncSnapshotStore } from './sync-snapshot-store.js';
export interface PersistentSyncCacheOptions<T> {
    face: SyncDigestFace;
    /** The real (expensive) read this cache is trying to avoid. */
    fetch: () => Promise<T>;
    readDigest: SyncDigestReader;
    store: CollabSyncSnapshotStore;
    /** Validate a decoded snapshot; returning null forces a real fetch. */
    parseSnapshot: (value: unknown) => T | null;
    /**
     * Is the fetcher's answer authoritative right now?
     *
     * Both cached readers answer `[]` — not an error — while the workspace
     * context has no team identity yet (startup, signed out, personal
     * workspace). That empty is indistinguishable from a genuinely empty team,
     * so persisting it under a live token would pin an empty catalog/roster
     * until something upstream happened to change. When this returns false the
     * cache is bypassed entirely: no read, no write, just the real fetch.
     */
    shouldCache?: () => boolean | Promise<boolean>;
    onError?: (error: unknown) => void;
}
export interface PersistentSyncCache<T> {
    (): Promise<T>;
    /**
     * Drop the persisted snapshot for the key last used.
     *
     * Only for the moments we KNOW the payload changed (a local share/unshare, a
     * hub event). Correctness does not depend on it — a changed payload moves the
     * cloud token, which already defeats reuse — but it keeps an invalidated
     * entry from surviving in the database across a restart.
     */
    invalidate(): void;
}
export declare function createPersistentSyncCache<T>(options: PersistentSyncCacheOptions<T>): PersistentSyncCache<T>;
