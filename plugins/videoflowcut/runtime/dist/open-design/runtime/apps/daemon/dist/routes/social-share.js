import { buildSocialSharePayload, normalizeSocialShareUrl, } from '@open-design/contracts';
export function registerSocialShareRoutes(app, ctx) {
    const { sendApiError } = ctx.http;
    app.post('/api/social-share', (req, res) => {
        const body = (req.body ?? {});
        const kind = body.kind === 'project-html' ? 'project-html' : 'open-design-repo';
        if (kind === 'project-html' && !normalizeSocialShareUrl(body.url)) {
            return sendApiError(res, 400, 'BAD_REQUEST', 'project-html social share requires an http(s) url');
        }
        res.json(buildSocialSharePayload({ ...body, kind }));
    });
}
//# sourceMappingURL=social-share.js.map