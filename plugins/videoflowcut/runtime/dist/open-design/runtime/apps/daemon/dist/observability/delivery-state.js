import { createHash } from 'node:crypto';
export const RUN_TELEMETRY_DELIVERY_STATE_VERSION = 1;
export function runTelemetryDeliveryIdempotencyKey(runId) {
    const digest = createHash('sha256')
        .update(`open-design/run-telemetry/v1\n${runId}`, 'utf8')
        .digest('hex');
    return `od-run-telemetry-v1-${digest}`;
}
function previousAttemptCount(state) {
    return Number.isSafeInteger(state?.attemptCount) && state.attemptCount >= 0
        ? state.attemptCount
        : 0;
}
export function beginRunTelemetryDelivery(previous, runId, now = Date.now()) {
    if (typeof previous?.finalizedAt === 'number')
        return previous;
    return {
        version: RUN_TELEMETRY_DELIVERY_STATE_VERSION,
        idempotencyKey: typeof previous?.idempotencyKey === 'string' && previous.idempotencyKey
            ? previous.idempotencyKey
            : runTelemetryDeliveryIdempotencyKey(runId),
        status: 'in_flight',
        attemptCount: previousAttemptCount(previous),
        crashWindow: true,
        startedAt: now,
    };
}
export function recordRunTelemetryDeliveryAttempt(previous, runId, now = Date.now()) {
    const inFlight = beginRunTelemetryDelivery(previous, runId, now);
    if (typeof inFlight.finalizedAt === 'number')
        return inFlight;
    return {
        ...inFlight,
        attemptCount: previousAttemptCount(inFlight) + 1,
    };
}
function resultStatus(result) {
    if (result.langfuse_expected === false)
        return 'not_expected';
    if (result.langfuse_delivery_status === 'accepted')
        return 'accepted';
    return 'failed';
}
function resultAttemptCount(result) {
    if (Number.isSafeInteger(result.langfuse_attempt_count)
        && result.langfuse_attempt_count >= 0) {
        return result.langfuse_attempt_count;
    }
    return result.langfuse_expected === false ? 0 : 1;
}
export function finalizeRunTelemetryDelivery(previous, runId, result, now = Date.now()) {
    if (typeof previous?.finalizedAt === 'number')
        return previous;
    const persistedAttempts = previousAttemptCount(previous);
    const status = resultStatus(result);
    const dropReason = typeof result.langfuse_drop_reason === 'string'
        && result.langfuse_drop_reason
        ? result.langfuse_drop_reason
        : status === 'failed'
            ? 'network_error'
            : undefined;
    const terminal = status === 'accepted' || status === 'not_expected';
    return {
        version: RUN_TELEMETRY_DELIVERY_STATE_VERSION,
        idempotencyKey: typeof previous?.idempotencyKey === 'string' && previous.idempotencyKey
            ? previous.idempotencyKey
            : runTelemetryDeliveryIdempotencyKey(runId),
        status,
        attemptCount: Math.max(persistedAttempts, resultAttemptCount(result)),
        crashWindow: false,
        startedAt: typeof previous?.startedAt === 'number' ? previous.startedAt : now,
        ...(dropReason ? { dropReason } : {}),
        ...(terminal ? { finalizedAt: now } : {}),
    };
}
export function isRunTelemetryDeliveryCrashWindow(state) {
    return state?.version === RUN_TELEMETRY_DELIVERY_STATE_VERSION
        && state.status === 'in_flight'
        && state.crashWindow === true
        && state.finalizedAt === undefined;
}
//# sourceMappingURL=delivery-state.js.map