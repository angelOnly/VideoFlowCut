export type AtomicCopyFileOptions = {
    overwrite?: boolean;
};
export type AtomicCopyFileResult = {
    bytesCopied: number;
    replaced: boolean;
};
export type RemovePathBestEffortOptions = {
    recursive?: boolean;
};
export type RemovePathBestEffortResult = {
    error?: string;
    removed: boolean;
};
/**
 * Test whether `target` is contained within `root` (or equal to it) after path
 * resolution, guarding against `..` escapes and absolute-path breakouts.
 *
 * @param root - The containing directory.
 * @param target - The path to test for containment.
 * @returns `true` when `target` resolves to `root` or a descendant of it.
 */
export declare function pathContains(root: string, target: string): boolean;
/**
 * Copy a file atomically by writing to a unique temp file in the destination
 * directory and renaming it into place, creating parent directories as needed.
 * Refuses to clobber an existing destination unless `overwrite` is set; a same-
 * path copy is a no-op that reports the existing size.
 *
 * @param sourcePath - The file to copy from.
 * @param destinationPath - The path to copy to.
 * @param options - `overwrite` to replace an existing destination (default false).
 * @returns The bytes copied and whether an existing file was replaced.
 * @throws `EEXIST` when the destination exists and `overwrite` is not set.
 */
export declare function atomicCopyFile(sourcePath: string, destinationPath: string, options?: AtomicCopyFileOptions): Promise<AtomicCopyFileResult>;
/**
 * Remove a path (recursively by default) without throwing, reporting success or
 * the failure message instead.
 *
 * @param path - The path to remove.
 * @param options - `recursive` to remove directory trees (default true).
 * @returns `{ removed: true }` on success, or `{ removed: false, error }` on failure.
 */
export declare function removePathBestEffort(path: string, options?: RemovePathBestEffortOptions): Promise<RemovePathBestEffortResult>;
/**
 * Read the last `maxLines` non-empty lines of a text file, returning an empty
 * array when the file is missing or unreadable.
 *
 * @param filePath - The file to read.
 * @param maxLines - The maximum number of trailing lines to return (default 80).
 * @returns The trailing non-empty lines (empty array on error).
 */
export declare function readLogTail(filePath: string, maxLines?: number): Promise<string[]>;
//# sourceMappingURL=fs.d.ts.map