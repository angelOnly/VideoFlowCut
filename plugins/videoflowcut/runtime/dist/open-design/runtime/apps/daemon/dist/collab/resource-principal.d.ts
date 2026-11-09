import { type WorkspaceCollabContext } from '@open-design/contracts';
/**
 * Workspace identity used to scope collaboration state. Authentication is
 * owned by the Vela login session; these fields are routing context only.
 */
export interface ResourceHubPrincipal {
    memberId: string;
    /** Workspace-scoped resource id. Historically named teamId by the Vela CLI. */
    teamId: string;
    role: WorkspaceCollabContext['role'];
    lifecycleState: WorkspaceCollabContext['lifecycleState'];
    workspaceType?: WorkspaceCollabContext['workspaceType'];
}
/** Derive resource scope from the one login-backed workspace context. */
export declare function contextToResourceHubPrincipal(context: WorkspaceCollabContext | null): ResourceHubPrincipal | null;
