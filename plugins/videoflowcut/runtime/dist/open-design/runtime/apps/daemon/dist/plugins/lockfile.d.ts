import type { InstalledPluginRecord } from '@open-design/contracts';
export interface PluginLockEntry {
    name: string;
    version: string;
    source: string;
    sourceKind: string;
    sourceMarketplaceId?: string;
    sourceMarketplaceEntryName?: string;
    resolvedSource?: string;
    resolvedRef?: string;
    manifestDigest?: string;
    archiveIntegrity?: string;
    lockedAt: number;
}
export interface PluginLockfile {
    schemaVersion: 1;
    plugins: Record<string, PluginLockEntry>;
}
export declare function defaultPluginLockfile(): PluginLockfile;
export declare function lockEntryFromInstalled(plugin: InstalledPluginRecord, lockedAt?: number): PluginLockEntry;
export declare function readPluginLockfile(filePath: string): Promise<PluginLockfile>;
export declare function writePluginLockfile(filePath: string, lockfile: PluginLockfile): Promise<void>;
export declare function upsertPluginLockfileEntry(filePath: string, plugin: InstalledPluginRecord, lockedAt?: number): Promise<PluginLockfile>;
