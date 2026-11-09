import type { ChildProcess } from "node:child_process";
import type { SpawnProcessRequest } from "@open-design/platform";
import { type SidecarDescription, type SidecarResources } from "./client.js";
import { type SidecarStopOptions, type SidecarStopRequest, type SidecarStopSetResult, type SidecarStopResult } from "./generation.js";
import { type SidecarStamp } from "./stamp.js";
export type { SidecarStopOptions, SidecarStopRequest, SidecarStopResult, SidecarStopSetResult, } from "./generation.js";
export type SidecarLaunchRequest = Omit<SpawnProcessRequest, "args" | "env"> & {
    args?: readonly string[];
    env?: NodeJS.ProcessEnv;
    resources: Omit<SidecarResources, "pid">;
    stamp: SidecarStamp;
};
export type SidecarRestartOptions = {
    requireConcretePort?: boolean;
    reuseKnownPort?: boolean;
    stop?: SidecarStopOptions;
};
export type SidecarLaunchConvergenceOptions = {
    ownerStamps?: readonly SidecarStamp[];
    retryDelayMs?: number;
    stabilityMs?: number;
    timeoutMs?: number;
};
export type SidecarLaunchConvergenceResult = {
    attempts: number;
    description: SidecarDescription;
    launcherProcess: ChildProcess & {
        pid: number;
    };
};
export declare class SidecarLaunchConvergenceError extends Error {
    readonly launcherPid: number;
    constructor(message: string, launcherPid: number);
}
/** Map sidecar lifecycle failures to the private launcher process protocol. */
export declare function resolveSidecarLauncherExitCode(error: unknown): number;
export type SidecarRestartResult = {
    pid: number;
    reusedPort: boolean;
    stop: SidecarStopResult;
};
/**
 * One concrete process generation created for a five-field sidecar resource.
 * The stamp identifies the resource across processes; this handle retains the
 * root process identity needed to retire this generation even if its runtime
 * later rewrites the argv visible to the operating system.
 */
export type SpawnedSidecar = {
    readonly process: ChildProcess & {
        pid: number;
    };
    readonly stamp: SidecarStamp;
    stop(options?: SidecarStopOptions): Promise<SidecarStopResult>;
};
export declare function registerSidecarProcess(stampInput: SidecarStamp, resources: Omit<SidecarResources, "pid">): SidecarStamp;
export declare function bootstrapSidecarProcess(stampInput: SidecarStamp, resources: Omit<SidecarResources, "pid">, options?: {
    args?: readonly string[];
    command?: string;
    cwd?: string;
    env?: NodeJS.ProcessEnv;
    launch?: typeof launchSidecar;
    waitUntilReady?: (stamp: SidecarStamp, pid: number) => Promise<void>;
}): Promise<boolean>;
export declare function launchSidecar(request: SidecarLaunchRequest): Promise<{
    pid: number;
}>;
/** Spawn an uncommitted client-side launcher; it is stamped but is not a generation root. */
export declare function spawnSidecarLauncher(request: SidecarLaunchRequest): Promise<ChildProcess & {
    pid: number;
}>;
/**
 * Launch a client-side entrypoint until it leaves one stable, ready generation.
 * A clean launcher exit is not success by itself: endpoint ownership and the
 * stamped generation root must agree for a stability window.
 */
export declare function convergeSidecarLaunch(request: SidecarLaunchRequest, options?: SidecarLaunchConvergenceOptions): Promise<SidecarLaunchConvergenceResult>;
export declare function spawnSidecar(request: SidecarLaunchRequest): Promise<SpawnedSidecar>;
export declare function findSidecarProcesses(stamp: SidecarStamp): Promise<import("@open-design/platform").ProcessSnapshot[]>;
export declare function getSidecarStatus<TResult = unknown>(stamp: SidecarStamp, options?: {
    generationPid?: number;
    timeoutMs?: number;
}): Promise<TResult>;
export declare function invokeSidecar<TResult = unknown>(stamp: SidecarStamp, action: string, input: unknown, options?: {
    timeoutMs?: number;
}): Promise<TResult>;
export declare function stopSidecar(stamp: SidecarStamp, options?: SidecarStopOptions): Promise<SidecarStopResult>;
/** Stop a logical resource set against one shared generation boundary. */
export declare function stopSidecars(requests: readonly SidecarStopRequest[]): Promise<SidecarStopSetResult>;
/**
 * Replace one exact five-field sidecar resource while preserving concrete OS
 * resources known by the prior generation. A requested non-zero port remains
 * authoritative; zero means dynamic and inherits a known concrete predecessor
 * port unless the caller explicitly asks for a fresh allocation.
 */
export declare function restartSidecar(request: SidecarLaunchRequest, options?: SidecarRestartOptions): Promise<SidecarRestartResult>;
//# sourceMappingURL=operations.d.ts.map