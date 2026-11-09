const DEFAULT_MAX_ENTRIES = 32;
/**
 * Small process-local primitive for event-invalidated upstream snapshots.
 *
 * Keys normally represent credential identity plus resource scope. Settled
 * values and in-flight reads never cross keys. Invalidation advances an opaque
 * generation, so work started before an event may finish for its original
 * caller but cannot seed the post-event cache.
 */
export function createPartitionedRefreshCache(options) {
    const now = options.now ?? Date.now;
    const maxEntries = Math.max(1, options.maxEntries ?? DEFAULT_MAX_ENTRIES);
    const entries = new Map();
    const touch = (key, entry) => {
        entry.touchedAt = now();
        entries.delete(key);
        entries.set(key, entry);
    };
    const trim = (targetSize) => {
        if (entries.size <= targetSize)
            return;
        for (const [key, entry] of entries) {
            if (entry.inFlightByGeneration.size > 0)
                continue;
            entries.delete(key);
            if (entries.size <= targetSize)
                return;
        }
    };
    const entryFor = (key) => {
        const existing = entries.get(key);
        if (existing) {
            touch(key, existing);
            return existing;
        }
        trim(maxEntries - 1);
        const entry = {
            generation: 0,
            hasValue: false,
            value: undefined,
            expiresAt: 0,
            inFlightByGeneration: new Map(),
            lastInvalidationToken: null,
            touchedAt: now(),
        };
        entries.set(key, entry);
        return entry;
    };
    const hasFreshValue = (entry) => entry.hasValue && now() < entry.expiresAt;
    const latestInFlight = (entry) => {
        let latest;
        for (const request of entry.inFlightByGeneration.values())
            latest = request;
        return latest;
    };
    const start = (key, entry, generation) => {
        const existing = entry.inFlightByGeneration.get(generation);
        if (existing)
            return existing;
        const request = options.fetch(key)
            .then((value) => {
            if (entry.generation === generation) {
                const ttlMs = options.ttlMs(value);
                if (ttlMs != null) {
                    entry.hasValue = true;
                    entry.value = value;
                    entry.expiresAt = now() + Math.max(0, ttlMs);
                    touch(key, entry);
                }
            }
            return value;
        })
            .finally(() => {
            if (entry.inFlightByGeneration.get(generation) === request) {
                entry.inFlightByGeneration.delete(generation);
            }
            trim(maxEntries);
        });
        entry.inFlightByGeneration.set(generation, request);
        return request;
    };
    return {
        async read(keyInput, readOptions = {}) {
            const key = keyInput.trim();
            if (!key)
                throw new Error('partitioned refresh cache key is required');
            const entry = entryFor(key);
            if (!readOptions.force && hasFreshValue(entry))
                return entry.value;
            const attempts = readOptions.revalidateOnInvalidation ? 2 : 1;
            let latest;
            for (let attempt = 0; attempt < attempts; attempt += 1) {
                const generation = entry.generation;
                const request = readOptions.revalidateOnInvalidation
                    ? latestInFlight(entry) ?? start(key, entry, generation)
                    : start(key, entry, generation);
                latest = await request;
                if (entry.generation === generation
                    && hasFreshValue(entry)) {
                    return entry.value;
                }
            }
            return entry.hasValue ? entry.value : latest;
        },
        invalidate(keyInput, tokenInput) {
            const key = keyInput.trim();
            if (!key)
                return;
            const entry = entryFor(key);
            const token = tokenInput?.trim() || null;
            if (token && entry.lastInvalidationToken === token)
                return;
            entry.lastInvalidationToken = token;
            entry.generation += 1;
            entry.hasValue = false;
            entry.value = undefined;
            entry.expiresAt = 0;
            touch(key, entry);
        },
        clear() {
            // Fence in-flight completions before dropping the entries. Otherwise a
            // request that settles after clear() could touch itself back into the map.
            for (const entry of entries.values())
                entry.generation += 1;
            entries.clear();
        },
    };
}
//# sourceMappingURL=partitioned-refresh-cache.js.map