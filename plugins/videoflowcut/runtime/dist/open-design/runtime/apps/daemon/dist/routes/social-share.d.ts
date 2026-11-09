import type { Express } from 'express';
import type { RouteDeps } from '../server-context.js';
export interface RegisterSocialShareRoutesDeps extends RouteDeps<'http'> {
}
export declare function registerSocialShareRoutes(app: Express, ctx: RegisterSocialShareRoutesDeps): void;
