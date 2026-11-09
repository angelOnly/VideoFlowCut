import { createApiError } from '@open-design/contracts';
import { rawInput } from './parse.js';
import { sendApiError, sendJson, statusForError } from './response.js';
import { guardSameOrigin } from './origin-guard.js';
/**
 * Identity function that pins a route spec's generic parameters at the
 * definition site so callers do not have to repeat them. The returned spec
 * is consumed by `mountJsonRoute` (live) and by tests (direct invocation of
 * `route.parse` / `route.handle`).
 */
export function defineJsonRoute(spec) {
    return spec;
}
/**
 * Mounts one JsonRouteSpec on an Express app. The Adapter is the only code
 * here that knows about req/res; the route's parse and handle functions
 * operate on `RouteInputContext` and `Deps` respectively, so they are unit
 * testable without Express.
 */
export function mountJsonRoute(app, spec, deps, adapter) {
    app[spec.method](spec.path, async (req, res) => {
        try {
            if (spec.requireSameOrigin) {
                const origin = guardSameOrigin(req, adapter);
                if (!origin.ok) {
                    sendApiError(res, statusForError(origin.error), origin.error);
                    return;
                }
            }
            const parsed = spec.parse(rawInput(req));
            if (!parsed.ok) {
                sendApiError(res, statusForError(parsed.error), parsed.error);
                return;
            }
            const result = await spec.handle(parsed.value, deps);
            if (!result.ok) {
                sendApiError(res, statusForError(result.error), result.error);
                return;
            }
            sendJson(res, spec.successStatus ?? 200, result.value);
        }
        catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            sendApiError(res, 500, createApiError('INTERNAL_ERROR', message));
        }
    });
}
//# sourceMappingURL=adapter.js.map