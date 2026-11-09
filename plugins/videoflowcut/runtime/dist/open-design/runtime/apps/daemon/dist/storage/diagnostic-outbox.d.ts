export interface DiagnosticIncident {
    id: string;
    sourceId: string;
    createdAt: number;
    state: 'collect' | 'pending' | 'delivered' | 'discarded';
    summary: string;
    manifest: string | null;
    bytes: number;
    deviceId: string | null;
    attempts: number;
    version: number;
    leaseUntil: number;
    nextAttemptAt: number;
    deliveredAt: number | null;
    receipt: string | null;
    reason: string | null;
}
export declare const PENDING_MAX_AGE: number;
export declare const DELIVERED_MAX_AGE = 86400000;
export declare const QUEUE_MAX_BYTES: number;
/** A separate database avoids coupling fault delivery to the application's billing/state DB. */
export declare class DiagnosticOutbox {
    readonly directory: string;
    private readonly db;
    constructor(dataRoot: string);
    enqueue(sourceId: string, summary: string, now?: number): DiagnosticIncident;
    get(id: string): DiagnosticIncident | undefined;
    trackRun(id: string, summary: string): void;
    finishRun(id: string): void;
    noteRecovery(runId: string, at: number): void;
    recoverRuns(consent: boolean, now?: number): void;
    list(): DiagnosticIncident[];
    ids(): string[];
    diagnostics(): Record<string, unknown>;
    claim(now?: number, leaseMs?: number): DiagnosticIncident | undefined;
    prepared(item: DiagnosticIncident, manifest: string, bytes: number): boolean;
    bindDevice(item: DiagnosticIncident, deviceId: string): boolean;
    renew(item: DiagnosticIncident, now?: number): boolean;
    delivered(item: DiagnosticIncident, receipt: string, now?: number): boolean;
    defer(item: DiagnosticIncident, at: number, reason: string): boolean;
    discard(id: string, reason: string): void;
    /** Returns directories to remove. Persist tombstones before deleting files so restart is safe. */
    prune(now?: number, consent?: boolean, reserveBytes?: number): string[];
    close(): void;
}
