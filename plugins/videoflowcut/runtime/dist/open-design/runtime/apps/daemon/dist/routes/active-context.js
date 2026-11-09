import { createApiError } from '@open-design/contracts';
import { ACTIVE_CONTEXT_TTL_MS } from '../constants.js';
import { defineJsonRoute, err, mountJsonRoute, ok } from '../http/index.js';
function parsePostActive(raw) {
    const body = (raw.body ?? {});
    if (body.active === false) {
        return ok({ kind: 'clear' });
    }
    const projectId = typeof body.projectId === 'string' ? body.projectId : '';
    if (!projectId) {
        return err(createApiError('BAD_REQUEST', 'projectId is required'));
    }
    const fileName = typeof body.fileName === 'string' && body.fileName.length > 0 ? body.fileName : null;
    return ok({ kind: 'set', projectId, fileName });
}
function handlePostActive(input, deps) {
    if (input.kind === 'clear') {
        deps.store.current = null;
        return ok({ active: false });
    }
    const next = {
        projectId: input.projectId,
        fileName: input.fileName,
        ts: deps.now(),
    };
    deps.store.current = next;
    return ok({ active: true, ...next });
}
function handleGetActive(_input, deps) {
    const current = deps.store.current;
    if (!current || deps.now() - current.ts > ACTIVE_CONTEXT_TTL_MS) {
        deps.store.current = null;
        return ok({ active: false });
    }
    const project = deps.getProject(deps.db, current.projectId);
    return ok({
        active: true,
        projectId: current.projectId,
        projectName: project?.name ?? null,
        fileName: current.fileName,
        ts: current.ts,
        ageMs: deps.now() - current.ts,
    });
}
export const postActiveRoute = defineJsonRoute({
    method: 'post',
    path: '/api/active',
    requireSameOrigin: true,
    parse: parsePostActive,
    handle: handlePostActive,
});
export const getActiveRoute = defineJsonRoute({
    method: 'get',
    path: '/api/active',
    requireSameOrigin: true,
    parse: () => ok(undefined),
    handle: handleGetActive,
});
export function registerActiveContextRoutes(app, ctx) {
    const store = { current: null };
    const domainDeps = {
        store,
        db: ctx.db,
        getProject: ctx.projectStore.getProject,
        now: () => Date.now(),
    };
    const adapter = { resolvedPortRef: ctx.http.resolvedPortRef };
    mountJsonRoute(app, postActiveRoute, domainDeps, adapter);
    mountJsonRoute(app, getActiveRoute, domainDeps, adapter);
}
//# sourceMappingURL=active-context.js.map