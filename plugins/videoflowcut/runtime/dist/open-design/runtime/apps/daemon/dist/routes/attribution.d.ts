import { type Express, type Request } from 'express';
import { type AttributionClaimResponse, type AttributionClaimSource } from '@open-design/contracts';
import type { AnalyticsService } from '../analytics.js';
import type { AppConfigPrefs } from '../app-config.js';
type ReadAppConfig = (dataDir: string) => Promise<AppConfigPrefs>;
export interface AttributionService {
    claim(input: AttributionClaimInput): Promise<AttributionClaimResponse>;
    processPending(): Promise<AttributionClaimResponse | null>;
    bridgeUrl(url: string): Promise<string | null>;
}
export interface AttributionClaimInput {
    token?: string | null;
    source: AttributionClaimSource;
    rawUrl?: string | null;
    platform?: string | null;
}
export interface RegisterAttributionRoutesDeps {
    analytics: AnalyticsService;
    env?: NodeJS.ProcessEnv;
    http: {
        isLocalSameOrigin: (req: Request, port: number) => boolean;
        resolvedPortRef: {
            current: number;
        };
    };
    paths: {
        RUNTIME_DATA_DIR: string;
    };
    appConfig: {
        readAppConfig: ReadAppConfig;
    };
    now?: () => Date;
    fetchImpl?: typeof fetch;
}
export declare function createAttributionService(deps: Omit<RegisterAttributionRoutesDeps, 'http'>): AttributionService;
export declare function registerAttributionRoutes(app: Express, deps: RegisterAttributionRoutesDeps): AttributionService;
export {};
