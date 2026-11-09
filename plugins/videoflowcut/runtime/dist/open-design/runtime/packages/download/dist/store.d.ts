/**
 * @module store
 *
 * Managed-download root ownership and directory lifecycle. Reads/writes the
 * ownership sentinel that marks a base directory as OpenDesign-owned, refuses to
 * take over foreign/non-empty directories, ensures the `.state`/`.partial`/`.locks`
 * scratch layout exists, and resets an owned base by clearing its contents.
 * Depends on constants, errors, and the fs-io primitives.
 */
/**
 * Clear all contents of an owned base and re-establish the sentinel and scratch
 * directories. Refuses to touch a base that is not owned.
 */
export declare function resetOwnedBase(basePath: string): Promise<void>;
/**
 * Ensure `basePath` is an OpenDesign-owned managed base: create it if missing,
 * claim an empty unmarked directory, reject foreign/non-empty or invalid-marker
 * directories, and guarantee the scratch layout exists.
 */
export declare function ensureManagedBase(basePath: string): Promise<void>;
//# sourceMappingURL=store.d.ts.map