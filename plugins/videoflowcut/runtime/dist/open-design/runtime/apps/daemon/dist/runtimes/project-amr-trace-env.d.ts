import { getWorkspaceProjectByProjectId } from '../db.js';
type SqliteDb = Parameters<typeof getWorkspaceProjectByProjectId>[0];
export type PinnedRunWorkspaceScope = Readonly<{
    schemaVersion: 1;
    projectId: string;
    workspaceId: string;
    workspaceMemberId?: string | null;
    source: 'persisted_project_binding';
}>;
export type AccountScopedRunWorkspaceScope = Readonly<{
    schemaVersion: 1;
    projectId: string;
    workspaceId: null;
    source: 'unbound_account';
}>;
export type RunWorkspaceScope = PinnedRunWorkspaceScope | AccountScopedRunWorkspaceScope;
export declare function accountScopedRunWorkspaceScopeForProject(projectId: string): AccountScopedRunWorkspaceScope;
/**
 * The spawn wallet is an address, not a local authorization decision.
 *
 * A persisted project binding always supplies its exact Workspace id to AMR.
 * The authenticated Vela/AMR backend remains the authority for membership,
 * balance, and billing eligibility. A daemon directory outage or stale
 * membership view therefore cannot silently move a run to the Personal wallet.
 */
export type ProjectWorkspaceScopeOutcomeKind = 'resolved_persisted_binding' | 'account_scoped_unbound' | 'refused_unbound';
export interface ProjectWorkspaceScopeOutcome {
    kind: ProjectWorkspaceScopeOutcomeKind;
    projectId: string;
    workspaceId: string | null;
}
export declare class AmrWorkspaceScopeRequiredError extends Error {
    readonly code = "AMR_WORKSPACE_SCOPE_REQUIRED";
    readonly projectId: string | null;
    constructor(projectId: string | null);
}
/**
 * Freeze the billing address before a run is created.
 *
 * This is the only function in the run path that reads the mutable project
 * binding. Its result is stored on the run and reused for every attempt. The
 * separate account-scoped proof records a genuinely unbound local project;
 * null remains "no proof" and may not silently select a wallet.
 */
export declare function pinRunWorkspaceScopeForProject(db: SqliteDb, projectId: string): PinnedRunWorkspaceScope | null;
/**
 * Build the AMR trace environment solely from the run's frozen binding.
 *
 * The request shell's active/current Workspace, the local membership
 * directory, and the project's current binding are intentionally absent.
 * Project A stays pinned to A for initial spawn and every retry even if the UI
 * switches to B, authority lookup is unavailable, or the project is later
 * rebound. Vela/AMR receives the signed-in account credentials plus
 * `OPEN_DESIGN_WORKSPACE_ID=A` and remains the final authorization/billing
 * authority. A genuinely unbound local project stays account-scoped and omits
 * the Workspace env var on every attempt.
 */
export declare function openDesignAmrTraceEnvForRun(input: {
    agentId: string;
    runId: string;
    conversationId?: string | null;
    runAttempt: number;
    projectId?: string | null;
    workspaceScope?: RunWorkspaceScope | null;
    externalPluginAnalytics?: Record<string, unknown> | null;
}, deps?: {
    onWorkspaceScopeOutcome?: (outcome: ProjectWorkspaceScopeOutcome) => void;
}): Promise<NodeJS.ProcessEnv>;
export {};
