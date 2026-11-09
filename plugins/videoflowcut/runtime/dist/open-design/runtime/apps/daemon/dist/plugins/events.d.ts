export type PluginEventKind = 'plugin.installed' | 'plugin.upgraded' | 'plugin.uninstalled' | 'plugin.trust-changed' | 'plugin.applied' | 'plugin.snapshot-pruned' | 'plugin.marketplace-refreshed';
export interface PluginEvent {
    id: number;
    kind: PluginEventKind;
    at: number;
    pluginId: string;
    details?: Record<string, unknown>;
}
interface Subscriber {
    (event: PluginEvent): void;
}
export declare function recordPluginEvent(input: Omit<PluginEvent, 'id' | 'at'>): PluginEvent;
export declare function pluginEventSnapshot(since?: number): PluginEvent[];
export declare function subscribePluginEvents(fn: Subscriber): () => void;
export declare function pluginEventBufferSize(): number;
export declare function __resetPluginEventBufferForTests(): void;
export interface PurgePluginEventBufferResult {
    purged: number;
    firstId: number | null;
    lastId: number | null;
    preNextId: number;
}
export declare function purgePluginEventBuffer(): PurgePluginEventBufferResult;
export interface PluginEventStats {
    total: number;
    byKind: Record<string, number>;
    byPluginId: Record<string, number>;
    oldestAt: number | null;
    newestAt: number | null;
    firstId: number | null;
    lastId: number | null;
}
export declare function summarisePluginEvents(events: ReadonlyArray<PluginEvent>): PluginEventStats;
export {};
