import type { BoundedJsonObject } from '../live-artifacts/schema.js';
export type ConnectorStatus = 'available' | 'connected' | 'error' | 'disabled';
export type ConnectorToolSideEffect = 'read' | 'write' | 'destructive' | 'unknown';
export type ConnectorToolApproval = 'auto' | 'confirm' | 'disabled';
export type ConnectorToolUseCase = 'personal_daily_digest';
export interface ConnectorToolSafety {
    sideEffect: ConnectorToolSideEffect;
    approval: ConnectorToolApproval;
    reason: string;
}
export interface ConnectorToolCuration {
    useCases?: ConnectorToolUseCase[];
    reason?: string;
}
export interface ConnectorToolDetail {
    name: string;
    title: string;
    description?: string;
    inputSchemaJson?: BoundedJsonObject;
    outputSchemaJson?: BoundedJsonObject;
    safety: ConnectorToolSafety;
    refreshEligible: boolean;
    curation?: ConnectorToolCuration;
}
export interface ConnectorCatalogToolDefinition extends ConnectorToolDetail {
    /** Provider scopes required for this tool. Empty for local/read-only providers. */
    requiredScopes: string[];
    /** Provider-native tool identifier, when different from the OpenDesign tool name. */
    providerToolId?: string;
}
export interface ConnectorDetail {
    id: string;
    name: string;
    provider: string;
    category: string;
    description?: string;
    status: ConnectorStatus;
    accountLabel?: string;
    tools: ConnectorToolDetail[];
    /**
     * Runtime execution allowlist. Subset of `tools`. The agent layer
     * only invokes tools whose names appear here. For Composio
     * connectors this expands on hydration to include any
     * provider-discovered tool whose classified safety is
     * `read + auto-approval` — so the count can grow from the catalog
     * baseline by tens of read tools after a Composio API key is
     * configured (issue #748).
     *
     * Optional in the type only for fixture brevity; daemon-built
     * `ConnectorDetail` payloads always carry it.
     */
    allowedToolNames?: string[];
    /**
     * The hand-curated catalog subset. Stable across hydration: never
     * extended by provider discovery, only ever the static catalog
     * names. This preserves the static catalog baseline for consumers
     * that need that curated subset, but it is not the advertised
     * provider inventory count. UI summary badges should use `toolCount`
     * when present; the drawer's rendered tool rows still come from
     * `tools` directly.
     *
     * Optional in the type only for fixture brevity; daemon-built
     * `ConnectorDetail` payloads always carry it.
     */
    curatedToolNames?: string[];
    toolCount?: number;
    toolsNextCursor?: string;
    toolsHasMore?: boolean;
    featuredToolNames?: string[];
    minimumApproval?: ConnectorToolApproval;
    lastError?: string;
    auth?: ConnectorAuthDetail;
}
export interface ConnectorAuthDetail {
    provider: 'local' | 'none' | 'oauth' | 'composio';
    configured: boolean;
}
export interface ConnectorCatalogDefinition {
    id: string;
    name: string;
    provider: string;
    category: string;
    description?: string;
    tools: ConnectorCatalogToolDefinition[];
    /** The complete allowlist of callable tool names for this connector. */
    allowedToolNames: string[];
    /**
     * The hand-curated subset of `allowedToolNames` that is fixed at the
     * catalog level — never extended by provider discovery (issue #748).
     * Optional: when omitted, serialized wire details fall back to
     * `allowedToolNames`, which is the right preview subset for
     * non-Composio connectors that don't have a dynamic discovery layer
     * in the first place.
     */
    curatedToolNames?: string[];
    /** Display-only count of provider tools. This may be known before tool schemas are hydrated. */
    toolCount?: number;
    /** Preview pagination state for hydrated tool definitions. Execution code must not rely on partial pages. */
    toolsNextCursor?: string;
    toolsHasMore?: boolean;
    /** How the connector is made available. `none` and `local` connectors require no user OAuth state. */
    authentication?: 'local' | 'none' | 'oauth' | 'composio';
    /** Provider toolkit slug used by external connector providers such as Composio. */
    providerConnectorId?: string;
    featuredToolNames?: string[];
    minimumApproval?: ConnectorToolApproval;
    disabled?: boolean;
}
export interface ConnectorToolSafetyClassificationInput {
    name: string;
    title?: string;
    description?: string;
    requiredScopes?: readonly string[];
}
export declare function classifyConnectorToolSafety(input: ConnectorToolSafetyClassificationInput): ConnectorToolSafety;
export declare function isRefreshEligibleConnectorToolSafety(safety: ConnectorToolSafety): boolean;
export declare function defineConnectorTool(tool: Omit<ConnectorCatalogToolDefinition, 'safety' | 'refreshEligible'> & {
    safety?: ConnectorToolSafety;
    refreshEligible?: boolean;
}): ConnectorCatalogToolDefinition;
export declare function connectorDefinitionToDetail(definition: ConnectorCatalogDefinition): ConnectorDetail;
