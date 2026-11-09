import type Database from 'better-sqlite3';
import { type TrackingRunCancelOrigin, type TrackingRunTerminalTrigger } from '@open-design/contracts/analytics';
import { type RestartRecoverableDurableRunState } from './run-restart-recovery.js';
import { type RunTelemetryDeliveryStateV1 } from '../observability/delivery-state.js';
import { type RunTerminalLifecycleV1 } from '../observability/run-terminal-lifecycle.js';
import { type AppVersionInfo } from '../app-version.js';
interface AnalyticsRecovery {
    context: Record<string, unknown>;
    properties: Record<string, unknown>;
    insertId: string;
    completedAt?: number;
}
interface DurableRunState extends RestartRecoverableDurableRunState, RestartRecoverableDurableRunState {
    schemaVersion: 1;
    id: string;
    projectId: string | null;
    conversationId: string | null;
    assistantMessageId: string | null;
    agentId: string | null;
    appVersionInfo?: AppVersionInfo;
    cancelOrigin?: TrackingRunCancelOrigin | null;
    terminalTrigger?: TrackingRunTerminalTrigger | null;
    createdAt: number;
    artifactCount?: number;
    endedWithUnfinishedWork?: boolean;
    userPrompt?: string;
    model?: string;
    resolvedModelId?: string;
    preflightAgentCliVersion?: string;
    reasoning?: string;
    skillId?: string;
    designSystemId?: string;
    designSystemDigest?: string;
    designSystemSelectionSource?: string;
    clientType?: 'desktop' | 'web' | 'unknown';
    analyticsTelemetry?: Record<string, unknown>;
    promptTelemetry?: Record<string, unknown>;
    promptCache?: Record<string, unknown>;
    analyticsRecovery?: AnalyticsRecovery;
    langfuseCompletedAt?: number;
    telemetryDelivery?: RunTelemetryDeliveryStateV1;
    cumulativeRetryAttemptCount?: number;
    retryAttemptCount?: number;
    manualResumeAttemptCount?: number;
    runtimeGenerationId?: string | null;
    terminalLifecycle?: RunTerminalLifecycleV1;
}
interface AnalyticsLike {
    capture(args: {
        eventName: string;
        context: Record<string, unknown>;
        appVersion: string;
        properties: Record<string, unknown>;
        insertId: string;
    }): unknown | Promise<unknown>;
}
interface ReconciliationOptions {
    analytics: AnalyticsLike;
    appVersion?: string;
    appVersionInfo?: unknown;
    db: Database.Database;
    reportLangfuse(args: Record<string, unknown>): unknown | Promise<unknown>;
    taskObservationModeForRun?: (runId: string) => 'off' | 'observe' | 'send';
    taskObservationRepresentationForRun?: (runId: string) => 'single_run' | 'task_pending' | 'task_accepted' | 'task_not_expected';
    taskObservationNotExpectedReasonForRun?: (runId: string) => string | null;
    seedTaskObservationRunFact?: (runId: string, fact: Pick<DurableRunState, 'langfuseCompletedAt' | 'telemetryDelivery'>) => void | Promise<void>;
    beginTaskObservationForRun?: (runId: string) => {
        suppressSingleRun: boolean;
        completion: Promise<unknown>;
    };
    runsLogDir: string;
    recoverBeforeInterrupt?: (state: DurableRunState, states: ReadonlyMap<string, DurableRunState>, now: number) => Partial<DurableRunState> | null;
    finalizeTerminalLocally?: (run: DurableRunState, status: string, terminalAt: number) => void;
}
export interface RunTerminalReconciliationResult {
    scanned: number;
    interrupted: number;
    messagesReconciled: number;
    strategyTasksReconciled: number;
    analyticsReplayed: number;
    langfuseReplayed: number;
}
export declare function reconcileDurableRunTerminals(options: ReconciliationOptions): Promise<RunTerminalReconciliationResult>;
export {};
