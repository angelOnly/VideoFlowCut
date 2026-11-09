// Team collaboration presence — the "presence" overlay: who is currently viewing a
// shared project. Decoupled from the resource/sync layer: it is a
// lightweight, poll-friendly heartbeat set, not a realtime-cursor engine (live
// cursors were cut; content is polled).
//
// Pure and timer-free by design. `present()` computes the live set on demand and
// sweeps anyone whose heartbeat has aged past the TTL, so the orchestrator's
// existing poll loop surfaces departures without a background timer. Explicit
// join/leave fire `onChange` immediately so an active viewer's arrival/exit can
// be broadcast without waiting for the next poll.
const DEFAULT_TTL_MS = 30_000;
export class CollabPresenceTracker {
    ttlMs;
    now;
    onChange;
    projects = new Map();
    constructor(options = {}) {
        this.ttlMs = Math.max(0, options.ttlMs ?? DEFAULT_TTL_MS);
        this.now = options.now ?? Date.now;
        this.onChange = options.onChange;
    }
    /** Mark a member present in a project (call on view + on each poll). */
    heartbeat(projectId, member, clientId = member.memberId) {
        const entries = this.ensure(projectId);
        const isNew = !entries.has(member.memberId);
        const entry = entries.get(member.memberId) ?? {
            member,
            leases: new Map(),
        };
        entry.member = member;
        entry.leases.set(clientId, this.now());
        entries.set(member.memberId, entry);
        if (isNew)
            this.emit(projectId);
    }
    /** Explicit departure (tab closed / left the project). */
    leave(projectId, memberId, clientId = memberId) {
        const entries = this.projects.get(projectId);
        const entry = entries?.get(memberId);
        if (!entries || !entry || !entry.leases.delete(clientId))
            return;
        if (entry.leases.size > 0)
            return;
        entries.delete(memberId);
        if (entries.size === 0)
            this.projects.delete(projectId);
        this.emit(projectId);
    }
    /** Members present now — sweeps any whose heartbeat aged past the TTL. */
    present(projectId) {
        const entries = this.projects.get(projectId);
        if (!entries)
            return [];
        const cutoff = this.now() - this.ttlMs;
        for (const [memberId, entry] of entries) {
            for (const [clientId, lastSeen] of entry.leases) {
                if (lastSeen < cutoff)
                    entry.leases.delete(clientId);
            }
            if (entry.leases.size === 0)
                entries.delete(memberId);
        }
        if (entries.size === 0) {
            this.projects.delete(projectId);
            return [];
        }
        return Array.from(entries.values(), (entry) => entry.member);
    }
    dispose() {
        this.projects.clear();
    }
    emit(projectId) {
        if (this.onChange)
            this.onChange({ projectId, present: this.present(projectId) });
    }
    ensure(projectId) {
        let entries = this.projects.get(projectId);
        if (!entries) {
            entries = new Map();
            this.projects.set(projectId, entries);
        }
        return entries;
    }
}
//# sourceMappingURL=presence-tracker.js.map