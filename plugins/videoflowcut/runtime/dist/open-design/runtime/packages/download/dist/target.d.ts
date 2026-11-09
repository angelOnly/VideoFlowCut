/**
 * @module target
 *
 * Target resolution and input validation. Normalizes and validates the caller's
 * base path, bucket/file name segments, checksum, and URL, then derives the
 * `NormalizedTarget` — the resolved final/manifest/partial/lock paths plus the
 * identity/url/target digests every downstream concern keys off. Also exposes the
 * standalone `normalizeBasePath` used by prune. Depends only on errors, constants,
 * public types, and the platform path guard.
 */
import type { ManagedDownloadChecksum, ManagedDownloadOptions } from "./types.js";
/**
 * Fully resolved, validated download target. Carries the normalized inputs plus
 * every derived on-disk path and digest used throughout the download lifecycle.
 */
export type NormalizedTarget = {
    basePath: string;
    bucket: string;
    checksum: ManagedDownloadChecksum;
    fileName: string;
    finalPath: string;
    identityDigest: string;
    lockPath: string;
    manifestPath: string;
    partialPath: string;
    targetKey: string;
    url: string;
    urlDigest: string;
};
/**
 * Validate and resolve a base path to an absolute directory path.
 * @returns The resolved absolute base path.
 */
export declare function normalizeBasePath(basePath: string): string;
/**
 * Build a fully-resolved {@link NormalizedTarget} from validated download options,
 * enforcing that every derived path stays contained within the base path.
 * @returns The normalized target descriptor.
 */
export declare function targetFromOptions(options: Pick<ManagedDownloadOptions, "basePath" | "bucket" | "fileName" | "payload">): NormalizedTarget;
//# sourceMappingURL=target.d.ts.map