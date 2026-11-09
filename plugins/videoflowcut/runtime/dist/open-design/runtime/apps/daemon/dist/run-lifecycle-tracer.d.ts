import type { RunTelemetryTimestamps } from './run-analytics-observability.js';
import type { TrackingFirstModelEventType } from '@open-design/contracts/analytics';
export type RunLifecycleMark = 'start_requested' | 'chat_run_started' | 'prompt_build_start' | 'prompt_build_end' | 'launch_preflight_start' | 'launch_preflight_end' | 'process_spawn_start' | 'process_spawned' | 'model_call_start' | 'stdin_write_start' | 'stdin_write_end' | 'first_model_event' | 'first_token' | 'first_visible_output' | 'first_artifact_write' | 'finalize_start';
export interface RunWithLifecycleTelemetry {
    analyticsTelemetry?: RunTelemetryTimestamps | null;
}
export interface RunLifecycleStreamEventMarkers {
    firstModelEventType?: TrackingFirstModelEventType;
    firstModelEventAt?: number;
    firstVisibleOutput: boolean;
    firstArtifactWrite: boolean;
}
export declare function runLifecycleMarkersForStreamEvent(event: string, data: unknown): RunLifecycleStreamEventMarkers;
export declare function createRunLifecycleTracer(run: RunWithLifecycleTelemetry): {
    mark(mark: RunLifecycleMark, timestamp?: number): void;
    markFirstModelEvent(type: TrackingFirstModelEventType, producerStartedAt?: number): void;
    resetForAttempt(attemptIndex: number, timestamp?: number): void;
};
