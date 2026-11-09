import type { Express, Request } from 'express';
import type { CollabPresenceMember, WorkspaceCollabContext } from '@open-design/contracts';
import type { CollabRuntime } from '../collab/runtime.js';
import type { VelaCliPresenceHeartbeatInput, VelaCliPresenceLeaveInput } from '../collab/vela-cli-collab-client.js';
import type { VerifiedWorkspaceRequestContextResult } from '../collab/request-workspace-context.js';
export interface CollabPresenceCloudClient {
    heartbeatPresence(projectId: string, input: VelaCliPresenceHeartbeatInput, context?: WorkspaceCollabContext | null): Promise<CollabPresenceMember[]>;
    listPresence(projectId: string, context?: WorkspaceCollabContext | null): Promise<CollabPresenceMember[]>;
    leavePresence(projectId: string, input: VelaCliPresenceLeaveInput, context?: WorkspaceCollabContext | null): Promise<CollabPresenceMember[]>;
}
export interface RegisterCollabPresenceRoutesDeps {
    collab: Pick<CollabRuntime, 'presence'>;
    cloud?: CollabPresenceCloudClient | null;
    isProjectShared?: (projectId: string, context?: WorkspaceCollabContext | null) => Promise<boolean>;
    verifyWorkspaceRequest?: (req: Request, projectId: string) => Promise<VerifiedWorkspaceRequestContextResult | WorkspaceCollabContext | null>;
    /**
     * Leave must bypass any background authority outage lease so closing a tab
     * still gets one chance to release its remote presence lease. Heartbeats use
     * `verifyWorkspaceRequest`; leave falls back to it when this seam is absent.
     */
    verifyWorkspaceLeaveRequest?: RegisterCollabPresenceRoutesDeps['verifyWorkspaceRequest'];
    /**
     * Bounded successful authority lease for the idempotent GET surface.
     * Heartbeat deliberately keeps using `verifyWorkspaceRequest`.
     */
    verifyWorkspaceReadRequest?: RegisterCollabPresenceRoutesDeps['verifyWorkspaceRequest'];
    /** Test/operations seam for the short-lived cloud list cache. */
    presenceListCacheFreshMs?: number;
    /** Virtual clock seam for deterministic TTL coverage. */
    presenceListCacheNow?: () => number;
    /**
     * The configured cloud route authoritatively rejects projects outside the
     * requested workspace, so a separate remote team-project lookup is redundant.
     */
    cloudAuthorizesProjectPresence?: (projectId: string) => boolean;
    /**
     * Cooldown for the upstream negative cache: after repeated consecutive
     * cloud-transport failures for one project, presence stops spawning the
     * transport for this long and replays the classified failure instead.
     */
    presenceUpstreamCooldownMs?: number;
    /** Virtual clock seam for deterministic negative-cache coverage. */
    presenceUpstreamNow?: () => number;
}
export interface CollabPresenceRoutesControl {
    /**
     * Preserve the last authorized roster but make it due for background
     * refresh. Presence-change events use this path so their own relay echo
     * cannot turn the next UI read into a cold, blocking Vela request.
     */
    markPresenceStale(projectId: string, workspaceId?: string): void;
    /**
     * Drop cached list results for one project after a share-authority change.
     * `workspaceId` keeps invalidation scoped when it is known.
     */
    invalidatePresence(projectId: string, workspaceId?: string): void;
}
/**
 * The workspace-scoped presence surface of the collab transport, as this route
 * module needs it. `VelaCliCollabClient` satisfies it structurally.
 */
export interface CollabPresenceCloudTransport {
    heartbeatPresence(projectId: string, input: VelaCliPresenceHeartbeatInput, workspaceId: string): Promise<CollabPresenceMember[]>;
    listPresence(projectId: string, workspaceId: string): Promise<CollabPresenceMember[]>;
    leavePresence(projectId: string, input: VelaCliPresenceLeaveInput, workspaceId: string): Promise<CollabPresenceMember[]>;
}
/**
 * Bind a collab transport to a per-project workspace scope, producing the
 * `cloud` dependency below — or nothing when this run has no cloud transport.
 *
 * The invariant: **a `cloud` dependency exists if and only if a transport
 * exists.** Every endpoint below reads a present `cloud` as "the cloud owns
 * presence for this run" and stops consulting the process-local tracker
 * entirely. So a relay built over an absent transport is not merely useless —
 * it turns the in-process fallback into dead code and every gated presence
 * request into a 502. Returning `null` is what keeps that fallback reachable
 * for the runs that have no transport, which is every build that has not
 * opted into the vela-cli collab transport: all stable/prod packaged builds
 * and every plain `tools-dev` run.
 *
 * Callers must route through this rather than assembling an object literal of
 * arrow functions, because a literal is unconditionally truthy no matter what
 * the transport turned out to be.
 */
export declare function createCollabPresenceCloudClient(transport: CollabPresenceCloudTransport | null | undefined, workspaceScopeFor: (projectId: string) => string | undefined): CollabPresenceCloudClient | null;
/**
 * Team collaboration presence (presence) capability. Members heartbeat while viewing a
 * shared project; clients poll the present set (live cursors were cut, content
 * is polled — the spec). The set is process-local in {@link CollabRuntime}.
 */
export declare function registerCollabPresenceRoutes(app: Express, deps: RegisterCollabPresenceRoutesDeps): CollabPresenceRoutesControl;
