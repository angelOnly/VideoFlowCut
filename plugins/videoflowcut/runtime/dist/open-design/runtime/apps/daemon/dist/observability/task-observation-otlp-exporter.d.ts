import type { TelemetryPrefs } from '../app-config.js';
import { type LangfuseConfig, type LangfuseDeliveryState, type RunTelemetrySinkConfig } from '../langfuse-trace.js';
import { type TaskObservationExportContextV1, type StrategyTaskObservationAggregateV1 } from './task-observation-aggregation.js';
export declare const LANGFUSE_OTLP_TRACES_PATH = "/api/public/otel/v1/traces";
export declare const LANGFUSE_OTLP_INGESTION_VERSION = "4";
export type TaskObservationExporterMode = 'legacy' | 'dual' | 'otlp';
export interface TaskObservationExporterConfig extends LangfuseConfig {
    mode: TaskObservationExporterMode;
}
export interface TaskObservationExportOptions {
    prefs: TelemetryPrefs;
    config: TaskObservationExporterConfig | null;
    fetchImpl?: typeof fetch;
    deliveryIdempotencyKey?: string;
    onDeliveryAttempt?: (trace?: {
        traceId: string;
        protocol: 'legacy-v1' | 'otlp-v4';
    }) => void;
    context?: TaskObservationExportContextV1;
    /** Test-only retry delay override. Production callers should omit it. */
    retryDelayMs?: number;
}
export interface TaskObservationDeliveryState extends LangfuseDeliveryState {
    exporter_mode: TaskObservationExporterMode;
    primary_protocol: 'legacy-v1' | 'otlp-v4' | 'none';
    /** Dual is a local mapping shadow, never a second production write. */
    shadow_protocol?: 'otlp-v4';
    shadow_status?: 'matched' | 'mismatch';
}
export interface EffectiveTaskObservationExporterDiagnostic {
    mode: TaskObservationExporterMode;
    primaryProtocol: 'legacy-v1' | 'otlp-v4';
    shadowProtocol: 'otlp-v4' | null;
    shadowNetworkEnabled: false;
}
interface OtlpAnyValue {
    stringValue?: string;
    boolValue?: boolean;
    intValue?: string;
    doubleValue?: number;
    arrayValue?: {
        values: OtlpAnyValue[];
    };
}
interface OtlpAttribute {
    key: string;
    value: OtlpAnyValue;
}
export interface OtlpSpanV1 {
    traceId: string;
    spanId: string;
    parentSpanId?: string;
    name: string;
    kind: number;
    startTimeUnixNano: string;
    endTimeUnixNano: string;
    attributes: OtlpAttribute[];
    status: {
        code: number;
        message?: string;
    };
}
export interface OtlpTraceExportRequestV1 {
    resourceSpans: Array<{
        resource: {
            attributes: OtlpAttribute[];
        };
        scopeSpans: Array<{
            scope: {
                name: string;
                version: string;
            };
            spans: OtlpSpanV1[];
        }>;
    }>;
}
export declare function readTaskObservationExporterConfig(sink: RunTelemetrySinkConfig | null, env?: NodeJS.ProcessEnv): TaskObservationExporterConfig | null;
export declare function describeTaskObservationExporter(mode: TaskObservationExporterMode): EffectiveTaskObservationExporterDiagnostic;
export declare function otlpTaskTraceId(taskExecutionId: string): string;
export declare function otlpTaskSpanId(observationId: string): string;
/**
 * Map the protocol-neutral task aggregate to one complete immutable OTLP span
 * per operation. No transport, consent, or delivery state is consulted here.
 */
export declare function buildOtlpTaskObservationPayload(aggregate: StrategyTaskObservationAggregateV1, context?: TaskObservationExportContextV1): OtlpTraceExportRequestV1;
/**
 * Dual mode is an offline shadow only. This guard proves the two mappings use
 * the same trace semantics, observation identities/types, parent graph,
 * status, complete usage evidence, and limits;
 * it intentionally makes no second network request to the same project.
 */
export declare function legacyAndOtlpTaskMappingsMatch(aggregate: StrategyTaskObservationAggregateV1, legacyBatch: readonly unknown[], otlpPayload: OtlpTraceExportRequestV1, context?: TaskObservationExportContextV1): boolean;
/**
 * Deliver one final task aggregate. Consent is checked before either payload is
 * built. `dual` deliberately sends legacy only and compares OTLP locally, so a
 * production project never receives duplicate logical observations.
 */
export declare function exportTaskObservationAggregate(aggregate: StrategyTaskObservationAggregateV1, opts: TaskObservationExportOptions): Promise<TaskObservationDeliveryState>;
export {};
