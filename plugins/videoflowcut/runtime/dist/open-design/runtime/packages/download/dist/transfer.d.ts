/**
 * @module transfer
 *
 * The HTTP transfer engine. Parses response metadata (content-length, resume
 * validators, content-range), streams a response body into the partial file while
 * emitting progress, and drives the resume-or-restart-with-retries loop that
 * fills the partial file. Depends on errors, public progress types, the target
 * and manifest shapes, and the fs-io write/stat primitives.
 */
import { type DownloadManifest } from "./manifest.js";
import type { NormalizedTarget } from "./target.js";
import type { ManagedDownloadProgress } from "./types.js";
/**
 * @internal Outcome of a single transfer attempt: whether it resumed and the
 * discovered total byte count.
 */
type DownloadAttemptResult = {
    resumed: boolean;
    totalBytes?: number;
};
/**
 * Fill the target's partial file, resuming when possible and otherwise
 * restarting, retrying up to `maxAttempts` times. Throws `NETWORK_EXHAUSTED`
 * when all attempts fail.
 * @returns The final attempt result once the partial is fully transferred.
 */
export declare function downloadWithRetries(target: NormalizedTarget, manifest: DownloadManifest | null, options: {
    emit: (progress: ManagedDownloadProgress) => void;
    fetchImpl: typeof globalThis.fetch;
    maxAttempts: number;
    requestHeaders?: Record<string, string>;
}): Promise<DownloadAttemptResult>;
export {};
//# sourceMappingURL=transfer.d.ts.map