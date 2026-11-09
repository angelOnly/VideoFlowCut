const scopeKey = (scope) => JSON.stringify([
    scope.projectId,
    scope.workspaceId,
    scope.resourceTeamId,
    scope.viewerMemberId,
    scope.ownerMemberId,
]);
const copyScope = (scope) => Object.freeze({ ...scope });
/**
 * Process-local transfer snapshot used by both project SSE and
 * `/collab/status`.
 *
 * A project id alone is not a safe identity: the same id can be observed
 * across workspace/resource/owner bindings. Each actual begin also issues a
 * fresh opaque generation token. Only that exact token together with the same
 * scope may finish the current transfer, so a versionless event or an older
 * async completion cannot hide a newer transfer.
 */
export function createProjectContentTransferStateStore(options = {}) {
    const states = new Map();
    const generations = new Map();
    const issuedTokens = new WeakSet();
    const now = options.now ?? Date.now;
    const nextTimestamp = (previous) => Math.max(now(), (previous?.updatedAt ?? Number.NEGATIVE_INFINITY) + 1);
    const publish = (key, scope, generation, state) => {
        states.set(key, { scope, generation, state });
        options.onChange?.(scope, state);
        return state;
    };
    return {
        begin(inputScope, version) {
            const scope = copyScope(inputScope);
            const key = scopeKey(scope);
            const previous = states.get(key);
            const generation = (generations.get(key) ?? 0) + 1;
            generations.set(key, generation);
            const token = Object.freeze({
                generation,
                scopeKey: key,
            });
            issuedTokens.add(token);
            const at = nextTimestamp(previous?.state);
            const state = publish(key, scope, generation, {
                status: 'downloading',
                ...(version != null ? { version } : {}),
                startedAt: previous?.state.status === 'downloading'
                    ? previous.state.startedAt
                    : at,
                updatedAt: at,
            });
            return { token, state };
        },
        finish(inputScope, token, version) {
            const key = scopeKey(inputScope);
            const previous = states.get(key);
            if (!previous)
                return null;
            if (!issuedTokens.has(token)
                || token.scopeKey !== key
                || token.generation !== previous.generation) {
                return previous.state;
            }
            if (previous.state.status === 'idle')
                return previous.state;
            const at = nextTimestamp(previous.state);
            const resolvedVersion = version ?? previous.state.version;
            return publish(key, previous.scope, previous.generation, {
                status: 'idle',
                ...(resolvedVersion != null ? { version: resolvedVersion } : {}),
                startedAt: previous.state.startedAt,
                updatedAt: at,
            });
        },
        read(scope) {
            return states.get(scopeKey(scope))?.state ?? null;
        },
    };
}
//# sourceMappingURL=project-content-transfer-state.js.map