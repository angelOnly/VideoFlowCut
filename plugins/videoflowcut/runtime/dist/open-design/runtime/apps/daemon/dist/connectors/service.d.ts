import type { BoundedJsonObject, BoundedJsonValue } from '../live-artifacts/schema.js';
import { type ConnectorDetail, type ConnectorCatalogDefinition, type ConnectorCatalogToolDefinition, type ConnectorStatus } from './catalog.js';
import { type ComposioAuthConfigPrepareResult, type ComposioConnectionStart } from './composio.js';
export interface ConnectorExecuteRequest {
    connectorId: string;
    toolName: string;
    input: BoundedJsonObject;
    expectedAccountLabel?: string;
}
export interface ConnectorExecuteResponse {
    ok: true;
    connectorId: string;
    accountLabel?: string;
    toolName: string;
    safety: ConnectorCatalogDefinition['tools'][number]['safety'];
    output: BoundedJsonValue;
    outputSummary?: string;
    metadata?: BoundedJsonObject;
}
export interface ConnectorConnectResult {
    connector: ConnectorDetail;
    auth?: Pick<ComposioConnectionStart, 'kind' | 'redirectUrl' | 'providerConnectionId' | 'expiresAt'>;
}
export interface ConnectorAuthConfigPrepareResponse {
    results: Record<string, ComposioAuthConfigPrepareResult>;
}
export type ConnectorServiceErrorCode = 'CONNECTOR_NOT_FOUND' | 'CONNECTOR_AUTH_CONFIG_REQUIRED' | 'CONNECTOR_NOT_CONNECTED' | 'CONNECTOR_DISABLED' | 'CONNECTOR_TOOL_NOT_FOUND' | 'CONNECTOR_SAFETY_DENIED' | 'CONNECTOR_INPUT_SCHEMA_MISMATCH' | 'CONNECTOR_RATE_LIMITED' | 'CONNECTOR_OUTPUT_TOO_LARGE' | 'CONNECTOR_EXECUTION_FAILED';
export declare class ConnectorServiceError extends Error {
    readonly code: ConnectorServiceErrorCode;
    readonly status: number;
    readonly details?: BoundedJsonObject | undefined;
    constructor(code: ConnectorServiceErrorCode, message: string, status: number, details?: BoundedJsonObject | undefined);
}
export interface ConnectorConnectionStatus {
    status: ConnectorStatus;
    accountLabel?: string;
    lastError?: string;
}
export interface ConnectorConnectionRecord extends ConnectorConnectionStatus {
    updatedAt: string;
}
export interface ConnectorDiscoveryResult {
    connectors: ConnectorDetail[];
    meta?: {
        provider: 'composio';
        refreshRequested?: boolean;
    };
}
export type ConnectorCredentialMaterial = Record<string, unknown>;
export interface ConnectorCredentialRecord {
    schemaVersion: 1;
    connectorId: string;
    accountLabel: string;
    credentials: ConnectorCredentialMaterial;
    updatedAt: string;
}
export interface ConnectorCredentialStore {
    get(connectorId: string): ConnectorCredentialRecord | undefined;
    set(record: ConnectorCredentialRecord): void;
    delete(connectorId: string): void;
    deleteByProvider(provider: string): void;
}
export interface ConnectorStatusServiceOptions {
    initialStatuses?: Record<string, ConnectorConnectionStatus>;
    credentialStore?: ConnectorCredentialStore;
}
export declare class InMemoryConnectorCredentialStore implements ConnectorCredentialStore {
    private readonly records;
    get(connectorId: string): ConnectorCredentialRecord | undefined;
    set(record: ConnectorCredentialRecord): void;
    delete(connectorId: string): void;
    deleteByProvider(provider: string): void;
}
export declare class FileConnectorCredentialStore implements ConnectorCredentialStore {
    private readonly filePath;
    constructor(dataDir: string);
    get(connectorId: string): ConnectorCredentialRecord | undefined;
    set(record: ConnectorCredentialRecord): void;
    delete(connectorId: string): void;
    deleteByProvider(provider: string): void;
    private readRecords;
    private writeRecords;
}
export declare class ConnectorStatusService {
    private readonly statuses;
    private credentialStore;
    constructor(options?: ConnectorStatusServiceOptions);
    setCredentialStore(credentialStore: ConnectorCredentialStore): void;
    deleteCredentialsByProvider(provider: string): void;
    getStatus(definition: ConnectorCatalogDefinition): ConnectorConnectionStatus;
    listStatuses(): Record<string, ConnectorConnectionStatus>;
    connect(definition: ConnectorCatalogDefinition, accountLabel?: string, credentials?: ConnectorCredentialMaterial): ConnectorConnectionStatus;
    getCredential(connectorId: string): ConnectorCredentialRecord | undefined;
    disconnect(definition: ConnectorCatalogDefinition): ConnectorConnectionStatus;
    setError(definition: ConnectorCatalogDefinition, lastError: string, accountLabel?: string): ConnectorConnectionStatus;
    markAuthenticationExpired(definition: ConnectorCatalogDefinition, lastError: string, accountLabel?: string): ConnectorConnectionStatus;
    clear(connectorId: string): void;
}
export interface ConnectorExecutionContext {
    projectsRoot: string;
    projectId: string;
    runId?: string;
    purpose?: 'agent_preview' | 'artifact_refresh';
    signal?: AbortSignal;
}
export declare const CONNECTOR_MAX_OUTPUT_BYTES: number;
export declare const CONNECTOR_RUN_RATE_LIMIT_CALLS = 10;
export declare const CONNECTOR_RUN_RATE_LIMIT_WINDOW_MS = 60000;
export declare const CONNECTOR_RUN_LIMIT_TTL_MS: number;
export declare const CONNECTOR_RUN_TOTAL_CALL_LIMIT = 60;
export interface ConnectorOutputProtectionResult {
    output: BoundedJsonValue;
    redacted: boolean;
    serializedBytes: number;
}
export declare function protectConnectorOutput(output: BoundedJsonValue): ConnectorOutputProtectionResult;
export declare class ConnectorService {
    private readonly statusService;
    private readonly runLimits;
    constructor(statusService?: ConnectorStatusService);
    setCredentialStore(credentialStore: ConnectorCredentialStore): void;
    deleteCredentialsByProvider(provider: string): void;
    listDefinitions(signal?: AbortSignal): Promise<ConnectorCatalogDefinition[]>;
    listHydratedDefinitions(signal?: AbortSignal): Promise<ConnectorCatalogDefinition[]>;
    listFastDefinitions(): ConnectorCatalogDefinition[];
    getFastDefinition(connectorId: string): ConnectorCatalogDefinition | undefined;
    getDefinition(connectorId: string, signal?: AbortSignal): Promise<ConnectorCatalogDefinition | undefined>;
    getHydratedDefinition(connectorId: string, signal?: AbortSignal): Promise<ConnectorCatalogDefinition | undefined>;
    getPreviewDefinition(connectorId: string, options: {
        toolsLimit: number;
        toolsCursor?: string;
        signal?: AbortSignal;
    }): Promise<ConnectorCatalogDefinition | undefined>;
    getStatus(definition: ConnectorCatalogDefinition): ConnectorConnectionStatus;
    getCredential(connectorId: string): ConnectorCredentialRecord | undefined;
    listConnectors(signal?: AbortSignal): Promise<ConnectorDetail[]>;
    listConnectorStatuses(): Record<string, ConnectorConnectionStatus>;
    listConnectorDiscovery(options?: {
        refresh?: boolean;
        hydrateTools?: boolean;
        signal?: AbortSignal;
    }): Promise<ConnectorDiscoveryResult>;
    getConnector(connectorId: string, signal?: AbortSignal): Promise<ConnectorDetail>;
    getHydratedConnector(connectorId: string, signal?: AbortSignal): Promise<ConnectorDetail>;
    getPreviewConnector(connectorId: string, options: {
        toolsLimit: number;
        toolsCursor?: string;
        signal?: AbortSignal;
    }): Promise<ConnectorDetail>;
    prepareAuthConfigs(connectorIds: readonly string[], signal?: AbortSignal): Promise<ConnectorAuthConfigPrepareResponse>;
    connect(connectorId: string, options?: {
        accountLabel?: string;
        credentials?: ConnectorCredentialMaterial;
        callbackUrl?: string;
        signal?: AbortSignal;
    }): Promise<ConnectorConnectResult>;
    disconnect(connectorId: string): Promise<ConnectorDetail>;
    cancelPendingAuthorization(connectorId: string): Promise<ConnectorDetail>;
    completeComposioConnection(input: {
        connectorId: string;
        state: string;
        providerConnectionId?: string;
        status?: string;
        signal?: AbortSignal;
    }): Promise<ConnectorDetail>;
    execute(request: ConnectorExecuteRequest, context: ConnectorExecutionContext): Promise<ConnectorExecuteResponse>;
    protected executeConnectorProviderTool(request: ConnectorExecuteRequest, context: ConnectorExecutionContext, resolvedDefinition?: ConnectorCatalogDefinition, resolvedTool?: ConnectorCatalogToolDefinition): Promise<BoundedJsonObject>;
    private enforceRunLimits;
    private pruneRunLimits;
    private toDetail;
}
export declare const connectorService: ConnectorService;
export declare function configureConnectorCredentialStore(credentialStore: ConnectorCredentialStore): void;
export declare function deleteConnectorCredentialsByProvider(provider: string): void;
