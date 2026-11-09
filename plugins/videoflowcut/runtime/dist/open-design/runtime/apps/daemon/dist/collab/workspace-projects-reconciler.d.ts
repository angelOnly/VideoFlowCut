import type { WorkspaceInvalidationSsePayload } from '@open-design/contracts';
import type { ResourceHubPrincipal } from './resource-principal.js';
/** This daemon's one local `workspace_projects` row for a project, as far as
 *  reconciliation cares. */
export interface LocalTeamProjectBinding {
    projectId: string;
    workspaceId: string;
    visibility: 'personal' | 'team';
    resourceState?: string | null;
    createdByWorkspaceMemberId: string | null;
    resourceHubResourceId: string | null;
    /** A stamped first-open row is not content authority, even for its remote owner. */
    materializationPending?: boolean;
}
/** What the remote catalog says about a shared project — the subset
 *  `listTeamProjects()` (contracts' `TeamProject`) actually carries. */
export interface RemoteTeamProjectRef {
    visibility?: 'private' | 'team';
    projectId: string;
    ownerMemberId: string;
    displayName?: string | null;
    /** Catalog row observation/revision time. Never write this into projects. */
    catalogRevisionAt?: number | null;
    /** Project timestamp authored by the owner and carried inside metadata. */
    originProjectUpdatedAt?: number | null;
}
export interface WorkspaceProjectMetadataPatch {
    name: string;
    updatedAt: number;
}
/** The two remote reads a daemon can consult for catalog MEMBERSHIP. */
export interface ReconcilerRemoteTeamProjectSources {
    /**
     * The raw workspace catalog (`vela team-projects list` via the richer
     * `VelaTeamProjectCatalogClient`), which carries EVERY registered row —
     * including rows whose `syncState` is `pending_upload`/`syncing`/`failed`.
     * Null when the vela transport is not active for this daemon.
     */
    listCatalogMembership: (() => Promise<readonly RemoteTeamProjectRef[]>) | null;
    /**
     * The display catalog (`teamProjectsForDisplay`), which deliberately DROPS
     * rows whose latest publish is not `synced` so teammates never open empty
     * project shells (see `toTeamProject` in collab/vela-cli-team-projects.ts).
     */
    listDisplayTeamProjects: () => Promise<readonly RemoteTeamProjectRef[]>;
}
/**
 * THE INVARIANT: reconciliation must judge membership against the raw
 * catalog, never against the display list.
 *
 * "Is project X still registered to my team, and who owns it" and "should
 * project X render in the team space right now" are different questions. The
 * display read answers the second one by hiding rows whose latest publish is
 * not `synced` — but a row whose publish FAILED is still a registered,
 * owner-occupied catalog row (the hub's `upsertTeamProject` keeps refusing
 * every other member with `team_project_owner_conflict` for it). Feeding that
 * display-filtered list to `planWorkspaceProjectReconciliation` made a mere
 * sync failure indistinguishable from a real unshare, so the demote direction
 * rewrote a teammate's mirror into a personal draft ATTRIBUTED TO THE LOCAL
 * VIEWER (`createdByWorkspaceMemberId: workspaceMemberId`) — which then
 * surfaced in the viewer's drafts as "created by me" with an enabled
 * "move to team space" action that could only ever 403 (recvqzjnshIlOe).
 *
 * A genuine unshare/delete removes the hub row itself, so it disappears from
 * the raw catalog too — using membership here does not delay legitimate
 * revocation of a teammate's stale mirror or demotion of the original
 * creator's own project.
 *
 * The display read remains available to callers that only need a best-effort
 * view. Production reconciliation requires `listCatalogMembership`; when
 * that authoritative transport is unavailable, its caller rejects the read
 * so absence never triggers a destructive action.
 */
export declare function reconcilerRemoteTeamProjects(sources: ReconcilerRemoteTeamProjectSources): Promise<readonly RemoteTeamProjectRef[]>;
export interface WorkspaceProjectBindPatch {
    workspaceId: string;
    visibility: 'team';
    resourceState: 'active';
    createdByWorkspaceMemberId: string | null;
    updatedByWorkspaceMemberId: string;
    resourceHubResourceId: string | null;
    cloudTombstonedAt: null;
    syncState: 'synced';
}
export interface WorkspaceProjectDemotePatch {
    visibility: 'personal';
    createdByWorkspaceMemberId: string;
    resourceHubResourceId: string | null;
    cloudTombstonedAt: null;
    syncState: 'local_only';
}
export interface WorkspaceProjectRevokePatch {
    visibility: 'team';
    resourceState: 'deleted';
    createdByWorkspaceMemberId: null;
    resourceHubResourceId: string | null;
    cloudTombstonedAt: null;
    syncState: 'synced';
}
export type WorkspaceProjectReconcileAction = {
    kind: 'bind';
    projectId: string;
    patch: WorkspaceProjectBindPatch;
} | {
    kind: 'demote';
    projectId: string;
    workspaceId: string;
    patch: WorkspaceProjectDemotePatch;
} | {
    kind: 'revoke';
    projectId: string;
    workspaceId: string;
    patch: WorkspaceProjectRevokePatch;
};
/**
 * Pure planner: given what the remote catalog reports and what this daemon's
 * OWN `workspace_projects` table currently claims for the active team
 * workspace, decide which rows disagree and how to fix them. No I/O — the
 * orchestrator below (`reconcileWorkspaceProjectsWithRemote`) is the only
 * caller that touches the database, which is what keeps this function
 * directly unit-testable.
 *
 * `localBindings` must carry an entry for every project this function needs
 * an opinion on: every `remoteProjects[].projectId` (so a brand-new remote
 * share can be told apart from an already-correct one) AND every row already
 * bound `visibility: 'team'` under `workspaceId` (so a row remote no longer
 * lists can be found at all). The caller builds this union — see
 * `reconcileWorkspaceProjectsWithRemote`.
 */
export declare function planWorkspaceProjectReconciliation(input: {
    workspaceId: string;
    workspaceMemberId: string;
    remoteProjects: readonly RemoteTeamProjectRef[];
    localBindings: ReadonlyMap<string, LocalTeamProjectBinding>;
}): WorkspaceProjectReconcileAction[];
export interface WorkspaceProjectsReconcileIdentity {
    workspaceId: string;
    workspaceMemberId: string;
    /** Optional transport identity captured by the authority resolver. The
     *  pure planner does not inspect it, but the remote catalog reader must
     *  receive the same captured principal instead of reconstructing one
     *  after an await from mutable ambient Workspace state. */
    principal?: ResourceHubPrincipal | null;
}
export interface WorkspaceProjectsReconcilerDeps {
    /** Capture before remote I/O; fence writes against overlapping explicit moves. */
    captureReconciliation?: () => (projectId: string) => boolean;
    /** The signed-in team workspace + member this daemon is currently acting
     *  as, or null off-team / signed out / removed. Must gate on active
     *  membership (`memberStatus === 'active'`), the same defensive check
     *  `should-publish.ts`'s `createShouldPublish` uses — a context that can
     *  still ADDRESS a resource hub partition is not proof this member is still
     *  IN the team (see that file's doc comment). */
    getWorkspaceIdentity: () => Promise<WorkspaceProjectsReconcileIdentity | null>;
    /** `listTeamProjects()` narrowed to what the planner needs — reuse the
     *  daemon's existing `teamProjectsForDisplay` (server.ts), the exact same
     *  read every other realtime consumer already shares, so this module never
     *  opens a second transport to Vela. */
    listRemoteTeamProjects: (identity: WorkspaceProjectsReconcileIdentity) => Promise<readonly RemoteTeamProjectRef[]>;
    /**
     * True when this daemon has a local `projects` row for the id — i.e. the
     * project's content has been materialized here (created locally, or pulled
     * from the hub). Gates the bind direction: `workspace_projects.project_id`
     * is a FOREIGN KEY into `projects(id)` (db.ts), so a bind INSERT for a
     * never-materialized project cannot succeed — and must not be attempted.
     * Materializing a project is the open/pull path's job
     * (`ensureSharedProjectPlaceholder` / `registerPulledProject` in
     * routes/collab-sync.ts), never this reconciler's; a remote catalog entry
     * with no local `projects` row and no local binding is simply out of this
     * daemon's scope until the member actually opens it (the team list already
     * displays it from the remote catalog alone — see
     * `listRemoteTeamProjectSummaries` in routes/project/index.ts).
     */
    hasLocalProject: (projectId: string) => boolean;
    /** Every row this daemon currently has bound `visibility: 'team'` for
     *  `workspaceId` (`listWorkspaceProjects(db, workspaceId)`, pre-filtered). */
    listLocalTeamRows: (workspaceId: string) => readonly LocalTeamProjectBinding[];
    /** This one project's current local binding (any workspace), or null if
     *  unbound (`getWorkspaceProjectByProjectId`). Only consulted for a remote
     *  project not already covered by `listLocalTeamRows`. */
    getLocalBinding: (projectId: string) => LocalTeamProjectBinding | null;
    getLocalProjectMetadata?: (projectId: string) => {
        name: string;
        updatedAt: number;
    } | null;
    applyMetadataRefresh?: (projectId: string, patch: WorkspaceProjectMetadataPatch) => void;
    /**
     * Write a 'bind' action. MUST handle both cases `db.ts`'s two primitives
     * split across: a project with an existing (wrong) row (`rebindWorkspaceProject`,
     * keyed on project id alone so a stale workspace_id is corrected too) AND a
     * project with NO local row at all (`rebindWorkspaceProject` is a no-op in
     * that case — it never inserts — so the caller must fall back to
     * `ensureWorkspaceProject` with the same patch). See the wiring in
     * server.ts for the reference implementation.
     */
    applyBind: (projectId: string, patch: WorkspaceProjectBindPatch) => void;
    applyDemote: (workspaceId: string, projectId: string, patch: WorkspaceProjectDemotePatch) => void;
    /**
     * Quarantine a foreign pulled mirror after a successful authoritative
     * catalog read confirms it is absent. This must not delete project bytes.
     */
    applyRevoke: (workspaceId: string, projectId: string, patch: WorkspaceProjectRevokePatch) => void;
    onError?: (error: unknown) => void;
}
export interface WorkspaceProjectsReconcileResult {
    bound: number;
    demoted: number;
    revoked: number;
}
/**
 * Run one reconciliation pass: read the remote team-project list, diff it
 * against this daemon's own `workspace_projects` rows, and write back
 * whatever disagrees. Best-effort throughout — a failed identity read or a
 * failed remote read returns a no-op result rather than throwing, so a
 * transient Vela outage can never be misread as "remote reports zero
 * projects" and demote every local team row on missing (as opposed to
 * genuinely empty) data.
 */
export declare function reconcileWorkspaceProjectsWithRemote(deps: WorkspaceProjectsReconcilerDeps): Promise<WorkspaceProjectsReconcileResult>;
/** Reconcile only the project named by a metadata hub event. The catalog read
 * remains authoritative, while local mutation is intentionally targeted. */
export declare function reconcileWorkspaceProjectMetadataWithRemote(deps: WorkspaceProjectsReconcilerDeps, projectId: string): Promise<boolean>;
/**
 * Hub → daemon handling for the `team-projects-changed` push (see
 * `startHubEventsSubscriber`'s `onEvent` in server.ts). Sibling of
 * `handleHubWorkspaceContextChanged` just above it in that file: besides
 * refreshing the display cache, this runs a real `workspace_projects`
 * reconciliation pass before sending the thin web signal
 * (`emitTeamProjectsChangedDeduped`), so a member whose owner just unshared a
 * project (or who just gained access to a new one) converges immediately
 * instead of waiting for the ~15s poller.
 *
 * Extracted as its own named, exported step for the same reason
 * `handleHubWorkspaceContextChanged` is: directly unit-testable without
 * standing up a real hub connection.
 */
export declare function handleHubTeamProjectsChanged(emitTeamProjectsChangedDeduped: () => void, reconcileWorkspaceProjects: () => Promise<unknown>): Promise<void>;
/** Emit immediately for catalog-backed UI, then emit once more only after a
 * targeted local metadata write so SQLite-backed recent/project views refetch
 * after the durable state has changed. */
export declare function handleHubProjectMetadataChanged(emitProjectMetadataChanged: () => void, reconcileProjectMetadata: () => Promise<boolean>): Promise<void>;
/**
 * `workspaceInvalidationPoller`'s `emit` wrapper (server.ts). The poller
 * itself stays a pure "diff and signal" utility
 * (`collab/workspace-invalidation-poller.ts`) with no opinion on
 * `workspace_projects`; this is the one seam where a `team-projects-changed`
 * signal ALSO kicks the real reconciliation — the poller's own ~15s-cadence
 * twin of `handleHubTeamProjectsChanged` above, for daemons that are signed
 * in but whose hub SSE channel is down (the poller is the sole delivery
 * mechanism in that state, per `startHubEventsSubscriber`'s own doc comment).
 */
export declare function handlePolledWorkspaceInvalidation(payload: WorkspaceInvalidationSsePayload, emit: (payload: WorkspaceInvalidationSsePayload) => void, reconcileWorkspaceProjects: () => Promise<unknown>): void;
