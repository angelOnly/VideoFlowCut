import type { LifecycleAttachment, LifecycleReadiness, LifecycleScope, LifecycleStatus } from "./launcher.js";
export declare const STANDALONE_SHARED_LIFECYCLE_SCHEMA: 3;
export type SharedLifecycleAttachment = LifecycleAttachment & {
    heartbeatAt: string;
    capabilityHash?: string;
};
export type SharedLifecycleTransitionState = {
    token: string;
    kind: "content-restart" | "shell-install";
    phase: "reserved" | "stopped-sealed";
    fence: number;
    acquiredAt: string;
    expiresAt: string;
};
export type SharedLifecycleState = {
    schemaVersion: typeof STANDALONE_SHARED_LIFECYCLE_SCHEMA;
    scope: LifecycleScope;
    state: "running" | "stopped";
    generationId: string | null;
    bindingDigest: string | null;
    instanceId: string | null;
    attachments: SharedLifecycleAttachment[];
    fence: number;
    leaseExpiresAt: string | null;
    stop: Readonly<{
        requestedAt: string;
        fence: number;
    }> | null;
    transition: SharedLifecycleTransitionState | null;
};
export type SharedLifecycleCommand = Readonly<{
    type: "tick";
    now: string;
    leaseDurationMs: number;
}> | Readonly<{
    type: "start";
    generationId: string;
    bindingDigest: string;
    instanceId: string;
    attachment: LifecycleAttachment;
    heartbeatAt: string;
    leaseExpiresAt: string;
    capability?: Readonly<{
        candidateHash: string;
        presentedHash: string | null;
    }>;
}> | Readonly<{
    type: "heartbeat";
    attachment: LifecycleAttachment;
    heartbeatAt: string;
    leaseExpiresAt: string;
    capabilityHash?: string;
}> | Readonly<{
    type: "release-attachment";
    attachmentId: string;
    capabilityHash?: string;
}> | Readonly<{
    type: "reserve-transition";
    transition: SharedLifecycleTransitionState;
}> | Readonly<{
    type: "renew-transition";
    token: string;
    fence: number;
    expiresAt: string;
}> | Readonly<{
    type: "release-transition";
    token: string;
    fence: number;
}> | Readonly<{
    type: "force-stop";
    token: string;
    fence: number;
    requestedAt: string;
    expiresAt: string;
}> | Readonly<{
    type: "complete-start";
    token: string;
    fence: number;
    generationId: string;
    bindingDigest: string;
    instanceId: string;
    attachment: LifecycleAttachment;
    heartbeatAt: string;
    leaseExpiresAt: string;
    capabilityHash?: string;
}> | Readonly<{
    type: "stop";
    fence: number;
    requestedAt: string;
}>;
export declare function initialSharedLifecycleState(scope: LifecycleScope): SharedLifecycleState;
export declare function validateSharedLifecycleState(value: unknown, expectedScope?: LifecycleScope): SharedLifecycleState;
export declare function projectSharedLifecycleStatus(stateInput: SharedLifecycleState, heartbeatIntervalMs: number): LifecycleStatus;
export declare function sharedLifecycleTransitionBlockers(state: SharedLifecycleState, _kind: "content-restart" | "shell-install", owner: Readonly<{
    attachmentId?: string;
    shellType?: string;
}>): LifecycleStatus["occupants"];
export declare function reduceSharedLifecycleState(stateInput: SharedLifecycleState, command: SharedLifecycleCommand): SharedLifecycleState;
export declare function assertSharedLifecycleReadiness(state: SharedLifecycleState, readiness: LifecycleReadiness): LifecycleReadiness;
export declare const SHARED_LIFECYCLE_ALGEBRA: Readonly<{
    initial: typeof initialSharedLifecycleState;
    validate: typeof validateSharedLifecycleState;
    reduce: typeof reduceSharedLifecycleState;
    project: typeof projectSharedLifecycleStatus;
    blockers: typeof sharedLifecycleTransitionBlockers;
    ready: typeof assertSharedLifecycleReadiness;
}>;
//# sourceMappingURL=shared-lifecycle.d.ts.map