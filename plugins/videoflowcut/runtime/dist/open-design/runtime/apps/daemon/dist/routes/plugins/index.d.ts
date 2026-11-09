import type { Express, Request, RequestHandler, Response } from 'express';
import type { Project, WorkspaceCollabContext } from '@open-design/contracts';
import { type TeamResourceStateProvider } from '../../collab/team-resource-state.js';
import { type VerifyWorkspaceRequestAuthority } from '../../collab/workspace-resource-mutation.js';
import type { WorkspaceDirectoryFetchResult } from '../../collab/vela-workspace-context.js';
import type { PluginShareAction } from '../../services/plugin-share-tasks.js';
import type { AuthorizeProjectRequest } from '../../collab/project-request-authority.js';
export interface RegisterPluginEventRoutesDeps {
    http: {
        requireLocalDaemonRequest: RequestHandler;
        sendApiError: (res: Response, status: number, code: string, message: string) => unknown;
    };
    verifyWorkspaceRequestAuthority?: VerifyWorkspaceRequestAuthority;
    plugins: {
        listVisiblePluginIds(workspaceId: string | null, workspaceMemberId: string | null): Promise<ReadonlySet<string>>;
    };
}
interface SqliteDbLike {
    prepare(sql: string): {
        all(...params: unknown[]): unknown[];
        get(...params: unknown[]): unknown;
        run(...params: unknown[]): unknown;
    };
    transaction<T>(run: () => T): () => T;
}
interface InstalledPluginLike {
    id?: string;
    title?: string;
    manifest?: Record<string, unknown>;
    fsPath?: string;
    capabilitiesGranted?: string[];
    appliedPlugin?: {
        capabilitiesGranted?: string[];
        [key: string]: unknown;
    };
    assistantMessageId?: string;
    [key: string]: unknown;
}
interface AppliedPluginSnapshotLike {
    snapshotId: string;
    pluginId: string;
    [key: string]: unknown;
}
interface WorkspaceProjectBindingRow {
    workspaceId?: string | null;
    visibility?: string | null;
    resourceState?: string | null;
    createdByWorkspaceMemberId?: string | null;
}
interface WorkspaceResourceBindingRow {
    visibility?: string | null;
    resourceState?: string | null;
    createdByWorkspaceMemberId?: string | null;
}
interface MissingInputErrorLike extends Error {
    fields: string[];
}
interface PluginApplyResult {
    result: {
        capabilitiesGranted: string[];
        appliedPlugin: {
            capabilitiesGranted: string[];
            [key: string]: unknown;
        };
        [key: string]: unknown;
    };
    warnings: unknown[];
    manifestSourceDigest?: string;
}
interface PluginShareTaskLike {
    projectId: string;
    status: 'queued' | 'running' | 'done' | 'failed';
    progress: string[];
    waiters: Set<() => void>;
}
interface PluginRouteHelpers {
    PLUGIN_PREVIEWS_DIR: string;
    pluginUpload: {
        single(field: string): RequestHandler;
        array(field: string, maxCount?: number): RequestHandler;
    };
    pluginInstallation: {
        stageUploadedPluginZip(buffer: Buffer, source: string): Promise<{
            ok?: boolean;
        }>;
        stageUploadedPluginFolder(files: Array<{
            buffer: Buffer;
            originalname: string;
        }>, rawPaths: unknown): Promise<{
            ok?: boolean;
        }>;
    };
    connectorService: unknown;
    resolvedPortRef: {
        current: number | null | undefined;
    };
    pluginShareTaskStore: {
        get(id: string): PluginShareTaskLike | null;
        snapshot(task: PluginShareTaskLike, since?: number): unknown;
    };
    applyBakedPreviews(plugins: InstalledPluginLike[], previewsDir: string): unknown;
    assembleExample(templateHtml: string, slidesHtml: string, title: string): string;
    sendMulterError(res: Response, err: unknown): unknown;
    decodeMultipartFilename(name: string): string;
    installOrUpgradePlugin(req: Request, res: Response, mode: 'install' | 'upgrade', authority: WorkspaceCollabContext | null): Promise<unknown>;
    loadPluginRegistryView(options?: {
        workspaceId?: string | null;
        workspaceMemberId?: string | null;
    }): Promise<unknown>;
    buildConnectorProbe(service: unknown): unknown;
    handleShareProject(req: Request, res: Response, sourcePlugin: InstalledPluginLike): Promise<unknown>;
    handlePluginTrust(req: Request, res: Response, plugin: InstalledPluginLike): Promise<unknown>;
    handlePluginStats(res: Response, installed?: InstalledPluginLike[], snapshotRows?: unknown[]): Promise<unknown> | unknown;
    requireLocalDaemonRequest: RequestHandler;
    handleAppliedPluginExport(req: Request, res: Response): Promise<unknown>;
    handleProjectInstallFolder(req: Request, res: Response): Promise<unknown>;
    handleProjectPluginCli(req: Request, res: Response, action: PluginShareAction): Promise<unknown>;
    getProject(db: SqliteDbLike, id: string): unknown;
    sendApiError(res: Response, status: number, code: string, message: string): unknown;
    isLocalSameOrigin(req: Request, port: number | null | undefined): boolean;
    handleCandidateDraft(req: Request, res: Response): Promise<unknown>;
    handleCandidateShareTask(req: Request, res: Response): Promise<unknown>;
    handleProjectShareTask(req: Request, res: Response): Promise<unknown>;
}
export interface RegisterPluginRoutesDeps {
    db: SqliteDbLike;
    authorizeProjectRequest: AuthorizeProjectRequest;
    /** Team-resource copy red-line (D3). When present, a frozen team plugin cannot
     *  be duplicated into a personal project. Omit to skip the guard (no-op). */
    teamResources?: TeamResourceStateProvider;
    paths: {
        PROJECTS_DIR: string;
        PLUGIN_REGISTRY_ROOTS: string[];
        PLUGIN_LOCKFILE_PATH: string;
    };
    ids: {
        randomId(): string;
    };
    projectStore: {
        insertProject(db: SqliteDbLike, project: unknown): Project | null;
        getProject(db: SqliteDbLike, id: string): Project | null;
        ensureWorkspaceProject(db: SqliteDbLike, input: unknown): unknown;
        dbDeleteProject(db: SqliteDbLike, id: string): unknown;
        removeProjectDir(projectsRoot: string, projectId: string): Promise<unknown>;
    };
    fetchProjectCreationWorkspaceDirectory?: () => Promise<WorkspaceDirectoryFetchResult>;
    /** Settled, TTL-bounded authority for the pure Plugin catalog read. */
    verifyWorkspaceReadAuthority?: VerifyWorkspaceRequestAuthority;
    /** Fresh authority for mutations and non-catalog reads. */
    verifyWorkspaceRequestAuthority?: VerifyWorkspaceRequestAuthority;
    conversations: {
        insertConversation(db: SqliteDbLike, conversation: unknown): unknown;
    };
    /**
     * Read access to the generic `workspace_resources` binding table (db.ts),
     * pre-bound to no particular resource type — routes below pass `'plugin'`
     * explicitly so a future skill/design-system route can reuse the exact
     * same deps shape. Optional so callers that never reach the uninstall
     * route (`registerProjectPluginRoutes`, existing narrow-scope tests) don't
     * have to wire it; `registerPluginRoutes`'s uninstall handler treats an
     * absent value as "no gate" rather than crashing.
     */
    workspaceResources?: {
        getWorkspaceResource: (db: SqliteDbLike, resourceType: string, workspaceId: string, resourceId: string) => WorkspaceResourceBindingRow | null | undefined;
        getWorkspaceResourceByResourceId: (db: SqliteDbLike, resourceType: string, resourceId: string) => WorkspaceResourceBindingRow | null | undefined;
        workspaceTeamPluginBindingAllowsRead?: (db: SqliteDbLike, workspaceId: string, pluginId: string) => boolean;
        getWorkspaceProjectByProjectId?: (db: SqliteDbLike, projectId: string) => WorkspaceProjectBindingRow | null | undefined;
    };
    plugins: {
        listInstalledPlugins: (db: SqliteDbLike, workspaceId?: string | null, workspaceMemberId?: string | null) => InstalledPluginLike[] | Promise<InstalledPluginLike[]>;
        getInstalledPlugin: (db: SqliteDbLike, id: string) => InstalledPluginLike | null;
        getWorkspacePlugin?: (db: SqliteDbLike, id: string, workspaceId: string | null, workspaceMemberId?: string | null) => InstalledPluginLike | null | Promise<InstalledPluginLike | null>;
        getLocalPluginBySource?: (db: SqliteDbLike, id: string, source: string) => InstalledPluginLike | null | Promise<InstalledPluginLike | null>;
        installPlugin: (db: SqliteDbLike, args: unknown) => AsyncIterable<unknown>;
        isSafePluginId: (id: string) => boolean;
        uninstallPlugin: (db: SqliteDbLike, id: string, roots: string[]) => Promise<{
            ok: boolean;
            removedFolder?: boolean;
            warning?: string;
        }>;
        installFromLocalFolder: (db: SqliteDbLike, args: unknown) => AsyncIterable<unknown>;
        applyPlugin: (args: unknown) => PluginApplyResult;
        doctorPlugin: (plugin: InstalledPluginLike, registry: unknown, extras: unknown) => unknown;
        getSnapshot: (db: SqliteDbLike, id: string) => AppliedPluginSnapshotLike | null;
        pruneExpiredSnapshots: (db: SqliteDbLike, opts?: {
            before?: number;
        }) => {
            removed: number;
            ids: string[];
        };
        readPluginLockfile: (path: string) => Promise<unknown>;
        resolvePluginSnapshot: (args: unknown) => unknown;
        MissingInputError: new (...args: unknown[]) => MissingInputErrorLike;
        pluginPromptBlock: (snap: AppliedPluginSnapshotLike) => string;
        listSkillPluginCandidates: (db: SqliteDbLike, projectId: string, includeDismissed?: boolean) => InstalledPluginLike[];
        dismissSkillPluginCandidate: (db: SqliteDbLike, projectId: string, candidateId: string) => InstalledPluginLike | null;
        generateSkillPluginDraft: (db: SqliteDbLike, projectRoot: string, projectId: string, candidateId: string) => Promise<unknown>;
        FIRST_PARTY_ATOMS: unknown[];
    };
    helpers: PluginRouteHelpers;
}
export declare function registerPluginEventRoutes(app: Express, deps: RegisterPluginEventRoutesDeps): void;
export declare function registerPluginRoutes(app: Express, deps: RegisterPluginRoutesDeps): void;
export declare function registerProjectPluginRoutes(app: Express, deps: RegisterPluginRoutesDeps): void;
export {};
