export declare const EVENT_SCHEMA_VERSION = 4;
export type AnalyticsClientType = 'web' | 'desktop' | 'external_mcp';
export type AnalyticsEntrySurface = 'open_design_ui' | 'od_cli' | 'external_mcp';
export type AnalyticsHostProduct = 'codex_desktop' | 'codex_cli' | 'codex_unknown' | 'claude_code' | 'unknown';
export type AnalyticsDistributionMechanism = 'git_marketplace' | 'local_repo' | 'manual' | 'unknown';
export type AnalyticsPublisherClass = 'open_design_first_party' | 'third_party' | 'unknown';
export type AnalyticsAttributionQuality = 'self_reported' | 'session_correlated';
export interface AnalyticsPublicParams {
    event_id: string;
    request_id?: string;
    event_schema_version: number;
    env: string;
    ui_version: string;
    session_id: string;
    device_id: string;
    user_id?: string;
    client_type: AnalyticsClientType;
    entry_surface?: AnalyticsEntrySurface;
    host_product?: AnalyticsHostProduct;
    external_plugin_id?: string;
    external_plugin_version?: string;
    distribution_mechanism?: AnalyticsDistributionMechanism;
    publisher_class?: AnalyticsPublisherClass;
    attribution_quality?: AnalyticsAttributionQuality;
    app_version: string;
    locale: string;
    app_session_id?: string | null;
    capture_source?: string;
    channel?: string;
    client_version?: string | null;
    platform?: string | null;
    os_version?: string | null;
    arch?: string | null;
    occurred_at?: string;
    reported_at?: string;
}
export type TrackingConfigureType = 'local_cli' | 'byok' | 'both' | 'amr' | 'none' | 'unknown';
export type TrackingConfigureAvailability = 'available' | 'unavailable' | 'unknown';
export type TrackingRuntimeType = 'amr_cloud' | 'byok' | 'local_cli' | 'none';
export interface AnalyticsConfigureGlobals {
    has_available_configure_cli: boolean;
    configure_type: TrackingConfigureType;
    configure_availability: TrackingConfigureAvailability;
    runtime_type: TrackingRuntimeType;
    cli_runnable: boolean;
    byok_runnable: boolean;
    amr_runnable: boolean;
}
export declare const ANALYTICS_HEADER_DEVICE_ID = "x-od-analytics-device-id";
export declare const ANALYTICS_HEADER_SESSION_ID = "x-od-analytics-session-id";
export declare const ANALYTICS_HEADER_CLIENT_TYPE = "x-od-analytics-client-type";
export declare const ANALYTICS_HEADER_LOCALE = "x-od-analytics-locale";
export declare const ANALYTICS_HEADER_REQUEST_ID = "x-od-analytics-request-id";
export declare const ANALYTICS_HEADER_ENTRY_SURFACE = "x-od-analytics-entry-surface";
export declare const ANALYTICS_HEADER_HOST_PRODUCT = "x-od-analytics-host-product";
export declare const ANALYTICS_HEADER_EXTERNAL_PLUGIN_ID = "x-od-analytics-external-plugin-id";
export declare const ANALYTICS_HEADER_EXTERNAL_PLUGIN_VERSION = "x-od-analytics-external-plugin-version";
export declare const ANALYTICS_HEADER_DISTRIBUTION_MECHANISM = "x-od-analytics-distribution-mechanism";
export declare const ANALYTICS_HEADER_PUBLISHER_CLASS = "x-od-analytics-publisher-class";
export declare const ANALYTICS_HEADER_ATTRIBUTION_QUALITY = "x-od-analytics-attribution-quality";
export declare const ANALYTICS_HEADER_MCP_SESSION_ID = "x-od-analytics-mcp-session-id";
export interface AnalyticsConfigResponse {
    enabled: boolean;
    env: string;
    key: string | null;
    host: string | null;
    installationId?: string | null;
}
//# sourceMappingURL=public-params.d.ts.map