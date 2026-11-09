import type { InstalledPluginRecord, TrustTier } from '@open-design/contracts';
export interface SearchInstalledPluginsInput {
    plugins: ReadonlyArray<InstalledPluginRecord>;
    query?: string;
    taskKind?: string;
    mode?: string;
    tag?: string;
    trust?: TrustTier;
    bundled?: boolean;
}
export interface SearchInstalledPluginsResultEntry {
    plugin: InstalledPluginRecord;
    rank: number;
    matched: Array<'id' | 'title' | 'description' | 'tag' | 'taskKind' | 'mode' | 'trust' | 'bundled'>;
}
export interface SearchInstalledPluginsResult {
    entries: SearchInstalledPluginsResultEntry[];
    total: number;
}
export declare function searchInstalledPlugins(input: SearchInstalledPluginsInput): SearchInstalledPluginsResult;
