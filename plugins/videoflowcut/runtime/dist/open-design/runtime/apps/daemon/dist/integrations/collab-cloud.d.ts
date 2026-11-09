import type { CollabCloudComment, CollabCloudMemberDirectoryEntry, CollabMemberRole } from "@open-design/contracts";
type FetchLike = typeof fetch;
export interface CollabCloudConfig {
    baseUrl: string;
    token: string | null;
}
/** Read the collab-cloud config from env, or null when no URL is configured
 *  (the single "is collab cloud on?" gate — everything degrades to no-op). */
export declare function readCollabCloudConfig(env?: NodeJS.ProcessEnv): CollabCloudConfig | null;
export declare function hasExplicitCollabCloudConfig(env?: NodeJS.ProcessEnv): boolean;
export declare class CollabCloudError extends Error {
    readonly status: number;
    readonly code: string;
    constructor(status: number, code: string, message?: string);
}
export interface CollabCloudMemberRegistration {
    displayName: string;
    role: CollabMemberRole;
}
export interface CollabCloudPullResult {
    comments: CollabCloudComment[];
    latestSeq: number;
}
export type CollabCloudMemberPageMode = "snapshot" | "incremental";
export type CollabCloudMemberPageQuery = {
    mode: CollabCloudMemberPageMode;
    limit?: number;
    /** Continue the current round (mode must match the round's mode). */
    pageToken?: string;
    /** Start a new incremental round from a terminal page's resumeToken. */
    resumeToken?: string;
};
/**
 * A delete as the cloud emits it: `{id, projectId, seq, deleted: true}` and
 * nothing else. `projectId` is filled from the requested scope when absent, so
 * downstream code never has to special-case its presence.
 */
export interface CollabCloudMemberTombstone {
    id: string;
    projectId: string;
    seq: number;
    deleted: true;
}
/** A full member comment (`deleted` absent/false) or a minimal tombstone. */
export type CollabCloudMemberChange = (CollabCloudComment & {
    deleted?: false;
}) | CollabCloudMemberTombstone;
export interface CollabCloudMemberPageSkip {
    /** Position in the page's `comments` array. */
    index: number;
    id: string | null;
    seq: number | null;
    reason: string;
}
export interface CollabCloudMemberPage {
    mode: CollabCloudMemberPageMode;
    comments: CollabCloudMemberChange[];
    /** Items the adapter could not use; the page still commits without them. */
    skipped: CollabCloudMemberPageSkip[];
    hasMore: boolean;
    complete: boolean;
    nextPageToken: string | null;
    resumeToken: string | null;
    scopeToken: string;
    watermarkSeq: number;
    scanThroughSeq: number;
    handoff: {
        sinceSeq: number;
        resumeToken: string;
        scopeToken: string;
    } | null;
    streamEpoch: string;
    latestSeq: number | null;
    nextSeq: number | null;
    snapshotAt: number | null;
}
/** Cursor-invalidation codes (C3-LITE §4): drop the cursor and rebuild. */
export declare const MEMBER_PAGE_REBUILD_CODES: readonly ["INVALID_CURSOR", "CURSOR_STALE", "SCOPE_CHANGED"];
export type CollabCloudMemberRebuildCode = (typeof MEMBER_PAGE_REBUILD_CODES)[number];
export type CollabCloudMemberPageResult = {
    kind: "page";
    page: CollabCloudMemberPage;
} | {
    kind: "rebuild-required";
    code: CollabCloudMemberRebuildCode;
    status: number;
};
/**
 * Parse one C3-LITE member page. Throws on an incoherent envelope; returns
 * per-item skips for malformed comments. Extra envelope fields are ignored.
 */
export declare function parseMemberPage(value: unknown, mode: CollabCloudMemberPageMode, projectId: string): CollabCloudMemberPage;
/** Reject a query the cloud would answer with INVALID_PAGE_REQUEST. */
export declare function assertMemberPageQuery(query: CollabCloudMemberPageQuery): number;
/**
 * Map a transport error to `rebuild-required` when it invalidates the cursor.
 * Everything else — including 400 `INVALID_PAGE_REQUEST`, a programming error
 * that must not be retried into a loop of rebuilds — is rethrown unchanged.
 */
export declare function memberPageRebuildResult(error: unknown): CollabCloudMemberPageResult;
interface CollabCloudClientOptions {
    config?: CollabCloudConfig;
    fetch?: FetchLike;
    timeoutMs?: number;
}
export declare function createCollabCloudClient(options?: CollabCloudClientOptions): {
    isConfigured(): boolean;
    /** Register (idempotently upsert) a member's directory entry. */
    registerMember(teamId: string, memberId: string, input: CollabCloudMemberRegistration): Promise<CollabCloudMemberDirectoryEntry>;
    /** List the team's member directory (memberId → {displayName, role}). */
    listMembers(teamId: string): Promise<CollabCloudMemberDirectoryEntry[]>;
    /** Append a comment to a project's stream; returns the assigned seq. */
    pushComment(teamId: string, projectId: string, comment: CollabCloudComment, idempotencyKey?: string, historicalAuthorMemberId?: string): Promise<{
        seq: number;
        authorKey?: string;
    }>;
    /**
     * Fetch exactly one C3-LITE member page; never drains. Paged mode sends no
     * `If-None-Match` and expects no ETag/304 (C3-LITE §6 item 10).
     */
    pullMemberPage(_teamId: string, projectId: string, query: CollabCloudMemberPageQuery): Promise<CollabCloudMemberPageResult>;
    /**
     * Legacy unbounded pull with `seq > sinceSeq`. `etag` (from a prior pull)
     * enables a 304 short-circuit: on 304 the result echoes back `sinceSeq` as
     * `latestSeq` with no comments, and `notModified` is true. Still the only
     * source of share-page (user) comments until public paging (BA2) lands.
     */
    pullComments(teamId: string, projectId: string, sinceSeq: number, etag?: string | null): Promise<CollabCloudPullResult & {
        notModified: boolean;
        etag: string | null;
    }>;
};
export type CollabCloudClient = ReturnType<typeof createCollabCloudClient>;
/** Build the client from env, or null when the collab cloud is not configured. */
export declare function createCollabCloudClientFromEnv(env?: NodeJS.ProcessEnv): CollabCloudClient | null;
export {};
