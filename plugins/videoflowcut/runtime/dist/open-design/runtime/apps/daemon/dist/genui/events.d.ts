import type { GenUISurfaceEvent, PluginPipelineStageEvent } from '@open-design/contracts';
import type { SurfaceRow } from './store.js';
export type GenUIEventSink = (event: GenUISurfaceEvent | PluginPipelineStageEvent) => void;
export declare function buildSurfaceRequestEvent(args: {
    surfaceRow: SurfaceRow;
    runId: string;
    payload?: unknown;
}): GenUISurfaceEvent;
export declare function buildSurfaceResponseEvent(args: {
    surfaceRow: SurfaceRow;
    runId: string;
    respondedBy: SurfaceRow['respondedBy'];
}): GenUISurfaceEvent;
export declare function buildSurfaceTimeoutEvent(args: {
    surfaceRow: SurfaceRow;
    runId: string;
    resolution: 'abort' | 'default' | 'skip';
}): GenUISurfaceEvent;
export declare function buildStateSyncedEvent(args: {
    surfaceRow: SurfaceRow;
    runId: string;
}): GenUISurfaceEvent;
export declare function buildPipelineStageStartedEvent(args: {
    runId: string;
    snapshotId: string;
    stageId: string;
    iteration: number;
}): PluginPipelineStageEvent;
export declare function buildPipelineStageCompletedEvent(args: {
    runId: string;
    snapshotId: string;
    stageId: string;
    iteration: number;
    converged?: boolean | undefined;
    diffSummary?: string | undefined;
}): PluginPipelineStageEvent;
