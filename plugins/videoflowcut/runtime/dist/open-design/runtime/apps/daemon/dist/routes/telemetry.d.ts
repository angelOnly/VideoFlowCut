import { type Express } from 'express';
import { type McpAnalyticsEventRequest, type McpAnalyticsContextResponse, type ClientExperienceDiagnostic } from '@open-design/contracts/analytics';
import { createAnalyticsService } from '../analytics.js';
import type { AnalyticsContext } from '../analytics.js';
import { type readAppConfig, type writeAppConfig } from '../app-config.js';
import { reportRunFeedbackFromDaemon } from '../langfuse-bridge.js';
export interface DaemonTelemetry {
    analyticsService: ReturnType<typeof createAnalyticsService>;
    disposeFatalHandlers: () => void;
    flushStockTelemetry: () => Promise<void>;
    getCachedAppVersion: () => any;
    resolveAppVersion: () => Promise<any>;
    reportFeedback: (req: {
        runId: string;
        traceId?: string;
        rating: 'positive' | 'negative';
        reasonCodes: string[];
        hasCustomReason: boolean;
        customReason: string;
        scoreMetadata?: Record<string, unknown>;
    }) => ReturnType<typeof reportRunFeedbackFromDaemon>;
}
export interface RegisterTelemetryRoutesDeps {
    dataDir: string;
    namespace?: string;
    readAppConfig: typeof readAppConfig;
    writeAppConfig: typeof writeAppConfig;
    onClientExperience?: (evidence: ClientExperienceDiagnostic) => string | null;
    onHostFault?: (event: string, properties: Record<string, unknown>) => string | null;
}
export declare function acceptClientExperienceDiagnostic(deps: RegisterTelemetryRoutesDeps, value: unknown): Promise<{
    ok: false;
} | {
    ok: true;
    accepted: boolean;
    retryable?: true;
}>;
export declare function resolveInstallerObservationNamespace(namespace: string | undefined): string;
export declare function resolveMcpAnalyticsContext(deps: RegisterTelemetryRoutesDeps): Promise<McpAnalyticsContextResponse>;
/**
 * Treat analytics headers as correlation hints, never as identity authority.
 * The accepted device id must be the installation id currently stored under
 * the daemon's resolved data root, and metrics consent must still be enabled.
 */
export declare function resolveTrustedMcpEventContext(deps: RegisterTelemetryRoutesDeps, context: AnalyticsContext | null): Promise<AnalyticsContext | null>;
export declare function registerTelemetryRoutes(app: Express, deps: RegisterTelemetryRoutesDeps): DaemonTelemetry;
export declare function validateMcpAnalyticsEventProperties(event: McpAnalyticsEventRequest['event'], raw: unknown): Record<string, string | number | boolean>;
export declare function sanitizeMcpAnalyticsProperties(raw: unknown): Record<string, string | number | boolean>;
