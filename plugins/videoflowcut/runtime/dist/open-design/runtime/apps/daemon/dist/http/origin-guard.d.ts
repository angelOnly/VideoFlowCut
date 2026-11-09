import type { Request } from 'express';
import { type Result } from './types.js';
export interface OriginContext {
    resolvedPortRef: {
        current: number;
    };
}
/**
 * Adapter wrapper around `isLocalSameOrigin` that yields a `Result` so the
 * HTTP Adapter can fold the origin decision into the same error-handling
 * pipeline as parse/handle failures.
 */
export declare function guardSameOrigin(req: Request, origin: OriginContext): Result<void>;
