export function registerBrowserSessionRoutes(app, ctx) {
    const { db, browserSessions, authorizeProjectRequest } = ctx;
    const { getProject } = ctx.projectStore;
    const { sendApiError } = ctx.http;
    app.post('/api/projects/:id/browser-sessions', async (req, res) => {
        if (!getProject(db, req.params.id)) {
            return sendApiError(res, 404, 'PROJECT_NOT_FOUND', 'project not found');
        }
        if (!await authorizeProjectRequest(req, res, req.params.id, { mode: 'read' }))
            return;
        try {
            res.json({ browserSession: await browserSessions.create() });
        }
        catch (error) {
            sendApiError(res, 503, 'BROWSER_SESSION_START_FAILED', error instanceof Error ? error.message : String(error));
        }
    });
    app.delete('/api/projects/:id/browser-sessions/:sessionId', async (req, res) => {
        if (!getProject(db, req.params.id)) {
            return sendApiError(res, 404, 'PROJECT_NOT_FOUND', 'project not found');
        }
        if (!await authorizeProjectRequest(req, res, req.params.id, { mode: 'read' }))
            return;
        res.json({ closed: await browserSessions.close(req.params.sessionId) });
    });
}
//# sourceMappingURL=browser-sessions.js.map