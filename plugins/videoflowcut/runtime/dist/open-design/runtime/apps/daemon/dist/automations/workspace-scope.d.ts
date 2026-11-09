export interface PersistedAutomationWorkspaceScope {
    workspaceId: string;
    workspaceMemberId: string;
}
export declare class AutomationWorkspaceScopeError extends Error {
    readonly code: 'WORKSPACE_ACCESS_DENIED';
    readonly retryable: boolean;
    constructor(code: 'WORKSPACE_ACCESS_DENIED', message: string, retryable: boolean);
}
export declare function normalizePersistedAutomationWorkspaceScope(value: unknown): PersistedAutomationWorkspaceScope | null;
/**
 * Persist an automation's exact Workspace billing address on its new project.
 *
 * This is intentionally not an authorization check. The local membership
 * directory is UI/collaboration state and can be stale or temporarily
 * unavailable; it must never select a different wallet. At AMR spawn time the
 * daemon sends this persisted Workspace id together with the signed-in account
 * credentials, and the Vela backend remains the final membership, permission,
 * and billing authority.
 */
export declare function bindProjectToPersistedAutomationWorkspace(ensureWorkspaceProject: (input: {
    projectId: string;
    workspaceId: string;
    visibility: 'personal';
    resourceState: 'active';
    createdByWorkspaceMemberId: string;
    updatedByWorkspaceMemberId: string;
    syncState: 'local_only';
    resourceHubResourceId: null;
    cloudTombstonedAt: null;
    createdAt: number;
    updatedAt: number;
}) => unknown, scope: PersistedAutomationWorkspaceScope | null, projectId: string, now: number): void;
