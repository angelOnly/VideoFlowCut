import { type MarketplaceManifest } from '@open-design/contracts';
export interface MarketplaceParseSuccess {
    ok: true;
    manifest: MarketplaceManifest;
}
export interface MarketplaceParseFailure {
    ok: false;
    errors: string[];
}
export type MarketplaceParseResult = MarketplaceParseSuccess | MarketplaceParseFailure;
export declare function parseMarketplace(raw: string): MarketplaceParseResult;
//# sourceMappingURL=marketplace.d.ts.map