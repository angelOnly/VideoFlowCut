import type Database from 'better-sqlite3';
import { type RegistryRoots } from './registry.js';
import type { InstalledPluginRecord, MarketplaceTrust } from '@open-design/contracts';
type SqliteDb = Database.Database;
export interface RegisterBundledPluginsInput {
    db: SqliteDb;
    bundledRoot: string;
    roots?: RegistryRoots;
    marketplaceProvenance?: {
        sourceMarketplaceId: string;
        marketplaceTrust: MarketplaceTrust;
        entryNamePrefix: string;
    };
}
export interface RegisterBundledPluginsResult {
    registered: InstalledPluginRecord[];
    pruned: string[];
    warnings: string[];
}
export declare function registerBundledPlugins(input: RegisterBundledPluginsInput): Promise<RegisterBundledPluginsResult>;
export declare function defaultBundledRoot(workspaceRoot: string): string;
export {};
