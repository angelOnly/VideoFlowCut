import { type MediaStockCommonProps, type MediaStockError, type MediaStockTelemetryEvent } from '@open-design/contracts/analytics';
import type { StockSearchAttempt, StockSearchReport } from './stock-search.js';
export declare const STOCK_TELEMETRY_LIMITS: {
    readonly callBytes: number;
    readonly spoolBytes: number;
    readonly files: 1024;
    readonly events: 240;
    readonly callsPerPass: 4;
    readonly pollMs: 30000;
    readonly partialAfterMs: number;
    readonly retentionMs: number;
};
export declare const stockTelemetryDir: (dataDir: string) => string;
export declare function stockErrorType(attempt: Pick<StockSearchAttempt, 'status' | 'httpStatus' | 'error'>): MediaStockError;
type Header = {
    kind: 'start';
    schemaVersion: 1;
    callId: string;
    startedAt: string;
    slotCount: number;
    context: Omit<MediaStockCommonProps, 'slot_index' | 'collection_status'>;
    sessionId: string | null;
    writerPid: number;
    uploadAllowed: boolean;
    identity: {
        deviceId: string;
        sessionId: string;
        clientType?: 'web' | 'desktop' | 'external_mcp';
        locale?: string;
    } | null;
};
export type StockJournal = {
    header: Header;
    events: MediaStockTelemetryEvent[];
    complete: boolean;
};
export interface StockRecorder {
    callId: string;
    record(event: StockSearchAttempt & {
        slotIndex: number;
    }): void;
    finish(report: StockSearchReport): Promise<'complete' | 'failed' | 'disabled'>;
}
/** The inherited OD_DATA_DIR is the resolved daemon root; there is no cwd fallback. */
export declare function createStockRecorder(args: {
    env?: NodeJS.ProcessEnv;
    slotCount: number;
}): Promise<StockRecorder>;
/** Validate and re-project persisted rows; arbitrary extra JSON never reaches analytics. */
export declare function parseStockJournal(raw: string, callId: string): StockJournal | null;
export declare function readStockJournal(dataDir: string, callId: string): Promise<StockJournal | null>;
export declare function collectStockTelemetry(args: {
    dataDir: string;
    send: (journal: StockJournal, signal?: AbortSignal) => Promise<'uploaded' | 'retry' | 'disabled'>;
    now?: number;
    signal?: AbortSignal;
}): Promise<{
    uploaded: number;
    events: number;
    pending: number;
}>;
export declare function startStockTelemetryCollector(args: Parameters<typeof collectStockTelemetry>[0]): {
    dispose: () => void;
    flush: () => Promise<void>;
};
export {};
