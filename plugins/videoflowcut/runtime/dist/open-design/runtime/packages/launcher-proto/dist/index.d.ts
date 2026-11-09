import { type ReleaseChannel } from "@open-design/release";
export declare const LAUNCHER_SCHEMA_VERSION: 1;
export declare const LAUNCHER_AFTER_QUIT_FLAG: "--od-launcher-after-quit";
export declare const LAUNCHER_AFTER_QUIT_TARGET_PID_ARG: "--od-launcher-target-pid";
export declare const LAUNCHER_AFTER_QUIT_TIMEOUT_MS_ARG: "--od-launcher-timeout-ms";
export declare const LAUNCHER_HANDOFF_RESUME_ARG: "--od-launcher-resume-handoff";
export declare const LAUNCHER_DELEGATED_GENERATION_ARG: "--od-launcher-delegated-generation";
export declare const LAUNCHER_DELEGATED_VERSION_ARG: "--od-launcher-delegated-version";
export declare const LAUNCHER_CHANNELS: Readonly<{
    readonly BETA: "beta";
    readonly PRERELEASE: "prerelease";
    readonly STABLE: "stable";
}>;
export type LauncherChannel = ReleaseChannel;
export type LauncherRootRequest = {
    channel: string;
    namespace: string;
    root: string;
};
export type LauncherVersionRequest = LauncherRootRequest & {
    version: string;
};
export type LauncherPaths = {
    attemptsPath: string;
    channel: LauncherChannel;
    channelRoot: string;
    cleanupPath: string;
    downloadsRoot: string;
    handoffPath: string;
    installPath: string;
    launcherPath: string;
    lockRoot: string;
    logsRoot: string;
    namespace: string;
    namespaceRoot: string;
    releasesRoot: string;
    root: string;
    runtimePath: string;
    stagingRoot: string;
    stateRoot: string;
    updatesRoot: string;
    versionsRoot: string;
};
export type LauncherVersionPaths = LauncherPaths & {
    manifestPath: string;
    payloadRoot: string;
    version: string;
    versionRoot: string;
};
export type LauncherVersionPointer = {
    generation: number;
    version: string;
};
export type LauncherRuntimeDescriptor = {
    active: LauncherVersionPointer | null;
    channel: LauncherChannel;
    lastSuccessful: LauncherVersionPointer | null;
    namespace: string;
    schemaVersion: typeof LAUNCHER_SCHEMA_VERSION;
    updatedAt?: string;
};
export type LauncherAttemptDescriptor = {
    channel: LauncherChannel;
    generation: number;
    namespace: string;
    schemaVersion: typeof LAUNCHER_SCHEMA_VERSION;
    startedAt?: string;
    version: string;
};
export type LauncherDesktopHandoffDescriptor = {
    channel: LauncherChannel;
    createdAt: string;
    handoffId: string;
    namespace: string;
    outer: {
        executablePath: string;
        pid: number;
    };
    payloadExecutablePath: string;
    previous: LauncherVersionPointer;
    schemaVersion: typeof LAUNCHER_SCHEMA_VERSION;
    source: LauncherVersionPointer;
    state: "armed" | "confirmed" | "prepared";
    target?: LauncherVersionPointer;
    updatedAt: string;
};
export type LauncherCleanupState = "cleanup-deferred" | "cleanup-removed" | "deprecated" | "retained";
export type LauncherCleanupReason = "cleanup-failed" | "current-bound-package" | "older-than-bound-package";
export type LauncherCleanupEntry = {
    error?: {
        code: string;
        message: string;
    };
    generation: number;
    reason: LauncherCleanupReason;
    removedAt?: string;
    state: LauncherCleanupState;
    updatedAt: string;
    version: string;
};
export type LauncherCleanupDescriptor = {
    channel: LauncherChannel;
    currentVersion?: string;
    namespace: string;
    updatedAt: string;
    version: typeof LAUNCHER_SCHEMA_VERSION;
    versions: LauncherCleanupEntry[];
};
export type LauncherTargetSelection = {
    pointer: LauncherVersionPointer;
    reason: "active";
    selected: true;
} | {
    pointer: LauncherVersionPointer;
    reason: "active-delegated";
    selected: true;
} | {
    pointer: LauncherVersionPointer;
    reason: "active-resume";
    selected: true;
} | {
    pointer: LauncherVersionPointer;
    reason: "last-successful";
    selected: true;
} | {
    reason: "no-runtime-target";
    selected: false;
};
export type LauncherAfterQuitRequest = {
    targetPid: number;
    timeoutMs: number;
};
export type LauncherHandoffResumeRequest = {
    handoffId: string;
};
export declare class LauncherProtocolError extends Error {
    constructor(message: string);
}
export declare function compareLauncherVersions(a: string, b: string): number;
export declare function normalizeLauncherChannel(value: unknown): LauncherChannel;
export declare function normalizeLauncherVersion(value: unknown): string;
export declare function buildLauncherAfterQuitArgs(request: LauncherAfterQuitRequest): string[];
export declare function parseLauncherAfterQuitArgs(args: readonly string[]): LauncherAfterQuitRequest | null;
/**
 * Delegated-launch marker: a parent that pre-armed attempt.json for the
 * pointer it is about to spawn (packaged outer delegation, updater payload
 * relaunch) passes the pointer along so the spawned payload can tell its own
 * in-progress attempt apart from a previous failed launch. Without the
 * pre-arm, a payload that dies before reaching its own bookkeeping leaves no
 * rollback evidence and the next cold start retries the same broken payload
 * forever.
 */
export declare function buildLauncherDelegatedArgs(pointer: LauncherVersionPointer): string[];
export declare function parseLauncherDelegatedArgs(args: readonly string[]): LauncherVersionPointer | null;
export declare function buildLauncherHandoffResumeArgs(request: LauncherHandoffResumeRequest): string[];
export declare function parseLauncherHandoffResumeArgs(args: readonly string[]): LauncherHandoffResumeRequest | null;
export declare function normalizeLauncherNamespace(value: unknown): string;
export declare function resolveLauncherPaths(request: LauncherRootRequest): LauncherPaths;
export declare function resolveLauncherVersionPaths(request: LauncherVersionRequest): LauncherVersionPaths;
export declare function validateLauncherRuntimeDescriptor(runtime: LauncherRuntimeDescriptor, expected: {
    channel: string;
    namespace: string;
}): LauncherRuntimeDescriptor;
export declare function validateLauncherAttemptDescriptor(attempt: LauncherAttemptDescriptor, expected: {
    channel: string;
    namespace: string;
}): LauncherAttemptDescriptor;
export declare function validateLauncherDesktopHandoffDescriptor(handoff: LauncherDesktopHandoffDescriptor, expected: {
    channel: string;
    namespace: string;
}): LauncherDesktopHandoffDescriptor;
export declare function validateLauncherCleanupDescriptor(cleanup: LauncherCleanupDescriptor, expected: {
    channel: string;
    namespace: string;
}): LauncherCleanupDescriptor;
export declare function selectLauncherRuntimeTarget(input: {
    attempted?: LauncherAttemptDescriptor | null;
    delegated?: LauncherVersionPointer | null;
    resume?: LauncherVersionPointer | null;
    runtime: LauncherRuntimeDescriptor;
}): LauncherTargetSelection;
//# sourceMappingURL=index.d.ts.map