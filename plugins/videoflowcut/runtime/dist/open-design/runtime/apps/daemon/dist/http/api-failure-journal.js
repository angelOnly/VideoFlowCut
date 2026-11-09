import { recordDiagnosticFailure } from '../services/diagnostics-evidence.js';
const MAX_RECENT_API_FAILURES = 100;
const failures = [];
const listeners = new Set();
export function observeApiFailures(listener) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
}
function diagnosticRouteTemplate(request) {
    const routePath = request?.route?.path;
    if (typeof routePath !== 'string' || routePath.length === 0) {
        return '/api/:unmatched';
    }
    const normalizedRoutePath = routePath.startsWith('/') ? routePath : `/${routePath}`;
    if (normalizedRoutePath === '/api' || normalizedRoutePath.startsWith('/api/')) {
        return normalizedRoutePath;
    }
    // A mounted router's concrete baseUrl can contain user-controlled values.
    // Keep its declared child route but replace the mount point with a marker.
    return `/api/:mounted${normalizedRoutePath}`;
}
export function recordApiFailure(failure) {
    const { request, ...metadata } = failure;
    recordDiagnosticFailure({ source: 'local-api', operation: diagnosticRouteTemplate(request), status: failure.status, requestId: failure.requestId });
    const entry = {
        ...metadata,
        method: request?.method?.toUpperCase() ?? 'UNKNOWN',
        path: diagnosticRouteTemplate(request),
    };
    failures.push(entry);
    for (const listener of listeners) {
        try {
            listener({ ...entry });
        }
        catch { /* diagnostics cannot break API errors */ }
    }
    if (failures.length > MAX_RECENT_API_FAILURES) {
        failures.splice(0, failures.length - MAX_RECENT_API_FAILURES);
    }
}
export function readRecentApiFailures() {
    return failures.map((failure) => ({ ...failure }));
}
/** Test-only reset for this process-local diagnostic journal. */
export function clearRecentApiFailures() {
    failures.length = 0;
}
//# sourceMappingURL=api-failure-journal.js.map