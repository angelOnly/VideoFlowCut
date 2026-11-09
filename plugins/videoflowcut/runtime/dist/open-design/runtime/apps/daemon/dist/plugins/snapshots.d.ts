import type Database from 'better-sqlite3';
import { type AppliedPluginSnapshot, type AppliedStrategyBindingV2, type GenUISurfaceSpec, type McpServerSpec, type PluginAssetRef, type PluginConnectorBinding, type PluginConnectorRef, type PluginPipeline, type ResolvedContext } from '@open-design/contracts';
type SqliteDb = Database.Database;
type DbRow = Record<string, unknown>;
export interface CreateSnapshotInput {
    projectId: string;
    conversationId?: string | null | undefined;
    runId?: string | null | undefined;
    pluginId: string;
    pluginSpecVersion?: string | null | undefined;
    pluginVersion: string;
    pluginTitle?: string | undefined;
    pluginDescription?: string | undefined;
    manifestSourceDigest: string;
    strategy?: AppliedStrategyBindingV2 | null | undefined;
    sourceMarketplaceId?: string | null | undefined;
    sourceMarketplaceEntryName?: string | null | undefined;
    sourceMarketplaceEntryVersion?: string | null | undefined;
    marketplaceTrust?: 'official' | 'trusted' | 'restricted' | null | undefined;
    resolvedSource?: string | null | undefined;
    resolvedRef?: string | null | undefined;
    archiveIntegrity?: string | null | undefined;
    pinnedRef?: string | null | undefined;
    taskKind: AppliedPluginSnapshot['taskKind'];
    inputs: Record<string, string | number | boolean>;
    resolvedContext: ResolvedContext;
    craftRequires?: string[] | undefined;
    pipeline?: PluginPipeline | undefined;
    genuiSurfaces?: GenUISurfaceSpec[] | undefined;
    capabilitiesGranted: string[];
    capabilitiesRequired: string[];
    assetsStaged: PluginAssetRef[];
    connectorsRequired: PluginConnectorRef[];
    connectorsResolved: PluginConnectorBinding[];
    mcpServers: McpServerSpec[];
    query?: string | undefined;
}
export declare function createSnapshot(db: SqliteDb, input: CreateSnapshotInput): AppliedPluginSnapshot;
export declare function getSnapshot(db: SqliteDb, snapshotId: string): AppliedPluginSnapshot | null;
export declare function listSnapshotsForProject(db: SqliteDb, projectId: string): AppliedPluginSnapshot[];
export declare function linkSnapshotToRun(db: SqliteDb, snapshotId: string, runId: string): void;
export declare function linkSnapshotToProject(db: SqliteDb, snapshotId: string, projectId: string): void;
export declare function restoreProjectSnapshotLink(db: SqliteDb, projectId: string, snapshotIdToDiscard: string, previousSnapshotId: string | null | undefined, discardedRunId?: string | null | undefined): void;
export declare function linkSnapshotToConversation(db: SqliteDb, snapshotId: string, conversationId: string): void;
export declare function markSnapshotStale(db: SqliteDb, snapshotId: string): void;
export interface PruneExpiredResult {
    removed: number;
    ids: string[];
}
export interface PruneExpiredOptions {
    now?: number;
    before?: number;
    retentionDays?: number;
}
export declare function pruneExpiredSnapshots(db: SqliteDb, options?: PruneExpiredOptions): PruneExpiredResult;
export declare function countSnapshotsForProject(db: SqliteDb, projectId: string): number;
export declare function rowToSnapshot(row: DbRow): AppliedPluginSnapshot;
export declare class InvalidAppliedStrategySnapshotError extends Error {
    constructor(message: string);
}
export {};
