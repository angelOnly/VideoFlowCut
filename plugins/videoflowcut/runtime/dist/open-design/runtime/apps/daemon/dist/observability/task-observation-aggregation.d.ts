import type { projectTaskTrace } from './task-trace-projection.js';
import { type NormalizedAgentObservationStatusV1, type NormalizedAgentObservationV1, type ObservationUsageValuesV1, type OdNextRolloutDecision, type SafeDeliverableSyntaxTelemetryV1, type StrategyInputStageV2, type StrategySettlementFactsV2 } from '@open-design/contracts';
import type Database from 'better-sqlite3';
import type { EvalContextV2 } from './eval-context.js';
import type { TelemetryPrefs } from '../app-config.js';
import { type StrategyTaskExecutionRecord, type StrategyTaskOutcome } from '../strategies/task-store.js';
import { type RunTelemetryExportExpectation } from './run-exporter.js';
export interface TaskObservationCoverageV1 {
    runs: {
        availability: 'complete' | 'partial';
        expected: number;
        observed: number;
        missingRunIds: string[];
    };
    children: {
        availability: 'complete' | 'partial' | 'unavailable';
        knownObservationCount: number;
        expectedRunCount: number;
        completeRunCount: number;
        partialRunCount: number;
        unavailableRunCount: number;
        explicitZeroRunCount: number;
    };
    prompt: ObservationAvailabilityCountsV1;
    usage: ObservationAvailabilityCountsV1;
    timing: ObservationAvailabilityCountsV1;
}
export interface ObservationAvailabilityCountsV1 {
    complete: number;
    partial: number;
    unavailable: number;
}
export interface KnownUsageSummaryV1 extends ObservationAvailabilityCountsV1 {
    observedObservationCount: number;
    values?: Partial<ObservationUsageValuesV1>;
}
export interface TaskObservationStageTotalV1 {
    stage: StrategyInputStageV2;
    runCount: number;
    runStatuses: NormalizedAgentObservationStatusV1[];
    knownMainRunUsage: KnownUsageSummaryV1;
    knownChildUsage: KnownUsageSummaryV1;
}
export interface StrategyTaskObservationRootV1 {
    observationId: string;
    taskExecutionId: string;
    projectId: string;
    conversationId: string;
    status: StrategyTaskOutcome | 'failed';
    roundSettlements?: Array<{
        runId: string;
        reason: string;
        facts?: StrategySettlementFactsV2;
    }>;
    route: StrategyTaskExecutionRecord['route'];
    executionMode: StrategyTaskExecutionRecord['executionMode'];
    taskType: string | null;
    strategyId: StrategyTaskExecutionRecord['strategyId'];
    strategyVersion: string;
    strategyPackageHash: string;
    snapshotId: string;
    planContractHash: string | null;
    selectedAgentId: string;
    agentCliVersions: string[];
    runtimeCompanionVersions: string[];
    runtimeAdapterVersions: string[];
    rolloutAdmission?: {
        requestedMode: OdNextRolloutDecision['requestedMode'];
        effectiveMode: OdNextRolloutDecision['effectiveMode'];
        primaryReasonCode: string;
        compatibilityBasis: 'local_synthetic_canary' | 'runtime_adapter_family_fixture_evidence';
        admissionStage: 'activation_admission';
    };
    createdAt: number;
    updatedAt: number;
}
declare const SAFE_RUNTIME_VERSION_ATTRIBUTE_KEYS: readonly ['agentCliVersion', 'runtimeCompanionVersion', 'runtimeAdapterVersion'];
export declare function safeTaskObservationRuntimeVersions(observation: NormalizedAgentObservationV1): Partial<Record<typeof SAFE_RUNTIME_VERSION_ATTRIBUTE_KEYS[number], string>>;
export interface StrategyTaskObservationAggregateV1 {
    traceProjection?: ReturnType<typeof projectTaskTrace>;
    schema: 'open-design.strategy-task-observation/v1';
    root: StrategyTaskObservationRootV1;
    observations: NormalizedAgentObservationV1[];
    coverage: TaskObservationCoverageV1;
    stageTotals: TaskObservationStageTotalV1[];
    limitations: string[];
    evaluation?: {
        context: EvalContextV2;
        runs: Array<{
            runId: string;
            context: EvalContextV2;
        }>;
    };
}
export declare const TASK_OBSERVATION_SCHEMA_CAPABILITY_V1: {
    readonly schema: 'open-design.task-observation-schema-capability/v1';
    readonly aggregateSchema: 'open-design.strategy-task-observation/v1';
    readonly normalizedObservationSchema: "open-design.normalized-agent-observation/v1";
    readonly safeRunQualitySchema: "open-design.safe-run-quality/v1";
    readonly safeQualityFields: readonly ['assistant_output', 'error', 'tool_io', 'manifests', 'usage', 'timing'];
};
export interface LegacyTaskObservationExportPlan {
    expectation: RunTelemetryExportExpectation;
    batch: unknown[];
}
export interface TaskObservationExportContextV1 {
    environment: string;
    tag: string;
    installationId?: string | null;
    appVersion?: string;
    appChannel?: string;
    packaged?: boolean;
    clientType?: 'desktop' | 'web' | 'unknown';
}
export declare function canonicalTaskObservationTraceTags(aggregate: StrategyTaskObservationAggregateV1, context?: TaskObservationExportContextV1): string[];
export declare class InvalidTaskObservationAggregateError extends Error {
    constructor(message: string);
}
export declare function strategyTaskRootObservationId(taskExecutionId: string): string;
export declare function strategyTaskRunObservationId(taskExecutionId: string, runId: string): string;
export declare function aggregateStrategyTaskObservations(input: {
    task: StrategyTaskExecutionRecord;
    observations: readonly unknown[];
    taskType?: string;
    strategyRolloutDecision?: OdNextRolloutDecision | null;
}): StrategyTaskObservationAggregateV1;
export declare function aggregateStoredStrategyTaskObservations(input: {
    db: Database.Database;
    taskExecutionId: string;
    observations: readonly unknown[];
}): StrategyTaskObservationAggregateV1;
export declare function safeTaskObservationUsageValues(observation: NormalizedAgentObservationV1): Record<string, number> | undefined;
export declare function safeTaskObservationUsageValueSources(observation: NormalizedAgentObservationV1): Record<string, string> | undefined;
export declare function safeTaskObservationLimitationCodes(limitations: readonly string[]): string[];
/** Plan-owned Build Package ids are observable only when they fit a bounded
 * identifier shape; arbitrary provider attributes never cross the sink. */
export declare function safeTaskObservationBuildPackageId(observation: NormalizedAgentObservationV1): string | undefined;
export declare function safeTaskObservationModelName(observation: NormalizedAgentObservationV1): string | undefined;
export declare function safeTaskObservationAgentId(observation: NormalizedAgentObservationV1): string | undefined;
export declare function safeTaskObservationToolName(observation: NormalizedAgentObservationV1): string | undefined;
export declare function safeTaskObservationToolCallHash(observation: NormalizedAgentObservationV1): string | undefined;
export interface SafeTaskObservationQualityProjectionV1 {
    input?: string;
    output?: string;
    statusMessage?: string;
    metadata: Record<string, unknown>;
}
export declare function deliverableSyntaxFlatMetadata(syntax: SafeDeliverableSyntaxTelemetryV1 | undefined): Record<string, string | number | boolean | null>;
/** Aggregate physical Run counters while keeping the latest terminal status. */
export declare function taskDeliverableSyntaxTelemetry(aggregate: StrategyTaskObservationAggregateV1): SafeDeliverableSyntaxTelemetryV1 | undefined;
/**
 * Resolve the already-validated safe quality payload for one exported
 * observation. Tool I/O is owned by the parent task_run quality projection
 * and joined by the stable raw-call hash, so arbitrary observation attributes
 * never become transport content.
 */
export declare function safeTaskObservationQualityProjection(aggregate: StrategyTaskObservationAggregateV1, observation: NormalizedAgentObservationV1): SafeTaskObservationQualityProjectionV1;
/**
 * Map one protocol-neutral task aggregate to legacy ingestion events.
 *
 * This builder performs no I/O. The caller must pass through the consent/sink
 * plan below before delivery. Inherited Turn copies stay in the exported
 * hierarchy, while their usage is omitted and marked unaccounted so the legacy
 * sink cannot count an owner/exclude pair twice.
 */
export declare function buildLegacyTaskObservationPayload(aggregate: StrategyTaskObservationAggregateV1, context?: TaskObservationExportContextV1): unknown[];
export declare function prepareLegacyTaskObservationExport(input: {
    aggregate: StrategyTaskObservationAggregateV1;
    prefs: TelemetryPrefs;
    hasEffectiveSink: boolean;
    context?: TaskObservationExportContextV1;
}): LegacyTaskObservationExportPlan;
export {};
