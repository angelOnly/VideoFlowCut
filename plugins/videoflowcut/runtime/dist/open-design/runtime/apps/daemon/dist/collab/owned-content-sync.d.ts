import type { OwnedProjectContentUpdate, OwnedProjectContentUpdateRequest } from '@open-design/contracts';
import type { ResourceHubPrincipal } from './resource-principal.js';
import type { PublishedResourceVersion } from './publish-scheduler.js';
import { type OwnedContentScope, type OwnedContentStore } from './owned-content-store.js';
export interface OwnedContentSyncDeps {
    store: OwnedContentStore;
    head(scope: OwnedContentScope): Promise<number | null>;
    hasContent(scope: OwnedContentScope): Promise<boolean>;
    isSupported(scope: OwnedContentScope): boolean;
    isBusy(projectId: string): boolean;
    fingerprint(scope: OwnedContentScope): Promise<string>;
    apply(scope: OwnedContentScope, expectedVersion: number): Promise<{
        version: number;
        fingerprint: string;
    }>;
    publicationScope(projectId: string, principal?: ResourceHubPrincipal | null): OwnedContentScope | null;
    onChange(scope: OwnedContentScope): void;
    onApplied?(scope: OwnedContentScope, version: number): void | Promise<void>;
    now?: () => number;
}
/** One daemon authority for owner replacement, shared by page entry, SSE and CLI. */
export declare function createOwnedContentSync(deps: OwnedContentSyncDeps): {
    request: (scope: OwnedContentScope, input: OwnedProjectContentUpdateRequest, hintedVersion?: number, propagateError?: boolean) => Promise<OwnedProjectContentUpdate>;
    read: (scope: OwnedContentScope) => OwnedProjectContentUpdate;
    isApplying: (projectId: string) => boolean;
    localVersion: (scope: OwnedContentScope) => number | null;
    shouldPublish(projectId: string, principal?: ResourceHubPrincipal): Promise<boolean>;
    withPublication(projectId: string, principal: ResourceHubPrincipal | null | undefined, operation: () => Promise<PublishedResourceVersion | null>): Promise<PublishedResourceVersion | null>;
};
export type OwnedContentSync = ReturnType<typeof createOwnedContentSync>;
