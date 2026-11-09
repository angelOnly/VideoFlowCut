import type { RunTerminalLifecycleStatus } from '@open-design/contracts';
import type { TrackingRunCancelOrigin, TrackingRunTerminalIntegrity, TrackingRunTerminalTrigger } from '@open-design/contracts/analytics';
import type { AnalyticsCaptureResult } from '../analytics.js';
export declare const RUN_TERMINAL_LIFECYCLE_VERSION = 1;
export type RunTerminationOrigin = RunTerminalLifecycleStatus['terminationOrigin'];
export type RunTerminalPersistenceResult = RunTerminalLifecycleStatus['terminalPersistence'];
export type RunTerminalPersistenceErrorType = NonNullable<RunTerminalPersistenceResult['errorType']>;
export type RunPosthogDeliveryStateV1 = RunTerminalLifecycleStatus['posthogDelivery'];
export type RunMatureUnfinishedState = RunTerminalLifecycleStatus['unfinishedState'];
export type RunTerminalLifecycleV1 = RunTerminalLifecycleStatus;
export declare function runAttemptForTerminalLifecycle(input: {
    cumulativeRetryAttemptCount?: unknown;
    retryAttemptCount?: unknown;
    manualResumeAttemptCount?: unknown;
}): number;
export declare function boundedRuntimeGenerationId(value: unknown): string | null;
export declare function deriveRunTerminationOrigin(input: {
    cancelOrigin?: TrackingRunCancelOrigin | null;
    terminalTrigger?: TrackingRunTerminalTrigger | null;
}): RunTerminationOrigin;
export declare function terminalPersistenceErrorType(error: unknown): RunTerminalPersistenceErrorType;
export declare function terminalLifecycleSnapshot(input: {
    cumulativeRetryAttemptCount?: unknown;
    retryAttemptCount?: unknown;
    manualResumeAttemptCount?: unknown;
    runtimeGenerationId?: unknown;
    cancelOrigin?: TrackingRunCancelOrigin | null;
    terminalTrigger?: TrackingRunTerminalTrigger | null;
    terminalIntegrity?: TrackingRunTerminalIntegrity | null;
    terminalPersistence: RunTerminalPersistenceResult;
    posthogDelivery?: RunPosthogDeliveryStateV1 | null;
    duplicateTerminalCount?: number;
    lateTerminalCount?: number;
}): RunTerminalLifecycleV1;
export declare function recordIgnoredTerminalClaim(lifecycle: RunTerminalLifecycleV1, kind: 'duplicate' | 'late'): RunTerminalLifecycleV1;
export declare function beginPosthogTerminalDelivery(lifecycle: RunTerminalLifecycleV1): RunTerminalLifecycleV1;
export declare function finalizePosthogTerminalDelivery(lifecycle: RunTerminalLifecycleV1, result: AnalyticsCaptureResult): RunTerminalLifecycleV1;
export declare function terminalLifecycleForPosthogLocalQueue(lifecycle: RunTerminalLifecycleV1): RunTerminalLifecycleV1;
export declare function classifyMatureUnfinishedRun(input: {
    runStatus: 'running' | 'terminal' | 'unknown';
    terminalLifecycle?: RunTerminalLifecycleV1 | null;
}): RunMatureUnfinishedState;
export declare function markTerminalLifecycleReconciled(lifecycle: RunTerminalLifecycleV1, generationId: string): RunTerminalLifecycleV1;
