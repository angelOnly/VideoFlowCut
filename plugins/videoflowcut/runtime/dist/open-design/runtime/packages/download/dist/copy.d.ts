/**
 * @module copy
 *
 * Download-then-copy-to-an-external-path with reference-counted cleanup. Downloads
 * into the managed base, copies the verified bytes to the caller's `outputPath`
 * (idempotently — an identical existing output is accepted, a differing one
 * conflicts), then clears the managed copy once no other lease is outstanding.
 * The lease map keeps concurrent copy callers from clearing bytes another caller
 * still needs. Depends on the target resolver, fs-io size/hash helpers, the
 * coordination registry, the managed-download entry, the remove operation,
 * errors, public types, and the platform atomic copier.
 */
import type { DownloadCopyAndClearOptions, DownloadCopyAndClearResult } from "./types.js";
/**
 * Download a payload and copy the verified bytes to an external `outputPath`,
 * then clear the managed copy when no other copy lease is outstanding. An
 * existing output with matching bytes is accepted; a differing one throws
 * `OUTPUT_CONFLICT`.
 * @returns The copied byte count, output path, reuse/resume flags, and the
 * cleanup outcome (with a warning if cleanup failed).
 */
export declare function downloadCopyAndClear(options: DownloadCopyAndClearOptions): Promise<DownloadCopyAndClearResult>;
//# sourceMappingURL=copy.d.ts.map