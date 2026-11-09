/**
 * @module managed-download
 *
 * Public entry point for a single managed download. Deduplicates concurrent
 * callers requesting the same identity onto one shared task, rejects a second
 * caller that targets the same on-disk file with a different identity, fans
 * progress out to every waiter, and drives the run kernel. Depends on constants,
 * the target resolver, the coordination registry, the run kernel, errors, and
 * public option/progress/result types.
 */
import type { ManagedDownloadOptions, ManagedDownloadResult } from "./types.js";
/**
 * Download a file into a managed base, verifying its checksum and reusing or
 * resuming prior state when possible. Concurrent calls for the same identity
 * share one task; a conflicting identity for the same target throws
 * `TARGET_CONFLICT`.
 * @returns The completed download result.
 */
export declare function managedDownload(options: ManagedDownloadOptions): Promise<ManagedDownloadResult>;
//# sourceMappingURL=managed-download.d.ts.map