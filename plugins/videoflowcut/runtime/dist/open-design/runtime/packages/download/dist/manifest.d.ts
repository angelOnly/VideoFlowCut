/**
 * @module manifest
 *
 * Per-download manifest: the `DownloadManifest` on-disk record, its validation
 * type guards, a safe reader that distinguishes missing from corrupt, a matcher
 * that confirms a manifest describes the requested target, and a builder for
 * fresh complete/partial manifests. Depends on constants, errors, public types,
 * and the `NormalizedTarget` shape from the target concern.
 */
import { MANIFEST_KIND, MANIFEST_SCHEMA_VERSION } from "./constants.js";
import type { NormalizedTarget } from "./target.js";
import type { ManagedDownloadChecksum } from "./types.js";
/**
 * On-disk record describing a single managed download's identity, checksum,
 * completion state, and optional resume validators.
 */
export type DownloadManifest = {
    bucket: string;
    checksum: ManagedDownloadChecksum;
    createdAt: string;
    fileName: string;
    identityDigest: string;
    kind: typeof MANIFEST_KIND;
    schemaVersion: typeof MANIFEST_SCHEMA_VERSION;
    state: "complete" | "partial";
    targetKey: string;
    totalBytes?: number;
    updatedAt: string;
    urlDigest: string;
    validators?: {
        etag?: string;
        lastModified?: string;
    };
};
/**
 * Read a manifest file, distinguishing three outcomes.
 * @returns The parsed manifest, `null` when the file is absent, or `"invalid"`
 * when present but unparseable/malformed.
 */
export declare function readManifest(path: string): Promise<DownloadManifest | "invalid" | null>;
/**
 * Confirm that a manifest describes exactly the requested target (identity, url,
 * bucket/file name, and checksum all match).
 * @returns `true` when the manifest matches the target.
 */
export declare function manifestMatchesTarget(manifest: DownloadManifest, target: NormalizedTarget): boolean;
/**
 * Build a fresh manifest for a target in the given state, optionally patching in
 * `totalBytes`/`validators`.
 * @returns The new manifest record.
 */
export declare function createManifest(target: NormalizedTarget, state: "complete" | "partial", patch?: Partial<Pick<DownloadManifest, "totalBytes" | "validators">>): DownloadManifest;
//# sourceMappingURL=manifest.d.ts.map