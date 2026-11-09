/**
 * @module remove
 *
 * Inspection and removal of a managed download by bucket/file name. `inspect`
 * reports completion and manifest state without mutating anything; `remove`
 * deletes the final file plus its scratch state and prunes an emptied bucket,
 * refusing to remove a target that is currently active. Both synthesize a
 * placeholder payload since only the target identity (not the URL/checksum)
 * matters here. Depends on the target resolver, the store base guard, the
 * manifest reader, an fs-io probe, the coordination registry, errors, public
 * types, and the platform best-effort remover.
 */
import type { ManagedDownloadInspection, RemoveManagedDownloadOptions, RemoveManagedDownloadResult } from "./types.js";
/**
 * Report a managed download's presence and manifest state without mutating it.
 * @returns The bucket/file name, resolved path, whether the final file exists,
 * and the manifest state (`complete`/`partial`/`missing`/`unreadable`).
 */
export declare function inspectManagedDownload(options: RemoveManagedDownloadOptions): Promise<ManagedDownloadInspection>;
/**
 * Remove a managed download: the final file, its manifest/partial/lock scratch
 * state, and an emptied bucket directory. Throws `TARGET_LOCKED` if the target is
 * currently active.
 * @returns `{ removed: true }` once removal completes.
 */
export declare function removeManagedDownload(options: RemoveManagedDownloadOptions): Promise<RemoveManagedDownloadResult>;
//# sourceMappingURL=remove.d.ts.map