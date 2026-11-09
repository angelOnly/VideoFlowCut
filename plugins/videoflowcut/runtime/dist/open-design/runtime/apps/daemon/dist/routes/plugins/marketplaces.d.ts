import type { Express } from 'express';
import type * as BetterSqlite3 from 'better-sqlite3';
type SqliteDbLike = BetterSqlite3.Database;
type MarketplaceFetcher = (url: string) => Promise<{
    ok: boolean;
    status: number;
    text: () => Promise<string>;
}>;
export interface RegisterPluginMarketplaceRoutesDeps {
    db: SqliteDbLike;
    bundledMarketplaceEntries: unknown;
    createMarketplaceFetcher: (seedId: string | null, bundled: unknown) => MarketplaceFetcher;
    marketplaceRegistryIdFromUrl: (url: string) => string | null;
}
export declare function registerPluginMarketplaceRoutes(app: Express, deps: RegisterPluginMarketplaceRoutesDeps): void;
export {};
