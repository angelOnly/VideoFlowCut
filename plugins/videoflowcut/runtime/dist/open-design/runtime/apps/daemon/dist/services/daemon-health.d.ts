import type { SqlitePageStats } from '../storage/db-inspect.js';
declare const SCHEMA_VERSION = 1;
export type ObservedReadOp = 'project_run_statuses' | 'conversation_messages' | 'library_produced_map';
export type DaemonHealthEventName = 'daemon_health_summary' | 'daemon_unclean_exit' | 'daemon_memory_pressure' | 'daemon_storage_snapshot' | 'client_process_memory_sample';
export type DaemonHealthEventSink = (event: {
    eventName: DaemonHealthEventName;
    properties: Record<string, unknown>;
    insertId: string;
}) => Promise<void>;
export type HeapSample = {
    at: number;
    heapUsed: number;
    heapLimit: number;
    totalAvailable: number;
    largeObject: number;
    oldSpace: number;
    external: number;
    arrayBuffers: number;
    malloced: number;
    rss: number;
};
type ReadRecord = {
    op: ObservedReadOp;
    rootOp: ObservedReadOp;
    durationMs: number;
    heapDelta: number;
    rows: number | null;
};
type InflightRead = {
    op: ObservedReadOp;
    rootOp: ObservedReadOp;
    startedAt: number;
    heapUsed: number;
};
type Peaks = {
    heapUsedRatio: number;
    heapUsed: number;
    largeObject: number;
    rss: number;
    external: number;
    eventLoopDelayMaxMs: number;
    eventLoopDelayP99Ms: number;
    majorGcCount: number;
    gcRetainedRatioMax: number;
    sampleCount: number;
};
type PendingReport = {
    eventName: DaemonHealthEventName;
    properties: Record<string, unknown>;
    insertId: string;
};
type Checkpoint = {
    schemaVersion: typeof SCHEMA_VERSION;
    bootId: string;
    pid: number;
    startedAt: number;
    updatedAt: number;
    appVersion: string | null;
    appSessionId?: string | null;
    launchAttemptId?: string | null;
    runtime: {
        node: string;
        electron: string | null;
        v8: string;
    };
    state: 'running' | 'clean_shutdown';
    exitCode: number | null;
    heapLimit: number;
    samples: HeapSample[];
    peaks: Peaks;
    topReads: ReadRecord[];
    inflight: InflightRead | null;
    storage: SqlitePageStats | null;
    pendingReports: PendingReport[];
};
export declare function daemonHealthPaths(dataRoot: string): {
    directory: string;
    current: string;
    previous: string;
    fatalReports: string;
};
type Clock = () => number;
/** Optional daemon curve context; the shared analytics layer owns event admission. */
export type DaemonMemorySampleContext = {
    app_session_id: string | null;
    app_version: string | null;
    environment: string | null;
    platform: string;
    arch: string;
    os_version: string | null;
};
export type DaemonProcessMemorySample = DaemonMemorySampleContext & {
    metric_schema_version: 1;
    telemetry_capability: 'supported';
    occurred_at: string;
    process_role: 'daemon';
    process_instance_id: string;
    uptime_ms: number;
    rss_bytes: number | null;
    heap_used_bytes: number | null;
    heap_limit_bytes: number | null;
    external_bytes: number | null;
    sampled_at: string;
    sampling_interval_ms: number;
};
export type DaemonHealthOptions = {
    dataRoot: string;
    /** CS02 supplies the same desktop app session and environment to this process. */
    memorySampling?: DaemonMemorySampleContext;
    sampleIntervalMs?: number;
    /** Rotated log of the previous daemon session, when a launcher keeps one. */
    previousLogPath?: string | null;
    now?: Clock;
    pid?: number;
    isProcessAlive?: (pid: number) => boolean;
    readHeap?: () => HeapSample;
    /** Tests disable the process-wide timers, observers and listeners. */
    instrumentProcess?: boolean;
};
export declare function createDaemonHealth(options: DaemonHealthOptions): {
    bootId: string;
    setLaunchContext(context: {
        app_session_id: string;
        launch_attempt_id: string;
    }): void;
    setAppVersion(version: string | null | undefined): void;
    /** Constant-cost storage snapshot provider; reported once per boot. */
    setStorageProbe(probe: () => SqlitePageStats): void;
    attachSink(target: DaemonHealthEventSink): void;
    /**
     * Opt this process into Node's fatal-error report, written next to the
     * checkpoint. Left untouched when any report trigger was already enabled
     * by flags, so an operator's own report configuration is never redirected.
     */
    enableFatalReports(): void;
    beginRead(op: ObservedReadOp, mark: 'always' | 'pressure'): number | null;
    endRead(index: number | null, rows: number | null): void;
    sampleNow(): void;
    markCleanShutdown(): void;
    stop(): void;
    /** Test-only view of the in-memory checkpoint. */
    snapshotForTests(): Checkpoint;
};
export type DaemonHealth = ReturnType<typeof createDaemonHealth>;
/** One health session per daemon process; later calls return the first. */
export declare function beginDaemonHealthSession(options: DaemonHealthOptions): DaemonHealth | null;
export declare function getDaemonHealth(): DaemonHealth | null;
/** Test-only: detach the process-wide session. */
export declare function resetDaemonHealthForTests(): void;
/**
 * Identity wrapper around a synchronous read: returns exactly what `read`
 * returns and rethrows exactly what it throws. Observation failures are
 * swallowed inside the session.
 */
export declare function observeRead<T>(op: ObservedReadOp, read: () => T, options?: {
    mark?: 'always' | 'pressure';
    rows?: (result: T) => number;
}): T;
export {};
