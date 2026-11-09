import type { ResourceHubPrincipal } from './resource-principal.js';
export interface PublishWatchSubscription {
    unsubscribe: () => Promise<void> | void;
}
export interface CollabPublishWatcherDeps {
    /** Coalesce every file edit into a debounced publish (the scheduler owns the window). */
    notifyChanged: (projectId: string, principal?: ResourceHubPrincipal) => void;
    /** Local project ids to consider watching. */
    listProjectIds: () => string[];
    /**
     * Whether THIS daemon should publish edits to `projectId`: it is team-shared
     * AND this daemon's member is its owner (the single writer). Async because it
     * consults the team hub + the workspace context.
     */
    shouldPublish: (projectId: string) => Promise<boolean | ResourceHubPrincipal>;
    /** Subscribe to file-change events for a project's content dir. */
    subscribeFiles: (projectId: string, onChange: () => void) => PublishWatchSubscription;
    /** Reconcile cadence (ms): how often to (re)discover owned+shared projects. */
    reconcileMs?: number;
    /** Attaching a watch is not a user edit on a device receiving cloud content. */
    publishInitialContent?: boolean;
    onError?: (error: unknown) => void;
}
export interface CollabPublishWatcher {
    /** Reconcile once immediately (exposed for tests / eager first pass). */
    reconcile: () => Promise<void>;
    /** Directory promotion replaces the watched inode; rebuild this subscription. */
    refresh: (projectId: string) => Promise<void>;
    start: () => void;
    dispose: () => void;
}
export declare function createCollabPublishWatcher(deps: CollabPublishWatcherDeps): CollabPublishWatcher;
