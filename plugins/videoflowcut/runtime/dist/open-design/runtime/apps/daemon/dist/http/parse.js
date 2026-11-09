import { createApiError } from '@open-design/contracts';
export function rawInput(req) {
    return {
        body: req.body,
        query: (req.query ?? {}),
        params: (req.params ?? {}),
    };
}
export function validationError(message, issues = []) {
    if (issues.length === 0) {
        return createApiError('BAD_REQUEST', message);
    }
    return createApiError('BAD_REQUEST', message, {
        details: { kind: 'validation', issues },
    });
}
//# sourceMappingURL=parse.js.map