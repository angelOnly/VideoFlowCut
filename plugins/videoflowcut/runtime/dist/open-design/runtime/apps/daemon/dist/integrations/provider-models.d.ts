import type { ProviderModelsRequest, ProviderModelsResponse } from '@open-design/contracts/api/providerModels';
type ProviderModelsInput = ProviderModelsRequest & {
    signal?: AbortSignal;
    requestInit?: Pick<RequestInit, 'dispatcher'>;
};
export declare function listProviderModels(input: ProviderModelsInput): Promise<ProviderModelsResponse>;
export {};
