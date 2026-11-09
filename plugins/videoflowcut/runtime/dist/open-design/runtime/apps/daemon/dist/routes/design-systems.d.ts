import type { Express, Request, Response } from 'express';
import type { RouteDeps } from '../server-context.js';
import type { DesignSystemFileDetail, DesignSystemFileSummary, DesignSystemPackageInfo, DesignSystemRevision, DesignSystemSummary, UserDesignSystemInput } from '../design-systems/index.js';
import type { DesignTokenContractRebuildPreparation } from '../design-systems/token-contract-rebuild.js';
import type { DesignSystemGenerationJob, DesignSystemRevisionInput, DesignSystemTokenContractRebuildInput } from '../design-systems/generation-jobs.js';
import { type openDatabase } from '../db.js';
import { type VerifyWorkspaceRequestAuthority, type WorkspaceResourceAccessInput } from '../collab/workspace-resource-mutation.js';
import type { Project, ProjectFile } from '@open-design/contracts';
type DbHandle = ReturnType<typeof openDatabase>;
type DesignSystemWorkspaceProject = {
    project: Project;
    files: ProjectFile[];
};
type AvailableDesignSystemSummary = DesignSystemSummary & {
    source?: 'built-in' | 'installed' | 'user';
};
export interface RegisterDesignSystemRoutesDeps extends RouteDeps<'db' | 'paths' | 'projectFiles' | 'projectStore'> {
    verifyWorkspaceRequestAuthority: VerifyWorkspaceRequestAuthority;
    workspaceResources: {
        getWorkspaceResource: (db: DbHandle, resourceType: string, workspaceId: string, resourceId: string) => WorkspaceResourceAccessInput | null | undefined;
        getWorkspaceResourceByResourceId: (db: DbHandle, resourceType: string, resourceId: string) => WorkspaceResourceAccessInput | null | undefined;
    };
    designSystems: {
        buildUserDesignSystemArchive: (root: string, id: string) => Promise<{
            buffer: Buffer;
            baseName: string;
            title: string;
        } | null>;
        /**
         * Whether the caller may mutate (edit / publish-toggle / delete) `id`.
         * Always true for a system the caller authored themselves. For a system
         * materialized locally from a teammate's team share, true only when the
         * caller can manage that share — the original sharer, or a workspace
         * owner/admin (see `canManageSharedResource` in
         * `collab/team-resource-share.ts`) — mirroring the "who can unshare"
         * rule exactly. Without this gate, a plain member with a synced local
         * copy could PATCH/DELETE a design system that was never theirs
         * (recvqb6mfyqXLD): the UI hides the affordances, but nothing stopped a
         * direct API call.
         *
         * `req` (spec 9.2) lets the implementation also refuse when the caller's
         * own workspace is locked/deleted (billing lapse, deletion in progress)
         * — a check design system never had, unlike project/plugin.
         */
        canMutateUserDesignSystem: (root: string, id: string, req: any) => Promise<boolean>;
        createUserDesignSystem: (root: string, input: UserDesignSystemInput, req: any) => Promise<DesignSystemSummary>;
        deleteUserDesignSystem: (root: string, id: string) => Promise<boolean>;
        ensureUserDesignSystemWorkspaceProject: (db: DbHandle, id: string, options?: {
            workspaceId?: string | null;
            workspaceMemberId?: string | null;
            exactTeam?: boolean;
        }) => Promise<DesignSystemWorkspaceProject | null>;
        listAllDesignSystems: (options?: {
            workspaceId?: string | null;
            workspaceMemberId?: string | null;
            exactTeam?: boolean;
        }) => Promise<AvailableDesignSystemSummary[]>;
        listUserDesignSystemFiles: (root: string, id: string) => Promise<DesignSystemFileSummary[] | null>;
        listUserDesignSystemRevisions: (root: string, id: string) => Promise<DesignSystemRevision[] | null>;
        prepareDesignTokenContractRebuild: (root: string, id: string, options?: {
            force?: boolean;
        }) => Promise<DesignTokenContractRebuildPreparation>;
        readAvailableDesignSystem: (id: string, options?: {
            workspaceId?: string | null;
            workspaceMemberId?: string | null;
            exactTeam?: boolean;
        }) => Promise<string | null>;
        readAvailableDesignSystemPackageInfo: (id: string, options?: {
            workspaceId?: string | null;
            workspaceMemberId?: string | null;
            exactTeam?: boolean;
        }) => Promise<DesignSystemPackageInfo | null>;
        readAvailableDesignSystemStaticFile: (id: string, filePath: string, options?: {
            workspaceId?: string | null;
            workspaceMemberId?: string | null;
            exactTeam?: boolean;
        }) => Promise<{
            bytes: Buffer;
            contentType: string;
            updatedAt: string;
        } | null>;
        readDesignSystemWorkspaceTextFile: (db: DbHandle, summary: AvailableDesignSystemSummary | undefined, filePath: string) => Promise<string | null>;
        readUserDesignSystemFile: (root: string, id: string, filePath: string) => Promise<DesignSystemFileDetail | null>;
        renderDesignSystemPreview: (id: string, body: string) => string;
        renderDesignSystemShowcase: (id: string, body: string) => string;
        /**
         * Physically copies the real `assets/` files out of a user design
         * system's workspace project (where an agent's Write/Edit tool calls
         * actually land) into the canonical directory — the fix for spec 04
         * §9.3 (recvqb1t4FrckM): canonical is the only directory
         * `team-resource-share` and the download archive read from, and until
         * this existed nothing ever copied a regenerated logo back into it.
         */
        syncUserDesignSystemAssetsFromWorkspace: (db: DbHandle, id: string, options?: {
            workspaceId?: string | null;
            workspaceMemberId?: string | null;
            exactTeam?: boolean;
        }) => Promise<{
            ok: true;
            synced: string[];
        } | {
            ok: false;
            reason: 'not-found' | 'no-workspace-project';
        }>;
        updateUserDesignSystem: (root: string, id: string, input: UserDesignSystemInput) => Promise<DesignSystemSummary | null>;
        updateUserDesignSystemRevisionStatus: (root: string, id: string, revisionId: string, status: 'accepted' | 'rejected') => Promise<DesignSystemRevision | null>;
        /**
         * spec 04 §11: unshare `id` from the team hub BEFORE the local delete
         * proceeds, but only when it is CURRENTLY on the live team share list
         * (`designSystemsTeamShare.sharedResources()` in server.ts) — never on
         * `isTeamSyncedUserDesignSystem` alone. That flag is true only on a
         * teammate's PULLED copy; the sharer deleting their OWN original always
         * reads `teamSynced: false`, which is exactly why the hub index used to
         * survive this route untouched and teammates kept seeing the deleted
         * design system. Returns whether an unshare actually ran (false when the
         * system was never shared, or team sharing isn't configured) so tests can
         * assert on the real state transition instead of a call-was-made mock.
         */
        unshareTeamDesignSystemIfShared: (id: string, req: any) => Promise<boolean>;
    };
    generationJobs: {
        get: (jobId: string) => DesignSystemGenerationJob | null;
        rebuildTokenContract: (input: DesignSystemTokenContractRebuildInput) => DesignSystemGenerationJob;
        revise: (input: DesignSystemRevisionInput) => DesignSystemGenerationJob;
        start: (input: UserDesignSystemInput, createDesignSystemForJob?: (root: string, input: UserDesignSystemInput) => Promise<DesignSystemSummary>) => DesignSystemGenerationJob;
    };
}
export interface DesignSystemRouteServices {
    authorizeDesignSystemRead: (req: any, res: Response, id: string, allowNavigationQuery?: boolean) => Promise<boolean>;
    deleteDesignSystemForRequest: (req: Request, res: Response, id: string, options?: {
        beforeDelete?: () => Promise<boolean>;
    }) => Promise<boolean>;
}
export declare function registerDesignSystemRoutes(app: Express, ctx: RegisterDesignSystemRoutesDeps): DesignSystemRouteServices;
export declare function rewriteDesignSystemShowcaseAssetUrls(html: string, designSystemId: string, baseDir: string, workspaceQuery?: {
    workspaceId: string;
    workspaceMemberId: string;
} | null): string;
export {};
