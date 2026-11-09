/**
 * @module fs-io
 *
 * Low-level filesystem primitives shared across the module: existence/emptiness
 * probes, atomic JSON read/write, file-size stat, and streaming file hashing.
 * These are the module's foundation helpers — they depend only on Node built-ins
 * and are imported by the store, manifest, lock, transfer, and run concerns.
 */
/**
 * Resolve whether `path` is accessible.
 * @returns `true` if the path exists and is accessible, `false` otherwise.
 */
export declare function pathExists(path: string): Promise<boolean>;
/**
 * Read and parse a JSON file, swallowing any read/parse error.
 * @returns The parsed value, or `null` if the file is missing or unreadable.
 */
export declare function readJson<T>(path: string): Promise<T | null>;
/**
 * Atomically write `payload` as pretty-printed JSON via a temp-file rename,
 * creating the parent directory if needed.
 */
export declare function writeJson(path: string, payload: unknown): Promise<void>;
/**
 * Determine whether a directory has no entries.
 * @returns `true` if the directory is empty.
 */
export declare function directoryIsEmpty(path: string): Promise<boolean>;
/**
 * Stream-hash a file with the given algorithm.
 * @returns The lowercase hex digest of the file contents.
 */
export declare function hashFile(path: string, algorithm: "sha256" | "sha512"): Promise<string>;
/**
 * Stat a path and return its byte size if it is a regular file.
 * @returns The file size in bytes, or `null` if missing or not a regular file.
 */
export declare function statFileSize(path: string): Promise<number | null>;
//# sourceMappingURL=fs-io.d.ts.map