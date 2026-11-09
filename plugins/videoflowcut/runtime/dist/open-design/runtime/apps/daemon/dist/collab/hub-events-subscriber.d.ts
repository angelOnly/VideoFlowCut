import type { WorkspaceBillingRevisionClock } from '@open-design/contracts';
export type HubResourceStatus = 'shared' | 'retracted';
export type HubWorkspaceMemberChange = 'added' | 'removed' | 'updated';
export type HubWorkspaceDirectoryChange = 'created' | 'updated' | 'deleted' | 'membership-added' | 'membership-updated' | 'membership-removed';
export type HubListenerHealth = 'starting' | 'healthy' | 'reconnecting' | 'stopped';
export interface HubListenerStatus {
    listenerEpoch: string;
    listenerHealth: HubListenerHealth;
    sourceGap: boolean;
}
export interface HubReadyFrame {
    workspaceId: string;
    capabilities: string[];
    listenerStatus: HubListenerStatus | null;
}
export declare const CODING_PLAN_USAGE_EVENTS_CAPABILITY = "coding-plan-usage-events-v1";
export declare const WORKSPACE_MEMBER_EVENTS_CAPABILITY = "workspace-member-events-v1";
export declare const AUTHORITATIVE_PROJECT_PRESENCE_CAPABILITY = "authoritative-project-presence-v1";
export declare const WORKSPACE_DIRECTORY_EVENTS_CAPABILITY = "workspace-directory-events-v1";
export interface HubWorkspaceEvent {
    type: 'team-projects-changed' | 'comment-changed' | 'presence-changed' | 'workspace-context-changed' | 'workspace-members-changed' | 'billing-changed' | 'billing-subscription-changed' | 'wallet-balance-changed' | 'coding-plan-usage-changed' | 'project-metadata-changed' | 'project-content-changed' | 'team-resources-changed';
    workspaceId?: string;
    workspaceMemberId?: string;
    /** Subject of a workspace-members-changed event. This is distinct from the
     * authenticated workspaceMemberId carried by private billing events. */
    memberId?: string;
    memberChange?: HubWorkspaceMemberChange;
    revision?: string;
    eventId?: string;
    revisionClock?: WorkspaceBillingRevisionClock;
    projectId?: string;
    resourceId?: string;
    /** Set on 'team-resources-changed': `resource_hub.resources.kind` at emit
     *  time — 'design_system' | 'plugin' | 'skill' | 'project' | any future
     *  kind. Opaque here by design (mirrors vela's own `WorkspaceEvent.
     *  resourceKind`); this daemon's `onEvent` handler owns the kind→reconciler
     *  routing. */
    resourceKind?: string;
    /** Set on 'team-resources-changed' alongside resourceKind: whether the hub
     *  write was a publish (moved the 'published' ref) or a retraction (the
     *  resource's soft-delete). */
    resourceStatus?: HubResourceStatus;
    seq?: number;
    version?: number;
    at?: string;
}
/** Account-scoped dirty signal multiplexed onto any verified Workspace SSE. */
export interface HubWorkspaceDirectoryEvent {
    type: 'workspace-directory-changed';
    workspaceId: string;
    change: HubWorkspaceDirectoryChange;
    at?: string;
}
export declare function parseHubWorkspaceEvent(data: string): HubWorkspaceEvent | null;
export declare function parseHubWorkspaceDirectoryEvent(data: string): HubWorkspaceDirectoryEvent | null;
export declare function parseHubReadyFrame(data: string): HubReadyFrame | null;
export declare function parseHubListenerStatus(data: string): HubListenerStatus | null;
export interface HubEventsEndpoint {
    /** Absolute URL of the SSE endpoint. */
    url: string;
    /** Auth headers (Bearer control key + x-vela-workspace-id). */
    headers: Record<string, string>;
    /** Expected workspace carried by the server's `ready` frame. Catch-up and
     *  events stay gated until the stream proves this exact scope. */
    workspaceId?: string;
    /** Opaque local credential identity; never sent to or read from Vela. */
    identityKey?: string;
}
export interface HubEventsSubscriberOptions {
    /**
     * Resolve the endpoint from the CURRENT vela session + active workspace.
     * Returning null (signed out / personal-only) parks the subscriber at the
     * max backoff; it keeps re-resolving so a later sign-in picks up.
     */
    resolveEndpoint: () => Promise<HubEventsEndpoint | null>;
    onEvent: (event: HubWorkspaceEvent, connection: {
        identityKey?: string;
    }) => void;
    /** Account-directory dirty signal carried by any verified Workspace stream. */
    onDirectoryEvent?: (event: HubWorkspaceDirectoryEvent, connection: {
        identityKey?: string;
    }) => void;
    /** Terminal authorization signal emitted immediately before Vela closes a
     * revoked member's verified stream. */
    onAccessRevoked?: (revocation: {
        workspaceId?: string;
        identityKey?: string;
        reason?: string;
    }) => void;
    /** Channel health transitions — drives poll-cadence switching. */
    onStateChange?: (state: 'connected' | 'disconnected', connection: {
        identityKey?: string;
    }) => void;
    /** Strict authority health for adaptive polling. `healthy` is true only
     * after exact-scope verification, required roster/listener capabilities,
     * and a healthy gap-free producer status are all present. */
    onAuthorityHealthChange?: (health: {
        workspaceId?: string;
        identityKey?: string;
        healthy: boolean;
        capabilities: readonly string[];
        listenerStatus: HubListenerStatus | null;
    }) => void;
    /** Fired after a `ready` frame verifies the stream workspace. Unlike
     *  `onReconnect`, this includes the first successful connection. */
    onConnect?: (connection: {
        reconnect: boolean;
        workspaceId?: string;
        identityKey?: string;
        capabilities: readonly string[];
    }) => void;
    /** One catch-up nudge per healthy producer-listener epoch that reports a gap. */
    onSourceGap?: (gap: {
        workspaceId?: string;
        identityKey?: string;
        listenerEpoch: string;
    }) => void;
    /** Secret-free parser/scope diagnostics. Raw payloads are never exposed. */
    onDrop?: (drop: {
        reason: 'invalid-ready' | 'workspace-mismatch' | 'unverified-scope' | 'invalid-payload';
        eventName: string;
        expectedWorkspaceId?: string;
        actualWorkspaceId?: string;
    }) => void;
    /**
     * Fired on every successful (re)connect AFTER the first, i.e. whenever
     * events may have been missed. The caller should run one catch-up cycle
     * (its pollers' `pollOnce`).
     */
    onReconnect?: (connection: {
        identityKey?: string;
    }) => void;
    onError?: (error: unknown) => void;
    fetchImpl?: typeof fetch;
    /** Abort the stream when no frame (event OR heartbeat) arrives for this long. */
    heartbeatTimeoutMs?: number;
    backoffMinMs?: number;
    backoffMaxMs?: number;
    /** Injectable jitter source for deterministic reconnect tests. */
    random?: () => number;
}
export interface HubEventsSubscriber {
    stop(): void;
    connected(): boolean;
    /** Re-resolve the endpoint immediately after active-workspace identity changes. */
    refreshEndpoint(): void;
}
export declare function startHubEventsSubscriber(options: HubEventsSubscriberOptions): HubEventsSubscriber;
