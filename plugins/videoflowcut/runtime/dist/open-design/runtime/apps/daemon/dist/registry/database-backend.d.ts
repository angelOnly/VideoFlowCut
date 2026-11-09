import type Database from 'better-sqlite3';
import type { MarketplaceManifest } from '@open-design/contracts';
import type { RegistryEntry, RegistryPublishOutcome, RegistryPublishRequest, RegistryTrust, RegistryYankOutcome } from '@open-design/registry-protocol';
import { StaticRegistryBackend } from './static-backend.js';
type SqliteDb = Database.Database;
export interface DatabaseRegistryBackendOptions {
    id: string;
    trust?: RegistryTrust;
    db: SqliteDb;
}
export declare class DatabaseRegistryBackend extends StaticRegistryBackend {
    readonly db: SqliteDb;
    constructor(options: DatabaseRegistryBackendOptions);
    publish(request: RegistryPublishRequest): Promise<RegistryPublishOutcome>;
    yank(name: string, version: string, reason: string): Promise<RegistryYankOutcome>;
    protected getManifest(): MarketplaceManifest;
}
export declare function ensureRegistryTables(db: SqliteDb): void;
export declare function upsertRegistryEntry(db: SqliteDb, backendId: string, entry: RegistryEntry, now?: number): void;
export {};
