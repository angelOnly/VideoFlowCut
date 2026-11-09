export declare const RUN_TELEMETRY_DELIVERY_STATE_VERSION: 1;
export type RunTelemetryDeliveryTerminalStatus = 'accepted' | 'not_expected';
export interface RunTelemetryDeliveryStateV1 {
    version: typeof RUN_TELEMETRY_DELIVERY_STATE_VERSION;
    idempotencyKey: string;
    status: 'in_flight' | 'failed' | RunTelemetryDeliveryTerminalStatus;
    attemptCount: number;
    crashWindow: boolean;
    startedAt: number;
    dropReason?: string;
    finalizedAt?: number;
}
export interface RunTelemetryDeliveryResult {
    langfuse_expected: boolean;
    langfuse_delivery_status: 'not_expected' | 'queued' | 'accepted' | 'failed';
    langfuse_drop_reason?: string;
    langfuse_attempt_count?: number;
}
export declare function runTelemetryDeliveryIdempotencyKey(runId: string): string;
export declare function beginRunTelemetryDelivery(previous: RunTelemetryDeliveryStateV1 | null | undefined, runId: string, now?: number): RunTelemetryDeliveryStateV1;
export declare function recordRunTelemetryDeliveryAttempt(previous: RunTelemetryDeliveryStateV1 | null | undefined, runId: string, now?: number): RunTelemetryDeliveryStateV1;
export declare function finalizeRunTelemetryDelivery(previous: RunTelemetryDeliveryStateV1 | null | undefined, runId: string, result: RunTelemetryDeliveryResult, now?: number): RunTelemetryDeliveryStateV1;
export declare function isRunTelemetryDeliveryCrashWindow(state: RunTelemetryDeliveryStateV1 | null | undefined): boolean;
