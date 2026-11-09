import { type StandaloneScope, type StandaloneShellIdentity } from "./protocol.js";
import type { GenerationRecord, StandaloneStore } from "./store.js";
import { type StandaloneFeedbackHandler } from "./feedback.js";
import type { StandaloneLifecycleTransition, StandaloneLifecycleTransitionPort, StandaloneLifecycleTransitionResult } from "./shell-update.js";
import { type StandaloneGenerationBinding } from "./bootloader-handoff.js";
export type LifecycleAttachment = {
    id: string;
    shell: StandaloneShellIdentity;
};
export type LifecycleScope = StandaloneScope;
export type LifecycleLease = {
    heartbeatIntervalMs: number;
    expiresAt: string;
};
export type LifecycleStatus = {
    scope: LifecycleScope;
    state: "running" | "stopped";
    generationId: string | null;
    bindingDigest: string | null;
    instanceId: string | null;
    references: number;
    occupants: readonly Readonly<{
        attachmentId: string;
        generationId: string;
        shell: StandaloneShellIdentity;
    }>[];
    fence: number;
    lease: LifecycleLease | null;
};
export type LifecycleReadiness = Readonly<{
    generationId: string;
    bindingDigest: string;
    instanceId: string;
    attachmentId: string;
}>;
export interface LifecyclePort {
    start(scope: LifecycleScope, generation: GenerationRecord, attachment: LifecycleAttachment, binding: StandaloneGenerationBinding): Promise<LifecycleStatus>;
    awaitReady(scope: LifecycleScope, readiness: LifecycleReadiness): Promise<LifecycleReadiness>;
    heartbeat(scope: LifecycleScope, attachment: LifecycleAttachment): Promise<LifecycleStatus>;
    release(scope: LifecycleScope, attachmentId: string): Promise<LifecycleStatus>;
    status(scope: LifecycleScope): Promise<LifecycleStatus>;
    stop(scope: LifecycleScope, fence: number): Promise<LifecycleStatus>;
    beginTransition?: StandaloneLifecycleTransitionPort["beginTransition"];
}
export type StandaloneGenerationStart = Readonly<{
    binding: StandaloneGenerationBinding;
    generation: GenerationRecord;
    attachment: LifecycleAttachment;
    start(): Promise<LifecycleStatus>;
}>;
/**
 * Mechanical generation boundary used by a fossil Shell. The continuation is
 * the only authority allowed to mutate the lifecycle, so normal starts and
 * transition-owned starts cannot drift into different activation paths.
 */
export interface StandaloneGenerationHandoffPort {
    start(input: StandaloneGenerationStart): Promise<LifecycleStatus>;
}
export declare class VersionedLauncher {
    private readonly store;
    private readonly lifecycle;
    private readonly handoff?;
    private readonly attachment;
    private readonly scope;
    constructor(store: StandaloneStore, lifecycle: LifecyclePort, shell: StandaloneShellIdentity, attachmentId: string, feedback?: StandaloneFeedbackHandler, handoff?: StandaloneGenerationHandoffPort | undefined);
    private readonly feedback;
    start(): Promise<LifecycleStatus>;
    startDuringTransition(transition: StandaloneLifecycleTransition): Promise<LifecycleStatus>;
    private startWith;
    heartbeat(): Promise<LifecycleStatus>;
    release(): Promise<LifecycleStatus>;
    status(): Promise<LifecycleStatus>;
    beginTransition(kind: "content-restart" | "shell-install", options?: Readonly<{
        force?: boolean;
    }>): Promise<StandaloneLifecycleTransitionResult>;
    stop(): Promise<LifecycleStatus>;
}
export declare class FossilBootloader {
    private readonly store;
    private readonly shell;
    private readonly loadVersionedLauncher;
    constructor(store: StandaloneStore, shell: StandaloneShellIdentity, loadVersionedLauncher: (binding: StandaloneGenerationBinding) => Promise<VersionedLauncher>);
    start(): Promise<LifecycleStatus>;
}
//# sourceMappingURL=launcher.d.ts.map