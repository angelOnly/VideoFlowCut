import type { Express } from 'express';
import type { RouteDeps } from '../server-context.js';
import { type OpenDesignPublicMetadataService } from '../services/open-design-public-metadata.js';
export interface RegisterOpenDesignPublicMetadataRoutesDeps extends RouteDeps<'http'> {
    openDesignPublicMetadata: OpenDesignPublicMetadataService;
}
export declare function registerOpenDesignPublicMetadataRoutes(app: Express, ctx: RegisterOpenDesignPublicMetadataRoutesDeps): void;
