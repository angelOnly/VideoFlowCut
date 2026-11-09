import type { Request } from 'express';
import { anonymizeArtifactId as anonymizeArtifactIdShared, type AnalyticsClientType, type AnalyticsAttributionQuality, type AnalyticsConfigResponse, type AnalyticsDistributionMechanism, type AnalyticsEntrySurface, type AnalyticsHostProduct, type AnalyticsPublisherClass } from '@open-design/contracts/analytics';
import type { MediaStockTelemetryEvent } from '@open-design/contracts/analytics';
export interface AnalyticsContext {
    deviceId: string;
    sessionId: string;
    clientType: AnalyticsClientType;
    locale: string;
    requestId: string | null;
    entrySurface?: AnalyticsEntrySurface;
    hostProduct?: AnalyticsHostProduct;
    externalPluginId?: string;
    externalPluginVersion?: string;
    distributionMechanism?: AnalyticsDistributionMechanism;
    publisherClass?: AnalyticsPublisherClass;
    attributionQuality?: AnalyticsAttributionQuality;
    mcpSessionId?: string;
}
export declare function readAnalyticsContext(req: Request): AnalyticsContext | null;
export interface PosthogConfig {
    key: string;
    host: string;
    env: string;
}
export declare function readPosthogConfig(env?: NodeJS.ProcessEnv, packagedRuntime?: boolean): PosthogConfig | null;
/** One consented, bounded HTTP batch. A 2xx receipt is not indexing proof. */
export declare function captureStockAnalyticsBatch(args: {
    dataDir: string;
    events: readonly MediaStockTelemetryEvent[];
    sessionId: string;
    context?: (Pick<AnalyticsContext, 'deviceId' | 'sessionId'> & Partial<Pick<AnalyticsContext, 'clientType' | 'locale'>>) | null;
    appVersion: string;
    env?: NodeJS.ProcessEnv;
    fetch?: typeof fetch;
    signal?: AbortSignal;
}): Promise<'uploaded' | 'retry' | 'disabled'>;
export declare function readPublicConfigResponse(env?: NodeJS.ProcessEnv, packagedRuntime?: boolean): AnalyticsConfigResponse;
export type AnalyticsCaptureErrorType = 'not_configured' | 'metrics_consent_disabled' | 'config_read_failed' | 'enqueue_failed';
export interface AnalyticsCaptureResult {
    status: 'queued' | 'not_expected' | 'failed';
    acknowledgement: 'local_buffer' | 'none';
    errorType: AnalyticsCaptureErrorType | null;
}
export declare function normalizeAnalyticsCaptureResult(value: unknown): AnalyticsCaptureResult;
export interface AnalyticsService {
    capture(args: {
        eventName: string;
        context: AnalyticsContext;
        appVersion: string;
        properties: Record<string, unknown>;
        insertId: string;
    }): Promise<AnalyticsCaptureResult>;
    /**
     * Safety / reliability events (renderer crashes, daemon uncaught errors,
     * SSE health, etc.) that intentionally BYPASS the user's analytics
     * consent toggle. The product policy is: we always retain ground-truth
     * stability data even for opted-out users — the user-facing consent copy
     * in Settings → Privacy must call this out.
     *
     * Falls back to a synthetic distinctId when the installationId is not
     * yet stamped (first-launch or fork builds without an app-config file).
     *
     * Returns a Promise that resolves AFTER the event has been enqueued in
     * posthog-node's local buffer. Fire-and-forget callers (e.g. the
     * /api/observability/event endpoint) can `void` it; fatal-exit paths
     * MUST await before calling `shutdown()` so the crash event actually
     * makes it into the flush.
     */
    captureSafety(args: {
        eventName: string;
        distinctId?: string;
        appVersion: string;
        properties: Record<string, unknown>;
        insertId?: string;
    }): Promise<void>;
    mergeAnonymousPerson(args: {
        anonymousDistinctId: string;
        distinctId: string;
        properties?: Record<string, unknown>;
        insertId?: string;
    }): Promise<void>;
    identifyGroup(args: {
        context: AnalyticsContext;
        groupType: 'workspace';
        groupKey: string;
        properties: Record<string, unknown>;
    }): Promise<void>;
    shutdown(): Promise<void>;
}
export declare function createAnalyticsService(args: {
    env?: NodeJS.ProcessEnv;
    packagedRuntime?: boolean;
    dataDir: string;
}): AnalyticsService;
export declare const anonymizeArtifactId: typeof anonymizeArtifactIdShared;
export declare function newInsertId(): string;
