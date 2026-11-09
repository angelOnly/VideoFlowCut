import type { DesktopExportArtifactInput, DesktopExportArtifactResult, DesktopExportPdfInput, DesktopExportPdfResult, DesktopRenderFramesInput, DesktopRenderFramesResult, DesktopRenderSlidesInput, DesktopRenderSlidesResult } from '@open-design/sidecar-proto';
import type { WorkspaceCollabContext } from '@open-design/contracts';
import { resolveProjectRoot } from './project-root.js';
export { resolveDaemonCliPath, resolveDaemonPluginPreviewsDir, resolveDaemonResourceRoot, resolveDataDir, } from './daemon-paths.js';
export { isStaticSpaFallbackRequest, resolveStaticSpaFallbackPath, } from './static-spa.js';
export { createCompatApiError, createCompatApiErrorResponse, } from './http/api-errors.js';
export { composeChatAgentTextPayload, composeLiveInstructionPrompt, formatDesignFilesWorkspaceHint, formatProjectAttachmentHint, normalizeCommentAttachments, renderCommentAttachmentHint, resolveChatExtraAllowedDirs, describeStablePromptCache, designSystemIdFromPluginSnapshot, resolveEffectiveDesignSystemSelection, resolveResearchCommandContract, resolveSafeProjectAttachments, resolveSafePromptImagePaths, excludeAcpImagePathsAlreadyDeliveredAsResources, selectPromptImagePaths, } from './runtimes/chat-prompt-inputs.js';
export { applyClaudeStreamJsonRunBookkeeping, assertValidRuntimeDefFirstOutputTimeoutMs, assertValidRuntimeDefInactivityTimeoutMs, classifyChatRunCloseStatus, resolveAcpStageTimeoutMs, resolveActiveInactivityTimeoutMs, resolveChatRunArtifactQuietPeriodMs, resolveChatRunFirstOutputTimeoutMs, resolveChatRunInactivityTimeoutMs, runtimeEmissionCountsAsAgentProgress, } from './runtimes/chat-run-lifecycle.js';
export { renderRunContextPrompt, } from './runtimes/chat-run-context.js';
export { daemonAgentPayloadToPersistedAgentEvent, persistRunEventToAssistantMessage, pinAssistantMessageOnRunCreate, } from './runtimes/chat-run-messages.js';
export { resolveRunProjectKindForAnalytics as __forTestResolveRunProjectKindForAnalytics, retryFinalResultForRunStatus as __forTestRetryFinalResultForRunStatus, runRetryEventsForAnalytics as __forTestRunRetryEventsForAnalytics, scanRunEventsForFinishedProps as __forTestScanRunEventsForFinishedProps, scanRunEventsForRetrySideEffects as __forTestScanRunEventsForRetrySideEffects, } from './runtimes/run-lifecycle-analytics.js';
export { resolveProjectRoot };
export { isDesktopAuthGateActive, isDesktopAuthRegistered, resetDesktopAuthForTests, setDesktopAuthSecret, signDesktopImportToken, verifyDesktopImportToken, } from './desktop-auth.js';
import { type AmrTerminalReportDeliveryService } from './storage/amr-terminal-report-outbox.js';
import { reportRunCompletedFromDaemon } from './langfuse-bridge.js';
import { type AnalyticsContext } from './analytics.js';
import { type RunWorkspaceScope } from './runtimes/project-amr-trace-env.js';
export { rewriteSkillAssetUrls } from './routes/static-resource.js';
import { type RecalledTodo } from '@open-design/contracts';
export declare function resolveOpenDesignNodeBin({ env, execPath, platform, resourceRoot, exists, }?: {
    env?: NodeJS.ProcessEnv | Record<string, string | undefined>;
    execPath?: string;
    platform?: NodeJS.Platform;
    resourceRoot?: string | null;
    exists?: (path: string) => boolean;
}): string;
export declare const __forTestChatRunHandles: Map<any, any>;
export declare function __forTestEmitLiveArtifactEvent(grant: {
    runId?: string;
    projectId?: string;
}, action: 'created' | 'updated' | 'deleted', artifact: {
    id: string;
    projectId?: string;
    title?: string;
    refreshStatus?: string;
}): boolean;
/**
 * Hub → daemon handling for the `workspace-context-changed` event (see
 * `startHubEventsSubscriber`'s `onEvent` below). Vela sends this same event
 * both for directory changes and membership changes (e.g. removal from a
 * team). Besides forwarding the thin signal to the web, this kicks one
 * immediate background reconciliation cycle. Request mutations independently
 * perform fresh exact-scope authority checks and do not depend on this poll.
 *
 * Extracted as its own named, exported step (rather than inlined in the
 * switch) so this invariant is directly unit-testable without standing up a
 * real hub connection.
 */
export declare function handleHubWorkspaceContextChanged(workspaceId: string, pollWorkspaceInvalidation: () => Promise<void>, invalidateWorkspaceDirectory?: () => void): Promise<void>;
/** Terminal counterpart to workspace-context-changed. Vela has already
 * re-derived the stream principal and is closing the connection, so local
 * directory and billing projections must be retired synchronously before any
 * reconciliation I/O starts. */
export declare function handleHubWorkspaceAccessRevoked(workspaceId: string, pollWorkspaceInvalidation: () => Promise<void>, invalidateWorkspaceDirectory: () => void, revokeWorkspaceBilling: (workspaceId: string) => void): void;
/**
 * A verified hub connection is itself a freshness boundary, including the
 * daemon's very first connection. Published content and billing may already
 * have changed before the subscriber came online, so both scopes catch up
 * immediately instead of waiting for a later reconnect or poll tick.
 */
export declare function handleHubVerifiedConnection(workspaceId: string | undefined, catchUpPublishedHeads: (workspaceId: string) => Promise<void>, catchUpWorkspaceBilling: (workspaceId: string) => void): void;
export declare const SSE_KEEPALIVE_INTERVAL_MS = 25000;
export declare function createAgentRuntimeEnv(baseEnv: NodeJS.ProcessEnv | Record<string, string | undefined>, daemonUrl: string, toolTokenGrant?: {
    token?: string;
} | null, nodeBin?: string, inheritedEnvironment?: (baseEnv?: NodeJS.ProcessEnv) => Record<string, string>): NodeJS.ProcessEnv;
export declare function createAgentRuntimeToolPrompt(daemonUrl: string, toolTokenGrant?: {
    token?: string;
} | null): string;
export declare function createOpenDesignToolEnv({ daemonUrl, hyperFramesBin, projectDir, projectId, workspaceScope, runId, conversationId, analyticsContext, }: {
    daemonUrl: string;
    hyperFramesBin?: string;
    projectDir?: string | null;
    projectId?: string | null;
    workspaceScope?: RunWorkspaceScope | null;
    runId?: string | null;
    conversationId?: string | null;
    analyticsContext?: AnalyticsContext | null;
}): NodeJS.ProcessEnv;
export declare function createDaemonDataDirConfiguredAgentEnv(configuredAgentEnv?: Record<string, string>): Record<string, string>;
export declare function normalizeProjectDisplayStatus(status: any): any;
export declare function composeProjectDisplayStatus(baseStatus: any, awaitingInputProjects: any, projectId: any): any;
export declare function __forTestFilesystemWriteFileNamesFromRunEvents(events: any): string[];
export declare function __forTestFilesystemEmptyAnswerFallbackText(fileNames: any): string;
export declare function shouldReportRunCompletedFromMessage(saved: any, body?: {}): boolean;
export declare function telemetryPromptFromRunRequest(message: any, currentPrompt: any): any;
export declare const FORM_ANSWERED_SYSTEM_OVERRIDE = "## OVERRIDE \u2014 submitted form answers are authoritative\n\nThe user already submitted their form answers (see # User request below).\nApply those answers. RULE 1 does not require another form merely because its\nexample appears in the system prompt.\n\nForbidden output for this turn:\n- Re-emitting the answered `discovery` or `task-type` form, or asking again\n  for information the submitted answers already provide.\n- A markdown ```json fenced block echoing an answered form's schema or example.\n- Form-asking prose that repeats the answered questions, such as\n  \"Got it \u2014 tell me the following\" or\n  \"\u8BF7\u544A\u8BC9\u6211\u4EE5\u4E0B\u4FE1\u606F\".\n- Narrating fake system events such as \"subagents stopped\" or\n  \"server restart\".\n\nRequired output for this turn:\n- Open with a brief prose confirmation of what the brief is.\n- Then apply RULE 2 as relevant and proceed to RULE 3 or the matching active\n  workflow.\n- Only if a new, materially blocking requirement remains unresolved may you\n  emit one new targeted `<question-form>`; never repeat answered fields.\n\n";
export declare const FORM_ANSWERED_GENERIC_OVERRIDE = "## OVERRIDE \u2014 submitted form answers are authoritative\n\nThe user already submitted their form answers (see # User request below).\nDo not ask the same form again. Treat the submitted answers as the active\nuser instruction and respond accordingly. Ask again only if a new, materially\nblocking requirement remains unresolved.\n\n";
/**
 * Background block that tells a FRESH session which request it is continuing.
 *
 * Only ever rendered for a turn whose message is a continuation directive AND
 * whose stored session the daemon refused (see `resolveResumeContinuationSeed`).
 * Absent for every other turn, so no existing prompt moves by a byte — and so
 * no upstream cached prefix moves either.
 */
export declare function renderResumeContinuationContext(originalRequest: string | null | undefined): string | null;
export declare function composeChatUserRequestForAgent(message: any, currentPrompt: any, options?: {
    skipTranscript?: boolean;
    /**
     * The request a refused upstream session was working on, when this turn is
     * a continuation directive the daemon could not resume. Rides the per-turn
     * user body for the same reason the todo recall below does: a resumed
     * session throws the rendered transcript away, and the system prompt is the
     * cached stable prefix. Omitted/empty leaves the composed body unchanged.
     */
    resumeContinuationOriginalRequest?: string | null;
    /**
     * The task list an earlier turn of this conversation last declared — the
     * WHOLE snapshot, finished rows included (see
     * `latestTodoWriteInputForConversation` + `recalledTodosFromTodoWriteInput`).
     * `renderUnfinishedTodoRecall` owns the question of whether any of it is
     * still open, and renders nothing when none of it is.
     *
     * This is the ONLY keyhole that reaches both branches below. A resumed
     * session throws the rendered transcript away entirely (`skipTranscript`),
     * so anything appended to the transcript is invisible to the 6 runtimes
     * with native resume; anything put in the system prompt moves the cached
     * stable prefix on every turn. The per-turn user body is the one place a
     * per-turn fact can ride for free, and `formAnswerTransitionForCurrentPrompt`
     * below is the existing precedent for synthesizing into it.
     *
     * Empty/omitted MUST leave the composed body byte-identical to before.
     */
    previousTurnTaskList?: readonly RecalledTodo[];
}): string;
export declare function createFinalizedMessageTelemetryReporter({ design, db, dataDir, reportedRuns, taskObservationRollout, getAppVersion, report, }: {
    design: any;
    db: unknown;
    dataDir: string;
    reportedRuns: Set<string>;
    taskObservationRollout?: {
        modeForRun(runId: string): 'off' | 'observe' | 'send';
        representationForRun(runId: string): 'single_run' | 'task_pending' | 'task_accepted' | 'task_not_expected';
        beginFinalizeForRun(runId: string): {
            durableTaskTruth: boolean;
            suppressSingleRun: boolean;
            completion: Promise<unknown>;
        };
        finalizeForRun(runId: string): Promise<unknown>;
    };
    getAppVersion?: () => any;
    report?: typeof reportRunCompletedFromDaemon;
}): (saved: any, body?: {}, options?: {}) => void;
export declare function shouldReportRunCompletionTelemetryFallbackStatus(status: unknown, taskOwned?: boolean): boolean;
export declare function createSseResponse(res: any, { keepAliveIntervalMs }?: {
    keepAliveIntervalMs?: number | undefined;
}): {
    /** @param {ChatSseEvent['event'] | ProxySseEvent['event'] | string} event */
    send(event: any, data: any, id?: string | number | null | undefined): boolean;
    writeKeepAlive: () => boolean;
    cleanup: () => void;
    end(): void;
};
export type DesktopPdfExporter = (input: DesktopExportPdfInput) => Promise<DesktopExportPdfResult>;
export type DesktopFrameRenderer = (input: DesktopRenderFramesInput) => Promise<DesktopRenderFramesResult>;
export type DesktopSlideRenderer = (input: DesktopRenderSlidesInput) => Promise<DesktopRenderSlidesResult>;
export type DesktopArtifactExporter = (input: DesktopExportArtifactInput) => Promise<DesktopExportArtifactResult>;
export interface DaemonRuntimeContext {
    namespace: string;
    base: string;
    mode?: string;
    source?: string;
}
export interface StartServerOptions {
    desktopArtifactExporter?: DesktopArtifactExporter | null;
    desktopFrameRenderer?: DesktopFrameRenderer | null;
    desktopPdfExporter?: DesktopPdfExporter | null;
    desktopSlideRenderer?: DesktopSlideRenderer | null;
    host?: string;
    port?: number;
    returnServer?: boolean;
    runtime?: DaemonRuntimeContext | null;
    staticDir?: string;
    /** Opaque child-process environment supplied by the runtime integration seam. */
    inheritedEnvironment?: (baseEnv?: NodeJS.ProcessEnv) => Record<string, string>;
}
export declare function startAmrTerminalReportDeliveryAfterBind(delivery: Pick<AmrTerminalReportDeliveryService, 'start'>, boundPort: number | null): boolean;
export interface StartServerResult {
    url: string;
    server: import('node:http').Server;
    shutdown: () => Promise<void> | void;
    routeInventory: import('./route-registration-guard.js').RouteRegistration[];
}
/** Production callback shared by the registered comment routes and HTTP regression tests. */
export declare function createPersonalPublishedCommentMutationHandler(db: Database.Database): (comment: PreviewComment, context: WorkspaceCollabContext | null, deleted: boolean) => boolean;
export declare function startServer({ port, host, returnServer, desktopPdfExporter, desktopFrameRenderer, desktopSlideRenderer, desktopArtifactExporter, runtime, staticDir, inheritedEnvironment, }?: StartServerOptions): Promise<unknown>;
