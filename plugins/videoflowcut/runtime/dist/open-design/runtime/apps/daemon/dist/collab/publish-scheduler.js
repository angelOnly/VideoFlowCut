// Team collaboration sync trigger — the author-side "trigger + orchestration" that the sync trigger owns.
//
// It does NOT implement the resource store: publishing content + advancing the
// `published` ref is the resource hub (the resource-hub owner, the resource hub the spec = createVersion + setRef).
// C's job is *when* to publish: coalesce rapid author edits into one publish so
// half-written intermediate states never reach members, flush at run boundaries,
// and — on success — let the orchestrator notify online members to pull.
//
// Invariant: notification happens strictly AFTER the adapter's
// publish resolves (content durable, pointer moved), so members are never told to
// pull a version that is not yet durable. The adapter is expected to resolve only
// on durable success (E's atomic write); this scheduler adds the coalescing.
import { COLLAB_VELA_FANOUT_CONCURRENCY, ConcurrencyGate } from './concurrency-gate.js';
const DEFAULT_DEBOUNCE_MS = 400;
// A publish that fails with no newer change pending retries automatically on
// this bounded backoff schedule. Without it a transient hub/network error
// leaves the project stuck in its failed sync state until the author happens
// to edit again. The budget is deliberately finite: a persistently failing
// hub gets three spaced attempts, then the scheduler goes quiet so a broken
// deploy cannot drive an endless vela child-process drumbeat. A successful
// publish or a fresh author change restores the full budget.
export const PUBLISH_RETRY_BACKOFF_MS = [5_000, 15_000, 45_000];
export class CollabPublishScheduler {
    adapter;
    debounceMs;
    onPublished;
    onError;
    projects = new Map();
    // Per-project re-entry is already blocked by `state.publishing`, but nothing
    // bounded the fan-out ACROSS projects: a run boundary that dirties every
    // project in a workspace, or a batch of debounce windows expiring in the
    // same tick, spawned one concurrent `vela resource push` per project. The
    // gate caps that peak; the queue behind it preserves every publish.
    gate = new ConcurrencyGate(COLLAB_VELA_FANOUT_CONCURRENCY);
    constructor(options) {
        this.adapter = options.adapter;
        this.debounceMs = Math.max(0, options.debounceMs ?? DEFAULT_DEBOUNCE_MS);
        this.onPublished = options.onPublished;
        this.onError = options.onError;
    }
    /** An author-side change to a project. Publishes are coalesced within the window. */
    notifyChanged(projectId, reason = 'change') {
        const state = this.ensure(projectId);
        state.reason = reason;
        // A fresh author change supersedes any in-progress failure recovery: it
        // publishes on its own debounce window with the full retry budget.
        state.consecutiveFailures = 0;
        this.clearRetryTimer(state);
        if (state.publishing) {
            // Still queued behind the fan-out cap: the adapter has not read the
            // project yet, so it will pick this change up when it is admitted.
            // `state.reason` above is what it will publish under.
            if (!state.admitted)
                return;
            // Don't interrupt an in-flight publish — mark dirty so a fresh one runs
            // after it settles (last-write-wins; the change is never lost).
            state.dirty = true;
            state.dirtyReason = reason;
            return;
        }
        if (state.timer)
            clearTimeout(state.timer);
        state.timer = setTimeout(() => {
            void this.flush(projectId);
        }, this.debounceMs);
    }
    /**
     * Run boundary — flush any pending publish immediately instead of waiting out
     * the debounce, so members see the stable end-of-run state promptly.
     */
    runBoundary(projectId) {
        const state = this.projects.get(projectId);
        if (!state)
            return;
        if (state.timer) {
            clearTimeout(state.timer);
            state.timer = null;
        }
        if (state.publishing) {
            // Same queued-vs-reading split as notifyChanged: a publish still waiting
            // for a fan-out slot will observe the end-of-run state on its own.
            if (!state.admitted)
                return;
            state.dirty = true;
            state.dirtyReason = state.reason;
            return;
        }
        void this.flush(projectId);
    }
    /** Cancel all pending timers (shutdown). */
    dispose() {
        for (const state of this.projects.values()) {
            if (state.timer)
                clearTimeout(state.timer);
            this.clearRetryTimer(state);
        }
        this.projects.clear();
    }
    async flush(projectId) {
        const state = this.projects.get(projectId);
        if (!state || state.publishing)
            return;
        state.timer = null;
        this.clearRetryTimer(state);
        state.publishing = true;
        state.admitted = false;
        // Resolved at admission, not at queueing: a change that lands while this
        // publish waits for a slot updates `state.reason`, and that is the state
        // the adapter is about to read.
        let reason = state.reason;
        let failed = false;
        try {
            const result = await this.gate.run(() => {
                state.admitted = true;
                reason = state.reason;
                return this.adapter.publish({ projectId, reason });
            });
            state.consecutiveFailures = 0;
            if (result) {
                this.onPublished?.({
                    projectId,
                    version: result.version,
                    ...(result.versionId ? { versionId: result.versionId } : {}),
                    reason,
                });
            }
        }
        catch (error) {
            failed = true;
            this.onError?.({ projectId, error });
        }
        finally {
            state.publishing = false;
            state.admitted = false;
            if (state.dirty) {
                state.dirty = false;
                // A change landed during the publish — schedule a fresh one. That
                // newer content supersedes failure recovery, so no retry stacks on
                // top of the re-publish (notifyChanged restores the retry budget).
                this.notifyChanged(projectId, state.dirtyReason || 'change');
            }
            else if (failed) {
                this.scheduleRetry(projectId, state);
            }
        }
    }
    /**
     * Recovery for a publish that failed with nothing newer pending: re-run the
     * same publish (same reason) after a bounded backoff. Exhausting the budget
     * leaves the project in its failed sync state until the next author change —
     * deliberately, so a persistently failing hub is retried a handful of times
     * rather than forever.
     */
    scheduleRetry(projectId, state) {
        const delayMs = PUBLISH_RETRY_BACKOFF_MS[state.consecutiveFailures];
        state.consecutiveFailures += 1;
        if (delayMs === undefined)
            return; // retry budget exhausted
        state.retryTimer = setTimeout(() => {
            state.retryTimer = null;
            void this.flush(projectId);
        }, delayMs);
    }
    clearRetryTimer(state) {
        if (state.retryTimer) {
            clearTimeout(state.retryTimer);
            state.retryTimer = null;
        }
    }
    ensure(projectId) {
        let state = this.projects.get(projectId);
        if (!state) {
            state = {
                timer: null,
                reason: 'change',
                publishing: false,
                dirty: false,
                dirtyReason: 'change',
                admitted: false,
                retryTimer: null,
                consecutiveFailures: 0,
            };
            this.projects.set(projectId, state);
        }
        return state;
    }
}
//# sourceMappingURL=publish-scheduler.js.map