import type { AppliedPluginSnapshot, InstalledPluginRecord, PluginManifest } from '@open-design/contracts';
export declare function getPluginContextCraft(plugin: InstalledPluginRecord): string[];
export declare function getManifestContextCraft(manifest: PluginManifest): string[];
export declare function getSnapshotContextCraft(snapshot: AppliedPluginSnapshot): string[];
