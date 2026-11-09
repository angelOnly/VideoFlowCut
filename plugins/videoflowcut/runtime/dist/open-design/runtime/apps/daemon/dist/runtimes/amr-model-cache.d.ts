import type { AmrModelsResponse } from '@open-design/contracts';
import type { RuntimeModelOption } from './types.js';
type Fetchers = {
    fetchPreset: () => Promise<RuntimeModelOption[]>;
    fetchRemote: () => Promise<RuntimeModelOption[]>;
};
export declare const AMR_DEFAULT_MODEL_CATALOG_WAIT_MS = 12000;
export declare class AmrModelLoadingCache {
    private readonly refreshIntervalMs;
    private readonly states;
    constructor(refreshIntervalMs?: number);
    get(cacheKey: string, fetchers: Fetchers): Promise<AmrModelsResponse>;
    /**
     * Like `get`, but when only the preset seed is available, waits up to
     * `waitMs` for the in-flight remote refresh. The preset is the same for every
     * account and carries no plan entitlement, so it must not decide a caller's
     * default model when the caller's own catalog is moments away.
     */
    getAuthoritative(cacheKey: string, fetchers: Fetchers, waitMs: number): Promise<AmrModelsResponse>;
    warm(cacheKey: string, fetchRemote: () => Promise<RuntimeModelOption[]>): void;
    invalidate(cacheKey: string): void;
    resetForTests(): void;
    private stateFor;
    private startRefresh;
}
export declare const amrModelLoadingCache: AmrModelLoadingCache;
/**
 * The models a run should resolve against. A caller's remote catalog is used
 * and remembered as such; the shared preset seed is used only when this daemon
 * has not yet seen a remote catalog for the scope, since the preset carries no
 * plan entitlement and would pick a default the caller may not be allowed.
 */
export declare function amrRunModels(agentId: string, scope: string | null | undefined, catalog: Pick<AmrModelsResponse, 'source' | 'models'>): RuntimeModelOption[];
export {};
