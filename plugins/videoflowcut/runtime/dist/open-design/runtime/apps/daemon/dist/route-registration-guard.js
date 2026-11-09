const routeInventorySymbol = Symbol.for('open-design.routeInventory');
const guardedRouteKeys = new Set([
    'POST /api/projects/:id/export/pdf',
    'POST /api/projects/:id/media/generate',
]);
const guardedMethods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'all', 'use'];
export function guardedRouteKey(method, path) {
    if (typeof path !== 'string')
        return null;
    const key = `${method.toUpperCase()} ${path}`;
    return guardedRouteKeys.has(key) ? key : null;
}
export function installRouteRegistrationGuard(app) {
    const seen = new Set();
    const inventory = [];
    app[routeInventorySymbol] = inventory;
    for (const method of guardedMethods) {
        const original = app[method].bind(app);
        app[method] = (path, ...handlers) => {
            if (typeof path === 'string') {
                inventory.push({ method: method.toUpperCase(), path });
            }
            const key = guardedRouteKey(method, path);
            if (key) {
                if (seen.has(key)) {
                    throw new Error(`duplicate guarded route registration: ${key}`);
                }
                seen.add(key);
            }
            return original(path, ...handlers);
        };
    }
}
export function getRouteRegistrationInventory(app) {
    return [
        ...(app[routeInventorySymbol] ?? []),
    ];
}
//# sourceMappingURL=route-registration-guard.js.map