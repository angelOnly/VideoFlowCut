import type { Express } from 'express';
import type { RouteDeps } from '../server-context.js';
export interface RegisterMemoryRoutesDeps extends RouteDeps<'http' | 'paths' | 'appConfig'> {
}
export declare function registerMemoryRoutes(app: Express, ctx: RegisterMemoryRoutesDeps): void;
