import { type StandaloneShellIdentity, type StandaloneShellRequirement } from "./protocol.js";
import type { GenerationRecord } from "./store.js";
import type { LifecycleAttachment, LifecycleStatus } from "./launcher.js";
import type { StandaloneGenerationBinding } from "./bootloader-handoff.js";
export declare const STANDALONE_SHELL_UPDATER_SCHEMA: 3;
export type StandaloneLifecycleOccupant = Readonly<{
    attachmentId: string;
    generationId: string;
    shell: StandaloneShellIdentity;
}>;
export type StandaloneLifecycleTransition = Readonly<{
    attemptId: string;
    fence: number;
    expiresAt: string;
    heartbeatIntervalMs: number;
    occupants: readonly StandaloneLifecycleOccupant[];
    phase: "reserved" | "stopped-sealed";
    renew(): Promise<void>;
    release(): Promise<void>;
    forceStop(): Promise<void>;
    completeBoundStart(generation: GenerationRecord, attachment: LifecycleAttachment, binding: StandaloneGenerationBinding): Promise<LifecycleStatus>;
}>;
export type StandaloneLifecycleTransitionResult = Readonly<{
    state: "acquired";
    transition: StandaloneLifecycleTransition;
}> | Readonly<{
    state: "blocked";
    reason: "occupied" | "transition-active" | "unavailable";
    occupants: readonly StandaloneLifecycleOccupant[];
}>;
export interface StandaloneLifecycleTransitionPort {
    occupants(scope: Readonly<{
        channel: string;
        namespace: string;
    }>): Promise<readonly StandaloneLifecycleOccupant[]>;
    beginTransition(scope: Readonly<{
        channel: string;
        namespace: string;
    }>, kind: "content-restart" | "shell-install", options?: Readonly<{
        attemptId?: string;
        ownerAttachmentId?: string;
        ownerShellType?: string;
        force?: boolean;
    }>): Promise<StandaloneLifecycleTransitionResult>;
}
export type StandaloneShellUpdaterState = "idle" | "checking" | "available" | "downloading" | "ready" | "applying" | "handed-off" | "installed" | "failed";
export type StandaloneShellUpdaterAction = Readonly<{
    id: "check" | "download" | "install" | "later" | "force-stop-and-install" | "abandon";
    emphasis: "primary" | "secondary" | "danger";
}>;
export type StandaloneShellUpdaterSnapshot = Readonly<{
    schemaVersion: typeof STANDALONE_SHELL_UPDATER_SCHEMA;
    revision: number;
    shellType: string;
    state: StandaloneShellUpdaterState;
    candidateId?: string;
    installAttemptId?: string;
    progress?: Readonly<{
        completed: number;
        total: number;
    }>;
    actions: readonly StandaloneShellUpdaterAction[];
    blockedBy: readonly StandaloneLifecycleOccupant[];
    handoff?: Readonly<{
        interaction: "restart-and-install";
        releaseVersion: string;
        target: string;
        artifact: Readonly<{
            path: string;
            sha256: string;
            size: number;
            mediaType: string;
        }>;
        shell: Readonly<{
            type: string;
            version: string;
            buildHash: string;
        }>;
    }>;
    error?: Readonly<{
        code: string;
        message: string;
    }>;
}>;
export type StandaloneShellUpdaterCommand = Readonly<{
    expectedRevision: number;
    state: StandaloneShellUpdaterState;
    candidateId?: string;
    installAttemptId?: string;
    progress?: Readonly<{
        completed: number;
        total: number;
    }>;
    blockedBy?: readonly StandaloneLifecycleOccupant[];
    handoff?: StandaloneShellUpdaterSnapshot["handoff"];
    error?: Readonly<{
        code: string;
        message: string;
    }>;
}>;
export declare function initialShellUpdaterSnapshot(shellType: string): StandaloneShellUpdaterSnapshot;
export declare function validateShellUpdaterSnapshot(value: unknown): StandaloneShellUpdaterSnapshot;
export declare function reduceShellUpdaterSnapshot(snapshotInput: StandaloneShellUpdaterSnapshot, command: StandaloneShellUpdaterCommand): StandaloneShellUpdaterSnapshot;
export declare const SHELL_UPDATE_ALGEBRA: Readonly<{
    initial: typeof initialShellUpdaterSnapshot;
    validate: typeof validateShellUpdaterSnapshot;
    reduce: typeof reduceShellUpdaterSnapshot;
}>;
export type StandaloneShellUpdaterActionResult = Readonly<{
    outcome: "accepted" | "blocked" | "unsupported" | "failed";
    snapshot: StandaloneShellUpdaterSnapshot;
}>;
/** Shell-owned implementation exposed to Closure through the Standalone handoff. */
export interface StandaloneShellUpdaterPort {
    readonly shellType: string;
    readSnapshot(): Promise<StandaloneShellUpdaterSnapshot>;
    waitForChange(afterRevision: number, timeoutMs: number): Promise<StandaloneShellUpdaterSnapshot>;
    invoke(action: StandaloneShellUpdaterAction["id"]): Promise<StandaloneShellUpdaterActionResult>;
    confirmInstalled(proof: StandaloneShellIdentity): Promise<StandaloneShellUpdaterActionResult>;
}
export type StandaloneShellCompatibilityResult = Readonly<{
    state: "compatible";
}> | Readonly<{
    state: "update-required";
    shellType: string;
    currentVersion: string;
    minimumVersion: string | null;
    updater: StandaloneShellUpdaterPort | null;
}>;
export declare function resolveStandaloneShellCompatibility(input: Readonly<{
    requirement: StandaloneShellRequirement | null;
    shell: StandaloneShellIdentity;
    updater?: StandaloneShellUpdaterPort | null;
}>): StandaloneShellCompatibilityResult;
//# sourceMappingURL=shell-update.d.ts.map