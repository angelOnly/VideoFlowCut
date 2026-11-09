import { type TeamResourceCopyTarget } from '@open-design/contracts';
export type TeamResourceKind = 'design-system' | 'plugin' | 'skill';
export interface TeamResourceKey {
    kind: TeamResourceKind;
    resourceId: string;
}
export interface TeamResourceStateProvider {
    /** The copy-guard view of a resource. Unknown resources default to personal. */
    resolve(key: TeamResourceKey): Promise<TeamResourceCopyTarget>;
    /** Dev/demo seam: mark a resource team-shared with a state (absent on the real hub-backed provider). */
    set?(key: TeamResourceKey, target: TeamResourceCopyTarget): void;
}
/**
 * Dev/demo provider: an in-memory registry of team-shared resources. A resource
 * not in the registry is treated as `personal` (copies freely) — so with no team
 * resources registered the guard is a no-op, exactly as production is until E's
 * hub reports real team resources. A test seeds a `frozen` resource to prove the
 * guard actually rejects.
 */
export declare function createDevTeamResourceStateProvider(): TeamResourceStateProvider;
/**
 * Resolve a resource's state and enforce the copy red-line (D3) at a copy-out
 * route. Throws {@link TeamResourceCopyForbiddenError} (which routes map to 403)
 * when the resource is a frozen/deleted team resource. A one-liner the escape
 * routes (plugin duplicate, DS copy, skill edit-shadow) call before copying.
 */
export declare function enforceTeamResourceCopyAllowed(provider: TeamResourceStateProvider, key: TeamResourceKey): Promise<void>;
