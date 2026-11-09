import type { BoundedJsonObject } from '../live-artifacts/schema.js';
import { type ConnectorCatalogDefinition, type ConnectorCatalogToolDefinition } from './catalog.js';
import { type ConnectorCredentialMaterial } from './service.js';
export interface ComposioConnectionStart {
    kind: 'redirect_required' | 'pending' | 'connected';
    redirectUrl?: string;
    providerConnectionId?: string;
    expiresAt?: string;
    accountLabel?: string;
    credentials?: ConnectorCredentialMaterial;
}
export interface ComposioPendingConnection {
    connectorId: string;
    state: string;
    providerConnectionId?: string;
    expiresAtMs: number;
}
export interface ComposioConnectionCompletion {
    connectorId: string;
    accountLabel: string;
    credentials: ConnectorCredentialMaterial;
}
export type ComposioAuthConfigPrepareResult = {
    status: 'ready';
    authConfigId: string;
} | {
    status: 'custom_required';
    message: string;
} | {
    status: 'error';
    message: string;
};
export declare class ComposioConnectorProvider {
    private discoveredAuthConfigIds;
    private readonly locallyCreatedAuthConfigs;
    private readonly definitionsCache;
    private readonly definitionsPromises;
    private definitionsGeneration;
    private readonly authConfigCreationPromises;
    private readonly unsupportedManagedAuthConfigs;
    private readonly pendingConnections;
    private persistedDefinitions;
    private persistedFetchedAt;
    private refreshTimer;
    private refreshTimeout;
    isConfigured(definition: ConnectorCatalogDefinition): boolean;
    clearDiscoveryCache(): void;
    configureCatalogCache(dataDir: string): void;
    startCatalogRefreshLoop(): void;
    stopCatalogRefreshLoop(): void;
    getFastDefinitions(): ConnectorCatalogDefinition[];
    getPersistedCatalogMetadata(): {
        fetchedAt?: string;
        stale: boolean;
    };
    refreshCatalog(signal?: AbortSignal): Promise<ConnectorCatalogDefinition[]>;
    private invalidateDefinitionsCache;
    listDefinitions(signal?: AbortSignal, options?: {
        hydrateTools?: boolean;
    }): Promise<ConnectorCatalogDefinition[]>;
    private fetchDefinitions;
    private scheduleCatalogRefresh;
    private refreshCatalogInBackground;
    private isPersistedCatalogStale;
    private loadPersistedCatalogCache;
    private setPersistedDefinitions;
    getDefinition(connectorId: string, signal?: AbortSignal): Promise<ConnectorCatalogDefinition | undefined>;
    getHydratedDefinition(connectorId: string, signal?: AbortSignal): Promise<ConnectorCatalogDefinition | undefined>;
    getPreviewDefinition(connectorId: string, options: {
        toolsLimit: number;
        toolsCursor?: string;
        signal?: AbortSignal;
    }): Promise<ConnectorCatalogDefinition | undefined>;
    connect(definition: ConnectorCatalogDefinition, callbackUrl: string, signal?: AbortSignal): Promise<ComposioConnectionStart>;
    prepareAuthConfig(definition: ConnectorCatalogDefinition, signal?: AbortSignal): Promise<ComposioAuthConfigPrepareResult>;
    cancelPendingConnections(connectorId: string): number;
    completeConnection(input: {
        definition: ConnectorCatalogDefinition;
        state: string;
        providerConnectionId?: string;
        status?: string;
        signal?: AbortSignal;
    }): Promise<ComposioConnectionCompletion>;
    private pruneExpiredPendingConnections;
    private getValidatedConnectedAccount;
    disconnect(credentials: ConnectorCredentialMaterial | undefined, signal?: AbortSignal): Promise<void>;
    execute(definition: ConnectorCatalogDefinition, tool: ConnectorCatalogToolDefinition, input: BoundedJsonObject, credentials: ConnectorCredentialMaterial | undefined, signal?: AbortSignal): Promise<BoundedJsonObject>;
    private getAuthConfigId;
    private getOrCreateManagedAuthConfigId;
    private createAndStoreManagedAuthConfigId;
    private createManagedAuthConfig;
    private getAuthConfigIdForToolkit;
    private getExistingAuthConfigIdForToolkit;
    private createConnectedAccountLink;
    private getPersistedAuthConfigId;
    private storeAuthConfigId;
    private discoverAuthConfigIds;
    private listAuthConfigs;
    private listAuthConfigsSafe;
    private listToolkits;
    private listToolkitsSafe;
    private listToolsPage;
    private listTools;
    private listToolsSafe;
    private definitionFromToolkit;
    private toolDefinitionFromComposioTool;
    private connectionToCredentials;
    private requestJson;
    private request;
    private getApiKey;
    private getBaseUrl;
    private getUserId;
}
export declare const composioConnectorProvider: ComposioConnectorProvider;
export declare function getStaticComposioCatalogDefinitions(): ConnectorCatalogDefinition[];
