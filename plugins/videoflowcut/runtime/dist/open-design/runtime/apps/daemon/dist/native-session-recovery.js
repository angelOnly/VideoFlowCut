import { createHash } from 'node:crypto';
import { runtimeResumesSessionById, } from './runtimes/types.js';
function sha256(value) {
    return createHash('sha256').update(value, 'utf8').digest('hex');
}
function handleKindForAgent(agentId) {
    if (agentId === 'codex')
        return 'cli-thread-id';
    if (agentId === 'amr')
        return 'acp-session-handle';
    if (agentId === 'pi')
        return 'session-file-path';
    if (agentId)
        return 'opaque-id';
    return 'unknown';
}
function handleKindForRuntime(def) {
    if (def.resumesSessionViaAcpLoad === true)
        return 'acp-session-handle';
    if (def.resumesSessionViaProfileStdio === true)
        return 'profile-session-id';
    if (def.id === 'pi')
        return 'session-file-path';
    if (def.capturesSessionIdFromStream === true)
        return 'cli-thread-id';
    return handleKindForAgent(def.id);
}
export function redactNativeSessionHandle(input) {
    const value = typeof input.sessionId === 'string' && input.sessionId.length > 0
        ? input.sessionId
        : null;
    return {
        present: value !== null,
        kind: input.kind ?? handleKindForAgent(input.agentId),
        display: null,
        sha256: value ? sha256(value) : null,
        redacted: value !== null,
    };
}
function acquisitionForRuntime(def, supported) {
    if (!supported)
        return 'none';
    if (def.resumesSessionViaAcpLoad === true)
        return 'acp-session-load';
    if (def.resumesSessionViaProfileStdio === true)
        return 'profile-session-frame';
    if (def.id === 'pi')
        return 'session-file-discovered';
    if (def.capturesSessionIdFromStream === true)
        return 'stream-captured';
    if (def.resumesSessionViaCli === true)
        return 'daemon-specified';
    return 'unknown';
}
function continuationForRuntime(def, supported) {
    if (!supported)
        return 'none';
    if (def.resumesSessionViaAcpLoad === true)
        return 'acp-session-load';
    if (def.resumesSessionViaProfileStdio === true)
        return 'profile-stdio-resume';
    if (def.id === 'pi')
        return 'session-file-resume';
    if (runtimeResumesSessionById(def))
        return 'native-resume-by-id';
    return 'unknown';
}
function guardReason(reason) {
    return reason ?? null;
}
export function initialNativeSessionRecoveryMetadata(input) {
    const now = input.updatedAt ?? Date.now();
    const handleKind = handleKindForRuntime(input.agent);
    if (!input.supportsSessionResume) {
        return {
            agentId: input.agent.id,
            state: 'not_applicable',
            acquisition: 'none',
            continuation: 'none',
            handle: redactNativeSessionHandle({ agentId: input.agent.id, sessionId: null, kind: handleKind }),
            guardReason: 'unsupported',
            fallbackReason: null,
            updatedAt: now,
        };
    }
    const diagnosticSessionId = input.invalidationReason
        ? (input.storedSessionId ?? input.resumeSessionId ?? null)
        : (input.resumeSessionId ?? null);
    const handle = redactNativeSessionHandle({
        agentId: input.agent.id,
        sessionId: diagnosticSessionId,
        kind: handleKind,
    });
    const state = input.isResuming && handle.present
        ? 'resume_attempted'
        : input.invalidationReason
            ? 'resume_skipped'
            : 'no_recoverable_session';
    return {
        agentId: input.agent.id,
        state,
        acquisition: acquisitionForRuntime(input.agent, input.supportsSessionResume),
        continuation: continuationForRuntime(input.agent, input.supportsSessionResume),
        handle,
        guardReason: state === 'resume_skipped' ? guardReason(input.invalidationReason) : null,
        fallbackReason: null,
        updatedAt: now,
    };
}
export function markNativeSessionCaptured(input) {
    const previous = input.previous ?? initialNativeSessionRecoveryMetadata({
        agent: { id: input.agentId ?? 'unknown' },
        supportsSessionResume: true,
        isResuming: false,
        resumeSessionId: null,
        invalidationReason: null,
        ...(input.updatedAt !== undefined ? { updatedAt: input.updatedAt } : {}),
    });
    const handle = redactNativeSessionHandle({
        agentId: input.agentId,
        sessionId: input.sessionId,
        kind: previous.handle.kind,
    });
    return {
        ...previous,
        state: handle.present
            ? (input.resumed ? 'resumed' : 'captured_not_resumed')
            : 'no_recoverable_session',
        handle,
        guardReason: null,
        fallbackReason: null,
        updatedAt: input.updatedAt ?? Date.now(),
    };
}
export function markNativeSessionAutoReseeded(input) {
    const previous = input.previous ?? initialNativeSessionRecoveryMetadata({
        agent: { id: input.agentId ?? 'unknown' },
        supportsSessionResume: true,
        isResuming: false,
        resumeSessionId: null,
        invalidationReason: null,
        ...(input.updatedAt !== undefined ? { updatedAt: input.updatedAt } : {}),
    });
    return {
        ...previous,
        state: 'auto_reseeded',
        handle: redactNativeSessionHandle({
            agentId: input.agentId,
            sessionId: input.previousSessionId,
            kind: previous.handle.kind,
        }),
        fallbackReason: 'resume_failed',
        updatedAt: input.updatedAt ?? Date.now(),
    };
}
//# sourceMappingURL=native-session-recovery.js.map