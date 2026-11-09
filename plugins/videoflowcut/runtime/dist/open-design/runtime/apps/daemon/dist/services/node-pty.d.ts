import type * as NodePty from 'node-pty';
export declare class NodePtyUnavailableError extends Error {
    readonly code = "NODE_PTY_UNAVAILABLE";
    constructor(cause: unknown);
}
export declare function isNodePtyUnavailableError(error: unknown): error is NodePtyUnavailableError;
/**
 * Resolve node-pty's POSIX spawn-helper candidates without importing its
 * native addon. The lookup keeps Terminal users on the package-relative
 * runtime boundary used by the packaged app.
 */
export declare function spawnHelperCandidatePaths(): string[];
/**
 * npm's published prebuild may unpack spawn-helper without execute bits.
 * Repair it before loading node-pty; failure remains best-effort because the
 * subsequent import/spawn provides the attributable capability error.
 */
export declare function ensureSpawnHelperExecutable(): void;
export declare function loadNodePty(): Promise<typeof NodePty>;
