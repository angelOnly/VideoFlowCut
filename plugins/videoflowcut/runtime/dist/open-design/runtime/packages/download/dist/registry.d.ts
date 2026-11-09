/**
 * @module registry
 *
 * In-process coordination registry that keeps concurrent operations against the
 * same target coherent. Holds the singleton maps of in-flight downloads and their
 * active target identities, the key derivations that index them, and the
 * `waitForTask` adapter that attaches a caller's progress listener and abort
 * signal to a shared download task. These maps are module singletons: every
 * concern imports them from here so there is exactly one instance per process.
 * Depends on errors, the target shape, and public option/progress/result types.
 */
import type { NormalizedTarget } from "./target.js";
import type { ManagedDownloadOptions, ManagedDownloadProgress, ManagedDownloadResult } from "./types.js";
/**
 * A download in flight, shared by every caller that requested the same identity:
 * its progress listeners, the settling promise, and the target key it holds.
 */
export type ActiveTask = {
    listeners: Set<(progress: ManagedDownloadProgress) => void>;
    promise: Promise<ManagedDownloadResult>;
    targetKey: string;
};
/** Singleton map of active download identity key → in-flight task. */
export declare const activeTasks: Map<string, ActiveTask>;
/** Singleton map of active target key → the identity key currently holding it. */
export declare const activeTargets: Map<string, string>;
/**
 * Derive the identity key (base + target + payload identity) for a download; two
 * calls collide here only when they request the exact same bytes.
 * @returns The identity key.
 */
export declare function activeKey(target: NormalizedTarget): string;
/**
 * Derive the target key (base + target, ignoring payload identity); used to
 * detect conflicting identities for the same on-disk target.
 * @returns The target key.
 */
export declare function targetActiveKey(target: NormalizedTarget): string;
/**
 * Attach a caller's progress listener and abort signal to a shared task and
 * resolve/reject with its outcome, cleaning up listeners on settle or abort.
 * @returns A promise that settles with the shared task's result, or rejects with
 * `ABORTED` if the caller's signal fires first.
 */
export declare function waitForTask(task: ActiveTask, options: Pick<ManagedDownloadOptions, "onProgress" | "signal">): Promise<ManagedDownloadResult>;
//# sourceMappingURL=registry.d.ts.map