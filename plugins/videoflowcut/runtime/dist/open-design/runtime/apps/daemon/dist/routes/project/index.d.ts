import { type CommentFileDeletion } from '../../collab/comment-file-deletion.js';
import { type PublicFileMutations } from '../../collab/public-file-mutations.js';
import type { Express, Request, Response } from 'express';
import { type PreviewComment, type WorkspaceCollabContext } from '@open-design/contracts';
import { type DesignSystemSummary, type UserDesignSystemInput } from '../../design-systems/index.js';
import { resolvePluginSnapshot } from '../../plugins/index.js';
import type { RouteDeps } from '../../server-context.js';
import type { ProjectCommentWorkspaceContextResolution } from './comments.js';
import { type VelaTeamProjectCatalogClient } from '../../integrations/vela-team-projects.js';
import { type WorkspaceTypeRegistry } from '../../collab/team-share-scope.js';
import { type VerifyWorkspaceRequestAuthority, type WorkspaceResourceAccessInput, type WorkspaceResourceContext, type WorkspaceResourceMutationCapability } from '../../collab/workspace-resource-mutation.js';
import { type AuthorizeProjectRequest } from '../../collab/project-request-authority.js';
import type { WorkspaceDirectoryFetchResult } from '../../collab/vela-workspace-context.js';
export declare function rewriteOutsideExecutableHtmlRanges(html: string, rewriteChunk: (chunk: string) => string): string;
/**
 * Upper bound for every asynchronous read POST /api/projects performs before
 * its project/conversation transaction. The Web enters an optimistic project
 * surface the moment it sends the request, so a stalled catalogue scan must
 * turn into a definite 504 the client can roll back from rather than an
 * open-ended wait; see `PROJECT_CREATE_PREPARATION_TIMEOUT` in contracts.
 */
export declare const DEFAULT_PROJECT_CREATE_PREPARATION_TIMEOUT_MS = 15000;
export interface RegisterProjectRoutesDeps extends RouteDeps<'db' | 'design' | 'http' | 'paths' | 'projectStore' | 'projectFiles' | 'conversations' | 'templates' | 'status' | 'events' | 'ids' | 'telemetry' | 'appConfig' | 'agents' | 'validation' | 'collabSync'> {
    /** Stop public bindings before any catalog/local deletion; production supplies this capability. */
    stopPublicFilesBeforeDelete?: CommentFileDeletion;
    publicFileMutations?: PublicFileMutations;
    /**
     * Request-wide deadline for the read-only preparation POST /api/projects
     * runs before its transaction. Production keeps the 15s default; tests and
     * the `OD_PROJECT_CREATE_PREPARATION_TIMEOUT_MS` env seam may shorten it.
     */
    projectCreatePreparationTimeoutMs?: number;
    pluginScope?: {
        loadRegistry: (options: {
            workspaceId?: string | null;
            workspaceMemberId?: string | null;
        }) => Promise<Parameters<typeof resolvePluginSnapshot>[0]['registry']>;
        getPlugin: (id: string, options: {
            workspaceId: string | null;
            workspaceMemberId: string | null;
        }) => Promise<unknown | null>;
        getLocalPluginBySource?: (id: string, source: string) => Promise<Parameters<typeof resolvePluginSnapshot>[0]['plugin'] | null>;
    };
    teamProjectCatalog?: VelaTeamProjectCatalogClient;
    /** Bounded authoritative verifier for idempotent Workspace project reads. */
    verifyWorkspaceReadAuthority?: VerifyWorkspaceRequestAuthority;
    /** Authoritative verifier for every Workspace-bound project mutation. */
    verifyWorkspaceRequestAuthority?: VerifyWorkspaceRequestAuthority;
    /**
     * Cached-only authority verifier for deleting a personal, local-only
     * project. It must never start network I/O; all other mutations continue
     * through `verifyWorkspaceRequestAuthority`.
     */
    verifyPersonalProjectDeleteLeaseAuthority?: VerifyWorkspaceRequestAuthority;
    /** Shared local binding gate for all project data-plane routes. */
    authorizeProjectRequest?: AuthorizeProjectRequest;
    /** Startup-hydrated O(1) quarantine lookup for stale Team mirrors. */
    isProjectRevoked?: (projectId: string) => boolean;
    /** Durable first-open placeholder stamp lookup. */
    isProjectUnmaterializedPlaceholder?: (projectId: string) => boolean;
    /** Membership directory used by Workspace account and cloud boundaries. */
    fetchWorkspaceDirectory?: () => Promise<WorkspaceDirectoryFetchResult>;
    /** Current settings-backed AMR environment for synthesized project contexts. */
    configuredEnv?: () => Record<string, string>;
    /** @deprecated Creation is local; retained for compatible route composition. */
    fetchProjectCreationWorkspaceDirectory?: () => Promise<WorkspaceDirectoryFetchResult>;
    /**
     * Persist a design system and its Workspace ownership envelope from the
     * request's complete local attribution. Production injects the shared
     * design-system creation service; the optional shape preserves isolated
     * route harnesses and headerless/local compatibility.
     */
    createWorkspaceOwnedDesignSystem?: (root: string, input: UserDesignSystemInput, context: WorkspaceResourceContext | null) => Promise<DesignSystemSummary>;
    /**
     * Collab-cloud comment seams, threaded to the nested preview-comment routes.
     * `resolveAuthorMemberId` stamps the server-authoritative author AND identifies
     * the caller for permission gating; `resolveProjectOwnerMemberId` resolves the
     * shared project's owner so the owner may delete / drive status on any comment.
     * `onCommentCreated`/`onCommentUpdated`/`onCommentDeleted` push the comment's
     * lifecycle (create/edit, status change, tombstone) to the cross-daemon relay.
     * All optional and no-op off-team / when the collab cloud is unconfigured.
     */
    resolveAuthorMemberId?: (authorization: string | undefined) => Promise<string | undefined>;
    resolveCurrentAuthorDisplayName?: () => string | null;
    resolveWorkspaceContext?: (req: Request, projectId: string) => Promise<ProjectCommentWorkspaceContextResolution>;
    resolveReadWorkspaceContext?: (req: Request, projectId: string) => Promise<ProjectCommentWorkspaceContextResolution>;
    resolveProjectOwnerMemberId?: (projectId: string, context?: WorkspaceCollabContext | null) => Promise<string | null>;
    isSharedProject?: (projectId: string, context?: WorkspaceCollabContext | null) => Promise<boolean>;
    onCommentCreated?: (comment: PreviewComment, context: WorkspaceCollabContext | null) => boolean | void;
    onCommentUpdated?: (comment: PreviewComment, context: WorkspaceCollabContext | null) => boolean | void;
    onCommentDeleted?: (comment: PreviewComment, context: WorkspaceCollabContext | null) => boolean | void;
    prepareCommentFile?: (projectId: string, filePath: string, context: WorkspaceCollabContext | null) => Promise<string | undefined>;
    pullCommentsNow?: (projectId: string, context: WorkspaceCollabContext) => Promise<boolean>;
    onCommentsRead?: (projectId: string, context: WorkspaceCollabContext | null, resolveFreshWorkspaceContext: () => Promise<ProjectCommentWorkspaceContextResolution>) => Promise<void> | void;
    /**
     * What the daemon has learned about each workspace's type, used to refuse a
     * team share aimed at a personal workspace even when the caller's headers say
     * otherwise. See `collab/team-share-scope.ts`.
     */
    workspaceTypes?: Pick<WorkspaceTypeRegistry, 'isKnownPersonal' | 'learn' | 'typeOf'>;
}
type WorkspaceProjectMutationCapability = WorkspaceResourceMutationCapability;
type WorkspaceProjectAccessInput = WorkspaceResourceAccessInput;
/**
 * The non-rejecting counterpart of `createEnforceWorkspaceProjectMutation`,
 * for a read route that would otherwise write as a local side effect.
 */
export declare function createWorkspaceProjectWriteAuthorityCheck(_verifyWorkspaceRequestAuthority?: VerifyWorkspaceRequestAuthority, isProjectUnmaterializedPlaceholder?: (projectId: string) => boolean): (req: any, getWorkspaceProject: (db: unknown, workspaceId: string, projectId: string) => WorkspaceProjectAccessInput | null | undefined, getWorkspaceProjectByProjectId: (db: unknown, projectId: string) => WorkspaceProjectAccessInput | null | undefined, db: unknown, projectId: string) => Promise<boolean>;
export declare function createEnforceWorkspaceProjectMutation(_verifyWorkspaceRequestAuthority?: VerifyWorkspaceRequestAuthority, _verifyPersonalProjectDeleteLeaseAuthority?: VerifyWorkspaceRequestAuthority, authorizeProjectRequest?: AuthorizeProjectRequest): (req: any, res: Response, sendApiError: (res: Response, status: number, code: string, message: string, details?: Record<string, unknown>) => unknown, getWorkspaceProject: (db: unknown, workspaceId: string, projectId: string) => WorkspaceProjectAccessInput | null | undefined, getWorkspaceProjectByProjectId: (db: unknown, projectId: string) => WorkspaceProjectAccessInput | null | undefined, db: unknown, projectId: string, capability: WorkspaceProjectMutationCapability) => Promise<boolean>;
/**
 * Materialize a *managed* project's folder before it is referenced as
 * read-only context for another run.
 *
 * Invariant: after this resolves for a managed project, `PROJECTS_DIR/<id>`
 * exists on disk. A brand-new project has a DB row but no on-disk directory
 * until its first file write, so without this a reference resolves to a path
 * that fails both the composer's existence probe and the daemon's
 * all-or-nothing linkedDirs validation. External / imported roots (an absolute
 * `metadata.baseDir`) are the user's own folders and are never created here.
 * Materialization failures are required failures: callers must surface them
 * instead of continuing with a resolvedDir that may not exist.
 */
export declare function ensureReferencedProjectDir(projectsRoot: string, project: {
    id: string;
    metadata?: unknown;
}, ensureProject: (projectsRoot: string, projectId: string, metadata?: unknown) => Promise<string>): Promise<void>;
export declare function daemonSanitizeTitleInDoc(html: string): string;
export declare function registerProjectRoutes(app: Express, ctx: RegisterProjectRoutesDeps): void;
export interface RegisterProjectArtifactRoutesDeps extends RouteDeps<'http' | 'uploads' | 'paths' | 'node' | 'artifacts'> {
}
export declare function registerProjectArtifactRoutes(app: Express, ctx: RegisterProjectArtifactRoutesDeps): void;
export interface RegisterProjectFileRoutesDeps extends RouteDeps<'db' | 'http' | 'paths' | 'uploads' | 'node' | 'projectStore' | 'projectFiles' | 'documents' | 'artifacts' | 'projectPreviewScopes'> {
    isProjectEditingBusy?: (projectId: string) => boolean;
    publicFileMutations?: PublicFileMutations;
    stopPublicFilesBeforeDelete?: CommentFileDeletion;
    verifyWorkspaceRequestAuthority?: VerifyWorkspaceRequestAuthority;
    authorizeProjectRequest?: AuthorizeProjectRequest;
    /** Startup-hydrated O(1) quarantine lookup for stale Team mirrors. */
    isProjectRevoked?: (projectId: string) => boolean;
    /** Durable first-open placeholder stamp lookup. */
    isProjectUnmaterializedPlaceholder?: (projectId: string) => boolean;
}
export declare function registerProjectFileRoutes(app: Express, ctx: RegisterProjectFileRoutesDeps): void;
export interface RegisterProjectUploadRoutesDeps extends RouteDeps<'db' | 'http' | 'uploads' | 'node' | 'paths' | 'projectStore' | 'projectFiles'> {
    verifyWorkspaceRequestAuthority?: VerifyWorkspaceRequestAuthority;
    authorizeProjectRequest?: AuthorizeProjectRequest;
    /** Durable first-open placeholder stamp lookup. */
    isProjectUnmaterializedPlaceholder?: (projectId: string) => boolean;
}
export declare function registerProjectUploadRoutes(app: Express, ctx: RegisterProjectUploadRoutesDeps): void;
export {};
