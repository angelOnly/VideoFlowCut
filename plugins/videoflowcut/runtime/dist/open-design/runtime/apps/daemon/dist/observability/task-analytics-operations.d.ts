import type { ObservationUsageValuesV1, StrategyExecutionModeV2, StrategyInputStageV2, StrategyRouteV2, StrategyTaskTypeV2 } from '@open-design/contracts';
import type { ObservationAvailabilityCountsV1, StrategyTaskObservationAggregateV1, TaskObservationExportContextV1 } from './task-observation-aggregation.js';
export declare const TASK_ANALYTICS_REPORT_SCHEMA: 'open-design.task-analytics-report/v1';
export type TaskAnalyticsBucketV1 = StrategyTaskTypeV2 | 'unknown';
export interface TaskAnalyticsRecordV1 {
    aggregate: StrategyTaskObservationAggregateV1;
    context: TaskObservationExportContextV1;
    externalSignals?: {
        feedbackCount?: number;
        blindEvaluationCount?: number;
        defaultCritiqueSkipped?: boolean;
        qualityRegression?: boolean;
    };
}
export interface TaskAnalyticsFilterV1 {
    environments?: string[];
    tags?: string[];
    taskBuckets?: TaskAnalyticsBucketV1[];
    selectedAgentIds?: string[];
    models?: string[];
    strategyVersions?: string[];
    routes?: StrategyRouteV2[];
    executionModes?: StrategyExecutionModeV2[];
    stages?: StrategyInputStageV2[];
}
export interface TaskAnalyticsMetricDefinitionV1 {
    key: string;
    source: 'task_root' | 'normalized_observation' | 'external_signal';
    aggregation: 'count' | 'sum_known' | 'distribution_known' | 'coverage';
    missingness: 'exclude_and_report_coverage' | 'report_unavailable';
    notes: string;
}
export declare const TASK_ANALYTICS_METRIC_DICTIONARY_V1: readonly TaskAnalyticsMetricDefinitionV1[];
/**
 * Reduce already-normalized task facts into an operations-only report. This
 * function performs no I/O, does not read Prompt content, and cannot affect a
 * task outcome or delivery checkpoint.
 */
export declare function buildTaskAnalyticsReportV1(records: readonly TaskAnalyticsRecordV1[], filter?: TaskAnalyticsFilterV1): {
    schema: typeof TASK_ANALYTICS_REPORT_SCHEMA;
    filters: TaskAnalyticsFilterV1;
    taskCount: number;
    dimensions: {
        environments: Record<string, number>;
        tags: Record<string, number>;
        taskBuckets: Record<string, number>;
        outcomes: Record<string, number>;
        routes: Record<string, number>;
        executionModes: Record<string, number>;
        stages: Record<string, number>;
        selectedAgents: Record<string, number>;
        models: Record<string, number>;
        strategyVersions: Record<string, number>;
        usageProvenance: Record<string, number>;
    };
    coverage: {
        runs: {
            expected: number;
            observed: number;
            partialTaskCount: number;
        };
        prompt: ObservationAvailabilityCountsV1;
        timing: ObservationAvailabilityCountsV1;
        mainUsage: ObservationAvailabilityCountsV1;
        childUsage: ObservationAvailabilityCountsV1;
        children: Record<'complete' | 'partial' | 'unavailable', number>;
    };
    knownFacts: {
        mainUsageValues: Partial<Record<keyof ObservationUsageValuesV1, number>>;
        childUsageValues: Partial<Record<keyof ObservationUsageValuesV1, number>>;
        taskWallClockMs: number[];
        childLifecycle: Record<string, number>;
        feedbackCount: number;
        blindEvaluationCount: number;
        defaultCritiqueSkippedCount: number;
        qualityRegressionCount: number;
        externalSignalRecordCount: number;
    };
    unavailableFacts: {
        cost: string;
        ttft: string;
        promptSectionEstimatedTokens: string;
        childEligibility: string;
        childPlanned: string;
        externalQualityWhenMissing: string;
    };
    stopSignalSources: {
        wallClock: 'task_root';
        tokenThreshold: 'known_normalized_usage_only';
        defaultCritique: 'external_signal_only';
        qualityRegression: 'external_signal_only';
    };
    traceLink: {
        exposed: false;
        reason: 'A5_not_approved';
    };
};
