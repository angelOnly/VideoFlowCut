import { type TeamResourceRequestScope, type TeamResourceShareService } from '../collab/team-resource-share.js';
export interface PreparedLinkedProjectShare {
    projectId: string;
    /**
     * Move the one backing project projection and its remote Team publication.
     * Implementations must compensate their own partial transition before
     * rejecting; this coordinator compensates the other resource family.
     */
    transition(visibility: 'personal' | 'team'): Promise<void>;
}
export interface CreateLinkedProjectTeamResourceShareServiceOptions {
    resource: TeamResourceShareService;
    /**
     * Resolve and authorize the backing project before either hub is mutated.
     * The returned transition is pinned to this exact Workspace principal.
     */
    prepare(resourceId: string, scope: TeamResourceRequestScope): Promise<PreparedLinkedProjectShare>;
}
export interface DesignSystemBackingProjectBinding {
    workspaceId?: string | null;
    createdByWorkspaceMemberId?: string | null;
}
export interface CreateDesignSystemBackingProjectPreparerOptions {
    resolveProjectId(resourceId: string, scope: TeamResourceRequestScope): Promise<string | null> | string | null;
    /**
     * Materialize and bind a missing backing project under the request's exact
     * Workspace identity. This is mutation-only; collection reads must never
     * invoke it.
     */
    ensureProjectId?(resourceId: string, scope: TeamResourceRequestScope): Promise<string | null> | string | null;
    projectExists(projectId: string): boolean;
    getProjectBinding(projectId: string): DesignSystemBackingProjectBinding | undefined;
    publishProject(projectId: string, scope: TeamResourceRequestScope): Promise<{
        version: number | null;
    }>;
    unpublishProject(projectId: string, scope: TeamResourceRequestScope): Promise<void>;
    persistVisibility(input: {
        projectId: string;
        scope: TeamResourceRequestScope;
        visibility: 'personal' | 'team';
    }): Promise<void> | void;
    onPrepared?: (input: {
        resourceId: string;
        projectId: string;
        scope: TeamResourceRequestScope;
    }) => void;
}
/**
 * Build the exact-Workspace project half of the linked-resource saga.
 * Authority is checked before the coordinator publishes the design system,
 * and each remote-project/local-projection pair compensates itself before
 * rejecting.
 */
export declare function createDesignSystemBackingProjectPreparer(options: CreateDesignSystemBackingProjectPreparerOptions): CreateLinkedProjectTeamResourceShareServiceOptions['prepare'];
/**
 * Couple a Team resource with its editable backing project as a small saga.
 *
 * The Resource Hub has separate design-system and project publications, so no
 * SQL transaction can honestly make the cross-hub write atomic. The ordering
 * here is deliberate and every second-step failure runs the inverse idempotent
 * primitive before the request rejects:
 *
 * - share: publish resource -> move/publish project; compensate by unsharing
 *   the resource if the project transition fails;
 * - unshare: move/unpublish project -> unpublish resource; compensate by
 *   moving/publishing the project back if resource removal fails.
 *
 * `prepare` runs first so a Workspace mismatch or ownership failure cannot
 * leave even the first hub changed. Successful calls do not resolve until both
 * halves agree, which lets the route invalidate both list projections once.
 */
export declare function createLinkedProjectTeamResourceShareService(options: CreateLinkedProjectTeamResourceShareServiceOptions): TeamResourceShareService;
