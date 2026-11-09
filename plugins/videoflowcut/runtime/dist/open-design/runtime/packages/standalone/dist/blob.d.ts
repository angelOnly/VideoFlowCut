import { type StandaloneBlob, type StandaloneMaterialization } from "./protocol.js";
import type { StandaloneFeedbackEmitter } from "./feedback.js";
export type StandaloneBlobCandidate = Readonly<{
    path: string;
    source: "shell" | "seed";
}>;
export type StandaloneBlobOptions = Readonly<{
    candidates?: readonly StandaloneBlobCandidate[];
    fetch?: typeof globalThis.fetch;
    signal?: AbortSignal;
    feedback?: StandaloneFeedbackEmitter;
    resourceId?: string;
}>;
export type StandaloneBlobResult = Readonly<{
    path: string;
    reused: boolean;
    source: "cas" | "shell" | "seed" | "remote";
}>;
type TreeEntry = Readonly<{
    path: string;
    sha256: string;
    size: number;
}>;
export declare function discardStandaloneStoreEntry(root: string, sourcePath: string): Promise<string | null>;
export declare function ensureStandaloneBlob(root: string, blob: StandaloneBlob, options?: StandaloneBlobOptions): Promise<StandaloneBlobResult>;
export declare function standaloneTreeSha256(entries: readonly TreeEntry[]): string;
export declare function materializeStandaloneBlob(root: string, blob: StandaloneBlob, blobPath: string, materialization: StandaloneMaterialization, options?: Pick<StandaloneBlobOptions, "feedback" | "resourceId">): Promise<Readonly<{
    path: string;
    entrypoint: string;
    reused: boolean;
}>>;
export declare function cleanupStandaloneTrash(root: string, options?: Readonly<{
    maxDurationMs?: number;
    maxEntries?: number;
}>): Promise<Readonly<{
    attempted: number;
    removed: number;
    remaining: number;
}>>;
export {};
//# sourceMappingURL=blob.d.ts.map