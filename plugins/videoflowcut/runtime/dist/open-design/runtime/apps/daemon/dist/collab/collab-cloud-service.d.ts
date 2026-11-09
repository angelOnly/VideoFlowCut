import type { CollabCloudComment, CollabCloudMemberDirectoryEntry, PreviewComment, WorkspaceCollabContext } from "@open-design/contracts";
import { type CollabCloudClient } from "../integrations/collab-cloud.js";
import type { SyncedCommentMergeResult } from "../db.js";
import { type CommentInboundStore, type MemberSyncScope } from "./comment-inbound-store.js";
import type { WorkspaceContextProvider } from "./workspace-context.js";
import type { CommentRelayScope } from "./comment-relay-scope.js";
import type { CommentRelayOutboxIdentity, CommentRelayOutboxRecord, CommentRelayOutboxStore } from "./comment-relay-outbox.js";
/** The daemon-local seams the service needs; injected so this file stays free of
 *  SQLite and the poller is unit-testable with fakes. */
export interface CollabCloudServiceDeps {
    client: CollabCloudClient;
    /**
     * Legacy construction seam retained for compatibility with isolated callers.
     * Project operations never read it: ambient active-workspace state is not
     * data-plane authority.
     */
    workspaceContext?: WorkspaceContextProvider;
    /** Local project ids to poll for inbound comments. */
    listProjectIds: () => string[];
    /** Resolve the exact persisted + directory-verified scope for one project. */
    resolveProjectWorkspaceContext?: (projectId: string, options?: {
        fresh?: boolean;
    }) => Promise<WorkspaceCollabContext | null>;
    /**
     * Resolve one fresh directory authority for a durable relay batch. The
     * returned context must still match the persisted identity; the service
     * verifies that before any catalog read or push.
     */
    resolveCommentRelayWorkspaceContext?: (identity: CommentRelayOutboxIdentity, options: {
        fresh: true;
    }) => Promise<WorkspaceCollabContext | null>;
    /** A bounded move/reconciliation fence: false means retry, never discard staging. */
    captureCommentRelayProjectBinding?: () => (projectId: string) => boolean;
    /** Cheap local binding witness applied per queued record in a batch. */
    validateCommentRelayProjectBinding?: (record: CommentRelayOutboxRecord) => boolean;
    /** Distinct from project authority: unknown throws/retries; only proven retirement cancels. */
    validateCommentRelayFile?: (record: CommentRelayOutboxRecord) => 'current' | 'retired';
    /**
     * True when a personal record failed that witness only because its creator's
     * project was explicitly made team-visible. Such a record is re-queued as
     * Team relay instead of being cancelled.
     */
    isCommentRelayRecordPromotedToTeam?: (record: CommentRelayOutboxRecord) => boolean;
    /** Creator-scoped eligibility for active public files of private projects. */
    commentRelayScope?: (projectId: string, filePath: string, context: WorkspaceCollabContext) => CommentRelayScope | null;
    /** Exact active personal-publication files for this project's persisted creator.
     * This must fail closed and must not consult the member directory. */
    listPersonalCommentRelayFilePaths?: (projectId: string, context: WorkspaceCollabContext) => ReadonlySet<string>;
    /**
     * Where a comment we already store lives, by project AND comment id.
     *
     * A deletion arriving from the cloud carries no anchor: there is nothing left
     * to point at. The personal path filters incoming records by `filePath`, so a
     * tombstone matches nothing and is dropped — while the cursor still advances
     * past it. The deletion is then unreachable forever, and the local copy keeps
     * a comment the author deleted on the web.
     *
     * Resolving the stored record's own `filePath` is what lets a tombstone be
     * judged by the same publication rules as the comment it deletes, instead of
     * by an anchor it cannot have.
     *
     * Contract, and each clause is load-bearing:
     * - BOTH ids are required. Matching on comment id alone would let one
     *   project's deletion reach another project's row.
     * - `found: false` means the row is genuinely absent — a safe no-op.
     * - A failed lookup MUST throw. It must never be reported as absence: that
     *   would turn "the database did not answer" into "there is nothing to
     *   delete", and the batch would be acknowledged with the deletion lost.
     * - Only the stored path is returned. The comment's own content stays out of
     *   this seam; the caller is deciding eligibility, not reading the comment.
     */
    resolveStoredCommentLocation?: (projectId: string, commentId: string) => {
        found: false;
    } | {
        found: true;
        filePath: string | null;
    };
    /** Resolve a server-asserted publication identity to a currently published local path.
     * null is an unknown/stopped alias; errors retain the batch cursor for retry.
     * This does not authorize a merge: existing identity/file checks still apply.
     */
    resolvePublishedCommentSourcePath?: (input: {
        projectId: string;
        publicationSlug: string;
        publishedPath: string;
        context: WorkspaceCollabContext;
    }) => string | null;
    /** Local binding witness captured synchronously when the mutation commits. */
    resolveLocalProjectRelayBinding?: (projectId: string) => {
        workspaceId: string;
        ownerMemberId: string | null;
    } | null;
    /** Fresh remote catalog witness checked immediately before each relay push. */
    resolveRemoteProjectOwnerMemberId?: (projectId: string, context: WorkspaceCollabContext) => Promise<string | null>;
    /**
     * One uncached Team catalog snapshot for a durable relay batch. Multiple
     * owners for the same project id are retained and matched exactly.
     */
    listRemoteProjectRelayBindings?: (context: WorkspaceCollabContext) => Promise<Array<{
        projectId: string;
        ownerMemberId: string;
    }>>;
    /**
     * Resolve a LOCAL conversation id to re-home synced comments onto (conversation
     * ids do not cross daemons, and preview_comments has a conversation FK). Null
     * when the project has no local conversation yet — the poller then skips it.
     */
    resolveLocalConversationId: (projectId: string) => string | null;
    /**
     * Merge one pulled comment into local storage, idempotently by comment id.
     * Acknowledge changed or safely unchanged state; throw on persistence failure.
     */
    mergeComment: (input: {
        projectId: string;
        conversationId: string;
        comment: CollabCloudComment;
        /**
         * The seq space `comment.seq` belongs to (relay team + stream). Seqs are
         * only comparable within one stream: a rebuilt member stream renumbers,
         * and a personal and a team relay count independently.
         */
        stream?: string;
    }) => SyncedCommentMergeResult;
    /**
     * Durable C3-LITE member-page cursor + atomic page commit. When present, a
     * team project's MEMBER comments arrive through bounded pages (snapshot,
     * then incremental rounds) instead of the legacy unbounded pull. Share-page
     * (user) comments still come from the legacy pull until public paging (BA2)
     * exists. Omitted → legacy pull only, exactly as before.
     */
    memberCommentStore?: CommentInboundStore;
    /**
     * Local binding witness for team pulls and member paging: false once this
     * project is no longer team-shared here (stop sharing flips visibility inside the same
     * workspace, so the workspace context alone cannot see it). False drops the
     * project's member cursors/ledgers and refuses in-flight pages. Omitted →
     * the workspace context is the only witness.
     */
    isMemberSyncProjectShared?: (projectId: string) => boolean;
    /**
     * The stored member cursor was unusable (C3-LITE §4 `INVALID_CURSOR`,
     * `CURSOR_STALE`, `SCOPE_CHANGED`, or a page whose scope token no longer
     * matches the stored round) and a rebuild is starting: the cursor has been
     * reset and the same drain continues with a fresh snapshot. Diagnostic only.
     */
    onMemberSyncRebuildRequired?: (input: {
        projectId: string;
        scope: MemberSyncScope;
        code: "INVALID_CURSOR" | "CURSOR_STALE" | "SCOPE_CHANGED";
    }) => void;
    /** Poll cadence; defaults to the spec's foreground 5s (§D4.5). */
    pollIntervalMs?: number;
    /** Durable outbound Team-comment queue. Omitted by isolated/local callers. */
    commentOutbox?: CommentRelayOutboxStore;
    /** Called after a queued create/edit receives its authoritative relay seq. */
    onCommentPushed?: (input: {
        projectId: string;
        commentId: string;
        seq: number;
        memberId: string;
        authorKey?: string;
    }) => void;
    now?: () => number;
    retryDelayMs?: (attemptCount: number) => number;
    /**
     * Delay before the member page route is tried again after `failures`
     * consecutive failed drains of one scope (a programming error such as
     * `INVALID_PAGE_REQUEST` counts one extra). Defaults to
     * `memberPageRetryDelayMs`.
     */
    memberPageRetryDelayMs?: (failures: number) => number;
    onError?: (error: unknown) => void;
    /**
     * At most once per pull round (member page drain + legacy pull), with the
     * number of committed rows that round changed. A trailing rerun is its own
     * round.
     */
    onMerged?: (input: {
        projectId: string;
        inserted: number;
    }) => void;
}
/**
 * Bounded exponential backoff for the member page route. One transient
 * failure is retried on the next poll (0); from the second consecutive failure
 * the delay is 10s, 20s, 40s … capped at 5 minutes. The legacy pull keeps
 * carrying member comments while paging is backed off.
 */
export declare function memberPageRetryDelayMs(failures: number): number;
/**
 * Map a locally-stored preview comment to the cloud sync unit. Carries the full
 * anchoring payload + drift-ladder fields so the comment keeps pointing at the
 * same element on the receiver. `memberId` is the AUTHOR (who wrote it), taken
 * only from the comment's authorMemberId; an authorless comment stays blank so
 * the relay owner is never misrepresented as its author.
 */
export declare function previewCommentToCloud(comment: PreviewComment, _fallbackMemberId: string): CollabCloudComment;
export interface CollabCloudService {
    /** PUT the current member's directory entry (best-effort; no-op off-team). */
    registerSelf(context?: WorkspaceCollabContext): Promise<void>;
    /**
     * Push a created OR edited comment to the cloud (best-effort; no-op off-team).
     * The relay upserts by id and receivers apply the newest by `updatedAt`, so the
     * same call carries both the initial create and any later edit/status change.
     *
     * Resolves with the cloud-assigned `seq` for THIS push (or `null` off-team /
     * on failure) so the caller can reconcile a new comment's provisional
     * `pin_seq` — see `confirmPreviewCommentPinSeq` in db.ts and the
     * recvq5BVsolIxi design note above `previewCommentToCloud`. The value is
     * safe to feed into that reconciliation from EITHER a create or an edit
     * push: the guard there only ever applies once per comment, so whichever
     * push resolves first (in practice almost always the create) wins and a
     * later resolution is a no-op.
     */
    pushComment(comment: PreviewComment, context: WorkspaceCollabContext): Promise<{
        seq: number;
    } | null>;
    /**
     * Push a delete as a tombstone (best-effort; no-op off-team). Receivers remove
     * the comment by id. Stamps a fresh `updatedAt` so the tombstone is not treated
     * as a stale edit if it races an in-flight update.
     */
    pushCommentDeletion(comment: PreviewComment, context: WorkspaceCollabContext): Promise<void>;
    /** Persist a create/edit for asynchronous, restart-safe relay delivery. */
    enqueueComment(comment: PreviewComment, context: WorkspaceCollabContext): boolean;
    /** Persist a delete tombstone for asynchronous, restart-safe delivery. */
    enqueueCommentDeletion(comment: PreviewComment, context: WorkspaceCollabContext): boolean;
    /** Drain due durable deliveries; exposed for deterministic tests/catch-up. */
    flushPendingComments(): Promise<void>;
    /** The explicitly scoped team's member directory (empty only off-team). */
    listMembers(context: WorkspaceCollabContext): Promise<CollabCloudMemberDirectoryEntry[]>;
    /** Resolve one member id to its directory entry, or null. */
    resolveMember(memberId: string, context: WorkspaceCollabContext): Promise<CollabCloudMemberDirectoryEntry | null>;
    /** Run one poll cycle (register + pull + merge across all local projects). */
    pollOnce(): Promise<void>;
    /**
     * Pull + merge ONE project's comments now, regardless of whether it has a
     * live events subscriber. This is the hub push-channel consumer: a
     * `comment-changed` dirty mark must be redeemable even when the project is
     * not in `listProjectIds()` (the poll loop's open-projects scope) — the
     * poll loop otherwise never covers it and the mark would be consumed for
     * nothing. Errors land on `onError`; never throws.
     *
     * Resolves `true` only when a pull actually ran against the relay for this
     * project (a legitimately-empty/not-modified result still counts). Resolves
     * `false` when it no-oped (no team identity yet, no local conversation to
     * merge into) or the pull failed — the caller must then treat its consumed
     * dirty mark as UNREDEEMED and restore it, otherwise a transient miss
     * silently loses the one signal a single comment ever gets.
     */
    pullProject(projectId: string, context: WorkspaceCollabContext): Promise<boolean>;
    /** Last successfully merged cursor for this exact publication/principal scope.
     * Null after restart/before pull; never manufacture cursor zero for align. */
    readMergedCommentCursor(projectId: string, context: WorkspaceCollabContext): number | null;
    /** Start the background poller. */
    start(): void;
    /** Stop the poller. */
    dispose(): void;
}
export declare function createCollabCloudService(deps: CollabCloudServiceDeps): CollabCloudService;
