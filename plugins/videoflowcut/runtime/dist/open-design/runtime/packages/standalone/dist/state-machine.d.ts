export declare const STANDALONE_GENERATION_STATE_SCHEMA: 4;
export declare class StandaloneStateConflictError extends Error {
    readonly code: "revision-conflict" | "identity-conflict";
    constructor(code: "revision-conflict" | "identity-conflict", message: string);
}
export type ActivationAuthority = "silent" | "user";
export type ActivationCause = "installed-seed" | "repair" | "update-policy" | "user-interaction";
export type UpdateActivationPolicy = "observe" | "authorize-silent" | "authorize-user" | "revoke-silent";
export type ActivationIntent = Readonly<{
    generationId: string;
    authority: ActivationAuthority;
    cause: ActivationCause;
    authorizedAt: string;
}>;
export type ActivationAttempt = Readonly<{
    attemptId: string;
    generationId: string;
    launchId: string | null;
    launchCount: number;
}>;
export type ActivationLaunchProof = Readonly<{
    attemptId: string;
    generationId: string;
    launchId: string;
}>;
export type GenerationState = Readonly<{
    schemaVersion: typeof STANDALONE_GENERATION_STATE_SCHEMA;
    revision: number;
    prepared: string | null;
    activationIntent: ActivationIntent | null;
    activationAttempt: ActivationAttempt | null;
    active: string | null;
    lastHealthy: string | null;
}>;
export type GenerationStateCommand = Readonly<{
    type: "prepare";
    expectedRevision: number;
    generationId: string;
}> | Readonly<{
    type: "authorize";
    expectedRevision: number;
    generationId: string;
    authority: ActivationAuthority;
    cause: ActivationCause;
    authorizedAt: string;
}> | Readonly<{
    type: "revoke-silent";
    expectedRevision: number;
    generationId: string;
}> | Readonly<{
    type: "activate";
    expectedRevision: number;
    generationId: string;
    attemptId: string;
}> | Readonly<{
    type: "begin-launch";
    expectedRevision: number;
    attemptId: string;
    launchId: string;
}> | Readonly<{
    type: "confirm-launch";
    expectedRevision: number;
    proof: ActivationLaunchProof;
}> | Readonly<{
    type: "rollback";
    expectedRevision: number;
    attemptId?: string;
}>;
export declare const INITIAL_GENERATION_STATE: GenerationState;
export declare function validateGenerationState(value: unknown): GenerationState;
export declare function reduceGenerationState(stateInput: GenerationState, command: GenerationStateCommand): GenerationState;
export declare function activationPolicyCommand(state: GenerationState, generationId: string, policy: UpdateActivationPolicy, now?: string): Extract<GenerationStateCommand, {
    type: "authorize" | "revoke-silent";
}> | null;
//# sourceMappingURL=state-machine.d.ts.map