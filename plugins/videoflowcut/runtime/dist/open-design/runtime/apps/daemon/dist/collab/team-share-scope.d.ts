import type { WorkspaceType } from '@open-design/contracts';
import { type WorkspaceScope } from './workspace-scope.js';
/** Why a workspace cannot host a team share. Null means "no evidence against". */
export type TeamShareScopeRefusal = 'asserted_personal' | 'directory_personal';
/** Minimal shape of anything that names a workspace and its type. Structural on
 *  purpose so both `WorkspaceDirectoryItem` and `WorkspaceCollabContext` fit. */
export interface WorkspaceTypeFact {
    workspaceId?: string | null;
    workspaceType?: string | null;
}
/**
 * What the daemon has learned about each workspace's type.
 *
 * Deliberately synchronous and best-effort: it is a memo of facts that flowed
 * past on reads the daemon already performs (the workspace directory the web
 * fetches on every load, the workspace context the invalidation poller reads
 * every 15s). Nothing here fetches. An id it has never seen answers `null`, and
 * every consumer treats `null` as "no opinion".
 */
export interface WorkspaceTypeRegistry {
    learn(facts: readonly WorkspaceTypeFact[] | WorkspaceTypeFact | null | undefined): void;
    typeOf(workspaceId: string | null | undefined): WorkspaceType | null;
    /** True ONLY on positive evidence that this workspace is personal. */
    isKnownPersonal(workspaceId: string | null | undefined): boolean;
}
export declare function createWorkspaceTypeRegistry(): WorkspaceTypeRegistry;
/**
 * Can `workspaceId` host a team share? Returns the refusal reason, or null when
 * there is no evidence against it (including "not enough information").
 *
 * `assertedType` is the caller's own claim about the workspace it is acting in
 * (the `x-od-workspace-type` request header). A caller that says "personal" and
 * asks for a team share has stated the contradiction itself; that alone is
 * grounds to refuse, without consulting anything else.
 */
export declare function refuseTeamShareScope(workspaceId: string | null | undefined, evidence?: {
    assertedType?: string | null;
    registry?: Pick<WorkspaceTypeRegistry, 'isKnownPersonal'> | null;
}): TeamShareScopeRefusal | null;
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
export declare function projectCollabScope(input: {
    projectId?: string;
    projectWorkspaceId: string | null | undefined;
    localSelection: string | null | undefined;
    registry?: Pick<WorkspaceTypeRegistry, 'isKnownPersonal'> | null;
    onRefused?: (refusal: {
        projectId?: string | undefined;
        workspaceId: string;
        reason: TeamShareScopeRefusal;
    }) => void;
}): WorkspaceScope;
/** A `workspace_projects` row, as far as this invariant is concerned. */
export interface TeamShareRow {
    projectId?: string | null;
    workspaceId?: string | null;
    visibility?: string | null;
}
/**
 * The rows that violate the invariant and must be healed.
 *
 * Only `visibility: 'team'` rows are ever candidates — a `visibility: 'personal'`
 * row in a personal workspace is the normal, correct shape and is never touched.
 * A row whose workspace type is unknown is left alone too: healing acts on
 * positive evidence only.
 */
export declare function impossibleTeamShareRows<T extends TeamShareRow>(rows: readonly T[], registry: Pick<WorkspaceTypeRegistry, 'isKnownPersonal'>): T[];
