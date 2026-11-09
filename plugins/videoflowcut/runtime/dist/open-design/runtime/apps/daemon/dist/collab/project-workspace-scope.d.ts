import type { ProjectWorkspaceScope, WorkspaceType } from '@open-design/contracts';
interface ProjectWorkspaceBinding {
    workspaceId?: unknown;
    visibility?: unknown;
    workspaceVisibility?: unknown;
    resourceState?: unknown;
    createdByWorkspaceMemberId?: unknown;
}
/**
 * Resolve the browser/runtime scope of a local project without consulting the
 * membership directory. Persisted binding is authoritative for the Workspace
 * id; a complete request or the daemon's already-learned type supplies the
 * Personal/Team presentation hint. Unknown historical private bindings fall
 * back to Personal until the account directory catches up.
 */
export declare function resolveLocalProjectWorkspaceScope(input: {
    projectId: string;
    binding: ProjectWorkspaceBinding | null | undefined;
    requestWorkspaceMemberId?: string | null;
    requestWorkspaceType?: WorkspaceType | null;
    knownWorkspaceType?: WorkspaceType | null;
    configuredEnv?: Record<string, string>;
}): ProjectWorkspaceScope;
export {};
