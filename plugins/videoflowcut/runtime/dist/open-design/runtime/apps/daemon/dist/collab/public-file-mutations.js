import { AsyncLocalStorage } from 'node:async_hooks';
/**
 * One daemon-owned project lane for publication, stop, deletion and explicit
 * visibility moves. Hold until the operation settles, not until its HTTP
 * connection closes. Independent projects never block each other. Only moves
 * fence catalog reads; publishing a file does not change project policy.
 * Remote/cross-daemon races still need cloud authority.
 */
export function createPublicFileMutations() {
    const tails = new Map();
    const ownership = new AsyncLocalStorage();
    const moves = new Map();
    const revisions = new Map();
    let revision = 0;
    async function run(projectId, operation, options) {
        const keys = [...new Set(typeof projectId === 'string' ? [projectId] : projectId)].sort();
        const inherited = ownership.getStore();
        if (options?.joinCurrent && keys.every(key => inherited?.get(key)?.active))
            return operation();
        async function acquire(index) {
            const key = keys[index];
            if (key === undefined) {
                const lease = { active: true };
                const owned = new Map(inherited);
                for (const heldKey of keys)
                    owned.set(heldKey, lease);
                try {
                    return await ownership.run(owned, operation);
                }
                finally {
                    // Async descendants may outlive the caller; expired ownership is
                    // never permission to bypass a later request's queued mutation.
                    lease.active = false;
                }
            }
            const previous = tails.get(key) ?? Promise.resolve();
            let release;
            const current = new Promise((resolve) => { release = resolve; });
            tails.set(key, current);
            await previous;
            try {
                return await acquire(index + 1);
            }
            finally {
                release();
                if (tails.get(key) === current)
                    tails.delete(key);
            }
        }
        return acquire(0);
    }
    return {
        run,
        captureReconciliation() {
            const capturedRevision = revision;
            const blocked = new Set(moves.keys());
            return (id) => !blocked.has(id) && !moves.has(id)
                && (revisions.get(id) ?? 0) <= capturedRevision;
        },
        async withMoves(projectIds, operation) {
            const keys = [...new Set(projectIds)];
            for (const key of keys) {
                moves.set(key, (moves.get(key) ?? 0) + 1);
                revisions.set(key, ++revision);
            }
            try {
                return await run(keys, operation);
            }
            finally {
                for (const key of keys) {
                    const remaining = (moves.get(key) ?? 1) - 1;
                    if (remaining)
                        moves.set(key, remaining);
                    else
                        moves.delete(key);
                    revisions.set(key, ++revision);
                }
            }
        },
    };
}
//# sourceMappingURL=public-file-mutations.js.map