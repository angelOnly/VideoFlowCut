import { TeamResourceAuthorityUnavailableError, TeamResourceShareForbiddenError, } from '../collab/team-resource-share.js';
/**
 * Team resource sharing routes for one resource kind. A member promotes a
 * personal resource into the team scope; the share service packs its directory
 * and pushes it to the resource hub so teammates can pull it. Every route first
 * verifies the request's explicit Workspace/member selector against the
 * authoritative directory. A verified request still returns `shared: false`
 * when the hub transport is not configured. Mounted once per kind (design
 * systems, plugins, skills).
 */
export function registerTeamResourceShareRoutes(app, deps) {
    const { basePath, share } = deps;
    const root = `/api/workspace/${basePath}`;
    // The mutation itself already succeeded by the time this runs — a cache seam
    // failing here must not turn a successful share/unshare into a reported
    // failure, so this is best-effort and swallows its own errors.
    function invalidateListTeam(scope) {
        try {
            deps.listTeam?.invalidate?.(scope);
        }
        catch {
            // ignore
        }
    }
    async function resolveScope(req, res) {
        let resolution;
        try {
            resolution = await deps.resolveScope(req);
        }
        catch {
            res.status(503).json({
                error: 'WORKSPACE_AUTHORITY_UNAVAILABLE',
                message: 'workspace membership authority is temporarily unavailable',
                retryable: true,
            });
            return null;
        }
        if (resolution.ok)
            return resolution.scope;
        res.status(resolution.status).json({
            error: resolution.code,
            message: resolution.message,
            ...(resolution.retryable ? { retryable: true } : {}),
        });
        return null;
    }
    // Ids shared to the team — drives the "team" collection for this kind.
    app.get(`${root}/team`, async (req, res) => {
        const scope = await resolveScope(req, res);
        if (!scope)
            return;
        if (deps.listTeam) {
            res.json(await deps.listTeam(scope));
            return;
        }
        const resources = await share.sharedResources(scope);
        if (deps.syncSharedResource) {
            await Promise.all(resources.map((resource) => deps.syncSharedResource?.(resource, scope)));
        }
        res.json({ ids: resources.map((resource) => resource.id), resources });
    });
    // Share a personal resource to the team.
    app.post(`${root}/:id/share`, async (req, res) => {
        const id = typeof req.params.id === 'string' ? decodeURIComponent(req.params.id) : '';
        if (!id)
            return res.status(400).json({ error: 'invalid resource id' });
        const scope = await resolveScope(req, res);
        if (!scope)
            return;
        try {
            if (deps.authorizeShare && !await deps.authorizeShare(id, scope)) {
                return res.status(403).json({ error: 'WORKSPACE_RESOURCE_SHARE_DENIED' });
            }
            const result = await share.share(id, scope);
            if (!result)
                return res.json({ shared: false });
            // The cached `/team` listing is now stale by construction — drop it so
            // the client's immediate refetch (it fires one right after this
            // response) reads the new state instead of waiting out the cache's
            // freshMs, or worse, the client's slower background poll once SSE
            // lowers its cadence.
            invalidateListTeam(scope);
            deps.onMutationCommitted?.(id, scope, 'team');
            res.json({ shared: true, version: result.version });
        }
        catch (error) {
            if (error instanceof TeamResourceShareForbiddenError) {
                return res.status(403).json({ error: 'WORKSPACE_RESOURCE_SHARE_DENIED' });
            }
            res.status(500).json({ error: error instanceof Error ? error.message : 'share failed' });
        }
    });
    // Remove a resource from the team index. Vela remains the permission source of
    // truth: only the resource owner can edit/remove the shared resource.
    app.delete(`${root}/:id/share`, async (req, res) => {
        const id = typeof req.params.id === 'string' ? decodeURIComponent(req.params.id) : '';
        if (!id)
            return res.status(400).json({ error: 'invalid resource id' });
        const scope = await resolveScope(req, res);
        if (!scope)
            return;
        try {
            const unshared = await share.unshare(id, scope);
            if (unshared) {
                invalidateListTeam(scope);
                deps.onMutationCommitted?.(id, scope, 'personal');
            }
            res.json({ unshared });
        }
        catch (error) {
            if (error instanceof TeamResourceShareForbiddenError) {
                return res.status(403).json({ error: 'WORKSPACE_RESOURCE_UNSHARE_DENIED' });
            }
            if (error instanceof TeamResourceAuthorityUnavailableError) {
                return res.status(503).json({
                    error: error.code,
                    message: error.message,
                    retryable: true,
                });
            }
            res.status(500).json({ error: error instanceof Error ? error.message : 'unshare failed' });
        }
    });
}
//# sourceMappingURL=team-resource-share.js.map