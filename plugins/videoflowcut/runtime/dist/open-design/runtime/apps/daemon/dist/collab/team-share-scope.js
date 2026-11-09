// THE INVARIANT: a team share lives in a TEAM workspace.
//
// `workspace_projects.visibility = 'team'` means "this project is projected onto
// its workspace's TEAM plane". B has no standalone team id — the workspace id IS
// the team identity (`services/api/src/resources/auth.ts` resolves the workspace
// and answers `403 missing_principal` for any non-team one). A PERSONAL
// workspace therefore has no team plane to act on, and a row that claims
// `visibility: 'team'` while pinned to a personal workspace is not a scope at
// all: it is a permanently-broken address. Every project-scoped collab call it
// pins — presence heartbeat/list/leave, comments, publish — is answered
// `403 missing_principal`, forever, and silently. The two clients then address
// two different resource ids for the same project, so nothing syncs, presence is
// empty on both sides, and comment counts drift apart.
//
// This module is the ONE place that names the contradiction. Three call sites
// consume it:
//   - the write path refuses to create such a row (routes/project/index.ts);
//   - the read path refuses to PIN one, so the local selection — which normally
//     holds the real team workspace — wins instead (server.ts presenceScopeFor);
//   - startup reconciliation demotes the ones older builds already wrote.
//
// Detection needs one fact the row alone cannot carry: whether a workspace id is
// personal or team. Two independent sources answer that, and either is enough to
// refuse:
//   1. the caller's own assertion (`x-od-workspace-type`), and
//   2. the workspace directory B already serves the daemon (`typeOf` below).
// Both are allowed to be silent. An UNKNOWN workspace is never refused — this
// guard only ever fires on positive evidence that the target is personal, so it
// can never break a legitimate scope it simply has not learned about yet.
import { resolveWorkspaceScope } from './workspace-scope.js';
function normalizeId(workspaceId) {
    return typeof workspaceId === 'string' ? workspaceId.trim() : '';
}
function normalizeType(workspaceType) {
    return workspaceType === 'personal' || workspaceType === 'team' ? workspaceType : null;
}
export function createWorkspaceTypeRegistry() {
    const types = new Map();
    const typeOf = (workspaceId) => {
        const id = normalizeId(workspaceId);
        return id ? types.get(id) ?? null : null;
    };
    return {
        learn(facts) {
            if (!facts)
                return;
            for (const fact of Array.isArray(facts) ? facts : [facts]) {
                const id = normalizeId(fact?.workspaceId);
                const type = normalizeType(fact?.workspaceType);
                if (!id || !type)
                    continue;
                types.set(id, type);
            }
        },
        typeOf,
        // Bound, not a method: consumers routinely pass this around on its own.
        isKnownPersonal: (workspaceId) => typeOf(workspaceId) === 'personal',
    };
}
/**
 * Can `workspaceId` host a team share? Returns the refusal reason, or null when
 * there is no evidence against it (including "not enough information").
 *
 * `assertedType` is the caller's own claim about the workspace it is acting in
 * (the `x-od-workspace-type` request header). A caller that says "personal" and
 * asks for a team share has stated the contradiction itself; that alone is
 * grounds to refuse, without consulting anything else.
 */
export function refuseTeamShareScope(workspaceId, evidence = {}) {
    if (normalizeType(evidence.assertedType) === 'personal')
        return 'asserted_personal';
    if (evidence.registry?.isKnownPersonal(workspaceId))
        return 'directory_personal';
    return null;
}
/**
 * The workspace scope for a PROJECT-scoped collab call.
 *
 * Same fixed priority as `resolveWorkspaceScope` (the project's pinned workspace
 * outranks the local selection, so a workspace switch on another device cannot
 * re-aim an open project's heartbeats) with one subtraction: a pinned workspace
 * that provably cannot host a team share is not a scope and does not outrank
 * anything. Refusals are reported through `onRefused` rather than swallowed —
 * a silently wrong scope is precisely how this bug survived in the field.
 */
export function projectCollabScope(input) {
    const pinned = normalizeId(input.projectWorkspaceId);
    const reason = pinned
        ? refuseTeamShareScope(pinned, { ...(input.registry ? { registry: input.registry } : {}) })
        : null;
    if (pinned && reason) {
        input.onRefused?.({
            ...(input.projectId ? { projectId: input.projectId } : {}),
            workspaceId: pinned,
            reason,
        });
    }
    return resolveWorkspaceScope({
        projectWorkspaceId: reason ? null : pinned,
        localSelection: input.localSelection ?? null,
    });
}
/**
 * The rows that violate the invariant and must be healed.
 *
 * Only `visibility: 'team'` rows are ever candidates — a `visibility: 'personal'`
 * row in a personal workspace is the normal, correct shape and is never touched.
 * A row whose workspace type is unknown is left alone too: healing acts on
 * positive evidence only.
 */
export function impossibleTeamShareRows(rows, registry) {
    return rows.filter((row) => row?.visibility === 'team' && registry.isKnownPersonal(row.workspaceId));
}
//# sourceMappingURL=team-share-scope.js.map