import type Database from 'better-sqlite3';
import { type VelaCommandOptions } from '../integrations/vela-command.js';
export type AmrTerminalReportOutcome = 'failed' | 'canceled';
export type AmrTerminalReportState = 'pending' | 'delivered' | 'terminal_failed';
export interface PendingAmrTerminalReport {
    runId: string;
    outcome: AmrTerminalReportOutcome;
    terminalAt: number;
}
export interface ClaimedAmrTerminalReport extends PendingAmrTerminalReport {
    terminalAtIso: string;
    attemptCount: number;
    version: number;
}
export interface AmrTerminalReportDiagnostic {
    runId: string;
    outcome: AmrTerminalReportOutcome;
    state: AmrTerminalReportState;
    attemptCount: number;
    terminalAt: string;
    errorCode: string | null;
}
export interface AmrTerminalReportDiagnostics {
    pending: number;
    delivered: number;
    unsupported: number;
    terminalFailed: number;
    oldestPendingAgeMs: number | null;
    reports: AmrTerminalReportDiagnostic[];
}
export interface AmrTerminalReportOutboxStore {
    enqueue(report: PendingAmrTerminalReport): void;
    listPending(): PendingAmrTerminalReport[];
    claimDue(now: number, leaseMs: number, limit?: number): ClaimedAmrTerminalReport[];
    deliver(record: ClaimedAmrTerminalReport, receipt: string): boolean;
    defer(record: ClaimedAmrTerminalReport, nextAttemptAt: number, code: string, message: string): boolean;
    fail(record: ClaimedAmrTerminalReport, code: string, message: string): boolean;
    diagnostics(now?: number): AmrTerminalReportDiagnostics;
}
export interface AmrTerminalReportRun {
    id: string;
    agentId?: string | null;
    errorCode?: string | null;
    failureAction?: string | null;
    status?: string | null;
}
export declare function isBillingTerminalAmrRun(run: AmrTerminalReportRun, status?: string | null | undefined): status is AmrTerminalReportOutcome;
/** Upgrade both fresh databases and the three-column table shipped by #7392. */
export declare function migrateAmrTerminalReportOutbox(db: Database.Database): void;
export declare function createAmrTerminalReportOutboxStore(db: Database.Database, now?: () => number): AmrTerminalReportOutboxStore;
export interface AmrTerminalReportDeliveryService {
    start(): void;
    stop(): void;
    processDue(): Promise<void>;
}
export declare function createAmrTerminalReportDeliveryService(input: {
    store: AmrTerminalReportOutboxStore;
    run?: (args: string[], options?: VelaCommandOptions) => Promise<string>;
    env?: NodeJS.ProcessEnv;
    now?: () => number;
    pollIntervalMs?: number;
    leaseMs?: number;
    timeoutMs?: number;
    baseBackoffMs?: number;
    maxBackoffMs?: number;
}): AmrTerminalReportDeliveryService;
/** Run finalization persists only; remote delivery remains background work. */
export declare function createAmrTerminalReportFinalizer(outbox: AmrTerminalReportOutboxStore, options?: {
    baseRetryMs?: number;
    maxRetryMs?: number;
}): (run: AmrTerminalReportRun, status: string, terminalAt: number) => void;
