export interface MigrateLegacyDataDirOptions {
    /** Path to the legacy `.od/` directory (typically OD_LEGACY_DATA_DIR). */
    legacyDir: string | undefined;
    /** Resolved current data root (RUNTIME_DATA_DIR). */
    dataDir: string;
    /** Optional logger. Defaults to console.log/console.warn. */
    logger?: {
        info(message: string): void;
        warn(message: string): void;
    };
    /**
     * Test seam. The default writes the JSON `.migrated-from` marker
     * with fs.writeFileSync; tests inject a function that throws so the
     * rollback path (which removes already-promoted payload entries) can
     * be exercised without contriving real ENOSPC / read-only conditions.
     * Production callers should never pass this.
     * @internal
     */
    writeMarker?: (dataDir: string, legacyDir: string) => void;
}
export type MigrateStatus = 'noop' | 'migrated' | 'skipped';
export interface MigrateLegacyDataDirResult {
    status: MigrateStatus;
    reason: string;
    copied?: readonly string[];
}
/**
 * Daemon startup throws this when OD_LEGACY_DATA_DIR is explicitly set
 * but the path is not a usable legacy data dir, or the new dataDir is
 * already populated and would be merged into. Failing loud here is the
 * point: silent skips trained users to assume migration ran when it
 * didn't (#710 again).
 */
export declare class LegacyMigrationError extends Error {
    readonly code: string;
    constructor(code: string, message: string);
}
/**
 * Returns true when `dataDir` looks like a fresh / never-used data root:
 * either the directory does not exist, or it exists but does not contain
 * a real OD SQLite database. We deliberately do NOT just check for an
 * empty directory: a packaged install creates an empty `dataDir` before
 * the daemon ever boots, so emptiness is the common case rather than a
 * proof of "no prior data."
 */
export declare function dataDirIsEmptyOrFresh(dataDir: string): boolean;
/**
 * Returns true when `legacyDir` contains a payload worth migrating. The
 * presence of `app.sqlite` is treated as proof: every 0.3.x install that
 * shipped chat history wrote one, and a stray empty `.od/` folder won't
 * have it.
 */
export declare function legacyDirHasPayload(legacyDir: string): boolean;
/**
 * Returns the list of payload entries that already exist under `dataDir`.
 * We refuse to merge on top of any of them: SQLite/WAL pairs and project
 * trees are not safely interleavable, and a partial overlay would yield
 * a hybrid state SQLite cannot reason about.
 */
export declare function dataDirHasExistingPayload(dataDir: string): string[];
/**
 * Move staged payload entries into the final dataDir. Each entry is
 * moved with renameSync (atomic on the same filesystem); if rename
 * fails (cross-device, etc.) we fall back to copy + remove.
 *
 * Promotion is rollback-safe in two layers:
 *
 *   1. The cpSync fallback is wrapped in its own try/catch and removes
 *      whatever was partially written at dst before bubbling up. Without
 *      this, a partial dst would survive the outer rollback because the
 *      entry never makes it into the `promoted` array.
 *   2. The outer try/catch tracks every entry that has been fully moved
 *      into dataDir and removes them all before rethrowing. Without it,
 *      a mid-loop failure after app.sqlite was already promoted would
 *      leave the real dataDir with app.sqlite but no marker, and the
 *      next boot would refuse the retry under data_dir_not_empty,
 *      stranding the user mid-migration.
 *
 * Returns the list of entries that were placed into dataDir so the
 * caller can roll them back if a *subsequent* step (e.g. writing the
 * .migrated-from marker) fails after promotion has already succeeded.
 */
export declare function promoteStaged(stagingDir: string, dataDir: string, entries: readonly string[]): readonly string[];
/**
 * One-shot, idempotent legacy data migrator. Synchronous so it can run
 * at module import time before SQLite opens. Throws LegacyMigrationError
 * on operator-actionable failures (env set but path invalid; dataDir
 * already populated; symlink in payload).
 */
export declare function migrateLegacyDataDirSync(options: MigrateLegacyDataDirOptions): MigrateLegacyDataDirResult;
