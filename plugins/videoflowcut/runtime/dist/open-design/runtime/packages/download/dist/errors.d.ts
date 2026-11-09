/**
 * @module errors
 *
 * Public error taxonomy for managed downloads: the frozen `MANAGED_DOWNLOAD_ERROR_CODES`
 * table, the `ManagedDownloadErrorCode` union derived from it, and the
 * `ManagedDownloadError` class every concern throws. Depends on nothing else in the
 * module; every other file imports the codes and the error class from here.
 */
/**
 * Frozen table of stable machine-readable error codes surfaced by the managed
 * download API. Callers can switch on `error.code` for programmatic handling.
 */
export declare const MANAGED_DOWNLOAD_ERROR_CODES: Readonly<{
    readonly ABORTED: "aborted";
    readonly CHECKSUM_MISMATCH: "checksum-mismatch";
    readonly INVALID_TARGET: "invalid-target";
    readonly NETWORK_EXHAUSTED: "network-exhausted";
    readonly OUTPUT_CONFLICT: "output-conflict";
    readonly STORE_CORRUPT: "store-corrupt";
    readonly STORE_NOT_OWNED: "store-not-owned";
    readonly TARGET_CONFLICT: "target-conflict";
    readonly TARGET_LOCKED: "target-locked";
}>;
/** Union of the stable error-code string literals. */
export type ManagedDownloadErrorCode = (typeof MANAGED_DOWNLOAD_ERROR_CODES)[keyof typeof MANAGED_DOWNLOAD_ERROR_CODES];
/**
 * Error thrown by every managed-download operation. Carries a stable {@link
 * ManagedDownloadErrorCode} plus optional structured `details` for diagnostics.
 */
export declare class ManagedDownloadError extends Error {
    readonly code: ManagedDownloadErrorCode;
    readonly details?: unknown;
    constructor(code: ManagedDownloadErrorCode, message: string, details?: unknown);
}
//# sourceMappingURL=errors.d.ts.map