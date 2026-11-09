import type { ProcessSnapshot, StopProcessesOptions, StopProcessesResult } from "@open-design/platform";
import { type SidecarStamp } from "./stamp.js";
type FencedGenerationRef = Readonly<{
    rootPid: number;
    startedAtMs?: number;
    stamp: SidecarStamp;
}>;
type SupervisedTargetRef = Readonly<{
    rootPid: number;
    stamp: SidecarStamp;
    supervisorPid: number;
}>;
type FencedRetirementOptions = Readonly<{
    gracefulStopInitiated: boolean;
    knownSnapshots?: ProcessSnapshot[];
    stopOptions?: StopProcessesOptions;
}>;
/** Retire one already-fenced generation without ever adopting a replacement root. */
export declare function retireFencedSidecarProcessTree(ref: FencedGenerationRef, options: FencedRetirementOptions): Promise<StopProcessesResult>;
/** Retire the target process tree directly owned by a live supervisor. */
export declare function retireSupervisedSidecarTargetTree(ref: SupervisedTargetRef, options: FencedRetirementOptions): Promise<StopProcessesResult>;
export {};
//# sourceMappingURL=process-retirement.d.ts.map