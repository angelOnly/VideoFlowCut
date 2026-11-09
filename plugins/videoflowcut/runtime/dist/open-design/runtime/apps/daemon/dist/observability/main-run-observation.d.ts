import { type NormalizedAgentObservationV1, type SafeRunQualityV1, type StrategyInputStageV2 } from '@open-design/contracts';
import { type PromptStackTelemetry } from '../prompt-telemetry.js';
import type { RunTimingAnalytics, RunUsageAnalytics } from '../run-analytics-observability.js';
export interface StructuredMainRunObservationV1Input {
    /**
     * Existing analytics lineage when available. Historical ordinary Runs may
     * predate it; those receive an explicit one-Run compatibility identity.
     */
    taskExecutionId?: string;
    runId: string;
    taskRunIndex: number;
    runtimeSessionId?: string;
    parentObservationId?: string;
    stage: StrategyInputStageV2;
    status: string;
    /** Resolved provider model identifier; emitted only after bounded validation. */
    modelId?: string;
    /** Runtime adapter identifier; emitted only after bounded validation. */
    agentId?: string;
    promptTelemetry?: PromptStackTelemetry;
    usage?: RunUsageAnalytics;
    timing?: RunTimingAnalytics;
    startedAtMs?: number;
    endedAtMs?: number;
    agentCliVersion?: string;
    runtimeCompanionName?: string;
    runtimeCompanionVersion?: string;
    runtimeAdapterVersion?: string;
    /** Safe projection rebuilt from the same durable sources as single-Run telemetry. */
    quality?: SafeRunQualityV1;
}
/**
 * Compatibility adapter for the current top-level Run facts. It deliberately
 * consumes the already-structured Prompt/usage/timing outputs rather than
 * re-parsing runtime text, and it is not wired into the legacy exporter.
 */
export declare function buildStructuredMainRunObservationV1(input: StructuredMainRunObservationV1Input): NormalizedAgentObservationV1;
