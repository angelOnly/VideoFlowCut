import type { Express, Request, Response } from 'express';
import type Database from 'better-sqlite3';
import type { ToolTokenGrant } from '../tool-tokens.js';
import { type AppliedPluginSnapshot, type ChatRunStatus, type ChatRunStatusResponse } from '@open-design/contracts';
import type { AnalyticsContext } from '../analytics.js';
import type { AuthorizeProjectRequest } from '../collab/project-request-authority.js';
import { type BoundWorkspaceResourceMutationGate, type WorkspaceResourceAccessInput } from '../collab/workspace-resource-mutation.js';
import type { ConnectorService } from '../connectors/service.js';
import { type InternalRunCreateInput, type InternalRunCreationService } from '../services/internal-run-service.js';
import type { FrozenSkillPackageV1 } from '../strategies/od-next/frozen-skill-package.js';
import type { ResolvedExamplePluginRecord } from '../strategies/od-next/example-skill-source.js';
import type { SkillInfo } from '../skills.js';
import { type OdNextTaskInputSnapshotDescriptor } from '../strategies/od-next/task-input-snapshot.js';
import { type OdNextRolloutDecision } from '../strategies/od-next/rollout.js';
import { resolvePluginSnapshot } from '../plugins/index.js';
import { type RunDeliverableValidationResult } from '../run-deliverable-validation.js';
import type { DetectedAgent, RuntimeAgentDef } from '../runtimes/types.js';
import { type RunSteeringRefusal } from '../runtimes/run-steering.js';
import { type RunWorkspaceScope } from '../runtimes/project-amr-trace-env.js';
import { type ChatRun, type JsonRecord, type RunArtifactBaselines, type RunCreatedFallbackInput, type RunProjectKindInput, type RunRetryAnalyticsEvent, type ProjectMetadata, type RunEventRecord } from '../runtimes/chat-run-records.js';
type SqliteDb = Database.Database;
type ApiRequest = Request<Record<string, string>, unknown, JsonRecord>;
type ApiResponse = Response<unknown>;
interface RunCreateMeta extends InternalRunCreateInput, JsonRecord {
    projectId?: string;
    conversationId?: string;
    userMessageId?: string;
    assistantMessageId?: string;
    clientRequestId?: string;
    requestFingerprint?: string;
    strategyRolloutDecision?: OdNextRolloutDecision;
    agentId?: string;
    pluginId?: string;
    appliedPluginSnapshotId?: string;
    message?: string;
    currentPrompt?: string;
    projectMetadata?: ProjectMetadata;
    workspaceScope?: RunWorkspaceScope | null;
    odNextTaskInputSnapshot?: OdNextTaskInputSnapshotDescriptor | null;
}
interface RunListFilters {
    projectId?: unknown;
    conversationId?: unknown;
    status?: unknown;
}
interface ChatRunService {
    create(meta: RunCreateMeta): ChatRun;
    createOrReuse(meta: RunCreateMeta): {
        kind: 'created';
        run: ChatRun;
    } | {
        kind: 'reused';
        run: ChatRun;
    } | {
        kind: 'conflict';
        run: ChatRun;
    };
    prepareRestart(run: ChatRun): ChatRun | null;
    get(id: string): ChatRun | null;
    findByPluginWorkflowId(pluginWorkflowId: string): ChatRun | null;
    list(filters: RunListFilters): ChatRun[];
    statusBody(run: ChatRun): ChatRunStatusResponse;
    stream(run: ChatRun, req: Request, res: Response): void;
    start(run: ChatRun, starter: () => Promise<unknown>): ChatRun;
    fail(run: ChatRun, code: string, message: string): void;
    wait(run: ChatRun): Promise<ChatRunStatusResponse>;
    cancel(run: ChatRun, origin?: NonNullable<ChatRunStatusResponse['cancelOrigin']>): Promise<ChatRunStatusResponse>;
    /**
     * B11 「引导对话」: deliver one more user message into the turn that is still
     * running. `runtimeAccepts` is the caller's `runtimeAcceptsMidTurnInput`
     * verdict for the run's agent def — the runs service owns no agent registry.
     */
    steer(run: ChatRun, text: string, runtimeAccepts: boolean, expectedTurnId?: string, feedbackId?: string): Promise<{
        ok: true;
        backpressure: boolean;
        threadId?: string;
        turnId?: string;
    } | {
        ok: false;
        refusal: RunSteeringRefusal | 'turn_not_ready' | 'turn_mismatch' | 'delivery_unknown' | 'rpc_rejected';
        detail?: string;
    }>;
    /** Undo an optimistically-created run (e.g. a failed ownership claim). */
    drop(run: ChatRun): void;
    /** Persist daemon-owned state assigned during an atomic claim hook. */
    persistState(run: ChatRun): void;
    isTerminal(status: ChatRunStatus): boolean;
    emit?(run: ChatRun, event: string, data: unknown): RunEventRecord;
    setAnalyticsRecovery?(run: ChatRun, recovery: {
        context: AnalyticsContext;
        properties: Record<string, unknown>;
        insertId: string;
    }): void;
    markAnalyticsCompleted?(run: ChatRun): void;
    setDeliverableValidation?(run: ChatRun, result: RunDeliverableValidationResult): void;
}
interface AnalyticsService {
    capture(input: {
        eventName: string;
        context: AnalyticsContext;
        appVersion: string;
        properties: Record<string, unknown>;
        insertId: string;
    }): void | Promise<void>;
}
interface RunRoutesDesignService {
    runs: ChatRunService;
    analytics: AnalyticsService;
    getAppVersion(): string;
}
/**
 * The Skill catalogue a run resolves user-selected Skills from. Same listing
 * the system-prompt composer reads, scoped through
 * `resolveSkillCatalogScope`, so a Skill admitted on one surface is
 * resolvable on the other.
 */
interface RunRoutesSkillCatalogService {
    listAllSkillLikeEntries: (options?: {
        workspaceId?: string | null;
        workspaceMemberId?: string | null;
    }) => Promise<readonly SkillInfo[]>;
}
interface SseResponse {
    send(event: string, data: unknown, id?: number): void;
    end(): void;
    cleanup?(): void;
}
export interface RegisterRunRoutesDeps {
    db: SqliteDb;
    auth?: {
        authorizeToolRequest(req: Request, res: Response, operation: string): ToolTokenGrant | null;
    };
    design: RunRoutesDesignService;
    resources: RunRoutesSkillCatalogService;
    http: {
        createSseResponse: (res: Response) => SseResponse;
        sendApiError: (res: Response, status: number, code: string, message: string, details?: Record<string, unknown>) => Response<unknown> | void;
    };
    paths: {
        BUNDLED_PLUGINS_DIR?: string;
        PROJECTS_DIR: string;
        RUNTIME_DATA_DIR: string;
    };
    agents: {
        detectAgents: (agentCliEnv?: Record<string, unknown>) => Promise<DetectedAgent[]>;
        getAgentDef: (agentId: string) => RuntimeAgentDef | null | undefined;
    };
    chat: {
        startChatRun: (meta: RunCreateMeta, run: ChatRun) => Promise<unknown>;
        prepareOdNextInitialPromptBundle?: (input: {
            meta: RunCreateMeta;
            frozenSkillPackage: FrozenSkillPackageV1;
            taskInputSnapshot: OdNextTaskInputSnapshotDescriptor;
        }) => Promise<{
            text: string;
        }>;
    };
    lifecycle: {
        isDaemonShuttingDown: () => boolean;
    };
    plugins: {
        connectorService: ConnectorService;
        detectSkillPluginCandidateOnRunSuccess: (db: SqliteDb, runs: ChatRunService, run: ChatRun, input: JsonRecord, projectRoot: string) => void;
        firePipelineForRun: (args: {
            run: ChatRun;
            snapshot: AppliedPluginSnapshot;
            runs: ChatRunService;
            db: SqliteDb;
        }) => void;
        loadPluginRegistryView: (options?: {
            workspaceId?: string | null;
            workspaceMemberId?: string | null;
        }) => Promise<Parameters<typeof resolvePluginSnapshot>[0]['registry']>;
        renderPluginBriefTemplate: (template: string, inputs?: Record<string, unknown>) => string;
        /**
         * Exact local catalogue lookup, the same one `/api/plugins/:id/apply-local`
         * and project create use. Run start re-resolves a project's example
         * binding through it instead of trusting the stored path.
         */
        getLocalPluginBySource?: (id: string, source: string) => Promise<ResolvedExamplePluginRecord | null>;
        /**
         * Fail-closed request-scoped plugin lookup. The catalog API and the run
         * API must use the same Workspace/member visibility rules; otherwise a
         * caller can bypass a hidden Personal plugin by posting its id directly
         * to /api/runs.
         */
        authorizePluginRequest?: (req: ApiRequest, res: ApiResponse, pluginId: string) => Promise<boolean>;
    };
    telemetry: {
        taskTelemetryForRun?: (runId: string) => ChatRunStatusResponse['taskTelemetry'];
        reportRunCompletionTelemetryFallback: (input: RunCreatedFallbackInput) => void;
        resolveRunProjectKindForAnalytics: (input: RunProjectKindInput) => string | null;
        runArtifactBaselines: RunArtifactBaselines;
        runRetryEventsForAnalytics: (events: RunEventRecord[]) => RunRetryAnalyticsEvent[];
    };
    messages: {
        pinAssistantMessageOnRunCreate: (db: SqliteDb, run: ChatRun, opts?: {
            status?: string;
            beforeFreshInsert?: () => void;
            beforeClaimCommit?: () => void;
            isRunActive?: (runId: string) => boolean;
        }) => {
            ok: boolean;
            reason?: 'active' | 'scope';
        };
        reconcileAssistantMessageOnRunEnd: (db: SqliteDb, runs: ChatRunService, run: ChatRun) => void;
    };
    /**
     * Process-owned physical Run seam. The composition root supplies one shared
     * instance so non-HTTP coordinators can reuse the exact create/claim/start
     * path. Route-only fixtures may omit it and receive an equivalent local
     * instance around their injected run registry.
     */
    internalRuns?: InternalRunCreationService<RunCreateMeta, ChatRun>;
    /**
     * Workspace-identity gate for POST /api/runs and POST /api/chat — this
     * file's two "create a run" entry points. Until this fix both had ZERO
     * `enforceWorkspace*` coverage: unlike rename/delete/duplicate/writeFiles
     * and comments (all gated per spec 04 §10/§11), any caller who knew a
     * projectId could spawn an agent run against it — including a project
     * bound to a TEAM workspace — with no workspace identity headers at all.
     *
     * Borrows the SAME `enforceWorkspaceProjectMutation` instance
     * `routes/project/index.ts` builds via `createEnforceWorkspaceProjectMutation`
     * (cross-checked against the daemon's own last-known membership) rather
     * than re-deriving a second, possibly-drifting copy here — see
     * `routes/project/comments.ts` for the established borrow-the-project's-
     * gate pattern this mirrors.
     *
     * Optional, and a no-op when omitted, so fixtures that only exercise run
     * creation (most of this file's existing tests, which use plain
     * non-workspace-bound projects) keep compiling and behaving exactly as
     * before — an unbound project's runs were never gated either way, since
     * `enforceWorkspaceResourceMutation` itself passes a `row === null` lookup
     * straight through regardless of ctx.
     */
    enforceWorkspaceProjectMutation?: BoundWorkspaceResourceMutationGate;
    /** Fresh exact authority for run reads/cancel after resolving run.projectId. */
    authorizeProjectRequest?: AuthorizeProjectRequest;
    /**
     * Paired with `enforceWorkspaceProjectMutation` above: the SAME
     * `workspace_projects` binding lookups project's own mutation routes
     * already use, so a run's gate reads the identical row rename/delete/
     * duplicate/comments already check instead of a second query shape.
     */
    projectStore?: {
        getWorkspaceProject: (db: any, workspaceId: string, projectId: string) => WorkspaceResourceAccessInput | null | undefined;
        getWorkspaceProjectByProjectId: (db: any, projectId: string) => (WorkspaceResourceAccessInput & {
            workspaceId?: string | null;
        }) | null | undefined;
        ensureWorkspaceProject?: (db: any, input: Record<string, unknown>) => (WorkspaceResourceAccessInput & {
            workspaceId?: string | null;
        }) | null | undefined;
    };
    amrWorkspaceScope?: {
        isSignedIn: () => boolean | Promise<boolean>;
    };
}
declare function withoutSensitiveRunInput(body: JsonRecord): JsonRecord;
declare function hasCompleteByokOpenCodeConfig(meta: JsonRecord): boolean;
export declare function sendStructuredRunCreateFailure(res: ApiResponse, sendApiError: RegisterRunRoutesDeps['http']['sendApiError'], error: unknown, requestId?: string): Response<unknown> | void;
export declare function registerRunCreateRoute(app: Express, handleRunCreate: (req: ApiRequest, res: ApiResponse) => Promise<unknown>, sendApiError: RegisterRunRoutesDeps['http']['sendApiError']): void;
export declare function registerRunRoutes(app: Express, ctx: RegisterRunRoutesDeps): void;
export declare const __forTestHasCompleteByokOpenCodeConfig: typeof hasCompleteByokOpenCodeConfig;
export declare const __forTestWithoutSensitiveRunInput: typeof withoutSensitiveRunInput;
export {};
