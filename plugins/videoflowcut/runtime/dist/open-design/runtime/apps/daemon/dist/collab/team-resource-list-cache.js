import { mapWithGate } from './concurrency-gate.js';
import { createSwrCache } from './swr-cache.js';
export const TEAM_RESOURCE_LIST_KINDS = ['design_system', 'plugin', 'skill'];
export function invalidateTeamResourceListingCaches(input) {
    const kinds = input.resourceKind
        ? TEAM_RESOURCE_LIST_KINDS.filter((kind) => kind === input.resourceKind)
        : TEAM_RESOURCE_LIST_KINDS;
    for (const kind of kinds) {
        input.providers[kind].invalidate(input.scope);
    }
    input.invalidateSharedCommand(input.scope.principal.teamId);
}
/** How long a listing stays fresh before the next read kicks a background refresh. */
const TEAM_RESOURCE_LIST_FRESH_MS = 3000;
/**
 * Cache identity for a listing. Team resource visibility is a function of the
 * whole principal — a role or lifecycle change can add or remove entries — so
 * every field that the authority consults is part of the key.
 */
export const teamResourceScopeKey = (scope) => JSON.stringify([
    scope.principal.teamId,
    scope.principal.memberId,
    scope.principal.role,
    scope.principal.lifecycleState,
]);
/**
 * SWR-cached "what has this workspace shared with me" listing, per principal,
 * optionally materializing each entry as it lands.
 */
export function createTeamResourceListCache(options) {
    const { share, sync, invalidateSharedCommand, gate } = options;
    const listings = new Map();
    const materialize = async (scope, readOptions) => {
        const resources = await share.sharedResources(scope, readOptions);
        if (sync) {
            await mapWithGate(resources, gate, (resource) => sync(resource, scope));
        }
        return { ids: resources.map((resource) => resource.id), resources };
    };
    const read = async (scope) => {
        const key = teamResourceScopeKey(scope);
        let listing = listings.get(key);
        if (!listing) {
            listing = createSwrCache(() => materialize(scope), () => key, TEAM_RESOURCE_LIST_FRESH_MS);
            listings.set(key, listing);
        }
        return listing();
    };
    return Object.assign(read, {
        authoritative(scope) {
            return materialize(scope, { authoritative: true });
        },
        invalidate(scope) {
            const key = teamResourceScopeKey(scope);
            listings.get(key)?.invalidate();
            listings.delete(key);
            invalidateSharedCommand(scope.principal.teamId);
        },
    });
}
//# sourceMappingURL=team-resource-list-cache.js.map