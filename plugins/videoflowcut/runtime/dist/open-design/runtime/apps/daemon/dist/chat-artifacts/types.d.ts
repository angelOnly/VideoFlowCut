import type { ChatArtifactSnapshotState as ContractChatArtifactSnapshotState } from '@open-design/contracts';
/** Lifecycle of one immutable capture. */
export type ChatArtifactSnapshotState = 'pending' | 'ready' | 'failed' | 'orphaned';
/**
 * Why a capture did not produce exact bytes. Every code here means "we refused
 * to guess": none of them ever licenses installing the CURRENT bytes as if they
 * were the historical ones.
 */
export type ChatArtifactFailureCode = 'source_changed' | 'source_missing' | 'source_unreadable' | 'dependencies_incomplete' | 'blob_missing' | 'digest_mismatch' | 'not_captured' | 'quota_exceeded' | 'too_large' | 'renderer_unavailable' | 'timeout' | 'interrupted' | 'internal_error';
/**
 * The wire DTO is owned by `packages/contracts`. It is re-exported here so
 * daemon modules have one import site, and so a contract change surfaces as a
 * compile error rather than a silently divergent projection.
 *
 * Note what it deliberately does NOT carry: digests, byte sizes and failure
 * codes. Those are diagnostics, and they live on the snapshot metadata
 * endpoint below — a chat card has no business rendering them.
 */
export type { ChatArtifactDisplayPolicy, ChatArtifactRef, } from '@open-design/contracts';
/**
 * The projection's own view of a capture's lifecycle. `orphaned` never reaches
 * a client — it is an internal GC classification — so the wire union in
 * contracts is deliberately narrower than {@link ChatArtifactSnapshotState}.
 */
export type ChatArtifactRefState = ContractChatArtifactSnapshotState;
/** Metadata projection for the workspace-artifact resolve endpoint. */
export interface WorkspaceArtifactMetadata {
    id: string;
    projectId: string;
    /** null once the workspace file was deleted (tombstone). */
    currentPath: string | null;
    kind: string;
    mime?: string;
    currentDigest?: string;
    currentSize?: number;
    currentMtime?: number;
    deleted: boolean;
    createdAt: number;
    updatedAt: number;
}
/** Metadata projection for the snapshot inspect endpoint. */
export interface ChatArtifactSnapshotMetadata {
    id: string;
    projectId: string;
    workspaceArtifactId?: string;
    sourcePathAtCapture: string;
    kind: string;
    mime?: string;
    contentDigest?: string;
    thumbnailDigest?: string;
    byteSize?: number;
    state: ChatArtifactSnapshotState;
    failureCode?: ChatArtifactFailureCode;
    runId?: string;
    mediaTaskId?: string;
    createdAt: number;
    readyAt?: number;
}
/** Content address guard. Anything else must never reach the filesystem. */
export declare function isContentDigest(value: unknown): value is string;
/**
 * The hex half of a `sha256:<hex>` address, or null. Callers that build a
 * storage path MUST go through this so a caller-supplied string can never
 * become a path segment.
 */
export declare function digestHex(value: unknown): string | null;
