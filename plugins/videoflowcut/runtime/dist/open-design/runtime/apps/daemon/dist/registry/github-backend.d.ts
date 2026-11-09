import type { MarketplaceManifest } from '@open-design/contracts';
import type { RegistryPublishOutcome, RegistryPublishRequest, RegistryYankOutcome } from '@open-design/registry-protocol';
import { StaticRegistryBackend } from './static-backend.js';
export interface GithubRegistryClient {
    readMarketplace(owner: string, repo: string, ref: string, path: string): Promise<MarketplaceManifest>;
    createPublishPullRequest?(request: GithubPublishMutation): Promise<{
        url: string;
    }>;
}
export interface GithubPublishMutation {
    owner: string;
    repo: string;
    baseRef: string;
    branchName: string;
    title: string;
    body: string;
    files: Array<{
        path: string;
        content: string;
    }>;
}
export interface GithubRegistryBackendOptions {
    id: string;
    owner: string;
    repo: string;
    ref?: string;
    marketplacePath?: string;
    client: GithubRegistryClient;
}
export declare class GithubRegistryBackend extends StaticRegistryBackend {
    readonly owner: string;
    readonly repo: string;
    readonly ref: string;
    readonly marketplacePath: string;
    readonly client: GithubRegistryClient;
    private constructor();
    static create(options: GithubRegistryBackendOptions): Promise<GithubRegistryBackend>;
    publish(request: RegistryPublishRequest): Promise<RegistryPublishOutcome>;
    yank(name: string, version: string, reason: string): Promise<RegistryYankOutcome>;
}
