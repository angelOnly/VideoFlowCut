import type { MarketplaceManifest } from '@open-design/contracts';
import type { RegistryDoctorReport } from '@open-design/registry-protocol';
export interface MarketplaceDoctorInput {
    id: string;
    trust: 'official' | 'trusted' | 'restricted';
    manifest: MarketplaceManifest;
    checkedAt?: number;
    strict?: boolean;
}
export declare function doctorMarketplace(input: MarketplaceDoctorInput): Promise<RegistryDoctorReport & {
    warningsAsErrors: boolean;
}>;
