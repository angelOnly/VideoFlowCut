import type { TaskTelemetryStatus } from '@open-design/contracts';
import { type OdNextRolloutDecision } from '@open-design/contracts';
import type Database from 'better-sqlite3';
import type { TelemetryPrefs } from '../app-config.js';
import { describeRunTelemetrySink } from '../langfuse-trace.js';
import { summarizeRunTimingAnalytics } from '../run-analytics-observability.js';
import { type RunTelemetryDeliveryStateV1 } from './delivery-state.js';
import { buildStructuredMainRunObservationV1 } from './main-run-observation.js';
import { type TaskObservationExportContextV1 } from './task-observation-aggregation.js';
export type TaskObservationRolloutMode = 'off' | 'observe' | 'send';
export interface TaskObservationRolloutConfig {
    requestedMode: 'auto' | 'off' | 'observe' | 'send' | 'invalid';
    mode: TaskObservationRolloutMode;
    context: TaskObservationExportContextV1 | null;
}
export interface TaskObservationRolloutDiagnostic {
    requestedMode: TaskObservationRolloutConfig['requestedMode'];
    mode: TaskObservationRolloutMode;
    effectiveMode: TaskObservationRolloutMode;
    environment: string | null;
    tag: string | null;
    effectiveSink: ReturnType<typeof describeRunTelemetrySink>;
    taskProtocol: 'none' | 'legacy-v1' | 'otlp-v4';
    readyToSend: boolean;
    schemaReady: boolean;
    blockedReason: 'invalid_mode' | 'mode_not_send' | 'missing_environment_or_tag' | 'missing_sink' | null;
}
interface TaskRunLike {
    id: string;
    projectId?: string | null;
    conversationId?: string | null;
    assistantMessageId?: string | null;
    userPrompt?: string;
    exitCode?: number | null;
    signal?: string | null;
    error?: string | null;
    errorCode?: string | null;
    status: string;
    createdAt: number;
    updatedAt: number;
    events: Array<{
        event: string;
        data: unknown;
        timestamp?: number;
    }>;
    promptTelemetry?: Parameters<typeof buildStructuredMainRunObservationV1>[0]['promptTelemetry'];
    analyticsTelemetry?: Parameters<typeof summarizeRunTimingAnalytics>[0]['telemetry'];
    model?: string | null;
    resolvedModelId?: string | null;
    agentId?: string | null;
    preflightAgentCliVersion?: string | null;
    clientType?: 'desktop' | 'web' | 'unknown';
    langfuseCompletedAt?: number;
    telemetryDelivery?: RunTelemetryDeliveryStateV1;
    strategyRolloutDecision?: OdNextRolloutDecision | null;
    appVersionInfo?: {
        version: string;
        channel: string;
        packaged: boolean;
        platform?: string;
        arch?: string;
    } | null;
}
export interface TaskObservationRolloutResult {
    mode: TaskObservationRolloutMode;
    action: 'compatibility' | 'waiting_for_task_terminal' | 'observed' | 'sent' | 'already_in_flight' | 'already_finalized' | 'not_expected' | 'failed';
    taskExecutionId?: string;
    delivery?: RunTelemetryDeliveryStateV1;
}
export interface TaskObservationRolloutService {
    readonly config: TaskObservationRolloutConfig;
    diagnostic(): TaskObservationRolloutDiagnostic;
    telemetryForRun(runId: string): TaskTelemetryStatus | undefined;
    modeForRun(runId: string): TaskObservationRolloutMode;
    representationForRun(runId: string): 'single_run' | 'task_pending' | 'task_accepted' | 'task_not_expected';
    notExpectedReasonForRun(runId: string): string | null;
    seedRepresentationFromRunFact(runId: string, fact: Pick<TaskRunLike, 'langfuseCompletedAt' | 'telemetryDelivery'>): Promise<void>;
    beginFinalizeForRun(runId: string): TaskObservationFinalizationHandle;
    finalizeForRun(runId: string): Promise<TaskObservationRolloutResult>;
    reconcileCrashWindows(): Promise<number>;
}
export interface TaskObservationFinalizationHandle {
    durableTaskTruth: boolean;
    suppressSingleRun: boolean;
    completion: Promise<TaskObservationRolloutResult>;
}
export interface CreateTaskObservationRolloutServiceOptions {
    db: Database.Database;
    getRun(runId: string): TaskRunLike | null | undefined;
    dataDir?: string;
    readTelemetry(): Promise<{
        prefs: TelemetryPrefs;
        installationId?: string | null;
        appVersionInfo?: {
            version: string;
            channel: string;
            packaged: boolean;
        } | null;
    }>;
    env?: NodeJS.ProcessEnv;
    fetchImpl?: typeof fetch;
    now?: () => number;
    checkpointMappedRun?: (runId: string, reason: string, finalizedAt: number) => void;
}
export declare function readTaskObservationRolloutConfig(env?: NodeJS.ProcessEnv): TaskObservationRolloutConfig;
export declare function migrateTaskObservationRolloutStore(db: Database.Database): void;
export declare function createTaskObservationRolloutService(options: CreateTaskObservationRolloutServiceOptions): TaskObservationRolloutService;
export {};
