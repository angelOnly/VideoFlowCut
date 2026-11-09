import { sendApiError } from './api-errors.js';
export function bearerTokenFromRequest(req) {
    const header = req.get('authorization');
    if (typeof header !== 'string')
        return undefined;
    const match = /^Bearer\s+(.+)$/i.exec(header.trim());
    return match?.[1];
}
export function createToolRequestAuth(registry) {
    function authorizeToolRequest(req, res, operation, options = {}) {
        const endpoint = options.endpoint ?? req.path;
        const validation = registry.validate(bearerTokenFromRequest(req), { endpoint, operation });
        if (!validation.ok) {
            const status = validation.code === 'TOOL_ENDPOINT_DENIED' || validation.code === 'TOOL_OPERATION_DENIED' ? 403 : 401;
            sendApiError(res, status, validation.code, validation.message, {
                details: { endpoint, operation },
            });
            return null;
        }
        return validation.grant;
    }
    function optionalToolGrantFromRequest(req, options = {}) {
        const validation = registry.validate(bearerTokenFromRequest(req), options);
        return validation.ok ? validation.grant : null;
    }
    return {
        authorizeToolRequest,
        optionalToolGrantFromRequest,
        requestProjectOverride,
        requestRunOverride,
    };
}
export function requestProjectOverride(projectId, tokenProjectId) {
    return typeof projectId === 'string' && projectId.length > 0 && projectId !== tokenProjectId;
}
export function requestRunOverride(runId, tokenRunId) {
    return typeof runId === 'string' && runId.length > 0 && runId !== tokenRunId;
}
//# sourceMappingURL=tool-request-auth.js.map