import type { WorkspaceResourceContext } from '../collab/workspace-resource-mutation.js';
import { type DesignSystemSummary, type UserDesignSystemInput } from './index.js';
type WorkspaceResourceEnvelopeInput = {
    visibility: 'personal';
    resourceState: 'active';
    createdByWorkspaceMemberId: string;
    updatedByWorkspaceMemberId: string;
};
export interface CreateWorkspaceOwnedDesignSystemDeps {
    ensureWorkspaceResource: (resourceType: 'design_system', workspaceId: string, resourceId: string, input: WorkspaceResourceEnvelopeInput) => unknown;
    listReservedResourceIds?: () => Iterable<string>;
    createUserDesignSystem?: (root: string, input: UserDesignSystemInput) => Promise<DesignSystemSummary>;
    deleteUserDesignSystem?: (root: string, id: string) => Promise<boolean>;
}
export interface DeleteWorkspaceOwnedDesignSystemDeps {
    deleteUserDesignSystem?: (root: string, id: string) => Promise<boolean>;
    deleteWorkspaceResourceByResourceId: (resourceType: 'design_system', resourceId: string) => unknown;
}
/**
 * Persist one user design system and its Workspace ownership envelope.
 *
 * `context` is already directory-verified by the caller. A null context is
 * the deliberate headerless/local compatibility lane: the design system is
 * created without a Workspace claim or envelope. For a scoped create, the
 * filesystem and SQLite writes form one logical unit. If the envelope write
 * fails, remove only the directory allocated by this call before surfacing
 * the original error, so a later catalog scan cannot expose a half-owned
 * design system.
 */
export declare function createWorkspaceOwnedDesignSystem(root: string, input: UserDesignSystemInput, context: WorkspaceResourceContext | null, deps: CreateWorkspaceOwnedDesignSystemDeps): Promise<DesignSystemSummary>;
/**
 * Delete one user design system and then remove its Workspace envelope.
 *
 * The filesystem is the canonical payload. Keep the ownership envelope when
 * that delete fails so callers do not expose unbound bytes through a later
 * catalog scan. This mirrors the normal design-system DELETE route ordering.
 */
export declare function deleteWorkspaceOwnedDesignSystem(root: string, id: string, deps: DeleteWorkspaceOwnedDesignSystemDeps): Promise<boolean>;
export {};
