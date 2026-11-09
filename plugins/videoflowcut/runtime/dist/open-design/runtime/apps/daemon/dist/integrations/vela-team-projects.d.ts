import type { ProjectSyncState } from '@open-design/contracts';
import type { ResourceHubPrincipal } from '../collab/resource-principal.js';
export type VelaTeamProjectSyncState = 'pending_upload' | 'syncing' | 'synced' | 'failed';
export interface VelaTeamProjectRecord {
    /** Missing only on unchanged pre-policy team rows. Private is never list authority. */
    visibility?: 'private' | 'team';
    id: string;
    workspaceId: string;
    projectId: string;
    resourceId: string;
    ownerMemberId: string;
    displayName: string | null;
    syncState: VelaTeamProjectSyncState;
    lastSyncedVersionId: string | null;
    /** Absent when talking to an older Vela API, null when no published ref
     * exists, otherwise the immutable version currently available to readers. */
    publishedVersionId?: string | null;
    createdAt: string;
    /** Owner-origin project timestamp from the catalog row's metadata. This is
     * distinct from `updatedAt`, which is the catalog row revision time and may
     * be restamped by a delayed retry. */
    originProjectUpdatedAt: number | null;
    updatedAt: string;
    access: {
        canView: boolean;
        canComment: boolean;
        canEdit: boolean;
        frozen: boolean;
    };
}
export interface UpsertVelaTeamProjectInput {
    projectId: string;
    resourceId: string;
    displayName?: string | null;
    syncState?: VelaTeamProjectSyncState;
    lastSyncedVersionId?: string | null;
}
export interface VelaTeamProjectCatalogClient {
    list(principal: ResourceHubPrincipal): Promise<VelaTeamProjectRecord[]>;
    upsert(input: UpsertVelaTeamProjectInput, principal: ResourceHubPrincipal): Promise<VelaTeamProjectRecord | null>;
}
export declare function projectResourceIdFor(projectId: string, principal?: ResourceHubPrincipal | null): string;
export declare function projectSyncStateToVela(state: ProjectSyncState): VelaTeamProjectSyncState;
export declare function velaProjectSyncStateToProject(state: VelaTeamProjectSyncState): ProjectSyncState;
