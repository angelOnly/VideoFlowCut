export declare const OPEN_DESIGN_TELEMETRY_RELAY_URLS: {
    readonly test: 'https://telemetry-test.open-design.ai/api/langfuse';
    readonly prod: 'https://telemetry.open-design.ai/api/langfuse';
};
/**
 * Keep legacy test configurations working while moving the test Worker to its
 * environment-owned hostname. Production and custom relay URLs are unchanged.
 */
export declare function normalizeOpenDesignTelemetryRelayUrl(value: string): string;
