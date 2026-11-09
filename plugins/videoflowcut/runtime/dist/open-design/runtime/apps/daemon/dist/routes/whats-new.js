import { readCurrentAppVersionInfo } from '../app-version.js';
export function registerWhatsNewRoutes(app, ctx) {
    const { whatsNew } = ctx;
    app.get('/api/whats-new', async (_req, res) => {
        const versionInfo = await readCurrentAppVersionInfo();
        const result = await whatsNew.readWhatsNew(versionInfo.channel);
        const payload = {
            version: versionInfo.version,
            id: result.id,
            content: result.content,
        };
        res.json(payload);
    });
}
//# sourceMappingURL=whats-new.js.map