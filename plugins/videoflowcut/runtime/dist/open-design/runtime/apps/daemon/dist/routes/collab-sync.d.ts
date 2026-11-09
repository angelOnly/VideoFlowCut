import type { Express, Request } from 'express';
import { type ReadProjectShareState } from '../collab/vela-project-share-state.js';
import type { createShareAliasReservations } from '../collab/share-alias-reservation.js';
import type { createSharePublicationCompletion } from '../collab/share-publication-completion.js';
import type { ShareBindingOutbox } from '../collab/share-binding-outbox.js';
import type { runVelaCommand } from '../integrations/vela-command.js';
import { type AmrShareLink, type PublicShareLink } from '../collab/public-share-viewer-url.js';
import type { RecordPublicFilePublication } from '../collab/public-file-publication-recording.js';
import type { ShareContentFingerprints } from '../collab/share-content-fingerprint.js';
import type { PublicFileMutations } from '../collab/public-file-mutations.js';
import { type ProjectContentTransferState, type ProjectMetadata, type TeamProject, type WorkspaceCollabContext } from '@open-design/contracts';
import type { OwnedContentSync } from '../collab/owned-content-sync.js';
import type { ProjectContentTransferToken } from '../collab/project-content-transfer-state.js';
import type { VerifiedWorkspaceRequestContextResult } from '../collab/request-workspace-context.js';
import type { CollabRuntime } from '../collab/runtime.js';
import { type ResourceHubPrincipal } from '../collab/resource-principal.js';
import { type AuthorizedProactivePullInvocation, type ProactivePullAuthorizationWitness } from '../collab/proactive-content-pull.js';
import { type AuthorizedTeamProjectPullReceipt, type StageAuthorizedTeamProjectPullInput, type StagedAuthorizedTeamProjectPull } from '../collab/authorized-team-project-pull.js';
import { type PromoteAuthorizedTeamProjectStageInput } from '../collab/team-mirror-promotion.js';
import { type PublicFilePublicationScope, type PublicFilePublicationStore } from '../collab/public-file-publication-store.js';
/** The fields register-on-pull reads out of a pulled project's manifest. */
export interface PulledProjectManifest {
    name?: string;
    skillId?: string | null;
    designSystemId?: string | null;
    createdAt?: number;
    updatedAt?: number;
}
export interface RegisterPulledProjectInput {
    id: string;
    name: string;
    skillId: string | null;
    designSystemId: string | null;
    metadata?: ProjectMetadata;
    createdAt: number;
    updatedAt: number;
}
export interface TeamMirrorPullScope {
    /** Exact catalog-bound root; never supplied by an HTTP caller. */
    resourceId?: string;
    workspaceId: string;
    resourceTeamId: string;
    viewerMemberId: string;
    ownerMemberId: string;
}
export interface PulledProjectStore {
    get?: (projectId: string) => {
        name?: string | null;
        metadata?: unknown;
    } | null;
    has(projectId: string): boolean;
    register(input: RegisterPulledProjectInput): void;
    update?: (input: RegisterPulledProjectInput) => void;
    /**
     * Atomically materialize the project row and its active team binding, then
     * return only after a strict readback proves the mirror is mutation-gated.
     */
    materializeTeamMirror?: (input: RegisterPulledProjectInput, scope: TeamMirrorPullScope, fileReceipt?: {
        resourceId: string;
        versionId: string;
    }) => {
        localRecordChanged: boolean;
    };
    /** Atomically create a stamped, creator-less Team-bound first-open row. */
    materializeTeamPlaceholder?: (input: RegisterPulledProjectInput, scope: TeamMirrorPullScope) => {
        localRecordChanged: boolean;
    };
    materializeAuthorizedTeamMirror?: (input: RegisterPulledProjectInput, scope: TeamMirrorPullScope, receipt: AuthorizedTeamProjectPullReceipt) => {
        localRecordChanged: boolean;
    };
}
type CollabSyncPullTimingStatus = 'pulled' | 'revoked' | 'register_failed' | 'threw' | 'staged' | 'capability-unavailable' | 'failed';
export interface RegisterCollabSyncRoutesDeps {
    ownedContentSync?: OwnedContentSync;
    collab: Pick<CollabRuntime, 'scheduler' | 'publishedVersion' | 'publishedHead' | 'projectSyncState' | 'projectOwnerMemberId' | 'forgetTeamShare' | 'pullLatest'>;
    resolveSharedProjectOwner?: (projectId: string, scope?: {
        workspaceId: string;
        workspaceMemberId: string;
    }) => Promise<string | null>;
    /**
     * Read-only owner lookup for GET /collab/status. This may use a short-lived
     * explicit-scope display cache because request authority is verified first.
     * Pull, publish, presence, and mutation paths deliberately keep using the
     * fresh `resolveSharedProjectOwner` dependency above.
     */
    resolveSharedProjectOwnerForStatus?: (projectId: string, scope?: {
        workspaceId: string;
        workspaceMemberId: string;
    }) => Promise<string | null>;
    resolveSharedProject?: (projectId: string, scope?: TeamMirrorPullScope | null) => Promise<TeamProject | null>;
    /**
     * Authorize the request's explicit Workspace selector against the signed-in
     * account's authoritative membership directory, then return the directory-
     * derived context. Client-supplied role/permission headers are never
     * authority. Null is a fail-closed denial.
     */
    verifyWorkspaceRequest?: (req: Request, projectId?: string) => Promise<VerifiedWorkspaceRequestContextResult | WorkspaceCollabContext | null>;
    /**
     * Bounded successful authority lease for the read-only status surface.
     * Mutations and content materialization must continue to use
     * `verifyWorkspaceRequest`.
     */
    verifyWorkspaceReadRequest?: (req: Request, projectId?: string) => Promise<VerifiedWorkspaceRequestContextResult | WorkspaceCollabContext | null>;
    /**
     * Revalidate one already-captured Team pull scope against the authoritative
     * membership directory. This must address `scope.workspaceId` +
     * `scope.viewerMemberId` directly; it must not compare against the daemon's
     * mutable active Workspace.
     */
    verifyWorkspaceScope?: (scope: TeamMirrorPullScope) => Promise<boolean>;
    resolveTeamProjectResourceId?: (projectId: string, scope: TeamMirrorPullScope) => Promise<string>;
    /** Set/clear the non-destructive "team mirror revoked" flag on a local
     *  project so read routes stop serving a project that has left the team. */
    markTeamProjectRevoked?: (projectId: string, revoked: boolean) => void;
    /** Read the same durable quarantine marker for status/direct-read denial. */
    isTeamProjectRevoked?: (projectId: string) => boolean;
    /**
     * Set/clear the `sharedProjectPlaceholderAt` stamp on a local project's
     * metadata (see collab/shared-project-placeholder.ts). Set when
     * `ensureSharedProjectPlaceholder` registers a placeholder record; cleared
     * exactly once a pull has materialized real hub content locally. While the
     * stamp is set, the publish paths refuse to treat the local copy as content
     * authority (the recvqzaDvUU6B3 fresh-install wipe guard).
     */
    markSharedProjectPlaceholder?: (projectId: string, placeholder: boolean) => void;
    /**
     * Delete a local project record that is still an unmaterialized
     * shared-project placeholder (and its empty content directory). Called by
     * the retracted-share heal below ONLY for a record the placeholder stamp
     * proves contentless — implementations must re-check
     * `isUnmaterializedSharedPlaceholder` before deleting so a concurrent pull
     * that just materialized real content can never be destroyed.
     */
    retireUnmaterializedSharedPlaceholder?: (projectId: string) => void;
    /** Drop the daemon's cached team-project catalog listing so a heal that
     *  removed a catalog row is visible on the next list read, not one
     *  stale-while-revalidate TTL later. */
    invalidateTeamProjectCatalog?: () => void;
    resolveOwnerDisplayName?: (memberId: string, context: WorkspaceCollabContext) => Promise<{
        displayName: string;
        role: 'owner' | 'admin' | 'member';
    } | null>;
    projectStore?: PulledProjectStore;
    resolveProjectDir?: (projectId: string) => string | Promise<string>;
    /** Durable publication metadata used to restore public links after restart. */
    publicFilePublicationStore?: PublicFilePublicationStore;
    shareContentFingerprints?: ShareContentFingerprints;
    readProjectShareState?: ReadProjectShareState;
    /** Durable local author proof for a not-yet-catalogued project. Never inferred from the requester. */
    resolveLocalPublicShareOwner?: (projectId: string, workspaceId: string) => string | null;
    /** The only presentation rule for a publication's Viewer address: explicit
     * local override, else the address AMR reported (fresh evidence or the
     * persisted copy, re-verified), else unavailable. Unwired means unavailable,
     * never the stored URL. */
    resolvePublicShareLink?: (projectId: string, slug: string, amr: AmrShareLink | string | null) => PublicShareLink;
    recordPublicFilePublication?: RecordPublicFilePublication;
    sharePublishing?: {
        ensureProject?(scope: PublicFilePublicationScope, principal: ResourceHubPrincipal, run: typeof runVelaCommand): Promise<TeamProject>;
        sourceFileId?(scope: PublicFilePublicationScope, project?: TeamProject | null): string;
        admitFileReceipt?(scope: PublicFilePublicationScope, resourceId: string, versionId: string, entryPath: string, run: typeof runVelaCommand): Promise<void>;
        reservations: ReturnType<typeof createShareAliasReservations>;
        outbox: ShareBindingOutbox;
        complete: ReturnType<typeof createSharePublicationCompletion>;
        prepare(scope: PublicFilePublicationScope, slug: string): Promise<{
            run: typeof runVelaCommand;
        }>;
        retry(): void;
    };
    publicFileMutations?: PublicFileMutations;
    resolvePullDir?: (projectId: string) => string;
    /** Read the durable local materialization cursor for this exact team mirror. */
    readMaterializedVersion?: (projectId: string, scope: TeamMirrorPullScope) => number | null;
    /** Read the daemon-local inbound content-transfer lifecycle snapshot. */
    readContentTransferState?: (projectId: string, scope: TeamMirrorPullScope) => ProjectContentTransferState | null;
    /** Begin one exact-scope transfer generation after authorization resolves. */
    beginContentTransfer?: (projectId: string, scope: TeamMirrorPullScope, version?: number) => ProjectContentTransferToken;
    /** Only the matching exact-scope generation token may complete a transfer. */
    finishContentTransfer?: (projectId: string, scope: TeamMirrorPullScope, token: ProjectContentTransferToken, version?: number) => void;
    /** Persist the actual version after either HTTP or proactive pull lands. */
    writeMaterializedVersion?: (projectId: string, scope: TeamMirrorPullScope, version: number) => void | Promise<void>;
    /**
     * Tell the proactive coordinator that the fallback HTTP/legacy lane
     * durably landed this exact scope + version. This runs only after the
     * cursor commit, so consumers may settle a queued same-head retry without
     * trusting an in-memory claim that is ahead of disk.
     */
    onLegacyPullMaterialized?: (projectId: string, scope: TeamMirrorPullScope, version: number) => void | Promise<void>;
    readManifest?: (projectDir: string) => Promise<PulledProjectManifest | null>;
    authorizedTeamProjectPull?: {
        journalDir: string;
        getActiveWorkspaceSnapshot?: () => {
            workspaceId: string | null;
            generation: number;
        };
        stage?: (input: StageAuthorizedTeamProjectPullInput) => Promise<StagedAuthorizedTeamProjectPull>;
        promote?: (input: PromoteAuthorizedTeamProjectStageInput<{
            localRecordChanged: boolean;
        }>) => Promise<{
            localRecordChanged: boolean;
        }>;
    };
    onTeamShareStateChanged?: (input: {
        projectId: string;
        principal?: ResourceHubPrincipal | null;
        visibility: 'personal' | 'team';
        ownerMemberId?: string | null;
        updatedByMemberId?: string | null;
    }) => void;
    /**
     * Notify any live `/api/projects/:id/events` SSE subscribers that this
     * project's files changed on disk. Called after a successful
     * `POST /collab/pull` materializes new content.
     *
     * This is NOT redundant with the project's chokidar watcher: the `vela
     * resource pull` transport materializes a pulled project by replacing its
     * ENTIRE directory (a fresh inode every pull, confirmed via `stat` across
     * repeated pulls against a live resource-hub project) rather than updating
     * files in place. A chokidar watch established before that swap keeps
     * watching the OLD (now-orphaned) directory handle and silently stops
     * firing — so the member's own currently-open FileViewer tab never saw
     * `file-changed`, even though `/collab/status` and the file's bytes on disk
     * were both already correct (recvq6CIesNvWZ). Firing this explicit signal
     * right after the pull we know just landed sidesteps the swap entirely
     * instead of depending on chokidar surviving it.
     */
    notifyFilesChanged?: (projectId: string) => void;
    /**
     * Notify any live `/api/projects/:id/events` SSE subscribers that this
     * project's LOCAL record (name / skill / design-system) changed as part of
     * a pull. `registerPulledProject` is what replaces the "共享项目"
     * placeholder record with the real project name — but that write is
     * DB-only, and the only other post-pull signal (`notifyFilesChanged`)
     * refreshes the file list, never the project record. Without this signal a
     * member web that seeded its `projects` state from the placeholder keeps
     * rendering "共享项目" in the sidebar/tab until a full page reload
     * (recvqhwv6RPU1j). Wired to the existing `project-metadata-changed` thin
     * event; fired only when the pull actually registered or updated the local
     * record, so steady-state content pulls emit nothing.
     */
    notifyProjectMetadataChanged?: (projectId: string) => void;
    /** Opt-in, secret-free timing observer. It must not affect pull behavior. */
    onPullTiming?: (event: {
        phase: 'route-started' | 'initial-authorization-reused' | 'authorized-stage-started' | 'authorized-stage-done' | 'authorized-receipt-validated' | 'authorized-scope-revalidated' | 'promotion-started' | 'promotion-done' | 'version-persisted' | 'transport-invoke' | 'transport-done' | 'registration-prepared' | 'catalog-revalidated' | 'scope-revalidated' | 'mirror-materialized' | 'version-write-started' | 'persisted' | 'route-completed';
        projectId: string;
        version?: number;
        receivedAtMs?: number;
        atMs: number;
        status?: CollabSyncPullTimingStatus;
    }) => void;
}
/** Result of one shared-project content pull — the same flow whether it was
 *  reached over `POST /api/projects/:id/collab/pull` or daemon-internally
 *  through {@link CollabSyncRoutesHandle.pullSharedProject}. */
export type CollabSyncPullOutcome = {
    status: 'pulled';
    version: number | null;
} | {
    status: 'revoked';
} | {
    status: 'register_failed';
};
/** Daemon-internal surface `registerCollabSyncRoutes` hands back so non-HTTP
 *  callers (the hub push channel's proactive content pull, server.ts) can run
 *  the same pull flow the POST route runs. */
export interface CollabSyncRoutesHandle {
    /**
     * Materialize the latest published content for a shared project, exactly as
     * `POST /api/projects/:id/collab/pull` would: revocation gate, owner-routed
     * hub pull, register-on-pull, and the `file-changed` /
     * `project-metadata-changed` signals. The viewer principal is derived from
     * the daemon's own workspace context (there is no request to read headers
     * from). Concurrent pulls for the same project+scope — including a member
     * web's racing POST — coalesce onto one in-flight materialization.
     */
    pullSharedProject(projectId: string, scope: TeamMirrorPullScope, authorizationWitness?: ProactivePullAuthorizationWitness, expectedVersion?: number, authorizedStageInvocation?: AuthorizedProactivePullInvocation): Promise<CollabSyncPullOutcome>;
}
export declare function registerCollabSyncRoutes(app: Express, deps: RegisterCollabSyncRoutesDeps): CollabSyncRoutesHandle;
export {};
