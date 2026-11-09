import fs from 'node:fs';
import path from 'node:path';
export function isStaticSpaFallbackRequest(req) {
    if (req.method !== 'GET' && req.method !== 'HEAD')
        return false;
    if (req.path === '/api' || req.path.startsWith('/api/'))
        return false;
    if (req.path === '/artifacts' || req.path.startsWith('/artifacts/'))
        return false;
    if (req.path === '/frames' || req.path.startsWith('/frames/'))
        return false;
    if (req.path === '/_next' || req.path.startsWith('/_next/'))
        return false;
    const accept = req.get?.('accept') ?? '';
    return accept.length === 0 || accept.includes('text/html') || accept.includes('*/*');
}
export function resolveStaticSpaFallbackPath(req, staticDir) {
    const indexPath = path.join(staticDir, 'index.html');
    if (!fs.existsSync(indexPath) || !isStaticSpaFallbackRequest(req))
        return null;
    return indexPath;
}
export function registerStaticSpaFallback(app, staticDir) {
    app.get('/*splat', (req, res, next) => {
        const indexPath = resolveStaticSpaFallbackPath(req, staticDir);
        if (indexPath == null)
            return next();
        res.sendFile('index.html', { root: staticDir });
    });
}
//# sourceMappingURL=static-spa.js.map