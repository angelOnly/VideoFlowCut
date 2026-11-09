/**
 * @module lock
 *
 * Advisory per-target file locking with stale-lock reclamation. Writes an
 * exclusive lock file recording the owning PID and process start time, detects
 * and clears locks left behind by dead processes (with PID-reuse safeguards for
 * Windows), and releases held locks. Depends on constants, errors, the fs-io
 * JSON reader, the `NormalizedTarget` shape, and the platform liveness probe.
 */
import type { NormalizedTarget } from "./target.js";
/**
 * Handle to an acquired lock, carrying the lock file path to release.
 */
export type AcquiredLock = {
    path: string;
};
/**
 * Acquire an exclusive advisory lock for a target, clearing one stale lock if
 * present. Throws `TARGET_LOCKED` when the target is held by a live process.
 * @returns A handle to the acquired lock.
 */
export declare function acquireLock(target: NormalizedTarget): Promise<AcquiredLock>;
/**
 * Release a previously acquired lock (best effort); a `null` handle is a no-op.
 */
export declare function releaseLock(lock: AcquiredLock | null): Promise<void>;
//# sourceMappingURL=lock.d.ts.map