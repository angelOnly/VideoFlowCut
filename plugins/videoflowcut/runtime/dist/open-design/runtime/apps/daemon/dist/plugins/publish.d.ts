export type PublishCatalog = 'anthropics-skills' | 'awesome-agent-skills' | 'clawhub' | 'skills-sh' | 'open-design';
export interface PublishMetadata {
    pluginId: string;
    pluginVersion: string;
    pluginTitle?: string;
    pluginDescription?: string;
    repoUrl?: string;
}
export interface PublishLink {
    catalog: PublishCatalog;
    catalogLabel: string;
    url: string;
    prBody: string;
}
export interface MarketplaceJsonManifest {
    specVersion: string;
    name: string;
    version: string;
    generatedAt?: string;
    plugins: MarketplaceJsonEntry[];
    [key: string]: unknown;
}
export interface MarketplaceJsonEntry {
    name: string;
    source: string;
    version: string;
    title?: string;
    description?: string;
    publisher?: {
        name?: string;
        github?: string;
        url?: string;
    };
    homepage?: string;
    repo?: string;
    [key: string]: unknown;
}
export interface MarketplaceJsonPublishOutcome {
    manifest: MarketplaceJsonManifest;
    entry: MarketplaceJsonEntry;
    inserted: boolean;
}
export declare class PublishError extends Error {
    constructor(message: string);
}
export declare function buildPublishLink(args: {
    catalog: PublishCatalog;
    meta: PublishMetadata;
}): PublishLink;
export declare function buildMarketplaceJsonEntry(meta: PublishMetadata): MarketplaceJsonEntry;
export declare function upsertMarketplaceJsonEntry(args: {
    manifest?: Partial<MarketplaceJsonManifest> | null;
    meta: PublishMetadata;
    generatedAt?: string;
}): MarketplaceJsonPublishOutcome;
export declare const PUBLISH_TARGETS: PublishCatalog[];
