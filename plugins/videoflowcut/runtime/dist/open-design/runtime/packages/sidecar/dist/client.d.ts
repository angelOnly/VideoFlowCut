import { type SidecarStamp } from "./stamp.js";
export declare const SIDECAR_SUPERVISOR_TARGET_ENV = "OD_SIDECAR_SUPERVISOR_TARGET";
export type SidecarResources = Readonly<{
    dataRoot: string | null;
    ownerPid: number | null;
    pid: number;
    port: number;
    runtimeRoot: string;
}>;
export declare function prepareSidecarLaunchEnvironment(env: NodeJS.ProcessEnv, resources: Omit<SidecarResources, "pid">): NodeJS.ProcessEnv;
export type SidecarHandler = (input: unknown) => unknown | Promise<unknown>;
export type SidecarHandlers = Readonly<Record<string, SidecarHandler>>;
export type SidecarLifecycle<TRuntime> = {
    start(resources: SidecarResources): Promise<TRuntime>;
    status(runtime: TRuntime): unknown | Promise<unknown>;
    stop(runtime: TRuntime): Promise<void>;
};
export type SidecarClientOptions<TRuntime> = {
    handlers?: SidecarHandlers;
    lifecycle: SidecarLifecycle<TRuntime>;
};
export type SidecarGenerationHandoffRequest = {
    args?: readonly string[];
    command: string;
    cwd?: string;
    env?: NodeJS.ProcessEnv;
};
/** Queue the next child under the current supervisor without changing generation identity. */
export declare function handoffCurrentSidecarGeneration(request: SidecarGenerationHandoffRequest, options?: {
    timeoutMs?: number;
}): Promise<void>;
export declare const sidecarSupervisorProtocol: Readonly<{
    handoff: "sidecar:supervisor-handoff";
    handoffAccepted: "sidecar:supervisor-handoff-accepted";
}>;
export type SidecarConnection = {
    invoke<TResult = unknown>(app: string, action: string, input: unknown, options?: {
        timeoutMs?: number;
    }): Promise<TResult>;
    requestStop(app: string, options?: {
        timeoutMs?: number;
    }): Promise<{
        accepted?: unknown;
    }>;
    status<TResult = unknown>(app: string, options?: {
        timeoutMs?: number;
    }): Promise<TResult>;
};
export type SidecarDescription = Readonly<{
    ready: boolean;
    resources: SidecarResources;
    stamp: SidecarStamp;
}>;
export declare function normalizeSidecarLaunchResources(input: unknown): Omit<SidecarResources, "pid">;
export declare function readSidecarLaunchResources(env?: NodeJS.ProcessEnv): Omit<SidecarResources, "pid">;
export declare class SidecarClient<TRuntime> {
    #private;
    readonly resources: SidecarResources;
    readonly stamp: SidecarStamp;
    constructor(options: SidecarClientOptions<TRuntime>);
    start(): Promise<void>;
    stop(): Promise<void>;
    waitUntilStopped(): Promise<void>;
    invoke<TResult = unknown>(app: string, action: string, input: unknown, options?: {
        timeoutMs?: number;
    }): Promise<TResult>;
    status<TResult = unknown>(app: string, options?: {
        timeoutMs?: number;
    }): Promise<TResult>;
    requestStop(app: string, options?: {
        timeoutMs?: number;
    }): Promise<{
        accepted?: unknown;
    }>;
}
export declare const SidecarFactory: Readonly<{
    connectInherited(env?: NodeJS.ProcessEnv): SidecarConnection | null;
    create<TRuntime>(options: SidecarClientOptions<TRuntime>): SidecarClient<TRuntime>;
    inheritedEnvironment(env?: NodeJS.ProcessEnv): Record<string, string>;
    /**
     * Creates the environment for an entrypoint that must bootstrap a new
     * generation instead of remaining attached to the caller's supervisor.
     */
    newGenerationEnvironment(env?: NodeJS.ProcessEnv): NodeJS.ProcessEnv;
}>;
export declare const sidecarProtocol: Readonly<{
    describe: "sidecar:describe";
    resourcesEnv: "OD_SIDECAR_RESOURCES";
    status: "sidecar:status";
    stop: "sidecar:stop";
}>;
//# sourceMappingURL=client.d.ts.map