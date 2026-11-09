import type { AnalyticsAttributionQuality, AnalyticsDistributionMechanism, AnalyticsEntrySurface, AnalyticsHostProduct, AnalyticsPublisherClass } from '@open-design/contracts/analytics';
export declare const OPEN_DESIGN_PLUGIN_ID = "open-design";
export declare const PLUGIN_TELEMETRY_SCHEMA_VERSION = 3;
export interface ExternalPluginContext {
    id: typeof OPEN_DESIGN_PLUGIN_ID;
    version: string;
    distributionMechanism: AnalyticsDistributionMechanism;
    publisherClass: AnalyticsPublisherClass;
}
export interface ExternalPluginRunAnalyticsHints {
    entrySurface: AnalyticsEntrySurface;
    hostProduct: AnalyticsHostProduct;
    externalPluginId: typeof OPEN_DESIGN_PLUGIN_ID;
    externalPluginVersion: string;
    distributionMechanism: AnalyticsDistributionMechanism;
    publisherClass: AnalyticsPublisherClass;
    attributionQuality: AnalyticsAttributionQuality;
    pluginWorkflowId: string;
    logicalRequestDigest: string;
    logicalRequestDigestVersion: 1;
    briefState: 'confirmed' | 'skipped' | 'not_applicable';
}
interface PluginAnalyticsContextLike {
    deviceId?: unknown;
    sessionId?: unknown;
    clientType?: unknown;
    locale?: unknown;
    requestId?: unknown;
    entrySurface?: unknown;
    hostProduct?: unknown;
    externalPluginId?: unknown;
    externalPluginVersion?: unknown;
    distributionMechanism?: unknown;
    publisherClass?: unknown;
    attributionQuality?: unknown;
    mcpSessionId?: unknown;
}
export declare function pluginContractError(message: string): Error;
export declare function validateExternalPluginContext(value: unknown): ExternalPluginContext;
export declare function validatePluginWorkflowId(value: unknown): string;
export declare function validatePluginRequestId(value: unknown): string;
export declare function mapMcpHostProduct(clientInfo: {
    name?: unknown;
    version?: unknown;
} | null | undefined): AnalyticsHostProduct;
export declare function logicalPluginRequestDigest(requestId: string): {
    version: 1;
    digest: string;
};
export declare function normalizeExternalPluginRunAnalyticsHints(value: unknown, input: {
    clientRequestId: unknown;
    analyticsContext: PluginAnalyticsContextLike | null | undefined;
}): ExternalPluginRunAnalyticsHints;
export declare function resolvePluginGenerationSloWindowMs(input: {
    inactivityTimeoutMs: number;
    configuredValue?: string | undefined;
}): number;
export {};
