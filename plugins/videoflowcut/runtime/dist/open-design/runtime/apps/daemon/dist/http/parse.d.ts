import type { Request } from 'express';
import { type ApiError } from '@open-design/contracts';
import type { RouteInputContext } from './types.js';
export declare function rawInput(req: Request): RouteInputContext;
export declare function validationError(message: string, issues?: Array<{
    path: string;
    message: string;
}>): ApiError;
