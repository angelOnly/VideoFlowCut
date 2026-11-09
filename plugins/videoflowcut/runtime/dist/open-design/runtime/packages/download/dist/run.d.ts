/**
 * @module run
 *
 * Single managed-download execution. Detects reusable state (a verified complete
 * file or a resumable partial), resets suspicious/corrupt bases, then acquires the
 * lock, prunes, transfers, verifies the checksum, and atomically promotes the
 * partial to its final path — emitting the final result. This is the orchestration
 * kernel behind the public `managedDownload`. Depends on the store, manifest, lock,
 * transfer, prune, target, and fs-io concerns.
 */
import type { NormalizedTarget } from "./target.js";
import type { ManagedDownloadProgress, ManagedDownloadResult } from "./types.js";
/**
 * Execute one managed download end to end: reuse detection, locking, pruning,
 * transfer, checksum verification, and atomic promotion of the partial to its
 * final path.
 * @returns The completed download result.
 */
export declare function runManagedDownload(target: NormalizedTarget, options: {
    emit: (progress: ManagedDownloadProgress) => void;
    fetchImpl: typeof globalThis.fetch;
    maxAttempts: number;
    requestHeaders?: Record<string, string>;
}): Promise<ManagedDownloadResult>;
//# sourceMappingURL=run.d.ts.map