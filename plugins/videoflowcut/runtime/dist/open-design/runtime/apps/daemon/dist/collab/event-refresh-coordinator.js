const DEFAULT_MIN_INTERVAL_MS = 250;
const DEFAULT_MAX_KEYS = 256;
/**
 * Bound background work caused by thin invalidation events.
 *
 * The first event for a resource runs immediately. While that work is running
 * (or inside the short start-rate floor), newer events replace one pending
 * trailing task. Duplicate revision/sequence tokens are ignored. This is safe
 * for snapshot refreshes: intermediate transitions need not each trigger a GET,
 * but the final state must always be observed.
 */
export function createEventRefreshCoordinator(options = {}) {
    const scheduler = options.scheduler ?? defaultScheduler();
    const minIntervalMs = Math.max(0, options.minIntervalMs ?? DEFAULT_MIN_INTERVAL_MS);
    const maxKeys = Math.max(1, options.maxKeys ?? DEFAULT_MAX_KEYS);
    const lanes = new Map();
    let disposed = false;
    const touch = (key, lane) => {
        lane.touchedAt = scheduler.now();
        lanes.delete(key);
        lanes.set(key, lane);
    };
    const trim = (targetSize) => {
        if (lanes.size <= targetSize)
            return;
        for (const [key, lane] of lanes) {
            if (lane.running || lane.timer || lane.pendingTask)
                continue;
            lanes.delete(key);
            if (lanes.size <= targetSize)
                return;
        }
    };
    const laneFor = (key) => {
        const existing = lanes.get(key);
        if (existing) {
            touch(key, existing);
            return existing;
        }
        trim(maxKeys - 1);
        const lane = {
            activeToken: null,
            lastCompletedToken: null,
            pendingToken: null,
            pendingTask: null,
            running: false,
            timer: null,
            lastStartedAt: Number.NEGATIVE_INFINITY,
            touchedAt: scheduler.now(),
        };
        lanes.set(key, lane);
        return lane;
    };
    const pump = (key, lane) => {
        if (disposed || lane.running || lane.timer || !lane.pendingTask)
            return;
        const elapsed = scheduler.now() - lane.lastStartedAt;
        const delay = Math.max(0, minIntervalMs - elapsed);
        if (delay > 0) {
            lane.timer = scheduler.setTimeout(() => {
                lane.timer = null;
                pump(key, lane);
            }, delay);
            lane.timer.unref?.();
            return;
        }
        const task = lane.pendingTask;
        const token = lane.pendingToken;
        lane.pendingTask = null;
        lane.pendingToken = null;
        lane.activeToken = token;
        lane.running = true;
        lane.lastStartedAt = scheduler.now();
        touch(key, lane);
        let result;
        try {
            // Start the leading task in the caller's turn. Several invalidation
            // handlers deliberately clear an authority lease before any sibling
            // reconnect/read may run; deferring through Promise.resolve().then(...)
            // would briefly expose the pre-event lease.
            result = task();
        }
        catch (error) {
            result = Promise.reject(error);
        }
        let succeeded = false;
        void Promise.resolve(result)
            .then(() => {
            succeeded = true;
        })
            .catch((error) => options.onError?.(error, key))
            .finally(() => {
            lane.running = false;
            lane.activeToken = null;
            if (disposed)
                return;
            if (succeeded && token)
                lane.lastCompletedToken = token;
            touch(key, lane);
            pump(key, lane);
            trim(maxKeys);
        });
    };
    return {
        request(keyInput, task, tokenInput) {
            if (disposed)
                return;
            const key = keyInput.trim();
            if (!key)
                return;
            const token = tokenInput?.trim() || null;
            const lane = laneFor(key);
            if (token &&
                (token === lane.activeToken ||
                    token === lane.lastCompletedToken ||
                    token === lane.pendingToken)) {
                return;
            }
            // Refreshes are latest-state reads. Replacing the queued task preserves
            // the final snapshot while bounding intermediate work to one trailing run.
            lane.pendingTask = task;
            lane.pendingToken = token;
            touch(key, lane);
            pump(key, lane);
        },
        dispose() {
            if (disposed)
                return;
            disposed = true;
            for (const lane of lanes.values()) {
                if (lane.timer)
                    scheduler.clearTimeout(lane.timer);
                lane.timer = null;
                lane.pendingTask = null;
                lane.pendingToken = null;
                lane.lastCompletedToken = null;
            }
            lanes.clear();
        },
    };
}
function defaultScheduler() {
    return {
        now: () => Date.now(),
        setTimeout: (callback, delayMs) => setTimeout(callback, delayMs),
        clearTimeout: (timer) => clearTimeout(timer),
    };
}
//# sourceMappingURL=event-refresh-coordinator.js.map