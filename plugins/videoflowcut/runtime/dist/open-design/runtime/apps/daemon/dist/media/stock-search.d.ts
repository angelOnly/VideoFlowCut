import type { StockSearchAttempt, StockSearchReport, StockSearchRequest } from '@open-design/contracts';
import { type VelaStockSearchInput, type StockSearchServiceReport } from './vela-stock-search.js';
export type { StockProvider, StockOrientation, StockRateLimit, StockSearchAttempt, StockSlot, StockSlotResult, StockSearchReport } from '@open-design/contracts';
export type StockSearchOptions = StockSearchRequest & {
    cwd?: string;
    fetch?: typeof fetch;
    now?: () => number;
    workspaceId?: string;
    search?: (input: VelaStockSearchInput) => Promise<StockSearchServiceReport>;
    resolveOutputPath?: (relativePath: string) => Promise<string>;
    onAttempt?: (event: StockSearchAttempt & {
        slotId: string;
        slotIndex: number;
    }) => void;
};
export declare class StockSearchServiceError extends Error {
}
export declare class StockSearchInputError extends Error {
}
/** Intrinsic size from a JPEG SOF or PNG IHDR header; null when unknown. */
export declare function imageSize(buf: Buffer): {
    width: number;
    height: number;
} | null;
export declare function stockSearch(options: StockSearchOptions): Promise<StockSearchReport>;
