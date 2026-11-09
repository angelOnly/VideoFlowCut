import { createApiError } from '@open-design/contracts';
import { isLocalSameOrigin } from '../origin-validation.js';
import { err, ok } from './types.js';
/**
 * Adapter wrapper around `isLocalSameOrigin` that yields a `Result` so the
 * HTTP Adapter can fold the origin decision into the same error-handling
 * pipeline as parse/handle failures.
 */
export function guardSameOrigin(req, origin) {
    if (isLocalSameOrigin(req, origin.resolvedPortRef.current)) {
        return ok(undefined);
    }
    return err(createApiError('FORBIDDEN', 'cross-origin request rejected'));
}
//# sourceMappingURL=origin-guard.js.map