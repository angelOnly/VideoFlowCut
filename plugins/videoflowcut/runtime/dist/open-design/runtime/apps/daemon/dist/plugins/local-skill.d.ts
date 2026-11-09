import type { InstalledPluginRecord } from '@open-design/contracts';
export interface PluginLocalSkill {
    body: string;
    name: string;
    dir: string;
    relpath: string;
}
export declare function loadPluginLocalSkill(plugin: InstalledPluginRecord): Promise<PluginLocalSkill | null>;
