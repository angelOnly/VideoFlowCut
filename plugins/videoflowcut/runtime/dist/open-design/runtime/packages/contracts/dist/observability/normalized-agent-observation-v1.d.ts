import { z } from 'zod';
export declare const NORMALIZED_AGENT_OBSERVATION_V1_SCHEMA: 'open-design.normalized-agent-observation/v1';
export declare const NormalizedAgentObservationKindV1Schema: z.ZodEnum<["task_run", "child_agent", "model_call", "tool"]>;
export type NormalizedAgentObservationKindV1 = z.infer<typeof NormalizedAgentObservationKindV1Schema>;
export declare const NormalizedAgentObservationStatusV1Schema: z.ZodEnum<["queued", "running", "completed", "failed", "canceled", "unknown"]>;
export type NormalizedAgentObservationStatusV1 = z.infer<typeof NormalizedAgentObservationStatusV1Schema>;
export declare const ObservationFactAvailabilityV1Schema: z.ZodEnum<["complete", "partial", "unavailable"]>;
export type ObservationFactAvailabilityV1 = z.infer<typeof ObservationFactAvailabilityV1Schema>;
export declare const ChildEvidenceCoverageV1Schema: z.ZodEffects<z.ZodObject<{
    availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
    source: z.ZodString;
    /**
     * How many distinct Child agents the adapter observed — NOT how many times
     * they were invoked.
     *
     * A parent may re-enter the same Child repeatedly, and a runtime whose
     * evidence is turn-shaped (Codex opens a new rollout turn per invocation)
     * must fold those back to one before reporting here. Leaving the unit unsaid
     * let one adapter count invocations and another count Children, which made
     * the two runtimes' figures silently incomparable.
     */
    knownChildCount: z.ZodNumber;
    explicitZero: z.ZodBoolean;
    limitations: z.ZodArray<z.ZodString, "many">;
    diagnosticCounts: z.ZodArray<z.ZodObject<{
        code: z.ZodString;
        count: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        code: string;
        count: number;
    }, {
        code: string;
        count: number;
    }>, "many">;
}, "strict", z.ZodTypeAny, {
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
}>;
export type ChildEvidenceCoverageV1 = z.infer<typeof ChildEvidenceCoverageV1Schema>;
export declare const ObservationIdentityV1Schema: z.ZodEffects<z.ZodObject<{
    observationId: z.ZodString;
    taskExecutionId: z.ZodString;
    runId: z.ZodString;
    taskRunIndex: z.ZodNumber;
    parentObservationId: z.ZodOptional<z.ZodString>;
    runtimeSessionId: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    observationId: z.ZodString;
    taskExecutionId: z.ZodString;
    runId: z.ZodString;
    taskRunIndex: z.ZodNumber;
    parentObservationId: z.ZodOptional<z.ZodString>;
    runtimeSessionId: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    observationId: z.ZodString;
    taskExecutionId: z.ZodString;
    runId: z.ZodString;
    taskRunIndex: z.ZodNumber;
    parentObservationId: z.ZodOptional<z.ZodString>;
    runtimeSessionId: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
    observationId: z.ZodString;
    taskExecutionId: z.ZodString;
    runId: z.ZodString;
    taskRunIndex: z.ZodNumber;
    parentObservationId: z.ZodOptional<z.ZodString>;
    runtimeSessionId: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    observationId: z.ZodString;
    taskExecutionId: z.ZodString;
    runId: z.ZodString;
    taskRunIndex: z.ZodNumber;
    parentObservationId: z.ZodOptional<z.ZodString>;
    runtimeSessionId: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
export type ObservationIdentityV1 = z.infer<typeof ObservationIdentityV1Schema>;
export declare const PromptBoundaryAvailabilityV1Schema: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
export type PromptBoundaryAvailabilityV1 = z.infer<typeof PromptBoundaryAvailabilityV1Schema>;
export declare const ObservationEvidenceSourceV1Schema: z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>;
export type ObservationEvidenceSourceV1 = z.infer<typeof ObservationEvidenceSourceV1Schema>;
export declare const PromptBoundaryEvidenceV1Schema: z.ZodEffects<z.ZodObject<{
    availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
    source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
    hash: z.ZodOptional<z.ZodString>;
    bytes: z.ZodOptional<z.ZodNumber>;
    safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    limitations: z.ZodArray<z.ZodString, "many">;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
    source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
    hash: z.ZodOptional<z.ZodString>;
    bytes: z.ZodOptional<z.ZodNumber>;
    safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    limitations: z.ZodArray<z.ZodString, "many">;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
    source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
    hash: z.ZodOptional<z.ZodString>;
    bytes: z.ZodOptional<z.ZodNumber>;
    safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    limitations: z.ZodArray<z.ZodString, "many">;
}, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
    availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
    source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
    hash: z.ZodOptional<z.ZodString>;
    bytes: z.ZodOptional<z.ZodNumber>;
    safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    limitations: z.ZodArray<z.ZodString, "many">;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
    source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
    hash: z.ZodOptional<z.ZodString>;
    bytes: z.ZodOptional<z.ZodNumber>;
    safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    limitations: z.ZodArray<z.ZodString, "many">;
}, z.ZodTypeAny, "passthrough">>;
export type PromptBoundaryEvidenceV1 = z.infer<typeof PromptBoundaryEvidenceV1Schema>;
export declare const NormalizedPromptEvidenceV1Schema: z.ZodObject<{
    hostComposed: z.ZodEffects<z.ZodObject<{
        availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
        source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
        hash: z.ZodOptional<z.ZodString>;
        bytes: z.ZodOptional<z.ZodNumber>;
        safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
        source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
        hash: z.ZodOptional<z.ZodString>;
        bytes: z.ZodOptional<z.ZodNumber>;
        safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
        source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
        hash: z.ZodOptional<z.ZodString>;
        bytes: z.ZodOptional<z.ZodNumber>;
        safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
        availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
        source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
        hash: z.ZodOptional<z.ZodString>;
        bytes: z.ZodOptional<z.ZodNumber>;
        safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
        source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
        hash: z.ZodOptional<z.ZodString>;
        bytes: z.ZodOptional<z.ZodNumber>;
        safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">>;
    childInjected: z.ZodEffects<z.ZodObject<{
        availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
        source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
        hash: z.ZodOptional<z.ZodString>;
        bytes: z.ZodOptional<z.ZodNumber>;
        safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
        source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
        hash: z.ZodOptional<z.ZodString>;
        bytes: z.ZodOptional<z.ZodNumber>;
        safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
        source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
        hash: z.ZodOptional<z.ZodString>;
        bytes: z.ZodOptional<z.ZodNumber>;
        safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
        availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
        source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
        hash: z.ZodOptional<z.ZodString>;
        bytes: z.ZodOptional<z.ZodNumber>;
        safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
        source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
        hash: z.ZodOptional<z.ZodString>;
        bytes: z.ZodOptional<z.ZodNumber>;
        safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">>;
    agentEffectiveContext: z.ZodEffects<z.ZodObject<{
        availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
        source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
        hash: z.ZodOptional<z.ZodString>;
        bytes: z.ZodOptional<z.ZodNumber>;
        safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
        source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
        hash: z.ZodOptional<z.ZodString>;
        bytes: z.ZodOptional<z.ZodNumber>;
        safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
        source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
        hash: z.ZodOptional<z.ZodString>;
        bytes: z.ZodOptional<z.ZodNumber>;
        safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
        availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
        source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
        hash: z.ZodOptional<z.ZodString>;
        bytes: z.ZodOptional<z.ZodNumber>;
        safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
        source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
        hash: z.ZodOptional<z.ZodString>;
        bytes: z.ZodOptional<z.ZodNumber>;
        safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    hostComposed: z.ZodEffects<z.ZodObject<{
        availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
        source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
        hash: z.ZodOptional<z.ZodString>;
        bytes: z.ZodOptional<z.ZodNumber>;
        safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
        source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
        hash: z.ZodOptional<z.ZodString>;
        bytes: z.ZodOptional<z.ZodNumber>;
        safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
        source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
        hash: z.ZodOptional<z.ZodString>;
        bytes: z.ZodOptional<z.ZodNumber>;
        safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
        availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
        source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
        hash: z.ZodOptional<z.ZodString>;
        bytes: z.ZodOptional<z.ZodNumber>;
        safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
        source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
        hash: z.ZodOptional<z.ZodString>;
        bytes: z.ZodOptional<z.ZodNumber>;
        safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">>;
    childInjected: z.ZodEffects<z.ZodObject<{
        availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
        source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
        hash: z.ZodOptional<z.ZodString>;
        bytes: z.ZodOptional<z.ZodNumber>;
        safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
        source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
        hash: z.ZodOptional<z.ZodString>;
        bytes: z.ZodOptional<z.ZodNumber>;
        safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
        source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
        hash: z.ZodOptional<z.ZodString>;
        bytes: z.ZodOptional<z.ZodNumber>;
        safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
        availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
        source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
        hash: z.ZodOptional<z.ZodString>;
        bytes: z.ZodOptional<z.ZodNumber>;
        safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
        source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
        hash: z.ZodOptional<z.ZodString>;
        bytes: z.ZodOptional<z.ZodNumber>;
        safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">>;
    agentEffectiveContext: z.ZodEffects<z.ZodObject<{
        availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
        source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
        hash: z.ZodOptional<z.ZodString>;
        bytes: z.ZodOptional<z.ZodNumber>;
        safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
        source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
        hash: z.ZodOptional<z.ZodString>;
        bytes: z.ZodOptional<z.ZodNumber>;
        safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
        source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
        hash: z.ZodOptional<z.ZodString>;
        bytes: z.ZodOptional<z.ZodNumber>;
        safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
        availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
        source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
        hash: z.ZodOptional<z.ZodString>;
        bytes: z.ZodOptional<z.ZodNumber>;
        safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
        source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
        hash: z.ZodOptional<z.ZodString>;
        bytes: z.ZodOptional<z.ZodNumber>;
        safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    hostComposed: z.ZodEffects<z.ZodObject<{
        availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
        source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
        hash: z.ZodOptional<z.ZodString>;
        bytes: z.ZodOptional<z.ZodNumber>;
        safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
        source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
        hash: z.ZodOptional<z.ZodString>;
        bytes: z.ZodOptional<z.ZodNumber>;
        safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
        source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
        hash: z.ZodOptional<z.ZodString>;
        bytes: z.ZodOptional<z.ZodNumber>;
        safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
        availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
        source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
        hash: z.ZodOptional<z.ZodString>;
        bytes: z.ZodOptional<z.ZodNumber>;
        safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
        source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
        hash: z.ZodOptional<z.ZodString>;
        bytes: z.ZodOptional<z.ZodNumber>;
        safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">>;
    childInjected: z.ZodEffects<z.ZodObject<{
        availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
        source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
        hash: z.ZodOptional<z.ZodString>;
        bytes: z.ZodOptional<z.ZodNumber>;
        safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
        source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
        hash: z.ZodOptional<z.ZodString>;
        bytes: z.ZodOptional<z.ZodNumber>;
        safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
        source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
        hash: z.ZodOptional<z.ZodString>;
        bytes: z.ZodOptional<z.ZodNumber>;
        safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
        availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
        source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
        hash: z.ZodOptional<z.ZodString>;
        bytes: z.ZodOptional<z.ZodNumber>;
        safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
        source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
        hash: z.ZodOptional<z.ZodString>;
        bytes: z.ZodOptional<z.ZodNumber>;
        safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">>;
    agentEffectiveContext: z.ZodEffects<z.ZodObject<{
        availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
        source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
        hash: z.ZodOptional<z.ZodString>;
        bytes: z.ZodOptional<z.ZodNumber>;
        safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
        source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
        hash: z.ZodOptional<z.ZodString>;
        bytes: z.ZodOptional<z.ZodNumber>;
        safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
        source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
        hash: z.ZodOptional<z.ZodString>;
        bytes: z.ZodOptional<z.ZodNumber>;
        safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
        availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
        source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
        hash: z.ZodOptional<z.ZodString>;
        bytes: z.ZodOptional<z.ZodNumber>;
        safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
        source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
        hash: z.ZodOptional<z.ZodString>;
        bytes: z.ZodOptional<z.ZodNumber>;
        safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">>;
}, z.ZodTypeAny, "passthrough">>;
export type NormalizedPromptEvidenceV1 = z.infer<typeof NormalizedPromptEvidenceV1Schema>;
export declare const ObservationUsageAccountingModeV1Schema: z.ZodEnum<["inclusive", "additive", "unknown"]>;
export type ObservationUsageAccountingModeV1 = z.infer<typeof ObservationUsageAccountingModeV1Schema>;
export declare const ObservationUsageSourceV1Schema: z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>;
export type ObservationUsageSourceV1 = z.infer<typeof ObservationUsageSourceV1Schema>;
export declare const ObservationUsageValuesV1Schema: z.ZodEffects<z.ZodObject<{
    inputTokens: z.ZodOptional<z.ZodNumber>;
    effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
    outputTokens: z.ZodOptional<z.ZodNumber>;
    totalTokens: z.ZodOptional<z.ZodNumber>;
    thoughtTokens: z.ZodOptional<z.ZodNumber>;
    cacheReadTokens: z.ZodOptional<z.ZodNumber>;
    cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
    uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
    estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    inputTokens: z.ZodOptional<z.ZodNumber>;
    effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
    outputTokens: z.ZodOptional<z.ZodNumber>;
    totalTokens: z.ZodOptional<z.ZodNumber>;
    thoughtTokens: z.ZodOptional<z.ZodNumber>;
    cacheReadTokens: z.ZodOptional<z.ZodNumber>;
    cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
    uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
    estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    inputTokens: z.ZodOptional<z.ZodNumber>;
    effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
    outputTokens: z.ZodOptional<z.ZodNumber>;
    totalTokens: z.ZodOptional<z.ZodNumber>;
    thoughtTokens: z.ZodOptional<z.ZodNumber>;
    cacheReadTokens: z.ZodOptional<z.ZodNumber>;
    cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
    uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
    estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
    inputTokens: z.ZodOptional<z.ZodNumber>;
    effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
    outputTokens: z.ZodOptional<z.ZodNumber>;
    totalTokens: z.ZodOptional<z.ZodNumber>;
    thoughtTokens: z.ZodOptional<z.ZodNumber>;
    cacheReadTokens: z.ZodOptional<z.ZodNumber>;
    cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
    uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
    estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    inputTokens: z.ZodOptional<z.ZodNumber>;
    effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
    outputTokens: z.ZodOptional<z.ZodNumber>;
    totalTokens: z.ZodOptional<z.ZodNumber>;
    thoughtTokens: z.ZodOptional<z.ZodNumber>;
    cacheReadTokens: z.ZodOptional<z.ZodNumber>;
    cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
    uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
    estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">>;
export type ObservationUsageValuesV1 = z.infer<typeof ObservationUsageValuesV1Schema>;
export declare const ObservationUsageValueSourcesV1Schema: z.ZodRecord<z.ZodString, z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
export type ObservationUsageValueSourcesV1 = z.infer<typeof ObservationUsageValueSourcesV1Schema>;
export declare const NormalizedUsageEvidenceV1Schema: z.ZodEffects<z.ZodObject<{
    availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
    source: z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>;
    accountingMode: z.ZodEnum<["inclusive", "additive", "unknown"]>;
    values: z.ZodOptional<z.ZodEffects<z.ZodObject<{
        inputTokens: z.ZodOptional<z.ZodNumber>;
        effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
        outputTokens: z.ZodOptional<z.ZodNumber>;
        totalTokens: z.ZodOptional<z.ZodNumber>;
        thoughtTokens: z.ZodOptional<z.ZodNumber>;
        cacheReadTokens: z.ZodOptional<z.ZodNumber>;
        cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
        uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
        estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        inputTokens: z.ZodOptional<z.ZodNumber>;
        effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
        outputTokens: z.ZodOptional<z.ZodNumber>;
        totalTokens: z.ZodOptional<z.ZodNumber>;
        thoughtTokens: z.ZodOptional<z.ZodNumber>;
        cacheReadTokens: z.ZodOptional<z.ZodNumber>;
        cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
        uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
        estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        inputTokens: z.ZodOptional<z.ZodNumber>;
        effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
        outputTokens: z.ZodOptional<z.ZodNumber>;
        totalTokens: z.ZodOptional<z.ZodNumber>;
        thoughtTokens: z.ZodOptional<z.ZodNumber>;
        cacheReadTokens: z.ZodOptional<z.ZodNumber>;
        cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
        uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
        estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
        inputTokens: z.ZodOptional<z.ZodNumber>;
        effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
        outputTokens: z.ZodOptional<z.ZodNumber>;
        totalTokens: z.ZodOptional<z.ZodNumber>;
        thoughtTokens: z.ZodOptional<z.ZodNumber>;
        cacheReadTokens: z.ZodOptional<z.ZodNumber>;
        cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
        uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
        estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        inputTokens: z.ZodOptional<z.ZodNumber>;
        effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
        outputTokens: z.ZodOptional<z.ZodNumber>;
        totalTokens: z.ZodOptional<z.ZodNumber>;
        thoughtTokens: z.ZodOptional<z.ZodNumber>;
        cacheReadTokens: z.ZodOptional<z.ZodNumber>;
        cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
        uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
        estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>>;
    valueSources: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>>;
    limitations: z.ZodArray<z.ZodString, "many">;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
    source: z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>;
    accountingMode: z.ZodEnum<["inclusive", "additive", "unknown"]>;
    values: z.ZodOptional<z.ZodEffects<z.ZodObject<{
        inputTokens: z.ZodOptional<z.ZodNumber>;
        effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
        outputTokens: z.ZodOptional<z.ZodNumber>;
        totalTokens: z.ZodOptional<z.ZodNumber>;
        thoughtTokens: z.ZodOptional<z.ZodNumber>;
        cacheReadTokens: z.ZodOptional<z.ZodNumber>;
        cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
        uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
        estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        inputTokens: z.ZodOptional<z.ZodNumber>;
        effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
        outputTokens: z.ZodOptional<z.ZodNumber>;
        totalTokens: z.ZodOptional<z.ZodNumber>;
        thoughtTokens: z.ZodOptional<z.ZodNumber>;
        cacheReadTokens: z.ZodOptional<z.ZodNumber>;
        cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
        uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
        estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        inputTokens: z.ZodOptional<z.ZodNumber>;
        effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
        outputTokens: z.ZodOptional<z.ZodNumber>;
        totalTokens: z.ZodOptional<z.ZodNumber>;
        thoughtTokens: z.ZodOptional<z.ZodNumber>;
        cacheReadTokens: z.ZodOptional<z.ZodNumber>;
        cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
        uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
        estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
        inputTokens: z.ZodOptional<z.ZodNumber>;
        effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
        outputTokens: z.ZodOptional<z.ZodNumber>;
        totalTokens: z.ZodOptional<z.ZodNumber>;
        thoughtTokens: z.ZodOptional<z.ZodNumber>;
        cacheReadTokens: z.ZodOptional<z.ZodNumber>;
        cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
        uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
        estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        inputTokens: z.ZodOptional<z.ZodNumber>;
        effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
        outputTokens: z.ZodOptional<z.ZodNumber>;
        totalTokens: z.ZodOptional<z.ZodNumber>;
        thoughtTokens: z.ZodOptional<z.ZodNumber>;
        cacheReadTokens: z.ZodOptional<z.ZodNumber>;
        cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
        uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
        estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>>;
    valueSources: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>>;
    limitations: z.ZodArray<z.ZodString, "many">;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
    source: z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>;
    accountingMode: z.ZodEnum<["inclusive", "additive", "unknown"]>;
    values: z.ZodOptional<z.ZodEffects<z.ZodObject<{
        inputTokens: z.ZodOptional<z.ZodNumber>;
        effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
        outputTokens: z.ZodOptional<z.ZodNumber>;
        totalTokens: z.ZodOptional<z.ZodNumber>;
        thoughtTokens: z.ZodOptional<z.ZodNumber>;
        cacheReadTokens: z.ZodOptional<z.ZodNumber>;
        cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
        uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
        estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        inputTokens: z.ZodOptional<z.ZodNumber>;
        effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
        outputTokens: z.ZodOptional<z.ZodNumber>;
        totalTokens: z.ZodOptional<z.ZodNumber>;
        thoughtTokens: z.ZodOptional<z.ZodNumber>;
        cacheReadTokens: z.ZodOptional<z.ZodNumber>;
        cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
        uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
        estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        inputTokens: z.ZodOptional<z.ZodNumber>;
        effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
        outputTokens: z.ZodOptional<z.ZodNumber>;
        totalTokens: z.ZodOptional<z.ZodNumber>;
        thoughtTokens: z.ZodOptional<z.ZodNumber>;
        cacheReadTokens: z.ZodOptional<z.ZodNumber>;
        cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
        uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
        estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
        inputTokens: z.ZodOptional<z.ZodNumber>;
        effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
        outputTokens: z.ZodOptional<z.ZodNumber>;
        totalTokens: z.ZodOptional<z.ZodNumber>;
        thoughtTokens: z.ZodOptional<z.ZodNumber>;
        cacheReadTokens: z.ZodOptional<z.ZodNumber>;
        cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
        uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
        estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        inputTokens: z.ZodOptional<z.ZodNumber>;
        effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
        outputTokens: z.ZodOptional<z.ZodNumber>;
        totalTokens: z.ZodOptional<z.ZodNumber>;
        thoughtTokens: z.ZodOptional<z.ZodNumber>;
        cacheReadTokens: z.ZodOptional<z.ZodNumber>;
        cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
        uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
        estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>>;
    valueSources: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>>;
    limitations: z.ZodArray<z.ZodString, "many">;
}, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
    availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
    source: z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>;
    accountingMode: z.ZodEnum<["inclusive", "additive", "unknown"]>;
    values: z.ZodOptional<z.ZodEffects<z.ZodObject<{
        inputTokens: z.ZodOptional<z.ZodNumber>;
        effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
        outputTokens: z.ZodOptional<z.ZodNumber>;
        totalTokens: z.ZodOptional<z.ZodNumber>;
        thoughtTokens: z.ZodOptional<z.ZodNumber>;
        cacheReadTokens: z.ZodOptional<z.ZodNumber>;
        cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
        uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
        estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        inputTokens: z.ZodOptional<z.ZodNumber>;
        effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
        outputTokens: z.ZodOptional<z.ZodNumber>;
        totalTokens: z.ZodOptional<z.ZodNumber>;
        thoughtTokens: z.ZodOptional<z.ZodNumber>;
        cacheReadTokens: z.ZodOptional<z.ZodNumber>;
        cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
        uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
        estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        inputTokens: z.ZodOptional<z.ZodNumber>;
        effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
        outputTokens: z.ZodOptional<z.ZodNumber>;
        totalTokens: z.ZodOptional<z.ZodNumber>;
        thoughtTokens: z.ZodOptional<z.ZodNumber>;
        cacheReadTokens: z.ZodOptional<z.ZodNumber>;
        cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
        uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
        estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
        inputTokens: z.ZodOptional<z.ZodNumber>;
        effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
        outputTokens: z.ZodOptional<z.ZodNumber>;
        totalTokens: z.ZodOptional<z.ZodNumber>;
        thoughtTokens: z.ZodOptional<z.ZodNumber>;
        cacheReadTokens: z.ZodOptional<z.ZodNumber>;
        cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
        uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
        estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        inputTokens: z.ZodOptional<z.ZodNumber>;
        effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
        outputTokens: z.ZodOptional<z.ZodNumber>;
        totalTokens: z.ZodOptional<z.ZodNumber>;
        thoughtTokens: z.ZodOptional<z.ZodNumber>;
        cacheReadTokens: z.ZodOptional<z.ZodNumber>;
        cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
        uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
        estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>>;
    valueSources: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>>;
    limitations: z.ZodArray<z.ZodString, "many">;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
    source: z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>;
    accountingMode: z.ZodEnum<["inclusive", "additive", "unknown"]>;
    values: z.ZodOptional<z.ZodEffects<z.ZodObject<{
        inputTokens: z.ZodOptional<z.ZodNumber>;
        effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
        outputTokens: z.ZodOptional<z.ZodNumber>;
        totalTokens: z.ZodOptional<z.ZodNumber>;
        thoughtTokens: z.ZodOptional<z.ZodNumber>;
        cacheReadTokens: z.ZodOptional<z.ZodNumber>;
        cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
        uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
        estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        inputTokens: z.ZodOptional<z.ZodNumber>;
        effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
        outputTokens: z.ZodOptional<z.ZodNumber>;
        totalTokens: z.ZodOptional<z.ZodNumber>;
        thoughtTokens: z.ZodOptional<z.ZodNumber>;
        cacheReadTokens: z.ZodOptional<z.ZodNumber>;
        cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
        uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
        estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        inputTokens: z.ZodOptional<z.ZodNumber>;
        effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
        outputTokens: z.ZodOptional<z.ZodNumber>;
        totalTokens: z.ZodOptional<z.ZodNumber>;
        thoughtTokens: z.ZodOptional<z.ZodNumber>;
        cacheReadTokens: z.ZodOptional<z.ZodNumber>;
        cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
        uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
        estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
        inputTokens: z.ZodOptional<z.ZodNumber>;
        effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
        outputTokens: z.ZodOptional<z.ZodNumber>;
        totalTokens: z.ZodOptional<z.ZodNumber>;
        thoughtTokens: z.ZodOptional<z.ZodNumber>;
        cacheReadTokens: z.ZodOptional<z.ZodNumber>;
        cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
        uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
        estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        inputTokens: z.ZodOptional<z.ZodNumber>;
        effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
        outputTokens: z.ZodOptional<z.ZodNumber>;
        totalTokens: z.ZodOptional<z.ZodNumber>;
        thoughtTokens: z.ZodOptional<z.ZodNumber>;
        cacheReadTokens: z.ZodOptional<z.ZodNumber>;
        cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
        uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
        estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>>;
    valueSources: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>>;
    limitations: z.ZodArray<z.ZodString, "many">;
}, z.ZodTypeAny, "passthrough">>;
export type NormalizedUsageEvidenceV1 = z.infer<typeof NormalizedUsageEvidenceV1Schema>;
export declare const ObservationTimingSourceV1Schema: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
export type ObservationTimingSourceV1 = z.infer<typeof ObservationTimingSourceV1Schema>;
export declare const TimingEvidenceV1Schema: z.ZodEffects<z.ZodObject<{
    source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
    clockDomain: z.ZodString;
    startedAtMs: z.ZodOptional<z.ZodNumber>;
    endedAtMs: z.ZodOptional<z.ZodNumber>;
    durationMs: z.ZodOptional<z.ZodNumber>;
    measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
    limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
    clockDomain: z.ZodString;
    startedAtMs: z.ZodOptional<z.ZodNumber>;
    endedAtMs: z.ZodOptional<z.ZodNumber>;
    durationMs: z.ZodOptional<z.ZodNumber>;
    measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
    limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
    clockDomain: z.ZodString;
    startedAtMs: z.ZodOptional<z.ZodNumber>;
    endedAtMs: z.ZodOptional<z.ZodNumber>;
    durationMs: z.ZodOptional<z.ZodNumber>;
    measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
    limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
    source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
    clockDomain: z.ZodString;
    startedAtMs: z.ZodOptional<z.ZodNumber>;
    endedAtMs: z.ZodOptional<z.ZodNumber>;
    durationMs: z.ZodOptional<z.ZodNumber>;
    measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
    limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
    clockDomain: z.ZodString;
    startedAtMs: z.ZodOptional<z.ZodNumber>;
    endedAtMs: z.ZodOptional<z.ZodNumber>;
    durationMs: z.ZodOptional<z.ZodNumber>;
    measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
    limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, z.ZodTypeAny, "passthrough">>;
export type TimingEvidenceV1 = z.infer<typeof TimingEvidenceV1Schema>;
export declare const NormalizedTimingEvidenceV1Schema: z.ZodEffects<z.ZodObject<{
    availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
    evidence: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodObject<{
        source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
        clockDomain: z.ZodString;
        startedAtMs: z.ZodOptional<z.ZodNumber>;
        endedAtMs: z.ZodOptional<z.ZodNumber>;
        durationMs: z.ZodOptional<z.ZodNumber>;
        measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
        limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
        clockDomain: z.ZodString;
        startedAtMs: z.ZodOptional<z.ZodNumber>;
        endedAtMs: z.ZodOptional<z.ZodNumber>;
        durationMs: z.ZodOptional<z.ZodNumber>;
        measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
        limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
        clockDomain: z.ZodString;
        startedAtMs: z.ZodOptional<z.ZodNumber>;
        endedAtMs: z.ZodOptional<z.ZodNumber>;
        durationMs: z.ZodOptional<z.ZodNumber>;
        measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
        limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
        source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
        clockDomain: z.ZodString;
        startedAtMs: z.ZodOptional<z.ZodNumber>;
        endedAtMs: z.ZodOptional<z.ZodNumber>;
        durationMs: z.ZodOptional<z.ZodNumber>;
        measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
        limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
        clockDomain: z.ZodString;
        startedAtMs: z.ZodOptional<z.ZodNumber>;
        endedAtMs: z.ZodOptional<z.ZodNumber>;
        durationMs: z.ZodOptional<z.ZodNumber>;
        measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
        limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>, "many">>;
    limitations: z.ZodArray<z.ZodString, "many">;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
    evidence: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodObject<{
        source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
        clockDomain: z.ZodString;
        startedAtMs: z.ZodOptional<z.ZodNumber>;
        endedAtMs: z.ZodOptional<z.ZodNumber>;
        durationMs: z.ZodOptional<z.ZodNumber>;
        measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
        limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
        clockDomain: z.ZodString;
        startedAtMs: z.ZodOptional<z.ZodNumber>;
        endedAtMs: z.ZodOptional<z.ZodNumber>;
        durationMs: z.ZodOptional<z.ZodNumber>;
        measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
        limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
        clockDomain: z.ZodString;
        startedAtMs: z.ZodOptional<z.ZodNumber>;
        endedAtMs: z.ZodOptional<z.ZodNumber>;
        durationMs: z.ZodOptional<z.ZodNumber>;
        measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
        limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
        source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
        clockDomain: z.ZodString;
        startedAtMs: z.ZodOptional<z.ZodNumber>;
        endedAtMs: z.ZodOptional<z.ZodNumber>;
        durationMs: z.ZodOptional<z.ZodNumber>;
        measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
        limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
        clockDomain: z.ZodString;
        startedAtMs: z.ZodOptional<z.ZodNumber>;
        endedAtMs: z.ZodOptional<z.ZodNumber>;
        durationMs: z.ZodOptional<z.ZodNumber>;
        measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
        limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>, "many">>;
    limitations: z.ZodArray<z.ZodString, "many">;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
    evidence: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodObject<{
        source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
        clockDomain: z.ZodString;
        startedAtMs: z.ZodOptional<z.ZodNumber>;
        endedAtMs: z.ZodOptional<z.ZodNumber>;
        durationMs: z.ZodOptional<z.ZodNumber>;
        measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
        limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
        clockDomain: z.ZodString;
        startedAtMs: z.ZodOptional<z.ZodNumber>;
        endedAtMs: z.ZodOptional<z.ZodNumber>;
        durationMs: z.ZodOptional<z.ZodNumber>;
        measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
        limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
        clockDomain: z.ZodString;
        startedAtMs: z.ZodOptional<z.ZodNumber>;
        endedAtMs: z.ZodOptional<z.ZodNumber>;
        durationMs: z.ZodOptional<z.ZodNumber>;
        measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
        limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
        source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
        clockDomain: z.ZodString;
        startedAtMs: z.ZodOptional<z.ZodNumber>;
        endedAtMs: z.ZodOptional<z.ZodNumber>;
        durationMs: z.ZodOptional<z.ZodNumber>;
        measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
        limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
        clockDomain: z.ZodString;
        startedAtMs: z.ZodOptional<z.ZodNumber>;
        endedAtMs: z.ZodOptional<z.ZodNumber>;
        durationMs: z.ZodOptional<z.ZodNumber>;
        measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
        limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>, "many">>;
    limitations: z.ZodArray<z.ZodString, "many">;
}, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
    availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
    evidence: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodObject<{
        source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
        clockDomain: z.ZodString;
        startedAtMs: z.ZodOptional<z.ZodNumber>;
        endedAtMs: z.ZodOptional<z.ZodNumber>;
        durationMs: z.ZodOptional<z.ZodNumber>;
        measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
        limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
        clockDomain: z.ZodString;
        startedAtMs: z.ZodOptional<z.ZodNumber>;
        endedAtMs: z.ZodOptional<z.ZodNumber>;
        durationMs: z.ZodOptional<z.ZodNumber>;
        measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
        limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
        clockDomain: z.ZodString;
        startedAtMs: z.ZodOptional<z.ZodNumber>;
        endedAtMs: z.ZodOptional<z.ZodNumber>;
        durationMs: z.ZodOptional<z.ZodNumber>;
        measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
        limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
        source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
        clockDomain: z.ZodString;
        startedAtMs: z.ZodOptional<z.ZodNumber>;
        endedAtMs: z.ZodOptional<z.ZodNumber>;
        durationMs: z.ZodOptional<z.ZodNumber>;
        measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
        limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
        clockDomain: z.ZodString;
        startedAtMs: z.ZodOptional<z.ZodNumber>;
        endedAtMs: z.ZodOptional<z.ZodNumber>;
        durationMs: z.ZodOptional<z.ZodNumber>;
        measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
        limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>, "many">>;
    limitations: z.ZodArray<z.ZodString, "many">;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
    evidence: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodObject<{
        source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
        clockDomain: z.ZodString;
        startedAtMs: z.ZodOptional<z.ZodNumber>;
        endedAtMs: z.ZodOptional<z.ZodNumber>;
        durationMs: z.ZodOptional<z.ZodNumber>;
        measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
        limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
        clockDomain: z.ZodString;
        startedAtMs: z.ZodOptional<z.ZodNumber>;
        endedAtMs: z.ZodOptional<z.ZodNumber>;
        durationMs: z.ZodOptional<z.ZodNumber>;
        measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
        limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
        clockDomain: z.ZodString;
        startedAtMs: z.ZodOptional<z.ZodNumber>;
        endedAtMs: z.ZodOptional<z.ZodNumber>;
        durationMs: z.ZodOptional<z.ZodNumber>;
        measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
        limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
        source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
        clockDomain: z.ZodString;
        startedAtMs: z.ZodOptional<z.ZodNumber>;
        endedAtMs: z.ZodOptional<z.ZodNumber>;
        durationMs: z.ZodOptional<z.ZodNumber>;
        measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
        limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
        clockDomain: z.ZodString;
        startedAtMs: z.ZodOptional<z.ZodNumber>;
        endedAtMs: z.ZodOptional<z.ZodNumber>;
        durationMs: z.ZodOptional<z.ZodNumber>;
        measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
        limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>, "many">>;
    limitations: z.ZodArray<z.ZodString, "many">;
}, z.ZodTypeAny, "passthrough">>;
export type NormalizedTimingEvidenceV1 = z.infer<typeof NormalizedTimingEvidenceV1Schema>;
/**
 * Identifies one provider/runtime turn for usage aggregation.
 *
 * Some runtimes repeat a child turn in a parent or sibling stream. Keeping the
 * owner/excluded decision beside the normalized fact lets downstream readers
 * avoid counting the inherited copy without guessing from provider event
 * names. The field is optional for V1 producers that cannot observe this
 * boundary; absence must remain partial/unavailable rather than being inferred.
 */
export declare const ObservationTurnAccountingV1Schema: z.ZodObject<{
    turnId: z.ZodString;
    disposition: z.ZodEnum<["owner", "exclude_inherited"]>;
    ownerObservationId: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    turnId: z.ZodString;
    disposition: z.ZodEnum<["owner", "exclude_inherited"]>;
    ownerObservationId: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    turnId: z.ZodString;
    disposition: z.ZodEnum<["owner", "exclude_inherited"]>;
    ownerObservationId: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
export type ObservationTurnAccountingV1 = z.infer<typeof ObservationTurnAccountingV1Schema>;
export declare const SAFE_RUN_QUALITY_V1_SCHEMA: 'open-design.safe-run-quality/v1';
export declare const SafeObservationTextV1Schema: z.ZodObject<{
    text: z.ZodString;
    redacted: z.ZodLiteral<true>;
    truncated: z.ZodBoolean;
}, "strict", z.ZodTypeAny, {
    text: string;
    redacted: true;
    truncated: boolean;
}, {
    text: string;
    redacted: true;
    truncated: boolean;
}>;
export type SafeObservationTextV1 = z.infer<typeof SafeObservationTextV1Schema>;
export declare const SafeObservationErrorV1Schema: z.ZodObject<{
    message: z.ZodOptional<z.ZodObject<{
        text: z.ZodString;
        redacted: z.ZodLiteral<true>;
        truncated: z.ZodBoolean;
    }, "strict", z.ZodTypeAny, {
        text: string;
        redacted: true;
        truncated: boolean;
    }, {
        text: string;
        redacted: true;
        truncated: boolean;
    }>>;
    code: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    detail: z.ZodOptional<z.ZodString>;
    stage: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
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
}>;
export type SafeObservationErrorV1 = z.infer<typeof SafeObservationErrorV1Schema>;
export declare const SafeObservationToolV1Schema: z.ZodObject<{
    callHash: z.ZodString;
    name: z.ZodString;
    input: z.ZodOptional<z.ZodObject<{
        text: z.ZodString;
        redacted: z.ZodLiteral<true>;
        truncated: z.ZodBoolean;
    }, "strict", z.ZodTypeAny, {
        text: string;
        redacted: true;
        truncated: boolean;
    }, {
        text: string;
        redacted: true;
        truncated: boolean;
    }>>;
    output: z.ZodOptional<z.ZodObject<{
        text: z.ZodString;
        redacted: z.ZodLiteral<true>;
        truncated: z.ZodBoolean;
    }, "strict", z.ZodTypeAny, {
        text: string;
        redacted: true;
        truncated: boolean;
    }, {
        text: string;
        redacted: true;
        truncated: boolean;
    }>>;
    status: z.ZodEnum<["running", "completed", "failed", "unknown"]>;
    isError: z.ZodBoolean;
    startedAtMs: z.ZodOptional<z.ZodNumber>;
    endedAtMs: z.ZodOptional<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
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
}>;
export type SafeObservationToolV1 = z.infer<typeof SafeObservationToolV1Schema>;
export declare const SafeObservationManifestEntryV1Schema: z.ZodObject<{
    object_class: z.ZodEnum<["attachment", "artifact", "input_text_snapshot"]>;
    storage_ref: z.ZodString;
    status: z.ZodEnum<["ok", "partial", "unavailable"]>;
    reason: z.ZodOptional<z.ZodString>;
    project_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    run_id: z.ZodOptional<z.ZodString>;
    workspace_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    size_bytes: z.ZodOptional<z.ZodNumber>;
    sha256: z.ZodOptional<z.ZodString>;
    mime_type: z.ZodOptional<z.ZodString>;
    extension: z.ZodOptional<z.ZodString>;
    redacted: z.ZodBoolean;
    truncated: z.ZodBoolean;
    stored_in_open_design: z.ZodOptional<z.ZodBoolean>;
    retention_policy: z.ZodOptional<z.ZodString>;
    access_scope: z.ZodOptional<z.ZodString>;
    sensitivity: z.ZodOptional<z.ZodString>;
    source: z.ZodOptional<z.ZodString>;
    expires_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    approved_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    attachment_id: z.ZodOptional<z.ZodString>;
    artifact_id: z.ZodOptional<z.ZodString>;
    input_text_snapshot_id: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodString>;
    artifact_kind: z.ZodOptional<z.ZodString>;
    build_status: z.ZodOptional<z.ZodString>;
    preview_status: z.ZodOptional<z.ZodString>;
    export_status: z.ZodOptional<z.ZodString>;
    open_in_open_design_url: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    access_policy: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
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
}>;
export type SafeObservationManifestEntryV1 = z.infer<typeof SafeObservationManifestEntryV1Schema>;
/**
 * Bounded process-stream tail for one failed Run.
 *
 * The tail is optional so a producer can still report the observed line count
 * and truncation flag when consent does not permit shipping the text itself.
 * Every tail that IS shipped must already be redacted and byte-capped by its
 * producer; the schema only enforces the shape.
 */
export declare const SafeObservationStreamTailV1Schema: z.ZodEffects<z.ZodObject<{
    tail: z.ZodOptional<z.ZodObject<{
        text: z.ZodString;
        redacted: z.ZodLiteral<true>;
        truncated: z.ZodBoolean;
    }, "strict", z.ZodTypeAny, {
        text: string;
        redacted: true;
        truncated: boolean;
    }, {
        text: string;
        redacted: true;
        truncated: boolean;
    }>>;
    lineCount: z.ZodNumber;
    truncated: z.ZodBoolean;
    limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strict", z.ZodTypeAny, {
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
}>;
export type SafeObservationStreamTailV1 = z.infer<typeof SafeObservationStreamTailV1Schema>;
/**
 * Host-derived close/diagnostic facts for one Run.
 *
 * Values are deliberately restricted to booleans and bounded identifiers
 * (buckets, enum codes). Free text never enters this record — a producer that
 * wants to ship text must route it through `SafeObservationTextV1` so the
 * redaction and truncation rules apply.
 */
export declare const SafeRunDiagnosticsV1Schema: z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodBoolean, z.ZodString]>>, Record<string, string | boolean>, Record<string, string | boolean>>;
export type SafeRunDiagnosticsV1 = z.infer<typeof SafeRunDiagnosticsV1Schema>;
/**
 * Terminal process outcome for one Run: how the child exited and what it wrote
 * to its diagnostic streams.
 *
 * This is the evidence a failed Run needs and that failure *classification*
 * alone cannot supply — an exit code, a fatal signal, and the stderr tail that
 * explains both.
 */
export declare const SafeRunProcessOutcomeV1Schema: z.ZodObject<{
    exitCode: z.ZodOptional<z.ZodNumber>;
    signal: z.ZodOptional<z.ZodString>;
    stderr: z.ZodOptional<z.ZodEffects<z.ZodObject<{
        tail: z.ZodOptional<z.ZodObject<{
            text: z.ZodString;
            redacted: z.ZodLiteral<true>;
            truncated: z.ZodBoolean;
        }, "strict", z.ZodTypeAny, {
            text: string;
            redacted: true;
            truncated: boolean;
        }, {
            text: string;
            redacted: true;
            truncated: boolean;
        }>>;
        lineCount: z.ZodNumber;
        truncated: z.ZodBoolean;
        limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strict", z.ZodTypeAny, {
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
    stdout: z.ZodOptional<z.ZodEffects<z.ZodObject<{
        tail: z.ZodOptional<z.ZodObject<{
            text: z.ZodString;
            redacted: z.ZodLiteral<true>;
            truncated: z.ZodBoolean;
        }, "strict", z.ZodTypeAny, {
            text: string;
            redacted: true;
            truncated: boolean;
        }, {
            text: string;
            redacted: true;
            truncated: boolean;
        }>>;
        lineCount: z.ZodNumber;
        truncated: z.ZodBoolean;
        limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strict", z.ZodTypeAny, {
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
    diagnostics: z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodBoolean, z.ZodString]>>, Record<string, string | boolean>, Record<string, string | boolean>>>;
}, "strict", z.ZodTypeAny, {
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
}>;
export type SafeRunProcessOutcomeV1 = z.infer<typeof SafeRunProcessOutcomeV1Schema>;
export declare const SafeDeliverableSyntaxFinalizationV1Schema: z.ZodObject<{
    action: z.ZodEnum<["allow", "warn", "fail"]>;
    reason: z.ZodOptional<z.ZodEnum<["attempt_limit_reached", "commit_conflict", "commit_failed", "check_incomplete", "no_progress", "no_safe_fix", "verification_failed", "repair_budget_exceeded", "internal_error"]>>;
    refusal: z.ZodOptional<z.ZodEnum<["ambiguous_diagnostic", "file_unreadable", "path_outside_project", "unsupported_syntax_error", "multiple_files"]>>;
    summaryVersion: z.ZodOptional<z.ZodLiteral<1>>;
    initialStatus: z.ZodOptional<z.ZodEnum<["pass", "repairable", "incomplete", "skipped"]>>;
    repairEngine: z.ZodOptional<z.ZodLiteral<"host-safe-fixer@2">>;
    stagedPatchCount: z.ZodOptional<z.ZodNumber>;
    committedPatchCount: z.ZodOptional<z.ZodNumber>;
    committedRepairRules: z.ZodOptional<z.ZodArray<z.ZodEnum<["insert_missing_closing_delimiter", "close_unterminated_block_comment", "close_unterminated_string", "close_unterminated_template", "normalize_mismatched_string_quote", "normalize_html_attribute_quotes"]>, "many">>;
}, "strict", z.ZodTypeAny, {
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
}>;
export declare const SafeDeliverableSyntaxTelemetryV1Schema: z.ZodObject<{
    schemaVersion: z.ZodLiteral<"deliverable-syntax-telemetry-v1">;
    applicable: z.ZodBoolean;
    status: z.ZodEnum<["pass", "repairable", "incomplete", "exhausted", "skipped"]>;
    source: z.ZodEnum<["agent_tool", "run_finalizer"]>;
    checker: z.ZodNullable<z.ZodString>;
    checkedFileCount: z.ZodNumber;
    checkCount: z.ZodNumber;
    checkerDurationMs: z.ZodNullable<z.ZodNumber>;
    repairWindowDurationMs: z.ZodNullable<z.ZodNumber>;
    repairToDeliveryDurationMs: z.ZodNullable<z.ZodNumber>;
    repairToTerminalDurationMs: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    terminalRunStatus: z.ZodOptional<z.ZodEnum<["succeeded", "failed", "canceled"]>>;
    finalization: z.ZodOptional<z.ZodObject<{
        action: z.ZodEnum<["allow", "warn", "fail"]>;
        reason: z.ZodOptional<z.ZodEnum<["attempt_limit_reached", "commit_conflict", "commit_failed", "check_incomplete", "no_progress", "no_safe_fix", "verification_failed", "repair_budget_exceeded", "internal_error"]>>;
        refusal: z.ZodOptional<z.ZodEnum<["ambiguous_diagnostic", "file_unreadable", "path_outside_project", "unsupported_syntax_error", "multiple_files"]>>;
        summaryVersion: z.ZodOptional<z.ZodLiteral<1>>;
        initialStatus: z.ZodOptional<z.ZodEnum<["pass", "repairable", "incomplete", "skipped"]>>;
        repairEngine: z.ZodOptional<z.ZodLiteral<"host-safe-fixer@2">>;
        stagedPatchCount: z.ZodOptional<z.ZodNumber>;
        committedPatchCount: z.ZodOptional<z.ZodNumber>;
        committedRepairRules: z.ZodOptional<z.ZodArray<z.ZodEnum<["insert_missing_closing_delimiter", "close_unterminated_block_comment", "close_unterminated_string", "close_unterminated_template", "normalize_mismatched_string_quote", "normalize_html_attribute_quotes"]>, "many">>;
    }, "strict", z.ZodTypeAny, {
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
    repairExecutor: z.ZodOptional<z.ZodNullable<z.ZodEnum<["agent", "host_safe_fixer"]>>>;
    repairDurationMs: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    appliedRepairRules: z.ZodOptional<z.ZodArray<z.ZodEnum<["insert_missing_closing_delimiter", "close_unterminated_block_comment", "close_unterminated_string", "close_unterminated_template", "normalize_mismatched_string_quote", "normalize_html_attribute_quotes"]>, "many">>;
    safeFixProposalCount: z.ZodOptional<z.ZodNumber>;
    safeFixProposalDurationMs: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    repairableCheckCount: z.ZodNumber;
    initialDiagnosticCount: z.ZodNullable<z.ZodNumber>;
    latestDiagnosticCount: z.ZodNullable<z.ZodNumber>;
    repairTriggered: z.ZodBoolean;
    repairAttempts: z.ZodNumber;
    maxRepairAttempts: z.ZodNullable<z.ZodNumber>;
    repairOutcome: z.ZodEnum<["not_applicable", "not_needed", "repaired", "exhausted", "unresolved"]>;
    recoveredDeliveryCount: z.ZodUnion<[z.ZodLiteral<0>, z.ZodLiteral<1>]>;
    blockedBrokenDeliveryCount: z.ZodUnion<[z.ZodLiteral<0>, z.ZodLiteral<1>]>;
    /** Absent without a complete Host summary and a known physical Run terminal. */
    deliveredWithSyntaxWarningCount: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<0>, z.ZodLiteral<1>]>>;
}, "strict", z.ZodTypeAny, {
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
}>;
export type SafeDeliverableSyntaxTelemetryV1 = z.infer<typeof SafeDeliverableSyntaxTelemetryV1Schema>;
export declare const SafeRunQualityV1Schema: z.ZodObject<{
    schema: z.ZodLiteral<"open-design.safe-run-quality/v1">;
    result: z.ZodOptional<z.ZodObject<{
        output: z.ZodOptional<z.ZodObject<{
            text: z.ZodString;
            redacted: z.ZodLiteral<true>;
            truncated: z.ZodBoolean;
        }, "strict", z.ZodTypeAny, {
            text: string;
            redacted: true;
            truncated: boolean;
        }, {
            text: string;
            redacted: true;
            truncated: boolean;
        }>>;
        error: z.ZodOptional<z.ZodObject<{
            message: z.ZodOptional<z.ZodObject<{
                text: z.ZodString;
                redacted: z.ZodLiteral<true>;
                truncated: z.ZodBoolean;
            }, "strict", z.ZodTypeAny, {
                text: string;
                redacted: true;
                truncated: boolean;
            }, {
                text: string;
                redacted: true;
                truncated: boolean;
            }>>;
            code: z.ZodOptional<z.ZodString>;
            category: z.ZodOptional<z.ZodString>;
            detail: z.ZodOptional<z.ZodString>;
            stage: z.ZodOptional<z.ZodString>;
        }, "strict", z.ZodTypeAny, {
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
    }, "strict", z.ZodTypeAny, {
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
    tools: z.ZodOptional<z.ZodArray<z.ZodObject<{
        callHash: z.ZodString;
        name: z.ZodString;
        input: z.ZodOptional<z.ZodObject<{
            text: z.ZodString;
            redacted: z.ZodLiteral<true>;
            truncated: z.ZodBoolean;
        }, "strict", z.ZodTypeAny, {
            text: string;
            redacted: true;
            truncated: boolean;
        }, {
            text: string;
            redacted: true;
            truncated: boolean;
        }>>;
        output: z.ZodOptional<z.ZodObject<{
            text: z.ZodString;
            redacted: z.ZodLiteral<true>;
            truncated: z.ZodBoolean;
        }, "strict", z.ZodTypeAny, {
            text: string;
            redacted: true;
            truncated: boolean;
        }, {
            text: string;
            redacted: true;
            truncated: boolean;
        }>>;
        status: z.ZodEnum<["running", "completed", "failed", "unknown"]>;
        isError: z.ZodBoolean;
        startedAtMs: z.ZodOptional<z.ZodNumber>;
        endedAtMs: z.ZodOptional<z.ZodNumber>;
    }, "strict", z.ZodTypeAny, {
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
    manifests: z.ZodOptional<z.ZodObject<{
        completeness: z.ZodEnum<["complete", "partial", "unavailable"]>;
        attachments: z.ZodArray<z.ZodObject<{
            object_class: z.ZodEnum<["attachment", "artifact", "input_text_snapshot"]>;
            storage_ref: z.ZodString;
            status: z.ZodEnum<["ok", "partial", "unavailable"]>;
            reason: z.ZodOptional<z.ZodString>;
            project_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            run_id: z.ZodOptional<z.ZodString>;
            workspace_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            size_bytes: z.ZodOptional<z.ZodNumber>;
            sha256: z.ZodOptional<z.ZodString>;
            mime_type: z.ZodOptional<z.ZodString>;
            extension: z.ZodOptional<z.ZodString>;
            redacted: z.ZodBoolean;
            truncated: z.ZodBoolean;
            stored_in_open_design: z.ZodOptional<z.ZodBoolean>;
            retention_policy: z.ZodOptional<z.ZodString>;
            access_scope: z.ZodOptional<z.ZodString>;
            sensitivity: z.ZodOptional<z.ZodString>;
            source: z.ZodOptional<z.ZodString>;
            expires_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            approved_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            attachment_id: z.ZodOptional<z.ZodString>;
            artifact_id: z.ZodOptional<z.ZodString>;
            input_text_snapshot_id: z.ZodOptional<z.ZodString>;
            type: z.ZodOptional<z.ZodString>;
            artifact_kind: z.ZodOptional<z.ZodString>;
            build_status: z.ZodOptional<z.ZodString>;
            preview_status: z.ZodOptional<z.ZodString>;
            export_status: z.ZodOptional<z.ZodString>;
            open_in_open_design_url: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            access_policy: z.ZodOptional<z.ZodString>;
        }, "strict", z.ZodTypeAny, {
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
        artifacts: z.ZodArray<z.ZodObject<{
            object_class: z.ZodEnum<["attachment", "artifact", "input_text_snapshot"]>;
            storage_ref: z.ZodString;
            status: z.ZodEnum<["ok", "partial", "unavailable"]>;
            reason: z.ZodOptional<z.ZodString>;
            project_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            run_id: z.ZodOptional<z.ZodString>;
            workspace_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            size_bytes: z.ZodOptional<z.ZodNumber>;
            sha256: z.ZodOptional<z.ZodString>;
            mime_type: z.ZodOptional<z.ZodString>;
            extension: z.ZodOptional<z.ZodString>;
            redacted: z.ZodBoolean;
            truncated: z.ZodBoolean;
            stored_in_open_design: z.ZodOptional<z.ZodBoolean>;
            retention_policy: z.ZodOptional<z.ZodString>;
            access_scope: z.ZodOptional<z.ZodString>;
            sensitivity: z.ZodOptional<z.ZodString>;
            source: z.ZodOptional<z.ZodString>;
            expires_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            approved_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            attachment_id: z.ZodOptional<z.ZodString>;
            artifact_id: z.ZodOptional<z.ZodString>;
            input_text_snapshot_id: z.ZodOptional<z.ZodString>;
            type: z.ZodOptional<z.ZodString>;
            artifact_kind: z.ZodOptional<z.ZodString>;
            build_status: z.ZodOptional<z.ZodString>;
            preview_status: z.ZodOptional<z.ZodString>;
            export_status: z.ZodOptional<z.ZodString>;
            open_in_open_design_url: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            access_policy: z.ZodOptional<z.ZodString>;
        }, "strict", z.ZodTypeAny, {
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
        inputTextSnapshots: z.ZodArray<z.ZodObject<{
            object_class: z.ZodEnum<["attachment", "artifact", "input_text_snapshot"]>;
            storage_ref: z.ZodString;
            status: z.ZodEnum<["ok", "partial", "unavailable"]>;
            reason: z.ZodOptional<z.ZodString>;
            project_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            run_id: z.ZodOptional<z.ZodString>;
            workspace_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            size_bytes: z.ZodOptional<z.ZodNumber>;
            sha256: z.ZodOptional<z.ZodString>;
            mime_type: z.ZodOptional<z.ZodString>;
            extension: z.ZodOptional<z.ZodString>;
            redacted: z.ZodBoolean;
            truncated: z.ZodBoolean;
            stored_in_open_design: z.ZodOptional<z.ZodBoolean>;
            retention_policy: z.ZodOptional<z.ZodString>;
            access_scope: z.ZodOptional<z.ZodString>;
            sensitivity: z.ZodOptional<z.ZodString>;
            source: z.ZodOptional<z.ZodString>;
            expires_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            approved_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            attachment_id: z.ZodOptional<z.ZodString>;
            artifact_id: z.ZodOptional<z.ZodString>;
            input_text_snapshot_id: z.ZodOptional<z.ZodString>;
            type: z.ZodOptional<z.ZodString>;
            artifact_kind: z.ZodOptional<z.ZodString>;
            build_status: z.ZodOptional<z.ZodString>;
            preview_status: z.ZodOptional<z.ZodString>;
            export_status: z.ZodOptional<z.ZodString>;
            open_in_open_design_url: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            access_policy: z.ZodOptional<z.ZodString>;
        }, "strict", z.ZodTypeAny, {
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
    }, "strict", z.ZodTypeAny, {
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
    process: z.ZodOptional<z.ZodObject<{
        exitCode: z.ZodOptional<z.ZodNumber>;
        signal: z.ZodOptional<z.ZodString>;
        stderr: z.ZodOptional<z.ZodEffects<z.ZodObject<{
            tail: z.ZodOptional<z.ZodObject<{
                text: z.ZodString;
                redacted: z.ZodLiteral<true>;
                truncated: z.ZodBoolean;
            }, "strict", z.ZodTypeAny, {
                text: string;
                redacted: true;
                truncated: boolean;
            }, {
                text: string;
                redacted: true;
                truncated: boolean;
            }>>;
            lineCount: z.ZodNumber;
            truncated: z.ZodBoolean;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strict", z.ZodTypeAny, {
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
        stdout: z.ZodOptional<z.ZodEffects<z.ZodObject<{
            tail: z.ZodOptional<z.ZodObject<{
                text: z.ZodString;
                redacted: z.ZodLiteral<true>;
                truncated: z.ZodBoolean;
            }, "strict", z.ZodTypeAny, {
                text: string;
                redacted: true;
                truncated: boolean;
            }, {
                text: string;
                redacted: true;
                truncated: boolean;
            }>>;
            lineCount: z.ZodNumber;
            truncated: z.ZodBoolean;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strict", z.ZodTypeAny, {
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
        diagnostics: z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodBoolean, z.ZodString]>>, Record<string, string | boolean>, Record<string, string | boolean>>>;
    }, "strict", z.ZodTypeAny, {
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
    deliverableSyntax: z.ZodOptional<z.ZodObject<{
        schemaVersion: z.ZodLiteral<"deliverable-syntax-telemetry-v1">;
        applicable: z.ZodBoolean;
        status: z.ZodEnum<["pass", "repairable", "incomplete", "exhausted", "skipped"]>;
        source: z.ZodEnum<["agent_tool", "run_finalizer"]>;
        checker: z.ZodNullable<z.ZodString>;
        checkedFileCount: z.ZodNumber;
        checkCount: z.ZodNumber;
        checkerDurationMs: z.ZodNullable<z.ZodNumber>;
        repairWindowDurationMs: z.ZodNullable<z.ZodNumber>;
        repairToDeliveryDurationMs: z.ZodNullable<z.ZodNumber>;
        repairToTerminalDurationMs: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        terminalRunStatus: z.ZodOptional<z.ZodEnum<["succeeded", "failed", "canceled"]>>;
        finalization: z.ZodOptional<z.ZodObject<{
            action: z.ZodEnum<["allow", "warn", "fail"]>;
            reason: z.ZodOptional<z.ZodEnum<["attempt_limit_reached", "commit_conflict", "commit_failed", "check_incomplete", "no_progress", "no_safe_fix", "verification_failed", "repair_budget_exceeded", "internal_error"]>>;
            refusal: z.ZodOptional<z.ZodEnum<["ambiguous_diagnostic", "file_unreadable", "path_outside_project", "unsupported_syntax_error", "multiple_files"]>>;
            summaryVersion: z.ZodOptional<z.ZodLiteral<1>>;
            initialStatus: z.ZodOptional<z.ZodEnum<["pass", "repairable", "incomplete", "skipped"]>>;
            repairEngine: z.ZodOptional<z.ZodLiteral<"host-safe-fixer@2">>;
            stagedPatchCount: z.ZodOptional<z.ZodNumber>;
            committedPatchCount: z.ZodOptional<z.ZodNumber>;
            committedRepairRules: z.ZodOptional<z.ZodArray<z.ZodEnum<["insert_missing_closing_delimiter", "close_unterminated_block_comment", "close_unterminated_string", "close_unterminated_template", "normalize_mismatched_string_quote", "normalize_html_attribute_quotes"]>, "many">>;
        }, "strict", z.ZodTypeAny, {
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
        repairExecutor: z.ZodOptional<z.ZodNullable<z.ZodEnum<["agent", "host_safe_fixer"]>>>;
        repairDurationMs: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        appliedRepairRules: z.ZodOptional<z.ZodArray<z.ZodEnum<["insert_missing_closing_delimiter", "close_unterminated_block_comment", "close_unterminated_string", "close_unterminated_template", "normalize_mismatched_string_quote", "normalize_html_attribute_quotes"]>, "many">>;
        safeFixProposalCount: z.ZodOptional<z.ZodNumber>;
        safeFixProposalDurationMs: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        repairableCheckCount: z.ZodNumber;
        initialDiagnosticCount: z.ZodNullable<z.ZodNumber>;
        latestDiagnosticCount: z.ZodNullable<z.ZodNumber>;
        repairTriggered: z.ZodBoolean;
        repairAttempts: z.ZodNumber;
        maxRepairAttempts: z.ZodNullable<z.ZodNumber>;
        repairOutcome: z.ZodEnum<["not_applicable", "not_needed", "repaired", "exhausted", "unresolved"]>;
        recoveredDeliveryCount: z.ZodUnion<[z.ZodLiteral<0>, z.ZodLiteral<1>]>;
        blockedBrokenDeliveryCount: z.ZodUnion<[z.ZodLiteral<0>, z.ZodLiteral<1>]>;
        /** Absent without a complete Host summary and a known physical Run terminal. */
        deliveredWithSyntaxWarningCount: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<0>, z.ZodLiteral<1>]>>;
    }, "strict", z.ZodTypeAny, {
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
}, "strict", z.ZodTypeAny, {
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
}>;
export type SafeRunQualityV1 = z.infer<typeof SafeRunQualityV1Schema>;
export declare const NormalizedAgentObservationV1Schema: z.ZodEffects<z.ZodObject<{
    schema: z.ZodLiteral<"open-design.normalized-agent-observation/v1">;
    identity: z.ZodEffects<z.ZodObject<{
        observationId: z.ZodString;
        taskExecutionId: z.ZodString;
        runId: z.ZodString;
        taskRunIndex: z.ZodNumber;
        parentObservationId: z.ZodOptional<z.ZodString>;
        runtimeSessionId: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        observationId: z.ZodString;
        taskExecutionId: z.ZodString;
        runId: z.ZodString;
        taskRunIndex: z.ZodNumber;
        parentObservationId: z.ZodOptional<z.ZodString>;
        runtimeSessionId: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        observationId: z.ZodString;
        taskExecutionId: z.ZodString;
        runId: z.ZodString;
        taskRunIndex: z.ZodNumber;
        parentObservationId: z.ZodOptional<z.ZodString>;
        runtimeSessionId: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
        observationId: z.ZodString;
        taskExecutionId: z.ZodString;
        runId: z.ZodString;
        taskRunIndex: z.ZodNumber;
        parentObservationId: z.ZodOptional<z.ZodString>;
        runtimeSessionId: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        observationId: z.ZodString;
        taskExecutionId: z.ZodString;
        runId: z.ZodString;
        taskRunIndex: z.ZodNumber;
        parentObservationId: z.ZodOptional<z.ZodString>;
        runtimeSessionId: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>;
    kind: z.ZodEnum<["task_run", "child_agent", "model_call", "tool"]>;
    stage: z.ZodEnum<["request", "clarification", "contract_repair", "production"]>;
    status: z.ZodEnum<["queued", "running", "completed", "failed", "canceled", "unknown"]>;
    prompt: z.ZodObject<{
        hostComposed: z.ZodEffects<z.ZodObject<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>;
        childInjected: z.ZodEffects<z.ZodObject<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>;
        agentEffectiveContext: z.ZodEffects<z.ZodObject<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        hostComposed: z.ZodEffects<z.ZodObject<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>;
        childInjected: z.ZodEffects<z.ZodObject<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>;
        agentEffectiveContext: z.ZodEffects<z.ZodObject<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        hostComposed: z.ZodEffects<z.ZodObject<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>;
        childInjected: z.ZodEffects<z.ZodObject<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>;
        agentEffectiveContext: z.ZodEffects<z.ZodObject<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>;
    }, z.ZodTypeAny, "passthrough">>;
    usage: z.ZodEffects<z.ZodObject<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        source: z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>;
        accountingMode: z.ZodEnum<["inclusive", "additive", "unknown"]>;
        values: z.ZodOptional<z.ZodEffects<z.ZodObject<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>>;
        valueSources: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        source: z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>;
        accountingMode: z.ZodEnum<["inclusive", "additive", "unknown"]>;
        values: z.ZodOptional<z.ZodEffects<z.ZodObject<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>>;
        valueSources: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        source: z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>;
        accountingMode: z.ZodEnum<["inclusive", "additive", "unknown"]>;
        values: z.ZodOptional<z.ZodEffects<z.ZodObject<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>>;
        valueSources: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        source: z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>;
        accountingMode: z.ZodEnum<["inclusive", "additive", "unknown"]>;
        values: z.ZodOptional<z.ZodEffects<z.ZodObject<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>>;
        valueSources: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        source: z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>;
        accountingMode: z.ZodEnum<["inclusive", "additive", "unknown"]>;
        values: z.ZodOptional<z.ZodEffects<z.ZodObject<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>>;
        valueSources: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">>;
    timing: z.ZodEffects<z.ZodObject<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        evidence: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodObject<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        evidence: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodObject<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        evidence: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodObject<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        evidence: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodObject<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        evidence: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodObject<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">>;
    childEvidenceCoverage: z.ZodOptional<z.ZodEffects<z.ZodObject<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        source: z.ZodString;
        /**
         * How many distinct Child agents the adapter observed — NOT how many times
         * they were invoked.
         *
         * A parent may re-enter the same Child repeatedly, and a runtime whose
         * evidence is turn-shaped (Codex opens a new rollout turn per invocation)
         * must fold those back to one before reporting here. Leaving the unit unsaid
         * let one adapter count invocations and another count Children, which made
         * the two runtimes' figures silently incomparable.
         */
        knownChildCount: z.ZodNumber;
        explicitZero: z.ZodBoolean;
        limitations: z.ZodArray<z.ZodString, "many">;
        diagnosticCounts: z.ZodArray<z.ZodObject<{
            code: z.ZodString;
            count: z.ZodNumber;
        }, "strict", z.ZodTypeAny, {
            code: string;
            count: number;
        }, {
            code: string;
            count: number;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
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
    turnAccounting: z.ZodOptional<z.ZodObject<{
        turnId: z.ZodString;
        disposition: z.ZodEnum<["owner", "exclude_inherited"]>;
        ownerObservationId: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        turnId: z.ZodString;
        disposition: z.ZodEnum<["owner", "exclude_inherited"]>;
        ownerObservationId: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        turnId: z.ZodString;
        disposition: z.ZodEnum<["owner", "exclude_inherited"]>;
        ownerObservationId: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>>;
    quality: z.ZodOptional<z.ZodObject<{
        schema: z.ZodLiteral<"open-design.safe-run-quality/v1">;
        result: z.ZodOptional<z.ZodObject<{
            output: z.ZodOptional<z.ZodObject<{
                text: z.ZodString;
                redacted: z.ZodLiteral<true>;
                truncated: z.ZodBoolean;
            }, "strict", z.ZodTypeAny, {
                text: string;
                redacted: true;
                truncated: boolean;
            }, {
                text: string;
                redacted: true;
                truncated: boolean;
            }>>;
            error: z.ZodOptional<z.ZodObject<{
                message: z.ZodOptional<z.ZodObject<{
                    text: z.ZodString;
                    redacted: z.ZodLiteral<true>;
                    truncated: z.ZodBoolean;
                }, "strict", z.ZodTypeAny, {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                }, {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                }>>;
                code: z.ZodOptional<z.ZodString>;
                category: z.ZodOptional<z.ZodString>;
                detail: z.ZodOptional<z.ZodString>;
                stage: z.ZodOptional<z.ZodString>;
            }, "strict", z.ZodTypeAny, {
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
        }, "strict", z.ZodTypeAny, {
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
        tools: z.ZodOptional<z.ZodArray<z.ZodObject<{
            callHash: z.ZodString;
            name: z.ZodString;
            input: z.ZodOptional<z.ZodObject<{
                text: z.ZodString;
                redacted: z.ZodLiteral<true>;
                truncated: z.ZodBoolean;
            }, "strict", z.ZodTypeAny, {
                text: string;
                redacted: true;
                truncated: boolean;
            }, {
                text: string;
                redacted: true;
                truncated: boolean;
            }>>;
            output: z.ZodOptional<z.ZodObject<{
                text: z.ZodString;
                redacted: z.ZodLiteral<true>;
                truncated: z.ZodBoolean;
            }, "strict", z.ZodTypeAny, {
                text: string;
                redacted: true;
                truncated: boolean;
            }, {
                text: string;
                redacted: true;
                truncated: boolean;
            }>>;
            status: z.ZodEnum<["running", "completed", "failed", "unknown"]>;
            isError: z.ZodBoolean;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
        }, "strict", z.ZodTypeAny, {
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
        manifests: z.ZodOptional<z.ZodObject<{
            completeness: z.ZodEnum<["complete", "partial", "unavailable"]>;
            attachments: z.ZodArray<z.ZodObject<{
                object_class: z.ZodEnum<["attachment", "artifact", "input_text_snapshot"]>;
                storage_ref: z.ZodString;
                status: z.ZodEnum<["ok", "partial", "unavailable"]>;
                reason: z.ZodOptional<z.ZodString>;
                project_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                run_id: z.ZodOptional<z.ZodString>;
                workspace_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                size_bytes: z.ZodOptional<z.ZodNumber>;
                sha256: z.ZodOptional<z.ZodString>;
                mime_type: z.ZodOptional<z.ZodString>;
                extension: z.ZodOptional<z.ZodString>;
                redacted: z.ZodBoolean;
                truncated: z.ZodBoolean;
                stored_in_open_design: z.ZodOptional<z.ZodBoolean>;
                retention_policy: z.ZodOptional<z.ZodString>;
                access_scope: z.ZodOptional<z.ZodString>;
                sensitivity: z.ZodOptional<z.ZodString>;
                source: z.ZodOptional<z.ZodString>;
                expires_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                approved_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                attachment_id: z.ZodOptional<z.ZodString>;
                artifact_id: z.ZodOptional<z.ZodString>;
                input_text_snapshot_id: z.ZodOptional<z.ZodString>;
                type: z.ZodOptional<z.ZodString>;
                artifact_kind: z.ZodOptional<z.ZodString>;
                build_status: z.ZodOptional<z.ZodString>;
                preview_status: z.ZodOptional<z.ZodString>;
                export_status: z.ZodOptional<z.ZodString>;
                open_in_open_design_url: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                access_policy: z.ZodOptional<z.ZodString>;
            }, "strict", z.ZodTypeAny, {
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
            artifacts: z.ZodArray<z.ZodObject<{
                object_class: z.ZodEnum<["attachment", "artifact", "input_text_snapshot"]>;
                storage_ref: z.ZodString;
                status: z.ZodEnum<["ok", "partial", "unavailable"]>;
                reason: z.ZodOptional<z.ZodString>;
                project_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                run_id: z.ZodOptional<z.ZodString>;
                workspace_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                size_bytes: z.ZodOptional<z.ZodNumber>;
                sha256: z.ZodOptional<z.ZodString>;
                mime_type: z.ZodOptional<z.ZodString>;
                extension: z.ZodOptional<z.ZodString>;
                redacted: z.ZodBoolean;
                truncated: z.ZodBoolean;
                stored_in_open_design: z.ZodOptional<z.ZodBoolean>;
                retention_policy: z.ZodOptional<z.ZodString>;
                access_scope: z.ZodOptional<z.ZodString>;
                sensitivity: z.ZodOptional<z.ZodString>;
                source: z.ZodOptional<z.ZodString>;
                expires_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                approved_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                attachment_id: z.ZodOptional<z.ZodString>;
                artifact_id: z.ZodOptional<z.ZodString>;
                input_text_snapshot_id: z.ZodOptional<z.ZodString>;
                type: z.ZodOptional<z.ZodString>;
                artifact_kind: z.ZodOptional<z.ZodString>;
                build_status: z.ZodOptional<z.ZodString>;
                preview_status: z.ZodOptional<z.ZodString>;
                export_status: z.ZodOptional<z.ZodString>;
                open_in_open_design_url: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                access_policy: z.ZodOptional<z.ZodString>;
            }, "strict", z.ZodTypeAny, {
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
            inputTextSnapshots: z.ZodArray<z.ZodObject<{
                object_class: z.ZodEnum<["attachment", "artifact", "input_text_snapshot"]>;
                storage_ref: z.ZodString;
                status: z.ZodEnum<["ok", "partial", "unavailable"]>;
                reason: z.ZodOptional<z.ZodString>;
                project_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                run_id: z.ZodOptional<z.ZodString>;
                workspace_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                size_bytes: z.ZodOptional<z.ZodNumber>;
                sha256: z.ZodOptional<z.ZodString>;
                mime_type: z.ZodOptional<z.ZodString>;
                extension: z.ZodOptional<z.ZodString>;
                redacted: z.ZodBoolean;
                truncated: z.ZodBoolean;
                stored_in_open_design: z.ZodOptional<z.ZodBoolean>;
                retention_policy: z.ZodOptional<z.ZodString>;
                access_scope: z.ZodOptional<z.ZodString>;
                sensitivity: z.ZodOptional<z.ZodString>;
                source: z.ZodOptional<z.ZodString>;
                expires_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                approved_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                attachment_id: z.ZodOptional<z.ZodString>;
                artifact_id: z.ZodOptional<z.ZodString>;
                input_text_snapshot_id: z.ZodOptional<z.ZodString>;
                type: z.ZodOptional<z.ZodString>;
                artifact_kind: z.ZodOptional<z.ZodString>;
                build_status: z.ZodOptional<z.ZodString>;
                preview_status: z.ZodOptional<z.ZodString>;
                export_status: z.ZodOptional<z.ZodString>;
                open_in_open_design_url: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                access_policy: z.ZodOptional<z.ZodString>;
            }, "strict", z.ZodTypeAny, {
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
        }, "strict", z.ZodTypeAny, {
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
        process: z.ZodOptional<z.ZodObject<{
            exitCode: z.ZodOptional<z.ZodNumber>;
            signal: z.ZodOptional<z.ZodString>;
            stderr: z.ZodOptional<z.ZodEffects<z.ZodObject<{
                tail: z.ZodOptional<z.ZodObject<{
                    text: z.ZodString;
                    redacted: z.ZodLiteral<true>;
                    truncated: z.ZodBoolean;
                }, "strict", z.ZodTypeAny, {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                }, {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                }>>;
                lineCount: z.ZodNumber;
                truncated: z.ZodBoolean;
                limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strict", z.ZodTypeAny, {
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
            stdout: z.ZodOptional<z.ZodEffects<z.ZodObject<{
                tail: z.ZodOptional<z.ZodObject<{
                    text: z.ZodString;
                    redacted: z.ZodLiteral<true>;
                    truncated: z.ZodBoolean;
                }, "strict", z.ZodTypeAny, {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                }, {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                }>>;
                lineCount: z.ZodNumber;
                truncated: z.ZodBoolean;
                limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strict", z.ZodTypeAny, {
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
            diagnostics: z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodBoolean, z.ZodString]>>, Record<string, string | boolean>, Record<string, string | boolean>>>;
        }, "strict", z.ZodTypeAny, {
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
        deliverableSyntax: z.ZodOptional<z.ZodObject<{
            schemaVersion: z.ZodLiteral<"deliverable-syntax-telemetry-v1">;
            applicable: z.ZodBoolean;
            status: z.ZodEnum<["pass", "repairable", "incomplete", "exhausted", "skipped"]>;
            source: z.ZodEnum<["agent_tool", "run_finalizer"]>;
            checker: z.ZodNullable<z.ZodString>;
            checkedFileCount: z.ZodNumber;
            checkCount: z.ZodNumber;
            checkerDurationMs: z.ZodNullable<z.ZodNumber>;
            repairWindowDurationMs: z.ZodNullable<z.ZodNumber>;
            repairToDeliveryDurationMs: z.ZodNullable<z.ZodNumber>;
            repairToTerminalDurationMs: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            terminalRunStatus: z.ZodOptional<z.ZodEnum<["succeeded", "failed", "canceled"]>>;
            finalization: z.ZodOptional<z.ZodObject<{
                action: z.ZodEnum<["allow", "warn", "fail"]>;
                reason: z.ZodOptional<z.ZodEnum<["attempt_limit_reached", "commit_conflict", "commit_failed", "check_incomplete", "no_progress", "no_safe_fix", "verification_failed", "repair_budget_exceeded", "internal_error"]>>;
                refusal: z.ZodOptional<z.ZodEnum<["ambiguous_diagnostic", "file_unreadable", "path_outside_project", "unsupported_syntax_error", "multiple_files"]>>;
                summaryVersion: z.ZodOptional<z.ZodLiteral<1>>;
                initialStatus: z.ZodOptional<z.ZodEnum<["pass", "repairable", "incomplete", "skipped"]>>;
                repairEngine: z.ZodOptional<z.ZodLiteral<"host-safe-fixer@2">>;
                stagedPatchCount: z.ZodOptional<z.ZodNumber>;
                committedPatchCount: z.ZodOptional<z.ZodNumber>;
                committedRepairRules: z.ZodOptional<z.ZodArray<z.ZodEnum<["insert_missing_closing_delimiter", "close_unterminated_block_comment", "close_unterminated_string", "close_unterminated_template", "normalize_mismatched_string_quote", "normalize_html_attribute_quotes"]>, "many">>;
            }, "strict", z.ZodTypeAny, {
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
            repairExecutor: z.ZodOptional<z.ZodNullable<z.ZodEnum<["agent", "host_safe_fixer"]>>>;
            repairDurationMs: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            appliedRepairRules: z.ZodOptional<z.ZodArray<z.ZodEnum<["insert_missing_closing_delimiter", "close_unterminated_block_comment", "close_unterminated_string", "close_unterminated_template", "normalize_mismatched_string_quote", "normalize_html_attribute_quotes"]>, "many">>;
            safeFixProposalCount: z.ZodOptional<z.ZodNumber>;
            safeFixProposalDurationMs: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            repairableCheckCount: z.ZodNumber;
            initialDiagnosticCount: z.ZodNullable<z.ZodNumber>;
            latestDiagnosticCount: z.ZodNullable<z.ZodNumber>;
            repairTriggered: z.ZodBoolean;
            repairAttempts: z.ZodNumber;
            maxRepairAttempts: z.ZodNullable<z.ZodNumber>;
            repairOutcome: z.ZodEnum<["not_applicable", "not_needed", "repaired", "exhausted", "unresolved"]>;
            recoveredDeliveryCount: z.ZodUnion<[z.ZodLiteral<0>, z.ZodLiteral<1>]>;
            blockedBrokenDeliveryCount: z.ZodUnion<[z.ZodLiteral<0>, z.ZodLiteral<1>]>;
            /** Absent without a complete Host summary and a known physical Run terminal. */
            deliveredWithSyntaxWarningCount: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<0>, z.ZodLiteral<1>]>>;
        }, "strict", z.ZodTypeAny, {
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
    }, "strict", z.ZodTypeAny, {
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
    limitations: z.ZodArray<z.ZodString, "many">;
    attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    schema: z.ZodLiteral<"open-design.normalized-agent-observation/v1">;
    identity: z.ZodEffects<z.ZodObject<{
        observationId: z.ZodString;
        taskExecutionId: z.ZodString;
        runId: z.ZodString;
        taskRunIndex: z.ZodNumber;
        parentObservationId: z.ZodOptional<z.ZodString>;
        runtimeSessionId: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        observationId: z.ZodString;
        taskExecutionId: z.ZodString;
        runId: z.ZodString;
        taskRunIndex: z.ZodNumber;
        parentObservationId: z.ZodOptional<z.ZodString>;
        runtimeSessionId: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        observationId: z.ZodString;
        taskExecutionId: z.ZodString;
        runId: z.ZodString;
        taskRunIndex: z.ZodNumber;
        parentObservationId: z.ZodOptional<z.ZodString>;
        runtimeSessionId: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
        observationId: z.ZodString;
        taskExecutionId: z.ZodString;
        runId: z.ZodString;
        taskRunIndex: z.ZodNumber;
        parentObservationId: z.ZodOptional<z.ZodString>;
        runtimeSessionId: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        observationId: z.ZodString;
        taskExecutionId: z.ZodString;
        runId: z.ZodString;
        taskRunIndex: z.ZodNumber;
        parentObservationId: z.ZodOptional<z.ZodString>;
        runtimeSessionId: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>;
    kind: z.ZodEnum<["task_run", "child_agent", "model_call", "tool"]>;
    stage: z.ZodEnum<["request", "clarification", "contract_repair", "production"]>;
    status: z.ZodEnum<["queued", "running", "completed", "failed", "canceled", "unknown"]>;
    prompt: z.ZodObject<{
        hostComposed: z.ZodEffects<z.ZodObject<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>;
        childInjected: z.ZodEffects<z.ZodObject<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>;
        agentEffectiveContext: z.ZodEffects<z.ZodObject<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        hostComposed: z.ZodEffects<z.ZodObject<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>;
        childInjected: z.ZodEffects<z.ZodObject<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>;
        agentEffectiveContext: z.ZodEffects<z.ZodObject<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        hostComposed: z.ZodEffects<z.ZodObject<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>;
        childInjected: z.ZodEffects<z.ZodObject<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>;
        agentEffectiveContext: z.ZodEffects<z.ZodObject<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>;
    }, z.ZodTypeAny, "passthrough">>;
    usage: z.ZodEffects<z.ZodObject<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        source: z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>;
        accountingMode: z.ZodEnum<["inclusive", "additive", "unknown"]>;
        values: z.ZodOptional<z.ZodEffects<z.ZodObject<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>>;
        valueSources: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        source: z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>;
        accountingMode: z.ZodEnum<["inclusive", "additive", "unknown"]>;
        values: z.ZodOptional<z.ZodEffects<z.ZodObject<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>>;
        valueSources: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        source: z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>;
        accountingMode: z.ZodEnum<["inclusive", "additive", "unknown"]>;
        values: z.ZodOptional<z.ZodEffects<z.ZodObject<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>>;
        valueSources: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        source: z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>;
        accountingMode: z.ZodEnum<["inclusive", "additive", "unknown"]>;
        values: z.ZodOptional<z.ZodEffects<z.ZodObject<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>>;
        valueSources: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        source: z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>;
        accountingMode: z.ZodEnum<["inclusive", "additive", "unknown"]>;
        values: z.ZodOptional<z.ZodEffects<z.ZodObject<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>>;
        valueSources: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">>;
    timing: z.ZodEffects<z.ZodObject<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        evidence: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodObject<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        evidence: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodObject<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        evidence: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodObject<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        evidence: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodObject<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        evidence: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodObject<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">>;
    childEvidenceCoverage: z.ZodOptional<z.ZodEffects<z.ZodObject<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        source: z.ZodString;
        /**
         * How many distinct Child agents the adapter observed — NOT how many times
         * they were invoked.
         *
         * A parent may re-enter the same Child repeatedly, and a runtime whose
         * evidence is turn-shaped (Codex opens a new rollout turn per invocation)
         * must fold those back to one before reporting here. Leaving the unit unsaid
         * let one adapter count invocations and another count Children, which made
         * the two runtimes' figures silently incomparable.
         */
        knownChildCount: z.ZodNumber;
        explicitZero: z.ZodBoolean;
        limitations: z.ZodArray<z.ZodString, "many">;
        diagnosticCounts: z.ZodArray<z.ZodObject<{
            code: z.ZodString;
            count: z.ZodNumber;
        }, "strict", z.ZodTypeAny, {
            code: string;
            count: number;
        }, {
            code: string;
            count: number;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
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
    turnAccounting: z.ZodOptional<z.ZodObject<{
        turnId: z.ZodString;
        disposition: z.ZodEnum<["owner", "exclude_inherited"]>;
        ownerObservationId: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        turnId: z.ZodString;
        disposition: z.ZodEnum<["owner", "exclude_inherited"]>;
        ownerObservationId: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        turnId: z.ZodString;
        disposition: z.ZodEnum<["owner", "exclude_inherited"]>;
        ownerObservationId: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>>;
    quality: z.ZodOptional<z.ZodObject<{
        schema: z.ZodLiteral<"open-design.safe-run-quality/v1">;
        result: z.ZodOptional<z.ZodObject<{
            output: z.ZodOptional<z.ZodObject<{
                text: z.ZodString;
                redacted: z.ZodLiteral<true>;
                truncated: z.ZodBoolean;
            }, "strict", z.ZodTypeAny, {
                text: string;
                redacted: true;
                truncated: boolean;
            }, {
                text: string;
                redacted: true;
                truncated: boolean;
            }>>;
            error: z.ZodOptional<z.ZodObject<{
                message: z.ZodOptional<z.ZodObject<{
                    text: z.ZodString;
                    redacted: z.ZodLiteral<true>;
                    truncated: z.ZodBoolean;
                }, "strict", z.ZodTypeAny, {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                }, {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                }>>;
                code: z.ZodOptional<z.ZodString>;
                category: z.ZodOptional<z.ZodString>;
                detail: z.ZodOptional<z.ZodString>;
                stage: z.ZodOptional<z.ZodString>;
            }, "strict", z.ZodTypeAny, {
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
        }, "strict", z.ZodTypeAny, {
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
        tools: z.ZodOptional<z.ZodArray<z.ZodObject<{
            callHash: z.ZodString;
            name: z.ZodString;
            input: z.ZodOptional<z.ZodObject<{
                text: z.ZodString;
                redacted: z.ZodLiteral<true>;
                truncated: z.ZodBoolean;
            }, "strict", z.ZodTypeAny, {
                text: string;
                redacted: true;
                truncated: boolean;
            }, {
                text: string;
                redacted: true;
                truncated: boolean;
            }>>;
            output: z.ZodOptional<z.ZodObject<{
                text: z.ZodString;
                redacted: z.ZodLiteral<true>;
                truncated: z.ZodBoolean;
            }, "strict", z.ZodTypeAny, {
                text: string;
                redacted: true;
                truncated: boolean;
            }, {
                text: string;
                redacted: true;
                truncated: boolean;
            }>>;
            status: z.ZodEnum<["running", "completed", "failed", "unknown"]>;
            isError: z.ZodBoolean;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
        }, "strict", z.ZodTypeAny, {
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
        manifests: z.ZodOptional<z.ZodObject<{
            completeness: z.ZodEnum<["complete", "partial", "unavailable"]>;
            attachments: z.ZodArray<z.ZodObject<{
                object_class: z.ZodEnum<["attachment", "artifact", "input_text_snapshot"]>;
                storage_ref: z.ZodString;
                status: z.ZodEnum<["ok", "partial", "unavailable"]>;
                reason: z.ZodOptional<z.ZodString>;
                project_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                run_id: z.ZodOptional<z.ZodString>;
                workspace_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                size_bytes: z.ZodOptional<z.ZodNumber>;
                sha256: z.ZodOptional<z.ZodString>;
                mime_type: z.ZodOptional<z.ZodString>;
                extension: z.ZodOptional<z.ZodString>;
                redacted: z.ZodBoolean;
                truncated: z.ZodBoolean;
                stored_in_open_design: z.ZodOptional<z.ZodBoolean>;
                retention_policy: z.ZodOptional<z.ZodString>;
                access_scope: z.ZodOptional<z.ZodString>;
                sensitivity: z.ZodOptional<z.ZodString>;
                source: z.ZodOptional<z.ZodString>;
                expires_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                approved_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                attachment_id: z.ZodOptional<z.ZodString>;
                artifact_id: z.ZodOptional<z.ZodString>;
                input_text_snapshot_id: z.ZodOptional<z.ZodString>;
                type: z.ZodOptional<z.ZodString>;
                artifact_kind: z.ZodOptional<z.ZodString>;
                build_status: z.ZodOptional<z.ZodString>;
                preview_status: z.ZodOptional<z.ZodString>;
                export_status: z.ZodOptional<z.ZodString>;
                open_in_open_design_url: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                access_policy: z.ZodOptional<z.ZodString>;
            }, "strict", z.ZodTypeAny, {
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
            artifacts: z.ZodArray<z.ZodObject<{
                object_class: z.ZodEnum<["attachment", "artifact", "input_text_snapshot"]>;
                storage_ref: z.ZodString;
                status: z.ZodEnum<["ok", "partial", "unavailable"]>;
                reason: z.ZodOptional<z.ZodString>;
                project_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                run_id: z.ZodOptional<z.ZodString>;
                workspace_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                size_bytes: z.ZodOptional<z.ZodNumber>;
                sha256: z.ZodOptional<z.ZodString>;
                mime_type: z.ZodOptional<z.ZodString>;
                extension: z.ZodOptional<z.ZodString>;
                redacted: z.ZodBoolean;
                truncated: z.ZodBoolean;
                stored_in_open_design: z.ZodOptional<z.ZodBoolean>;
                retention_policy: z.ZodOptional<z.ZodString>;
                access_scope: z.ZodOptional<z.ZodString>;
                sensitivity: z.ZodOptional<z.ZodString>;
                source: z.ZodOptional<z.ZodString>;
                expires_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                approved_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                attachment_id: z.ZodOptional<z.ZodString>;
                artifact_id: z.ZodOptional<z.ZodString>;
                input_text_snapshot_id: z.ZodOptional<z.ZodString>;
                type: z.ZodOptional<z.ZodString>;
                artifact_kind: z.ZodOptional<z.ZodString>;
                build_status: z.ZodOptional<z.ZodString>;
                preview_status: z.ZodOptional<z.ZodString>;
                export_status: z.ZodOptional<z.ZodString>;
                open_in_open_design_url: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                access_policy: z.ZodOptional<z.ZodString>;
            }, "strict", z.ZodTypeAny, {
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
            inputTextSnapshots: z.ZodArray<z.ZodObject<{
                object_class: z.ZodEnum<["attachment", "artifact", "input_text_snapshot"]>;
                storage_ref: z.ZodString;
                status: z.ZodEnum<["ok", "partial", "unavailable"]>;
                reason: z.ZodOptional<z.ZodString>;
                project_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                run_id: z.ZodOptional<z.ZodString>;
                workspace_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                size_bytes: z.ZodOptional<z.ZodNumber>;
                sha256: z.ZodOptional<z.ZodString>;
                mime_type: z.ZodOptional<z.ZodString>;
                extension: z.ZodOptional<z.ZodString>;
                redacted: z.ZodBoolean;
                truncated: z.ZodBoolean;
                stored_in_open_design: z.ZodOptional<z.ZodBoolean>;
                retention_policy: z.ZodOptional<z.ZodString>;
                access_scope: z.ZodOptional<z.ZodString>;
                sensitivity: z.ZodOptional<z.ZodString>;
                source: z.ZodOptional<z.ZodString>;
                expires_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                approved_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                attachment_id: z.ZodOptional<z.ZodString>;
                artifact_id: z.ZodOptional<z.ZodString>;
                input_text_snapshot_id: z.ZodOptional<z.ZodString>;
                type: z.ZodOptional<z.ZodString>;
                artifact_kind: z.ZodOptional<z.ZodString>;
                build_status: z.ZodOptional<z.ZodString>;
                preview_status: z.ZodOptional<z.ZodString>;
                export_status: z.ZodOptional<z.ZodString>;
                open_in_open_design_url: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                access_policy: z.ZodOptional<z.ZodString>;
            }, "strict", z.ZodTypeAny, {
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
        }, "strict", z.ZodTypeAny, {
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
        process: z.ZodOptional<z.ZodObject<{
            exitCode: z.ZodOptional<z.ZodNumber>;
            signal: z.ZodOptional<z.ZodString>;
            stderr: z.ZodOptional<z.ZodEffects<z.ZodObject<{
                tail: z.ZodOptional<z.ZodObject<{
                    text: z.ZodString;
                    redacted: z.ZodLiteral<true>;
                    truncated: z.ZodBoolean;
                }, "strict", z.ZodTypeAny, {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                }, {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                }>>;
                lineCount: z.ZodNumber;
                truncated: z.ZodBoolean;
                limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strict", z.ZodTypeAny, {
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
            stdout: z.ZodOptional<z.ZodEffects<z.ZodObject<{
                tail: z.ZodOptional<z.ZodObject<{
                    text: z.ZodString;
                    redacted: z.ZodLiteral<true>;
                    truncated: z.ZodBoolean;
                }, "strict", z.ZodTypeAny, {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                }, {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                }>>;
                lineCount: z.ZodNumber;
                truncated: z.ZodBoolean;
                limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strict", z.ZodTypeAny, {
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
            diagnostics: z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodBoolean, z.ZodString]>>, Record<string, string | boolean>, Record<string, string | boolean>>>;
        }, "strict", z.ZodTypeAny, {
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
        deliverableSyntax: z.ZodOptional<z.ZodObject<{
            schemaVersion: z.ZodLiteral<"deliverable-syntax-telemetry-v1">;
            applicable: z.ZodBoolean;
            status: z.ZodEnum<["pass", "repairable", "incomplete", "exhausted", "skipped"]>;
            source: z.ZodEnum<["agent_tool", "run_finalizer"]>;
            checker: z.ZodNullable<z.ZodString>;
            checkedFileCount: z.ZodNumber;
            checkCount: z.ZodNumber;
            checkerDurationMs: z.ZodNullable<z.ZodNumber>;
            repairWindowDurationMs: z.ZodNullable<z.ZodNumber>;
            repairToDeliveryDurationMs: z.ZodNullable<z.ZodNumber>;
            repairToTerminalDurationMs: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            terminalRunStatus: z.ZodOptional<z.ZodEnum<["succeeded", "failed", "canceled"]>>;
            finalization: z.ZodOptional<z.ZodObject<{
                action: z.ZodEnum<["allow", "warn", "fail"]>;
                reason: z.ZodOptional<z.ZodEnum<["attempt_limit_reached", "commit_conflict", "commit_failed", "check_incomplete", "no_progress", "no_safe_fix", "verification_failed", "repair_budget_exceeded", "internal_error"]>>;
                refusal: z.ZodOptional<z.ZodEnum<["ambiguous_diagnostic", "file_unreadable", "path_outside_project", "unsupported_syntax_error", "multiple_files"]>>;
                summaryVersion: z.ZodOptional<z.ZodLiteral<1>>;
                initialStatus: z.ZodOptional<z.ZodEnum<["pass", "repairable", "incomplete", "skipped"]>>;
                repairEngine: z.ZodOptional<z.ZodLiteral<"host-safe-fixer@2">>;
                stagedPatchCount: z.ZodOptional<z.ZodNumber>;
                committedPatchCount: z.ZodOptional<z.ZodNumber>;
                committedRepairRules: z.ZodOptional<z.ZodArray<z.ZodEnum<["insert_missing_closing_delimiter", "close_unterminated_block_comment", "close_unterminated_string", "close_unterminated_template", "normalize_mismatched_string_quote", "normalize_html_attribute_quotes"]>, "many">>;
            }, "strict", z.ZodTypeAny, {
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
            repairExecutor: z.ZodOptional<z.ZodNullable<z.ZodEnum<["agent", "host_safe_fixer"]>>>;
            repairDurationMs: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            appliedRepairRules: z.ZodOptional<z.ZodArray<z.ZodEnum<["insert_missing_closing_delimiter", "close_unterminated_block_comment", "close_unterminated_string", "close_unterminated_template", "normalize_mismatched_string_quote", "normalize_html_attribute_quotes"]>, "many">>;
            safeFixProposalCount: z.ZodOptional<z.ZodNumber>;
            safeFixProposalDurationMs: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            repairableCheckCount: z.ZodNumber;
            initialDiagnosticCount: z.ZodNullable<z.ZodNumber>;
            latestDiagnosticCount: z.ZodNullable<z.ZodNumber>;
            repairTriggered: z.ZodBoolean;
            repairAttempts: z.ZodNumber;
            maxRepairAttempts: z.ZodNullable<z.ZodNumber>;
            repairOutcome: z.ZodEnum<["not_applicable", "not_needed", "repaired", "exhausted", "unresolved"]>;
            recoveredDeliveryCount: z.ZodUnion<[z.ZodLiteral<0>, z.ZodLiteral<1>]>;
            blockedBrokenDeliveryCount: z.ZodUnion<[z.ZodLiteral<0>, z.ZodLiteral<1>]>;
            /** Absent without a complete Host summary and a known physical Run terminal. */
            deliveredWithSyntaxWarningCount: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<0>, z.ZodLiteral<1>]>>;
        }, "strict", z.ZodTypeAny, {
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
    }, "strict", z.ZodTypeAny, {
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
    limitations: z.ZodArray<z.ZodString, "many">;
    attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    schema: z.ZodLiteral<"open-design.normalized-agent-observation/v1">;
    identity: z.ZodEffects<z.ZodObject<{
        observationId: z.ZodString;
        taskExecutionId: z.ZodString;
        runId: z.ZodString;
        taskRunIndex: z.ZodNumber;
        parentObservationId: z.ZodOptional<z.ZodString>;
        runtimeSessionId: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        observationId: z.ZodString;
        taskExecutionId: z.ZodString;
        runId: z.ZodString;
        taskRunIndex: z.ZodNumber;
        parentObservationId: z.ZodOptional<z.ZodString>;
        runtimeSessionId: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        observationId: z.ZodString;
        taskExecutionId: z.ZodString;
        runId: z.ZodString;
        taskRunIndex: z.ZodNumber;
        parentObservationId: z.ZodOptional<z.ZodString>;
        runtimeSessionId: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
        observationId: z.ZodString;
        taskExecutionId: z.ZodString;
        runId: z.ZodString;
        taskRunIndex: z.ZodNumber;
        parentObservationId: z.ZodOptional<z.ZodString>;
        runtimeSessionId: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        observationId: z.ZodString;
        taskExecutionId: z.ZodString;
        runId: z.ZodString;
        taskRunIndex: z.ZodNumber;
        parentObservationId: z.ZodOptional<z.ZodString>;
        runtimeSessionId: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>;
    kind: z.ZodEnum<["task_run", "child_agent", "model_call", "tool"]>;
    stage: z.ZodEnum<["request", "clarification", "contract_repair", "production"]>;
    status: z.ZodEnum<["queued", "running", "completed", "failed", "canceled", "unknown"]>;
    prompt: z.ZodObject<{
        hostComposed: z.ZodEffects<z.ZodObject<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>;
        childInjected: z.ZodEffects<z.ZodObject<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>;
        agentEffectiveContext: z.ZodEffects<z.ZodObject<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        hostComposed: z.ZodEffects<z.ZodObject<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>;
        childInjected: z.ZodEffects<z.ZodObject<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>;
        agentEffectiveContext: z.ZodEffects<z.ZodObject<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        hostComposed: z.ZodEffects<z.ZodObject<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>;
        childInjected: z.ZodEffects<z.ZodObject<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>;
        agentEffectiveContext: z.ZodEffects<z.ZodObject<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>;
    }, z.ZodTypeAny, "passthrough">>;
    usage: z.ZodEffects<z.ZodObject<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        source: z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>;
        accountingMode: z.ZodEnum<["inclusive", "additive", "unknown"]>;
        values: z.ZodOptional<z.ZodEffects<z.ZodObject<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>>;
        valueSources: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        source: z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>;
        accountingMode: z.ZodEnum<["inclusive", "additive", "unknown"]>;
        values: z.ZodOptional<z.ZodEffects<z.ZodObject<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>>;
        valueSources: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        source: z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>;
        accountingMode: z.ZodEnum<["inclusive", "additive", "unknown"]>;
        values: z.ZodOptional<z.ZodEffects<z.ZodObject<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>>;
        valueSources: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        source: z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>;
        accountingMode: z.ZodEnum<["inclusive", "additive", "unknown"]>;
        values: z.ZodOptional<z.ZodEffects<z.ZodObject<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>>;
        valueSources: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        source: z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>;
        accountingMode: z.ZodEnum<["inclusive", "additive", "unknown"]>;
        values: z.ZodOptional<z.ZodEffects<z.ZodObject<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>>;
        valueSources: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">>;
    timing: z.ZodEffects<z.ZodObject<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        evidence: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodObject<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        evidence: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodObject<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        evidence: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodObject<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        evidence: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodObject<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        evidence: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodObject<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">>;
    childEvidenceCoverage: z.ZodOptional<z.ZodEffects<z.ZodObject<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        source: z.ZodString;
        /**
         * How many distinct Child agents the adapter observed — NOT how many times
         * they were invoked.
         *
         * A parent may re-enter the same Child repeatedly, and a runtime whose
         * evidence is turn-shaped (Codex opens a new rollout turn per invocation)
         * must fold those back to one before reporting here. Leaving the unit unsaid
         * let one adapter count invocations and another count Children, which made
         * the two runtimes' figures silently incomparable.
         */
        knownChildCount: z.ZodNumber;
        explicitZero: z.ZodBoolean;
        limitations: z.ZodArray<z.ZodString, "many">;
        diagnosticCounts: z.ZodArray<z.ZodObject<{
            code: z.ZodString;
            count: z.ZodNumber;
        }, "strict", z.ZodTypeAny, {
            code: string;
            count: number;
        }, {
            code: string;
            count: number;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
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
    turnAccounting: z.ZodOptional<z.ZodObject<{
        turnId: z.ZodString;
        disposition: z.ZodEnum<["owner", "exclude_inherited"]>;
        ownerObservationId: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        turnId: z.ZodString;
        disposition: z.ZodEnum<["owner", "exclude_inherited"]>;
        ownerObservationId: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        turnId: z.ZodString;
        disposition: z.ZodEnum<["owner", "exclude_inherited"]>;
        ownerObservationId: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>>;
    quality: z.ZodOptional<z.ZodObject<{
        schema: z.ZodLiteral<"open-design.safe-run-quality/v1">;
        result: z.ZodOptional<z.ZodObject<{
            output: z.ZodOptional<z.ZodObject<{
                text: z.ZodString;
                redacted: z.ZodLiteral<true>;
                truncated: z.ZodBoolean;
            }, "strict", z.ZodTypeAny, {
                text: string;
                redacted: true;
                truncated: boolean;
            }, {
                text: string;
                redacted: true;
                truncated: boolean;
            }>>;
            error: z.ZodOptional<z.ZodObject<{
                message: z.ZodOptional<z.ZodObject<{
                    text: z.ZodString;
                    redacted: z.ZodLiteral<true>;
                    truncated: z.ZodBoolean;
                }, "strict", z.ZodTypeAny, {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                }, {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                }>>;
                code: z.ZodOptional<z.ZodString>;
                category: z.ZodOptional<z.ZodString>;
                detail: z.ZodOptional<z.ZodString>;
                stage: z.ZodOptional<z.ZodString>;
            }, "strict", z.ZodTypeAny, {
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
        }, "strict", z.ZodTypeAny, {
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
        tools: z.ZodOptional<z.ZodArray<z.ZodObject<{
            callHash: z.ZodString;
            name: z.ZodString;
            input: z.ZodOptional<z.ZodObject<{
                text: z.ZodString;
                redacted: z.ZodLiteral<true>;
                truncated: z.ZodBoolean;
            }, "strict", z.ZodTypeAny, {
                text: string;
                redacted: true;
                truncated: boolean;
            }, {
                text: string;
                redacted: true;
                truncated: boolean;
            }>>;
            output: z.ZodOptional<z.ZodObject<{
                text: z.ZodString;
                redacted: z.ZodLiteral<true>;
                truncated: z.ZodBoolean;
            }, "strict", z.ZodTypeAny, {
                text: string;
                redacted: true;
                truncated: boolean;
            }, {
                text: string;
                redacted: true;
                truncated: boolean;
            }>>;
            status: z.ZodEnum<["running", "completed", "failed", "unknown"]>;
            isError: z.ZodBoolean;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
        }, "strict", z.ZodTypeAny, {
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
        manifests: z.ZodOptional<z.ZodObject<{
            completeness: z.ZodEnum<["complete", "partial", "unavailable"]>;
            attachments: z.ZodArray<z.ZodObject<{
                object_class: z.ZodEnum<["attachment", "artifact", "input_text_snapshot"]>;
                storage_ref: z.ZodString;
                status: z.ZodEnum<["ok", "partial", "unavailable"]>;
                reason: z.ZodOptional<z.ZodString>;
                project_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                run_id: z.ZodOptional<z.ZodString>;
                workspace_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                size_bytes: z.ZodOptional<z.ZodNumber>;
                sha256: z.ZodOptional<z.ZodString>;
                mime_type: z.ZodOptional<z.ZodString>;
                extension: z.ZodOptional<z.ZodString>;
                redacted: z.ZodBoolean;
                truncated: z.ZodBoolean;
                stored_in_open_design: z.ZodOptional<z.ZodBoolean>;
                retention_policy: z.ZodOptional<z.ZodString>;
                access_scope: z.ZodOptional<z.ZodString>;
                sensitivity: z.ZodOptional<z.ZodString>;
                source: z.ZodOptional<z.ZodString>;
                expires_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                approved_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                attachment_id: z.ZodOptional<z.ZodString>;
                artifact_id: z.ZodOptional<z.ZodString>;
                input_text_snapshot_id: z.ZodOptional<z.ZodString>;
                type: z.ZodOptional<z.ZodString>;
                artifact_kind: z.ZodOptional<z.ZodString>;
                build_status: z.ZodOptional<z.ZodString>;
                preview_status: z.ZodOptional<z.ZodString>;
                export_status: z.ZodOptional<z.ZodString>;
                open_in_open_design_url: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                access_policy: z.ZodOptional<z.ZodString>;
            }, "strict", z.ZodTypeAny, {
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
            artifacts: z.ZodArray<z.ZodObject<{
                object_class: z.ZodEnum<["attachment", "artifact", "input_text_snapshot"]>;
                storage_ref: z.ZodString;
                status: z.ZodEnum<["ok", "partial", "unavailable"]>;
                reason: z.ZodOptional<z.ZodString>;
                project_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                run_id: z.ZodOptional<z.ZodString>;
                workspace_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                size_bytes: z.ZodOptional<z.ZodNumber>;
                sha256: z.ZodOptional<z.ZodString>;
                mime_type: z.ZodOptional<z.ZodString>;
                extension: z.ZodOptional<z.ZodString>;
                redacted: z.ZodBoolean;
                truncated: z.ZodBoolean;
                stored_in_open_design: z.ZodOptional<z.ZodBoolean>;
                retention_policy: z.ZodOptional<z.ZodString>;
                access_scope: z.ZodOptional<z.ZodString>;
                sensitivity: z.ZodOptional<z.ZodString>;
                source: z.ZodOptional<z.ZodString>;
                expires_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                approved_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                attachment_id: z.ZodOptional<z.ZodString>;
                artifact_id: z.ZodOptional<z.ZodString>;
                input_text_snapshot_id: z.ZodOptional<z.ZodString>;
                type: z.ZodOptional<z.ZodString>;
                artifact_kind: z.ZodOptional<z.ZodString>;
                build_status: z.ZodOptional<z.ZodString>;
                preview_status: z.ZodOptional<z.ZodString>;
                export_status: z.ZodOptional<z.ZodString>;
                open_in_open_design_url: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                access_policy: z.ZodOptional<z.ZodString>;
            }, "strict", z.ZodTypeAny, {
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
            inputTextSnapshots: z.ZodArray<z.ZodObject<{
                object_class: z.ZodEnum<["attachment", "artifact", "input_text_snapshot"]>;
                storage_ref: z.ZodString;
                status: z.ZodEnum<["ok", "partial", "unavailable"]>;
                reason: z.ZodOptional<z.ZodString>;
                project_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                run_id: z.ZodOptional<z.ZodString>;
                workspace_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                size_bytes: z.ZodOptional<z.ZodNumber>;
                sha256: z.ZodOptional<z.ZodString>;
                mime_type: z.ZodOptional<z.ZodString>;
                extension: z.ZodOptional<z.ZodString>;
                redacted: z.ZodBoolean;
                truncated: z.ZodBoolean;
                stored_in_open_design: z.ZodOptional<z.ZodBoolean>;
                retention_policy: z.ZodOptional<z.ZodString>;
                access_scope: z.ZodOptional<z.ZodString>;
                sensitivity: z.ZodOptional<z.ZodString>;
                source: z.ZodOptional<z.ZodString>;
                expires_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                approved_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                attachment_id: z.ZodOptional<z.ZodString>;
                artifact_id: z.ZodOptional<z.ZodString>;
                input_text_snapshot_id: z.ZodOptional<z.ZodString>;
                type: z.ZodOptional<z.ZodString>;
                artifact_kind: z.ZodOptional<z.ZodString>;
                build_status: z.ZodOptional<z.ZodString>;
                preview_status: z.ZodOptional<z.ZodString>;
                export_status: z.ZodOptional<z.ZodString>;
                open_in_open_design_url: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                access_policy: z.ZodOptional<z.ZodString>;
            }, "strict", z.ZodTypeAny, {
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
        }, "strict", z.ZodTypeAny, {
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
        process: z.ZodOptional<z.ZodObject<{
            exitCode: z.ZodOptional<z.ZodNumber>;
            signal: z.ZodOptional<z.ZodString>;
            stderr: z.ZodOptional<z.ZodEffects<z.ZodObject<{
                tail: z.ZodOptional<z.ZodObject<{
                    text: z.ZodString;
                    redacted: z.ZodLiteral<true>;
                    truncated: z.ZodBoolean;
                }, "strict", z.ZodTypeAny, {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                }, {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                }>>;
                lineCount: z.ZodNumber;
                truncated: z.ZodBoolean;
                limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strict", z.ZodTypeAny, {
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
            stdout: z.ZodOptional<z.ZodEffects<z.ZodObject<{
                tail: z.ZodOptional<z.ZodObject<{
                    text: z.ZodString;
                    redacted: z.ZodLiteral<true>;
                    truncated: z.ZodBoolean;
                }, "strict", z.ZodTypeAny, {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                }, {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                }>>;
                lineCount: z.ZodNumber;
                truncated: z.ZodBoolean;
                limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strict", z.ZodTypeAny, {
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
            diagnostics: z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodBoolean, z.ZodString]>>, Record<string, string | boolean>, Record<string, string | boolean>>>;
        }, "strict", z.ZodTypeAny, {
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
        deliverableSyntax: z.ZodOptional<z.ZodObject<{
            schemaVersion: z.ZodLiteral<"deliverable-syntax-telemetry-v1">;
            applicable: z.ZodBoolean;
            status: z.ZodEnum<["pass", "repairable", "incomplete", "exhausted", "skipped"]>;
            source: z.ZodEnum<["agent_tool", "run_finalizer"]>;
            checker: z.ZodNullable<z.ZodString>;
            checkedFileCount: z.ZodNumber;
            checkCount: z.ZodNumber;
            checkerDurationMs: z.ZodNullable<z.ZodNumber>;
            repairWindowDurationMs: z.ZodNullable<z.ZodNumber>;
            repairToDeliveryDurationMs: z.ZodNullable<z.ZodNumber>;
            repairToTerminalDurationMs: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            terminalRunStatus: z.ZodOptional<z.ZodEnum<["succeeded", "failed", "canceled"]>>;
            finalization: z.ZodOptional<z.ZodObject<{
                action: z.ZodEnum<["allow", "warn", "fail"]>;
                reason: z.ZodOptional<z.ZodEnum<["attempt_limit_reached", "commit_conflict", "commit_failed", "check_incomplete", "no_progress", "no_safe_fix", "verification_failed", "repair_budget_exceeded", "internal_error"]>>;
                refusal: z.ZodOptional<z.ZodEnum<["ambiguous_diagnostic", "file_unreadable", "path_outside_project", "unsupported_syntax_error", "multiple_files"]>>;
                summaryVersion: z.ZodOptional<z.ZodLiteral<1>>;
                initialStatus: z.ZodOptional<z.ZodEnum<["pass", "repairable", "incomplete", "skipped"]>>;
                repairEngine: z.ZodOptional<z.ZodLiteral<"host-safe-fixer@2">>;
                stagedPatchCount: z.ZodOptional<z.ZodNumber>;
                committedPatchCount: z.ZodOptional<z.ZodNumber>;
                committedRepairRules: z.ZodOptional<z.ZodArray<z.ZodEnum<["insert_missing_closing_delimiter", "close_unterminated_block_comment", "close_unterminated_string", "close_unterminated_template", "normalize_mismatched_string_quote", "normalize_html_attribute_quotes"]>, "many">>;
            }, "strict", z.ZodTypeAny, {
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
            repairExecutor: z.ZodOptional<z.ZodNullable<z.ZodEnum<["agent", "host_safe_fixer"]>>>;
            repairDurationMs: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            appliedRepairRules: z.ZodOptional<z.ZodArray<z.ZodEnum<["insert_missing_closing_delimiter", "close_unterminated_block_comment", "close_unterminated_string", "close_unterminated_template", "normalize_mismatched_string_quote", "normalize_html_attribute_quotes"]>, "many">>;
            safeFixProposalCount: z.ZodOptional<z.ZodNumber>;
            safeFixProposalDurationMs: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            repairableCheckCount: z.ZodNumber;
            initialDiagnosticCount: z.ZodNullable<z.ZodNumber>;
            latestDiagnosticCount: z.ZodNullable<z.ZodNumber>;
            repairTriggered: z.ZodBoolean;
            repairAttempts: z.ZodNumber;
            maxRepairAttempts: z.ZodNullable<z.ZodNumber>;
            repairOutcome: z.ZodEnum<["not_applicable", "not_needed", "repaired", "exhausted", "unresolved"]>;
            recoveredDeliveryCount: z.ZodUnion<[z.ZodLiteral<0>, z.ZodLiteral<1>]>;
            blockedBrokenDeliveryCount: z.ZodUnion<[z.ZodLiteral<0>, z.ZodLiteral<1>]>;
            /** Absent without a complete Host summary and a known physical Run terminal. */
            deliveredWithSyntaxWarningCount: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<0>, z.ZodLiteral<1>]>>;
        }, "strict", z.ZodTypeAny, {
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
    }, "strict", z.ZodTypeAny, {
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
    limitations: z.ZodArray<z.ZodString, "many">;
    attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
    schema: z.ZodLiteral<"open-design.normalized-agent-observation/v1">;
    identity: z.ZodEffects<z.ZodObject<{
        observationId: z.ZodString;
        taskExecutionId: z.ZodString;
        runId: z.ZodString;
        taskRunIndex: z.ZodNumber;
        parentObservationId: z.ZodOptional<z.ZodString>;
        runtimeSessionId: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        observationId: z.ZodString;
        taskExecutionId: z.ZodString;
        runId: z.ZodString;
        taskRunIndex: z.ZodNumber;
        parentObservationId: z.ZodOptional<z.ZodString>;
        runtimeSessionId: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        observationId: z.ZodString;
        taskExecutionId: z.ZodString;
        runId: z.ZodString;
        taskRunIndex: z.ZodNumber;
        parentObservationId: z.ZodOptional<z.ZodString>;
        runtimeSessionId: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
        observationId: z.ZodString;
        taskExecutionId: z.ZodString;
        runId: z.ZodString;
        taskRunIndex: z.ZodNumber;
        parentObservationId: z.ZodOptional<z.ZodString>;
        runtimeSessionId: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        observationId: z.ZodString;
        taskExecutionId: z.ZodString;
        runId: z.ZodString;
        taskRunIndex: z.ZodNumber;
        parentObservationId: z.ZodOptional<z.ZodString>;
        runtimeSessionId: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>;
    kind: z.ZodEnum<["task_run", "child_agent", "model_call", "tool"]>;
    stage: z.ZodEnum<["request", "clarification", "contract_repair", "production"]>;
    status: z.ZodEnum<["queued", "running", "completed", "failed", "canceled", "unknown"]>;
    prompt: z.ZodObject<{
        hostComposed: z.ZodEffects<z.ZodObject<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>;
        childInjected: z.ZodEffects<z.ZodObject<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>;
        agentEffectiveContext: z.ZodEffects<z.ZodObject<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        hostComposed: z.ZodEffects<z.ZodObject<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>;
        childInjected: z.ZodEffects<z.ZodObject<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>;
        agentEffectiveContext: z.ZodEffects<z.ZodObject<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        hostComposed: z.ZodEffects<z.ZodObject<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>;
        childInjected: z.ZodEffects<z.ZodObject<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>;
        agentEffectiveContext: z.ZodEffects<z.ZodObject<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>;
    }, z.ZodTypeAny, "passthrough">>;
    usage: z.ZodEffects<z.ZodObject<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        source: z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>;
        accountingMode: z.ZodEnum<["inclusive", "additive", "unknown"]>;
        values: z.ZodOptional<z.ZodEffects<z.ZodObject<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>>;
        valueSources: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        source: z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>;
        accountingMode: z.ZodEnum<["inclusive", "additive", "unknown"]>;
        values: z.ZodOptional<z.ZodEffects<z.ZodObject<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>>;
        valueSources: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        source: z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>;
        accountingMode: z.ZodEnum<["inclusive", "additive", "unknown"]>;
        values: z.ZodOptional<z.ZodEffects<z.ZodObject<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>>;
        valueSources: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        source: z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>;
        accountingMode: z.ZodEnum<["inclusive", "additive", "unknown"]>;
        values: z.ZodOptional<z.ZodEffects<z.ZodObject<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>>;
        valueSources: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        source: z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>;
        accountingMode: z.ZodEnum<["inclusive", "additive", "unknown"]>;
        values: z.ZodOptional<z.ZodEffects<z.ZodObject<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>>;
        valueSources: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">>;
    timing: z.ZodEffects<z.ZodObject<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        evidence: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodObject<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        evidence: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodObject<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        evidence: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodObject<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        evidence: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodObject<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        evidence: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodObject<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">>;
    childEvidenceCoverage: z.ZodOptional<z.ZodEffects<z.ZodObject<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        source: z.ZodString;
        /**
         * How many distinct Child agents the adapter observed — NOT how many times
         * they were invoked.
         *
         * A parent may re-enter the same Child repeatedly, and a runtime whose
         * evidence is turn-shaped (Codex opens a new rollout turn per invocation)
         * must fold those back to one before reporting here. Leaving the unit unsaid
         * let one adapter count invocations and another count Children, which made
         * the two runtimes' figures silently incomparable.
         */
        knownChildCount: z.ZodNumber;
        explicitZero: z.ZodBoolean;
        limitations: z.ZodArray<z.ZodString, "many">;
        diagnosticCounts: z.ZodArray<z.ZodObject<{
            code: z.ZodString;
            count: z.ZodNumber;
        }, "strict", z.ZodTypeAny, {
            code: string;
            count: number;
        }, {
            code: string;
            count: number;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
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
    turnAccounting: z.ZodOptional<z.ZodObject<{
        turnId: z.ZodString;
        disposition: z.ZodEnum<["owner", "exclude_inherited"]>;
        ownerObservationId: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        turnId: z.ZodString;
        disposition: z.ZodEnum<["owner", "exclude_inherited"]>;
        ownerObservationId: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        turnId: z.ZodString;
        disposition: z.ZodEnum<["owner", "exclude_inherited"]>;
        ownerObservationId: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>>;
    quality: z.ZodOptional<z.ZodObject<{
        schema: z.ZodLiteral<"open-design.safe-run-quality/v1">;
        result: z.ZodOptional<z.ZodObject<{
            output: z.ZodOptional<z.ZodObject<{
                text: z.ZodString;
                redacted: z.ZodLiteral<true>;
                truncated: z.ZodBoolean;
            }, "strict", z.ZodTypeAny, {
                text: string;
                redacted: true;
                truncated: boolean;
            }, {
                text: string;
                redacted: true;
                truncated: boolean;
            }>>;
            error: z.ZodOptional<z.ZodObject<{
                message: z.ZodOptional<z.ZodObject<{
                    text: z.ZodString;
                    redacted: z.ZodLiteral<true>;
                    truncated: z.ZodBoolean;
                }, "strict", z.ZodTypeAny, {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                }, {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                }>>;
                code: z.ZodOptional<z.ZodString>;
                category: z.ZodOptional<z.ZodString>;
                detail: z.ZodOptional<z.ZodString>;
                stage: z.ZodOptional<z.ZodString>;
            }, "strict", z.ZodTypeAny, {
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
        }, "strict", z.ZodTypeAny, {
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
        tools: z.ZodOptional<z.ZodArray<z.ZodObject<{
            callHash: z.ZodString;
            name: z.ZodString;
            input: z.ZodOptional<z.ZodObject<{
                text: z.ZodString;
                redacted: z.ZodLiteral<true>;
                truncated: z.ZodBoolean;
            }, "strict", z.ZodTypeAny, {
                text: string;
                redacted: true;
                truncated: boolean;
            }, {
                text: string;
                redacted: true;
                truncated: boolean;
            }>>;
            output: z.ZodOptional<z.ZodObject<{
                text: z.ZodString;
                redacted: z.ZodLiteral<true>;
                truncated: z.ZodBoolean;
            }, "strict", z.ZodTypeAny, {
                text: string;
                redacted: true;
                truncated: boolean;
            }, {
                text: string;
                redacted: true;
                truncated: boolean;
            }>>;
            status: z.ZodEnum<["running", "completed", "failed", "unknown"]>;
            isError: z.ZodBoolean;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
        }, "strict", z.ZodTypeAny, {
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
        manifests: z.ZodOptional<z.ZodObject<{
            completeness: z.ZodEnum<["complete", "partial", "unavailable"]>;
            attachments: z.ZodArray<z.ZodObject<{
                object_class: z.ZodEnum<["attachment", "artifact", "input_text_snapshot"]>;
                storage_ref: z.ZodString;
                status: z.ZodEnum<["ok", "partial", "unavailable"]>;
                reason: z.ZodOptional<z.ZodString>;
                project_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                run_id: z.ZodOptional<z.ZodString>;
                workspace_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                size_bytes: z.ZodOptional<z.ZodNumber>;
                sha256: z.ZodOptional<z.ZodString>;
                mime_type: z.ZodOptional<z.ZodString>;
                extension: z.ZodOptional<z.ZodString>;
                redacted: z.ZodBoolean;
                truncated: z.ZodBoolean;
                stored_in_open_design: z.ZodOptional<z.ZodBoolean>;
                retention_policy: z.ZodOptional<z.ZodString>;
                access_scope: z.ZodOptional<z.ZodString>;
                sensitivity: z.ZodOptional<z.ZodString>;
                source: z.ZodOptional<z.ZodString>;
                expires_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                approved_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                attachment_id: z.ZodOptional<z.ZodString>;
                artifact_id: z.ZodOptional<z.ZodString>;
                input_text_snapshot_id: z.ZodOptional<z.ZodString>;
                type: z.ZodOptional<z.ZodString>;
                artifact_kind: z.ZodOptional<z.ZodString>;
                build_status: z.ZodOptional<z.ZodString>;
                preview_status: z.ZodOptional<z.ZodString>;
                export_status: z.ZodOptional<z.ZodString>;
                open_in_open_design_url: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                access_policy: z.ZodOptional<z.ZodString>;
            }, "strict", z.ZodTypeAny, {
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
            artifacts: z.ZodArray<z.ZodObject<{
                object_class: z.ZodEnum<["attachment", "artifact", "input_text_snapshot"]>;
                storage_ref: z.ZodString;
                status: z.ZodEnum<["ok", "partial", "unavailable"]>;
                reason: z.ZodOptional<z.ZodString>;
                project_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                run_id: z.ZodOptional<z.ZodString>;
                workspace_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                size_bytes: z.ZodOptional<z.ZodNumber>;
                sha256: z.ZodOptional<z.ZodString>;
                mime_type: z.ZodOptional<z.ZodString>;
                extension: z.ZodOptional<z.ZodString>;
                redacted: z.ZodBoolean;
                truncated: z.ZodBoolean;
                stored_in_open_design: z.ZodOptional<z.ZodBoolean>;
                retention_policy: z.ZodOptional<z.ZodString>;
                access_scope: z.ZodOptional<z.ZodString>;
                sensitivity: z.ZodOptional<z.ZodString>;
                source: z.ZodOptional<z.ZodString>;
                expires_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                approved_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                attachment_id: z.ZodOptional<z.ZodString>;
                artifact_id: z.ZodOptional<z.ZodString>;
                input_text_snapshot_id: z.ZodOptional<z.ZodString>;
                type: z.ZodOptional<z.ZodString>;
                artifact_kind: z.ZodOptional<z.ZodString>;
                build_status: z.ZodOptional<z.ZodString>;
                preview_status: z.ZodOptional<z.ZodString>;
                export_status: z.ZodOptional<z.ZodString>;
                open_in_open_design_url: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                access_policy: z.ZodOptional<z.ZodString>;
            }, "strict", z.ZodTypeAny, {
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
            inputTextSnapshots: z.ZodArray<z.ZodObject<{
                object_class: z.ZodEnum<["attachment", "artifact", "input_text_snapshot"]>;
                storage_ref: z.ZodString;
                status: z.ZodEnum<["ok", "partial", "unavailable"]>;
                reason: z.ZodOptional<z.ZodString>;
                project_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                run_id: z.ZodOptional<z.ZodString>;
                workspace_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                size_bytes: z.ZodOptional<z.ZodNumber>;
                sha256: z.ZodOptional<z.ZodString>;
                mime_type: z.ZodOptional<z.ZodString>;
                extension: z.ZodOptional<z.ZodString>;
                redacted: z.ZodBoolean;
                truncated: z.ZodBoolean;
                stored_in_open_design: z.ZodOptional<z.ZodBoolean>;
                retention_policy: z.ZodOptional<z.ZodString>;
                access_scope: z.ZodOptional<z.ZodString>;
                sensitivity: z.ZodOptional<z.ZodString>;
                source: z.ZodOptional<z.ZodString>;
                expires_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                approved_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                attachment_id: z.ZodOptional<z.ZodString>;
                artifact_id: z.ZodOptional<z.ZodString>;
                input_text_snapshot_id: z.ZodOptional<z.ZodString>;
                type: z.ZodOptional<z.ZodString>;
                artifact_kind: z.ZodOptional<z.ZodString>;
                build_status: z.ZodOptional<z.ZodString>;
                preview_status: z.ZodOptional<z.ZodString>;
                export_status: z.ZodOptional<z.ZodString>;
                open_in_open_design_url: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                access_policy: z.ZodOptional<z.ZodString>;
            }, "strict", z.ZodTypeAny, {
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
        }, "strict", z.ZodTypeAny, {
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
        process: z.ZodOptional<z.ZodObject<{
            exitCode: z.ZodOptional<z.ZodNumber>;
            signal: z.ZodOptional<z.ZodString>;
            stderr: z.ZodOptional<z.ZodEffects<z.ZodObject<{
                tail: z.ZodOptional<z.ZodObject<{
                    text: z.ZodString;
                    redacted: z.ZodLiteral<true>;
                    truncated: z.ZodBoolean;
                }, "strict", z.ZodTypeAny, {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                }, {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                }>>;
                lineCount: z.ZodNumber;
                truncated: z.ZodBoolean;
                limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strict", z.ZodTypeAny, {
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
            stdout: z.ZodOptional<z.ZodEffects<z.ZodObject<{
                tail: z.ZodOptional<z.ZodObject<{
                    text: z.ZodString;
                    redacted: z.ZodLiteral<true>;
                    truncated: z.ZodBoolean;
                }, "strict", z.ZodTypeAny, {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                }, {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                }>>;
                lineCount: z.ZodNumber;
                truncated: z.ZodBoolean;
                limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strict", z.ZodTypeAny, {
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
            diagnostics: z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodBoolean, z.ZodString]>>, Record<string, string | boolean>, Record<string, string | boolean>>>;
        }, "strict", z.ZodTypeAny, {
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
        deliverableSyntax: z.ZodOptional<z.ZodObject<{
            schemaVersion: z.ZodLiteral<"deliverable-syntax-telemetry-v1">;
            applicable: z.ZodBoolean;
            status: z.ZodEnum<["pass", "repairable", "incomplete", "exhausted", "skipped"]>;
            source: z.ZodEnum<["agent_tool", "run_finalizer"]>;
            checker: z.ZodNullable<z.ZodString>;
            checkedFileCount: z.ZodNumber;
            checkCount: z.ZodNumber;
            checkerDurationMs: z.ZodNullable<z.ZodNumber>;
            repairWindowDurationMs: z.ZodNullable<z.ZodNumber>;
            repairToDeliveryDurationMs: z.ZodNullable<z.ZodNumber>;
            repairToTerminalDurationMs: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            terminalRunStatus: z.ZodOptional<z.ZodEnum<["succeeded", "failed", "canceled"]>>;
            finalization: z.ZodOptional<z.ZodObject<{
                action: z.ZodEnum<["allow", "warn", "fail"]>;
                reason: z.ZodOptional<z.ZodEnum<["attempt_limit_reached", "commit_conflict", "commit_failed", "check_incomplete", "no_progress", "no_safe_fix", "verification_failed", "repair_budget_exceeded", "internal_error"]>>;
                refusal: z.ZodOptional<z.ZodEnum<["ambiguous_diagnostic", "file_unreadable", "path_outside_project", "unsupported_syntax_error", "multiple_files"]>>;
                summaryVersion: z.ZodOptional<z.ZodLiteral<1>>;
                initialStatus: z.ZodOptional<z.ZodEnum<["pass", "repairable", "incomplete", "skipped"]>>;
                repairEngine: z.ZodOptional<z.ZodLiteral<"host-safe-fixer@2">>;
                stagedPatchCount: z.ZodOptional<z.ZodNumber>;
                committedPatchCount: z.ZodOptional<z.ZodNumber>;
                committedRepairRules: z.ZodOptional<z.ZodArray<z.ZodEnum<["insert_missing_closing_delimiter", "close_unterminated_block_comment", "close_unterminated_string", "close_unterminated_template", "normalize_mismatched_string_quote", "normalize_html_attribute_quotes"]>, "many">>;
            }, "strict", z.ZodTypeAny, {
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
            repairExecutor: z.ZodOptional<z.ZodNullable<z.ZodEnum<["agent", "host_safe_fixer"]>>>;
            repairDurationMs: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            appliedRepairRules: z.ZodOptional<z.ZodArray<z.ZodEnum<["insert_missing_closing_delimiter", "close_unterminated_block_comment", "close_unterminated_string", "close_unterminated_template", "normalize_mismatched_string_quote", "normalize_html_attribute_quotes"]>, "many">>;
            safeFixProposalCount: z.ZodOptional<z.ZodNumber>;
            safeFixProposalDurationMs: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            repairableCheckCount: z.ZodNumber;
            initialDiagnosticCount: z.ZodNullable<z.ZodNumber>;
            latestDiagnosticCount: z.ZodNullable<z.ZodNumber>;
            repairTriggered: z.ZodBoolean;
            repairAttempts: z.ZodNumber;
            maxRepairAttempts: z.ZodNullable<z.ZodNumber>;
            repairOutcome: z.ZodEnum<["not_applicable", "not_needed", "repaired", "exhausted", "unresolved"]>;
            recoveredDeliveryCount: z.ZodUnion<[z.ZodLiteral<0>, z.ZodLiteral<1>]>;
            blockedBrokenDeliveryCount: z.ZodUnion<[z.ZodLiteral<0>, z.ZodLiteral<1>]>;
            /** Absent without a complete Host summary and a known physical Run terminal. */
            deliveredWithSyntaxWarningCount: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<0>, z.ZodLiteral<1>]>>;
        }, "strict", z.ZodTypeAny, {
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
    }, "strict", z.ZodTypeAny, {
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
    limitations: z.ZodArray<z.ZodString, "many">;
    attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    schema: z.ZodLiteral<"open-design.normalized-agent-observation/v1">;
    identity: z.ZodEffects<z.ZodObject<{
        observationId: z.ZodString;
        taskExecutionId: z.ZodString;
        runId: z.ZodString;
        taskRunIndex: z.ZodNumber;
        parentObservationId: z.ZodOptional<z.ZodString>;
        runtimeSessionId: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        observationId: z.ZodString;
        taskExecutionId: z.ZodString;
        runId: z.ZodString;
        taskRunIndex: z.ZodNumber;
        parentObservationId: z.ZodOptional<z.ZodString>;
        runtimeSessionId: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        observationId: z.ZodString;
        taskExecutionId: z.ZodString;
        runId: z.ZodString;
        taskRunIndex: z.ZodNumber;
        parentObservationId: z.ZodOptional<z.ZodString>;
        runtimeSessionId: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
        observationId: z.ZodString;
        taskExecutionId: z.ZodString;
        runId: z.ZodString;
        taskRunIndex: z.ZodNumber;
        parentObservationId: z.ZodOptional<z.ZodString>;
        runtimeSessionId: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        observationId: z.ZodString;
        taskExecutionId: z.ZodString;
        runId: z.ZodString;
        taskRunIndex: z.ZodNumber;
        parentObservationId: z.ZodOptional<z.ZodString>;
        runtimeSessionId: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>;
    kind: z.ZodEnum<["task_run", "child_agent", "model_call", "tool"]>;
    stage: z.ZodEnum<["request", "clarification", "contract_repair", "production"]>;
    status: z.ZodEnum<["queued", "running", "completed", "failed", "canceled", "unknown"]>;
    prompt: z.ZodObject<{
        hostComposed: z.ZodEffects<z.ZodObject<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>;
        childInjected: z.ZodEffects<z.ZodObject<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>;
        agentEffectiveContext: z.ZodEffects<z.ZodObject<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        hostComposed: z.ZodEffects<z.ZodObject<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>;
        childInjected: z.ZodEffects<z.ZodObject<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>;
        agentEffectiveContext: z.ZodEffects<z.ZodObject<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        hostComposed: z.ZodEffects<z.ZodObject<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>;
        childInjected: z.ZodEffects<z.ZodObject<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>;
        agentEffectiveContext: z.ZodEffects<z.ZodObject<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            availability: z.ZodEnum<["exact", "partial", "unavailable", "unobservable"]>;
            source: z.ZodOptional<z.ZodEnum<["daemon", "provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>;
            hash: z.ZodOptional<z.ZodString>;
            bytes: z.ZodOptional<z.ZodNumber>;
            safePayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            limitations: z.ZodArray<z.ZodString, "many">;
        }, z.ZodTypeAny, "passthrough">>;
    }, z.ZodTypeAny, "passthrough">>;
    usage: z.ZodEffects<z.ZodObject<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        source: z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>;
        accountingMode: z.ZodEnum<["inclusive", "additive", "unknown"]>;
        values: z.ZodOptional<z.ZodEffects<z.ZodObject<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>>;
        valueSources: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        source: z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>;
        accountingMode: z.ZodEnum<["inclusive", "additive", "unknown"]>;
        values: z.ZodOptional<z.ZodEffects<z.ZodObject<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>>;
        valueSources: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        source: z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>;
        accountingMode: z.ZodEnum<["inclusive", "additive", "unknown"]>;
        values: z.ZodOptional<z.ZodEffects<z.ZodObject<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>>;
        valueSources: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        source: z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>;
        accountingMode: z.ZodEnum<["inclusive", "additive", "unknown"]>;
        values: z.ZodOptional<z.ZodEffects<z.ZodObject<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>>;
        valueSources: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        source: z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>;
        accountingMode: z.ZodEnum<["inclusive", "additive", "unknown"]>;
        values: z.ZodOptional<z.ZodEffects<z.ZodObject<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            effectiveInputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            totalTokens: z.ZodOptional<z.ZodNumber>;
            thoughtTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadTokens: z.ZodOptional<z.ZodNumber>;
            cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
            uncachedInputTokens: z.ZodOptional<z.ZodNumber>;
            estimatedContextTokens: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>>;
        valueSources: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodEnum<["provider_stream", "rollout", "acp", "runtime", "derived", "unknown"]>>>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">>;
    timing: z.ZodEffects<z.ZodObject<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        evidence: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodObject<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        evidence: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodObject<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        evidence: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodObject<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        evidence: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodObject<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        evidence: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodObject<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            source: z.ZodEnum<["host_monotonic", "host_wall_clock", "runtime", "provider", "unknown"]>;
            clockDomain: z.ZodString;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            measurements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        limitations: z.ZodArray<z.ZodString, "many">;
    }, z.ZodTypeAny, "passthrough">>;
    childEvidenceCoverage: z.ZodOptional<z.ZodEffects<z.ZodObject<{
        availability: z.ZodEnum<["complete", "partial", "unavailable"]>;
        source: z.ZodString;
        /**
         * How many distinct Child agents the adapter observed — NOT how many times
         * they were invoked.
         *
         * A parent may re-enter the same Child repeatedly, and a runtime whose
         * evidence is turn-shaped (Codex opens a new rollout turn per invocation)
         * must fold those back to one before reporting here. Leaving the unit unsaid
         * let one adapter count invocations and another count Children, which made
         * the two runtimes' figures silently incomparable.
         */
        knownChildCount: z.ZodNumber;
        explicitZero: z.ZodBoolean;
        limitations: z.ZodArray<z.ZodString, "many">;
        diagnosticCounts: z.ZodArray<z.ZodObject<{
            code: z.ZodString;
            count: z.ZodNumber;
        }, "strict", z.ZodTypeAny, {
            code: string;
            count: number;
        }, {
            code: string;
            count: number;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
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
    turnAccounting: z.ZodOptional<z.ZodObject<{
        turnId: z.ZodString;
        disposition: z.ZodEnum<["owner", "exclude_inherited"]>;
        ownerObservationId: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        turnId: z.ZodString;
        disposition: z.ZodEnum<["owner", "exclude_inherited"]>;
        ownerObservationId: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        turnId: z.ZodString;
        disposition: z.ZodEnum<["owner", "exclude_inherited"]>;
        ownerObservationId: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>>;
    quality: z.ZodOptional<z.ZodObject<{
        schema: z.ZodLiteral<"open-design.safe-run-quality/v1">;
        result: z.ZodOptional<z.ZodObject<{
            output: z.ZodOptional<z.ZodObject<{
                text: z.ZodString;
                redacted: z.ZodLiteral<true>;
                truncated: z.ZodBoolean;
            }, "strict", z.ZodTypeAny, {
                text: string;
                redacted: true;
                truncated: boolean;
            }, {
                text: string;
                redacted: true;
                truncated: boolean;
            }>>;
            error: z.ZodOptional<z.ZodObject<{
                message: z.ZodOptional<z.ZodObject<{
                    text: z.ZodString;
                    redacted: z.ZodLiteral<true>;
                    truncated: z.ZodBoolean;
                }, "strict", z.ZodTypeAny, {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                }, {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                }>>;
                code: z.ZodOptional<z.ZodString>;
                category: z.ZodOptional<z.ZodString>;
                detail: z.ZodOptional<z.ZodString>;
                stage: z.ZodOptional<z.ZodString>;
            }, "strict", z.ZodTypeAny, {
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
        }, "strict", z.ZodTypeAny, {
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
        tools: z.ZodOptional<z.ZodArray<z.ZodObject<{
            callHash: z.ZodString;
            name: z.ZodString;
            input: z.ZodOptional<z.ZodObject<{
                text: z.ZodString;
                redacted: z.ZodLiteral<true>;
                truncated: z.ZodBoolean;
            }, "strict", z.ZodTypeAny, {
                text: string;
                redacted: true;
                truncated: boolean;
            }, {
                text: string;
                redacted: true;
                truncated: boolean;
            }>>;
            output: z.ZodOptional<z.ZodObject<{
                text: z.ZodString;
                redacted: z.ZodLiteral<true>;
                truncated: z.ZodBoolean;
            }, "strict", z.ZodTypeAny, {
                text: string;
                redacted: true;
                truncated: boolean;
            }, {
                text: string;
                redacted: true;
                truncated: boolean;
            }>>;
            status: z.ZodEnum<["running", "completed", "failed", "unknown"]>;
            isError: z.ZodBoolean;
            startedAtMs: z.ZodOptional<z.ZodNumber>;
            endedAtMs: z.ZodOptional<z.ZodNumber>;
        }, "strict", z.ZodTypeAny, {
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
        manifests: z.ZodOptional<z.ZodObject<{
            completeness: z.ZodEnum<["complete", "partial", "unavailable"]>;
            attachments: z.ZodArray<z.ZodObject<{
                object_class: z.ZodEnum<["attachment", "artifact", "input_text_snapshot"]>;
                storage_ref: z.ZodString;
                status: z.ZodEnum<["ok", "partial", "unavailable"]>;
                reason: z.ZodOptional<z.ZodString>;
                project_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                run_id: z.ZodOptional<z.ZodString>;
                workspace_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                size_bytes: z.ZodOptional<z.ZodNumber>;
                sha256: z.ZodOptional<z.ZodString>;
                mime_type: z.ZodOptional<z.ZodString>;
                extension: z.ZodOptional<z.ZodString>;
                redacted: z.ZodBoolean;
                truncated: z.ZodBoolean;
                stored_in_open_design: z.ZodOptional<z.ZodBoolean>;
                retention_policy: z.ZodOptional<z.ZodString>;
                access_scope: z.ZodOptional<z.ZodString>;
                sensitivity: z.ZodOptional<z.ZodString>;
                source: z.ZodOptional<z.ZodString>;
                expires_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                approved_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                attachment_id: z.ZodOptional<z.ZodString>;
                artifact_id: z.ZodOptional<z.ZodString>;
                input_text_snapshot_id: z.ZodOptional<z.ZodString>;
                type: z.ZodOptional<z.ZodString>;
                artifact_kind: z.ZodOptional<z.ZodString>;
                build_status: z.ZodOptional<z.ZodString>;
                preview_status: z.ZodOptional<z.ZodString>;
                export_status: z.ZodOptional<z.ZodString>;
                open_in_open_design_url: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                access_policy: z.ZodOptional<z.ZodString>;
            }, "strict", z.ZodTypeAny, {
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
            artifacts: z.ZodArray<z.ZodObject<{
                object_class: z.ZodEnum<["attachment", "artifact", "input_text_snapshot"]>;
                storage_ref: z.ZodString;
                status: z.ZodEnum<["ok", "partial", "unavailable"]>;
                reason: z.ZodOptional<z.ZodString>;
                project_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                run_id: z.ZodOptional<z.ZodString>;
                workspace_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                size_bytes: z.ZodOptional<z.ZodNumber>;
                sha256: z.ZodOptional<z.ZodString>;
                mime_type: z.ZodOptional<z.ZodString>;
                extension: z.ZodOptional<z.ZodString>;
                redacted: z.ZodBoolean;
                truncated: z.ZodBoolean;
                stored_in_open_design: z.ZodOptional<z.ZodBoolean>;
                retention_policy: z.ZodOptional<z.ZodString>;
                access_scope: z.ZodOptional<z.ZodString>;
                sensitivity: z.ZodOptional<z.ZodString>;
                source: z.ZodOptional<z.ZodString>;
                expires_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                approved_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                attachment_id: z.ZodOptional<z.ZodString>;
                artifact_id: z.ZodOptional<z.ZodString>;
                input_text_snapshot_id: z.ZodOptional<z.ZodString>;
                type: z.ZodOptional<z.ZodString>;
                artifact_kind: z.ZodOptional<z.ZodString>;
                build_status: z.ZodOptional<z.ZodString>;
                preview_status: z.ZodOptional<z.ZodString>;
                export_status: z.ZodOptional<z.ZodString>;
                open_in_open_design_url: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                access_policy: z.ZodOptional<z.ZodString>;
            }, "strict", z.ZodTypeAny, {
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
            inputTextSnapshots: z.ZodArray<z.ZodObject<{
                object_class: z.ZodEnum<["attachment", "artifact", "input_text_snapshot"]>;
                storage_ref: z.ZodString;
                status: z.ZodEnum<["ok", "partial", "unavailable"]>;
                reason: z.ZodOptional<z.ZodString>;
                project_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                run_id: z.ZodOptional<z.ZodString>;
                workspace_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                size_bytes: z.ZodOptional<z.ZodNumber>;
                sha256: z.ZodOptional<z.ZodString>;
                mime_type: z.ZodOptional<z.ZodString>;
                extension: z.ZodOptional<z.ZodString>;
                redacted: z.ZodBoolean;
                truncated: z.ZodBoolean;
                stored_in_open_design: z.ZodOptional<z.ZodBoolean>;
                retention_policy: z.ZodOptional<z.ZodString>;
                access_scope: z.ZodOptional<z.ZodString>;
                sensitivity: z.ZodOptional<z.ZodString>;
                source: z.ZodOptional<z.ZodString>;
                expires_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                approved_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                attachment_id: z.ZodOptional<z.ZodString>;
                artifact_id: z.ZodOptional<z.ZodString>;
                input_text_snapshot_id: z.ZodOptional<z.ZodString>;
                type: z.ZodOptional<z.ZodString>;
                artifact_kind: z.ZodOptional<z.ZodString>;
                build_status: z.ZodOptional<z.ZodString>;
                preview_status: z.ZodOptional<z.ZodString>;
                export_status: z.ZodOptional<z.ZodString>;
                open_in_open_design_url: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                access_policy: z.ZodOptional<z.ZodString>;
            }, "strict", z.ZodTypeAny, {
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
        }, "strict", z.ZodTypeAny, {
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
        process: z.ZodOptional<z.ZodObject<{
            exitCode: z.ZodOptional<z.ZodNumber>;
            signal: z.ZodOptional<z.ZodString>;
            stderr: z.ZodOptional<z.ZodEffects<z.ZodObject<{
                tail: z.ZodOptional<z.ZodObject<{
                    text: z.ZodString;
                    redacted: z.ZodLiteral<true>;
                    truncated: z.ZodBoolean;
                }, "strict", z.ZodTypeAny, {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                }, {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                }>>;
                lineCount: z.ZodNumber;
                truncated: z.ZodBoolean;
                limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strict", z.ZodTypeAny, {
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
            stdout: z.ZodOptional<z.ZodEffects<z.ZodObject<{
                tail: z.ZodOptional<z.ZodObject<{
                    text: z.ZodString;
                    redacted: z.ZodLiteral<true>;
                    truncated: z.ZodBoolean;
                }, "strict", z.ZodTypeAny, {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                }, {
                    text: string;
                    redacted: true;
                    truncated: boolean;
                }>>;
                lineCount: z.ZodNumber;
                truncated: z.ZodBoolean;
                limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strict", z.ZodTypeAny, {
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
            diagnostics: z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodBoolean, z.ZodString]>>, Record<string, string | boolean>, Record<string, string | boolean>>>;
        }, "strict", z.ZodTypeAny, {
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
        deliverableSyntax: z.ZodOptional<z.ZodObject<{
            schemaVersion: z.ZodLiteral<"deliverable-syntax-telemetry-v1">;
            applicable: z.ZodBoolean;
            status: z.ZodEnum<["pass", "repairable", "incomplete", "exhausted", "skipped"]>;
            source: z.ZodEnum<["agent_tool", "run_finalizer"]>;
            checker: z.ZodNullable<z.ZodString>;
            checkedFileCount: z.ZodNumber;
            checkCount: z.ZodNumber;
            checkerDurationMs: z.ZodNullable<z.ZodNumber>;
            repairWindowDurationMs: z.ZodNullable<z.ZodNumber>;
            repairToDeliveryDurationMs: z.ZodNullable<z.ZodNumber>;
            repairToTerminalDurationMs: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            terminalRunStatus: z.ZodOptional<z.ZodEnum<["succeeded", "failed", "canceled"]>>;
            finalization: z.ZodOptional<z.ZodObject<{
                action: z.ZodEnum<["allow", "warn", "fail"]>;
                reason: z.ZodOptional<z.ZodEnum<["attempt_limit_reached", "commit_conflict", "commit_failed", "check_incomplete", "no_progress", "no_safe_fix", "verification_failed", "repair_budget_exceeded", "internal_error"]>>;
                refusal: z.ZodOptional<z.ZodEnum<["ambiguous_diagnostic", "file_unreadable", "path_outside_project", "unsupported_syntax_error", "multiple_files"]>>;
                summaryVersion: z.ZodOptional<z.ZodLiteral<1>>;
                initialStatus: z.ZodOptional<z.ZodEnum<["pass", "repairable", "incomplete", "skipped"]>>;
                repairEngine: z.ZodOptional<z.ZodLiteral<"host-safe-fixer@2">>;
                stagedPatchCount: z.ZodOptional<z.ZodNumber>;
                committedPatchCount: z.ZodOptional<z.ZodNumber>;
                committedRepairRules: z.ZodOptional<z.ZodArray<z.ZodEnum<["insert_missing_closing_delimiter", "close_unterminated_block_comment", "close_unterminated_string", "close_unterminated_template", "normalize_mismatched_string_quote", "normalize_html_attribute_quotes"]>, "many">>;
            }, "strict", z.ZodTypeAny, {
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
            repairExecutor: z.ZodOptional<z.ZodNullable<z.ZodEnum<["agent", "host_safe_fixer"]>>>;
            repairDurationMs: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            appliedRepairRules: z.ZodOptional<z.ZodArray<z.ZodEnum<["insert_missing_closing_delimiter", "close_unterminated_block_comment", "close_unterminated_string", "close_unterminated_template", "normalize_mismatched_string_quote", "normalize_html_attribute_quotes"]>, "many">>;
            safeFixProposalCount: z.ZodOptional<z.ZodNumber>;
            safeFixProposalDurationMs: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            repairableCheckCount: z.ZodNumber;
            initialDiagnosticCount: z.ZodNullable<z.ZodNumber>;
            latestDiagnosticCount: z.ZodNullable<z.ZodNumber>;
            repairTriggered: z.ZodBoolean;
            repairAttempts: z.ZodNumber;
            maxRepairAttempts: z.ZodNullable<z.ZodNumber>;
            repairOutcome: z.ZodEnum<["not_applicable", "not_needed", "repaired", "exhausted", "unresolved"]>;
            recoveredDeliveryCount: z.ZodUnion<[z.ZodLiteral<0>, z.ZodLiteral<1>]>;
            blockedBrokenDeliveryCount: z.ZodUnion<[z.ZodLiteral<0>, z.ZodLiteral<1>]>;
            /** Absent without a complete Host summary and a known physical Run terminal. */
            deliveredWithSyntaxWarningCount: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<0>, z.ZodLiteral<1>]>>;
        }, "strict", z.ZodTypeAny, {
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
    }, "strict", z.ZodTypeAny, {
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
    limitations: z.ZodArray<z.ZodString, "many">;
    attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.ZodTypeAny, "passthrough">>;
export type NormalizedAgentObservationV1 = z.infer<typeof NormalizedAgentObservationV1Schema>;
/**
 * Normalize one adapter-produced fact object without consulting task stores,
 * provider SDKs, the filesystem, or delivery state.
 *
 * Missing Prompt/usage/timing facts become explicit unavailable evidence. No
 * token, Prompt, parent, or cross-clock value is inferred. Passthrough fields
 * remain intact so later runtime adapters can add versioned evidence without
 * breaking V1 readers.
 */
export declare function normalizeAgentObservationV1(input: unknown): NormalizedAgentObservationV1;
//# sourceMappingURL=normalized-agent-observation-v1.d.ts.map