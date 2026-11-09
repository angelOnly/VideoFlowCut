import type { StockProvider, StockSearchAttempt, StockSlot } from '@open-design/contracts';
import { runVelaCommand } from '../integrations/vela-command.js';
export type StockSearchCandidate = {
    id: string;
    status: 'ok' | 'not_found' | 'error' | 'budget_exceeded';
    provider?: StockProvider;
    downloadUrl?: string;
    alt?: string;
    author?: string;
    authorUrl?: string;
    sourceUrl?: string;
    license?: string;
    error?: string;
    attempts: StockSearchAttempt[];
};
export type VelaStockSearchInput = {
    slots: StockSlot[];
    requestTimeoutMs: number;
    budgetMs: number;
    concurrency: number;
    workspaceId?: string;
};
export type StockSearchServiceReport = {
    providers: StockProvider[];
    slots: StockSearchCandidate[];
};
/** Reuse Vela's login, executable resolver and workspace authority. No provider keys. */
export declare function searchVelaStockPhotos(input: VelaStockSearchInput, runCommand?: typeof runVelaCommand): Promise<StockSearchServiceReport>;
