import type { InstalledPluginRecord } from '@open-design/contracts';
export interface PluginDiffEntry {
    field: string;
    kind: 'added' | 'removed' | 'changed';
    before?: string;
    after?: string;
    summary?: string;
}
export interface PluginDiffReport {
    pluginId?: string;
    entries: PluginDiffEntry[];
    added: number;
    removed: number;
    changed: number;
}
export interface DiffPluginsInput {
    a: InstalledPluginRecord;
    b: InstalledPluginRecord;
}
export declare function diffPlugins(input: DiffPluginsInput): PluginDiffReport;
