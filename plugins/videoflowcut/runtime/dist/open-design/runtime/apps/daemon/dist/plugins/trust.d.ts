import type { InstalledPluginRecord, PluginManifest, TrustTier } from '@open-design/contracts';
export declare const TRUSTED_DEFAULT_CAPABILITIES: ReadonlyArray<string>;
export declare const RESTRICTED_DEFAULT_CAPABILITIES: ReadonlyArray<string>;
export declare function defaultTrustForRecord(record: Pick<InstalledPluginRecord, 'sourceKind'>): TrustTier;
export declare function defaultCapabilities(trust: TrustTier): string[];
export declare function requiredCapabilities(manifest: PluginManifest): string[];
export declare function resolveCapabilitiesGranted(args: {
    manifest: PluginManifest;
    trust: TrustTier;
}): string[];
export interface InvalidCapabilityIssue {
    capability: string;
    reason: 'unknown' | 'malformed';
}
export declare function validateCapabilityList(raw: unknown): {
    accepted: string[];
    rejected: InvalidCapabilityIssue[];
};
export declare function grantCapabilities(args: {
    db: import('better-sqlite3').Database;
    pluginId: string;
    capabilities: string[];
}): string[];
export declare function revokeCapabilities(args: {
    db: import('better-sqlite3').Database;
    pluginId: string;
    capabilities: string[];
}): string[];
