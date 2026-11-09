import type Database from 'better-sqlite3';
type JsonRecord = Record<string, unknown>;
type SkillEntry = {
    id: string;
    dir?: string;
} & JsonRecord;
type DesignSystemSummary = {
    id: string;
    source?: string;
    status?: string;
    title?: string;
    updatedAt?: string;
    projectId?: string;
    teamSynced?: boolean;
    workspaceId?: string;
} & JsonRecord;
type DesignSystemStaticFile = {
    bytes: Buffer;
    contentType: string;
    updatedAt: string;
} & JsonRecord;
type ProjectRecord = {
    id: string;
    name?: string;
    skillId?: string | null;
    designSystemId?: string | null;
    pendingPrompt?: string | null;
    metadata?: JsonRecord;
    createdAt?: number;
    updatedAt?: number;
} & JsonRecord;
type ProjectInsert = {
    id: string;
    name?: string | null;
    skillId?: string | null;
    designSystemId?: string | null;
    pendingPrompt?: string | null;
    metadata?: JsonRecord;
    createdAt: number;
    updatedAt: number;
};
type ProjectPatch = Partial<Omit<ProjectInsert, 'id' | 'createdAt'>> & {
    updatedAt?: number;
};
type DesignSystemListOptions = {
    idPrefix?: string;
    source?: string;
    isEditable?: boolean;
    defaultStatus?: string;
    workspaceId?: string | null;
};
type DesignSystemWorkspaceOptions = {
    workspaceId?: string | null;
    workspaceMemberId?: string | null;
    /** A verified Team binding forbids same-id Personal fallback. */
    exactTeam?: boolean;
};
export type DesignSystemAssetSyncOutcome = {
    ok: true;
    synced: string[];
} | {
    ok: false;
    reason: 'not-found' | 'no-workspace-project';
};
export declare function createDesignSystemServerServices({ getDb, roots, paths, skills, designSystems, projects, bindProjectToWorkspace, }: {
    getDb?: () => Database.Database;
    roots: {
        SKILL_ROOTS: string[];
        DESIGN_TEMPLATE_ROOTS: string[];
        ALL_SKILL_LIKE_ROOTS: string[];
    };
    paths: {
        PROJECTS_DIR: string;
        DESIGN_SYSTEMS_DIR: string;
        USER_DESIGN_SYSTEMS_DIR: string;
    };
    skills: {
        listSkills: (roots: string[], options?: {
            db?: Database.Database;
            workspaceId?: string | null;
            workspaceMemberId?: string | null;
        }) => Promise<SkillEntry[]>;
        findSkillById: (skills: SkillEntry[], id: string) => SkillEntry | undefined;
    };
    designSystems: {
        listDesignSystems: (root: string, options?: DesignSystemListOptions) => Promise<DesignSystemSummary[]>;
        readDesignSystem: (root: string, id: string, options?: Pick<DesignSystemListOptions, 'idPrefix' | 'workspaceId'>) => Promise<string | null | undefined>;
        readDesignSystemPackageInfo: (root: string, id: string, options?: Pick<DesignSystemListOptions, 'idPrefix' | 'workspaceId'>) => Promise<unknown>;
        readDesignSystemStaticFile: (root: string, id: string, filePath: string, options?: Pick<DesignSystemListOptions, 'idPrefix' | 'workspaceId'>) => Promise<DesignSystemStaticFile | null | undefined>;
        listUserDesignSystemFiles: (root: string, id: string) => Promise<Array<{
            kind?: string;
            path: string;
        }> | null | undefined>;
        readUserDesignSystemFile: (root: string, id: string, filePath: string) => Promise<{
            path: string;
            content: string;
        } | null | undefined>;
        readUserDesignSystemFileBytes: (root: string, id: string, filePath: string) => Promise<{
            path: string;
            bytes: Buffer;
        } | null | undefined>;
        linkUserDesignSystemProject: (root: string, id: string, projectId: string) => Promise<unknown>;
        syncUserDesignSystemAssetsFromFiles: (root: string, id: string, files: Array<{
            path: string;
            content: Buffer;
        }>) => Promise<{
            synced: string[];
        }>;
        LEGACY_DESIGN_SYSTEM_ARTIFACTS: Array<{
            replacementPaths: string[];
            legacyPath: string;
            removeDirectory?: boolean;
        }>;
    };
    projects: {
        getProject: (db: Database.Database, id: string) => ProjectRecord | null | undefined;
        insertProject: (db: Database.Database, project: ProjectInsert) => ProjectRecord | null | undefined;
        updateProject: (db: Database.Database, id: string, patch: ProjectPatch) => ProjectRecord | null | undefined;
        readProjectFile: (projectsDir: string, projectId: string, filePath: string, metadata?: JsonRecord) => Promise<{
            buffer: Buffer;
        }>;
        writeProjectFile: (projectsDir: string, projectId: string, filePath: string, content: Buffer, options?: JsonRecord, metadata?: JsonRecord) => Promise<unknown>;
        listFiles: (projectsDir: string, projectId: string, options?: {
            metadata?: JsonRecord;
        }) => Promise<unknown[]>;
        resolveProjectDir: (projectsDir: string, projectId: string, metadata?: JsonRecord) => string;
        isSafeId: (id: string) => boolean;
    };
    /**
     * Give the `ds-*` project that backs a design system's editing workspace a
     * `workspace_projects` home, the same as any other created project.
     *
     * It is a real, run-hosting project — the chat/run prompt-composition path
     * stands it up on demand (`server.ts`) and the system prompt has a dedicated
     * `editingOwnDraftDesignSystem` branch for chatting inside it — so an unbound
     * one is denied its first turn by `enforceWorkspaceResourceMutation` exactly
     * like any other orphan. This factory has no Express request, so the daemon's
     * ambient workspace is the only thing that can answer; the injected closure
     * keeps that resolution in `server.ts` where the provider lives. Absent in
     * tests that do not exercise the seam.
     */
    bindProjectToWorkspace?: (projectId: string, createdAt: number, designSystem: DesignSystemSummary) => void;
}): {
    ensureUserDesignSystemWorkspaceProject: (dbHandle: Database.Database, id: string, options?: DesignSystemWorkspaceOptions) => Promise<{
        project: ProjectRecord;
        files: unknown[];
    } | null>;
    isProjectUsableDesignSystem: (summary: DesignSystemSummary | null | undefined) => boolean;
    listAllDesignSystems: (options?: {
        workspaceId?: string | null;
        workspaceMemberId?: string | null;
        exactTeam?: boolean;
    }) => Promise<({
        id: string;
        title?: string;
        updatedAt?: string;
        projectId?: string;
        teamSynced?: boolean;
        workspaceId?: string;
        source: string;
        isEditable: boolean;
        status: string;
    } | DesignSystemSummary)[]>;
    listAllDesignTemplates: () => Promise<SkillEntry[]>;
    listAllSkillLikeEntries: (options?: {
        workspaceId?: string | null;
        workspaceMemberId?: string | null;
    }) => Promise<({
        id: string;
        dir?: string;
        teamSynced: boolean;
    } | SkillEntry)[]>;
    listAllSkills: (options?: {
        workspaceId?: string | null;
        workspaceMemberId?: string | null;
    }) => Promise<({
        id: string;
        dir?: string;
        teamSynced: boolean;
    } | SkillEntry)[]>;
    readAvailableDesignSystem: (id: string, options?: {
        workspaceId?: string | null;
        workspaceMemberId?: string | null;
        exactTeam?: boolean;
    }) => Promise<string | null | undefined>;
    readAvailableDesignSystemPackageInfo: (id: string, options?: {
        workspaceId?: string | null;
        workspaceMemberId?: string | null;
        exactTeam?: boolean;
    }) => Promise<unknown>;
    readAvailableDesignSystemStaticFile: (id: string, filePath: string, options?: {
        workspaceId?: string | null;
        workspaceMemberId?: string | null;
        exactTeam?: boolean;
    }) => Promise<DesignSystemStaticFile | null | undefined>;
    readDesignSystemWorkspaceTextFile: (dbHandle: Database.Database, summary: DesignSystemSummary | null | undefined, filePath: string) => Promise<string | null>;
    resolveUserDesignSystemShareDirectory: (dbHandle: Database.Database, id: string) => Promise<string>;
    syncUserDesignSystemAssetsFromWorkspace: (dbHandle: Database.Database, id: string, options?: DesignSystemWorkspaceOptions) => Promise<DesignSystemAssetSyncOutcome>;
    validateProjectDesignSystemId: (id: unknown, options?: {
        workspaceId?: string | null;
        workspaceMemberId?: string | null;
    }) => Promise<{
        ok: boolean;
        id: null;
        code?: never;
        message?: never;
    } | {
        ok: boolean;
        code: string;
        message: string;
        id?: never;
    } | {
        code?: never;
        message?: never;
        ok: boolean;
        id: string;
    }>;
    validateProjectSkillId: (id: unknown, options?: {
        workspaceId?: string | null;
    }) => Promise<{
        code?: never;
        message?: never;
        ok: boolean;
        id: null;
    } | {
        id?: never;
        ok: boolean;
        code: string;
        message: string;
    } | {
        code?: never;
        message?: never;
        ok: boolean;
        id: string;
    }>;
};
export {};
