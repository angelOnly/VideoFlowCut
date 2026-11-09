import { Readable } from 'node:stream';
import { type RegistryRoots } from './registry.js';
import type { InstalledPluginRecord, MarketplaceTrust, PluginSourceKind } from '@open-design/contracts';
import type Database from 'better-sqlite3';
type SqliteDb = Database.Database;
export interface InstallProgressEvent {
    kind: 'progress';
    phase: 'resolving' | 'copying' | 'parsing' | 'persisting';
    message: string;
}
export interface InstallSuccessEvent {
    kind: 'success';
    plugin: InstalledPluginRecord;
    warnings: string[];
}
export interface InstallErrorEvent {
    kind: 'error';
    message: string;
    warnings: string[];
    code?: PluginInstallErrorCode;
}
export type InstallEvent = InstallProgressEvent | InstallSuccessEvent | InstallErrorEvent;
export type PluginInstallErrorCode = 'BAD_REQUEST' | 'FETCH_FAILED' | 'INVALID_ARCHIVE' | 'INVALID_MANIFEST' | 'CONFLICT' | 'INTERNAL_ERROR';
export interface InstallOptions {
    source: string;
    roots?: RegistryRoots;
    maxBytes?: number;
    overwriteExisting?: boolean;
    fetcher?: ArchiveFetcher;
    eventKind?: 'installed' | 'upgraded';
    sourceMarketplaceId?: string;
    sourceMarketplaceEntryName?: string;
    sourceMarketplaceEntryVersion?: string;
    marketplaceTrust?: MarketplaceTrust;
    resolvedSource?: string;
    resolvedRef?: string;
    manifestDigest?: string;
    archiveIntegrity?: string;
    lockfilePath?: string;
    allowReplacePlugin?: (pluginId: string) => boolean | string;
}
export type ArchiveFetcher = (url: string) => Promise<{
    ok: boolean;
    status: number;
    statusText: string;
    body: Readable | null;
}>;
/** Keep installer diagnostics finite so SSE clients never use paths or URLs as analytics keys. */
export declare function classifyPluginInstallError(message: string): PluginInstallErrorCode;
export declare function installPlugin(db: SqliteDb, opts: InstallOptions): AsyncGenerator<InstallEvent, void, void>;
export declare function installFromLocalFolder(db: SqliteDb, opts: InstallOptions & {
    _stagedFolder?: string;
    _stagedSourceKind?: PluginSourceKind;
}): AsyncGenerator<InstallEvent, void, void>;
export interface UninstallResult {
    ok: boolean;
    removedFolder?: string;
    warning?: string;
}
export declare function isSafePluginId(id: string): boolean;
export declare function uninstallPlugin(db: SqliteDb, id: string, roots?: RegistryRoots): Promise<UninstallResult>;
export type { PluginSourceKind };
