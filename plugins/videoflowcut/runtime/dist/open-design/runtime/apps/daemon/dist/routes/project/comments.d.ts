import type { Express, Request } from 'express';
import type { CommentSyncStateService } from '../../collab/comment-sync-state.js';
import type { PreviewComment, WorkspaceCollabContext } from '@open-design/contracts';
import type { RouteDeps } from '../../server-context.js';
import type { BoundWorkspaceResourceMutationGate } from '../../collab/workspace-resource-mutation.js';
export type ProjectCommentWorkspaceContextResolution = {
    ok: true;
    context: WorkspaceCollabContext | null;
} | {
    ok: false;
    status: 400 | 401 | 403 | 503;
    code: string;
    message: string;
    retryable?: true;
};
export interface RegisterProjectCommentRoutesDeps extends RouteDeps<'db' | 'projectStore' | 'conversations'> {
    /** Optional in focused CRUD fixtures; production supplies request-scoped analytics. */
    telemetry?: RouteDeps<'telemetry'>['telemetry'];
    /**
     * Gate POST (create/edit)/PATCH status/DELETE on the caller's WORKSPACE
     * identity, before the author-identity logic below ever runs (spec 04 §10
     * fix #4/#6 — recvqbklNGDqYY: a comment had zero `enforceWorkspace*`
     * coverage, the one fully-unguarded write path among the four resource
     * types). A comment has no workspace binding of its own, so this borrows
     * the PARENT PROJECT's binding via `getWorkspaceProject`/
     * `getWorkspaceProjectByProjectId` (both already available on
     * `ctx.projectStore`) — the same instance `routes/project/index.ts` built
     * for its own project routes (cross-check against the daemon's own
     * last-known membership included), threaded down through
     * `registerProjectConversationRoutes` rather than re-derived here.
     *
     * Optional, and a no-op when omitted, so fixtures that only exercise
     * comment CRUD semantics (most of this file's existing tests, which use
     * plain non-workspace-bound projects) keep compiling and behaving exactly
     * as before — an unbound project's comments were never gated either way,
     * since `enforceWorkspaceResourceMutation` itself passes a `row === null`
     * lookup straight through regardless of ctx.
     */
    enforceWorkspaceProjectMutation?: BoundWorkspaceResourceMutationGate;
    /** Paired with `enforceWorkspaceProjectMutation` above — see that field. */
    sendApiError?: (res: any, status: number, code: string, message: string) => unknown;
    /**
     * Resolve and authorize the PERSISTED project's Workspace scope. Production
     * wiring verifies request headers against the membership directory and then
     * checks that the resulting workspace id matches the project's binding.
     * Directory failure is returned as a typed error and must fail closed before
     * any local mutation or relay call.
     */
    resolveWorkspaceContext?: (req: Request, projectId: string) => Promise<ProjectCommentWorkspaceContextResolution>;
    /**
     * Bounded successful authority lease for pure comment-list reads. Production
     * uses the same cached verifier as other project GET routes. Comment
     * mutations continue to use `resolveWorkspaceContext` above, which is fresh
     * and fail-closed on every write.
     */
    resolveReadWorkspaceContext?: (req: Request, projectId: string) => Promise<ProjectCommentWorkspaceContextResolution>;
    /**
     * Fresh cloud authority used only before pulling remote comment state. Local
     * list/create/edit/delete paths use the persisted project binding and must
     * remain available while the membership directory is offline.
     */
    resolveFreshWorkspaceContext?: (req: Request, projectId: string) => Promise<ProjectCommentWorkspaceContextResolution>;
    /**
     * Resolve the CURRENT caller's workspaceMemberId from the request identity
     * (workspace context). Server-authoritative — used both to stamp the author on
     * a new/edited comment and to gate status/delete on the caller's identity.
     * Optional: off-team it returns undefined and comments are stored without an
     * author and no permission gating applies.
     */
    resolveAuthorMemberId?: (authorization: string | undefined) => Promise<string | undefined>;
    /** Trusted authenticated user name/email, never from request body or a member-id fallback. */
    resolveCurrentAuthorDisplayName?: () => string | null;
    prepareCommentFile?: (projectId: string, filePath: string, context: WorkspaceCollabContext | null) => Promise<string | undefined>;
    /**
     * Resolve a shared project's OWNER workspaceMemberId (server-authoritative,
     * from the team hub). Used to let the project owner delete / send-to-agent on
     * another member's comment. Null off-team / when the project is not shared.
     */
    resolveProjectOwnerMemberId?: (projectId: string, context?: WorkspaceCollabContext | null) => Promise<string | null>;
    /**
     * Server-authoritative shared-project test. Legacy comments without an
     * author remain mutable in personal/unshared projects, but in a shared
     * project they are owner-only. Resolution failure must deny rather than
     * degrading open.
     */
    isSharedProject?: (projectId: string, context?: WorkspaceCollabContext | null) => Promise<boolean>;
    /**
     * Fired after a comment is created OR edited (body upsert), so the collab-cloud
     * service can push it to the cross-daemon relay (best-effort — a push failure
     * must not fail the local save). No-op off-team / when the collab cloud is
     * unconfigured.
     */
    onCommentCreated?: (comment: PreviewComment, context: WorkspaceCollabContext | null) => boolean | void;
    /**
     * Fired after a comment's status changes (the send-to-agent lifecycle), so the
     * new status propagates to other members. Best-effort.
     */
    onCommentUpdated?: (comment: PreviewComment, context: WorkspaceCollabContext | null) => boolean | void;
    /**
     * Fired after a comment is deleted, with the comment as it last existed, so a
     * tombstone can be pushed to the relay. Best-effort.
     */
    onCommentDeleted?: (comment: PreviewComment, context: WorkspaceCollabContext | null) => boolean | void;
    /** Persist exact changes to a previously published personal comment, even while its alias is stopped. */
    onPublishedCommentMutation?: (comment: PreviewComment, context: WorkspaceCollabContext | null, deleted: boolean) => boolean | void;
    /** Production relay eligibility, including creator-scoped public shares. */
    isCommentRelayEligible?: (projectId: string, filePath: string, context: WorkspaceCollabContext | null) => boolean;
    /**
     * Fired when the comment list is read. The hub push channel marks closed
     * projects comment-dirty instead of pulling eagerly; the first read after
     * opening consumes that mark and awaits an immediate cloud pull before the
     * list is serialized, so an opened project catches up in its first response
     * instead of requiring a second read after the next poll tick.
     */
    /** Explicit sync for UI and CLI, independent of events subscribers/dirty marks. */
    pullCommentsNow?: (projectId: string, context: WorkspaceCollabContext) => Promise<boolean>;
    onCommentsRead?: (projectId: string, context: WorkspaceCollabContext | null, resolveFreshWorkspaceContext: () => Promise<ProjectCommentWorkspaceContextResolution>) => Promise<void> | void;
}
/** Independent read-only diagnostic. This is not the K8 outbox retry action. */
export declare function registerCommentAlignmentRoutes(app: Express, deps: {
    db: RegisterProjectCommentRoutesDeps['db'];
    alignment: {
        check: (projectId: string, context: WorkspaceCollabContext) => Promise<import('@open-design/contracts').CommentAlignResult>;
    };
    authorize: (req: Request, projectId: string) => Promise<ProjectCommentWorkspaceContextResolution>;
}): void;
/** K8 supply only: null body means not determined, never default false.
 * POST retries existing scoped intents through the normal background drain.
 */
export declare function registerCommentSyncStateRoutes(app: Express, deps: {
    db: RegisterProjectCommentRoutesDeps['db'];
    service: CommentSyncStateService;
    authorize: (req: Request, projectId: string) => Promise<ProjectCommentWorkspaceContextResolution>;
}): void;
export declare function registerProjectCommentRoutes(app: Express, ctx: RegisterProjectCommentRoutesDeps): void;
