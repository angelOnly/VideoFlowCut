import type { RunUsageAnalytics } from '../run-analytics-observability.js';
/** Legacy-compatible summaries of physical Runs without duplicating Run traces. */
export interface TaskRunTraceProjection {
    runId: string;
    input?: unknown;
    output?: unknown;
    metadata: Record<string, unknown>;
}
export declare function projectTaskTrace(runs: TaskRunTraceProjection[], durationMs: number): {
    input: unknown;
    output: unknown;
    metadata: Record<string, unknown>;
} | undefined;
/** Codex stream totals span a resumed session; stage counters must use the current Turn. */
export declare function taskRunUsage(agentId: string | null | undefined, events: Array<{
    event: string;
    data: unknown;
}>, provider: RunUsageAnalytics): RunUsageAnalytics;
