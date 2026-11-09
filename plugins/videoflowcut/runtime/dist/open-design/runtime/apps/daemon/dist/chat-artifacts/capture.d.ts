import type Database from 'better-sqlite3';
import type { ChatArtifactBlobStore } from './blob-store.js';
import { type ChatArtifactQuota } from './quota.js';
import type { ChatArtifactFailureCode } from './types.js';
export interface ChatArtifactCaptureDeps {
    db: Database.Database;
    blobs: ChatArtifactBlobStore;
    quota?: ChatArtifactQuota;
    now?: () => number;
}
/** Which digest column the captured bytes populate. */
export type ChatArtifactCaptureRole = 'content' | 'thumbnail';
export interface CaptureFromBytesInput {
    projectId: string;
    /** Project-relative, forward-slash. Recorded as capture-time history. */
    projectRelativePath: string;
    kind: string;
    mime?: string;
    bytes: Buffer;
    role?: ChatArtifactCaptureRole;
    runId?: string;
    mediaTaskId?: string;
    /** Advance the Design Files latest pointer with these bytes. */
    advanceWorkspaceLatest?: boolean;
    sourceMtime?: number;
}
export interface CaptureFromPathInput {
    projectId: string;
    projectRelativePath: string;
    kind: string;
    mime?: string;
    absolutePath: string;
    role?: ChatArtifactCaptureRole;
    runId?: string;
    mediaTaskId?: string;
    /**
     * The fingerprint the terminal chokepoint observed. When present it is a
     * precondition, not a hint: a mismatch fails the capture as `source_changed`.
     */
    expected?: {
        size?: number;
        mtimeMs?: number;
    };
}
export interface ChatArtifactCaptureResult {
    /** Empty string when `state` is `skipped` — no snapshot row was written. */
    snapshotId: string;
    workspaceArtifactId: string;
    /**
     * `skipped` means this kind's policy does not store original bytes at all
     * (user ruling 2026-09-02: video / audio). It is deliberately NOT `failed`:
     * nothing was attempted, so nothing is missing, and the card falls back to
     * the live workspace file exactly as a legacy message does. Reporting it as
     * a failure would bury the real failures — quota, drift, renderer — that the
     * state exists to surface.
     */
    state: 'ready' | 'failed' | 'skipped';
    failureCode?: ChatArtifactFailureCode;
    contentDigest?: string;
    byteSize?: number;
}
/**
 * Capture bytes the daemon already holds in memory.
 *
 * This is the STRONG path (spec §5.1.1): the provider handed us these exact
 * bytes, so there is no filesystem race to lose. Nothing is re-read from a
 * path that a later turn may already have overwritten.
 */
export declare function captureChatArtifactSnapshotFromBytes(deps: ChatArtifactCaptureDeps, input: CaptureFromBytesInput): Promise<ChatArtifactCaptureResult>;
/**
 * Capture bytes that only exist at a path.
 *
 * This is the GENERIC path (spec §5.1.2) for shell / Write / Edit writes. It
 * stats before and after the copy and refuses on any drift: the file is a
 * moving target, so "the copy completed" is not sufficient evidence that the
 * copy is of the right version.
 */
export declare function captureChatArtifactSnapshotFromPath(deps: ChatArtifactCaptureDeps, input: CaptureFromPathInput): Promise<ChatArtifactCaptureResult>;
