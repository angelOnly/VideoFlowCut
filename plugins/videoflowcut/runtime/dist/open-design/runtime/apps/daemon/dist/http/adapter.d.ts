import type { Express } from 'express';
import { type OriginContext } from './origin-guard.js';
import type { JsonRouteSpec } from './types.js';
export interface AdapterContext extends OriginContext {
}
/**
 * Identity function that pins a route spec's generic parameters at the
 * definition site so callers do not have to repeat them. The returned spec
 * is consumed by `mountJsonRoute` (live) and by tests (direct invocation of
 * `route.parse` / `route.handle`).
 */
export declare function defineJsonRoute<Input, Output, Deps>(spec: JsonRouteSpec<Input, Output, Deps>): JsonRouteSpec<Input, Output, Deps>;
/**
 * Mounts one JsonRouteSpec on an Express app. The Adapter is the only code
 * here that knows about req/res; the route's parse and handle functions
 * operate on `RouteInputContext` and `Deps` respectively, so they are unit
 * testable without Express.
 */
export declare function mountJsonRoute<Input, Output, Deps>(app: Express, spec: JsonRouteSpec<Input, Output, Deps>, deps: Deps, adapter: AdapterContext): void;
