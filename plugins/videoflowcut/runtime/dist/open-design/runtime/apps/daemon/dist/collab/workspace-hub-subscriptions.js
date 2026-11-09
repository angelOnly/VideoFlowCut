/**
 * Owns the process-wide set of Vela workspace event streams.
 *
 * Every live stream is backed by an explicit, leased billing interest. A
 * daemon-global UI selection is deliberately not a subscription authority:
 * one tab switching to B must not stop another tab's A stream.
 */
export class WorkspaceHubSubscriptionManager {
    options;
    billingWorkspaceIds = new Set();
    eventWorkspaceReferences = new Map();
    subscribers = new Map();
    disposed = false;
    environmentGeneration = 0;
    maxSubscribers;
    constructor(options) {
        this.options = options;
        this.maxSubscribers = Math.max(1, options.maxSubscribers ?? 8);
    }
    setBillingInterests(workspaceIds) {
        this.assertUsable();
        const next = new Set([...workspaceIds]
            .map((workspaceId) => workspaceId.trim())
            .filter(Boolean));
        if (sameSet(this.billingWorkspaceIds, next))
            return;
        this.billingWorkspaceIds = next;
        this.reconcile();
    }
    activeWorkspaceIds() {
        return [...this.subscribers.keys()].sort();
    }
    /**
     * Keep an upstream carrier for a locally connected Workspace EventSource.
     * The returned release is idempotent because Express may emit both `finish`
     * and `close` for one response.
     */
    retainEventInterest(workspaceIdInput) {
        this.assertUsable();
        const workspaceId = workspaceIdInput.trim();
        if (!workspaceId)
            return () => undefined;
        this.eventWorkspaceReferences.set(workspaceId, (this.eventWorkspaceReferences.get(workspaceId) ?? 0) + 1);
        this.reconcile();
        const environmentGeneration = this.environmentGeneration;
        let released = false;
        return () => {
            if (released ||
                this.disposed ||
                environmentGeneration !== this.environmentGeneration) {
                return;
            }
            released = true;
            const remaining = (this.eventWorkspaceReferences.get(workspaceId) ?? 1) - 1;
            if (remaining > 0) {
                this.eventWorkspaceReferences.set(workspaceId, remaining);
            }
            else {
                this.eventWorkspaceReferences.delete(workspaceId);
            }
            this.reconcile();
        };
    }
    /** Re-resolve every live stream after the signed-in credential changes. */
    refreshEndpoints() {
        this.assertUsable();
        for (const subscriber of this.subscribers.values()) {
            subscriber.refreshEndpoint();
        }
    }
    /**
     * Drop every scope retained under the previous daemon-global AMR profile.
     * Workspace ids are environment-owned, so neither billing leases nor open
     * renderer EventSources may carry an id across a profile switch.
     */
    resetForEnvironmentChange() {
        this.assertUsable();
        this.environmentGeneration += 1;
        for (const subscriber of this.subscribers.values())
            subscriber.stop();
        this.subscribers.clear();
        this.billingWorkspaceIds.clear();
        this.eventWorkspaceReferences.clear();
    }
    dispose() {
        if (this.disposed)
            return;
        this.disposed = true;
        for (const subscriber of this.subscribers.values())
            subscriber.stop();
        this.subscribers.clear();
        this.billingWorkspaceIds.clear();
        this.eventWorkspaceReferences.clear();
    }
    reconcile() {
        // A visible browser stream gets first claim on the bounded upstream pool;
        // billing-only interests then fill the remaining capacity.
        const ordered = [
            ...this.eventWorkspaceReferences.keys(),
            ...this.billingWorkspaceIds,
        ];
        const desired = new Set();
        for (const workspaceId of ordered) {
            if (desired.size >= this.maxSubscribers)
                break;
            desired.add(workspaceId);
        }
        for (const [workspaceId, subscriber] of this.subscribers) {
            if (desired.has(workspaceId))
                continue;
            subscriber.stop();
            this.subscribers.delete(workspaceId);
        }
        for (const workspaceId of desired) {
            if (this.subscribers.has(workspaceId))
                continue;
            this.subscribers.set(workspaceId, this.options.start(workspaceId));
        }
    }
    assertUsable() {
        if (this.disposed) {
            throw new Error('workspace hub subscription manager is disposed');
        }
    }
}
export function createWorkspaceHubSubscriptionManager(options) {
    return new WorkspaceHubSubscriptionManager(options);
}
function sameSet(left, right) {
    if (left.size !== right.size)
        return false;
    for (const value of left) {
        if (!right.has(value))
            return false;
    }
    return true;
}
//# sourceMappingURL=workspace-hub-subscriptions.js.map