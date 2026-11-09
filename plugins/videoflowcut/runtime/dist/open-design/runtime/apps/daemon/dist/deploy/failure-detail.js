import { normalizeUpstreamCode, normalizeUpstreamStatus, } from '@open-design/contracts';
const NETWORK_ERROR_CODES = new Set([
    'ECONNREFUSED', 'ECONNRESET', 'ENOTFOUND', 'EAI_AGAIN', 'ETIMEDOUT',
    'EHOSTUNREACH', 'ENETUNREACH', 'EPIPE',
]);
function asShape(value) {
    return typeof value === 'object' && value !== null ? value : null;
}
/** Provider error code from a Vercel (`error.code`) or Cloudflare (`errors[0].code`) body. */
function providerErrorCode(details) {
    const body = asShape(details);
    return normalizeUpstreamCode(body?.error?.code)
        ?? normalizeUpstreamCode(Array.isArray(body?.errors) ? body.errors[0]?.code : undefined);
}
function isVercelTokenRejection(details) {
    const error = asShape(details)?.error;
    return error?.invalidToken === true || error?.missingToken === true;
}
function isNetworkFailure(err) {
    if (err.name === 'AbortError' || err.name === 'TimeoutError')
        return true;
    const code = typeof err.code === 'string' ? err.code : '';
    if (NETWORK_ERROR_CODES.has(code) || code.startsWith('UND_ERR'))
        return true;
    const cause = asShape(err.cause);
    if (cause && cause !== err && isNetworkFailure(cause))
        return true;
    return err.name === 'TypeError' && err.message === 'fetch failed';
}
/**
 * Classify a failed `POST /api/projects/:id/deploy` into closed tokens.
 *
 * Only observational: the route keeps answering with the same status and
 * error code it always did. This adds what that code cannot say — whether a
 * generic failure was the provider rejecting the request (and with which
 * status/code), the provider being unreachable, a local file problem, or a
 * rejected token hiding behind PROVIDER_FORBIDDEN.
 */
export function classifyDeployFailure(stage, error, isDeployError) {
    const err = asShape(error);
    if (!err)
        return { stage, reason: 'internal' };
    if (isDeployError) {
        const upstreamStatus = normalizeUpstreamStatus(err.status);
        const upstreamCode = providerErrorCode(err.details);
        const upstream = {
            ...(upstreamStatus !== undefined ? { upstreamStatus } : {}),
            ...(upstreamCode !== undefined ? { upstreamCode } : {}),
        };
        if (isVercelTokenRejection(err.details))
            return { stage, reason: 'provider_token_invalid', ...upstream };
        // A coded DeployError's status is the daemon's own choice, not the provider's.
        if (typeof err.code === 'string' && err.code) {
            return { stage, reason: 'coded', ...(upstreamCode !== undefined ? { upstreamCode } : {}) };
        }
        return { stage, reason: 'provider_rejected', ...upstream };
    }
    if (isNetworkFailure(err))
        return { stage, reason: 'provider_unreachable' };
    if (typeof err.syscall === 'string' && typeof err.code === 'string')
        return { stage, reason: 'local_file' };
    return { stage, reason: 'internal' };
}
//# sourceMappingURL=failure-detail.js.map