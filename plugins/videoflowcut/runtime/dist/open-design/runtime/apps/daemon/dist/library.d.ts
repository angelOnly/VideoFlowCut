import type Database from 'better-sqlite3';
import type { LibraryAssetKind, LibraryStorage, LibrarySourceKind } from '@open-design/contracts';
import { type LibraryAssetRecord } from './library-store.js';
type SqliteDb = Database.Database;
export declare function libraryObjectsDir(libraryDir: string): string;
/** Content-addressed path: <library>/objects/<hh>/<hash><ext>. */
export declare function libraryObjectPath(libraryDir: string, contentHash: string, ext: string): string;
/**
 * OD Figma capture IR sidecar for an owned `html` asset. The clipper produces
 * the IR (a JSON node-tree, see `figma-plugin/IR.md`) from the live page at
 * capture time; it lives next to the HTML object so the Library can export it
 * as Figma import JSON without re-rendering. Keyed by the HTML asset's content hash.
 */
export declare function resolveAssetFigmaSidecarPath(asset: LibraryAssetRecord, libraryDir: string): string | null;
/** Write a Figma IR sidecar next to an owned object. Best-effort, never throws. */
export declare function writeFigmaSidecar(libraryDir: string, contentHash: string, ir: string): Promise<boolean>;
/**
 * Picked-element `outerHTML` sidecar for an owned screenshot asset produced by
 * the clipper's element picker. Keeps potentially large markup out of the asset
 * row; the lightweight summary stays in `metadata.element`.
 */
export declare function resolveAssetElementSidecarPath(asset: LibraryAssetRecord, libraryDir: string): string | null;
/** Write an element-HTML sidecar next to an owned object. Best-effort. */
export declare function writeElementSidecar(libraryDir: string, contentHash: string, html: string): Promise<boolean>;
/** Local `YYYY-MM-DD` for the daily archive feed. */
export declare function archivedDateFor(ts: number): string;
export declare function extForMime(mime: string | undefined, filename?: string): string;
/** Magic-byte + filename-extension mime sniffing for the common cases. */
export declare function detectMime(bytes: Buffer, filename?: string): string;
export declare function kindForMime(mime: string): LibraryAssetKind;
/** Best-effort raster dimensions for PNG / JPEG / GIF (no decode, no deps). */
export declare function sniffImageDimensions(bytes: Buffer): {
    width: number;
    height: number;
} | null;
export interface RegisterLibrarySource {
    sourceKind: LibrarySourceKind;
    projectId?: string | undefined;
    conversationId?: string | undefined;
    runId?: string | undefined;
    designSystemId?: string | undefined;
    relPath?: string | undefined;
}
export interface RegisterLibraryAssetInput {
    db: SqliteDb;
    libraryDir: string;
    storage: LibraryStorage;
    source: RegisterLibrarySource;
    kind?: LibraryAssetKind | undefined;
    /** Owned: the raw bytes to store. */
    bytes?: Buffer | undefined;
    /** Referenced: an existing on-disk file (also read for hashing/dims). */
    absPath?: string | undefined;
    /** Text-like asset payload. */
    text?: string | undefined;
    mime?: string | undefined;
    filename?: string | undefined;
    sourceUrl?: string | undefined;
    sourceTitle?: string | undefined;
    tags?: string[] | undefined;
    /**
     * When the asset was originally captured/produced (unix ms). Drives
     * `capturedAt` + the `archivedDate` timeline bucket. Defaults to now; the
     * reconcile sync passes a design system's update time or a project file's
     * mtime so the timeline reflects when the artifact was made, not synced.
     */
    capturedAt?: number | undefined;
    /** referenced-only metadata. */
    originProjectId?: string | undefined;
    relPath?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}
export interface RegisterLibraryAssetResult {
    asset: LibraryAssetRecord;
    deduped: boolean;
    taskId?: string;
}
/**
 * Index an asset into the library. Idempotent by content hash. Owned assets
 * are written content-addressed under LIBRARY_DIR; referenced assets only
 * store a pointer. Always appends a source record for the back-link graph.
 */
export declare function registerLibraryAsset(input: RegisterLibraryAssetInput): Promise<RegisterLibraryAssetResult>;
/**
 * Resolve the absolute on-disk path for an asset's raw bytes.
 * Owned assets store an absolute path; referenced assets resolve their
 * project-relative path against the projects root.
 */
export declare function resolveAssetBytesPath(asset: LibraryAssetRecord, projectsDir: string): string | null;
export {};
