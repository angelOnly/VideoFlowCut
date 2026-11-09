import type { Express } from 'express';
import type { RouteDeps } from './server-context.js';
export interface RegisterMcpRoutesDeps extends RouteDeps<'http' | 'paths' | 'mcp'> {
}
export declare function registerMcpRoutes(app: Express, ctx: RegisterMcpRoutesDeps): void;
