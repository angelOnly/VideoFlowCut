import type { ResourceHubPrincipal } from './resource-principal.js';
export interface ResourcePublishInput {
    projectId: string;
    principal?: ResourceHubPrincipal;
}
export interface PublishedResourceVersion {
    version: number;
    versionId?: string;
}
/** Identity of the bytes actually landed by a pull, never a later head read. */
export interface MaterializedResourceVersion extends PublishedResourceVersion {
    resourceId?: string;
}
export interface ResourcePublishAdapter {
    /**
     * Publish the current state of a project's sync unit to the resource hub and
     * advance its `published` ref. Resolves ONLY after the content is durably
     * written (content-first / pointer-last). Returns the new version, or null if
     * there was nothing to publish.
     */
    publish(input: ResourcePublishInput & {
        reason: string;
    }): Promise<PublishedResourceVersion | null>;
    /**
     * Read the currently-published head for a project. The scheduler decides
     * *when* a member pulls; the adapter reports what head is available. Optional:
     * the local stub reports the in-memory head; the real hub adapter resolves the
     * published ref. Returns null when nothing has been published yet.
     */
    syncLatest?(input: ResourcePublishInput): Promise<PublishedResourceVersion | null>;
    /**
     * Materialize the published tree into the member's local copy. Optional: the
     * local stub has no bytes to fetch; the real hub adapter fetches the missing
     * blobs and writes the files. The scheduler decides *when* to pull. A real
     * materializer must return the exact version it landed on disk; a later head
     * read is not equivalent because the ref may advance while bytes are in
     * flight.
     */
    pull?(input: ResourcePublishInput): Promise<MaterializedResourceVersion | null>;
    /**
     * Remove the project from the shared team index. Existing immutable versions may
     * remain in the hub, but team members should no longer discover/pull it from the
     * team project list. Optional: older/local adapters can no-op.
     */
    unpublish?(input: ResourcePublishInput): Promise<void>;
}
export interface CollabPublishSchedulerOptions {
    adapter: ResourcePublishAdapter;
    /** Coalesce window (ms). Rapid changes within it collapse into one publish. */
    debounceMs?: number;
    /** Fired after a successful publish so the orchestrator can notify members. */
    onPublished?: (result: {
        projectId: string;
        version: number;
        versionId?: string;
        reason: string;
    }) => void;
    onError?: (result: {
        projectId: string;
        error: unknown;
    }) => void;
}
export declare const PUBLISH_RETRY_BACKOFF_MS: readonly number[];
export declare class CollabPublishScheduler {
    private readonly adapter;
    private readonly debounceMs;
    private readonly onPublished?;
    private readonly onError?;
    private readonly projects;
    private readonly gate;
    constructor(options: CollabPublishSchedulerOptions);
    /** An author-side change to a project. Publishes are coalesced within the window. */
    notifyChanged(projectId: string, reason?: string): void;
    /**
     * Run boundary — flush any pending publish immediately instead of waiting out
     * the debounce, so members see the stable end-of-run state promptly.
     */
    runBoundary(projectId: string): void;
    /** Cancel all pending timers (shutdown). */
    dispose(): void;
    private flush;
    /**
     * Recovery for a publish that failed with nothing newer pending: re-run the
     * same publish (same reason) after a bounded backoff. Exhausting the budget
     * leaves the project in its failed sync state until the next author change —
     * deliberately, so a persistently failing hub is retried a handful of times
     * rather than forever.
     */
    private scheduleRetry;
    private clearRetryTimer;
    private ensure;
}
