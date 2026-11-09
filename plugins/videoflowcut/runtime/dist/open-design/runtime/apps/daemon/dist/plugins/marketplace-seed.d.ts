export declare const OFFICIAL_MARKETPLACE_ID = "official";
export declare const OFFICIAL_PLUGIN_SOURCE_REPO = "github:nexu-io/open-design@main";
export interface MarketplaceSeedEntry {
    name: string;
    [key: string]: unknown;
}
export interface MarketplaceSeedConfig {
    trust: 'official' | 'restricted';
    url: string;
}
export interface MarketplaceSeedFetchResponse {
    ok: boolean;
    status: number;
    text(): Promise<string>;
}
export interface MarketplaceSeedHelpers {
    defaultMarketplaceSeedConfig(id: string): MarketplaceSeedConfig;
    bundledPluginRegistrySource(sourcePath: string): string;
    marketplaceSeedManifestText(id: string, bundledMarketplaceEntries: readonly MarketplaceSeedEntry[]): Promise<string | null>;
    createMarketplaceFetcher(seedId: string | null | undefined, bundledMarketplaceEntries: readonly MarketplaceSeedEntry[]): (url: string) => Promise<MarketplaceSeedFetchResponse>;
}
export interface MarketplaceSeedHelperDeps {
    bundledPluginsDir: string;
    projectRoot: string;
    pluginRegistryDir: string;
    marketplaceManifestUrlForRegistry(id: string): string;
    marketplaceRegistryIdFromUrl(url: string): string | null;
    fetchImpl?: typeof fetch;
}
export declare function createMarketplaceSeedHelpers(deps: MarketplaceSeedHelperDeps): MarketplaceSeedHelpers;
