// Phase 4 / spec §11.5 / plan §3.II1 — plugin event ring buffer.
//
// In-memory FIFO ring buffer of plugin lifecycle events
// (install / uninstall / upgrade / apply / snapshot-prune).
// Capped at MAX_BUFFER entries to keep daemon memory bounded
// even on a long-running install spree. Older entries fall off
// the head when the buffer is full.
//
// The buffer is read-only from outside this module. Producers
// (installer / uninstaller / apply path) call `recordPluginEvent()`;
// consumers subscribe via `subscribe()` (returns an unsubscribe
// callback) or pull `snapshot()` for a one-shot read. The route
// in server.ts wires both into a single SSE endpoint.
//
// No SQLite, no FS — pure in-memory state. A daemon restart
// resets the buffer (events survive the run, not the restart).
const MAX_BUFFER = 1000;
class PluginEventBuffer {
    buffer = [];
    subscribers = new Set();
    nextId = 1;
    record(input) {
        const event = {
            id: this.nextId++,
            at: Date.now(),
            kind: input.kind,
            pluginId: input.pluginId,
            ...(input.details ? { details: input.details } : {}),
        };
        this.buffer.push(event);
        if (this.buffer.length > MAX_BUFFER) {
            this.buffer = this.buffer.slice(this.buffer.length - MAX_BUFFER);
        }
        // Fan out to subscribers; exceptions are swallowed so a
        // misbehaving listener can't poison the buffer.
        for (const sub of this.subscribers) {
            try {
                sub(event);
            }
            catch { /* ignore */ }
        }
        return event;
    }
    // Returns a copy of the current buffer slice (since `since`
    // exclusive). Pass since=0 (or omit) for the whole buffer.
    snapshot(since = 0) {
        if (since <= 0)
            return this.buffer.slice();
        return this.buffer.filter((e) => e.id > since);
    }
    // Subscribe to live events. Returns an unsubscribe callback.
    subscribe(fn) {
        this.subscribers.add(fn);
        return () => { this.subscribers.delete(fn); };
    }
    // Test-only reset. Production callers never invoke this.
    reset() {
        this.buffer = [];
        this.subscribers.clear();
        this.nextId = 1;
    }
    size() { return this.buffer.length; }
}
const singleton = new PluginEventBuffer();
export function recordPluginEvent(input) {
    return singleton.record(input);
}
export function pluginEventSnapshot(since) {
    return singleton.snapshot(since);
}
export function subscribePluginEvents(fn) {
    return singleton.subscribe(fn);
}
export function pluginEventBufferSize() {
    return singleton.size();
}
// Test-only helper for vitest (the production path never calls
// this). Exported so vitest can clear state between cases.
export function __resetPluginEventBufferForTests() {
    singleton.reset();
}
export function purgePluginEventBuffer() {
    const events = singleton.snapshot();
    const result = {
        purged: events.length,
        firstId: events.length > 0 ? events[0].id : null,
        lastId: events.length > 0 ? events[events.length - 1].id : null,
        preNextId: singleton.nextId,
    };
    singleton.reset();
    return result;
}
export function summarisePluginEvents(events) {
    const stats = {
        total: events.length,
        byKind: {},
        byPluginId: {},
        oldestAt: null,
        newestAt: null,
        firstId: null,
        lastId: null,
    };
    for (const ev of events) {
        stats.byKind[ev.kind] = (stats.byKind[ev.kind] ?? 0) + 1;
        if (ev.pluginId) {
            stats.byPluginId[ev.pluginId] = (stats.byPluginId[ev.pluginId] ?? 0) + 1;
        }
        if (typeof ev.at === 'number') {
            stats.oldestAt = stats.oldestAt === null ? ev.at : Math.min(stats.oldestAt, ev.at);
            stats.newestAt = stats.newestAt === null ? ev.at : Math.max(stats.newestAt, ev.at);
        }
        if (typeof ev.id === 'number') {
            stats.firstId = stats.firstId === null ? ev.id : Math.min(stats.firstId, ev.id);
            stats.lastId = stats.lastId === null ? ev.id : Math.max(stats.lastId, ev.id);
        }
    }
    return stats;
}
//# sourceMappingURL=events.js.map