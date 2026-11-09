import type { ChatMessage, ChatRunStatus, ChatSessionMode } from './chat.js';
import type { OrchestratorWorkspace } from './workspaces.js';
import type { ProjectContextConnectorRef, ProjectContextMcpServerRef, ProjectContextPluginRef } from './context.js';
import type { ProjectSyncIntent, ProjectSyncIntentEvent, ProjectSyncState } from './project-sync.js';
import type { TeamResourceState } from './team-resources.js';
import type { WorkspaceCollabContext } from './collab.js';
export type ProjectKind = 'prototype' | 'deck' | 'template' | 'other' | 'brand' | 'image' | 'video' | 'audio';
/**
 * `metadata.videoModel` value that marks a project as HyperFrames.
 *
 * HyperFrames is a local HTML-to-video renderer, so a HyperFrames project is
 * stored as `kind: 'video'` (the Home surface that offers it) even though the
 * artifact the user authors, edits and previews is an HTML composition. Every
 * surface that has to tell HyperFrames apart from a generative video provider
 * — analytics `project_kind`, the system prompt's media contract, the Home
 * starters, delivery validation — keys off this exact value, so it lives here
 * next to `ProjectMetadata` rather than being re-declared per consumer.
 */
export declare const HYPERFRAMES_VIDEO_MODEL = "hyperframes-html";
export type MediaAspect = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
export type ProjectPlatform = 'auto' | 'responsive' | 'web-desktop' | 'mobile-ios' | 'mobile-android' | 'tablet' | 'desktop-app';
export type AudioKind = 'music' | 'speech' | 'sfx';
export type ProjectScenarioBindingProvenance = 'automatic_default' | 'explicit_user' | 'legacy_unknown';
export type ProjectScenarioTaskProfile = 'prototype' | 'ppt' | 'marketing' | 'hyperframes' | 'motion-design';
/**
 * Daemon-owned identity for the scenario currently pinned to a project.
 *
 * The snapshot and plugin ids are deliberately stored together: provenance
 * is authoritative only while both still match the live project pin. Old
 * rows that pre-date this contract are migrated to `legacy_unknown` and never
 * acquire automatic-routing authority by inference.
 */
export interface ProjectScenarioBinding {
    schemaVersion: 1;
    provenance: ProjectScenarioBindingProvenance;
    pluginId: string;
    snapshotId: string;
    taskProfile?: ProjectScenarioTaskProfile;
    boundAt: number;
}
/**
 * Daemon-owned automatic OD Next route selected at project creation.
 *
 * Unlike `ProjectScenarioBinding`, this identity is independent of an
 * ordinary plugin snapshot. That lets the daemon admit OD Next for a run while
 * retaining the ordinary default plugin solely as an invisible fallback.
 */
export interface ProjectStrategyBinding {
    schemaVersion: 1;
    provenance: 'automatic_default';
    taskProfile: ProjectScenarioTaskProfile;
    boundAt: number;
}
/**
 * Daemon-owned identity of the official example card that seeded this project.
 *
 * An example card is a task-type entry point, not a plugin the user chose to
 * run: it keeps the automatic OD Next route and contributes its material as a
 * user-selected Skill. So this binding deliberately carries no `snapshotId`
 * and is never fed into the explicit-plugin tests — naming it must not move
 * the task onto the ordinary route.
 *
 * `pluginSource` is the exact local catalogue identity the daemon re-resolved
 * the record through, and `manifestSourceDigest` pins the bytes it read. A
 * later read that cannot reproduce both is stale and carries no authority.
 */
export interface ProjectExampleBinding {
    schemaVersion: 1;
    provenance: 'example_card';
    pluginId: string;
    pluginSource: string;
    manifestSourceDigest: string;
    boundAt: number;
}
export type ProjectDisplayStatus = 'not_started' | 'queued' | 'running' | 'awaiting_input' | 'succeeded' | 'incomplete' | 'failed' | 'canceled';
export interface ProjectStatusInfo {
    value: ProjectDisplayStatus;
    updatedAt?: number;
    runId?: string;
}
export interface PromptTemplateMetadataSource {
    repo: string;
    license: string;
    author?: string;
    url?: string;
}
export interface PromptTemplateMetadata {
    id: string;
    surface: 'image' | 'video';
    title: string;
    prompt: string;
    summary?: string;
    category?: string;
    tags?: string[];
    model?: string;
    aspect?: MediaAspect;
    source?: PromptTemplateMetadataSource;
}
/**
 * The local Workspace/member partition from which a catalogue item was picked.
 *
 * This is lookup provenance only. It does not bind the project to a Workspace,
 * prove current membership, or authorize a remote operation.
 */
export interface LocalCatalogScope {
    workspaceId: string;
    workspaceMemberId: string;
}
export interface ProjectResourceCatalogScopes {
    skill?: LocalCatalogScope;
    designSystem?: LocalCatalogScope;
}
export type DesignSystemReviewDecision = 'looks-good' | 'needs-work';
export type DesignSystemReviewTaskStatus = 'queued' | 'sent' | 'failed';
export interface DesignSystemReviewAgentTask {
    status: DesignSystemReviewTaskStatus;
    prompt: string;
    queuedAt: string;
    sentAt?: string;
    error?: string;
}
export interface DesignSystemReviewEntry {
    decision: DesignSystemReviewDecision;
    updatedAt: string;
    feedback?: string;
    files?: string[];
    agentTask?: DesignSystemReviewAgentTask;
}
export interface ProjectMetadata {
    /** Reserved admitted facts; installed only with the matching local content receipt. */
    _commentFiles?: import('./comments.js').CommentFileState;
    kind: ProjectKind;
    intent?: 'live-artifact' | 'web-clone' | 'document' | 'webgl-experience' | 'worker-visualizer' | 'marketing' | 'hyperframes' | 'motion-design';
    fidelity?: 'wireframe' | 'high-fidelity';
    speakerNotes?: boolean;
    slideCount?: string;
    animations?: boolean;
    includeLandingPage?: boolean;
    includeOsWidgets?: boolean;
    templateId?: string;
    templateLabel?: string;
    duplicatedFromPluginId?: string;
    duplicatedFromPluginEntry?: string;
    /** Primary target surface selected at project creation. */
    platform?: ProjectPlatform;
    nameSource?: 'generated' | 'prompt' | 'agent' | 'user';
    /** Concrete delivery surfaces the artifact must account for. `responsive` is a web breakpoint target, not a native app expansion. */
    platformTargets?: ProjectPlatform[];
    inspirationDesignSystemIds?: string[];
    importedFrom?: 'claude-design' | 'folder' | string;
    entryFile?: string;
    sourceFileName?: string;
    baseDir?: string;
    projectLocationId?: string;
    fromTrustedPicker?: true;
    orchestratorWorkspace?: OrchestratorWorkspace;
    userWorkingDir?: string;
    imageModel?: string;
    imageAspect?: MediaAspect;
    imageStyle?: string;
    videoModel?: string;
    videoLength?: number;
    videoAspect?: MediaAspect;
    audioKind?: AudioKind;
    audioModel?: string;
    audioDuration?: number;
    voice?: string;
    promptTemplate?: PromptTemplateMetadata;
    linkedDirs?: string[];
    skipDiscoveryBrief?: boolean;
    examplePrompt?: boolean;
    examplePromptTitle?: string;
    examplePromptBrief?: Record<string, string>;
    contextPlugins?: ProjectContextPluginRef[];
    contextMcpServers?: ProjectContextMcpServerRef[];
    contextConnectors?: ProjectContextConnectorRef[];
    /**
     * Daemon-stamped provenance for locally selected project resources. This
     * keeps the first run on the same local catalogue partition when Workspace
     * identity is still loading; it is never Workspace ownership or authority.
     */
    localCatalogScopes?: ProjectResourceCatalogScopes;
    /** Daemon-owned, exact provenance for the scenario currently pinned here. */
    scenarioBinding?: ProjectScenarioBinding;
    /** Daemon-owned automatic OD Next route, independent of plugin selection. */
    strategyBinding?: ProjectStrategyBinding;
    /** Daemon-owned identity of the official example card that seeded this project. */
    exampleBinding?: ProjectExampleBinding;
    designSystemReview?: Record<string, DesignSystemReviewEntry>;
    brandId?: string;
    brandSourceUrl?: string;
    brandDesignSystemId?: string;
    sourceProjectId?: string;
    sourceProjectName?: string;
    enrichmentStatus?: 'programmatic' | 'ai_refined';
    enrichmentCompletedAt?: number;
    sharedProjectPlaceholderAt?: number;
}
export interface Project {
    id: string;
    name: string;
    skillId: string | null;
    designSystemId: string | null;
    createdAt: number;
    updatedAt: number;
    status?: ProjectStatusInfo;
    pendingPrompt?: string;
    metadata?: ProjectMetadata;
    appliedPluginSnapshotId?: string;
    customInstructions?: string;
    /**
     * The daemon-authoritative visibility from this project's
     * `workspace_projects` row.
     *
     * This is a read projection, not project storage. It lets clients classify a
     * local project even when that resource is synchronized through a non-project
     * hub (for example, a Design System backing project). Absent means the reader
     * did not carry workspace visibility and must be treated as "no opinion".
     */
    workspaceVisibility?: ProjectVisibility;
    /**
     * The workspace this project belongs to — exactly one, per the 2026-07-21
     * ruling that 草稿 and shared projects are both bound to a workspace.
     *
     * A read model, not storage: the daemon resolves it from the project's single
     * `workspace_projects` row. Absent means the daemon has not bound the project
     * to a workspace yet (a pre-workspace project awaiting adoption on the next
     * personal-workspace read), NOT "belongs to no workspace" — so a client must
     * treat absence as "no opinion" and never hide a project on the strength of a
     * missing value.
     */
    workspaceId?: string | null;
}
export interface ProjectTemplate {
    id: string;
    name: string;
    sourceProjectId?: string;
    files: Array<{
        name: string;
        content: string;
    }>;
    description?: string;
    createdAt: number;
}
export interface ProjectBrowserWorkspaceTab {
    id: string;
    insertAfter?: string | null;
    label: string;
    title?: string;
    url?: string;
    iconUrl?: string;
}
export interface ProjectTabsState {
    tabs: string[];
    active: string | null;
    browserTabs?: ProjectBrowserWorkspaceTab[];
    hasSavedState?: boolean;
    updatedAt?: number;
}
export interface Conversation {
    id: string;
    projectId: string;
    title: string | null;
    sessionMode?: ChatSessionMode;
    messageCount?: number;
    createdAt: number;
    updatedAt: number;
    totalDurationMs?: number;
    latestRun?: {
        status: ChatRunStatus;
        startedAt?: number;
        endedAt?: number;
        durationMs?: number;
    };
}
/**
 * Exact local catalogue identity of an official example card, as claimed by
 * the client. Both fields are required: the daemon looks the record up by
 * `source` — the same lookup `/api/plugins/:id/apply-local` performs — and
 * rejects the request when the resolved record's id disagrees with `pluginId`.
 */
export interface CreateProjectExampleReference {
    pluginId: string;
    source: string;
}
export interface CreateProjectRequest {
    name: string;
    /** Optional project library location id. Omit or use `default` for .od/projects. */
    projectLocationId?: string;
    skillId?: string | null;
    /** Local lookup provenance captured when the Skill was selected. */
    skillCatalogScope?: LocalCatalogScope;
    designSystemId?: string | null;
    /** Local lookup provenance captured when the Design System was selected. */
    designSystemCatalogScope?: LocalCatalogScope;
    pendingPrompt?: string;
    metadata?: ProjectMetadata;
    pluginId?: string;
    /** Exact identity of the local catalogue record selected by the caller. */
    pluginSource?: string;
    appliedPluginSnapshotId?: string;
    pluginInputs?: Record<string, unknown>;
    /** Product-owned automatic OD Next route. The daemon validates and stamps it. */
    automaticStrategyTaskProfile?: ProjectScenarioTaskProfile;
    /**
     * The official example card the user picked under a task type.
     *
     * A claim about an identity, never content: the daemon re-resolves the
     * record through the local catalogue and reads the example's material from
     * disk. Unlike `pluginId`/`appliedPluginSnapshotId` this does not make the
     * project an explicit plugin pin, so the automatic OD Next route stays in
     * force and the example travels as a user-selected Skill instead of
     * replacing the strategy.
     */
    exampleReference?: CreateProjectExampleReference;
    /** Session mode for the default conversation seeded with the project. */
    conversationMode?: ChatSessionMode;
    /**
     * Caller-minted id for the default conversation seeded with the project.
     * Lets an optimistic client route to the conversation before the create
     * answers; omitted, the daemon mints one.
     */
    conversationId?: string;
    customInstructions?: string;
    /** Persisted to metadata.skipDiscoveryBrief for automated project runs. */
    skipDiscoveryBrief?: boolean;
}
export interface UpdateProjectRequest {
    name?: string;
    skillId?: string | null;
    designSystemId?: string | null;
    pendingPrompt?: string | null;
    metadata?: ProjectMetadata | null;
    customInstructions?: string | null;
}
export interface ProjectsResponse {
    projects: Project[];
}
export interface ProjectResponse {
    project: Project;
}
export interface RestoreProjectAutomaticScenarioRequest {
    /** Compare-and-swap guard for the project pin the caller inspected. */
    expectedCurrentSnapshotId: string | null;
}
export interface RestoreProjectAutomaticScenarioResponse extends ProjectResponse {
    scenarioBinding?: ProjectScenarioBinding;
    strategyBinding?: ProjectStrategyBinding;
    changed: boolean;
}
export type ProjectDesignTokenSuggestionProp = 'color' | 'backgroundColor' | 'borderColor' | 'fontFamily' | 'fontSize' | 'fontWeight' | 'lineHeight' | 'letterSpacing' | 'width' | 'height' | 'gap' | 'padding' | 'margin' | 'borderRadius' | 'borderWidth';
export interface ProjectDesignTokenSuggestionQuery {
    file?: string;
    targetId?: string;
    props?: ProjectDesignTokenSuggestionProp[];
    values?: Partial<Record<ProjectDesignTokenSuggestionProp, string>>;
}
export interface ProjectDesignTokenSuggestion {
    prop: ProjectDesignTokenSuggestionProp;
    token: string;
    value: string;
    sourceFile: string;
    line: number;
    matchReason: string;
    score: number;
}
export interface ProjectDesignTokenSuggestionsResponse {
    projectId: string;
    query: ProjectDesignTokenSuggestionQuery;
    suggestions: ProjectDesignTokenSuggestion[];
}
export interface ProjectDetailResponse extends ProjectResponse {
    resolvedDir: string;
}
export type ProjectVisibility = 'personal' | 'team';
/**
 * Daemon-authoritative workspace and billing scope for one persisted project.
 *
 * `visibility` answers whether the project itself is a private draft or shared
 * with the team. It is deliberately independent from `kind`: a private draft
 * may still belong to a team workspace and therefore use that workspace's
 * wallet. The tagged union prevents clients from treating every non-null
 * workspace id as a team-billing scope.
 */
export type ProjectWorkspaceScope = {
    kind: 'unbound';
    projectId: string;
    workspaceId: null;
    context: null;
} | {
    kind: 'unavailable';
    projectId: string;
    workspaceId: string;
    visibility: ProjectVisibility;
    context: null;
} | {
    kind: 'personal';
    projectId: string;
    workspaceId: string;
    visibility: ProjectVisibility;
    context: WorkspaceCollabContext & {
        workspaceType: 'personal';
    };
} | {
    kind: 'team';
    projectId: string;
    workspaceId: string;
    visibility: ProjectVisibility;
    context: WorkspaceCollabContext & {
        workspaceType: 'team';
    };
};
/** GET /api/projects/:id/workspace-scope. */
export interface ProjectWorkspaceScopeResponse {
    scope: ProjectWorkspaceScope;
}
export type WorkspaceProjectRole = 'owner' | 'admin' | 'member';
export type WorkspaceProjectSyncIntentEvent = ProjectSyncIntentEvent;
export type WorkspaceProjectSyncIntent = ProjectSyncIntent;
export type ProjectDisabledReason = 'workspace_locked' | 'workspace_deleted' | 'permission_denied' | 'sync_pending' | 'resource_frozen';
export interface ProjectAccessFlags {
    canOpen: boolean;
    canRename: boolean;
    canDelete: boolean;
    canDuplicate: boolean;
    canMoveToTeam: boolean;
    canMoveToPersonal: boolean;
    canExport: boolean;
    canSendTo: boolean;
    canRestoreVersion: boolean;
    disabledReason?: ProjectDisabledReason;
}
export interface WorkspaceProjectSummary {
    id: string;
    name: string;
    workspaceId: string;
    visibility: ProjectVisibility;
    resourceState: TeamResourceState;
    createdByWorkspaceMemberId: string | null;
    updatedByWorkspaceMemberId?: string | null;
    /**
     * E resource-hub mapping seam. When present, this is Spec E's
     * ResourceRecord.id for a `kind: 'project'` cloud resource. Personal projects
     * are local-only and normally keep this null; team-visible projects receive
     * the cloud resource through C's orchestration of E's upload/version/mirror
     * mechanism.
     */
    resourceHubResourceId?: string | null;
    /** Set when a previously shared cloud resource should be tombstoned. */
    cloudTombstonedAt?: number | null;
    currentUserAccess: ProjectAccessFlags;
    syncState?: ProjectSyncState;
    pendingSyncIntent?: WorkspaceProjectSyncIntent;
    createdAt: number;
    updatedAt: number;
    metadata?: ProjectMetadata;
    project: Project;
}
export interface WorkspaceProjectsResponse {
    projects: WorkspaceProjectSummary[];
}
export interface MoveWorkspaceProjectRequest {
    visibility: ProjectVisibility;
}
export interface BatchDeleteWorkspaceProjectsRequest {
    projectIds: string[];
}
export interface BatchMoveWorkspaceProjectsRequest {
    projectIds: string[];
    visibility: ProjectVisibility;
}
export interface CreateProjectResponse extends ProjectResponse {
    conversationId?: string;
    appliedPluginSnapshotId?: string;
}
export interface CreateDesignSystemProjectFromProjectRequest {
    name?: string;
    pendingPrompt?: string;
}
export interface CreateDesignSystemProjectFromProjectResponse extends ProjectResponse {
    conversationId: string;
    designSystemId: string;
    copiedFiles: string[];
}
export interface DuplicateProjectRequest {
    name?: string;
}
export interface DuplicateProjectResponse extends ProjectResponse {
    conversationId: string;
    copiedFiles: string[];
}
export interface ProjectLocation {
    id: string;
    name: string;
    path: string;
    builtIn?: boolean;
}
export interface ProjectLocationsResponse {
    locations: ProjectLocation[];
    removedProjectIds?: string[];
}
export interface UpdateProjectLocationsRequest {
    locations: Array<{
        id?: string;
        name?: string;
        path: string;
    }>;
}
export interface ProjectManifest {
    schemaVersion: 1;
    id: string;
    name: string;
    createdAt: number;
    updatedAt: number;
    skillId?: string | null;
    designSystemId?: string | null;
}
export interface ScanProjectLocationsResponse {
    scanned: number;
    imported: Project[];
    existing: string[];
    skipped: Array<{
        path: string;
        reason: string;
    }>;
}
export interface ImportFolderRequest {
    baseDir: string;
    name?: string;
    skillId?: string | null;
    designSystemId?: string | null;
    orchestratorWorkspace?: OrchestratorWorkspace;
}
export interface ImportFolderResponse {
    project: Project;
    conversationId: string;
    entryFile: string | null;
}
export interface ReplaceProjectWorkingDirRequest {
    baseDir: string;
    orchestratorWorkspace?: OrchestratorWorkspace;
}
export interface ReplaceProjectWorkingDirResponse {
    project: Project;
    baseDir: string;
    entryFile: string | null;
}
export interface ConversationsResponse {
    conversations: Conversation[];
}
export interface ConversationResponse {
    conversation: Conversation;
}
export interface CreateConversationRequest {
    title?: string | null;
    sessionMode?: ChatSessionMode;
    /**
     * Seed the new conversation with another conversation's context by copying
     * its messages. The source must belong to the same project; a missing or
     * foreign id is ignored and an empty conversation is created. Powers the
     * "Side Chat" launcher, which forks the current chat's context into a new
     * conversation.
     */
    seedFromConversationId?: string | null;
    /**
     * When paired with `seedFromConversationId`, copy only source messages up to
     * and including this message. Used by the chat "Fork" action so the new
     * conversation resumes from a specific assistant turn instead of inheriting
     * future follow-ups from the source conversation.
     */
    forkAfterMessageId?: string | null;
    /**
     * One compact client-side message used only when `forkAfterMessageId` is not
     * present in the source conversation's persisted history. The daemon appends
     * it to the persisted prefix, which preserves an errored/unpersisted final
     * assistant turn without making normal forks upload the entire transcript.
     */
    forkFallbackMessage?: ChatMessage;
    /**
     * The persisted message immediately before `forkFallbackMessage`, or null
     * when the fallback is the first message. The daemon cuts persisted history
     * at this boundary before appending the fallback, so later turns cannot leak
     * into a fork from an older unpersisted assistant message.
     */
    forkFallbackPredecessorMessageId?: string | null;
    /**
     * Client-supplied snapshot of the messages to seed the fork with, in order,
     * up to and including the fork point. When present, the daemon copies these
     * instead of reading the source conversation from the database by id. This
     * makes "Fork" resilient to a fork point that was never persisted — e.g. an
     * assistant turn whose run errored or had its connection reset before the
     * message reached the database. Without it, such a fork would 404 on
     * `forkAfterMessageId` and silently fail. When absent, the daemon falls back
     * to copying from `seedFromConversationId` (the original Side Chat path).
     *
     * @deprecated Retained for older clients. New clients should first fork from
     * persisted history and use `forkFallbackMessage` only after a missing fork
     * point response.
     */
    seedMessages?: ChatMessage[];
}
export interface UpdateConversationRequest {
    title?: string | null;
    sessionMode?: ChatSessionMode;
}
export interface MessagesResponse {
    messages: ChatMessage[];
}
export type DeployProviderId = 'vercel-self' | 'cloudflare-pages';
export type DeploymentStatus = 'deploying' | 'preparing-link' | 'ready' | 'link-delayed' | 'protected' | 'failed';
export interface CloudflarePagesConfigHints {
    lastZoneId?: string;
    lastZoneName?: string;
    lastDomainPrefix?: string;
}
export interface CloudflarePagesZoneInfo {
    id: string;
    name: string;
    status?: string;
    type?: string;
}
export interface CloudflarePagesZonesResponse {
    zones: CloudflarePagesZoneInfo[];
    cloudflarePages?: CloudflarePagesConfigHints;
}
export interface CloudflarePagesDeploySelection {
    zoneId: string;
    zoneName: string;
    domainPrefix: string;
}
export type DeploymentLinkStatus = 'ready' | 'link-delayed' | 'protected' | 'failed';
export interface DeploymentLinkInfo {
    url: string;
    status: DeploymentLinkStatus;
    statusMessage?: string;
    reachableAt?: number;
}
export type CloudflarePagesDnsStatus = 'skipped' | 'created' | 'reused' | 'unmarked' | 'patched' | 'conflict' | 'failed';
export type CloudflarePagesDomainStatus = 'skipped' | 'pending' | 'active' | 'conflict' | 'failed';
export type CloudflarePagesCustomDomainStatus = 'pending' | 'ready' | 'conflict' | 'failed';
export type CloudflarePagesDnsOwnership = 'marked' | 'unmarked' | 'external';
export interface CloudflarePagesCustomDomainInfo {
    hostname: string;
    url: string;
    zoneId: string;
    zoneName: string;
    domainPrefix: string;
    status: CloudflarePagesCustomDomainStatus;
    statusMessage?: string;
    errorCode?: string;
    errorMessage?: string;
    dnsStatus?: CloudflarePagesDnsStatus;
    dnsRecordId?: string;
    dnsOwnership?: CloudflarePagesDnsOwnership;
    domainStatus?: CloudflarePagesDomainStatus;
    pagesDomainStatus?: string;
    validationData?: unknown;
    verificationData?: unknown;
}
export interface CloudflarePagesDeploymentInfo {
    projectName: string;
    pagesDev: DeploymentLinkInfo;
    customDomain?: CloudflarePagesCustomDomainInfo;
}
export interface DeployConfigResponse {
    providerId: DeployProviderId;
    configured: boolean;
    tokenMask: string;
    teamId: string;
    teamSlug: string;
    accountId?: string;
    projectName?: string;
    cloudflarePages?: CloudflarePagesConfigHints;
    target: 'preview' | 'production';
}
export interface UpdateDeployConfigRequest {
    providerId?: DeployProviderId;
    token?: string;
    teamId?: string;
    teamSlug?: string;
    accountId?: string;
    projectName?: string;
    cloudflarePages?: CloudflarePagesConfigHints;
}
export interface DeploymentInfo {
    id: string;
    projectId: string;
    fileName: string;
    providerId: DeployProviderId;
    url: string;
    deploymentId?: string;
    deploymentCount: number;
    target: 'preview' | 'production';
    status: DeploymentStatus;
    statusMessage?: string;
    reachableAt?: number;
    cloudflarePages?: CloudflarePagesDeploymentInfo;
    createdAt: number;
    updatedAt: number;
}
export interface ProjectDeploymentsResponse {
    deployments: DeploymentInfo[];
}
export interface DeployProjectFileRequest {
    fileName: string;
    providerId?: DeployProviderId;
    cloudflarePages?: CloudflarePagesDeploySelection;
    target?: 'preview' | 'production';
}
export interface DeployProjectFileResponse extends DeploymentInfo {
}
export interface CheckDeploymentLinkResponse extends DeploymentInfo {
}
export type DeployPreflightWarningCode = 'broken-reference' | 'invalid-reference' | 'large-asset' | 'large-bundle' | 'large-html' | 'external-script' | 'external-stylesheet' | 'no-doctype' | 'no-viewport'
/** The entry would collide with the project's root index.html; deploy is refused with ENTRY_INDEX_CONFLICT. */
 | 'entry-index-conflict';
export interface DeployPreflightWarning {
    code: DeployPreflightWarningCode;
    message: string;
    path?: string;
    url?: string;
    size?: number;
}
export interface DeployPreflightFile {
    path: string;
    size: number;
    mime: string;
    sourcePath: string;
}
export interface DeployPreflightRequest {
    fileName: string;
    providerId?: DeployProviderId;
}
export interface DeployPreflightResponse {
    providerId: DeployProviderId;
    entry: string;
    files: DeployPreflightFile[];
    totalFiles: number;
    totalBytes: number;
    warnings: DeployPreflightWarning[];
}
//# sourceMappingURL=projects.d.ts.map