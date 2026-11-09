import { type NormalizedAgentObservationV1, type StrategyInputStageV2 } from '@open-design/contracts';
export declare function mainRunToolObservationId(runId: string, rawToolCallId: string): string;
/**
 * Build safe parent-Agent tool spans from the already-normalized Run event
 * stream shared by every runtime. Tool arguments, results, and raw provider
 * call ids never cross this adapter.
 */
export declare function adaptMainRunToolObservationsV1(input: {
    events: ReadonlyArray<{
        event: string;
        data: unknown;
        timestamp?: number;
    }>;
    taskExecutionId: string;
    runId: string;
    taskRunIndex: number;
    taskRunObservationId: string;
    stage: StrategyInputStageV2;
    agentCliVersion?: string;
    runtimeCompanionVersion?: string;
    runtimeAdapterVersion?: string;
}): NormalizedAgentObservationV1[];
export interface AdaptRuntimeChildObservationsInput {
    events: ReadonlyArray<{
        event: string;
        data: unknown;
    }>;
    taskExecutionId: string;
    runId: string;
    taskRunIndex: number;
    taskRunObservationId: string;
    stage: StrategyInputStageV2;
    agentCliVersion?: string;
    runtimeCompanionVersion?: string;
    /** Tool spans are exporter detail and must not widen complex-production gates. */
    includeChildTools?: boolean;
    /** Exporter-only hierarchy: task Run -> native Agent tool -> Child Agent. */
    mainToolObservationIds?: ReadonlySet<string>;
}
export declare function adaptRuntimeChildObservationsV1(input: AdaptRuntimeChildObservationsInput): import("zod").objectOutputType<{
    schema: import("zod").ZodLiteral<"open-design.normalized-agent-observation/v1">;
    identity: import("zod").ZodEffects<import("zod").ZodObject<{
        observationId: import("zod").ZodString;
        taskExecutionId: import("zod").ZodString;
        runId: import("zod").ZodString;
        taskRunIndex: import("zod").ZodNumber;
        parentObservationId: import("zod").ZodOptional<import("zod").ZodString>;
        runtimeSessionId: import("zod").ZodOptional<import("zod").ZodString>;
    }, "passthrough", import("zod").ZodTypeAny, import("zod").objectOutputType<{
        observationId: import("zod").ZodString;
        taskExecutionId: import("zod").ZodString;
        runId: import("zod").ZodString;
        taskRunIndex: import("zod").ZodNumber;
        parentObservationId: import("zod").ZodOptional<import("zod").ZodString>;
        runtimeSessionId: import("zod").ZodOptional<import("zod").ZodString>;
    }, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{
        observationId: import("zod").ZodString;
        taskExecutionId: import("zod").ZodString;
        runId: import("zod").ZodString;
        taskRunIndex: import("zod").ZodNumber;
        parentObservationId: import("zod").ZodOptional<import("zod").ZodString>;
        runtimeSessionId: import("zod").ZodOptional<import("zod").ZodString>;
    }, import("zod").ZodTypeAny, "passthrough">>, import("zod").objectOutputType<{
        observationId: import("zod").ZodString;
        taskExecutionId: import("zod").ZodString;
        runId: import("zod").ZodString;
        taskRunIndex: import("zod").ZodNumber;
        parentObservationId: import("zod").ZodOptional<import("zod").ZodString>;
        runtimeSessionId: import("zod").ZodOptional<import("zod").ZodString>;
    }, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{
        observationId: import("zod").ZodString;
        taskExecutionId: import("zod").ZodString;
        runId: import("zod").ZodString;
        taskRunIndex: import("zod").ZodNumber;
        parentObservationId: import("zod").ZodOptional<import("zod").ZodString>;
        runtimeSessionId: import("zod").ZodOptional<import("zod").ZodString>;
    }, import("zod").ZodTypeAny, "passthrough">>;
    kind: import("zod").ZodEnum<["task_run", "child_agent", "model_call", "tool"]>;
    stage: import("zod").ZodEnum<["request", "clarification", "contract_repair", "production"]>;
    status: import("zod").ZodEnum<["queued", "running", "completed", "failed", "canceled", "unknown"]>;
    prompt: import("zod").ZodObject<{
        hostComposed: import("zod").ZodEffects<import("zod").ZodObject<{
            availability: import("zod").ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: import("zod").ZodOptional<import("zod").ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: import("zod").ZodOptional<import("zod").ZodString>;
            bytes: import("zod").ZodOptional<import("zod").ZodNumber>;
            safePayload: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
            limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
        }, "passthrough", import("zod").ZodTypeAny, import("zod").objectOutputType<{
            availability: import("zod").ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: import("zod").ZodOptional<import("zod").ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: import("zod").ZodOptional<import("zod").ZodString>;
            bytes: import("zod").ZodOptional<import("zod").ZodNumber>;
            safePayload: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
            limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
        }, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{
            availability: import("zod").ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: import("zod").ZodOptional<import("zod").ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: import("zod").ZodOptional<import("zod").ZodString>;
            bytes: import("zod").ZodOptional<import("zod").ZodNumber>;
            safePayload: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
            limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
        }, import("zod").ZodTypeAny, "passthrough">>, import("zod").objectOutputType<{
            availability: import("zod").ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: import("zod").ZodOptional<import("zod").ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: import("zod").ZodOptional<import("zod").ZodString>;
            bytes: import("zod").ZodOptional<import("zod").ZodNumber>;
            safePayload: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
            limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
        }, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{
            availability: import("zod").ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: import("zod").ZodOptional<import("zod").ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: import("zod").ZodOptional<import("zod").ZodString>;
            bytes: import("zod").ZodOptional<import("zod").ZodNumber>;
            safePayload: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
            limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
        }, import("zod").ZodTypeAny, "passthrough">>;
        childInjected: import("zod").ZodEffects<import("zod").ZodObject<{
            availability: import("zod").ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: import("zod").ZodOptional<import("zod").ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: import("zod").ZodOptional<import("zod").ZodString>;
            bytes: import("zod").ZodOptional<import("zod").ZodNumber>;
            safePayload: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
            limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
        }, "passthrough", import("zod").ZodTypeAny, import("zod").objectOutputType<{
            availability: import("zod").ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: import("zod").ZodOptional<import("zod").ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: import("zod").ZodOptional<import("zod").ZodString>;
            bytes: import("zod").ZodOptional<import("zod").ZodNumber>;
            safePayload: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
            limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
        }, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{
            availability: import("zod").ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: import("zod").ZodOptional<import("zod").ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: import("zod").ZodOptional<import("zod").ZodString>;
            bytes: import("zod").ZodOptional<import("zod").ZodNumber>;
            safePayload: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
            limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
        }, import("zod").ZodTypeAny, "passthrough">>, import("zod").objectOutputType<{
            availability: import("zod").ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: import("zod").ZodOptional<import("zod").ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: import("zod").ZodOptional<import("zod").ZodString>;
            bytes: import("zod").ZodOptional<import("zod").ZodNumber>;
            safePayload: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
            limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
        }, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{
            availability: import("zod").ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: import("zod").ZodOptional<import("zod").ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: import("zod").ZodOptional<import("zod").ZodString>;
            bytes: import("zod").ZodOptional<import("zod").ZodNumber>;
            safePayload: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
            limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
        }, import("zod").ZodTypeAny, "passthrough">>;
        agentEffectiveContext: import("zod").ZodEffects<import("zod").ZodObject<{
            availability: import("zod").ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: import("zod").ZodOptional<import("zod").ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: import("zod").ZodOptional<import("zod").ZodString>;
            bytes: import("zod").ZodOptional<import("zod").ZodNumber>;
            safePayload: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
            limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
        }, "passthrough", import("zod").ZodTypeAny, import("zod").objectOutputType<{
            availability: import("zod").ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: import("zod").ZodOptional<import("zod").ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: import("zod").ZodOptional<import("zod").ZodString>;
            bytes: import("zod").ZodOptional<import("zod").ZodNumber>;
            safePayload: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
            limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
        }, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{
            availability: import("zod").ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: import("zod").ZodOptional<import("zod").ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: import("zod").ZodOptional<import("zod").ZodString>;
            bytes: import("zod").ZodOptional<import("zod").ZodNumber>;
            safePayload: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
            limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
        }, import("zod").ZodTypeAny, "passthrough">>, import("zod").objectOutputType<{
            availability: import("zod").ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: import("zod").ZodOptional<import("zod").ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: import("zod").ZodOptional<import("zod").ZodString>;
            bytes: import("zod").ZodOptional<import("zod").ZodNumber>;
            safePayload: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
            limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
        }, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{
            availability: import("zod").ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: import("zod").ZodOptional<import("zod").ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: import("zod").ZodOptional<import("zod").ZodString>;
            bytes: import("zod").ZodOptional<import("zod").ZodNumber>;
            safePayload: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
            limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
        }, import("zod").ZodTypeAny, "passthrough">>;
    }, "passthrough", import("zod").ZodTypeAny, import("zod").objectOutputType<{
        hostComposed: import("zod").ZodEffects<import("zod").ZodObject<{
            availability: import("zod").ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: import("zod").ZodOptional<import("zod").ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: import("zod").ZodOptional<import("zod").ZodString>;
            bytes: import("zod").ZodOptional<import("zod").ZodNumber>;
            safePayload: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
            limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
        }, "passthrough", import("zod").ZodTypeAny, import("zod").objectOutputType<{
            availability: import("zod").ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: import("zod").ZodOptional<import("zod").ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: import("zod").ZodOptional<import("zod").ZodString>;
            bytes: import("zod").ZodOptional<import("zod").ZodNumber>;
            safePayload: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
            limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
        }, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{
            availability: import("zod").ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: import("zod").ZodOptional<import("zod").ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: import("zod").ZodOptional<import("zod").ZodString>;
            bytes: import("zod").ZodOptional<import("zod").ZodNumber>;
            safePayload: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
            limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
        }, import("zod").ZodTypeAny, "passthrough">>, import("zod").objectOutputType<{
            availability: import("zod").ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: import("zod").ZodOptional<import("zod").ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: import("zod").ZodOptional<import("zod").ZodString>;
            bytes: import("zod").ZodOptional<import("zod").ZodNumber>;
            safePayload: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
            limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
        }, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{
            availability: import("zod").ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: import("zod").ZodOptional<import("zod").ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: import("zod").ZodOptional<import("zod").ZodString>;
            bytes: import("zod").ZodOptional<import("zod").ZodNumber>;
            safePayload: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
            limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
        }, import("zod").ZodTypeAny, "passthrough">>;
        childInjected: import("zod").ZodEffects<import("zod").ZodObject<{
            availability: import("zod").ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: import("zod").ZodOptional<import("zod").ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: import("zod").ZodOptional<import("zod").ZodString>;
            bytes: import("zod").ZodOptional<import("zod").ZodNumber>;
            safePayload: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
            limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
        }, "passthrough", import("zod").ZodTypeAny, import("zod").objectOutputType<{
            availability: import("zod").ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: import("zod").ZodOptional<import("zod").ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: import("zod").ZodOptional<import("zod").ZodString>;
            bytes: import("zod").ZodOptional<import("zod").ZodNumber>;
            safePayload: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
            limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
        }, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{
            availability: import("zod").ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: import("zod").ZodOptional<import("zod").ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: import("zod").ZodOptional<import("zod").ZodString>;
            bytes: import("zod").ZodOptional<import("zod").ZodNumber>;
            safePayload: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
            limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
        }, import("zod").ZodTypeAny, "passthrough">>, import("zod").objectOutputType<{
            availability: import("zod").ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: import("zod").ZodOptional<import("zod").ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: import("zod").ZodOptional<import("zod").ZodString>;
            bytes: import("zod").ZodOptional<import("zod").ZodNumber>;
            safePayload: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
            limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
        }, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{
            availability: import("zod").ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: import("zod").ZodOptional<import("zod").ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: import("zod").ZodOptional<import("zod").ZodString>;
            bytes: import("zod").ZodOptional<import("zod").ZodNumber>;
            safePayload: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
            limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
        }, import("zod").ZodTypeAny, "passthrough">>;
        agentEffectiveContext: import("zod").ZodEffects<import("zod").ZodObject<{
            availability: import("zod").ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: import("zod").ZodOptional<import("zod").ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: import("zod").ZodOptional<import("zod").ZodString>;
            bytes: import("zod").ZodOptional<import("zod").ZodNumber>;
            safePayload: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
            limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
        }, "passthrough", import("zod").ZodTypeAny, import("zod").objectOutputType<{
            availability: import("zod").ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: import("zod").ZodOptional<import("zod").ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: import("zod").ZodOptional<import("zod").ZodString>;
            bytes: import("zod").ZodOptional<import("zod").ZodNumber>;
            safePayload: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
            limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
        }, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{
            availability: import("zod").ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: import("zod").ZodOptional<import("zod").ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: import("zod").ZodOptional<import("zod").ZodString>;
            bytes: import("zod").ZodOptional<import("zod").ZodNumber>;
            safePayload: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
            limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
        }, import("zod").ZodTypeAny, "passthrough">>, import("zod").objectOutputType<{
            availability: import("zod").ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: import("zod").ZodOptional<import("zod").ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: import("zod").ZodOptional<import("zod").ZodString>;
            bytes: import("zod").ZodOptional<import("zod").ZodNumber>;
            safePayload: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
            limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
        }, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{
            availability: import("zod").ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: import("zod").ZodOptional<import("zod").ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: import("zod").ZodOptional<import("zod").ZodString>;
            bytes: import("zod").ZodOptional<import("zod").ZodNumber>;
            safePayload: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
            limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
        }, import("zod").ZodTypeAny, "passthrough">>;
    }, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{
        hostComposed: import("zod").ZodEffects<import("zod").ZodObject<{
            availability: import("zod").ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: import("zod").ZodOptional<import("zod").ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: import("zod").ZodOptional<import("zod").ZodString>;
            bytes: import("zod").ZodOptional<import("zod").ZodNumber>;
            safePayload: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
            limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
        }, "passthrough", import("zod").ZodTypeAny, import("zod").objectOutputType<{
            availability: import("zod").ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: import("zod").ZodOptional<import("zod").ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: import("zod").ZodOptional<import("zod").ZodString>;
            bytes: import("zod").ZodOptional<import("zod").ZodNumber>;
            safePayload: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
            limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
        }, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{
            availability: import("zod").ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: import("zod").ZodOptional<import("zod").ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: import("zod").ZodOptional<import("zod").ZodString>;
            bytes: import("zod").ZodOptional<import("zod").ZodNumber>;
            safePayload: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
            limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
        }, import("zod").ZodTypeAny, "passthrough">>, import("zod").objectOutputType<{
            availability: import("zod").ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: import("zod").ZodOptional<import("zod").ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: import("zod").ZodOptional<import("zod").ZodString>;
            bytes: import("zod").ZodOptional<import("zod").ZodNumber>;
            safePayload: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
            limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
        }, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{
            availability: import("zod").ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: import("zod").ZodOptional<import("zod").ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: import("zod").ZodOptional<import("zod").ZodString>;
            bytes: import("zod").ZodOptional<import("zod").ZodNumber>;
            safePayload: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
            limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
        }, import("zod").ZodTypeAny, "passthrough">>;
        childInjected: import("zod").ZodEffects<import("zod").ZodObject<{
            availability: import("zod").ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: import("zod").ZodOptional<import("zod").ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: import("zod").ZodOptional<import("zod").ZodString>;
            bytes: import("zod").ZodOptional<import("zod").ZodNumber>;
            safePayload: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
            limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
        }, "passthrough", import("zod").ZodTypeAny, import("zod").objectOutputType<{
            availability: import("zod").ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: import("zod").ZodOptional<import("zod").ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: import("zod").ZodOptional<import("zod").ZodString>;
            bytes: import("zod").ZodOptional<import("zod").ZodNumber>;
            safePayload: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
            limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
        }, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{
            availability: import("zod").ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: import("zod").ZodOptional<import("zod").ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: import("zod").ZodOptional<import("zod").ZodString>;
            bytes: import("zod").ZodOptional<import("zod").ZodNumber>;
            safePayload: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
            limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
        }, import("zod").ZodTypeAny, "passthrough">>, import("zod").objectOutputType<{
            availability: import("zod").ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: import("zod").ZodOptional<import("zod").ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: import("zod").ZodOptional<import("zod").ZodString>;
            bytes: import("zod").ZodOptional<import("zod").ZodNumber>;
            safePayload: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
            limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
        }, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{
            availability: import("zod").ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: import("zod").ZodOptional<import("zod").ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: import("zod").ZodOptional<import("zod").ZodString>;
            bytes: import("zod").ZodOptional<import("zod").ZodNumber>;
            safePayload: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
            limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
        }, import("zod").ZodTypeAny, "passthrough">>;
        agentEffectiveContext: import("zod").ZodEffects<import("zod").ZodObject<{
            availability: import("zod").ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: import("zod").ZodOptional<import("zod").ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: import("zod").ZodOptional<import("zod").ZodString>;
            bytes: import("zod").ZodOptional<import("zod").ZodNumber>;
            safePayload: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
            limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
        }, "passthrough", import("zod").ZodTypeAny, import("zod").objectOutputType<{
            availability: import("zod").ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: import("zod").ZodOptional<import("zod").ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: import("zod").ZodOptional<import("zod").ZodString>;
            bytes: import("zod").ZodOptional<import("zod").ZodNumber>;
            safePayload: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
            limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
        }, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{
            availability: import("zod").ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: import("zod").ZodOptional<import("zod").ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: import("zod").ZodOptional<import("zod").ZodString>;
            bytes: import("zod").ZodOptional<import("zod").ZodNumber>;
            safePayload: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
            limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
        }, import("zod").ZodTypeAny, "passthrough">>, import("zod").objectOutputType<{
            availability: import("zod").ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: import("zod").ZodOptional<import("zod").ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: import("zod").ZodOptional<import("zod").ZodString>;
            bytes: import("zod").ZodOptional<import("zod").ZodNumber>;
            safePayload: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
            limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
        }, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{
            availability: import("zod").ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: import("zod").ZodOptional<import("zod").ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: import("zod").ZodOptional<import("zod").ZodString>;
            bytes: import("zod").ZodOptional<import("zod").ZodNumber>;
            safePayload: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
            limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
        }, import("zod").ZodTypeAny, "passthrough">>;
    }, import("zod").ZodTypeAny, "passthrough">>;
    usage: import("zod").ZodEffects<import("zod").ZodObject<{
        availability: import("zod").ZodEnum<["complete", "partial", "unavailable"]>;
        source: import("zod").ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>;
        accountingMode: import("zod").ZodEnum<["inclusive", "additive", "unknown"]>;
        values: import("zod").ZodOptional<import("zod").ZodEffects<import("zod").ZodObject<{
            inputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            effectiveInputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            outputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            totalTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            thoughtTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            cacheReadTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            cacheWriteTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            uncachedInputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            estimatedContextTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
        }, "passthrough", import("zod").ZodTypeAny, import("zod").objectOutputType<{
            inputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            effectiveInputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            outputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            totalTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            thoughtTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            cacheReadTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            cacheWriteTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            uncachedInputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            estimatedContextTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
        }, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{
            inputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            effectiveInputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            outputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            totalTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            thoughtTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            cacheReadTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            cacheWriteTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            uncachedInputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            estimatedContextTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
        }, import("zod").ZodTypeAny, "passthrough">>, import("zod").objectOutputType<{
            inputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            effectiveInputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            outputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            totalTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            thoughtTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            cacheReadTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            cacheWriteTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            uncachedInputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            estimatedContextTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
        }, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{
            inputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            effectiveInputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            outputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            totalTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            thoughtTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            cacheReadTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            cacheWriteTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            uncachedInputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            estimatedContextTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
        }, import("zod").ZodTypeAny, "passthrough">>>;
        valueSources: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>>;
        limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
    }, "passthrough", import("zod").ZodTypeAny, import("zod").objectOutputType<{
        availability: import("zod").ZodEnum<["complete", "partial", "unavailable"]>;
        source: import("zod").ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>;
        accountingMode: import("zod").ZodEnum<["inclusive", "additive", "unknown"]>;
        values: import("zod").ZodOptional<import("zod").ZodEffects<import("zod").ZodObject<{
            inputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            effectiveInputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            outputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            totalTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            thoughtTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            cacheReadTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            cacheWriteTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            uncachedInputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            estimatedContextTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
        }, "passthrough", import("zod").ZodTypeAny, import("zod").objectOutputType<{
            inputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            effectiveInputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            outputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            totalTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            thoughtTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            cacheReadTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            cacheWriteTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            uncachedInputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            estimatedContextTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
        }, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{
            inputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            effectiveInputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            outputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            totalTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            thoughtTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            cacheReadTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            cacheWriteTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            uncachedInputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            estimatedContextTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
        }, import("zod").ZodTypeAny, "passthrough">>, import("zod").objectOutputType<{
            inputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            effectiveInputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            outputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            totalTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            thoughtTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            cacheReadTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            cacheWriteTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            uncachedInputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            estimatedContextTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
        }, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{
            inputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            effectiveInputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            outputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            totalTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            thoughtTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            cacheReadTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            cacheWriteTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            uncachedInputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            estimatedContextTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
        }, import("zod").ZodTypeAny, "passthrough">>>;
        valueSources: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>>;
        limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
    }, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{
        availability: import("zod").ZodEnum<["complete", "partial", "unavailable"]>;
        source: import("zod").ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>;
        accountingMode: import("zod").ZodEnum<["inclusive", "additive", "unknown"]>;
        values: import("zod").ZodOptional<import("zod").ZodEffects<import("zod").ZodObject<{
            inputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            effectiveInputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            outputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            totalTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            thoughtTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            cacheReadTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            cacheWriteTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            uncachedInputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            estimatedContextTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
        }, "passthrough", import("zod").ZodTypeAny, import("zod").objectOutputType<{
            inputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            effectiveInputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            outputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            totalTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            thoughtTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            cacheReadTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            cacheWriteTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            uncachedInputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            estimatedContextTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
        }, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{
            inputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            effectiveInputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            outputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            totalTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            thoughtTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            cacheReadTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            cacheWriteTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            uncachedInputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            estimatedContextTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
        }, import("zod").ZodTypeAny, "passthrough">>, import("zod").objectOutputType<{
            inputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            effectiveInputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            outputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            totalTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            thoughtTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            cacheReadTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            cacheWriteTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            uncachedInputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            estimatedContextTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
        }, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{
            inputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            effectiveInputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            outputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            totalTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            thoughtTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            cacheReadTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            cacheWriteTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            uncachedInputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            estimatedContextTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
        }, import("zod").ZodTypeAny, "passthrough">>>;
        valueSources: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>>;
        limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
    }, import("zod").ZodTypeAny, "passthrough">>, import("zod").objectOutputType<{
        availability: import("zod").ZodEnum<["complete", "partial", "unavailable"]>;
        source: import("zod").ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>;
        accountingMode: import("zod").ZodEnum<["inclusive", "additive", "unknown"]>;
        values: import("zod").ZodOptional<import("zod").ZodEffects<import("zod").ZodObject<{
            inputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            effectiveInputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            outputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            totalTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            thoughtTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            cacheReadTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            cacheWriteTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            uncachedInputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            estimatedContextTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
        }, "passthrough", import("zod").ZodTypeAny, import("zod").objectOutputType<{
            inputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            effectiveInputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            outputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            totalTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            thoughtTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            cacheReadTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            cacheWriteTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            uncachedInputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            estimatedContextTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
        }, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{
            inputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            effectiveInputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            outputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            totalTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            thoughtTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            cacheReadTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            cacheWriteTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            uncachedInputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            estimatedContextTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
        }, import("zod").ZodTypeAny, "passthrough">>, import("zod").objectOutputType<{
            inputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            effectiveInputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            outputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            totalTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            thoughtTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            cacheReadTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            cacheWriteTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            uncachedInputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            estimatedContextTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
        }, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{
            inputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            effectiveInputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            outputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            totalTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            thoughtTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            cacheReadTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            cacheWriteTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            uncachedInputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            estimatedContextTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
        }, import("zod").ZodTypeAny, "passthrough">>>;
        valueSources: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>>;
        limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
    }, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{
        availability: import("zod").ZodEnum<["complete", "partial", "unavailable"]>;
        source: import("zod").ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>;
        accountingMode: import("zod").ZodEnum<["inclusive", "additive", "unknown"]>;
        values: import("zod").ZodOptional<import("zod").ZodEffects<import("zod").ZodObject<{
            inputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            effectiveInputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            outputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            totalTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            thoughtTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            cacheReadTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            cacheWriteTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            uncachedInputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            estimatedContextTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
        }, "passthrough", import("zod").ZodTypeAny, import("zod").objectOutputType<{
            inputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            effectiveInputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            outputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            totalTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            thoughtTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            cacheReadTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            cacheWriteTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            uncachedInputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            estimatedContextTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
        }, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{
            inputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            effectiveInputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            outputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            totalTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            thoughtTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            cacheReadTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            cacheWriteTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            uncachedInputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            estimatedContextTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
        }, import("zod").ZodTypeAny, "passthrough">>, import("zod").objectOutputType<{
            inputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            effectiveInputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            outputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            totalTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            thoughtTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            cacheReadTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            cacheWriteTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            uncachedInputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            estimatedContextTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
        }, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{
            inputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            effectiveInputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            outputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            totalTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            thoughtTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            cacheReadTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            cacheWriteTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            uncachedInputTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            estimatedContextTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
        }, import("zod").ZodTypeAny, "passthrough">>>;
        valueSources: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>>;
        limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
    }, import("zod").ZodTypeAny, "passthrough">>;
    timing: import("zod").ZodEffects<import("zod").ZodObject<{
        availability: import("zod").ZodEnum<["complete", "partial", "unavailable"]>;
        evidence: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodEffects<import("zod").ZodObject<{
            source: import("zod").ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: import("zod").ZodString;
            startedAtMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            endedAtMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            durationMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            measurements: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodNumber>>;
            limitations: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString, "many">>;
        }, "passthrough", import("zod").ZodTypeAny, import("zod").objectOutputType<{
            source: import("zod").ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: import("zod").ZodString;
            startedAtMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            endedAtMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            durationMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            measurements: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodNumber>>;
            limitations: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString, "many">>;
        }, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{
            source: import("zod").ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: import("zod").ZodString;
            startedAtMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            endedAtMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            durationMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            measurements: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodNumber>>;
            limitations: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString, "many">>;
        }, import("zod").ZodTypeAny, "passthrough">>, import("zod").objectOutputType<{
            source: import("zod").ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: import("zod").ZodString;
            startedAtMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            endedAtMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            durationMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            measurements: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodNumber>>;
            limitations: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString, "many">>;
        }, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{
            source: import("zod").ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: import("zod").ZodString;
            startedAtMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            endedAtMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            durationMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            measurements: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodNumber>>;
            limitations: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString, "many">>;
        }, import("zod").ZodTypeAny, "passthrough">>, "many">>;
        limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
    }, "passthrough", import("zod").ZodTypeAny, import("zod").objectOutputType<{
        availability: import("zod").ZodEnum<["complete", "partial", "unavailable"]>;
        evidence: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodEffects<import("zod").ZodObject<{
            source: import("zod").ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: import("zod").ZodString;
            startedAtMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            endedAtMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            durationMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            measurements: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodNumber>>;
            limitations: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString, "many">>;
        }, "passthrough", import("zod").ZodTypeAny, import("zod").objectOutputType<{
            source: import("zod").ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: import("zod").ZodString;
            startedAtMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            endedAtMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            durationMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            measurements: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodNumber>>;
            limitations: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString, "many">>;
        }, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{
            source: import("zod").ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: import("zod").ZodString;
            startedAtMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            endedAtMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            durationMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            measurements: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodNumber>>;
            limitations: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString, "many">>;
        }, import("zod").ZodTypeAny, "passthrough">>, import("zod").objectOutputType<{
            source: import("zod").ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: import("zod").ZodString;
            startedAtMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            endedAtMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            durationMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            measurements: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodNumber>>;
            limitations: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString, "many">>;
        }, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{
            source: import("zod").ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: import("zod").ZodString;
            startedAtMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            endedAtMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            durationMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            measurements: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodNumber>>;
            limitations: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString, "many">>;
        }, import("zod").ZodTypeAny, "passthrough">>, "many">>;
        limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
    }, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{
        availability: import("zod").ZodEnum<["complete", "partial", "unavailable"]>;
        evidence: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodEffects<import("zod").ZodObject<{
            source: import("zod").ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: import("zod").ZodString;
            startedAtMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            endedAtMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            durationMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            measurements: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodNumber>>;
            limitations: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString, "many">>;
        }, "passthrough", import("zod").ZodTypeAny, import("zod").objectOutputType<{
            source: import("zod").ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: import("zod").ZodString;
            startedAtMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            endedAtMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            durationMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            measurements: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodNumber>>;
            limitations: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString, "many">>;
        }, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{
            source: import("zod").ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: import("zod").ZodString;
            startedAtMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            endedAtMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            durationMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            measurements: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodNumber>>;
            limitations: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString, "many">>;
        }, import("zod").ZodTypeAny, "passthrough">>, import("zod").objectOutputType<{
            source: import("zod").ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: import("zod").ZodString;
            startedAtMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            endedAtMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            durationMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            measurements: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodNumber>>;
            limitations: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString, "many">>;
        }, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{
            source: import("zod").ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: import("zod").ZodString;
            startedAtMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            endedAtMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            durationMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            measurements: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodNumber>>;
            limitations: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString, "many">>;
        }, import("zod").ZodTypeAny, "passthrough">>, "many">>;
        limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
    }, import("zod").ZodTypeAny, "passthrough">>, import("zod").objectOutputType<{
        availability: import("zod").ZodEnum<["complete", "partial", "unavailable"]>;
        evidence: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodEffects<import("zod").ZodObject<{
            source: import("zod").ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: import("zod").ZodString;
            startedAtMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            endedAtMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            durationMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            measurements: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodNumber>>;
            limitations: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString, "many">>;
        }, "passthrough", import("zod").ZodTypeAny, import("zod").objectOutputType<{
            source: import("zod").ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: import("zod").ZodString;
            startedAtMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            endedAtMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            durationMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            measurements: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodNumber>>;
            limitations: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString, "many">>;
        }, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{
            source: import("zod").ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: import("zod").ZodString;
            startedAtMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            endedAtMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            durationMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            measurements: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodNumber>>;
            limitations: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString, "many">>;
        }, import("zod").ZodTypeAny, "passthrough">>, import("zod").objectOutputType<{
            source: import("zod").ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: import("zod").ZodString;
            startedAtMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            endedAtMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            durationMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            measurements: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodNumber>>;
            limitations: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString, "many">>;
        }, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{
            source: import("zod").ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: import("zod").ZodString;
            startedAtMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            endedAtMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            durationMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            measurements: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodNumber>>;
            limitations: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString, "many">>;
        }, import("zod").ZodTypeAny, "passthrough">>, "many">>;
        limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
    }, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{
        availability: import("zod").ZodEnum<["complete", "partial", "unavailable"]>;
        evidence: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodEffects<import("zod").ZodObject<{
            source: import("zod").ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: import("zod").ZodString;
            startedAtMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            endedAtMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            durationMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            measurements: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodNumber>>;
            limitations: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString, "many">>;
        }, "passthrough", import("zod").ZodTypeAny, import("zod").objectOutputType<{
            source: import("zod").ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: import("zod").ZodString;
            startedAtMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            endedAtMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            durationMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            measurements: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodNumber>>;
            limitations: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString, "many">>;
        }, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{
            source: import("zod").ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: import("zod").ZodString;
            startedAtMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            endedAtMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            durationMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            measurements: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodNumber>>;
            limitations: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString, "many">>;
        }, import("zod").ZodTypeAny, "passthrough">>, import("zod").objectOutputType<{
            source: import("zod").ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: import("zod").ZodString;
            startedAtMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            endedAtMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            durationMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            measurements: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodNumber>>;
            limitations: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString, "many">>;
        }, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{
            source: import("zod").ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: import("zod").ZodString;
            startedAtMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            endedAtMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            durationMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            measurements: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodNumber>>;
            limitations: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString, "many">>;
        }, import("zod").ZodTypeAny, "passthrough">>, "many">>;
        limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
    }, import("zod").ZodTypeAny, "passthrough">>;
    childEvidenceCoverage: import("zod").ZodOptional<import("zod").ZodEffects<import("zod").ZodObject<{
        availability: import("zod").ZodEnum<["complete", "partial", "unavailable"]>;
        source: import("zod").ZodString;
        knownChildCount: import("zod").ZodNumber;
        explicitZero: import("zod").ZodBoolean;
        limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
        diagnosticCounts: import("zod").ZodArray<import("zod").ZodObject<{
            code: import("zod").ZodString;
            count: import("zod").ZodNumber;
        }, "strict", import("zod").ZodTypeAny, {
            code: string;
            count: number;
        }, {
            code: string;
            count: number;
        }>, "many">;
    }, "strict", import("zod").ZodTypeAny, {
        availability: "complete" | "partial" | "unavailable";
        source: string;
        knownChildCount: number;
        explicitZero: boolean;
        limitations: string[];
        diagnosticCounts: {
            code: string;
            count: number;
        }[];
    }, {
        availability: "complete" | "partial" | "unavailable";
        source: string;
        knownChildCount: number;
        explicitZero: boolean;
        limitations: string[];
        diagnosticCounts: {
            code: string;
            count: number;
        }[];
    }>, {
        availability: "complete" | "partial" | "unavailable";
        source: string;
        knownChildCount: number;
        explicitZero: boolean;
        limitations: string[];
        diagnosticCounts: {
            code: string;
            count: number;
        }[];
    }, {
        availability: "complete" | "partial" | "unavailable";
        source: string;
        knownChildCount: number;
        explicitZero: boolean;
        limitations: string[];
        diagnosticCounts: {
            code: string;
            count: number;
        }[];
    }>>;
    turnAccounting: import("zod").ZodOptional<import("zod").ZodObject<{
        turnId: import("zod").ZodString;
        disposition: import("zod").ZodEnum<["owner", "exclude_inherited"]>;
        ownerObservationId: import("zod").ZodString;
    }, "passthrough", import("zod").ZodTypeAny, import("zod").objectOutputType<{
        turnId: import("zod").ZodString;
        disposition: import("zod").ZodEnum<["owner", "exclude_inherited"]>;
        ownerObservationId: import("zod").ZodString;
    }, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{
        turnId: import("zod").ZodString;
        disposition: import("zod").ZodEnum<["owner", "exclude_inherited"]>;
        ownerObservationId: import("zod").ZodString;
    }, import("zod").ZodTypeAny, "passthrough">>>;
    quality: import("zod").ZodOptional<import("zod").ZodObject<{
        schema: import("zod").ZodLiteral<"open-design.safe-run-quality/v1">;
        result: import("zod").ZodOptional<import("zod").ZodObject<{
            output: import("zod").ZodOptional<import("zod").ZodObject<{
                text: import("zod").ZodString;
                redacted: import("zod").ZodLiteral<true>;
                truncated: import("zod").ZodBoolean;
            }, "strict", import("zod").ZodTypeAny, {
                text: string;
                redacted: true;
                truncated: boolean;
            }, {
                text: string;
                redacted: true;
                truncated: boolean;
            }>>;
            error: import("zod").ZodOptional<import("zod").ZodObject<{
                message: import("zod").ZodOptional<import("zod").ZodObject<{
                    text: import("zod").ZodString;
                    redacted: import("zod").ZodLiteral<true>;
                    truncated: import("zod").ZodBoolean;
                }, "strict", import("zod").ZodTypeAny, {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                }, {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                }>>;
                code: import("zod").ZodOptional<import("zod").ZodString>;
                category: import("zod").ZodOptional<import("zod").ZodString>;
                detail: import("zod").ZodOptional<import("zod").ZodString>;
                stage: import("zod").ZodOptional<import("zod").ZodString>;
            }, "strict", import("zod").ZodTypeAny, {
                message?: {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                } | undefined;
                code?: string | undefined;
                category?: string | undefined;
                detail?: string | undefined;
                stage?: string | undefined;
            }, {
                message?: {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                } | undefined;
                code?: string | undefined;
                category?: string | undefined;
                detail?: string | undefined;
                stage?: string | undefined;
            }>>;
        }, "strict", import("zod").ZodTypeAny, {
            output?: {
                text: string;
                redacted: true;
                truncated: boolean;
            } | undefined;
            error?: {
                message?: {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                } | undefined;
                code?: string | undefined;
                category?: string | undefined;
                detail?: string | undefined;
                stage?: string | undefined;
            } | undefined;
        }, {
            output?: {
                text: string;
                redacted: true;
                truncated: boolean;
            } | undefined;
            error?: {
                message?: {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                } | undefined;
                code?: string | undefined;
                category?: string | undefined;
                detail?: string | undefined;
                stage?: string | undefined;
            } | undefined;
        }>>;
        tools: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodObject<{
            callHash: import("zod").ZodString;
            name: import("zod").ZodString;
            input: import("zod").ZodOptional<import("zod").ZodObject<{
                text: import("zod").ZodString;
                redacted: import("zod").ZodLiteral<true>;
                truncated: import("zod").ZodBoolean;
            }, "strict", import("zod").ZodTypeAny, {
                text: string;
                redacted: true;
                truncated: boolean;
            }, {
                text: string;
                redacted: true;
                truncated: boolean;
            }>>;
            output: import("zod").ZodOptional<import("zod").ZodObject<{
                text: import("zod").ZodString;
                redacted: import("zod").ZodLiteral<true>;
                truncated: import("zod").ZodBoolean;
            }, "strict", import("zod").ZodTypeAny, {
                text: string;
                redacted: true;
                truncated: boolean;
            }, {
                text: string;
                redacted: true;
                truncated: boolean;
            }>>;
            status: import("zod").ZodEnum<["running", "completed", "failed", "unknown"]>;
            isError: import("zod").ZodBoolean;
            startedAtMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            endedAtMs: import("zod").ZodOptional<import("zod").ZodNumber>;
        }, "strict", import("zod").ZodTypeAny, {
            callHash: string;
            name: string;
            input?: {
                text: string;
                redacted: true;
                truncated: boolean;
            } | undefined;
            output?: {
                text: string;
                redacted: true;
                truncated: boolean;
            } | undefined;
            status: "completed" | "failed" | "running" | "unknown";
            isError: boolean;
            startedAtMs?: number | undefined;
            endedAtMs?: number | undefined;
        }, {
            callHash: string;
            name: string;
            input?: {
                text: string;
                redacted: true;
                truncated: boolean;
            } | undefined;
            output?: {
                text: string;
                redacted: true;
                truncated: boolean;
            } | undefined;
            status: "completed" | "failed" | "running" | "unknown";
            isError: boolean;
            startedAtMs?: number | undefined;
            endedAtMs?: number | undefined;
        }>, "many">>;
        manifests: import("zod").ZodOptional<import("zod").ZodObject<{
            completeness: import("zod").ZodEnum<["complete", "partial", "unavailable"]>;
            attachments: import("zod").ZodArray<import("zod").ZodObject<{
                object_class: import("zod").ZodEnum<["attachment", "artifact", "input_text_snapshot"]>;
                storage_ref: import("zod").ZodString;
                status: import("zod").ZodEnum<["ok", "partial", "unavailable"]>;
                reason: import("zod").ZodOptional<import("zod").ZodString>;
                project_id: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
                run_id: import("zod").ZodOptional<import("zod").ZodString>;
                workspace_id: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
                size_bytes: import("zod").ZodOptional<import("zod").ZodNumber>;
                sha256: import("zod").ZodOptional<import("zod").ZodString>;
                mime_type: import("zod").ZodOptional<import("zod").ZodString>;
                extension: import("zod").ZodOptional<import("zod").ZodString>;
                redacted: import("zod").ZodBoolean;
                truncated: import("zod").ZodBoolean;
                stored_in_open_design: import("zod").ZodOptional<import("zod").ZodBoolean>;
                retention_policy: import("zod").ZodOptional<import("zod").ZodString>;
                access_scope: import("zod").ZodOptional<import("zod").ZodString>;
                sensitivity: import("zod").ZodOptional<import("zod").ZodString>;
                source: import("zod").ZodOptional<import("zod").ZodString>;
                expires_at: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
                approved_by: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
                attachment_id: import("zod").ZodOptional<import("zod").ZodString>;
                artifact_id: import("zod").ZodOptional<import("zod").ZodString>;
                input_text_snapshot_id: import("zod").ZodOptional<import("zod").ZodString>;
                type: import("zod").ZodOptional<import("zod").ZodString>;
                artifact_kind: import("zod").ZodOptional<import("zod").ZodString>;
                build_status: import("zod").ZodOptional<import("zod").ZodString>;
                preview_status: import("zod").ZodOptional<import("zod").ZodString>;
                export_status: import("zod").ZodOptional<import("zod").ZodString>;
                open_in_open_design_url: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
                access_policy: import("zod").ZodOptional<import("zod").ZodString>;
            }, "strict", import("zod").ZodTypeAny, {
                object_class: "artifact" | "attachment" | "input_text_snapshot";
                storage_ref: string;
                status: "ok" | "partial" | "unavailable";
                reason?: string | undefined;
                project_id?: string | null | undefined;
                run_id?: string | undefined;
                workspace_id?: string | null | undefined;
                size_bytes?: number | undefined;
                sha256?: string | undefined;
                mime_type?: string | undefined;
                extension?: string | undefined;
                redacted: boolean;
                truncated: boolean;
                stored_in_open_design?: boolean | undefined;
                retention_policy?: string | undefined;
                access_scope?: string | undefined;
                sensitivity?: string | undefined;
                source?: string | undefined;
                expires_at?: string | null | undefined;
                approved_by?: string | null | undefined;
                attachment_id?: string | undefined;
                artifact_id?: string | undefined;
                input_text_snapshot_id?: string | undefined;
                type?: string | undefined;
                artifact_kind?: string | undefined;
                build_status?: string | undefined;
                preview_status?: string | undefined;
                export_status?: string | undefined;
                open_in_open_design_url?: string | null | undefined;
                access_policy?: string | undefined;
            }, {
                object_class: "artifact" | "attachment" | "input_text_snapshot";
                storage_ref: string;
                status: "ok" | "partial" | "unavailable";
                reason?: string | undefined;
                project_id?: string | null | undefined;
                run_id?: string | undefined;
                workspace_id?: string | null | undefined;
                size_bytes?: number | undefined;
                sha256?: string | undefined;
                mime_type?: string | undefined;
                extension?: string | undefined;
                redacted: boolean;
                truncated: boolean;
                stored_in_open_design?: boolean | undefined;
                retention_policy?: string | undefined;
                access_scope?: string | undefined;
                sensitivity?: string | undefined;
                source?: string | undefined;
                expires_at?: string | null | undefined;
                approved_by?: string | null | undefined;
                attachment_id?: string | undefined;
                artifact_id?: string | undefined;
                input_text_snapshot_id?: string | undefined;
                type?: string | undefined;
                artifact_kind?: string | undefined;
                build_status?: string | undefined;
                preview_status?: string | undefined;
                export_status?: string | undefined;
                open_in_open_design_url?: string | null | undefined;
                access_policy?: string | undefined;
            }>, "many">;
            artifacts: import("zod").ZodArray<import("zod").ZodObject<{
                object_class: import("zod").ZodEnum<["attachment", "artifact", "input_text_snapshot"]>;
                storage_ref: import("zod").ZodString;
                status: import("zod").ZodEnum<["ok", "partial", "unavailable"]>;
                reason: import("zod").ZodOptional<import("zod").ZodString>;
                project_id: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
                run_id: import("zod").ZodOptional<import("zod").ZodString>;
                workspace_id: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
                size_bytes: import("zod").ZodOptional<import("zod").ZodNumber>;
                sha256: import("zod").ZodOptional<import("zod").ZodString>;
                mime_type: import("zod").ZodOptional<import("zod").ZodString>;
                extension: import("zod").ZodOptional<import("zod").ZodString>;
                redacted: import("zod").ZodBoolean;
                truncated: import("zod").ZodBoolean;
                stored_in_open_design: import("zod").ZodOptional<import("zod").ZodBoolean>;
                retention_policy: import("zod").ZodOptional<import("zod").ZodString>;
                access_scope: import("zod").ZodOptional<import("zod").ZodString>;
                sensitivity: import("zod").ZodOptional<import("zod").ZodString>;
                source: import("zod").ZodOptional<import("zod").ZodString>;
                expires_at: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
                approved_by: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
                attachment_id: import("zod").ZodOptional<import("zod").ZodString>;
                artifact_id: import("zod").ZodOptional<import("zod").ZodString>;
                input_text_snapshot_id: import("zod").ZodOptional<import("zod").ZodString>;
                type: import("zod").ZodOptional<import("zod").ZodString>;
                artifact_kind: import("zod").ZodOptional<import("zod").ZodString>;
                build_status: import("zod").ZodOptional<import("zod").ZodString>;
                preview_status: import("zod").ZodOptional<import("zod").ZodString>;
                export_status: import("zod").ZodOptional<import("zod").ZodString>;
                open_in_open_design_url: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
                access_policy: import("zod").ZodOptional<import("zod").ZodString>;
            }, "strict", import("zod").ZodTypeAny, {
                object_class: "artifact" | "attachment" | "input_text_snapshot";
                storage_ref: string;
                status: "ok" | "partial" | "unavailable";
                reason?: string | undefined;
                project_id?: string | null | undefined;
                run_id?: string | undefined;
                workspace_id?: string | null | undefined;
                size_bytes?: number | undefined;
                sha256?: string | undefined;
                mime_type?: string | undefined;
                extension?: string | undefined;
                redacted: boolean;
                truncated: boolean;
                stored_in_open_design?: boolean | undefined;
                retention_policy?: string | undefined;
                access_scope?: string | undefined;
                sensitivity?: string | undefined;
                source?: string | undefined;
                expires_at?: string | null | undefined;
                approved_by?: string | null | undefined;
                attachment_id?: string | undefined;
                artifact_id?: string | undefined;
                input_text_snapshot_id?: string | undefined;
                type?: string | undefined;
                artifact_kind?: string | undefined;
                build_status?: string | undefined;
                preview_status?: string | undefined;
                export_status?: string | undefined;
                open_in_open_design_url?: string | null | undefined;
                access_policy?: string | undefined;
            }, {
                object_class: "artifact" | "attachment" | "input_text_snapshot";
                storage_ref: string;
                status: "ok" | "partial" | "unavailable";
                reason?: string | undefined;
                project_id?: string | null | undefined;
                run_id?: string | undefined;
                workspace_id?: string | null | undefined;
                size_bytes?: number | undefined;
                sha256?: string | undefined;
                mime_type?: string | undefined;
                extension?: string | undefined;
                redacted: boolean;
                truncated: boolean;
                stored_in_open_design?: boolean | undefined;
                retention_policy?: string | undefined;
                access_scope?: string | undefined;
                sensitivity?: string | undefined;
                source?: string | undefined;
                expires_at?: string | null | undefined;
                approved_by?: string | null | undefined;
                attachment_id?: string | undefined;
                artifact_id?: string | undefined;
                input_text_snapshot_id?: string | undefined;
                type?: string | undefined;
                artifact_kind?: string | undefined;
                build_status?: string | undefined;
                preview_status?: string | undefined;
                export_status?: string | undefined;
                open_in_open_design_url?: string | null | undefined;
                access_policy?: string | undefined;
            }>, "many">;
            inputTextSnapshots: import("zod").ZodArray<import("zod").ZodObject<{
                object_class: import("zod").ZodEnum<["attachment", "artifact", "input_text_snapshot"]>;
                storage_ref: import("zod").ZodString;
                status: import("zod").ZodEnum<["ok", "partial", "unavailable"]>;
                reason: import("zod").ZodOptional<import("zod").ZodString>;
                project_id: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
                run_id: import("zod").ZodOptional<import("zod").ZodString>;
                workspace_id: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
                size_bytes: import("zod").ZodOptional<import("zod").ZodNumber>;
                sha256: import("zod").ZodOptional<import("zod").ZodString>;
                mime_type: import("zod").ZodOptional<import("zod").ZodString>;
                extension: import("zod").ZodOptional<import("zod").ZodString>;
                redacted: import("zod").ZodBoolean;
                truncated: import("zod").ZodBoolean;
                stored_in_open_design: import("zod").ZodOptional<import("zod").ZodBoolean>;
                retention_policy: import("zod").ZodOptional<import("zod").ZodString>;
                access_scope: import("zod").ZodOptional<import("zod").ZodString>;
                sensitivity: import("zod").ZodOptional<import("zod").ZodString>;
                source: import("zod").ZodOptional<import("zod").ZodString>;
                expires_at: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
                approved_by: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
                attachment_id: import("zod").ZodOptional<import("zod").ZodString>;
                artifact_id: import("zod").ZodOptional<import("zod").ZodString>;
                input_text_snapshot_id: import("zod").ZodOptional<import("zod").ZodString>;
                type: import("zod").ZodOptional<import("zod").ZodString>;
                artifact_kind: import("zod").ZodOptional<import("zod").ZodString>;
                build_status: import("zod").ZodOptional<import("zod").ZodString>;
                preview_status: import("zod").ZodOptional<import("zod").ZodString>;
                export_status: import("zod").ZodOptional<import("zod").ZodString>;
                open_in_open_design_url: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
                access_policy: import("zod").ZodOptional<import("zod").ZodString>;
            }, "strict", import("zod").ZodTypeAny, {
                object_class: "artifact" | "attachment" | "input_text_snapshot";
                storage_ref: string;
                status: "ok" | "partial" | "unavailable";
                reason?: string | undefined;
                project_id?: string | null | undefined;
                run_id?: string | undefined;
                workspace_id?: string | null | undefined;
                size_bytes?: number | undefined;
                sha256?: string | undefined;
                mime_type?: string | undefined;
                extension?: string | undefined;
                redacted: boolean;
                truncated: boolean;
                stored_in_open_design?: boolean | undefined;
                retention_policy?: string | undefined;
                access_scope?: string | undefined;
                sensitivity?: string | undefined;
                source?: string | undefined;
                expires_at?: string | null | undefined;
                approved_by?: string | null | undefined;
                attachment_id?: string | undefined;
                artifact_id?: string | undefined;
                input_text_snapshot_id?: string | undefined;
                type?: string | undefined;
                artifact_kind?: string | undefined;
                build_status?: string | undefined;
                preview_status?: string | undefined;
                export_status?: string | undefined;
                open_in_open_design_url?: string | null | undefined;
                access_policy?: string | undefined;
            }, {
                object_class: "artifact" | "attachment" | "input_text_snapshot";
                storage_ref: string;
                status: "ok" | "partial" | "unavailable";
                reason?: string | undefined;
                project_id?: string | null | undefined;
                run_id?: string | undefined;
                workspace_id?: string | null | undefined;
                size_bytes?: number | undefined;
                sha256?: string | undefined;
                mime_type?: string | undefined;
                extension?: string | undefined;
                redacted: boolean;
                truncated: boolean;
                stored_in_open_design?: boolean | undefined;
                retention_policy?: string | undefined;
                access_scope?: string | undefined;
                sensitivity?: string | undefined;
                source?: string | undefined;
                expires_at?: string | null | undefined;
                approved_by?: string | null | undefined;
                attachment_id?: string | undefined;
                artifact_id?: string | undefined;
                input_text_snapshot_id?: string | undefined;
                type?: string | undefined;
                artifact_kind?: string | undefined;
                build_status?: string | undefined;
                preview_status?: string | undefined;
                export_status?: string | undefined;
                open_in_open_design_url?: string | null | undefined;
                access_policy?: string | undefined;
            }>, "many">;
        }, "strict", import("zod").ZodTypeAny, {
            completeness: "complete" | "partial" | "unavailable";
            attachments: {
                object_class: "artifact" | "attachment" | "input_text_snapshot";
                storage_ref: string;
                status: "ok" | "partial" | "unavailable";
                reason?: string | undefined;
                project_id?: string | null | undefined;
                run_id?: string | undefined;
                workspace_id?: string | null | undefined;
                size_bytes?: number | undefined;
                sha256?: string | undefined;
                mime_type?: string | undefined;
                extension?: string | undefined;
                redacted: boolean;
                truncated: boolean;
                stored_in_open_design?: boolean | undefined;
                retention_policy?: string | undefined;
                access_scope?: string | undefined;
                sensitivity?: string | undefined;
                source?: string | undefined;
                expires_at?: string | null | undefined;
                approved_by?: string | null | undefined;
                attachment_id?: string | undefined;
                artifact_id?: string | undefined;
                input_text_snapshot_id?: string | undefined;
                type?: string | undefined;
                artifact_kind?: string | undefined;
                build_status?: string | undefined;
                preview_status?: string | undefined;
                export_status?: string | undefined;
                open_in_open_design_url?: string | null | undefined;
                access_policy?: string | undefined;
            }[];
            artifacts: {
                object_class: "artifact" | "attachment" | "input_text_snapshot";
                storage_ref: string;
                status: "ok" | "partial" | "unavailable";
                reason?: string | undefined;
                project_id?: string | null | undefined;
                run_id?: string | undefined;
                workspace_id?: string | null | undefined;
                size_bytes?: number | undefined;
                sha256?: string | undefined;
                mime_type?: string | undefined;
                extension?: string | undefined;
                redacted: boolean;
                truncated: boolean;
                stored_in_open_design?: boolean | undefined;
                retention_policy?: string | undefined;
                access_scope?: string | undefined;
                sensitivity?: string | undefined;
                source?: string | undefined;
                expires_at?: string | null | undefined;
                approved_by?: string | null | undefined;
                attachment_id?: string | undefined;
                artifact_id?: string | undefined;
                input_text_snapshot_id?: string | undefined;
                type?: string | undefined;
                artifact_kind?: string | undefined;
                build_status?: string | undefined;
                preview_status?: string | undefined;
                export_status?: string | undefined;
                open_in_open_design_url?: string | null | undefined;
                access_policy?: string | undefined;
            }[];
            inputTextSnapshots: {
                object_class: "artifact" | "attachment" | "input_text_snapshot";
                storage_ref: string;
                status: "ok" | "partial" | "unavailable";
                reason?: string | undefined;
                project_id?: string | null | undefined;
                run_id?: string | undefined;
                workspace_id?: string | null | undefined;
                size_bytes?: number | undefined;
                sha256?: string | undefined;
                mime_type?: string | undefined;
                extension?: string | undefined;
                redacted: boolean;
                truncated: boolean;
                stored_in_open_design?: boolean | undefined;
                retention_policy?: string | undefined;
                access_scope?: string | undefined;
                sensitivity?: string | undefined;
                source?: string | undefined;
                expires_at?: string | null | undefined;
                approved_by?: string | null | undefined;
                attachment_id?: string | undefined;
                artifact_id?: string | undefined;
                input_text_snapshot_id?: string | undefined;
                type?: string | undefined;
                artifact_kind?: string | undefined;
                build_status?: string | undefined;
                preview_status?: string | undefined;
                export_status?: string | undefined;
                open_in_open_design_url?: string | null | undefined;
                access_policy?: string | undefined;
            }[];
        }, {
            completeness: "complete" | "partial" | "unavailable";
            attachments: {
                object_class: "artifact" | "attachment" | "input_text_snapshot";
                storage_ref: string;
                status: "ok" | "partial" | "unavailable";
                reason?: string | undefined;
                project_id?: string | null | undefined;
                run_id?: string | undefined;
                workspace_id?: string | null | undefined;
                size_bytes?: number | undefined;
                sha256?: string | undefined;
                mime_type?: string | undefined;
                extension?: string | undefined;
                redacted: boolean;
                truncated: boolean;
                stored_in_open_design?: boolean | undefined;
                retention_policy?: string | undefined;
                access_scope?: string | undefined;
                sensitivity?: string | undefined;
                source?: string | undefined;
                expires_at?: string | null | undefined;
                approved_by?: string | null | undefined;
                attachment_id?: string | undefined;
                artifact_id?: string | undefined;
                input_text_snapshot_id?: string | undefined;
                type?: string | undefined;
                artifact_kind?: string | undefined;
                build_status?: string | undefined;
                preview_status?: string | undefined;
                export_status?: string | undefined;
                open_in_open_design_url?: string | null | undefined;
                access_policy?: string | undefined;
            }[];
            artifacts: {
                object_class: "artifact" | "attachment" | "input_text_snapshot";
                storage_ref: string;
                status: "ok" | "partial" | "unavailable";
                reason?: string | undefined;
                project_id?: string | null | undefined;
                run_id?: string | undefined;
                workspace_id?: string | null | undefined;
                size_bytes?: number | undefined;
                sha256?: string | undefined;
                mime_type?: string | undefined;
                extension?: string | undefined;
                redacted: boolean;
                truncated: boolean;
                stored_in_open_design?: boolean | undefined;
                retention_policy?: string | undefined;
                access_scope?: string | undefined;
                sensitivity?: string | undefined;
                source?: string | undefined;
                expires_at?: string | null | undefined;
                approved_by?: string | null | undefined;
                attachment_id?: string | undefined;
                artifact_id?: string | undefined;
                input_text_snapshot_id?: string | undefined;
                type?: string | undefined;
                artifact_kind?: string | undefined;
                build_status?: string | undefined;
                preview_status?: string | undefined;
                export_status?: string | undefined;
                open_in_open_design_url?: string | null | undefined;
                access_policy?: string | undefined;
            }[];
            inputTextSnapshots: {
                object_class: "artifact" | "attachment" | "input_text_snapshot";
                storage_ref: string;
                status: "ok" | "partial" | "unavailable";
                reason?: string | undefined;
                project_id?: string | null | undefined;
                run_id?: string | undefined;
                workspace_id?: string | null | undefined;
                size_bytes?: number | undefined;
                sha256?: string | undefined;
                mime_type?: string | undefined;
                extension?: string | undefined;
                redacted: boolean;
                truncated: boolean;
                stored_in_open_design?: boolean | undefined;
                retention_policy?: string | undefined;
                access_scope?: string | undefined;
                sensitivity?: string | undefined;
                source?: string | undefined;
                expires_at?: string | null | undefined;
                approved_by?: string | null | undefined;
                attachment_id?: string | undefined;
                artifact_id?: string | undefined;
                input_text_snapshot_id?: string | undefined;
                type?: string | undefined;
                artifact_kind?: string | undefined;
                build_status?: string | undefined;
                preview_status?: string | undefined;
                export_status?: string | undefined;
                open_in_open_design_url?: string | null | undefined;
                access_policy?: string | undefined;
            }[];
        }>>;
        process: import("zod").ZodOptional<import("zod").ZodObject<{
            exitCode: import("zod").ZodOptional<import("zod").ZodNumber>;
            signal: import("zod").ZodOptional<import("zod").ZodString>;
            stderr: import("zod").ZodOptional<import("zod").ZodEffects<import("zod").ZodObject<{
                tail: import("zod").ZodOptional<import("zod").ZodObject<{
                    text: import("zod").ZodString;
                    redacted: import("zod").ZodLiteral<true>;
                    truncated: import("zod").ZodBoolean;
                }, "strict", import("zod").ZodTypeAny, {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                }, {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                }>>;
                lineCount: import("zod").ZodNumber;
                truncated: import("zod").ZodBoolean;
                limitations: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString, "many">>;
            }, "strict", import("zod").ZodTypeAny, {
                tail?: {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                } | undefined;
                lineCount: number;
                truncated: boolean;
                limitations?: string[] | undefined;
            }, {
                tail?: {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                } | undefined;
                lineCount: number;
                truncated: boolean;
                limitations?: string[] | undefined;
            }>, {
                tail?: {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                } | undefined;
                lineCount: number;
                truncated: boolean;
                limitations?: string[] | undefined;
            }, {
                tail?: {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                } | undefined;
                lineCount: number;
                truncated: boolean;
                limitations?: string[] | undefined;
            }>>;
            stdout: import("zod").ZodOptional<import("zod").ZodEffects<import("zod").ZodObject<{
                tail: import("zod").ZodOptional<import("zod").ZodObject<{
                    text: import("zod").ZodString;
                    redacted: import("zod").ZodLiteral<true>;
                    truncated: import("zod").ZodBoolean;
                }, "strict", import("zod").ZodTypeAny, {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                }, {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                }>>;
                lineCount: import("zod").ZodNumber;
                truncated: import("zod").ZodBoolean;
                limitations: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString, "many">>;
            }, "strict", import("zod").ZodTypeAny, {
                tail?: {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                } | undefined;
                lineCount: number;
                truncated: boolean;
                limitations?: string[] | undefined;
            }, {
                tail?: {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                } | undefined;
                lineCount: number;
                truncated: boolean;
                limitations?: string[] | undefined;
            }>, {
                tail?: {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                } | undefined;
                lineCount: number;
                truncated: boolean;
                limitations?: string[] | undefined;
            }, {
                tail?: {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                } | undefined;
                lineCount: number;
                truncated: boolean;
                limitations?: string[] | undefined;
            }>>;
            diagnostics: import("zod").ZodOptional<import("zod").ZodEffects<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnion<[import("zod").ZodBoolean, import("zod").ZodString]>>, Record<string, string | boolean>, Record<string, string | boolean>>>;
        }, "strict", import("zod").ZodTypeAny, {
            exitCode?: number | undefined;
            signal?: string | undefined;
            stderr?: {
                tail?: {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                } | undefined;
                lineCount: number;
                truncated: boolean;
                limitations?: string[] | undefined;
            } | undefined;
            stdout?: {
                tail?: {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                } | undefined;
                lineCount: number;
                truncated: boolean;
                limitations?: string[] | undefined;
            } | undefined;
            diagnostics?: Record<string, string | boolean> | undefined;
        }, {
            exitCode?: number | undefined;
            signal?: string | undefined;
            stderr?: {
                tail?: {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                } | undefined;
                lineCount: number;
                truncated: boolean;
                limitations?: string[] | undefined;
            } | undefined;
            stdout?: {
                tail?: {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                } | undefined;
                lineCount: number;
                truncated: boolean;
                limitations?: string[] | undefined;
            } | undefined;
            diagnostics?: Record<string, string | boolean> | undefined;
        }>>;
        deliverableSyntax: import("zod").ZodOptional<import("zod").ZodObject<{
            schemaVersion: import("zod").ZodLiteral<"deliverable-syntax-telemetry-v1">;
            applicable: import("zod").ZodBoolean;
            status: import("zod").ZodEnum<["pass", "repairable", "incomplete", "exhausted", "skipped"]>;
            source: import("zod").ZodEnum<["agent_tool", "run_finalizer"]>;
            checker: import("zod").ZodNullable<import("zod").ZodString>;
            checkedFileCount: import("zod").ZodNumber;
            checkCount: import("zod").ZodNumber;
            checkerDurationMs: import("zod").ZodNullable<import("zod").ZodNumber>;
            repairWindowDurationMs: import("zod").ZodNullable<import("zod").ZodNumber>;
            repairToDeliveryDurationMs: import("zod").ZodNullable<import("zod").ZodNumber>;
            repairToTerminalDurationMs: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodNumber>>;
            terminalRunStatus: import("zod").ZodOptional<import("zod").ZodEnum<["succeeded", "failed", "canceled"]>>;
            finalization: import("zod").ZodOptional<import("zod").ZodObject<{
                action: import("zod").ZodEnum<["allow", "warn", "fail"]>;
                reason: import("zod").ZodOptional<import("zod").ZodEnum<["attempt_limit_reached", "commit_conflict", "commit_failed", "check_incomplete", "no_progress", "no_safe_fix", "verification_failed", "repair_budget_exceeded", "internal_error"]>>;
                refusal: import("zod").ZodOptional<import("zod").ZodEnum<["ambiguous_diagnostic", "file_unreadable", "path_outside_project", "unsupported_syntax_error", "multiple_files"]>>;
                summaryVersion: import("zod").ZodOptional<import("zod").ZodLiteral<1>>;
                initialStatus: import("zod").ZodOptional<import("zod").ZodEnum<["pass", "repairable", "incomplete", "skipped"]>>;
                repairEngine: import("zod").ZodOptional<import("zod").ZodLiteral<"host-safe-fixer@2">>;
                stagedPatchCount: import("zod").ZodOptional<import("zod").ZodNumber>;
                committedPatchCount: import("zod").ZodOptional<import("zod").ZodNumber>;
                committedRepairRules: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodEnum<["insert_missing_closing_delimiter", "close_unterminated_block_comment", "close_unterminated_string", "close_unterminated_template", "normalize_mismatched_string_quote", "normalize_html_attribute_quotes"]>, "many">>;
            }, "strict", import("zod").ZodTypeAny, {
                action: "allow" | "fail" | "warn";
                reason?: "attempt_limit_reached" | "check_incomplete" | "commit_conflict" | "commit_failed" | "internal_error" | "no_progress" | "no_safe_fix" | "repair_budget_exceeded" | "verification_failed" | undefined;
                refusal?: "ambiguous_diagnostic" | "file_unreadable" | "multiple_files" | "path_outside_project" | "unsupported_syntax_error" | undefined;
                summaryVersion?: 1 | undefined;
                initialStatus?: "incomplete" | "pass" | "repairable" | "skipped" | undefined;
                repairEngine?: "host-safe-fixer@2" | undefined;
                stagedPatchCount?: number | undefined;
                committedPatchCount?: number | undefined;
                committedRepairRules?: ("close_unterminated_block_comment" | "close_unterminated_string" | "close_unterminated_template" | "insert_missing_closing_delimiter" | "normalize_html_attribute_quotes" | "normalize_mismatched_string_quote")[] | undefined;
            }, {
                action: "allow" | "fail" | "warn";
                reason?: "attempt_limit_reached" | "check_incomplete" | "commit_conflict" | "commit_failed" | "internal_error" | "no_progress" | "no_safe_fix" | "repair_budget_exceeded" | "verification_failed" | undefined;
                refusal?: "ambiguous_diagnostic" | "file_unreadable" | "multiple_files" | "path_outside_project" | "unsupported_syntax_error" | undefined;
                summaryVersion?: 1 | undefined;
                initialStatus?: "incomplete" | "pass" | "repairable" | "skipped" | undefined;
                repairEngine?: "host-safe-fixer@2" | undefined;
                stagedPatchCount?: number | undefined;
                committedPatchCount?: number | undefined;
                committedRepairRules?: ("close_unterminated_block_comment" | "close_unterminated_string" | "close_unterminated_template" | "insert_missing_closing_delimiter" | "normalize_html_attribute_quotes" | "normalize_mismatched_string_quote")[] | undefined;
            }>>;
            repairExecutor: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodEnum<["agent", "host_safe_fixer"]>>>;
            repairDurationMs: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodNumber>>;
            appliedRepairRules: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodEnum<["insert_missing_closing_delimiter", "close_unterminated_block_comment", "close_unterminated_string", "close_unterminated_template", "normalize_mismatched_string_quote", "normalize_html_attribute_quotes"]>, "many">>;
            safeFixProposalCount: import("zod").ZodOptional<import("zod").ZodNumber>;
            safeFixProposalDurationMs: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodNumber>>;
            repairableCheckCount: import("zod").ZodNumber;
            initialDiagnosticCount: import("zod").ZodNullable<import("zod").ZodNumber>;
            latestDiagnosticCount: import("zod").ZodNullable<import("zod").ZodNumber>;
            repairTriggered: import("zod").ZodBoolean;
            repairAttempts: import("zod").ZodNumber;
            maxRepairAttempts: import("zod").ZodNullable<import("zod").ZodNumber>;
            repairOutcome: import("zod").ZodEnum<["not_applicable", "not_needed", "repaired", "exhausted", "unresolved"]>;
            recoveredDeliveryCount: import("zod").ZodUnion<[import("zod").ZodLiteral<0>, import("zod").ZodLiteral<1>]>;
            blockedBrokenDeliveryCount: import("zod").ZodUnion<[import("zod").ZodLiteral<0>, import("zod").ZodLiteral<1>]>;
            deliveredWithSyntaxWarningCount: import("zod").ZodOptional<import("zod").ZodUnion<[import("zod").ZodLiteral<0>, import("zod").ZodLiteral<1>]>>;
        }, "strict", import("zod").ZodTypeAny, {
            schemaVersion: "deliverable-syntax-telemetry-v1";
            applicable: boolean;
            status: "exhausted" | "incomplete" | "pass" | "repairable" | "skipped";
            source: "agent_tool" | "run_finalizer";
            checker: string | null;
            checkedFileCount: number;
            checkCount: number;
            checkerDurationMs: number | null;
            repairWindowDurationMs: number | null;
            repairToDeliveryDurationMs: number | null;
            repairToTerminalDurationMs?: number | null | undefined;
            terminalRunStatus?: "canceled" | "failed" | "succeeded" | undefined;
            finalization?: {
                action: "allow" | "fail" | "warn";
                reason?: "attempt_limit_reached" | "check_incomplete" | "commit_conflict" | "commit_failed" | "internal_error" | "no_progress" | "no_safe_fix" | "repair_budget_exceeded" | "verification_failed" | undefined;
                refusal?: "ambiguous_diagnostic" | "file_unreadable" | "multiple_files" | "path_outside_project" | "unsupported_syntax_error" | undefined;
                summaryVersion?: 1 | undefined;
                initialStatus?: "incomplete" | "pass" | "repairable" | "skipped" | undefined;
                repairEngine?: "host-safe-fixer@2" | undefined;
                stagedPatchCount?: number | undefined;
                committedPatchCount?: number | undefined;
                committedRepairRules?: ("close_unterminated_block_comment" | "close_unterminated_string" | "close_unterminated_template" | "insert_missing_closing_delimiter" | "normalize_html_attribute_quotes" | "normalize_mismatched_string_quote")[] | undefined;
            } | undefined;
            repairExecutor?: "agent" | "host_safe_fixer" | null | undefined;
            repairDurationMs?: number | null | undefined;
            appliedRepairRules?: ("close_unterminated_block_comment" | "close_unterminated_string" | "close_unterminated_template" | "insert_missing_closing_delimiter" | "normalize_html_attribute_quotes" | "normalize_mismatched_string_quote")[] | undefined;
            safeFixProposalCount?: number | undefined;
            safeFixProposalDurationMs?: number | null | undefined;
            repairableCheckCount: number;
            initialDiagnosticCount: number | null;
            latestDiagnosticCount: number | null;
            repairTriggered: boolean;
            repairAttempts: number;
            maxRepairAttempts: number | null;
            repairOutcome: "exhausted" | "not_applicable" | "not_needed" | "repaired" | "unresolved";
            recoveredDeliveryCount: 0 | 1;
            blockedBrokenDeliveryCount: 0 | 1;
            deliveredWithSyntaxWarningCount?: 0 | 1 | undefined;
        }, {
            schemaVersion: "deliverable-syntax-telemetry-v1";
            applicable: boolean;
            status: "exhausted" | "incomplete" | "pass" | "repairable" | "skipped";
            source: "agent_tool" | "run_finalizer";
            checker: string | null;
            checkedFileCount: number;
            checkCount: number;
            checkerDurationMs: number | null;
            repairWindowDurationMs: number | null;
            repairToDeliveryDurationMs: number | null;
            repairToTerminalDurationMs?: number | null | undefined;
            terminalRunStatus?: "canceled" | "failed" | "succeeded" | undefined;
            finalization?: {
                action: "allow" | "fail" | "warn";
                reason?: "attempt_limit_reached" | "check_incomplete" | "commit_conflict" | "commit_failed" | "internal_error" | "no_progress" | "no_safe_fix" | "repair_budget_exceeded" | "verification_failed" | undefined;
                refusal?: "ambiguous_diagnostic" | "file_unreadable" | "multiple_files" | "path_outside_project" | "unsupported_syntax_error" | undefined;
                summaryVersion?: 1 | undefined;
                initialStatus?: "incomplete" | "pass" | "repairable" | "skipped" | undefined;
                repairEngine?: "host-safe-fixer@2" | undefined;
                stagedPatchCount?: number | undefined;
                committedPatchCount?: number | undefined;
                committedRepairRules?: ("close_unterminated_block_comment" | "close_unterminated_string" | "close_unterminated_template" | "insert_missing_closing_delimiter" | "normalize_html_attribute_quotes" | "normalize_mismatched_string_quote")[] | undefined;
            } | undefined;
            repairExecutor?: "agent" | "host_safe_fixer" | null | undefined;
            repairDurationMs?: number | null | undefined;
            appliedRepairRules?: ("close_unterminated_block_comment" | "close_unterminated_string" | "close_unterminated_template" | "insert_missing_closing_delimiter" | "normalize_html_attribute_quotes" | "normalize_mismatched_string_quote")[] | undefined;
            safeFixProposalCount?: number | undefined;
            safeFixProposalDurationMs?: number | null | undefined;
            repairableCheckCount: number;
            initialDiagnosticCount: number | null;
            latestDiagnosticCount: number | null;
            repairTriggered: boolean;
            repairAttempts: number;
            maxRepairAttempts: number | null;
            repairOutcome: "exhausted" | "not_applicable" | "not_needed" | "repaired" | "unresolved";
            recoveredDeliveryCount: 0 | 1;
            blockedBrokenDeliveryCount: 0 | 1;
            deliveredWithSyntaxWarningCount?: 0 | 1 | undefined;
        }>>;
    }, "strict", import("zod").ZodTypeAny, {
        schema: "open-design.safe-run-quality/v1";
        result?: {
            output?: {
                text: string;
                redacted: true;
                truncated: boolean;
            } | undefined;
            error?: {
                message?: {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                } | undefined;
                code?: string | undefined;
                category?: string | undefined;
                detail?: string | undefined;
                stage?: string | undefined;
            } | undefined;
        } | undefined;
        tools?: {
            callHash: string;
            name: string;
            input?: {
                text: string;
                redacted: true;
                truncated: boolean;
            } | undefined;
            output?: {
                text: string;
                redacted: true;
                truncated: boolean;
            } | undefined;
            status: "completed" | "failed" | "running" | "unknown";
            isError: boolean;
            startedAtMs?: number | undefined;
            endedAtMs?: number | undefined;
        }[] | undefined;
        manifests?: {
            completeness: "complete" | "partial" | "unavailable";
            attachments: {
                object_class: "artifact" | "attachment" | "input_text_snapshot";
                storage_ref: string;
                status: "ok" | "partial" | "unavailable";
                reason?: string | undefined;
                project_id?: string | null | undefined;
                run_id?: string | undefined;
                workspace_id?: string | null | undefined;
                size_bytes?: number | undefined;
                sha256?: string | undefined;
                mime_type?: string | undefined;
                extension?: string | undefined;
                redacted: boolean;
                truncated: boolean;
                stored_in_open_design?: boolean | undefined;
                retention_policy?: string | undefined;
                access_scope?: string | undefined;
                sensitivity?: string | undefined;
                source?: string | undefined;
                expires_at?: string | null | undefined;
                approved_by?: string | null | undefined;
                attachment_id?: string | undefined;
                artifact_id?: string | undefined;
                input_text_snapshot_id?: string | undefined;
                type?: string | undefined;
                artifact_kind?: string | undefined;
                build_status?: string | undefined;
                preview_status?: string | undefined;
                export_status?: string | undefined;
                open_in_open_design_url?: string | null | undefined;
                access_policy?: string | undefined;
            }[];
            artifacts: {
                object_class: "artifact" | "attachment" | "input_text_snapshot";
                storage_ref: string;
                status: "ok" | "partial" | "unavailable";
                reason?: string | undefined;
                project_id?: string | null | undefined;
                run_id?: string | undefined;
                workspace_id?: string | null | undefined;
                size_bytes?: number | undefined;
                sha256?: string | undefined;
                mime_type?: string | undefined;
                extension?: string | undefined;
                redacted: boolean;
                truncated: boolean;
                stored_in_open_design?: boolean | undefined;
                retention_policy?: string | undefined;
                access_scope?: string | undefined;
                sensitivity?: string | undefined;
                source?: string | undefined;
                expires_at?: string | null | undefined;
                approved_by?: string | null | undefined;
                attachment_id?: string | undefined;
                artifact_id?: string | undefined;
                input_text_snapshot_id?: string | undefined;
                type?: string | undefined;
                artifact_kind?: string | undefined;
                build_status?: string | undefined;
                preview_status?: string | undefined;
                export_status?: string | undefined;
                open_in_open_design_url?: string | null | undefined;
                access_policy?: string | undefined;
            }[];
            inputTextSnapshots: {
                object_class: "artifact" | "attachment" | "input_text_snapshot";
                storage_ref: string;
                status: "ok" | "partial" | "unavailable";
                reason?: string | undefined;
                project_id?: string | null | undefined;
                run_id?: string | undefined;
                workspace_id?: string | null | undefined;
                size_bytes?: number | undefined;
                sha256?: string | undefined;
                mime_type?: string | undefined;
                extension?: string | undefined;
                redacted: boolean;
                truncated: boolean;
                stored_in_open_design?: boolean | undefined;
                retention_policy?: string | undefined;
                access_scope?: string | undefined;
                sensitivity?: string | undefined;
                source?: string | undefined;
                expires_at?: string | null | undefined;
                approved_by?: string | null | undefined;
                attachment_id?: string | undefined;
                artifact_id?: string | undefined;
                input_text_snapshot_id?: string | undefined;
                type?: string | undefined;
                artifact_kind?: string | undefined;
                build_status?: string | undefined;
                preview_status?: string | undefined;
                export_status?: string | undefined;
                open_in_open_design_url?: string | null | undefined;
                access_policy?: string | undefined;
            }[];
        } | undefined;
        process?: {
            exitCode?: number | undefined;
            signal?: string | undefined;
            stderr?: {
                tail?: {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                } | undefined;
                lineCount: number;
                truncated: boolean;
                limitations?: string[] | undefined;
            } | undefined;
            stdout?: {
                tail?: {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                } | undefined;
                lineCount: number;
                truncated: boolean;
                limitations?: string[] | undefined;
            } | undefined;
            diagnostics?: Record<string, string | boolean> | undefined;
        } | undefined;
        deliverableSyntax?: {
            schemaVersion: "deliverable-syntax-telemetry-v1";
            applicable: boolean;
            status: "exhausted" | "incomplete" | "pass" | "repairable" | "skipped";
            source: "agent_tool" | "run_finalizer";
            checker: string | null;
            checkedFileCount: number;
            checkCount: number;
            checkerDurationMs: number | null;
            repairWindowDurationMs: number | null;
            repairToDeliveryDurationMs: number | null;
            repairToTerminalDurationMs?: number | null | undefined;
            terminalRunStatus?: "canceled" | "failed" | "succeeded" | undefined;
            finalization?: {
                action: "allow" | "fail" | "warn";
                reason?: "attempt_limit_reached" | "check_incomplete" | "commit_conflict" | "commit_failed" | "internal_error" | "no_progress" | "no_safe_fix" | "repair_budget_exceeded" | "verification_failed" | undefined;
                refusal?: "ambiguous_diagnostic" | "file_unreadable" | "multiple_files" | "path_outside_project" | "unsupported_syntax_error" | undefined;
                summaryVersion?: 1 | undefined;
                initialStatus?: "incomplete" | "pass" | "repairable" | "skipped" | undefined;
                repairEngine?: "host-safe-fixer@2" | undefined;
                stagedPatchCount?: number | undefined;
                committedPatchCount?: number | undefined;
                committedRepairRules?: ("close_unterminated_block_comment" | "close_unterminated_string" | "close_unterminated_template" | "insert_missing_closing_delimiter" | "normalize_html_attribute_quotes" | "normalize_mismatched_string_quote")[] | undefined;
            } | undefined;
            repairExecutor?: "agent" | "host_safe_fixer" | null | undefined;
            repairDurationMs?: number | null | undefined;
            appliedRepairRules?: ("close_unterminated_block_comment" | "close_unterminated_string" | "close_unterminated_template" | "insert_missing_closing_delimiter" | "normalize_html_attribute_quotes" | "normalize_mismatched_string_quote")[] | undefined;
            safeFixProposalCount?: number | undefined;
            safeFixProposalDurationMs?: number | null | undefined;
            repairableCheckCount: number;
            initialDiagnosticCount: number | null;
            latestDiagnosticCount: number | null;
            repairTriggered: boolean;
            repairAttempts: number;
            maxRepairAttempts: number | null;
            repairOutcome: "exhausted" | "not_applicable" | "not_needed" | "repaired" | "unresolved";
            recoveredDeliveryCount: 0 | 1;
            blockedBrokenDeliveryCount: 0 | 1;
            deliveredWithSyntaxWarningCount?: 0 | 1 | undefined;
        } | undefined;
    }, {
        schema: "open-design.safe-run-quality/v1";
        result?: {
            output?: {
                text: string;
                redacted: true;
                truncated: boolean;
            } | undefined;
            error?: {
                message?: {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                } | undefined;
                code?: string | undefined;
                category?: string | undefined;
                detail?: string | undefined;
                stage?: string | undefined;
            } | undefined;
        } | undefined;
        tools?: {
            callHash: string;
            name: string;
            input?: {
                text: string;
                redacted: true;
                truncated: boolean;
            } | undefined;
            output?: {
                text: string;
                redacted: true;
                truncated: boolean;
            } | undefined;
            status: "completed" | "failed" | "running" | "unknown";
            isError: boolean;
            startedAtMs?: number | undefined;
            endedAtMs?: number | undefined;
        }[] | undefined;
        manifests?: {
            completeness: "complete" | "partial" | "unavailable";
            attachments: {
                object_class: "artifact" | "attachment" | "input_text_snapshot";
                storage_ref: string;
                status: "ok" | "partial" | "unavailable";
                reason?: string | undefined;
                project_id?: string | null | undefined;
                run_id?: string | undefined;
                workspace_id?: string | null | undefined;
                size_bytes?: number | undefined;
                sha256?: string | undefined;
                mime_type?: string | undefined;
                extension?: string | undefined;
                redacted: boolean;
                truncated: boolean;
                stored_in_open_design?: boolean | undefined;
                retention_policy?: string | undefined;
                access_scope?: string | undefined;
                sensitivity?: string | undefined;
                source?: string | undefined;
                expires_at?: string | null | undefined;
                approved_by?: string | null | undefined;
                attachment_id?: string | undefined;
                artifact_id?: string | undefined;
                input_text_snapshot_id?: string | undefined;
                type?: string | undefined;
                artifact_kind?: string | undefined;
                build_status?: string | undefined;
                preview_status?: string | undefined;
                export_status?: string | undefined;
                open_in_open_design_url?: string | null | undefined;
                access_policy?: string | undefined;
            }[];
            artifacts: {
                object_class: "artifact" | "attachment" | "input_text_snapshot";
                storage_ref: string;
                status: "ok" | "partial" | "unavailable";
                reason?: string | undefined;
                project_id?: string | null | undefined;
                run_id?: string | undefined;
                workspace_id?: string | null | undefined;
                size_bytes?: number | undefined;
                sha256?: string | undefined;
                mime_type?: string | undefined;
                extension?: string | undefined;
                redacted: boolean;
                truncated: boolean;
                stored_in_open_design?: boolean | undefined;
                retention_policy?: string | undefined;
                access_scope?: string | undefined;
                sensitivity?: string | undefined;
                source?: string | undefined;
                expires_at?: string | null | undefined;
                approved_by?: string | null | undefined;
                attachment_id?: string | undefined;
                artifact_id?: string | undefined;
                input_text_snapshot_id?: string | undefined;
                type?: string | undefined;
                artifact_kind?: string | undefined;
                build_status?: string | undefined;
                preview_status?: string | undefined;
                export_status?: string | undefined;
                open_in_open_design_url?: string | null | undefined;
                access_policy?: string | undefined;
            }[];
            inputTextSnapshots: {
                object_class: "artifact" | "attachment" | "input_text_snapshot";
                storage_ref: string;
                status: "ok" | "partial" | "unavailable";
                reason?: string | undefined;
                project_id?: string | null | undefined;
                run_id?: string | undefined;
                workspace_id?: string | null | undefined;
                size_bytes?: number | undefined;
                sha256?: string | undefined;
                mime_type?: string | undefined;
                extension?: string | undefined;
                redacted: boolean;
                truncated: boolean;
                stored_in_open_design?: boolean | undefined;
                retention_policy?: string | undefined;
                access_scope?: string | undefined;
                sensitivity?: string | undefined;
                source?: string | undefined;
                expires_at?: string | null | undefined;
                approved_by?: string | null | undefined;
                attachment_id?: string | undefined;
                artifact_id?: string | undefined;
                input_text_snapshot_id?: string | undefined;
                type?: string | undefined;
                artifact_kind?: string | undefined;
                build_status?: string | undefined;
                preview_status?: string | undefined;
                export_status?: string | undefined;
                open_in_open_design_url?: string | null | undefined;
                access_policy?: string | undefined;
            }[];
        } | undefined;
        process?: {
            exitCode?: number | undefined;
            signal?: string | undefined;
            stderr?: {
                tail?: {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                } | undefined;
                lineCount: number;
                truncated: boolean;
                limitations?: string[] | undefined;
            } | undefined;
            stdout?: {
                tail?: {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                } | undefined;
                lineCount: number;
                truncated: boolean;
                limitations?: string[] | undefined;
            } | undefined;
            diagnostics?: Record<string, string | boolean> | undefined;
        } | undefined;
        deliverableSyntax?: {
            schemaVersion: "deliverable-syntax-telemetry-v1";
            applicable: boolean;
            status: "exhausted" | "incomplete" | "pass" | "repairable" | "skipped";
            source: "agent_tool" | "run_finalizer";
            checker: string | null;
            checkedFileCount: number;
            checkCount: number;
            checkerDurationMs: number | null;
            repairWindowDurationMs: number | null;
            repairToDeliveryDurationMs: number | null;
            repairToTerminalDurationMs?: number | null | undefined;
            terminalRunStatus?: "canceled" | "failed" | "succeeded" | undefined;
            finalization?: {
                action: "allow" | "fail" | "warn";
                reason?: "attempt_limit_reached" | "check_incomplete" | "commit_conflict" | "commit_failed" | "internal_error" | "no_progress" | "no_safe_fix" | "repair_budget_exceeded" | "verification_failed" | undefined;
                refusal?: "ambiguous_diagnostic" | "file_unreadable" | "multiple_files" | "path_outside_project" | "unsupported_syntax_error" | undefined;
                summaryVersion?: 1 | undefined;
                initialStatus?: "incomplete" | "pass" | "repairable" | "skipped" | undefined;
                repairEngine?: "host-safe-fixer@2" | undefined;
                stagedPatchCount?: number | undefined;
                committedPatchCount?: number | undefined;
                committedRepairRules?: ("close_unterminated_block_comment" | "close_unterminated_string" | "close_unterminated_template" | "insert_missing_closing_delimiter" | "normalize_html_attribute_quotes" | "normalize_mismatched_string_quote")[] | undefined;
            } | undefined;
            repairExecutor?: "agent" | "host_safe_fixer" | null | undefined;
            repairDurationMs?: number | null | undefined;
            appliedRepairRules?: ("close_unterminated_block_comment" | "close_unterminated_string" | "close_unterminated_template" | "insert_missing_closing_delimiter" | "normalize_html_attribute_quotes" | "normalize_mismatched_string_quote")[] | undefined;
            safeFixProposalCount?: number | undefined;
            safeFixProposalDurationMs?: number | null | undefined;
            repairableCheckCount: number;
            initialDiagnosticCount: number | null;
            latestDiagnosticCount: number | null;
            repairTriggered: boolean;
            repairAttempts: number;
            maxRepairAttempts: number | null;
            repairOutcome: "exhausted" | "not_applicable" | "not_needed" | "repaired" | "unresolved";
            recoveredDeliveryCount: 0 | 1;
            blockedBrokenDeliveryCount: 0 | 1;
            deliveredWithSyntaxWarningCount?: 0 | 1 | undefined;
        } | undefined;
    }>>;
    limitations: import("zod").ZodArray<import("zod").ZodString, "many">;
    attributes: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
}, import("zod").ZodTypeAny, "passthrough">[];
