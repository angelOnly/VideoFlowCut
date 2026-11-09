import type { PublicShareProjectRegistration, TeamProject } from '@open-design/contracts';
import type { VelaTeamProjectCatalogClient } from '../integrations/vela-team-projects.js';
import { runVelaCommand } from '../integrations/vela-command.js';
import type { ResourceHubPrincipal } from './resource-principal.js';
/** Latest paired CLI only: no catalog/list or root-upload fallback. */
export declare function ensurePrivateVelaTeamProject(projectId: string, principal: ResourceHubPrincipal, run: typeof runVelaCommand): Promise<PublicShareProjectRegistration>;
/** Await the association ACK before any selected-file version/blob transport. */
export declare function registerVelaTeamProjectResource(projectId: string, resourceId: string, run: typeof runVelaCommand): Promise<void>;
export type RunVelaTeamProjects = (args: string[], workspaceId?: string) => Promise<string>;
export type RunVelaResources = (args: string[], workspaceId?: string) => Promise<string>;
interface VelaCliTeamProjectCatalogOptions {
    run?: RunVelaTeamProjects;
    runResource?: RunVelaResources;
    supportsTeamProjects?: () => boolean | Promise<boolean>;
}
export type VelaOwnerProjectRegistration = Omit<PublicShareProjectRegistration, 'resourceId'> & {
    resourceId: string | null;
};
export interface VelaTeamProjectCatalog {
    list(workspaceId: string): Promise<TeamProject[]>;
    get(projectId: string, workspaceId: string): Promise<TeamProject | null>;
    upsert(input: {
        projectId: string;
        resourceId?: string;
        displayName?: string | null;
        syncState?: 'pending_upload' | 'syncing' | 'synced' | 'failed';
        lastSyncedVersionId?: string | null;
        metadata?: Record<string, unknown> | null;
    }, principal?: ResourceHubPrincipal | null): Promise<void>;
    remove(projectId: string, principal?: ResourceHubPrincipal | null): Promise<void>;
    ensurePrivate(projectId: string, principal: ResourceHubPrincipal): Promise<PublicShareProjectRegistration>;
    setVisibility(projectId: string, visibility: 'private' | 'team', principal: ResourceHubPrincipal): Promise<void>;
    /** Exact owner authority, independent of readable versions or team membership. */
    getRegistration(projectId: string, principal: ResourceHubPrincipal): Promise<VelaOwnerProjectRegistration | null>;
}
export interface ScopedVelaTeamProjectCatalogClientCache extends VelaTeamProjectCatalogClient {
    /**
     * Invalidate one verified principal, or every principal when a caller only
     * knows that the shared catalog changed (for example after an unshare or a
     * hub event).
     */
    invalidate(principal?: ResourceHubPrincipal): void;
    /** Invalidate every member-scoped entry for one exact Workspace. */
    invalidateWorkspace(workspaceId: string): void;
}
export declare function projectResourceId(projectId: string): string;
export declare function createVelaCliTeamProjectCatalog(options?: VelaCliTeamProjectCatalogOptions): VelaTeamProjectCatalog;
export declare function createVelaCliTeamProjectCatalogClient(options?: VelaCliTeamProjectCatalogOptions): VelaTeamProjectCatalogClient;
/**
 * Short-lived read cache for request-scoped project catalogs.
 *
 * One cache instance is created per complete principal identity. The fetcher
 * closes over that immutable principal, so a daemon-wide Workspace switch can
 * neither change the request sent to Vela nor place B's response in A's entry.
 */
export declare function createScopedVelaTeamProjectCatalogClientCache(client: VelaTeamProjectCatalogClient, freshMs?: number): ScopedVelaTeamProjectCatalogClientCache;
export declare function createVelaCliTeamProjectCatalogClientFromEnv(options?: VelaCliTeamProjectCatalogOptions): VelaTeamProjectCatalogClient | null;
export declare function createVelaCliTeamProjectCatalogFromEnv(options?: VelaCliTeamProjectCatalogOptions): VelaTeamProjectCatalog | null;
export declare function shouldUseVelaCliTeamProjectCatalog(env?: NodeJS.ProcessEnv): boolean;
export {};
