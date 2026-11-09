// Realtime reconciliation of the local `workspace_resources` SQLite table
// against the resource hub's shared-listing for design-system / plugin /
// skill resources — the generic-table counterpart of
// `workspace-projects-reconciler.ts` for `workspace_projects`.
//
// The gap this closes: `syncSharedTeamDesignSystem` / `syncSharedTeamSkill`
// (server.ts) already handle DIRECTION 1 — a resource the hub still confirms
// as shared gets materialized + bound `visibility: 'team'` — every time a
// kind's `/team` listing is read. Nothing handles DIRECTION 2: a resource a
// workspace has ALREADY bound `visibility: 'team'` that the hub no longer
// lists at all (the owner unshared it, or this member's access was revoked).
// Before this module, that local row simply sat there forever, unexamined —
// the puller's copy vanished from the Team scope (the hub stopped listing
// it) without ever being told to leave "team" state, so it also never
// qualified to reappear anywhere else. This module is what would eventually
// need to run to converge that row, the same way
// `reconcileWorkspaceProjectsWithRemote` converges `workspace_projects`.
//
// Retraction semantic (spec decision, workspace-team continuous-sync 优先级3):
// deliberately NOT "demote to personal" (project's `workspace_projects` model
// is the one to NOT copy). A skill/design-system/plugin pulled copy is a
// materialized MIRROR of someone else's shared resource, not the caller's
// own draft — flipping `visibility` to `'personal'` would misattribute it as
// caller-authored, exactly the bug `SkillSummary.teamSynced` (this same
// continuous-sync effort, priority 2) was written to fix. Instead this marks
// `resourceState: 'deleted'` on the EXISTING `workspace_resources` row and
// leaves `visibility: 'team'` untouched — a tombstone, not a reclassification:
//   - `visibility` staying `'team'` preserves every `teamSynced` / "is this a
//     team-pulled copy" attribution read. Scoped catalogs additionally gate
//     these mirrors on `resourceState`, so a retired resource is hidden while
//     remaining distinguishable from caller-authored Personal content.
//   - `resourceState: 'deleted'` is this reconciler's own bookkeeping: it is
//     what makes a second reconciliation pass a no-op instead of re-writing
//     the same row every ~15s poll tick, and it is the auditable "this used
//     to be team-shared, then wasn't anymore" fact a future "make this mine"
//     reclaim action would key off. Scoped Team catalogs read it as the
//     exclusion signal without erasing that attribution.
//   - The local FILE on disk is never touched. Retraction is a binding-table
//     state change only — this module does not delete, move, or rewrite
//     anything under `USER_SKILLS_DIR` / `USER_DESIGN_SYSTEMS_DIR`.
//
// Scope: this module is resource-type-agnostic. Daemon wiring drives it for
// design systems, plugins, and skills; each materializer owns creating the
// active Team binding that this reconciler later retires.
/** Tracks the last authoritative listing independently by Workspace and kind. */
export function createWorkspaceResourceSignatureTracker() {
    const signatures = new Map();
    return {
        observe(workspaceId, resourceKind, remoteResources) {
            const key = JSON.stringify([workspaceId, resourceKind]);
            const signature = JSON.stringify(remoteResources
                .map((resource) => [
                resource.resourceId,
                resource.versionId ?? null,
                resource.version ?? null,
            ])
                .sort(([left], [right]) => left.localeCompare(right)));
            const previous = signatures.get(key);
            signatures.set(key, signature);
            return previous !== signature;
        },
    };
}
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
export function planWorkspaceResourceReconciliation(input) {
    const remoteIds = new Set(input.remoteResources.map((r) => r.resourceId));
    const actions = [];
    for (const local of input.localActiveTeamRows) {
        if (local.workspaceId !== input.workspaceId)
            continue;
        if (remoteIds.has(local.resourceId))
            continue;
        actions.push({ kind: 'retire', resourceId: local.resourceId, workspaceId: local.workspaceId });
    }
    return actions;
}
const NO_OP_RESULT = { retired: 0 };
/**
 * Run one reconciliation pass for one resource kind: read the remote shared
 * listing, diff it against this daemon's own active `workspace_resources`
 * rows for that kind, and retire whatever disagrees. Best-effort throughout —
 * a failed identity read or a failed remote read returns a no-op result
 * rather than throwing, so a transient hub outage can never be misread as
 * "remote reports nothing shared" and retire every local team row on missing
 * (as opposed to genuinely empty) data.
 */
export async function reconcileWorkspaceResourcesWithRemote(deps) {
    const identity = await deps.getWorkspaceIdentity().catch((error) => {
        deps.onError?.(error);
        return null;
    });
    if (!identity)
        return NO_OP_RESULT;
    let remoteResources;
    try {
        remoteResources = await deps.listRemoteTeamResources();
    }
    catch (error) {
        deps.onError?.(error);
        return NO_OP_RESULT;
    }
    const localActiveTeamRows = deps.listLocalActiveTeamRows(identity.workspaceId);
    const actions = planWorkspaceResourceReconciliation({
        workspaceId: identity.workspaceId,
        remoteResources,
        localActiveTeamRows,
    });
    let retired = 0;
    for (const action of actions) {
        try {
            deps.applyRetire(action.workspaceId, action.resourceId);
            retired += 1;
        }
        catch (error) {
            deps.onError?.(error);
        }
    }
    return { retired };
}
const TEAM_RESOURCE_KINDS = [
    'design_system',
    'plugin',
    'skill',
];
function teamResourceSignature(resources) {
    return resources
        .map((resource) => `${resource.resourceId}\u0000${resource.versionId ?? ''}`)
        .sort()
        .join('\u0001');
}
function isWorkspaceTeamResourceKind(value) {
    return TEAM_RESOURCE_KINDS.some((kind) => kind === value);
}
/**
 * Coordinates background resource invalidation without exposing partially
 * materialized state. Work for the same workspace/kind is serialized; polling
 * emits only when the stable remote signature changes (or a local row retires).
 */
export function createWorkspaceTeamResourceEventCoordinator(deps) {
    const signatures = new Map();
    const pending = new Map();
    const runKind = async (input, resourceKind) => {
        try {
            if (input.isRefreshCurrent?.() === false)
                return 'skipped';
            const resources = await deps.materializeAndList({
                workspaceId: input.workspaceId,
                resourceKind,
                scope: input.scope,
            });
            const reconciliation = await deps.reconcile({
                workspaceId: input.workspaceId,
                resourceKind,
                scope: input.scope,
                resources,
            });
            const key = `${input.workspaceId}\u0000${resourceKind}`;
            const nextSignature = teamResourceSignature(resources);
            const previousSignature = signatures.get(key);
            const shouldEmit = input.reason === 'push'
                || reconciliation.retired > 0
                || (previousSignature === undefined
                    ? resources.length > 0
                    : previousSignature !== nextSignature);
            if (shouldEmit) {
                deps.emit(input.workspaceId, {
                    type: 'team-resources-changed',
                    resourceKind,
                    ...(input.resourceId ? { resourceId: input.resourceId } : {}),
                    at: deps.now?.() ?? Date.now(),
                });
            }
            signatures.set(key, nextSignature);
            return shouldEmit ? 'emitted' : 'processed';
        }
        catch (error) {
            deps.onError?.(error, resourceKind);
            return 'failed';
        }
    };
    const enqueueKind = async (input, resourceKind) => {
        const key = `${input.workspaceId}\u0000${resourceKind}`;
        const previous = pending.get(key);
        let result = 'failed';
        const run = async () => {
            result = await runKind(input, resourceKind);
        };
        const current = previous
            ? previous.catch(() => undefined).then(run)
            : run();
        pending.set(key, current);
        await current;
        if (pending.get(key) === current)
            pending.delete(key);
        return result;
    };
    return {
        async refresh(input) {
            const kinds = input.resourceKind === undefined
                ? TEAM_RESOURCE_KINDS
                : isWorkspaceTeamResourceKind(input.resourceKind)
                    ? [input.resourceKind]
                    : [];
            const outcomes = await Promise.all(kinds.map(async (resourceKind) => ({
                resourceKind,
                outcome: await enqueueKind(input, resourceKind),
            })));
            return {
                processedKinds: outcomes
                    .filter(({ outcome }) => outcome === 'processed' || outcome === 'emitted')
                    .map(({ resourceKind }) => resourceKind),
                emittedKinds: outcomes
                    .filter(({ outcome }) => outcome === 'emitted')
                    .map(({ resourceKind }) => resourceKind),
                failedKinds: outcomes
                    .filter(({ outcome }) => outcome === 'failed')
                    .map(({ resourceKind }) => resourceKind),
            };
        },
    };
}
//# sourceMappingURL=workspace-resources-reconciler.js.map