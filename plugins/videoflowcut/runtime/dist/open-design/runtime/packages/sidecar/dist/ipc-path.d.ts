/**
 * @module ipc-path
 *
 * IPC path shape helpers: recognizing a Windows named-pipe path and validating
 * that an IPC path is a well-formed absolute socket path (or a named pipe).
 * Depends only on `node:path`.
 */
/**
 * Detect whether a value is a Windows named-pipe path (`\\.\pipe\...`).
 * @returns `true` when `value` is such a pipe path.
 */
export declare function isWindowsNamedPipePath(value: unknown): boolean;
/**
 * Validate and return an IPC path: a Windows named pipe is accepted as-is, and
 * any other value must be a non-empty, un-padded, null-byte-free absolute path.
 * @returns The validated IPC path.
 */
export declare function normalizeIpcPath(ipc: unknown): string;
//# sourceMappingURL=ipc-path.d.ts.map