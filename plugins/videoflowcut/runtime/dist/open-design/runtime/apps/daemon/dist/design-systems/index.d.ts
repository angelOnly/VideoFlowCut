import type Database from 'better-sqlite3';
type SqliteDb = Database.Database;
export type DesignSystemSurface = 'web' | 'image' | 'video' | 'audio';
export type DesignSystemSource = 'built-in' | 'installed' | 'user';
export type DesignSystemStatus = 'draft' | 'published';
export type DesignSystemRevisionStatus = 'pending' | 'accepted' | 'rejected';
export type DesignSystemArtifactMode = 'generated' | 'agent-managed';
export type DesignSystemSummary = {
    id: string;
    title: string;
    category: string;
    summary: string;
    swatches: string[];
    surface: DesignSystemSurface;
    body: string;
    source: DesignSystemSource;
    status: DesignSystemStatus;
    isEditable: boolean;
    createdAt?: string;
    updatedAt?: string;
    provenance?: DesignSystemProvenance;
    projectId?: string;
    teamSynced?: boolean;
    /**
     * The workspace this user design system belongs to, when one claimed it.
     *
     * Absent means UNCLAIMED, not "belongs to no workspace" — see
     * `DesignSystemListOptions.workspaceId`.
     */
    workspaceId?: string;
};
export type DesignSystemFileKind = 'folder' | 'page' | 'stylesheet' | 'document' | 'image' | 'data' | 'asset';
export type DesignSystemFileSummary = {
    path: string;
    name: string;
    kind: DesignSystemFileKind;
    size?: number;
    updatedAt?: string;
};
export type DesignSystemFileDetail = DesignSystemFileSummary & {
    content: string;
};
export type DesignSystemPullFileDetail = {
    path: string;
    name: string;
    kind: DesignSystemFileKind;
    size: number;
    updatedAt: string;
    encoding: 'utf8' | 'base64';
    content: string;
};
export type DesignSystemStaticFileDetail = {
    path: string;
    name: string;
    kind: DesignSystemFileKind;
    size: number;
    updatedAt: string;
    contentType: string;
    bytes: Buffer;
};
export type DesignSystemPackageInfo = {
    manifest?: DesignSystemProjectManifest;
    availableFiles?: string[];
    sourceEvidence?: {
        scannedFileCount?: number;
        tokenCount?: number;
        snippetCount?: number;
        confidence?: Record<string, string | number>;
        evidenceExcerpt?: string;
        tokenContract?: {
            contract?: string;
            grade?: 'excellent' | 'usable' | 'needs-review' | 'needs-rebuild';
            score?: number;
            recommendRebuild?: boolean;
            sourceBackedA1?: number;
            requiredA1?: number;
            fallbackTokens?: number;
            selfCheckOk?: boolean;
        };
    };
};
export type DesignSystemRevision = {
    id: string;
    designSystemId: string;
    status: DesignSystemRevisionStatus;
    feedback: string;
    baseBody: string;
    proposedBody: string;
    createdAt: string;
    updatedAt: string;
    sectionTitle?: string;
    jobId?: string;
    fileChanges?: DesignSystemRevisionFileChange[];
};
export type DesignSystemRevisionFileChange = {
    path: string;
    baseContent: string;
    proposedContent: string;
};
type DesignSystemProjectManifest = {
    schemaVersion: 'od-design-system-project/v1';
    id: string;
    name: string;
    category: string;
    description?: string;
    files: {
        design: 'DESIGN.md';
        tokens: 'tokens.css';
        designTokens?: 'design-tokens.json';
        tailwind?: 'tailwind-v4.css';
        components?: 'components.html';
    };
    assetsDir?: 'assets';
    previewDir?: 'preview';
    usage?: string;
    componentsManifest?: string;
    fonts?: Array<{
        family: string;
        file: string;
        weight?: number | string;
        style?: string;
    }>;
    preview?: {
        dir: string;
        pages: Array<{
            path: string;
            role?: string;
            title?: string;
        }>;
    };
    sourceFiles?: {
        scanned?: string;
        evidence?: string;
        tokens?: string;
        report?: string;
        snippets?: string;
    };
    importMode?: 'normalized' | 'hybrid' | 'verbatim';
    craft?: {
        applies?: string[];
        suggested?: string[];
        exemptions?: string[];
    };
};
export type DesignSystemProvenance = {
    companyBlurb?: string;
    sourceUrls?: string[];
    githubUrls?: string[];
    localCodeFiles?: string[];
    figFiles?: string[];
    assetFiles?: string[];
    notes?: string;
    sourceNotes?: string;
};
export declare const LEGACY_DESIGN_SYSTEM_ARTIFACTS: readonly [{
    readonly legacyPath: 'preview/colors-ui-palette.html';
    readonly replacementPaths: readonly ['preview/colors-primary.html'];
}, {
    readonly legacyPath: 'preview/colors-node-types.html';
    readonly replacementPaths: readonly ['preview/colors-theme-light.html', 'preview/colors-theme-dark.html'];
}, {
    readonly legacyPath: 'preview/typography-scale.html';
    readonly replacementPaths: readonly ['preview/typography-specimens.html'];
}, {
    readonly legacyPath: 'preview/spacing-system.html';
    readonly replacementPaths: readonly ['preview/spacing-tokens.html', 'preview/spacing-radius.html', 'preview/spacing-shadows.html'];
}, {
    readonly legacyPath: 'preview/logo-variants.html';
    readonly replacementPaths: readonly ['preview/brand-assets.html'];
}, {
    readonly legacyPath: 'ui_kits/generated_interface';
    readonly replacementPaths: readonly ['ui_kits/app/index.html'];
    readonly removeDirectory: true;
}];
export type UserDesignSystemInput = {
    title?: string;
    summary?: string;
    category?: string;
    surface?: DesignSystemSurface;
    status?: DesignSystemStatus;
    artifactMode?: DesignSystemArtifactMode;
    body?: string;
    sourceNotes?: string;
    provenance?: DesignSystemProvenance;
    /**
     * Workspace to claim the new system for (#145). Set by the daemon from the
     * active workspace selection at creation time; omitted leaves the system
     * unclaimed for local/unscoped use and quarantined from scoped catalogs.
     *
     * Only `createUserDesignSystem` reads it — an update must never re-home an
     * existing system just because the caller happened to be elsewhere.
     */
    workspaceId?: string;
    /** Internal write-fence: logical ids already claimed in workspace_resources. */
    reservedResourceIds?: Iterable<string>;
};
export type UserDesignSystemRevisionInput = {
    feedback: string;
    baseBody: string;
    proposedBody: string;
    sectionTitle?: string;
    jobId?: string;
    fileChanges?: DesignSystemRevisionFileChange[];
};
export type DesignSystemListOptions = {
    idPrefix?: string;
    source?: DesignSystemSource;
    isEditable?: boolean;
    defaultStatus?: DesignSystemStatus;
    /**
     * Restrict the listing to design systems visible from this workspace (#145).
     *
     * User design systems all live in ONE flat directory under the daemon data
     * root — there is no per-workspace store — so without this filter a system
     * authored in workspace A also showed up in a brand-new workspace B.
     *
     * A positive scope is fail-closed: both systems claimed by another workspace
     * and UNCLAIMED systems (no `workspaceId` in metadata) are hidden. Historical
     * ownerless systems remain on disk and visible to truly unscoped/local
     * callers; startup migration claims only those whose project has one exact
     * persisted workspace binding.
     *
     * Omitted means a truly unscoped internal lookup and lists everything.
     * Explicitly empty (`null`/`''`) is the signed-out/local catalog lane: it
     * lists only ownerless local systems and hides every claimed system.
     */
    workspaceId?: string | null;
};
export declare function listDesignSystems(root: string, options?: DesignSystemListOptions): Promise<DesignSystemSummary[]>;
export declare function readDesignSystem(root: string, id: string, options?: {
    idPrefix?: string;
    workspaceId?: string | null;
}): Promise<string | null>;
export declare function readDesignSystemPackageInfo(root: string, id: string, options?: {
    idPrefix?: string;
    workspaceId?: string | null;
}): Promise<DesignSystemPackageInfo | null>;
/**
 * Structured (compiled) form of a brand's design system. Optional sibling
 * files alongside DESIGN.md that, when present, give agents a
 * machine-readable token contract and a worked fixture instead of having
 * to re-derive both from prose. Both fields are individually optional —
 * the daemon falls back to the DESIGN.md-only path when neither is
 * available, which is the current state for the ~138 brands without
 * hand-authored or derived tokens.
 *
 * - `tokensCss`     — verbatim content of `<brand>/tokens.css`.
 * - `usageMd`       — optional agent-facing router for the package.
 * - `fixtureHtml`   — verbatim content of `<brand>/components.html`.
 * - `componentsManifest` — concise summary derived from components.html
 *                          or read from components.manifest.json cache
 *                          for prompt injection; when absent, callers
 *                          can fall back to `fixtureHtml`.
 * - `pullIndex`     — short manifest-derived file index. It lists
 *                     richer preview/source evidence paths without
 *                     loading those files into the push prompt.
 */
export type DesignSystemAssets = {
    usageMd?: string | undefined;
    tokensCss?: string | undefined;
    fixtureHtml?: string | undefined;
    componentsManifest?: string | undefined;
    pullIndex?: string | undefined;
    importMode?: 'normalized' | 'hybrid' | 'verbatim' | undefined;
    craftApplies?: string[] | undefined;
    craftExemptions?: string[] | undefined;
};
export declare function clearDesignSystemAssetsCacheForTests(): void;
export declare function readDesignSystemAssets(root: string, id: string): Promise<DesignSystemAssets>;
export declare function readDesignSystemPullFile(root: string, id: string, relativePath: string): Promise<DesignSystemPullFileDetail | null>;
export declare function readDesignSystemStaticFile(root: string, id: string, relativePath: string, options?: {
    idPrefix?: string;
    workspaceId?: string | null;
}): Promise<DesignSystemStaticFileDetail | null>;
export declare function isDesignTokenChannelEnabled(env?: NodeJS.ProcessEnv): boolean;
export declare function digestDesignSystemContext(input: {
    id?: string | null;
    title?: string | null;
    body?: string | null;
    usageMd?: string | null;
    tokensCss?: string | null;
    componentsManifest?: string | null;
    fixtureHtml?: string | null;
    pullIndex?: string | null;
    importMode?: string | null;
}): string | null;
export declare function resolveDesignSystemAssets(designSystemId: string, builtInRoot: string, userInstalledRoot: string, env?: NodeJS.ProcessEnv): Promise<DesignSystemAssets>;
export declare function createUserDesignSystem(root: string, input: UserDesignSystemInput): Promise<DesignSystemSummary>;
export declare function updateUserDesignSystem(root: string, id: string, input: UserDesignSystemInput): Promise<DesignSystemSummary | null>;
export declare function workspaceRenameDesignSystemId(project: {
    designSystemId?: string | null;
    metadata?: unknown;
}): string | null;
export type WorkspaceRenamePropagation = 'not-applicable' | 'propagated' | 'failed';
/**
 * A Team design-system workspace project edits the workspace-scoped
 * materialization, never a same-id Personal canonical entry. The persisted
 * project binding is the scope authority; shell/current Workspace state is
 * deliberately irrelevant.
 */
export declare function resolveWorkspaceProjectDesignSystemRoot(canonicalRoot: string, binding: {
    workspaceId?: unknown;
    visibility?: unknown;
} | null | undefined): string;
export declare function propagateWorkspaceProjectRename(root: string, project: {
    designSystemId?: string | null;
    metadata?: unknown;
}, name: unknown): Promise<WorkspaceRenamePropagation>;
export declare function linkUserDesignSystemProject(root: string, id: string, projectId: string): Promise<DesignSystemSummary | null>;
export declare function createUserDesignSystemRevision(root: string, id: string, input: UserDesignSystemRevisionInput): Promise<DesignSystemRevision | null>;
export declare function listUserDesignSystemRevisions(root: string, id: string): Promise<DesignSystemRevision[] | null>;
export declare function readUserDesignSystemRevision(root: string, id: string, revisionId: string): Promise<DesignSystemRevision | null>;
export declare function updateUserDesignSystemRevisionStatus(root: string, id: string, revisionId: string, status: Extract<DesignSystemRevisionStatus, 'accepted' | 'rejected'>): Promise<DesignSystemRevision | null>;
export declare function deleteUserDesignSystem(root: string, id: string): Promise<boolean>;
/**
 * Whether `id` was materialized locally from a teammate's team share, rather
 * than authored by the current caller. Mirrors the `teamSynced` flag
 * `markTeamSynced` (server.ts `syncSharedTeamDesignSystem`) writes once a
 * shared design system is pulled onto disk — false/absent for anything the
 * caller authored themselves, including a system the caller has *shared* to
 * the team (the sharer's own copy never gets this flag). Routes that mutate
 * a `user:` design system (edit / publish toggle / delete) must treat a
 * `true` result as "not necessarily mine" and check the caller's team-share
 * management permission before proceeding (see `canManageSharedResource` in
 * `collab/team-resource-share.ts`) — recvqb6mfyqXLD.
 */
export declare function isTeamSyncedUserDesignSystem(root: string, id: string): Promise<boolean>;
/**
 * One-time startup backfill (spec 9.2): design systems predate the generic
 * `workspace_resources` envelope table entirely — `createWorkspaceOwnedDesignSystem`
 * and `markTeamSynced` (server.ts) only started double-writing into it today,
 * so every system claimed BEFORE that shipped has a `workspaceId` in its
 * `metadata.json` but no corresponding row in the table. Left alone, that
 * system stays permanently invisible to anything that reads the generic table
 * (mirrors what `collapseWorkspaceProjectHomes` heals for project, applied to
 * a filesystem-backed resource instead of a DB-only one). Older systems that
 * lack `workspaceId` may be recovered only when their `projectId` maps to
 * exactly one persisted project binding. The current/active workspace is never
 * consulted; an absent or ambiguous binding leaves the resource quarantined.
 *
 * Idempotent by construction: a directory whose exact Personal or
 * Workspace-qualified Team binding already exists is skipped, so re-running
 * this on every daemon start costs one readdir plus a lookup per system and
 * never writes a duplicate. Legacy raw Team rows are retained; the qualified
 * binding is added alongside them so no historical data is deleted.
 *
 * `visibility` mirrors the claim `markTeamSynced` writes going forward —
 * `teamSynced: true` backfills as `'team'`, everything else as `'personal'`.
 * For a project-inferred claim, metadata.json is updated with that durable
 * workspace witness before the envelope row is created. Other metadata is
 * preserved. Unresolvable ownerless resources are never deleted or rewritten.
 */
export declare function backfillDesignSystemWorkspaceResources(db: SqliteDb, root: string): Promise<number>;
export declare function listUserDesignSystemFiles(root: string, id: string): Promise<DesignSystemFileSummary[] | null>;
export declare function readUserDesignSystemFile(root: string, id: string, relativePath: string): Promise<DesignSystemFileDetail | null>;
export declare function readUserDesignSystemFileBytes(root: string, id: string, relativePath: string): Promise<{
    path: string;
    name: string;
    kind: DesignSystemFileKind;
    size: number;
    updatedAt: string;
    bytes: NonSharedBuffer;
} | null>;
export declare function buildUserDesignSystemArchive(root: string, id: string): Promise<{
    buffer: Buffer;
    baseName: string;
    title: string;
} | null>;
export declare function buildDesignSystemSkillsMarkdown(input: {
    title: string;
    summary: string;
    category: string;
    surface: DesignSystemSurface;
    palette: GeneratedPalette;
    provenance?: DesignSystemProvenance;
}): string;
export type DesignSystemAssetSourceFile = {
    /** POSIX-relative path under the design-system root, e.g. "assets/logo.svg". */
    path: string;
    content: Buffer;
};
export type DesignSystemAssetSyncResult = {
    /** POSIX-relative paths that were actually written to the canonical dir. */
    synced: string[];
};
/**
 * Copies real asset bytes into a user design system's canonical `assets/`
 * directory — the fix for the logo/asset desync (spec 04 §9.3,
 * recvqb1t4FrckM): canonical is the only directory `team-resource-share`
 * packages and downloads read from, but agent-produced assets only ever
 * landed in the workspace-project editing mirror, so a regenerated logo
 * never reached what got shared or downloaded.
 *
 * Every write here is caller-supplied bytes, never generator output, so it
 * must survive the next `writeGeneratedDesignSystemFiles` call rather than
 * being silently regenerated back to a placeholder. Two things make it
 * stick, both applied here:
 *  1. Any `.od-generated.json` fingerprint entry for an overwritten path is
 *     dropped. `filterGeneratedWritesPreservingUserEdits` treats a path with
 *     no recorded fingerprint exactly like a hand-edited file — preserved,
 *     never refreshed.
 *  2. `artifactMode` flips to `'agent-managed'` the first time any file
 *     actually syncs, so `createUserDesignSystem`/`updateUserDesignSystem`
 *     skip `writeGeneratedDesignSystemFiles` entirely on every future write
 *     (the "fingerprint protection was spinning with nothing to protect"
 *     root cause the investigation identified).
 *
 * Only the public brand manifest and paths under `assets/` are accepted.
 * Project metadata and other arbitrary canonical files are never copied.
 */
export declare function syncUserDesignSystemAssetsFromFiles(root: string, id: string, files: DesignSystemAssetSourceFile[]): Promise<DesignSystemAssetSyncResult>;
export declare function stripPrefixAndValidateId(id: string, prefix?: string): string | null;
export declare function writeUserDesignSystemWorkspaceClaim(root: string, id: string, workspaceId: string): Promise<void>;
type GeneratedPalette = {
    background: string;
    border: string;
    foreground: string;
    accent: string;
    muted: string;
    success: string;
};
export {};
