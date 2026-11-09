import type { NativeSessionHandleKind, NativeSessionRecoveryHandle, NativeSessionRecoveryMetadata } from '@open-design/contracts';
import type { ResumeInvalidationReason } from './agent-session-resume.js';
import { type RuntimeAgentDef } from './runtimes/types.js';
export declare function redactNativeSessionHandle(input: {
    agentId: string | null;
    sessionId: string | null | undefined;
    kind?: NativeSessionHandleKind;
}): NativeSessionRecoveryHandle;
export declare function initialNativeSessionRecoveryMetadata(input: {
    agent: Pick<RuntimeAgentDef, 'id' | 'resumesSessionViaCli' | 'resumesSessionViaProfileStdio' | 'capturesSessionIdFromStream' | 'resumesSessionViaAcpLoad'>;
    supportsSessionResume: boolean;
    isResuming: boolean;
    resumeSessionId: string | null | undefined;
    storedSessionId?: string | null | undefined;
    invalidationReason: ResumeInvalidationReason | null | undefined;
    updatedAt?: number;
}): NativeSessionRecoveryMetadata;
export declare function markNativeSessionCaptured(input: {
    previous: NativeSessionRecoveryMetadata | null | undefined;
    agentId: string | null;
    sessionId: string | null | undefined;
    resumed: boolean;
    updatedAt?: number;
}): NativeSessionRecoveryMetadata;
export declare function markNativeSessionAutoReseeded(input: {
    previous: NativeSessionRecoveryMetadata | null | undefined;
    agentId: string | null;
    previousSessionId: string | null | undefined;
    updatedAt?: number;
}): NativeSessionRecoveryMetadata;
