// Injection-style capability registry (layer ①).
//
// The registry holds NO data of its own — callers seed it (now from a const
// ported from aihubmix-video; later from AIHubMix's /api/v1/models fetched at
// startup with the const as a fallback). Consumers depend ONLY on `get()` /
// `all()`, never on the raw seed, so swapping the data source touches nothing
// downstream.
/** Normalize a catalogue id: strip the `aihubmix-` prefix and trim. */
export function normalizeModelId(id) {
    return (id || '').trim().replace(/^aihubmix-/, '');
}
export function createCapabilityRegistry(seed = []) {
    const map = new Map();
    const register = (caps) => {
        for (const cap of caps) {
            if (cap && typeof cap.id === 'string' && cap.id) {
                map.set(normalizeModelId(cap.id), cap);
            }
        }
    };
    register(seed);
    return {
        get: (id) => map.get(normalizeModelId(id)),
        register,
        all: () => [...map.values()],
    };
}
//# sourceMappingURL=capabilities.js.map