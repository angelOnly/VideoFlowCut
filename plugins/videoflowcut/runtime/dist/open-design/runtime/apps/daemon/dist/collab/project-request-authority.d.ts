import type { Response } from 'express';
import { type ResolveWorkspaceResourceReadAuthority, type VerifyWorkspaceRequestAuthority, type WorkspaceResourceAccessInput, type WorkspaceResourceMutationCapability } from './workspace-resource-mutation.js';
export type AuthorizeProjectRequestOptions = {
    mode: 'read';
    /** EventSource, iframe, and direct asset navigation cannot set headers. */
    allowNavigationQuery?: boolean;
} | {
    mode: 'write';
    capability: WorkspaceResourceMutationCapability;
};
export type AuthorizeProjectRequest = (req: any, res: Response, projectId: string, options: AuthorizeProjectRequestOptions) => Promise<boolean>;
export type AuthorizedProjectToolRequest = {
    readonly workspace: {
        readonly workspaceId: string;
        readonly workspaceMemberId: string;
    } | null;
};
export type AuthorizeProjectToolRequest = (res: Response, projectId: string, options: AuthorizeProjectRequestOptions) => Promise<AuthorizedProjectToolRequest | null>;
export declare function enforceLocalProjectDataPlaneRequest(input: {
    req: any;
    projectId: string;
    options: AuthorizeProjectRequestOptions;
    db: unknown;
    getWorkspaceProject: (db: unknown, workspaceId: string, projectId: string) => WorkspaceResourceAccessInput | null | undefined;
    getWorkspaceProjectByProjectId: (db: unknown, projectId: string) => WorkspaceResourceAccessInput | null | undefined;
    onDenied?: (status: number, code: string, message: string, details?: Record<string, unknown>) => unknown;
}): Promise<boolean>;
/**
 * Build the one project data-plane authority gate used by route modules.
 *
 * Persisted project binding is the local namespace and creator witness. Local
 * project data-plane requests never synchronously depend on Vela membership
 * availability; cloud share/sync/billing boundaries perform their own fresh
 * authorization. Unbound pre-Workspace local projects retain legacy behavior.
 */
export declare function createAuthorizeProjectRequest(deps: {
    db: unknown;
    getWorkspaceProject: (db: unknown, workspaceId: string, projectId: string) => WorkspaceResourceAccessInput | null | undefined;
    getWorkspaceProjectByProjectId: (db: unknown, projectId: string) => WorkspaceResourceAccessInput | null | undefined;
    /** @deprecated Retained as an ignored compatibility seam for route fixtures. */
    verifyWorkspaceReadAuthority?: VerifyWorkspaceRequestAuthority;
    /** @deprecated Retained as an ignored compatibility seam for route fixtures. */
    resolveWorkspaceReadAuthority?: ResolveWorkspaceResourceReadAuthority;
    /** @deprecated Local project data-plane requests never call this verifier. */
    verifyWorkspaceRequestAuthority?: VerifyWorkspaceRequestAuthority;
    /**
     * Durable local quarantine witness for a pulled mirror whose authoritative
     * Team catalog row disappeared. Kept outside the generic workspace binding
     * shape because it lives on project metadata for restart-safe recovery.
     */
    isProjectRevoked?: (db: unknown, projectId: string) => boolean;
    /** A bound first-open placeholder may be read but is never content authority. */
    isProjectUnmaterializedPlaceholder?: (db: unknown, projectId: string) => boolean;
    /** A receive owns the project content until its local commit finishes. */
    isProjectReceivingContent?: (projectId: string) => boolean;
    sendApiError: (res: Response, status: number, code: string, message: string, details?: Record<string, unknown>) => unknown;
}): AuthorizeProjectRequest;
