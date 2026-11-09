import type { HubEventsSubscriber } from './hub-events-subscriber.js';
export interface WorkspaceHubSubscriptionManagerOptions {
    start(workspaceId: string): HubEventsSubscriber;
    /** Hard process cap; overflow workspaces recover through the poll floor. */
    maxSubscribers?: number;
}
/**
 * Owns the process-wide set of Vela workspace event streams.
 *
 * Every live stream is backed by an explicit, leased billing interest. A
 * daemon-global UI selection is deliberately not a subscription authority:
 * one tab switching to B must not stop another tab's A stream.
 */
export declare class WorkspaceHubSubscriptionManager {
    private readonly options;
    private billingWorkspaceIds;
    private readonly eventWorkspaceReferences;
    private readonly subscribers;
    private disposed;
    private environmentGeneration;
    private readonly maxSubscribers;
    constructor(options: WorkspaceHubSubscriptionManagerOptions);
    setBillingInterests(workspaceIds: Iterable<string>): void;
    activeWorkspaceIds(): string[];
    /**
     * Keep an upstream carrier for a locally connected Workspace EventSource.
     * The returned release is idempotent because Express may emit both `finish`
     * and `close` for one response.
     */
    retainEventInterest(workspaceIdInput: string): () => void;
    /** Re-resolve every live stream after the signed-in credential changes. */
    refreshEndpoints(): void;
    /**
     * Drop every scope retained under the previous daemon-global AMR profile.
     * Workspace ids are environment-owned, so neither billing leases nor open
     * renderer EventSources may carry an id across a profile switch.
     */
    resetForEnvironmentChange(): void;
    dispose(): void;
    private reconcile;
    private assertUsable;
}
export declare function createWorkspaceHubSubscriptionManager(options: WorkspaceHubSubscriptionManagerOptions): WorkspaceHubSubscriptionManager;
