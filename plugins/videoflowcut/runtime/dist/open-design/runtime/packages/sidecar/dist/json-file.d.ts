/**
 * @module json-file
 *
 * Small JSON file helpers for sidecar runtime state: a forgiving reader (null on
 * any failure), an atomic pretty-printed writer via temp-file rename, a
 * best-effort remove, and a guarded pointer removal that only deletes when the
 * pointer still names the given run. Depends on `node:fs/promises` and
 * `node:path`.
 */
/**
 * Read and parse a JSON file, swallowing any read/parse error.
 * @returns The parsed value, or `null` if missing or unreadable.
 */
export declare function readJsonFile<T = any>(filePath: string): Promise<T | null>;
/**
 * Atomically write `payload` as pretty-printed JSON via a temp-file rename,
 * creating the parent directory if needed.
 */
export declare function writeJsonFile(filePath: string, payload: unknown): Promise<void>;
/**
 * Remove a file, forcing (no error if absent).
 */
export declare function removeFile(filePath: string): Promise<void>;
/**
 * Remove a pointer file only if it still points at `runId`.
 */
export declare function removePointerIfCurrent(pointerPath: string, runId: string): Promise<void>;
//# sourceMappingURL=json-file.d.ts.map