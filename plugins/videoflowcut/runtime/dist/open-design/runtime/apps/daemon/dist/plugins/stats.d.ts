import type { InstalledPluginRecord, PluginSourceKind } from '@open-design/contracts';
export interface PluginInventoryStats {
    total: number;
    bySourceKind: Record<string, number>;
    byTrust: Record<string, number>;
    byTaskKind: Record<string, number>;
    withElevatedCapabilities: number;
    bundled: number;
    thirdParty: number;
    lastInstalledAt: number | null;
    lastUpdatedAt: number | null;
}
export declare function pluginInventoryStats(plugins: ReadonlyArray<InstalledPluginRecord>): PluginInventoryStats;
export interface SnapshotInventoryStats {
    total: number;
    byStatus: Record<string, number>;
    withProject: number;
    withRun: number;
    oldestAppliedAt: number | null;
    newestAppliedAt: number | null;
}
export interface SnapshotStatsRow {
    status: 'fresh' | 'stale';
    project_id: string | null;
    run_id: string | null;
    applied_at: number;
}
export interface PluginSourceBucket {
    sourceKind: PluginSourceKind | 'unknown';
    source: string;
    count: number;
    plugins: Array<{
        id: string;
        version: string;
    }>;
}
export interface PluginSourceBucketsResult {
    total: number;
    buckets: PluginSourceBucket[];
}
export declare function pluginSourceBuckets(plugins: ReadonlyArray<InstalledPluginRecord>): PluginSourceBucketsResult;
export declare function snapshotInventoryStats(rows: ReadonlyArray<SnapshotStatsRow>): SnapshotInventoryStats;
