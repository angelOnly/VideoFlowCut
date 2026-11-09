import { type ProcessSnapshot, type StampedProcessInvocationSnapshot } from "@open-design/platform";
import { type SidecarStamp } from "./stamp.js";
/** Capture stamped generation roots while excluding uncommitted launcher contenders. */
export declare function captureSidecarGenerationSnapshot(stamp: SidecarStamp): Promise<StampedProcessInvocationSnapshot>;
/** Capture several sidecar resources against one OS process-table boundary. */
export declare function captureSidecarGenerationSetSnapshot(stamps: readonly SidecarStamp[]): Promise<Array<StampedProcessInvocationSnapshot & {
    stamp: SidecarStamp;
}>>;
/**
 * Collect one sidecar generation without crossing into a descendant resource.
 *
 * The generation owns ordinary descendants, including targets whose visible
 * argv is later rewritten. A descendant carrying a different complete
 * five-field stamp is another sidecar resource root and owns its own subtree.
 */
export declare function collectSidecarGenerationPids(processes: ProcessSnapshot[], rootPids: Array<number | null | undefined>, stampInput: SidecarStamp): number[];
//# sourceMappingURL=process-tree.d.ts.map