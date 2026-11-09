/**
 * In-process registry of in-flight critique runs. The daemon process is the
 * single owner of all critique state; the registry exists so the interrupt
 * endpoint can cascade an AbortController to the orchestrator that owns the
 * spawned CLI. The registry is intentionally NOT persisted: a daemon restart
 * mid-run is handled by reconcileStaleRuns on boot, not by recovering live
 * AbortControllers.
 *
 * All lookup operations require BOTH projectId and runId. The composite key
 * prevents a request to interrupt project p1's runId from accidentally
 * aborting project p2's run that happens to share the same id (defense in
 * depth on top of the HTTP handler's own DB-row projectId check).
 *
 * @see specs/current/critique-theater.md § Failure modes (interrupt)
 */
/**
 * Builds the internal composite key for a (projectId, runId) pair. Pipe is
 * not a legal character in either projectId or runId per the daemon's id
 * generation rules, so collisions across pairs are impossible.
 */
function compositeKey(projectId, runId) {
    return `${projectId}|${runId}`;
}
/**
 * Creates an in-memory RunRegistry backed by a Map.
 * Node is single-threaded; no locking is needed.
 *
 * @see specs/current/critique-theater.md § interrupt endpoint (Task 6.1)
 */
export function createRunRegistry() {
    const store = new Map();
    return {
        register(handle) {
            const key = compositeKey(handle.projectId, handle.runId);
            if (store.has(key)) {
                throw new Error(`RunRegistry: duplicate (projectId="${handle.projectId}", runId="${handle.runId}"); unregister before re-registering`);
            }
            store.set(key, handle);
        },
        get(projectId, runId) {
            return store.get(compositeKey(projectId, runId)) ?? null;
        },
        interrupt(projectId, runId, reason) {
            const handle = store.get(compositeKey(projectId, runId));
            if (handle === undefined)
                return false;
            handle.abort.abort(reason);
            return true;
        },
        unregister(projectId, runId) {
            store.delete(compositeKey(projectId, runId));
        },
        list() {
            return [...store.values()];
        },
    };
}
//# sourceMappingURL=run-registry.js.map