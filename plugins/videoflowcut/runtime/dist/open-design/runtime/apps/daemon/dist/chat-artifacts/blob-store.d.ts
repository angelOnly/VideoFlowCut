import fs from 'node:fs';
export interface WrittenTemp {
    /** `sha256:<hex>` computed while streaming; never trusted from a caller. */
    digest: string;
    byteSize: number;
}
export interface TempEntry {
    key: string;
    mtimeMs: number;
    byteSize: number;
}
export interface ChatArtifactBlobStore {
    /** Absolute blob root. Internal diagnostics only — never serialized out. */
    readonly root: string;
    newTempKey(): string;
    storageKeyFor(digest: string): string;
    /** Internal path resolution. Throws on any key that is not well-formed. */
    resolveStorageKey(key: string): string;
    writeTempFromBytes(tempKey: string, bytes: Buffer): Promise<WrittenTemp>;
    writeTempFromPath(tempKey: string, sourceAbsolutePath: string): Promise<WrittenTemp>;
    /** Atomically install a verified temp at its content address. */
    installTemp(tempKey: string, digest: string): Promise<string>;
    discardTemp(tempKey: string): Promise<void>;
    listTempEntries(): Promise<TempEntry[]>;
    hasBlob(storageKey: string): Promise<boolean>;
    readBlob(storageKey: string): Promise<Buffer>;
    createBlobReadStream(storageKey: string): fs.ReadStream;
    /** Size-check an installed blob against the size the database claims. */
    verifyBlob(storageKey: string, expectedByteSize: number): Promise<boolean>;
    removeBlob(storageKey: string): Promise<void>;
    /** Every installed object key. Used by the mark-sweep GC. */
    listObjectKeys(): Promise<string[]>;
}
/**
 * Build (or reuse) the blob store rooted at an explicit daemon data root.
 *
 * `dataDir` is required and must be absolute. There is deliberately no
 * `process.env.OD_DATA_DIR` read and no cwd fallback here — the daemon
 * resolves its data root exactly once, in `server.ts`, and every path derives
 * from that single truth source.
 */
export declare function createChatArtifactBlobStore(input: {
    dataDir: string;
}): ChatArtifactBlobStore;
/** Test seam: drop cached stores so a temp data dir can be recreated. */
export declare function resetChatArtifactBlobStoreCache(): void;
