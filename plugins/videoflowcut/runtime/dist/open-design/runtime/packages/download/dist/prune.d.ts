/**
 * @module prune
 *
 * Age-based garbage collection of a managed base. Removes manifest/partial/lock
 * scratch entries and bucket files whose modification time is older than a
 * threshold, aggregating a removed count and per-entry warnings. Depends on
 * constants, the target base-path normalizer, the store base guard, public prune
 * types, and the platform best-effort remover.
 */
import type { PruneManagedDownloadsOptions, PruneManagedDownloadsResult } from "./types.js";
/**
 * Prune stale scratch state and bucket entries from a managed base older than the
 * configured age threshold, leaving the ownership sentinel and scratch layout
 * intact.
 * @returns The number of entries removed and any non-fatal removal warnings.
 */
export declare function pruneManagedDownloads(options: PruneManagedDownloadsOptions): Promise<PruneManagedDownloadsResult>;
//# sourceMappingURL=prune.d.ts.map