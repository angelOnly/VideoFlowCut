import type Database from 'better-sqlite3';
import type { LibraryAsset, LibraryAssetFilter, LibraryAssetKind, LibraryAssetSource, LibrarySourceKind, LibraryStorage, LibraryTask } from '@open-design/contracts';
type SqliteDb = Database.Database;
export declare function migrateLibrary(db: SqliteDb): void;
/** Internal projection that also exposes the on-disk path for raw serving. */
export interface LibraryAssetRecord extends LibraryAsset {
    /** Absolute path for owned assets; project-relative resolution otherwise. */
    filePath?: string;
}
export interface InsertLibraryAssetInput {
    id: string;
    kind: LibraryAssetKind;
    storage: LibraryStorage;
    sourceUrl?: string | undefined;
    sourceTitle?: string | undefined;
    sourceDomain?: string | undefined;
    capturedAt: number;
    archivedDate: string;
    filePath?: string | undefined;
    originProjectId?: string | undefined;
    relPath?: string | undefined;
    mime?: string | undefined;
    width?: number | undefined;
    height?: number | undefined;
    size?: number | undefined;
    contentHash: string;
    caption?: string | undefined;
    ocrText?: string | undefined;
    palette?: string[] | undefined;
    tags?: string[] | undefined;
    metadata?: Record<string, unknown> | undefined;
}
export declare function insertLibraryAsset(db: SqliteDb, input: InsertLibraryAssetInput): void;
export interface LibraryAssetPatch {
    caption?: string | null;
    ocrText?: string | null;
    palette?: string[] | null;
    width?: number | null;
    height?: number | null;
    size?: number | null;
    mime?: string | null;
    tags?: string[];
    metadata?: Record<string, unknown> | null;
}
export declare function updateLibraryAsset(db: SqliteDb, id: string, patch: LibraryAssetPatch): void;
export declare function findLibraryAssetByHash(db: SqliteDb, contentHash: string): LibraryAssetRecord | null;
export declare function getLibraryAsset(db: SqliteDb, id: string): LibraryAssetRecord | null;
/**
 * The referenced asset that already mirrors a project file, keyed by its origin
 * (`origin_project_id` + `rel_path`). The reconcile sync uses this to skip files
 * it has already indexed *without* reading/hashing their bytes — the cheap guard
 * that keeps auto-reconcile-on-open near-free on a large workspace. Rides the
 * existing `idx_library_assets_origin` index.
 */
export declare function findReferencedAssetByOrigin(db: SqliteDb, originProjectId: string, relPath: string): LibraryAssetRecord | null;
/**
 * Whether a `design-system` source row already exists for a design system id.
 * The reconcile sync registers exactly one card per design system, so this is
 * its "already synced?" short-circuit (no manifest read / preview hashing).
 */
export declare function hasDesignSystemSource(db: SqliteDb, designSystemId: string): boolean;
export declare function deleteLibraryAsset(db: SqliteDb, id: string): void;
export declare function listLibraryAssets(db: SqliteDb, filter?: LibraryAssetFilter): LibraryAssetRecord[];
export declare function listLibraryAssetSources(db: SqliteDb, assetId: string): LibraryAssetSource[];
export interface AddLibrarySourceInput {
    assetId: string;
    sourceKind: LibrarySourceKind;
    projectId?: string | undefined;
    conversationId?: string | undefined;
    runId?: string | undefined;
    designSystemId?: string | undefined;
    relPath?: string | undefined;
}
/**
 * Append a source record, skipping an exact duplicate (same kind + same
 * project/conversation/run/design-system/relPath) so re-ingesting the same
 * asset from the same place does not multiply back-links.
 */
export declare function addLibraryAssetSource(db: SqliteDb, input: AddLibrarySourceInput): void;
export declare function insertLibraryTask(db: SqliteDb, task: LibraryTask): void;
export declare function getLibraryTask(db: SqliteDb, id: string): LibraryTask | null;
export declare function updateLibraryTask(db: SqliteDb, id: string, patch: Partial<Pick<LibraryTask, 'status' | 'progress' | 'error' | 'endedAt'>>): void;
export interface LibraryTokenRow {
    tokenHash: string;
    label: string;
    extensionOrigin: string;
    createdAt: number;
    lastUsedAt: number;
}
export declare function insertLibraryToken(db: SqliteDb, row: LibraryTokenRow): void;
export declare function findLibraryTokenByHash(db: SqliteDb, tokenHash: string): LibraryTokenRow | null;
export declare function touchLibraryToken(db: SqliteDb, tokenHash: string): void;
export declare function listLibraryTokens(db: SqliteDb): LibraryTokenRow[];
export declare function listLibraryTokenOrigins(db: SqliteDb): string[];
export {};
