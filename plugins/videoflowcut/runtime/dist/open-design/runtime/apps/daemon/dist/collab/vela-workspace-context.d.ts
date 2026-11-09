import type { WorkspaceCollabContext, WorkspaceDirectoryItem } from '@open-design/contracts';
import { readVelaControlApiContext, type VelaControlApiContext } from '../integrations/vela.js';
import type { HubEventsEndpoint } from './hub-events-subscriber.js';
import { type WorkspaceContextProvider } from './workspace-context.js';
interface VelaWorkspaceContextOptions {
    /** Injectable for tests. */
    fetch?: typeof fetch;
    /** Reuse the daemon's account-scoped directory authority broker. */
    fetchWorkspaceDirectory?: () => Promise<WorkspaceDirectoryFetchResult>;
    /** Injectable for tests; defaults to reading ~/.amr/config.json + env. */
    readSession?: typeof readVelaControlApiContext;
    /** Settings-backed AMR environment used by the daemon's agent launcher. */
    configuredEnv?: Record<string, string> | (() => Record<string, string>);
    /**
     * Legacy default for no-argument `current()` and fresh-account bootstrap.
     * Exact request resolution never reads it.
     */
    getActiveWorkspaceId?: () => string | null | undefined;
    /**
     * Persist a directory-derived bootstrap or recovery choice only while the
     * inspected LOCAL selection is still current. Returns the selection that
     * wins against user switches already queued during persistence. This never
     * reads or writes B's account-level Active Workspace.
     */
    replaceLocalSelection?: (expectedWorkspaceId: string | null, workspaceId: string) => string | null | Promise<string | null>;
    timeoutMs?: number;
}
/**
 * Map a rich workspace-context body onto our WorkspaceCollabContext. The invite
 * continuation response still carries this shape even though ordinary client
 * startup no longer calls B's account-global current-workspace endpoint. This
 * is a near pass-through with two adjustments:
 *  - `teamId` is derived as `workspaceId` for a team workspace: B has no separate
 *    team id — the workspace IS the team scope the resource hub keys resources by.
 *  - `permissions` / `seatSummary` are trusted from B when well-formed, and
 *    defensively re-derived (so read-only gating never breaks) if B omits them.
 * Returns null when a required field is missing or an enum is out of range —
 * collab then stays dormant rather than acting on a malformed context.
 */
export declare function mapVelaWorkspaceContext(input: unknown, configuredEnv?: Record<string, string>): WorkspaceCollabContext | null;
export declare function mapVelaWorkspaceDirectory(input: unknown): WorkspaceDirectoryItem[];
/**
 * Provider that fetches the workspace context from B using the local vela
 * session. Swap this in for the dev stub once a B-backed vela is reachable.
 */
export declare function createVelaWorkspaceContextProvider(options?: VelaWorkspaceContextOptions): WorkspaceContextProvider;
/**
 * Synthesize a workspace context from the locally selected membership
 * directory item. The directory carries identity + role + lifecycle;
 * billing-plane fields default conservatively (no plan, derived permissions)
 * until a per-workspace context endpoint exists on B.
 */
export declare function workspaceContextFromDirectoryItem(item: WorkspaceDirectoryItem, configuredEnv?: Record<string, string>): WorkspaceCollabContext;
/**
 * Result of a directory fetch attempt. `ok` is the load-bearing bit for
 * anything that decides whether to trust an absence as a CONFIRMED removal:
 * true only when B actually answered with a 2xx — false for a network error,
 * an abort/timeout, or any non-2xx status, regardless of what (if anything)
 * `items` ends up holding.
 */
export interface WorkspaceDirectoryFetchResult {
    ok: boolean;
    items: WorkspaceDirectoryItem[];
    reason?: 'unauthorized' | 'upstream' | 'network';
    status?: number;
}
/**
 * Cheap, non-secret cache partition for the local Vela session. A credential
 * rotation/account switch must never reuse the prior member directory, even
 * within the short success TTL.
 */
export declare function velaWorkspaceDirectoryIdentity(readSession?: typeof readVelaControlApiContext, configuredEnv?: Record<string, string>): string;
/**
 * Derive the cache/stream identity from an already captured control session.
 * Callers that also build an authenticated request should use this form so the
 * URL, credential, and identity can never be assembled from different env
 * snapshots.
 */
export declare function velaWorkspaceDirectoryIdentityForSession(session: VelaControlApiContext | null): string;
/**
 * Resolve a single merged session, then derive every authenticated hub field
 * from that immutable snapshot.
 */
export declare function resolveVelaWorkspaceHubEventsEndpoint(workspaceId: string, env?: NodeJS.ProcessEnv, configuredEnv?: Record<string, string>): HubEventsEndpoint | null;
/**
 * One daemon-owned authority broker shared by idempotent reads and mutations.
 *
 * Successful authority reads seed a bounded display-read lease. General
 * mutations ignore that settled success lease and perform a fresh directory
 * read, while still sharing an already-unsettled request and a short outage
 * circuit from the same Vela session. The cached-only accessor never starts
 * I/O; its one production consumer may use a valid same-session lease for
 * personal local-only project cleanup, then falls back to fresh authority on
 * every miss. This keeps the 5s status poll off the control plane without
 * weakening Team/hub mutation freshness, and prevents a status/heartbeat
 * boundary from launching duplicate directory requests.
 */
export declare function createWorkspaceDirectoryAuthorityBroker(options?: {
    fetchDirectory?: () => Promise<WorkspaceDirectoryFetchResult>;
    identityKey?: () => string;
    ttlMs?: number;
    failureBackoffMinMs?: number;
    failureBackoffMaxMs?: number;
    now?: () => number;
    random?: () => number;
    onDecision?: (input: {
        source: 'cache' | 'directory';
        reason: 'cold' | 'lease_hit' | 'lease_expired' | 'in_flight' | 'failure_backoff' | 'fresh';
        outcome: 'allow' | 'deny' | 'unavailable' | 'fallback';
        ageMs?: number;
    }) => void;
    onSuppressedRequest?: (input: {
        source: 'directory';
        reason: 'lease_hit' | 'in_flight' | 'failure_backoff';
    }) => void;
    onInvalidation?: (input: {
        source: 'cache';
        reason: 'mutation' | 'event_dirty' | 'auth_reject' | 'catch_up';
    }) => void;
    /** Called only when a successful result belongs to the current generation. */
    onAcceptedResult?: (result: WorkspaceDirectoryFetchResult, identity: string) => void;
}): {
    cached: () => Promise<WorkspaceDirectoryFetchResult>;
    read: () => Promise<WorkspaceDirectoryFetchResult>;
    /** User-initiated authority probe: ignores a settled outage circuit. */
    fresh: () => Promise<WorkspaceDirectoryFetchResult>;
    /** Background fresh read: shares the account-wide outage circuit. */
    backgroundFresh: () => Promise<WorkspaceDirectoryFetchResult>;
    /** Keep successful display reads alive while account-directory SSE is strict. */
    setRealtimeHealthy: (healthy: boolean) => void;
    /** Retire every identity partition and fence all unsettled directory reads. */
    resetIdentity: () => void;
    invalidate: (reason?: 'event_dirty' | 'auth_reject' | 'catch_up') => void;
    refreshAfterMutation: () => Promise<WorkspaceDirectoryFetchResult>;
};
/**
 * Compatibility wrapper for callers that only need the bounded read lease.
 * Production daemon wiring uses one shared broker for reads and mutations.
 */
export declare function createCachedWorkspaceDirectoryFetcher(options?: {
    fetchDirectory?: () => Promise<WorkspaceDirectoryFetchResult>;
    identityKey?: () => string;
    ttlMs?: number;
    failureBackoffMinMs?: number;
    failureBackoffMaxMs?: number;
    now?: () => number;
    random?: () => number;
}): () => Promise<WorkspaceDirectoryFetchResult>;
/**
 * Mutation authorization must not reuse a settled directory result, but
 * concurrent checks from the same Vela session may share one authority read.
 * Partitioning the in-flight request by session identity prevents an account
 * switch from authorizing account B with account A's membership directory.
 */
export declare function createFreshWorkspaceDirectoryFetcher(options?: {
    fetchDirectory?: () => Promise<WorkspaceDirectoryFetchResult>;
    identityKey?: () => string;
}): () => Promise<WorkspaceDirectoryFetchResult>;
export declare function fetchVelaWorkspaceDirectory(options?: VelaWorkspaceContextOptions): Promise<WorkspaceDirectoryFetchResult>;
export declare function listVelaWorkspaceDirectory(options?: VelaWorkspaceContextOptions): Promise<WorkspaceDirectoryItem[]>;
/**
 * Select the workspace-context provider for this run. `OD_WORKSPACE_CONTEXT_SOURCE
 * =vela` opts into the real B-backed provider (production / e2e against a live
 * vela); every other value keeps the dev stub, so demo and tools-dev runs — which
 * have no B and drive the context via the dev PUT — are unaffected.
 */
export declare function createWorkspaceContextProviderFromEnv(env?: NodeJS.ProcessEnv, options?: Pick<VelaWorkspaceContextOptions, 'configuredEnv' | 'fetchWorkspaceDirectory' | 'getActiveWorkspaceId' | 'replaceLocalSelection'>): WorkspaceContextProvider;
export {};
