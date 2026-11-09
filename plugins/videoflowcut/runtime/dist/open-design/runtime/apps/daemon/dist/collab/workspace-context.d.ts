import type { WorkspaceCollabContext } from '@open-design/contracts';
export interface WorkspaceContextRequest {
    /** The caller's bearer token (a real provider verifies this against B). */
    authorization?: string | undefined;
    /**
     * The workspace this caller explicitly selected. Client-facing routes must
     * always provide it; it must never be inferred from daemon-global active
     * state because one daemon can serve multiple browser tabs concurrently.
     */
    workspaceId?: string | undefined;
}
export interface WorkspaceContextProvider {
    current(req: WorkspaceContextRequest): Promise<WorkspaceCollabContext | null>;
    /**
     * Resolve one request-selected Workspace without reading or mutating any
     * daemon-global selection. Client-facing routes use this API exclusively.
     */
    resolveExact?(req: WorkspaceContextRequest & {
        workspaceId: string;
    }): Promise<WorkspaceCollabContext | null>;
    /**
     * Dev/demo seam: override the returned context. Absent on a real B-backed
     * provider (whose context is derived per-request from the token).
     */
    set?(context: WorkspaceCollabContext | null): void;
    /**
     * Legacy synchronous observation of the most recently resolved context.
     * It performs no network I/O and is populated by `current`, `resolveExact`,
     * or the dev-only `set` seam. Request authorization must not use it because
     * it is neither keyed by Workspace nor guaranteed fresh.
     */
    lastKnown?(): WorkspaceCollabContext | null;
    /**
     * Same cached identity plus a monotonic generation that advances whenever
     * an observed authorization identity changes, including A -> B -> A between
     * two callers' snapshots.
     */
    lastKnownSnapshot?(): {
        context: WorkspaceCollabContext | null;
        generation: number;
    };
}
/**
 * Preserve the legacy observation API while client-facing routes migrate to
 * exact request authority. The wrapper performs no extra network I/O.
 *
 * `lastKnown()` reflects whichever Workspace the provider most recently
 * resolved. It is deliberately not scoped per Workspace and therefore is not
 * authority for reads, writes, billing, or background subscriptions.
 *
 * Authorization generations have a narrower meaning than raw availability.
 * Vela maps both a transient timeout and a real signed-out response to `null`,
 * so treating every null as a new identity turns A -> transient null -> A into
 * a false workspace switch. The raw context still becomes null (and therefore
 * fails closed while unavailable), but generation advances only when a
 * non-null authoritative identity differs. A later successful A read restores
 * availability without fabricating drift. Dev/demo `set(null)` remains an
 * explicit authoritative clear and does advance the generation.
 */
export declare function withLastKnownWorkspaceContext(provider: WorkspaceContextProvider): WorkspaceContextProvider;
/**
 * The URL of the workspace settings/management console on the cloud web app.
 * Team actions (create, invite, members, billing) live there — the local client
 * only links out to them. Prefers an explicit value the upstream context carries;
 * otherwise builds one from `OD_VELA_WEB_URL` when configured. Undefined when
 * neither is available (the client then hides the settings entry).
 */
export declare function resolveWorkspaceSettingsUrl(workspaceId: string, explicit: unknown, env?: NodeJS.ProcessEnv, configuredEnv?: Record<string, string>): string | undefined;
/**
 * Validate an untrusted workspace-context payload (dev PUT body / env). Returns
 * the typed context or null if any required enum field is missing or out of enum.
 * Permissions and the seat summary are DERIVED through the contract helpers
 * (B's `buildWorkspacePermissions`/`buildWorkspaceSeatSummary` mirror) so a dev
 * payload only needs role + lifecycle + seat counts; the real B proxy passes
 * B's already-derived values straight through.
 */
export declare function parseWorkspaceCollabContext(input: unknown): WorkspaceCollabContext | null;
/**
 * Dev/demo provider: holds a single in-memory context, optionally seeded from
 * `OD_DEV_WORKSPACE_CONTEXT` (JSON). Ignores the request — a real B-backed
 * provider derives the context per-caller from the token instead.
 */
export declare function createDevWorkspaceContextProvider(seed?: WorkspaceCollabContext | null): WorkspaceContextProvider;
