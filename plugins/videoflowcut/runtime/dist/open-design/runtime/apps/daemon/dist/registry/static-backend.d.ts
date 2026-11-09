import type { MarketplaceManifest, MarketplacePluginEntry } from '@open-design/contracts';
import type { RegistryBackend, RegistryDoctorReport, RegistryEntry, RegistrySearchQuery, RegistrySearchResult, RegistryTrust, ResolvedRegistryEntry } from '@open-design/registry-protocol';
export interface StaticRegistryBackendOptions {
    id: string;
    kind?: 'github' | 'http' | 'local' | 'db';
    trust: RegistryTrust;
    manifest: MarketplaceManifest;
}
export declare class StaticRegistryBackend implements RegistryBackend {
    readonly id: string;
    readonly kind: 'github' | 'http' | 'local' | 'db';
    readonly trust: RegistryTrust;
    protected readonly manifestData: MarketplaceManifest;
    constructor(options: StaticRegistryBackendOptions);
    list(): Promise<RegistryEntry[]>;
    search(input: RegistrySearchQuery): Promise<RegistrySearchResult[]>;
    resolve(name: string, range?: string): Promise<ResolvedRegistryEntry | null>;
    manifest(name: string, version: string): Promise<RegistryEntry | null>;
    doctor(): Promise<RegistryDoctorReport>;
    protected getManifest(): MarketplaceManifest;
}
export declare function toRegistryEntry(entry: MarketplacePluginEntry): RegistryEntry | null;
