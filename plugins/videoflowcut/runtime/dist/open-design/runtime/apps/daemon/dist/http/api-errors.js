import { recordApiFailure } from './api-failure-journal.js';
export function createCompatApiError(code, message, init = {}) {
    return { code, message, ...init };
}
export function createCompatApiErrorResponse(code, message, init = {}) {
    return { error: createCompatApiError(code, message, init) };
}
export function sendApiError(res, status, code, message, init = {}) {
    const request = res.req;
    recordApiFailure({
        at: new Date().toISOString(),
        request,
        status,
        code,
        retryable: init.retryable === true,
        ...(init.requestId ? { requestId: init.requestId } : {}),
    });
    return res
        .status(status)
        .json(createCompatApiErrorResponse(code, message, init));
}
//# sourceMappingURL=api-errors.js.map