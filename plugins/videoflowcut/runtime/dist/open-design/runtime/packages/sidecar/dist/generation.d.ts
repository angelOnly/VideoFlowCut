import type { ProcessSnapshot, StopProcessesOptions, StopProcessesResult } from "@open-design/platform";
import { type SidecarDescription } from "./client.js";
import { type SidecarStamp } from "./stamp.js";
export type SidecarStopResult = StopProcessesResult & {
    staleEndpointRemoved?: boolean;
    gracefulAccepted: boolean;
};
export type SidecarStopOptions = StopProcessesOptions & {
    /** Bound the graceful lifecycle request before process retirement takes over. */
    gracefulRequestTimeoutMs?: number;
};
export type SidecarStopRequest = Readonly<{
    options?: SidecarStopOptions;
    stamp: SidecarStamp;
}>;
export type SidecarStopSetResult = SidecarStopResult & {
    results: Array<Readonly<{
        result: SidecarStopResult;
        stamp: SidecarStamp;
    }>>;
};
/** Authority to mutate one concrete supervisor generation of a stamped resource. */
export type SidecarGenerationRef = Readonly<{
    rootPid: number;
    startedAtMs?: number;
    stamp: SidecarStamp;
}>;
type PrivateEndpointIdentity = Readonly<{
    dev: number;
    ino: number;
}>;
/** One invocation-fenced observation used by discovery-based mutation paths. */
export type ObservedSidecarGeneration = Readonly<{
    description: SidecarDescription | null;
    endpoint: PrivateEndpointIdentity | null;
    processes: ProcessSnapshot[];
    ref: SidecarGenerationRef | null;
    stamp: SidecarStamp;
}>;
export declare function sidecarGenerationRef(stampInput: SidecarStamp, rootPid: number, startedAtMs?: number): SidecarGenerationRef;
export declare function describeSidecarGeneration(stampInput: SidecarStamp, timeoutMs?: number): Promise<SidecarDescription | null>;
export declare function observeSidecarGeneration(stampInput: SidecarStamp, descriptionTimeoutMs?: number): Promise<ObservedSidecarGeneration>;
/** Observe several resources at one process-table boundary. */
export declare function observeSidecarGenerations(stampInputs: readonly SidecarStamp[], descriptionTimeoutMs?: number | readonly number[]): Promise<ObservedSidecarGeneration[]>;
export declare function retireObservedSidecarGeneration(observation: ObservedSidecarGeneration, options?: SidecarStopOptions): Promise<SidecarStopResult>;
/** Retire an invocation-fenced resource set and verify replacements once. */
export declare function retireObservedSidecarGenerations(requests: readonly Readonly<{
    observation: ObservedSidecarGeneration;
    options?: SidecarStopOptions;
}>[]): Promise<SidecarStopResult[]>;
/** Retire a generation already owned by the caller without adopting a replacement. */
export declare function retireKnownSidecarGeneration(ref: SidecarGenerationRef, options?: SidecarStopOptions): Promise<SidecarStopResult>;
/** Retire exactly the generation named by the stable supervisor root. */
export declare function retireSidecarGeneration(ref: SidecarGenerationRef, options?: SidecarStopOptions, knownSnapshots?: ProcessSnapshot[]): Promise<SidecarStopResult>;
export {};
//# sourceMappingURL=generation.d.ts.map