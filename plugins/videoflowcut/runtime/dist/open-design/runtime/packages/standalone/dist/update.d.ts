import { type SignedStandaloneChannelHead, type StandaloneShellIdentity, type StandaloneShellRequirement, type StandaloneTrustedKeyRing } from "./protocol.js";
import { type GenerationRecord, type StandalonePrepareOptions, StandaloneStore } from "./store.js";
import { FossilBootloader, type LifecycleStatus, type VersionedLauncher } from "./launcher.js";
import type { StandaloneFeedbackHandler } from "./feedback.js";
import type { StandaloneLifecycleOccupant } from "./shell-update.js";
import { type UpdateActivationPolicy } from "./state-machine.js";
export type StandaloneUpdateSource = {
    readChannelHead(channel: string): Promise<SignedStandaloneChannelHead>;
    readDocument(url: string): Promise<Uint8Array>;
    prepare?: Omit<StandalonePrepareOptions, "feedback">;
};
export type UpdatePreparation = {
    status: "prepared";
    generation: GenerationRecord;
    authorized: boolean;
} | {
    status: "current";
    generationId: string;
} | {
    status: "shell-reinstall-required";
    releaseVersion: string;
    minimumVersion: string | null;
    requirement: StandaloneShellRequirement | null;
};
export type UpdateApplication = Readonly<{
    status: "applied";
    lifecycle: LifecycleStatus;
}> | Readonly<{
    status: "blocked";
    reason: "occupied" | "transition-active" | "unavailable";
    occupants: readonly StandaloneLifecycleOccupant[];
}>;
export declare class StandaloneUpdater {
    private readonly channel;
    private readonly contentLane;
    private readonly shell;
    private readonly trustedKeys;
    private readonly store;
    private readonly source;
    private readonly feedback?;
    constructor(channel: string, contentLane: string, shell: StandaloneShellIdentity, trustedKeys: StandaloneTrustedKeyRing, store: StandaloneStore, source: StandaloneUpdateSource, feedback?: StandaloneFeedbackHandler | undefined);
    prepareLatest(activationPolicy: UpdateActivationPolicy): Promise<UpdatePreparation>;
    activateOnColdStart(bootloader: FossilBootloader): Promise<LifecycleStatus>;
    applyNow(launcher: VersionedLauncher, options?: Readonly<{
        force?: boolean;
    }>): Promise<UpdateApplication>;
}
//# sourceMappingURL=update.d.ts.map