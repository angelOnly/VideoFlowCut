import type { TeamResourcesChangedSsePayload, WorkspaceTeamResourceKind } from '@open-design/contracts';
/** This daemon's one local `workspace_resources` row for a resource, as far
 *  as reconciliation cares. Only rows the caller has already filtered to
 *  `visibility: 'team'` for the target workspace are meaningful input — see
 *  `WorkspaceResourcesReconcilerDeps.listLocalActiveTeamRows`. */
export interface LocalTeamResourceBinding {
    resourceId: string;
    workspaceId: string;
    visibility: 'personal' | 'team';
    resourceState: string | null;
}
/** What the remote hub says is currently shared — the subset
 *  `TeamResourceShareService.sharedResources()` (team-resource-share.ts)
 *  actually carries that the planner needs: the LOCAL resource id (already
 *  decoded by `parseSharedResourceRecords`, matching `workspace_resources.
 *  resource_id` directly). */
export interface RemoteTeamResourceRef {
    resourceId: string;
    versionId?: string;
    version?: number;
}
/** Tracks the last authoritative listing independently by Workspace and kind. */
export declare function createWorkspaceResourceSignatureTracker(): {
    observe(workspaceId: string, resourceKind: string, remoteResources: readonly RemoteTeamResourceRef[]): boolean;
};
export interface MaterializedTeamResourceRef extends RemoteTeamResourceRef {
    versionId?: string;
}
export type WorkspaceResourceReconcileAction = {
    kind: 'retire';
    resourceId: string;
    workspaceId: string;
};
/**
 * Pure planner: given what the resource hub currently lists as shared and
 * what this daemon's OWN `workspace_resources` rows (already active-team-
 * filtered by the caller) claim for the workspace, decide which local rows
 * are stale and need retiring. No I/O — the orchestrator below
 * (`reconcileWorkspaceResourcesWithRemote`) is the only caller that touches
 * the database, which is what keeps this function directly unit-testable.
 *
 * Only one direction: a local row the remote listing no longer confirms.
 * The other direction (remote confirms a resource this daemon has not yet
 * materialized/bound) is already handled by `syncSharedTeamDesignSystem` /
 * `syncSharedTeamSkill` every time a kind's `/team` listing is read — adding
 * a second "confirm" action here would just duplicate that pull-and-bind
 * logic under a different name.
 */
export declare function planWorkspaceResourceReconciliation(input: {
    workspaceId: string;
    remoteResources: readonly RemoteTeamResourceRef[];
    /** Every row this daemon currently has bound `visibility: 'team'` AND
     *  `resourceState` other than `'deleted'` for `workspaceId` — see
     *  `listLocalActiveTeamRows`'s doc comment for the exact prefilter this
     *  function relies on the caller to apply. */
    localActiveTeamRows: readonly LocalTeamResourceBinding[];
}): WorkspaceResourceReconcileAction[];
export interface WorkspaceResourcesReconcilerDeps {
    /** The signed-in team workspace this daemon is currently acting as, or
     *  null off-team / signed out / removed. Must gate on active membership
     *  (`memberStatus === 'active'`) the same way
     *  `reconcileWorkspaceProjectsWithRemote`'s `getWorkspaceIdentity` does — a
     *  context that can still ADDRESS a resource hub partition is not proof
     *  this member is still IN the team. */
    getWorkspaceIdentity: () => Promise<{
        workspaceId: string;
    } | null>;
    /** This kind's `TeamResourceShareService.sharedResources()` — the exact
     *  same hub read `/api/workspace/<kind>/team` already serves (through its
     *  own SWR cache), so this reconciler never opens a second transport. */
    listRemoteTeamResources: () => Promise<readonly RemoteTeamResourceRef[]>;
    /** Every `workspace_resources` row for this resource type bound
     *  `visibility: 'team'` in `workspaceId`, whose `resourceState` is not
     *  already `'deleted'` (i.e. `listWorkspaceResources(db, resourceType,
     *  workspaceId)` filtered by the caller — kept out of this pure function
     *  so it stays synchronous and test-friendly without a real db handle). */
    listLocalActiveTeamRows: (workspaceId: string) => readonly LocalTeamResourceBinding[];
    /** Write a 'retire' action: flip `resourceState` to `'deleted'`, leaving
     *  `visibility` untouched. See this module's header comment for why that
     *  is the correct action and not a demote-to-personal. */
    applyRetire: (workspaceId: string, resourceId: string) => void;
    onError?: (error: unknown) => void;
}
export interface WorkspaceResourcesReconcileResult {
    /** Number of retire actions successfully persisted. */
    retired: number;
}
/**
 * Run one reconciliation pass for one resource kind: read the remote shared
 * listing, diff it against this daemon's own active `workspace_resources`
 * rows for that kind, and retire whatever disagrees. Best-effort throughout —
 * a failed identity read or a failed remote read returns a no-op result
 * rather than throwing, so a transient hub outage can never be misread as
 * "remote reports nothing shared" and retire every local team row on missing
 * (as opposed to genuinely empty) data.
 */
export declare function reconcileWorkspaceResourcesWithRemote(deps: WorkspaceResourcesReconcilerDeps): Promise<WorkspaceResourcesReconcileResult>;
export type WorkspaceTeamResourceRefreshReason = 'push' | 'poll' | 'catch-up';
export interface WorkspaceTeamResourceRefreshInput<TScope> {
    workspaceId: string;
    scope: TScope;
    resourceKind?: string;
    resourceId?: string;
    reason: WorkspaceTeamResourceRefreshReason;
    /**
     * Optional compatibility-lease guard for queued prewarm work. It is checked
     * immediately before the mutating pipeline starts. Once materialization has
     * begun, reconcile, emit, and signature commit finish as one logical unit.
     */
    isRefreshCurrent?: () => boolean;
}
export interface WorkspaceTeamResourceRefreshResult {
    processedKinds: WorkspaceTeamResourceKind[];
    emittedKinds: WorkspaceTeamResourceKind[];
    failedKinds: WorkspaceTeamResourceKind[];
}
export interface WorkspaceTeamResourceEventCoordinatorDeps<TScope> {
    /** Must not resolve until every listed resource is locally materialized. */
    materializeAndList: (input: {
        workspaceId: string;
        resourceKind: WorkspaceTeamResourceKind;
        scope: TScope;
    }) => Promise<readonly MaterializedTeamResourceRef[]>;
    /** Reconcile against the exact listing returned by materializeAndList. */
    reconcile: (input: {
        workspaceId: string;
        resourceKind: WorkspaceTeamResourceKind;
        scope: TScope;
        resources: readonly MaterializedTeamResourceRef[];
    }) => Promise<WorkspaceResourcesReconcileResult>;
    emit: (workspaceId: string, payload: TeamResourcesChangedSsePayload) => void;
    now?: () => number;
    onError?: (error: unknown, resourceKind: WorkspaceTeamResourceKind) => void;
}
/**
 * Coordinates background resource invalidation without exposing partially
 * materialized state. Work for the same workspace/kind is serialized; polling
 * emits only when the stable remote signature changes (or a local row retires).
 */
export declare function createWorkspaceTeamResourceEventCoordinator<TScope>(deps: WorkspaceTeamResourceEventCoordinatorDeps<TScope>): {
    refresh: (input: WorkspaceTeamResourceRefreshInput<TScope>) => Promise<WorkspaceTeamResourceRefreshResult>;
};
