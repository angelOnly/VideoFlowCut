import type Database from 'better-sqlite3';
import { type MarketplaceManifest } from '@open-design/contracts';
type SqliteDb = Database.Database;
export type MarketplaceTrustTier = 'official' | 'trusted' | 'restricted';
export interface MarketplaceRow {
    id: string;
    url: string;
    specVersion: string;
    version: string;
    trust: MarketplaceTrustTier;
    manifest: MarketplaceManifest;
    addedAt: number;
    refreshedAt: number;
}
export interface AddMarketplaceInput {
    url: string;
    fetcher?: (url: string) => Promise<{
        ok: boolean;
        status: number;
        text: () => Promise<string>;
    }>;
    trust?: MarketplaceTrustTier;
}
export interface AddMarketplaceResult {
    ok: true;
    row: MarketplaceRow;
    warnings: string[];
}
export interface AddMarketplaceFailure {
    ok: false;
    status: number;
    message: string;
    errors?: string[];
}
export interface EnsureMarketplaceManifestInput {
    id: string;
    url: string;
    trust: MarketplaceTrustTier;
    manifestText: string;
    now?: number;
}
export declare function marketplaceRegistryBaseUrl(): string;
export declare function marketplaceManifestUrlForRegistry(id: string): string;
export declare function marketplaceRegistryIdFromUrl(url: string): string | null;
export declare function resolveMarketplaceFetchUrl(url: string): string;
export declare function addMarketplace(db: SqliteDb, input: AddMarketplaceInput): Promise<AddMarketplaceResult | AddMarketplaceFailure>;
export declare function ensureMarketplaceManifest(db: SqliteDb, input: EnsureMarketplaceManifestInput): AddMarketplaceResult | AddMarketplaceFailure;
export declare function listMarketplaces(db: SqliteDb): MarketplaceRow[];
export declare function getMarketplace(db: SqliteDb, id: string): MarketplaceRow | null;
export declare function removeMarketplace(db: SqliteDb, id: string): boolean;
export declare function setMarketplaceTrust(db: SqliteDb, id: string, trust: MarketplaceTrustTier): MarketplaceRow | null;
export interface RefreshMarketplaceResult {
    ok: true;
    row: MarketplaceRow;
}
export declare function refreshMarketplace(db: SqliteDb, id: string, fetcher?: AddMarketplaceInput['fetcher']): Promise<RefreshMarketplaceResult | AddMarketplaceFailure>;
export interface ResolvedPluginEntry {
    marketplaceId: string;
    marketplaceUrl: string;
    marketplaceTrust: MarketplaceTrustTier;
    marketplaceSpecVersion: string;
    marketplaceVersion: string;
    pluginName: string;
    pluginVersion: string;
    source: string;
    ref?: string;
    manifestDigest?: string;
    archiveIntegrity?: string;
    description?: string;
}
export declare function resolvePluginInMarketplaces(db: SqliteDb, pluginName: string): ResolvedPluginEntry | null;
export {};
