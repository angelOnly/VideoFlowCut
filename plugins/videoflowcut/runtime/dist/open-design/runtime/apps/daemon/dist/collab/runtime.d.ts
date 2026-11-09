import type { PublicShareProjectRegistration, ProjectSyncState } from '@open-design/contracts';
import { CollabPresenceTracker, type PresenceMember } from './presence-tracker.js';
import { type PublishedResourceVersion, type ResourcePublishAdapter } from './publish-scheduler.js';
import type { ResourceHubPrincipal } from './resource-principal.js';
import { type TeamResourceStateProvider } from './team-resource-state.js';
import type { VelaOwnerProjectRegistration } from './vela-cli-team-projects.js';
import type { WorkspaceContextProvider } from './workspace-context.js';
type TeamProjectCatalogSyncState = 'pending_upload' | 'synced' | 'failed';
interface TeamProjectCatalogSink {
    ensurePrivate?(projectId: string, principal: ResourceHubPrincipal): Promise<PublicShareProjectRegistration>;
    setVisibility?(projectId: string, visibility: 'private' | 'team', principal: ResourceHubPrincipal): Promise<void>;
    getRegistration?(projectId: string, principal: ResourceHubPrincipal): Promise<VelaOwnerProjectRegistration | null>;
    upsert(input: {
        projectId: string;
        resourceId: string;
        displayName?: string | null;
        syncState?: TeamProjectCatalogSyncState;
        lastSyncedVersionId?: string | null;
        metadata?: Record<string, unknown> | null;
    }, principal?: ResourceHubPrincipal | null): Promise<unknown>;
    remove?(projectId: string, principal?: ResourceHubPrincipal | null): Promise<unknown>;
}
/**
 * The subset of {@link CollabPublishScheduler} the rest of the daemon is
 * allowed to drive directly (the HTTP routes and the project file watcher —
 * see `server.ts`'s `notifyFilesChanged` wiring). Narrowed to an interface,
 * rather than exposing the class, so `createCollabRuntime` can hand out a
 * facade that also updates `syncState` on every author-side change without
 * either side needing to know about the other.
 */
export interface CollabRuntimeScheduler {
    notifyChanged(projectId: string, reason?: string, principal?: ResourceHubPrincipal | null): void;
    runBoundary(projectId: string, principal?: ResourceHubPrincipal | null): void;
}
export interface CollabRuntime {
    isTeamShareSuppressed(projectId: string, scope: Pick<ResourceHubPrincipal, 'teamId' | 'memberId'>): boolean;
    forgetTeamShare?(projectId: string, principal?: ResourceHubPrincipal | null): Promise<void>;
    syncExistingTeamProject(projectId: string, principal: ResourceHubPrincipal): Promise<{
        version: number | null;
    }>;
    presence: CollabPresenceTracker;
    scheduler: CollabRuntimeScheduler;
    /** Workspace-context provider — the B-integration seam (identity/visibility). */
    workspaceContext: WorkspaceContextProvider;
    /** Team-resource state provider — the E-resource-hub seam (share/freeze state). */
    teamResources: TeamResourceStateProvider;
    /** Last published version for a project (members poll this to know what to pull). */
    publishedVersion(projectId: string, principal?: ResourceHubPrincipal | null): number | null;
    /**
     * Current published head from the resource hub, not just this daemon's memory.
     * Members never publish the owner's project, so this is the cross-daemon source
     * that tells them a pull is needed.
     */
    publishedHead(projectId: string, principal?: ResourceHubPrincipal | null): Promise<number | null>;
    /** Sync state for a project (`local_only` until a share is requested). */
    projectSyncState(projectId: string, principal?: ResourceHubPrincipal | null): ProjectSyncState;
    /**
     * Explicit Team move: publish the retained root, then ACK visibility.
     */
    requestTeamShare(projectId: string, share?: string | ResourceHubPrincipal): Promise<{
        version: number | null;
        versionId?: string;
    }>;
    /** Move to private without deleting content or catalog identity. */
    requestTeamUnshare(projectId: string, principal?: ResourceHubPrincipal | null): Promise<void>;
    /** Permanent deletion, after public bindings have stopped. */
    requestTeamDelete(projectId: string, principal: ResourceHubPrincipal): Promise<void>;
    /** Restore a persisted team share into runtime bookkeeping without publishing. */
    rememberTeamShare(projectId: string, share: ResourceHubPrincipal, syncState?: ProjectSyncState, restore?: {
        metadataRefreshPending?: boolean;
    }): void;
    /**
     * Re-upsert the shared project's catalog entry so metadata-only changes
     * (rename today) reach teammates without waiting for the next content
     * publish — before this, a rename with no follow-up file edit NEVER
     * converged on member clients. No-op for projects that are not shared
     * from this daemon. Fire-and-forget; failures land on the metadata-only
     * retry hooks and never mutate content `syncState`.
     */
    refreshTeamProjectMetadata(projectId: string): void;
    /** The member who shared this project, or null if not shared here. */
    projectOwnerMemberId(projectId: string, principal?: ResourceHubPrincipal | null): string | null;
    /** Materialize the published tree into the local member copy. */
    pullLatest(projectId: string, principal?: ResourceHubPrincipal | null): Promise<{
        version: number | null;
        versionId?: string;
        resourceId?: string;
    }>;
    dispose(): void;
}
export interface CreateCollabRuntimeOptions {
    coordinatePublication?: (projectId: string, principal: ResourceHubPrincipal | null | undefined, publish: () => Promise<PublishedResourceVersion | null>) => Promise<PublishedResourceVersion | null>;
    adapter?: ResourcePublishAdapter;
    /** Exact persisted server root. When provided, missing authority must throw. */
    resolveResourceId?: (projectId: string, principal?: ResourceHubPrincipal | null) => string | Promise<string>;
    retainRegistration?: (registration: PublicShareProjectRegistration, principal: ResourceHubPrincipal) => void | Promise<void>;
    /** Managed-project directory resolver, so the real hub adapter can pack/land. */
    resolveProjectDir?: (projectId: string) => string | Promise<string>;
    /** Pull destination for a project that may not have a local database row yet. */
    resolvePullDir?: (projectId: string) => string | Promise<string>;
    /** Resource-index metadata for team project discovery/cards. */
    describeProject?: (projectId: string) => Record<string, unknown> | null | Promise<Record<string, unknown> | null>;
    /** Workspace-context provider. Defaults to a dev provider until wired to an identity source. */
    workspaceContext?: WorkspaceContextProvider;
    /** Team-resource state provider. Defaults to a dev provider until wired to the hub. */
    teamResources?: TeamResourceStateProvider;
    /** Vela-owned team-project discovery catalog. Runtime treats it as an injectable sink. */
    teamProjectCatalog?: TeamProjectCatalogSink;
    /** Fired after a project is published so the caller can notify online members. */
    onPublished?: (result: {
        projectId: string;
        version: number;
        versionId?: string;
        reason: string;
        principal: ResourceHubPrincipal | null;
    }) => void;
    /** Fired when a project's presence set changes (join/leave). */
    onPresenceChange?: (result: {
        projectId: string;
        present: PresenceMember[];
    }) => void;
    onError?: (result: {
        projectId: string;
        error: unknown;
        principal: ResourceHubPrincipal | null;
    }) => void;
    /**
     * Metadata-only catalog refresh failures have their own retry loop and must
     * not mark already-published project content as `sync_failed`.
     */
    onMetadataRefreshError?: (result: {
        projectId: string;
        error: unknown;
        principal: ResourceHubPrincipal;
    }) => void;
    /** Persist the exact Team/project repair intent before its async upsert. */
    onMetadataRefreshPending?: (result: {
        projectId: string;
        principal: ResourceHubPrincipal;
    }) => void;
    /** Clear the durable repair intent after the final upsert or unshare wins. */
    onMetadataRefreshComplete?: (result: {
        projectId: string;
        principal: ResourceHubPrincipal;
    }) => void;
    /**
     * Gate for SCHEDULER-driven publishes (file watcher, `/collab/changed`,
     * `/collab/publish`, run boundaries): return false and the flush becomes a
     * no-op for that project. The second layer of the fresh-install wipe guard
     * (recvqzaDvUU6B3) — `should-publish.ts` keeps a placeholder from ever
     * being WATCHED, this keeps an already-scheduled notification (or a direct
     * HTTP nudge) from publishing one. Deliberately NOT consulted by
     * `requestTeamShare`/`publishNow`: an explicit share is the user saying
     * "publish my local state", which must keep working for brand-new local
     * projects. Defaults to allow.
     */
    canPublishProjectContent?: (projectId: string) => boolean;
}
export declare function createCollabRuntime(options?: CreateCollabRuntimeOptions): CollabRuntime;
export {};
