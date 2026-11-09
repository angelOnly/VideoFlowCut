import type { MarketplacePluginEntry } from '@open-design/contracts';
export interface ParsedPluginSpecifier {
    name: string;
    range?: string;
}
export interface ResolvedMarketplaceVersion {
    version: string;
    source: string;
    ref?: string;
    manifestDigest?: string;
    archiveIntegrity?: string;
    deprecated?: boolean | string;
}
export declare function parsePluginSpecifier(input: string): ParsedPluginSpecifier;
export declare function resolveMarketplaceEntryVersion(entry: MarketplacePluginEntry, requestedRange?: string): ResolvedMarketplaceVersion | null;
