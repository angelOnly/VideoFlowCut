import { assertTeamResourceCopyAllowed, } from '@open-design/contracts';
function mapKey(key) {
    return `${key.kind}:${key.resourceId}`;
}
/**
 * Dev/demo provider: an in-memory registry of team-shared resources. A resource
 * not in the registry is treated as `personal` (copies freely) — so with no team
 * resources registered the guard is a no-op, exactly as production is until E's
 * hub reports real team resources. A test seeds a `frozen` resource to prove the
 * guard actually rejects.
 */
export function createDevTeamResourceStateProvider() {
    const registry = new Map();
    return {
        async resolve(key) {
            const state = registry.get(mapKey(key));
            return state === undefined ? { scope: 'personal' } : { scope: 'team', state };
        },
        set(key, target) {
            if (target.scope === 'team' && target.state)
                registry.set(mapKey(key), target.state);
            else
                registry.delete(mapKey(key));
        },
    };
}
/**
 * Resolve a resource's state and enforce the copy red-line (D3) at a copy-out
 * route. Throws {@link TeamResourceCopyForbiddenError} (which routes map to 403)
 * when the resource is a frozen/deleted team resource. A one-liner the escape
 * routes (plugin duplicate, DS copy, skill edit-shadow) call before copying.
 */
export async function enforceTeamResourceCopyAllowed(provider, key) {
    const target = await provider.resolve(key);
    assertTeamResourceCopyAllowed(target);
}
//# sourceMappingURL=team-resource-state.js.map