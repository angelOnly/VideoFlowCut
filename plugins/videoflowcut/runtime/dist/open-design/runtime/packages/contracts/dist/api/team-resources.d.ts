import type { ApiErrorCode } from '../errors.js';
/**
 * Lifecycle state of a team resource (design system / plugin / skill).
 * Canonical enum (replaces the earlier `downgraded_personal` / `team-shared`
 * wording): `frozen` is set when the owning team is downgraded; the bytes are
 * untouched and `active` is restored on renewal.
 */
export type TeamResourceState = 'active' | 'frozen' | 'deleted';
/** The resource a copy-out route is about to duplicate into a personal copy. */
export interface TeamResourceCopyTarget {
    /** Personal resources copy freely; the red-line only applies to team resources. */
    scope: 'personal' | 'team';
    /** Lifecycle state — consulted only for team-scoped resources. */
    state?: TeamResourceState;
}
export interface TeamResourceCopyDecision {
    allowed: boolean;
    /** The API error code to surface when `allowed` is false. */
    code?: Extract<ApiErrorCode, 'WORKSPACE_RESOURCE_FROZEN' | 'WORKSPACE_RESOURCE_DELETED'>;
    reason?: string;
}
/**
 * Pure decision: may this resource be copied into a personal, editable copy?
 * Personal resources → always. Team resources → only while `active`; a `frozen`
 * or `deleted` team resource is blocked (the AC-9 red-line).
 */
export declare function evaluateTeamResourceCopy(resource: TeamResourceCopyTarget): TeamResourceCopyDecision;
/** Error thrown by {@link assertTeamResourceCopyAllowed}; carries the API code. */
export declare class TeamResourceCopyForbiddenError extends Error {
    readonly code: Extract<ApiErrorCode, 'WORKSPACE_RESOURCE_FROZEN' | 'WORKSPACE_RESOURCE_DELETED'>;
    constructor(decision: TeamResourceCopyDecision & {
        allowed: false;
    });
}
/**
 * The named invariant callers mount at every copy-out route (design-system
 * install/import/create/copy, plugin duplicate-project, skill edit-shadow, …).
 * Throws {@link TeamResourceCopyForbiddenError} — which the daemon maps to a 403
 * with the carried code — when the copy is not allowed. Must live at the route
 * layer, not just the UI: a CLI or external agent bypasses UI graying.
 */
export declare function assertTeamResourceCopyAllowed(resource: TeamResourceCopyTarget): void;
//# sourceMappingURL=team-resources.d.ts.map