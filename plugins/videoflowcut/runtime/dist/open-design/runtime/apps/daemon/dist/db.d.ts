import Database from 'better-sqlite3';
import type { CollabCloudComment, OdNextDevicePlatformV1, PreviewComment, ProjectBrowserWorkspaceTab, ProjectTabsState } from '@open-design/contracts';
import type { ChatArtifactRef } from './chat-artifacts/types.js';
type SqliteDb = Database.Database;
type DbRow = Record<string, any>;
type ChatSessionMode = 'design' | 'chat' | 'plan';
export declare function openDatabase(projectRoot: string, { dataDir }?: {
    dataDir?: string;
}): SqliteDb;
export declare function closeDatabase(): void;
export declare function listDeployments(db: SqliteDb, projectId: string): {
    id: any;
    projectId: any;
    fileName: any;
    providerId: any;
    url: any;
    deploymentId: any;
    deploymentCount: number;
    target: string;
    status: any;
    statusMessage: any;
    reachableAt: number | undefined;
    cloudflarePages: any;
    providerMetadata: any;
    createdAt: number;
    updatedAt: number;
}[];
export declare function getDeployment(db: SqliteDb, projectId: string, fileName: string, providerId: string): {
    id: any;
    projectId: any;
    fileName: any;
    providerId: any;
    url: any;
    deploymentId: any;
    deploymentCount: number;
    target: string;
    status: any;
    statusMessage: any;
    reachableAt: number | undefined;
    cloudflarePages: any;
    providerMetadata: any;
    createdAt: number;
    updatedAt: number;
} | null;
export declare function getDeploymentById(db: SqliteDb, projectId: string, id: string): {
    id: any;
    projectId: any;
    fileName: any;
    providerId: any;
    url: any;
    deploymentId: any;
    deploymentCount: number;
    target: string;
    status: any;
    statusMessage: any;
    reachableAt: number | undefined;
    cloudflarePages: any;
    providerMetadata: any;
    createdAt: number;
    updatedAt: number;
} | null;
export declare function upsertDeployment(db: SqliteDb, deployment: DbRow): {
    id: any;
    projectId: any;
    fileName: any;
    providerId: any;
    url: any;
    deploymentId: any;
    deploymentCount: number;
    target: string;
    status: any;
    statusMessage: any;
    reachableAt: number | undefined;
    cloudflarePages: any;
    providerMetadata: any;
    createdAt: number;
    updatedAt: number;
} | null;
export declare function listProjects(db: SqliteDb): {
    id: any;
    name: any;
    skillId: any;
    designSystemId: any;
    pendingPrompt: any;
    metadata: any;
    appliedPluginSnapshotId: any;
    customInstructions: any;
    createdAt: number;
    updatedAt: number;
}[];
/**
 * Every project with NO `workspace_projects` binding row at all — the "no
 * scope" catalog `GET /api/projects` must actually serve (spec 04 §10.2#1).
 * `listProjects` above stays the unfiltered form other internal callers
 * (library-sync's inventory scan, `listProjectIds` for the design-run
 * cross-reference) legitimately still want; this is the ONE new consumer that
 * needs the join. A project bound to ANY workspace — personal or team — is
 * someone's claimed resource and must not leak into a headerless read.
 */
export declare function listUnboundProjects(db: SqliteDb): {
    id: any;
    name: any;
    skillId: any;
    designSystemId: any;
    pendingPrompt: any;
    metadata: any;
    appliedPluginSnapshotId: any;
    customInstructions: any;
    createdAt: number;
    updatedAt: number;
}[];
export declare function getWorkspaceProject(db: SqliteDb, workspaceId: string, projectId: string): DbRow | undefined;
export declare function listWorkspaceProjects(db: SqliteDb, workspaceId: string): DbRow[];
/**
 * Every project's workspace, as one map. The bulk form of
 * {@link getWorkspaceProjectByProjectId}, for list endpoints that would
 * otherwise issue one lookup per project on a hot path.
 */
export declare function listWorkspaceProjectBindings(db: SqliteDb): Map<string, string>;
export declare function listTeamWorkspaceProjectShares(db: SqliteDb): DbRow[];
/**
 * Durable metadata-only catalog repair marker. This is intentionally separate
 * from `sync_state`: a failed rename upsert does not mean the project's
 * published content failed to sync.
 */
export declare function setWorkspaceProjectMetadataRefreshPending(db: SqliteDb, workspaceId: string, projectId: string, pending: boolean): void;
/**
 * The workspace a project belongs to, looked up by project alone.
 *
 * A project has exactly one workspace (see collab/workspace-project-home.ts), so
 * this — not `getWorkspaceProject(db, workspaceId, projectId)` — is the question
 * to ask before binding a project anywhere. Asking the two-key form and getting
 * nothing back means "not in THIS workspace", which an older build mistook for
 * "not bound anywhere" and answered by writing another row.
 */
export declare function getWorkspaceProjectByProjectId(db: SqliteDb, projectId: string): DbRow | undefined;
/**
 * The `updatedAt` a writer passes when its write is SYNC, not a local person's
 * change: keep the row's existing answer instead of stamping "now".
 *
 * A project's `updated_at` answers exactly one question for the UI — when did a
 * person last change this project's conversations, files, or name? The project
 * card renders it as one relative time and the list sorts by it, folding the
 * project row and its `workspace_projects` binding together with
 * `MAX(p.updated_at, wp.updated_at)` (see `listWorkspaceProjects` below and
 * `normalizeWorkspaceProjectRow` in routes/project/index.ts). So BOTH rows have
 * to answer it, and only a local action may answer it with `Date.now()`.
 *
 * Sync writes rows without anything having changed: materializing a teammate's
 * pulled content, clearing a revocation or placeholder flag once that pull
 * lands, advancing `sync_state` after a background upload, reconciling a
 * binding against the team catalog. A writer on one of those paths must either
 * carry the ORIGIN's timestamp when it has one (as `materializePulledTeamMirror`
 * does) or pass this marker. Letting them fall through to "now" is what made a
 * member's card read 「刚刚更新」 hours after a background pull they never asked
 * for — the reported bug.
 */
export declare const SYNC_KEEPS_UPDATED_AT: '__od.sync-keeps-updated-at__';
/**
 * Bind a project to a workspace, or return the binding it already has.
 *
 * Deliberately keyed on the PROJECT, not on `(workspace, project)`: a project
 * already bound elsewhere is returned as-is rather than bound a second time.
 * That is what makes the caller's "ensure" idempotent across workspaces instead
 * of one back-fill per workspace visited — and it is also what the narrowed
 * primary key now enforces, so an accidental second insert throws instead of
 * silently duplicating.
 *
 * A fresh binding's `updated_at` falls back to the PROJECT's own `updated_at`,
 * not to now: the project list reports `MAX(p.updated_at, wp.updated_at)` as one
 * "last changed" time, so a binding written while syncing an old project must
 * not claim the project just changed (see {@link SYNC_KEEPS_UPDATED_AT}). A
 * caller that genuinely means "now" — a brand-new project — gets the same answer
 * either way, because its project row was stamped now a moment ago.
 */
export declare function ensureWorkspaceProject(db: SqliteDb, input: DbRow): DbRow | undefined;
export declare function updateWorkspaceProject(db: SqliteDb, workspaceId: string, projectId: string, patch: DbRow): DbRow | null | undefined;
/**
 * Update a project's `workspace_projects` row by project alone, reassigning
 * `workspace_id` to whatever the caller passes — the one case where the row's
 * CURRENT workspace is allowed to differ from the workspace this event is
 * asserting.
 *
 * `updateWorkspaceProject` requires the caller to already know the row's
 * current `workspace_id` (its lookup and its `WHERE` both key on it), which is
 * right for callers acting on a row they just read. It is wrong for a remote
 * team-share notification: the local row can predate the share (a personal
 * draft the user made before ever joining the team it just got shared into),
 * so it sits under an unrelated, stale `workspace_id`. Asking
 * `updateWorkspaceProject(db, newWorkspaceId, ...)` in that case finds nothing
 * — same shape of mistake `getWorkspaceProjectByProjectId`'s own doc comment
 * warns about — and the row is silently never migrated: visibility and
 * sync_state stay frozen at whatever they were, so the project never starts
 * pulling the sharer's updates.
 */
export declare function rebindWorkspaceProject(db: SqliteDb, projectId: string, patch: DbRow): DbRow | null | undefined;
export declare function deleteWorkspaceProject(db: SqliteDb, workspaceId: string, projectId: string): void;
/**
 * The workspace a project's TEAM projection lives in — the project's pinned
 * scope for hub-facing calls (presence, comments). A project shared to (or
 * pulled from) a team has exactly one team-visibility row; personal drafts
 * have none and resolve to null so callers fall back to the local selection.
 */
export declare function findTeamWorkspaceIdForProject(db: SqliteDb, projectId: string): string | null;
export declare function countWorkspaceProjectRefs(db: SqliteDb, projectId: string): number;
/**
 * The generic counterpart of {@link getWorkspaceProject}, parameterized by
 * `resourceType` ('plugin' | 'skill' | 'design_system' — 'project' itself
 * stays on the dedicated `workspace_projects` table above). Returns null when
 * the resource is unbound OR bound to a DIFFERENT workspace than the one
 * asked about — same "wrong workspace reads as absent" contract as
 * `getWorkspaceProject`.
 */
export declare function getWorkspaceResource(db: SqliteDb, resourceType: string, workspaceId: string, resourceId: string): DbRow | undefined;
/**
 * The workspace a resource belongs to, looked up by resource alone (mirrors
 * {@link getWorkspaceProjectByProjectId}). Because `(resource_type,
 * resource_id)` is the table's primary key, a resource can only ever have
 * ONE binding row — this is the question to ask before binding a resource
 * anywhere, not the two-key form above.
 */
export declare function getWorkspaceResourceByResourceId(db: SqliteDb, resourceType: string, resourceId: string): DbRow | undefined;
export declare function listWorkspaceResources(db: SqliteDb, resourceType: string, workspaceId: string): DbRow[];
/** Workspace ids that still own a live Team resource binding.
 *
 * Background reconciliation uses this persisted witness after restarts. It
 * deliberately returns ids only; callers must resolve each id against the
 * current authoritative Workspace directory before touching the resource hub.
 */
export declare function listTeamWorkspaceResourceWorkspaceIds(db: SqliteDb): string[];
/**
 * Bind a resource to a workspace, or return the binding it already has.
 *
 * Deliberately keyed on `(resourceType, resourceId)`, not on `(workspace,
 * resource)` — see {@link ensureWorkspaceProject}'s doc comment for why: a
 * resource already bound elsewhere is returned as-is rather than bound a
 * second time, which is what makes this idempotent across workspaces and
 * what the `(resource_type, resource_id)` primary key enforces physically.
 */
export declare function ensureWorkspaceResource(db: SqliteDb, resourceType: string, workspaceId: string, resourceId: string, input?: DbRow): DbRow | undefined;
export declare function updateWorkspaceResource(db: SqliteDb, resourceType: string, workspaceId: string, resourceId: string, patch: DbRow): DbRow | null | undefined;
export declare function deleteWorkspaceResource(db: SqliteDb, resourceType: string, workspaceId: string, resourceId: string): void;
/**
 * Delete a resource's binding row regardless of which workspace it is
 * currently bound to. Callers that delete the resource's underlying record
 * (e.g. plugin uninstall) MUST call this — there is no ON DELETE CASCADE for
 * this table (see the table's doc comment in `migrate()`), so skipping this
 * leaves an orphan `workspace_resources` row pointing at nothing.
 */
export declare function deleteWorkspaceResourceByResourceId(db: SqliteDb, resourceType: string, resourceId: string): void;
/**
 * Each project's latest run status, for `GET /api/projects`.
 *
 * The latest run row per project is chosen in SQLite, so the listing never
 * loads any run's event log just to order rows; only a winning `succeeded` row
 * is then inspected, through {@link completenessEventsOfMessage}.
 */
export declare function listLatestProjectRunStatuses(db: SqliteDb): Map<string, DbRow>;
export declare function listLatestConversationRunStatuses(db: SqliteDb): Map<string, DbRow>;
export declare function listFirstConversationRunStatuses(db: SqliteDb): Map<string, DbRow>;
export declare function listLatestRunStatuses(db: SqliteDb): Map<string, DbRow>;
export declare function listProjectsAwaitingInput(db: SqliteDb): Set<string>;
export declare function listConversationsAwaitingInput(db: SqliteDb): Set<string>;
export declare function getProject(db: SqliteDb, id: string): {
    id: any;
    name: any;
    skillId: any;
    designSystemId: any;
    pendingPrompt: any;
    metadata: any;
    appliedPluginSnapshotId: any;
    customInstructions: any;
    createdAt: number;
    updatedAt: number;
} | null;
export declare function insertProject(db: SqliteDb, p: DbRow): {
    id: any;
    name: any;
    skillId: any;
    designSystemId: any;
    pendingPrompt: any;
    metadata: any;
    appliedPluginSnapshotId: any;
    customInstructions: any;
    createdAt: number;
    updatedAt: number;
} | null;
export declare function updateProject(db: SqliteDb, id: string, patch: DbRow): {
    id: any;
    name: any;
    skillId: any;
    designSystemId: any;
    pendingPrompt: any;
    metadata: any;
    appliedPluginSnapshotId: any;
    customInstructions: any;
    createdAt: number;
    updatedAt: number;
} | null;
export declare function deleteProject(db: SqliteDb, id: string): void;
export declare function listTemplates(db: SqliteDb): {
    id: any;
    name: any;
    description: any;
    sourceProjectId: any;
    files: any;
    createdAt: number;
}[];
export declare function getTemplate(db: SqliteDb, id: string): {
    id: any;
    name: any;
    description: any;
    sourceProjectId: any;
    files: any;
    createdAt: number;
} | null;
export declare function findTemplateByNameAndProject(db: SqliteDb, name: string, sourceProjectId: string): {
    id: any;
    name: any;
    description: any;
    sourceProjectId: any;
    files: any;
    createdAt: number;
} | null;
export declare function insertTemplate(db: SqliteDb, t: DbRow): {
    id: any;
    name: any;
    description: any;
    sourceProjectId: any;
    files: any;
    createdAt: number;
} | null;
export declare function updateTemplate(db: SqliteDb, id: string, t: {
    description: string | null;
    files: unknown[];
}): {
    id: any;
    name: any;
    description: any;
    sourceProjectId: any;
    files: any;
    createdAt: number;
} | null;
export declare function deleteTemplate(db: SqliteDb, id: string): void;
export declare function listConversations(db: SqliteDb, projectId: string): {
    id: any;
    projectId: any;
    title: any;
    sessionMode: ChatSessionMode;
    messageCount: number;
    createdAt: number;
    updatedAt: number;
    latestRun: {
        status: string;
        startedAt?: number | undefined;
        endedAt?: number | undefined;
        durationMs?: number;
    } | undefined;
}[];
/**
 * Return the conversation that was inserted first for a project.
 *
 * Project creation seeds this row before any side conversations exist.
 * `created_at` normally identifies it, while `rowid` preserves insertion
 * order when two conversations are created within the same millisecond.
 * Keep this separate from `listConversations`, whose updated-at ordering is a
 * user-facing recency contract.
 */
export declare function getFirstProjectConversation(db: SqliteDb, projectId: string): {
    latestRun: {
        status: string;
        startedAt?: number | undefined;
        endedAt?: number | undefined;
        durationMs?: number;
    } | undefined;
    id: any;
    projectId: any;
    title: any;
    sessionMode: ChatSessionMode;
    messageCount: number;
    createdAt: number;
    updatedAt: number;
} | null;
export declare function getConversation(db: SqliteDb, id: string): {
    latestRun: {
        status: string;
        startedAt?: number | undefined;
        endedAt?: number | undefined;
        durationMs?: number;
    } | undefined;
    id: any;
    projectId: any;
    title: any;
    sessionMode: ChatSessionMode;
    messageCount: number;
    createdAt: number;
    updatedAt: number;
} | null;
export declare function normalizeConversationSessionMode(value: unknown): ChatSessionMode;
export declare function insertConversation(db: SqliteDb, c: DbRow): {
    latestRun: {
        status: string;
        startedAt?: number | undefined;
        endedAt?: number | undefined;
        durationMs?: number;
    } | undefined;
    id: any;
    projectId: any;
    title: any;
    sessionMode: ChatSessionMode;
    messageCount: number;
    createdAt: number;
    updatedAt: number;
} | null;
export declare function updateConversation(db: SqliteDb, id: string, patch: DbRow): {
    latestRun: {
        status: string;
        startedAt?: number | undefined;
        endedAt?: number | undefined;
        durationMs?: number;
    } | undefined;
    id: any;
    projectId: any;
    title: any;
    sessionMode: ChatSessionMode;
    messageCount: number;
    createdAt: number;
    updatedAt: number;
} | null;
export declare function deleteConversation(db: SqliteDb, id: string): void;
export interface ConversationIntentSignals {
    deck: boolean;
    media: boolean;
    platform: boolean;
    /**
     * Which handheld shell the user's own words asked for (OD Next prototype
     * tasks). Latches like the booleans: the first resolved platform holds for
     * the conversation so a later "make the button blue" turn keeps quoting the
     * same shell and the stable context does not flip.
     */
    devicePlatform: OdNextDevicePlatformV1 | null;
}
/**
 * Read the conversation's latched intent signals. A missing row, NULL
 * column, or unparsable value all read as all-false (pre-hotfix
 * conversations and fresh rows).
 */
export declare function readConversationIntentSignals(db: SqliteDb, conversationId: string): ConversationIntentSignals;
/**
 * Latch this turn's fresh intent detections onto the conversation:
 * `effective = stored OR fresh`, persisted only when it changes. Signals
 * only ever turn ON for the life of a conversation (monotonic), so a
 * genuine mid-conversation activation costs exactly one stable-prompt miss
 * and a later signal-free turn cannot flip it back OFF. A conversationId
 * without a persisted row degrades to fresh detection (nothing to latch on).
 *
 * The read+merge+write runs inside a BEGIN IMMEDIATE transaction: the write
 * lock is taken before the read, so no other connection can commit between
 * them and clobber a previously latched bit. Within one daemon process the
 * sequence is already non-interleavable (better-sqlite3 is synchronous and
 * there is no await point between read and write); the transaction pins the
 * monotonic guarantee against future refactors and multi-connection writers.
 */
export declare function latchConversationIntentSignals(db: SqliteDb, conversationId: string, fresh: ConversationIntentSignals): ConversationIntentSignals;
export declare function getAgentSession(db: SqliteDb, conversationId: string, agentId: string): string | null;
export declare function upsertAgentSession(db: SqliteDb, input: {
    conversationId: string;
    agentId: string;
    sessionId: string;
    stablePromptHash?: string | null;
    stablePromptSections?: string | null;
    model?: string | null;
    cwd?: string | null;
    lastMessageId?: string | null;
    lastInputTokens?: number | null;
}): void;
export declare function getAgentSessionRecord(db: SqliteDb, conversationId: string, agentId: string): {
    sessionId: string;
    stablePromptHash: string | null;
    stablePromptSections: string | null;
    model: string | null;
    cwd: string | null;
    lastMessageId: string | null;
    lastInputTokens: number | null;
} | null;
export declare function latestCompletedAssistantMessageId(db: SqliteDb, conversationId: string, excludeMessageId: string, resumableMessageId?: string | null): string | null;
/**
 * The user request that produced `assistantMessageId` — i.e. what the upstream
 * session that ended on that assistant turn was working on.
 *
 * Anchored on the stored resume cursor rather than "the newest user message",
 * because by prompt-composition time the current turn's own user row is already
 * seeded (`seedRunUserMessage`) and would win a naive lookup. Returns null when
 * the anchor row is gone or nothing precedes it — the caller must then
 * synthesize no context at all rather than guess at one.
 */
export declare function userRequestBeforeAssistantMessage(db: SqliteDb, conversationId: string, assistantMessageId: string): string | null;
/**
 * The conversation's most recently declared task list — the raw TodoWrite
 * `input` — walking back from the newest assistant turn, or `null` when none of
 * the recent turns declared one.
 *
 * Deliberately NOT `latestCompletedAssistantMessageId`'s `run_status =
 * 'succeeded'` filter: a turn that was interrupted or failed is precisely the
 * turn most likely to have left work open, and it is the one we most want to
 * hand back. Only `excludeMessageId` — the current run's own in-flight
 * placeholder — is skipped.
 *
 * Walking PAST a turn that declared no list is intentional: an unrelated
 * question answered in between does not close the outstanding plan.
 */
export declare function latestTodoWriteInputForConversation(db: SqliteDb, conversationId: string, excludeMessageId: string): unknown | null;
export declare function updateAgentSessionStableHash(db: SqliteDb, conversationId: string, agentId: string, stablePromptHash: string): void;
export declare function clearAgentSession(db: SqliteDb, conversationId: string, agentId: string): void;
/**
 * Number of messages in a conversation.
 *
 * For emptiness checks prefer this over `listMessages(...).length`: the latter
 * loads and parses every message's JSON columns — including the event log,
 * which grows with tool output — to answer a question `COUNT(*)` answers
 * without touching them.
 */
export declare function countMessages(db: SqliteDb, conversationId: string): number;
/**
 * The `done_key` every OTHER assistant row of a conversation was recorded with
 * — the Run identities `excludeMessageId` must never be allowed to absorb (see
 * the PUT guard in `routes/project/conversations.ts`).
 *
 * Each physical Run mints exactly one key and emits it before any model output,
 * so a row's FIRST well-formed `done_key` event is that row's Run identity;
 * later keys in the same list are the damage the guard exists to stop, so only
 * the first one counts and an already-damaged sibling cannot re-export the key
 * it absorbed.
 *
 * Invariant: each sibling's key is read inside SQLite. This runs on every
 * message PUT, and a sibling's event log can hold any amount of tool output, so
 * no sibling event log is ever materialized or parsed in JS here.
 */
export declare function listSiblingRunDoneKeys(db: SqliteDb, conversationId: string, excludeMessageId: string): Set<string>;
export declare function listMessages(db: SqliteDb, conversationId: string): {
    id: any;
    role: any;
    content: string;
    agentId: any;
    agentName: any;
    runId: any;
    runStatus: any;
    resultDeliveryState: "delivered" | "delivery_failed" | "no_result" | undefined;
    lastRunEventId: any;
    events: DbRow[] | undefined;
    attachments: any;
    commentAttachments: any;
    producedFiles: any;
    artifactRefs: ChatArtifactRef[] | undefined;
    traceObjectFiles: any;
    feedback: any;
    preTurnFileNames: any;
    sessionMode: ChatSessionMode | undefined;
    runContext: any;
    taskAnalytics: any;
    appliedPluginSnapshot: any;
    forkedInto: {
        title: string;
        conversationId?: string;
    } | undefined;
    cancelOrigin: import("@open-design/contracts").TrackingRunCancelOrigin | null | undefined;
    createdAt: any;
    startedAt: any;
    endedAt: any;
}[];
export declare function getMessage(db: SqliteDb, id: string, conversationId?: string): {
    id: any;
    role: any;
    content: string;
    agentId: any;
    agentName: any;
    runId: any;
    runStatus: any;
    resultDeliveryState: "delivered" | "delivery_failed" | "no_result" | undefined;
    lastRunEventId: any;
    events: DbRow[] | undefined;
    attachments: any;
    commentAttachments: any;
    producedFiles: any;
    artifactRefs: ChatArtifactRef[] | undefined;
    traceObjectFiles: any;
    feedback: any;
    preTurnFileNames: any;
    sessionMode: ChatSessionMode | undefined;
    runContext: any;
    taskAnalytics: any;
    appliedPluginSnapshot: any;
    forkedInto: {
        title: string;
        conversationId?: string;
    } | undefined;
    cancelOrigin: import("@open-design/contracts").TrackingRunCancelOrigin | null | undefined;
    createdAt: any;
    startedAt: any;
    endedAt: any;
} | null;
export declare function conversationTurnIndexForRun(db: SqliteDb, conversationId: string, runId: string): number | null;
export declare function upsertMessage(db: SqliteDb, conversationId: string, m: DbRow): {
    id: any;
    role: any;
    content: string;
    agentId: any;
    agentName: any;
    runId: any;
    runStatus: any;
    resultDeliveryState: "delivered" | "delivery_failed" | "no_result" | undefined;
    lastRunEventId: any;
    events: DbRow[] | undefined;
    attachments: any;
    commentAttachments: any;
    producedFiles: any;
    artifactRefs: ChatArtifactRef[] | undefined;
    traceObjectFiles: any;
    feedback: any;
    preTurnFileNames: any;
    sessionMode: ChatSessionMode | undefined;
    runContext: any;
    taskAnalytics: any;
    appliedPluginSnapshot: any;
    forkedInto: {
        title: string;
        conversationId?: string;
    } | undefined;
    cancelOrigin: import("@open-design/contracts").TrackingRunCancelOrigin | null | undefined;
    createdAt: any;
    startedAt: any;
    endedAt: any;
} | null;
export declare function getMessageTelemetryFinalizationState(db: SqliteDb, messageId: string): {
    exists: boolean;
    finalizedAt: number | null;
};
export declare function appendMessageStatusEvent(db: SqliteDb, messageId: string, event: DbRow): any[] | null;
export declare function compactAdjacentMessageAgentEvents(incomingEvents: readonly DbRow[]): DbRow[];
export declare function clearMessageAgentEventBatches(db: SqliteDb, messageId: string): void;
export declare function appendMessageAgentEvents(db: SqliteDb, messageId: string, incomingEvents: readonly DbRow[]): DbRow[] | null;
export declare function finalizeMessageAgentEvents(db: SqliteDb, messageId: string): DbRow[] | null;
/**
 * Retire the unfinished prose an interrupted attempt left on this message.
 *
 * A turn only gets another attempt because the previous one never terminated,
 * so whatever text the superseded attempt streamed after its last committed
 * boundary was never closed upstream either — and the next attempt writes that
 * passage again. Appending it a second time is how one conclusion ends up in
 * the transcript twice (OPEND-2566): the event stream is append-only and
 * adjacent text is concatenated, so nothing downstream can tell a re-written
 * answer from a longer one.
 *
 * Only the trailing delta run goes. Prose that a tool row already closed is
 * committed in the agent's own session — a resumed attempt continues past it
 * instead of repeating it — so it has to survive, and the last tool row is the
 * boundary the resume itself is anchored on.
 *
 * `content` is corrected by removing exactly the suffix those deltas
 * contributed, and only when it really is that suffix; a row whose body came
 * from somewhere else is left alone rather than rewritten on a guess.
 *
 * Returns how many events were dropped.
 */
export declare function dropTrailingMessageAgentDeltas(db: SqliteDb, messageId: string): number;
export declare function appendMessageAgentEvent(db: SqliteDb, messageId: string, event: DbRow): DbRow[] | null;
export declare function deleteMessage(db: SqliteDb, id: string): void;
/** Server-controlled read scope; never populated from a request body. */
interface PreviewCommentReadOptions {
    /** Include the same project's reserved inbound anchor, not other private chats. */
    includeProjectAnchor?: boolean;
}
export declare function listPreviewComments(db: SqliteDb, projectId: string, conversationId: string, options?: PreviewCommentReadOptions): PreviewComment[];
/**
 * Team preview annotations are project resources, not chat transcript rows.
 * Different daemons intentionally use different local conversation ids as the
 * SQLite foreign-key anchor, so shared reads must not filter on that local id.
 */
export declare function listProjectPreviewComments(db: SqliteDb, projectId: string): PreviewComment[];
export interface UpsertPreviewCommentOptions {
    /**
     * True when this project currently syncs comments to the collab cloud (see
     * `shouldSyncProjectComments`), so a genuinely NEW comment's `pin_seq`
     * starts unconfirmed (0) instead of final (1). Ignored on the edit branch —
     * `pin_seq`/`pin_seq_confirmed`/`sort_key` are assigned exactly once, at
     * creation, and never revisited by an edit. Only meaningful together with a
     * later `confirmPreviewCommentPinSeq` call once the cloud push resolves.
     */
    pinPendingCloudConfirm?: boolean;
}
export declare function upsertPreviewComment(db: SqliteDb, projectId: string, conversationId: string, input: DbRow, options?: UpsertPreviewCommentOptions): PreviewComment | null;
/** Reconcile the authenticated cloud author fingerprint on the same local member row. */
export declare function confirmPreviewCommentAuthorKey(db: SqliteDb, projectId: string, id: string, memberId: string, authorKey: string): boolean;
/**
 * Reconcile a comment's provisional `pin_seq` to the collab-cloud's
 * confirmed, globally-serialized push `seq` — the step that closes the
 * cross-device race: two daemons that each computed the same local
 * `MAX(pin_seq)+1` for a comment created in the same ~5s poll window
 * converge to distinct numbers once their own push resolves, because the
 * guard below only ever applies ONCE per comment (idempotent — a later edit's
 * push resolving after the create's is a harmless no-op here). Returns false
 * when the row was already confirmed (nothing to do) or does not exist.
 */
export declare function confirmPreviewCommentPinSeq(db: SqliteDb, projectId: string, id: string, seq: number): boolean;
/**
 * Persist the dragged comment's new sidebar position (Phase 2 of
 * recvq5BVsolIxi). The client computes `sortKey` itself (a midpoint between
 * the dragged item's new neighbors) — this is a single-row write, never a
 * table-wide renumber, and never touches `pin_seq`.
 */
export declare function reorderPreviewComment(db: SqliteDb, projectId: string, conversationId: string, id: string, sortKey: number): PreviewComment | null;
export declare function updatePreviewCommentStatus(db: SqliteDb, projectId: string, conversationId: string, id: string, status: string): PreviewComment | null;
/**
 * Team collaboration drift-ladder write-back: persist how a comment resolved this render.
 * `lastGoodPosition`/`anchoredVersion` are COALESCEd so a `lost` resolve (which omits
 * them) keeps the last known-good values instead of wiping them. Does not bump
 * `updated_at` — anchor resolution is a derived read, not a content edit.
 */
export declare function updatePreviewCommentAnchor(db: SqliteDb, projectId: string, conversationId: string, id: string, input: DbRow): PreviewComment | null;
export declare function deletePreviewComment(db: SqliteDb, projectId: string, conversationId: string, id: string): boolean;
/** Return the most-recently updated local conversation for a project. */
export declare function getLatestConversationIdForProject(db: SqliteDb, projectId: string, excludeConversationId?: string | null): string | null;
export declare function isProjectCommentAnchorConversationId(conversationId: string): boolean;
/**
 * Return the daemon-local conversation reserved for Team preview comments.
 *
 * Synced comments are project resources, while conversation ids are private to
 * each daemon. A dedicated empty conversation gives those rows a stable FK that
 * does not follow whichever chat happened to be updated most recently.
 */
export declare function getProjectCommentAnchorConversationId(db: SqliteDb, projectId: string, excludeConversationId?: string | null): string | null;
/**
 * Ensure a Team project has one dedicated LOCAL conversation row that preview
 * comments can use as their stable foreign-key anchor.
 *
 * Conversation ids and chat transcripts are daemon-local; Team project
 * materialization deliberately does not copy the owner's private conversations
 * or messages. A member mirror can therefore have zero conversations even
 * after every shared file is present. Preview comments still need a local
 * conversation FK, so the materializer creates one empty reserved thread exactly
 * once. Ordinary chat conversations never become comment anchors.
 */
export declare function ensureProjectCommentAnchorConversation(db: SqliteDb, projectId: string, now?: number, excludeConversationId?: string | null): {
    conversationId: string;
    created: boolean;
} | null;
/**
 * Ensure a normal daemon-local conversation exists for UI/comment HTTP
 * routing. The internal comment anchor is deliberately excluded: it must never
 * become the user's active chat, but a read-only Team mirror with no private
 * chat still needs one routable conversation to create and read comments.
 */
export declare function ensureProjectCommentRoutingConversation(db: SqliteDb, projectId: string, now?: number, excludeConversationId?: string | null): {
    conversationId: string;
    created: boolean;
} | null;
export declare function ensureTeamProjectCommentConversations(db: SqliteDb, projectId: string, now?: number, excludeConversationId?: string | null): {
    anchorCreated: boolean;
    routingCreated: boolean;
};
/**
 * Every relay-eligible project needs the same internal conversation FK: all
 * active Team projects and personal projects with a persisted public share.
 * Repair historical data at startup, never as a side effect of comments GET.
 * Only Team projects also need a public routing conversation; personal shares
 * must not create or replace an ordinary chat just to receive web comments.
 */
export declare function repairTeamProjectCommentAnchorConversations(db: SqliteDb, now?: number): {
    checked: number;
    created: number;
};
/**
 * Delete one validated project conversation while preserving Team comments.
 * A dedicated anchor is established and attached comments are moved to it
 * before the conversation delete can trigger its FK cascade. The whole repair
 * and delete is one SQLite transaction. Personal projects retain the existing
 * cascade-delete behavior.
 */
export declare function deleteConversationAndRepairTeamCommentAnchor(db: SqliteDb, projectId: string, conversationId: string, now?: number): {
    anchorCreated: boolean;
};
/**
 * Delete a synced comment by its global id (the author daemon's own id). Used to
 * apply an inbound tombstone. Scoped by project so a stray id can't reach across
 * projects. Returns true when a row was removed.
 */
export declare function deleteSyncedPreviewComment(db: SqliteDb, projectId: string, id: string): boolean;
export type SyncedCommentMergeResult = 'changed' | 'unchanged';
type SyncedRevision = {
    seq: number | null;
    updatedAt: number | null;
};
/**
 * Ordering rule for an inbound collab-cloud revision against a stored row.
 *
 * - The cloud `seq` is the sole sync cursor. When both sides know one in the
 *   same stream (the caller passes stored seq only for a matching stream), an
 *   incoming `seq` at or below the row's `cloud_revision_seq` is a replay (a
 *   restarted daemon re-pulling from 0, a member snapshot, a relay echo) and
 *   never overwrites the row: `same-revision` at equality (metadata hydration
 *   only), `stale` below it.
 * - A revision the row has not seen yet — a higher `seq`, or any `seq` for a
 *   row that has none recorded — still honours the business last-writer-wins
 *   rule on `updatedAt` when the incoming record carries one, so a local edit
 *   not yet relayed is not clobbered by an older cloud edit. A record with no
 *   `updatedAt` cannot contest the row on time and is applied in `seq` order.
 * - Without an incoming `seq` (an older relay build) only `updatedAt` orders,
 *   and a record with no `updatedAt` is never assumed to be newest.
 */
export declare function syncedCommentRevisionIsNewer(incoming: SyncedRevision, stored: {
    seq: number | null;
    updatedAt: number;
}): 'apply' | 'same-revision' | 'stale';
/**
 * Merge one collab-cloud comment into local `preview_comments`. The cloud
 * comment's id is used verbatim as the local id (it is the author daemon's own
 * id — a global dedup key), so a comment's whole lifecycle keys off that id:
 *
 * - Tombstone (`deleted: true`): delete the local row by id. Delete wins
 *   unconditionally (it does not compare `updatedAt`).
 * - Create/edit: UPSERT by id. A brand-new id inserts; an existing id updates
 *   IN PLACE only when {@link syncedCommentRevisionIsNewer} says so. Comments
 *   are keyed by id, so multiple notes on the same element coexist, including
 *   from the same member.
 *
 * `conversationId` is the LOCAL project comment anchor (see
 * getProjectCommentAnchorConversationId);
 * the cloud comment's own conversationId is not a valid FK here. It is only used
 * when inserting a new row — an in-place update keeps the row's existing
 * conversation. Returns an explicit changed/unchanged acknowledgement. Failures
 * throw so the caller cannot acknowledge a batch it did not persist.
 */
export declare function mergeSyncedPreviewComment(db: SqliteDb, projectId: string, conversationId: string, comment: CollabCloudComment, options?: {
    stream?: string | undefined;
}): SyncedCommentMergeResult;
export declare function getProjectCommentReadState(db: SqliteDb, projectId: string, viewerScope: string): {
    projectId: string;
    lastReadAt?: number;
};
/** Advance, never rewind, a trusted viewer's project-level read marker. */
export declare function markProjectCommentsRead(db: SqliteDb, projectId: string, viewerScope: string, readAt: number): {
    projectId: string;
    lastReadAt?: number;
};
export declare function getPreviewComment(db: SqliteDb, projectId: string, conversationId: string, id: string, options?: PreviewCommentReadOptions): PreviewComment | null;
/** Resolve a Team annotation independently from its daemon-local FK anchor. */
export declare function getProjectPreviewComment(db: SqliteDb, projectId: string, id: string): PreviewComment | null;
export type RunEventPayloadHealOutcome = {
    status: 'rewritten';
    bytesBefore: number;
    bytesAfter: number;
} | {
    status: 'unchanged' | 'missing' | 'active' | 'malformed';
};
/** Messages whose stored event log is larger than one event's budget, by rowid. */
export declare function listRunEventHealMessageCandidates(db: SqliteDb, afterRowid: number, limit: number): Array<{
    rowid: number;
    id: string;
}>;
/** Event batches larger than one event's budget, by id. */
export declare function listRunEventHealBatchCandidates(db: SqliteDb, afterId: number, limit: number): Array<{
    id: number;
}>;
/**
 * Rewrite one message's stored events so every event fits the payload budget.
 * Skips (`active`) a row whose run is still queued or running: its writer owns
 * it. A row that is already bounded is left untouched (`unchanged`), so
 * healing is idempotent.
 */
export declare function healOversizedMessageEvents(db: SqliteDb, messageId: string): RunEventPayloadHealOutcome;
/** {@link healOversizedMessageEvents} for one `message_event_batches` row. */
export declare function healOversizedMessageEventBatch(db: SqliteDb, batchId: number): RunEventPayloadHealOutcome;
export declare function hasCompletedDaemonMaintenancePass(db: SqliteDb, name: string): boolean;
export declare function recordCompletedDaemonMaintenancePass(db: SqliteDb, name: string, completedAt?: number): void;
export declare function listRoutines(db: SqliteDb): {
    id: any;
    name: any;
    prompt: any;
    scheduleKind: any;
    scheduleValue: any;
    scheduleJson: any;
    projectMode: any;
    projectId: any;
    skillId: any;
    agentId: any;
    contextJson: any;
    enabled: boolean;
    createdAt: number;
    updatedAt: number;
}[];
export declare function getRoutine(db: SqliteDb, id: string): {
    id: any;
    name: any;
    prompt: any;
    scheduleKind: any;
    scheduleValue: any;
    scheduleJson: any;
    projectMode: any;
    projectId: any;
    skillId: any;
    agentId: any;
    contextJson: any;
    enabled: boolean;
    createdAt: number;
    updatedAt: number;
} | null;
export declare function insertRoutine(db: SqliteDb, r: DbRow): {
    id: any;
    name: any;
    prompt: any;
    scheduleKind: any;
    scheduleValue: any;
    scheduleJson: any;
    projectMode: any;
    projectId: any;
    skillId: any;
    agentId: any;
    contextJson: any;
    enabled: boolean;
    createdAt: number;
    updatedAt: number;
} | null;
export declare function updateRoutine(db: SqliteDb, id: string, patch: DbRow): {
    id: any;
    name: any;
    prompt: any;
    scheduleKind: any;
    scheduleValue: any;
    scheduleJson: any;
    projectMode: any;
    projectId: any;
    skillId: any;
    agentId: any;
    contextJson: any;
    enabled: boolean;
    createdAt: number;
    updatedAt: number;
} | null;
export declare function deleteRoutine(db: SqliteDb, id: string): boolean;
export declare function listRoutineRuns(db: SqliteDb, routineId: string, limit?: number): {
    id: any;
    routineId: any;
    trigger: any;
    status: any;
    projectId: any;
    conversationId: any;
    agentRunId: any;
    startedAt: number;
    completedAt: number | null;
    summary: any;
    error: any;
    errorCode: any;
}[];
export declare function getLatestRoutineRun(db: SqliteDb, routineId: string): {
    id: any;
    routineId: any;
    trigger: any;
    status: any;
    projectId: any;
    conversationId: any;
    agentRunId: any;
    startedAt: number;
    completedAt: number | null;
    summary: any;
    error: any;
    errorCode: any;
} | null;
export declare function getRoutineRun(db: SqliteDb, id: string): {
    id: any;
    routineId: any;
    trigger: any;
    status: any;
    projectId: any;
    conversationId: any;
    agentRunId: any;
    startedAt: number;
    completedAt: number | null;
    summary: any;
    error: any;
    errorCode: any;
} | null;
export declare function insertRoutineRun(db: SqliteDb, r: DbRow): {
    id: any;
    routineId: any;
    trigger: any;
    status: any;
    projectId: any;
    conversationId: any;
    agentRunId: any;
    startedAt: number;
    completedAt: number | null;
    summary: any;
    error: any;
    errorCode: any;
} | null;
export declare function insertScheduledRoutineRun(db: SqliteDb, r: DbRow, slotAt: number): {
    id: any;
    routineId: any;
    trigger: any;
    status: any;
    projectId: any;
    conversationId: any;
    agentRunId: any;
    startedAt: number;
    completedAt: number | null;
    summary: any;
    error: any;
    errorCode: any;
} | null;
export declare function updateRoutineRun(db: SqliteDb, id: string, patch: DbRow): {
    id: any;
    routineId: any;
    trigger: any;
    status: any;
    projectId: any;
    conversationId: any;
    agentRunId: any;
    startedAt: number;
    completedAt: number | null;
    summary: any;
    error: any;
    errorCode: any;
} | null;
export declare function listTabs(db: SqliteDb, projectId: string): {
    tabs: string[];
    active: string | null;
    browserTabs?: ProjectBrowserWorkspaceTab[];
    hasSavedState: boolean;
    updatedAt: number;
} | {
    tabs: any[];
    active: any;
    hasSavedState: boolean;
    updatedAt: number | undefined;
};
export declare function setTabs(db: SqliteDb, projectId: string, stateOrNames: ProjectTabsState | string[], activeName?: string | null): {
    tabs: string[];
    active: string | null;
    browserTabs?: ProjectBrowserWorkspaceTab[];
    hasSavedState: boolean;
    updatedAt: number;
} | {
    tabs: any[];
    active: any;
    hasSavedState: boolean;
    updatedAt: number | undefined;
};
export {};
