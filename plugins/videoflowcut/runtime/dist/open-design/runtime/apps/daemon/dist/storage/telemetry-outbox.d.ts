export type OutboxKind = 'object' | 'feedback';
export interface OutboxJob {
    key: string;
    kind: OutboxKind;
    payload: string;
    attempts: number;
    createdAt: number;
}
export type DeliveryAttempt = {
    status: 'materialized' | 'uploaded' | 'accepted' | 'retry' | 'terminal';
    reason?: string;
    receipt?: unknown;
};
/** Additive, bounded evidence storage. Product tables and live files are never mutated. */
export declare class TelemetryOutbox {
    readonly budget: {
        bytes: number;
        jobs: number;
        attempts: number;
        ttlMs: number;
    };
    private readonly db;
    constructor(filename: string, budget?: {
        bytes: number;
        jobs: number;
        attempts: number;
        ttlMs: number;
    });
    private table;
    enqueue(kind: OutboxKind, key: string, payload: unknown, snapshots?: Buffer[], now?: number): 'queued' | 'existing' | 'capacity_exceeded';
    snapshot(sha256: string): Buffer;
    stats(): {
        jobs: number;
        bytes: number;
        pending: number;
    };
    inspect(kind: OutboxKind, key: string): {
        status: string;
        attempts: number;
        last_reason: string | null;
    } | undefined;
    read<T>(kind: OutboxKind, key: string): {
        payload: T;
        receipt: unknown;
    } | undefined;
    checkpointReceipt(kind: OutboxKind, key: string, receipt: unknown): void;
    objectJobsForTask(taskTraceId: string): Array<{
        key: string;
        payload: string;
        receipt: string | null;
    }>;
    objectJobsForConversation(projectId: string, conversationId: string): Array<{
        payload: string;
    }>;
    /** Preserve published reason keys so a later empty map can explicitly clear remote deep merges. */
    rememberTaskObjectReasons(taskTraceId: string, currentKeys: string[]): string[];
    private draining;
    drain(deliver: (job: OutboxJob) => Promise<DeliveryAttempt>, now?: number): Promise<void>;
    private drainPass;
    close(): void;
}
