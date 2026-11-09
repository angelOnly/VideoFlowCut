import { createApiErrorResponse } from '@open-design/contracts';
export function sendJson(res, status, body) {
    res.status(status).json(body);
}
export function sendApiError(res, status, error) {
    res.status(status).json(createApiErrorResponse(error));
}
const ERROR_STATUS_BY_CODE = {
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    PAYLOAD_TOO_LARGE: 413,
    UNSUPPORTED_MEDIA_TYPE: 415,
    VALIDATION_FAILED: 422,
    RATE_LIMITED: 429,
    PROJECT_NOT_FOUND: 404,
    FILE_NOT_FOUND: 404,
    ARTIFACT_NOT_FOUND: 404,
    INTERNAL_ERROR: 500,
    AGENT_UNAVAILABLE: 503,
    UPSTREAM_UNAVAILABLE: 502,
};
export function statusForError(error) {
    return ERROR_STATUS_BY_CODE[error.code] ?? 500;
}
//# sourceMappingURL=response.js.map