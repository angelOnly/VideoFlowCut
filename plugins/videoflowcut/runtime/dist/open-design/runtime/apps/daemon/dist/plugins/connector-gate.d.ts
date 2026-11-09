import type { AppliedPluginSnapshot, GenUISurfaceSpec, PluginConnectorBinding, PluginConnectorRef, PluginManifest } from '@open-design/contracts';
export type ConnectorGateStatus = 'connected' | 'pending' | 'unavailable';
export interface ConnectorCatalogEntry {
    id: string;
    status: ConnectorGateStatus;
    accountLabel?: string;
    allowedToolNames: string[];
}
export interface ConnectorProbe {
    get(connectorId: string): ConnectorCatalogEntry | undefined;
}
export interface ConnectorRefValidationIssue {
    connectorId: string;
    code: 'unknown-connector' | 'unknown-tool' | 'missing-capability';
    message: string;
    tools?: string[];
}
export declare function resolveConnectorBindings(manifest: PluginManifest, probe: ConnectorProbe | undefined): {
    resolved: PluginConnectorBinding[];
    required: PluginConnectorRef[];
};
export declare function deriveAutoOAuthPrompts(bindings: PluginConnectorBinding[]): GenUISurfaceSpec[];
export declare function mergeAutoOAuthPrompts(declared: GenUISurfaceSpec[], auto: GenUISurfaceSpec[]): GenUISurfaceSpec[];
export declare function validateConnectorRefs(manifest: PluginManifest, probe: ConnectorProbe): ConnectorRefValidationIssue[];
export declare function checkConnectorTokenIssuance(args: {
    snapshot: Pick<AppliedPluginSnapshot, 'capabilitiesGranted'>;
    trust: 'trusted' | 'restricted' | 'bundled';
    connectorId: string;
}): {
    ok: true;
} | {
    ok: false;
    reason: string;
};
